import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import {
  createInitialGameState,
  EMOTE_OPTIONS,
  EMPTY_INPUT,
  stepGameState,
  syncPlayerControlRoles,
  type GameState,
  type PlayerInput,
  type Team,
  type TeamSize,
} from './src/shared/gameEngine.ts';

import {
  calculateRankedExpDelta,
  getRankInfo,
} from './src/shared/ranks.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);

interface ClientSession {
  ws: WebSocket;
  id: string;
  name: string;
  exp: number;
  roomCode: string | null;
  playerSlot: string | null;
}

interface OnlineRoom {
  code: string;
  teamSize: TeamSize;
  isRanked: boolean;
  hostId: string;
  slots: Map<string, ClientSession>;
  state: GameState | null;
  inputs: Record<string, PlayerInput>;
  latches: Record<string, { shoot: boolean; dribble: boolean; pass: boolean }>;
  intervalId: NodeJS.Timeout | null;
  lastStepAt: number;
}

const rooms = new Map<string, OnlineRoom>();
type QueueKey = `${TeamSize}-${'casual' | 'ranked'}`;
const quickMatchQueues: Record<QueueKey, ClientSession | null> = {
  '1-casual': null,
  '2-casual': null,
  '4-casual': null,
  '8-casual': null,
  '1-ranked': null,
  '2-ranked': null,
  '4-ranked': null,
  '8-ranked': null,
};
let clientSeq = 1;

function getTeamSlots(team: Team, teamSize: TeamSize): string[] {
  const slots: string[] = [];
  for (let i = 1; i <= teamSize; i++) {
    slots.push(`${team}-${i}`);
  }
  return slots;
}

function getAllSlots(teamSize: TeamSize): string[] {
  const slots: string[] = [];
  for (let i = 1; i <= teamSize; i++) {
    slots.push(`blue-${i}`, `red-${i}`);
  }
  return slots;
}

function findNextBalancedSlot(room: OnlineRoom): string | null {
  const blueSlots = getTeamSlots('blue', room.teamSize);
  const redSlots = getTeamSlots('red', room.teamSize);
  const blueCount = blueSlots.filter((s) => room.slots.has(s)).length;
  const redCount = redSlots.filter((s) => room.slots.has(s)).length;

  const firstOrder = blueCount <= redCount ? [...blueSlots, ...redSlots] : [...redSlots, ...blueSlots];
  for (const s of firstOrder) {
    if (!room.slots.has(s)) return s;
  }
  return null;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function sendJson(ws: WebSocket, payload: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastLobby(room: OnlineRoom): void {
  const blueSlots = getTeamSlots('blue', room.teamSize);
  const redSlots = getTeamSlots('red', room.teamSize);

  const bluePlayers = blueSlots.map((slot) => {
    const c = room.slots.get(slot);
    return {
      slot,
      name: c ? c.name : 'IA Parceira',
      isAI: !c,
      exp: c ? c.exp : 0,
      rankId: c ? getRankInfo(c.exp).tier.id : 'bronze',
    };
  });
  const redPlayers = redSlots.map((slot) => {
    const c = room.slots.get(slot);
    return {
      slot,
      name: c ? c.name : 'IA Rival',
      isAI: !c,
      exp: c ? c.exp : 0,
      rankId: c ? getRankInfo(c.exp).tier.id : 'bronze',
    };
  });

  const hostClient = Array.from(room.slots.values()).find((c) => c.id === room.hostId);
  const humanCount = room.slots.size;

  for (const [slot, client] of room.slots.entries()) {
    const yourTeam: Team = slot.startsWith('blue') ? 'blue' : 'red';
    sendJson(client.ws, {
      type: 'lobby_update',
      roomCode: room.code,
      teamSize: room.teamSize,
      isRanked: room.isRanked,
      hostName: hostClient?.name ?? 'Anfitrião',
      isHost: client.id === room.hostId,
      yourSlot: slot,
      yourTeam,
      bluePlayers,
      redPlayers,
      humanCount,
      maxHumans: room.teamSize * 2,
      isReady: humanCount >= 2,
    });
  }
}

function stopRoomLoop(room: OnlineRoom): void {
  if (room.intervalId) {
    clearInterval(room.intervalId);
    room.intervalId = null;
  }
}

function startRoomMatch(room: OnlineRoom): void {
  if (room.slots.size < 2) return;
  stopRoomLoop(room);

  room.inputs = {};
  room.latches = {};
  const slotNames: Record<string, string> = {};
  const humanSlots: string[] = [];

  for (const slot of getAllSlots(room.teamSize)) {
    room.inputs[slot] = { ...EMPTY_INPUT };
    room.latches[slot] = { shoot: false, dribble: false, pass: false };
    const occupant = room.slots.get(slot);
    if (occupant) {
      humanSlots.push(slot);
      slotNames[slot] = occupant.name;
    }
  }

  room.state = createInitialGameState({
    mode: 'online',
    teamSize: room.teamSize,
    slotNames,
    humanSlots,
  });
  room.lastStepAt = Date.now();

  for (const [slot, client] of room.slots.entries()) {
    sendJson(client.ws, {
      type: 'match_started',
      roomCode: room.code,
      isRanked: room.isRanked,
      yourSlot: slot,
      state: room.state,
    });
  }

  let broadcastDivider = 0;
  room.intervalId = setInterval(() => {
    if (!room.state) return;
    const now = Date.now();
    const dt = Math.min((now - room.lastStepAt) / 1000, 0.05);
    room.lastStepAt = now;

    const frameInputs: Record<string, PlayerInput> = {};
    for (const slot of room.state.humanSlots) {
      const base = room.inputs[slot] ?? EMPTY_INPUT;
      const latch = room.latches[slot] ?? { shoot: false, dribble: false, pass: false };
      frameInputs[slot] = {
        moveX: base.moveX,
        moveY: base.moveY,
        shoot: base.shoot || latch.shoot,
        dribble: base.dribble || latch.dribble,
        pass: base.pass || latch.pass,
        sprint: base.sprint,
      };
      latch.shoot = false;
      latch.dribble = false;
      latch.pass = false;
    }

    const prevPhase = room.state.phase;
    stepGameState(room.state, frameInputs, dt);

    broadcastDivider += 1;
    const hasImportantChange =
      room.state.events.length > 0 || room.state.phase !== prevPhase;

    if (broadcastDivider >= 2 || hasImportantChange) {
      broadcastDivider = 0;
      const packet = {
        type: 'game_state',
        state: room.state,
      };
      for (const client of room.slots.values()) {
        sendJson(client.ws, packet);
      }
    }

    if (room.state.phase === 'FINISHED') {
      if (room.isRanked) {
        const blueScore = room.state.score.blue;
        const redScore = room.state.score.red;
        const winner = room.state.winner;
        for (const [slot, client] of room.slots.entries()) {
          const team: Team = slot.startsWith('red') ? 'red' : 'blue';
          const result: 'win' | 'loss' | 'draw' =
            winner === 'draw' || winner === null
              ? 'draw'
              : winner === team
              ? 'win'
              : 'loss';
          const goalsFor = team === 'blue' ? blueScore : redScore;
          const goalsAgainst = team === 'blue' ? redScore : blueScore;
          const outcome = calculateRankedExpDelta(
            result,
            goalsFor,
            goalsAgainst,
            client.exp
          );
          client.exp = outcome.nextExp;
          sendJson(client.ws, {
            type: 'ranked_result',
            yourSlot: slot,
            teamSize: room.teamSize,
            result,
            blueScore,
            redScore,
            expDelta: outcome.expDelta,
            nextExp: outcome.nextExp,
            prevRankId: outcome.prevRank.id,
            nextRankId: outcome.nextRank.id,
            promoted: outcome.promoted,
          });
        }
      }
      stopRoomLoop(room);
    }
  }, 1000 / 60);
}

function clearClientFromQueues(client: ClientSession): void {
  for (const key of Object.keys(quickMatchQueues) as QueueKey[]) {
    if (quickMatchQueues[key]?.id === client.id) {
      quickMatchQueues[key] = null;
    }
  }
}

function leaveRoom(client: ClientSession): void {
  clearClientFromQueues(client);

  if (!client.roomCode) return;
  const room = rooms.get(client.roomCode);
  const oldSlot = client.playerSlot;
  client.roomCode = null;
  client.playerSlot = null;

  if (!room) return;
  if (oldSlot) {
    room.slots.delete(oldSlot);
  }

  if (room.slots.size === 0) {
    stopRoomLoop(room);
    rooms.delete(room.code);
    return;
  }

  // Promote a new host if the host left
  if (room.hostId === client.id) {
    const nextHost = room.slots.values().next().value;
    if (nextHost) {
      room.hostId = nextHost.id;
    }
  }

  // If a match was running and fewer than 2 humans remain, return to lobby
  if (room.state && room.slots.size < 2) {
    stopRoomLoop(room);
    room.state = null;
    for (const c of room.slots.values()) {
      sendJson(c.ws, {
        type: 'opponent_left',
        message: 'Um jogador saiu da partida.',
      });
    }
  } else if (room.state && oldSlot) {
    // Convert departed player's slot to AI mid-match so remaining players can finish!
    room.state.humanSlots = room.state.humanSlots.filter((s) => s !== oldSlot);
    delete room.state.controlMap[oldSlot];
    const p = room.state.players.find((pl) => pl.id === oldSlot);
    if (p) {
      p.name = `${p.name} (IA)`;
    }
    syncPlayerControlRoles(room.state);
  }

  broadcastLobby(room);
}

function parseTeamSize(val: unknown): TeamSize {
  if (val === 8) return 8;
  if (val === 4) return 4;
  if (val === 2) return 2;
  return 1;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, activeRooms: rooms.size });
  });

  const server = http.createServer(app);

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        ws: {
          server,
          path: '/vite-hmr',
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const reqUrl = req.url || '';
    if (reqUrl === '/ws' || reqUrl.startsWith('/ws?')) {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    }
  });

  wss.on('connection', (ws) => {
    const client: ClientSession = {
      ws,
      id: `c-${clientSeq++}`,
      name: `Jogador ${clientSeq}`,
      exp: 0,
      roomCode: null,
      playerSlot: null,
    };

    sendJson(ws, { type: 'connected', clientId: client.id });

    ws.on('message', (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw.toString()) as Record<string, unknown>;
      } catch {
        return;
      }

      const type = String(msg.type || '');
      if (typeof msg.name === 'string' && msg.name.trim().length > 0) {
        client.name = msg.name.trim().slice(0, 16);
      }
      if (typeof msg.exp === 'number' && Number.isFinite(msg.exp) && msg.exp >= 0) {
        client.exp = Math.min(1000000, Math.floor(msg.exp));
      }

      if (type === 'create_room') {
        leaveRoom(client);
        const teamSize = parseTeamSize(msg.teamSize);
        const isRanked = Boolean(msg.isRanked);
        const code = generateRoomCode();
        const room: OnlineRoom = {
          code,
          teamSize,
          isRanked,
          hostId: client.id,
          slots: new Map([['blue-1', client]]),
          state: null,
          inputs: {},
          latches: {},
          intervalId: null,
          lastStepAt: Date.now(),
        };
        client.roomCode = code;
        client.playerSlot = 'blue-1';
        rooms.set(code, room);
        broadcastLobby(room);
        return;
      }

      if (type === 'join_room') {
        leaveRoom(client);
        const code = String(msg.roomCode || '')
          .trim()
          .toUpperCase();
        const room = rooms.get(code);
        if (!room) {
          sendJson(ws, {
            type: 'error',
            message: 'Sala não encontrada. Verifique o código digitado.',
          });
          return;
        }
        const nextSlot = findNextBalancedSlot(room);
        if (!nextSlot) {
          sendJson(ws, {
            type: 'error',
            message: 'Esta sala já está lotada.',
          });
          return;
        }
        room.slots.set(nextSlot, client);
        client.roomCode = code;
        client.playerSlot = nextSlot;
        broadcastLobby(room);
        return;
      }

      if (type === 'switch_team') {
        if (!client.roomCode || !client.playerSlot) return;
        const room = rooms.get(client.roomCode);
        if (!room || room.state) return;

        const targetTeam: Team = client.playerSlot.startsWith('blue') ? 'red' : 'blue';
        const targetSlots = getTeamSlots(targetTeam, room.teamSize);
        const openSlot = targetSlots.find((s) => !room.slots.has(s));
        if (!openSlot) {
          sendJson(ws, {
            type: 'error',
            message: `O ${targetTeam === 'blue' ? 'Time Azul' : 'Time Vermelho'} já está completo.`,
          });
          return;
        }
        room.slots.delete(client.playerSlot);
        room.slots.set(openSlot, client);
        client.playerSlot = openSlot;
        broadcastLobby(room);
        return;
      }

      if (type === 'quick_match') {
        leaveRoom(client);
        const teamSize = parseTeamSize(msg.teamSize);
        const isRanked = Boolean(msg.isRanked);
        const queueKey: QueueKey = `${teamSize}-${isRanked ? 'ranked' : 'casual'}`;
        const waiting = quickMatchQueues[queueKey];

        if (
          waiting &&
          waiting.id !== client.id &&
          waiting.ws.readyState === WebSocket.OPEN
        ) {
          quickMatchQueues[queueKey] = null;
          const code = generateRoomCode();
          const room: OnlineRoom = {
            code,
            teamSize,
            isRanked,
            hostId: waiting.id,
            slots: new Map([
              ['blue-1', waiting],
              ['red-1', client],
            ]),
            state: null,
            inputs: {},
            latches: {},
            intervalId: null,
            lastStepAt: Date.now(),
          };
          waiting.roomCode = code;
          waiting.playerSlot = 'blue-1';
          client.roomCode = code;
          client.playerSlot = 'red-1';
          rooms.set(code, room);
          broadcastLobby(room);
          startRoomMatch(room);
        } else {
          quickMatchQueues[queueKey] = client;
          sendJson(ws, { type: 'matchmaking_waiting', isRanked });
        }
        return;
      }

      if (type === 'cancel_quick_match') {
        clearClientFromQueues(client);
        return;
      }

      if (type === 'start_match' || type === 'rematch') {
        if (!client.roomCode) return;
        const room = rooms.get(client.roomCode);
        if (!room || room.slots.size < 2) return;
        if (type === 'start_match' && room.hostId !== client.id) return;
        startRoomMatch(room);
        return;
      }

      if (type === 'leave_room') {
        leaveRoom(client);
        return;
      }

      if (type === 'send_emote') {
        if (!client.roomCode || !client.playerSlot) return;
        const room = rooms.get(client.roomCode);
        if (!room) return;
        const emoteId = String(msg.emoteId || '');
        const emote = EMOTE_OPTIONS.find((e) => e.id === emoteId);
        if (!emote) return;

        const activePlayerId =
          room.state?.controlMap?.[client.playerSlot] ?? client.playerSlot;
        const team: Team = client.playerSlot.startsWith('red') ? 'red' : 'blue';
        const packet = {
          type: 'emote',
          uid: `${client.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          playerId: activePlayerId,
          senderName: client.name,
          team,
          emoji: emote.emoji,
          label: emote.label,
          createdAt: Date.now(),
        };
        for (const c of room.slots.values()) {
          sendJson(c.ws, packet);
        }
        return;
      }

      if (type === 'player_input') {
        if (!client.roomCode || !client.playerSlot) return;
        const room = rooms.get(client.roomCode);
        if (!room || !room.state) return;

        const slot = client.playerSlot;
        const moveX = Number(msg.moveX) || 0;
        const moveY = Number(msg.moveY) || 0;
        const shoot = Boolean(msg.shoot);
        const dribble = Boolean(msg.dribble);
        const pass = Boolean(msg.pass);
        const sprint = Boolean(msg.sprint);

        room.inputs[slot] = {
          moveX: Math.max(-1, Math.min(1, moveX)),
          moveY: Math.max(-1, Math.min(1, moveY)),
          shoot,
          dribble,
          pass,
          sprint,
        };
        if (shoot) {
          room.latches[slot] = room.latches[slot] || { shoot: false, dribble: false, pass: false };
          room.latches[slot].shoot = true;
        }
        if (dribble) {
          room.latches[slot] = room.latches[slot] || { shoot: false, dribble: false, pass: false };
          room.latches[slot].dribble = true;
        }
        if (pass) {
          room.latches[slot] = room.latches[slot] || { shoot: false, dribble: false, pass: false };
          room.latches[slot].pass = true;
        }
      }
    });

    ws.on('close', () => {
      leaveRoom(client);
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Arena Futebol server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
