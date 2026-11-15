export type Team = 'blue' | 'red';
export type GameMode = '1p' | '2p' | 'training' | 'online';
export type TeamSize = 1 | 2 | 4 | 8;
export type PlayerRole = 'GK' | 'DEF' | 'LAT' | 'MID' | 'FWD';
export type MatchPhase = 'KICKOFF' | 'PLAYING' | 'GOAL' | 'OVERTIME' | 'FINISHED';
export type MatchWinner = Team | 'draw' | null;

export interface EmoteOption {
  id: string;
  emoji: string;
  label: string;
}

export const EMOTE_OPTIONS: EmoteOption[] = [
  { id: 'gol', emoji: '⚽', label: 'Golaço!' },
  { id: 'fogo', emoji: '🔥', label: 'Voando!' },
  { id: 'aplauso', emoji: '👏', label: 'Boa!' },
  { id: 'risos', emoji: '😂', label: 'Haha!' },
  { id: 'trofeu', emoji: '🏆', label: 'GG!' },
];

export interface ActiveEmote {
  uid: string;
  playerId: string;
  senderName: string;
  team: Team;
  emoji: string;
  label: string;
  createdAt: number;
}

export interface PlayerInput {
  moveX: number;
  moveY: number;
  shoot: boolean;
  dribble: boolean;
  pass: boolean;
  sprint: boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  baseName: string;
  team: Team;
  number: number;
  role: PlayerRole;
  isGoalkeeper: boolean;
  isAI: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facingAngle: number;
  aimX: number;
  aimY: number;
  dribbleTimer: number;
  dribbleCooldown: number;
  lungeTimer: number;
  pickupLockout: number;
  stealImmunity: number;
  stamina: number;
  staminaExhausted: boolean;
  isSprinting: boolean;
  shootCharge: number;
  isChargingShoot: boolean;
  prevShoot: boolean;
  prevDribble: boolean;
  prevPass: boolean;
}

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  possessorId: string | null;
  lastTouchTeam: Team | null;
  spin: number;
}

export type GameEventType =
  | 'kick'
  | 'pass'
  | 'dribble'
  | 'steal'
  | 'post'
  | 'goal'
  | 'whistle'
  | 'overtime';

export interface GameEvent {
  type: GameEventType;
  x?: number;
  y?: number;
  team?: Team;
  scorerName?: string;
}

export interface GameState {
  mode: GameMode;
  teamSize: TeamSize;
  phase: MatchPhase;
  phaseTimer: number;
  timeRemaining: number;
  overtimeCount: number;
  score: {
    blue: number;
    red: number;
  };
  lastScorerTeam: Team | null;
  lastScorerName: string | null;
  winner: MatchWinner;
  humanSlots: string[];
  humanNames: Record<string, string>;
  controlMap: Record<string, string>;
  players: PlayerState[];
  ball: BallState;
  events: GameEvent[];
  tick: number;
}

export const VIEW_WIDTH = 1000;
export const VIEW_HEIGHT = 560;

export const WORLD_WIDTH = 2000;
export const WORLD_HEIGHT = 1120;
export const PITCH_LEFT = 80;
export const PITCH_RIGHT = 1920;
export const PITCH_TOP = 60;
export const PITCH_BOTTOM = 1060;
export const PITCH_CENTER_X = 1000;
export const PITCH_CENTER_Y = 560;

export const GOAL_HALF_HEIGHT = 108;
export const GOAL_TOP = PITCH_CENTER_Y - GOAL_HALF_HEIGHT;
export const GOAL_BOTTOM = PITCH_CENTER_Y + GOAL_HALF_HEIGHT;
export const GOAL_DEPTH = 48;
export const GOAL_POST_RADIUS = 8;

export const PLAYER_RADIUS = 19;
export const BALL_RADIUS = 12;

export const BASE_PLAYER_SPEED = 310;
export const SPRINT_SPEED_MULTIPLIER = 1.38;
export const CARRIER_SPEED_FACTOR = 0.93;
export const DRIBBLE_SPEED = 490;
export const DRIBBLE_DURATION = 0.32;
export const DRIBBLE_COOLDOWN = 1.6;
export const LUNGE_SPEED = 450;
export const LUNGE_DURATION = 0.16;

export const MAX_STAMINA = 100;
export const STAMINA_DRAIN_PER_SEC = 34;
export const STAMINA_REGEN_IDLE_PER_SEC = 26;
export const STAMINA_REGEN_MOVING_PER_SEC = 18;
export const STAMINA_RECOVERY_THRESHOLD = 20;

export const KICK_SPEED = 860;
export const MIN_KICK_SPEED = 560;
export const MAX_KICK_SPEED = 1140;
export const DRIBBLE_KICK_BONUS = 90;
export const SHOOT_CHARGE_RATE = 1.45;
export const PASS_SPEED = 640;
export const BALL_FRICTION = 1.9;
export const MATCH_DURATION_SECONDS = 90;
export const OVERTIME_DURATION_SECONDS = 30;
export const MAX_OVERTIMES = 3;
export const GOAL_CELEBRATION_SECONDS = 2.3;

export const EMPTY_INPUT: PlayerInput = {
  moveX: 0,
  moveY: 0,
  shoot: false,
  dribble: false,
  pass: false,
  sprint: false,
};

export interface DevHacksConfig {
  enabled: boolean;
  playerSpeedMultiplier: number;
  kickPowerMultiplier: number;
  ballFrictionMultiplier: number;
  infiniteStamina: boolean;
  noDribbleCooldown: boolean;
  freezeClock: boolean;
  freezeEnemyAI: boolean;
  ballMagnet: boolean;
  gkAlwaysThrow: boolean;
}

export const DEFAULT_DEV_HACKS: DevHacksConfig = {
  enabled: false,
  playerSpeedMultiplier: 1,
  kickPowerMultiplier: 1,
  ballFrictionMultiplier: 1,
  infiniteStamina: false,
  noDribbleCooldown: false,
  freezeClock: false,
  freezeEnemyAI: false,
  ballMagnet: false,
  gkAlwaysThrow: false,
};

const RANDOM_PARTNER_POOL = [
  'Gabriel',
  'Matheus',
  'Rafael',
  'Bruno',
  'Thiago',
  'Felipe',
  'Gustavo',
  'Pedro',
  'Vitor',
  'Diego',
  'Cauã',
  'Léo',
  'Danilo',
  'Igor',
  'Murilo',
  'Henrique',
  'Caio',
  'André',
  'Renan',
  'Lucas',
];

function drawRandomNames(count: number): string[] {
  const pool = [...RANDOM_PARTNER_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool.slice(0, count);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function hypot(dx: number, dy: number): number {
  return Math.sqrt(dx * dx + dy * dy);
}

export interface CreateGameOptions {
  mode: GameMode;
  teamSize: TeamSize;
  blueName?: string;
  redName?: string;
  slotNames?: Record<string, string>;
  humanSlots?: string[];
}

function makePlayer(
  id: string,
  baseName: string,
  team: Team,
  number: number,
  isAI: boolean,
  x: number,
  y: number,
  role: PlayerRole = 'MID'
): PlayerState {
  const facing = team === 'blue' ? 0 : Math.PI;
  return {
    id,
    name: baseName,
    baseName,
    team,
    number,
    role,
    isGoalkeeper: role === 'GK',
    isAI,
    x,
    y,
    vx: 0,
    vy: 0,
    facingAngle: facing,
    aimX: Math.cos(facing),
    aimY: Math.sin(facing),
    dribbleTimer: 0,
    dribbleCooldown: 0,
    lungeTimer: 0,
    pickupLockout: 0,
    stealImmunity: 0,
    stamina: MAX_STAMINA,
    staminaExhausted: false,
    isSprinting: false,
    shootCharge: 0,
    isChargingShoot: false,
    prevShoot: false,
    prevDribble: false,
    prevPass: false,
  };
}

function resolveDefaultHumanSlots(mode: GameMode, explicit?: string[]): string[] {
  if (explicit && explicit.length > 0) return [...explicit];
  if (mode === '2p') return ['blue-1', 'red-1'];
  return ['blue-1'];
}

function createPlayersForKickoff(
  mode: GameMode,
  teamSize: TeamSize,
  slotNames?: Record<string, string>,
  humanSlots?: string[],
  existingBaseNames?: Record<string, string>
): PlayerState[] {
  const players: PlayerState[] = [];
  const activeHumans = resolveDefaultHumanSlots(mode, humanSlots);
  const isHuman = (id: string) => activeHumans.includes(id);

  const randomNames = drawRandomNames(18);
  let rndIdx = 0;
  const pickBaseName = (id: string) => {
    if (existingBaseNames?.[id]) return existingBaseNames[id];
    if (slotNames?.[id] && isHuman(id)) return slotNames[id];
    return randomNames[rndIdx++ % randomNames.length];
  };

  // Blue Team Formation
  if (teamSize === 1) {
    players.push(
      makePlayer('blue-1', pickBaseName('blue-1'), 'blue', 10, !isHuman('blue-1'), PITCH_CENTER_X - 210, PITCH_CENTER_Y, 'FWD')
    );
  } else if (teamSize === 2) {
    players.push(
      makePlayer('blue-1', pickBaseName('blue-1'), 'blue', 10, !isHuman('blue-1'), PITCH_CENTER_X - 180, PITCH_CENTER_Y - 110, 'FWD'),
      makePlayer('blue-2', pickBaseName('blue-2'), 'blue', 5, !isHuman('blue-2'), PITCH_CENTER_X - 420, PITCH_CENTER_Y + 125, 'GK')
    );
  } else if (teamSize === 4) {
    players.push(
      makePlayer('blue-1', pickBaseName('blue-1'), 'blue', 10, !isHuman('blue-1'), PITCH_CENTER_X - 170, PITCH_CENTER_Y, 'FWD'),
      makePlayer('blue-2', pickBaseName('blue-2'), 'blue', 7, !isHuman('blue-2'), PITCH_CENTER_X - 360, PITCH_CENTER_Y - 230, 'LAT'),
      makePlayer('blue-3', pickBaseName('blue-3'), 'blue', 8, !isHuman('blue-3'), PITCH_CENTER_X - 360, PITCH_CENTER_Y + 230, 'LAT'),
      makePlayer('blue-4', pickBaseName('blue-4'), 'blue', 1, !isHuman('blue-4'), PITCH_LEFT + 185, PITCH_CENTER_Y, 'GK')
    );
  } else {
    // 8v8: 2 Atacantes (FWD), 1 Meio de Campo (MID), 2 Laterais (LAT), 2 Zagueiros (DEF), 1 Goleiro (GK)
    players.push(
      makePlayer('blue-1', pickBaseName('blue-1'), 'blue', 9, !isHuman('blue-1'), PITCH_CENTER_X - 165, PITCH_CENTER_Y - 125, 'FWD'),
      makePlayer('blue-2', pickBaseName('blue-2'), 'blue', 11, !isHuman('blue-2'), PITCH_CENTER_X - 165, PITCH_CENTER_Y + 125, 'FWD'),
      makePlayer('blue-3', pickBaseName('blue-3'), 'blue', 10, !isHuman('blue-3'), PITCH_CENTER_X - 340, PITCH_CENTER_Y, 'MID'),
      makePlayer('blue-4', pickBaseName('blue-4'), 'blue', 2, !isHuman('blue-4'), PITCH_CENTER_X - 510, PITCH_CENTER_Y - 315, 'LAT'),
      makePlayer('blue-5', pickBaseName('blue-5'), 'blue', 6, !isHuman('blue-5'), PITCH_CENTER_X - 510, PITCH_CENTER_Y + 315, 'LAT'),
      makePlayer('blue-6', pickBaseName('blue-6'), 'blue', 3, !isHuman('blue-6'), PITCH_LEFT + 255, PITCH_CENTER_Y - 140, 'DEF'),
      makePlayer('blue-7', pickBaseName('blue-7'), 'blue', 4, !isHuman('blue-7'), PITCH_LEFT + 255, PITCH_CENTER_Y + 140, 'DEF'),
      makePlayer('blue-8', pickBaseName('blue-8'), 'blue', 1, !isHuman('blue-8'), PITCH_LEFT + 54, PITCH_CENTER_Y, 'GK')
    );
  }

  // Red Team Formation
  if (teamSize === 1) {
    players.push(
      makePlayer('red-1', pickBaseName('red-1'), 'red', 9, !isHuman('red-1'), PITCH_CENTER_X + 210, PITCH_CENTER_Y, 'FWD')
    );
  } else if (teamSize === 2) {
    players.push(
      makePlayer('red-1', pickBaseName('red-1'), 'red', 9, !isHuman('red-1'), PITCH_CENTER_X + 180, PITCH_CENTER_Y + 110, 'FWD'),
      makePlayer('red-2', pickBaseName('red-2'), 'red', 4, !isHuman('red-2'), PITCH_CENTER_X + 420, PITCH_CENTER_Y - 125, 'GK')
    );
  } else if (teamSize === 4) {
    players.push(
      makePlayer('red-1', pickBaseName('red-1'), 'red', 9, !isHuman('red-1'), PITCH_CENTER_X + 170, PITCH_CENTER_Y, 'FWD'),
      makePlayer('red-2', pickBaseName('red-2'), 'red', 11, !isHuman('red-2'), PITCH_CENTER_X + 360, PITCH_CENTER_Y + 230, 'LAT'),
      makePlayer('red-3', pickBaseName('red-3'), 'red', 6, !isHuman('red-3'), PITCH_CENTER_X + 360, PITCH_CENTER_Y - 230, 'LAT'),
      makePlayer('red-4', pickBaseName('red-4'), 'red', 1, !isHuman('red-4'), PITCH_RIGHT - 185, PITCH_CENTER_Y, 'GK')
    );
  } else {
    // 8v8: 2 Atacantes (FWD), 1 Meio de Campo (MID), 2 Laterais (LAT), 2 Zagueiros (DEF), 1 Goleiro (GK)
    players.push(
      makePlayer('red-1', pickBaseName('red-1'), 'red', 9, !isHuman('red-1'), PITCH_CENTER_X + 165, PITCH_CENTER_Y + 125, 'FWD'),
      makePlayer('red-2', pickBaseName('red-2'), 'red', 11, !isHuman('red-2'), PITCH_CENTER_X + 165, PITCH_CENTER_Y - 125, 'FWD'),
      makePlayer('red-3', pickBaseName('red-3'), 'red', 10, !isHuman('red-3'), PITCH_CENTER_X + 340, PITCH_CENTER_Y, 'MID'),
      makePlayer('red-4', pickBaseName('red-4'), 'red', 2, !isHuman('red-4'), PITCH_CENTER_X + 510, PITCH_CENTER_Y + 315, 'LAT'),
      makePlayer('red-5', pickBaseName('red-5'), 'red', 6, !isHuman('red-5'), PITCH_CENTER_X + 510, PITCH_CENTER_Y - 315, 'LAT'),
      makePlayer('red-6', pickBaseName('red-6'), 'red', 3, !isHuman('red-6'), PITCH_RIGHT - 255, PITCH_CENTER_Y + 140, 'DEF'),
      makePlayer('red-7', pickBaseName('red-7'), 'red', 4, !isHuman('red-7'), PITCH_RIGHT - 255, PITCH_CENTER_Y - 140, 'DEF'),
      makePlayer('red-8', pickBaseName('red-8'), 'red', 1, !isHuman('red-8'), PITCH_RIGHT - 54, PITCH_CENTER_Y, 'GK')
    );
  }

  return players;
}

function buildInitialControlMap(humanSlots: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const slot of humanSlots) {
    map[slot] = slot;
  }
  return map;
}

export function syncPlayerControlRoles(state: GameState): void {
  const playerToBase = new Map<string, string>();
  for (const [baseSlot, pid] of Object.entries(state.controlMap)) {
    playerToBase.set(pid, baseSlot);
  }

  for (const p of state.players) {
    const ownerBase = playerToBase.get(p.id);
    if (ownerBase) {
      p.isAI = false;
      p.name = state.humanNames[ownerBase] || p.baseName;
    } else {
      p.isAI = true;
      p.name = p.baseName;
    }
  }
}

function switchHumanSlotToPlayer(
  state: GameState,
  baseHumanSlot: string,
  targetPlayer: PlayerState
): void {
  const previousPlayerId = state.controlMap[baseHumanSlot];
  if (previousPlayerId === targetPlayer.id) return;

  const previousPlayer = state.players.find((p) => p.id === previousPlayerId);
  if (previousPlayer) {
    targetPlayer.prevShoot = previousPlayer.prevShoot;
    targetPlayer.prevDribble = previousPlayer.prevDribble;
    targetPlayer.prevPass = previousPlayer.prevPass;
    previousPlayer.isChargingShoot = false;
    previousPlayer.shootCharge = 0;
    previousPlayer.isSprinting = false;
  }
  state.controlMap[baseHumanSlot] = targetPlayer.id;
  syncPlayerControlRoles(state);
}

function ensureCarrierHumanControl(state: GameState): void {
  const possessorId = state.ball.possessorId;
  if (!possessorId) return;

  const carrier = state.players.find((p) => p.id === possessorId);
  if (!carrier) return;

  const controlledSet = new Set(Object.values(state.controlMap));
  if (controlledSet.has(carrier.id)) {
    return;
  }

  const teamHumanBases = state.humanSlots.filter((h) => h.startsWith(carrier.team));
  if (teamHumanBases.length === 0) return;

  let chosenBase = teamHumanBases[0];
  let bestDist = Infinity;
  for (const h of teamHumanBases) {
    const cur = state.players.find((p) => p.id === (state.controlMap[h] ?? h));
    if (!cur) continue;
    const d = hypot(cur.x - carrier.x, cur.y - carrier.y);
    if (d < bestDist) {
      bestDist = d;
      chosenBase = h;
    }
  }

  switchHumanSlotToPlayer(state, chosenBase, carrier);
}

export function assignDynamicGoalkeepers(state: GameState): void {
  if (state.teamSize < 2) {
    for (const p of state.players) {
      p.isGoalkeeper = false;
    }
    return;
  }

  for (const team of ['blue', 'red'] as const) {
    const goalX = team === 'blue' ? PITCH_LEFT : PITCH_RIGHT;
    const goalY = PITCH_CENTER_Y;
    let closestId: string | null = null;
    let minDist = Infinity;

    for (const p of state.players) {
      if (p.team !== team) continue;
      const d = hypot(p.x - goalX, p.y - goalY);
      if (d < minDist) {
        minDist = d;
        closestId = p.id;
      }
    }

    for (const p of state.players) {
      if (p.team === team) {
        p.isGoalkeeper = p.id === closestId;
      }
    }
  }
}

export function resetPositionsForKickoff(state: GameState): void {
  const existingBaseNames: Record<string, string> = {};
  for (const p of state.players) {
    existingBaseNames[p.id] = p.baseName;
  }

  const fresh = createPlayersForKickoff(
    state.mode,
    state.teamSize,
    undefined,
    state.humanSlots,
    existingBaseNames
  );

  for (let i = 0; i < state.players.length; i++) {
    const template = fresh.find((f) => f.id === state.players[i].id);
    if (template) {
      state.players[i].x = template.x;
      state.players[i].y = template.y;
      state.players[i].vx = 0;
      state.players[i].vy = 0;
      state.players[i].facingAngle = template.facingAngle;
      state.players[i].aimX = template.aimX;
      state.players[i].aimY = template.aimY;
      state.players[i].dribbleTimer = 0;
      state.players[i].dribbleCooldown = 0;
      state.players[i].lungeTimer = 0;
      state.players[i].pickupLockout = 0;
      state.players[i].stealImmunity = 0;
      state.players[i].stamina = MAX_STAMINA;
      state.players[i].staminaExhausted = false;
      state.players[i].isSprinting = false;
      state.players[i].shootCharge = 0;
      state.players[i].isChargingShoot = false;
    }
  }

  state.controlMap = buildInitialControlMap(state.humanSlots);
  syncPlayerControlRoles(state);
  assignDynamicGoalkeepers(state);

  state.ball = {
    x: PITCH_CENTER_X,
    y: PITCH_CENTER_Y,
    vx: 0,
    vy: 0,
    possessorId: null,
    lastTouchTeam: null,
    spin: 0,
  };
}

export function createInitialGameState(options: CreateGameOptions): GameState {
  const humanSlots = resolveDefaultHumanSlots(options.mode, options.humanSlots);
  const controlMap = buildInitialControlMap(humanSlots);
  const humanNames: Record<string, string> = {};
  for (const h of humanSlots) {
    if (options.slotNames?.[h]) {
      humanNames[h] = options.slotNames[h];
    } else if (h === 'blue-1') {
      humanNames[h] = options.blueName || 'Você';
    } else if (h === 'red-1') {
      humanNames[h] = options.redName || 'Jogador 2';
    } else {
      humanNames[h] = 'Jogador';
    }
  }

  const state: GameState = {
    mode: options.mode,
    teamSize: options.teamSize,
    phase: 'KICKOFF',
    phaseTimer: 1.0,
    timeRemaining: MATCH_DURATION_SECONDS,
    overtimeCount: 0,
    score: {
      blue: 0,
      red: 0,
    },
    lastScorerTeam: null,
    lastScorerName: null,
    winner: null,
    humanSlots,
    humanNames,
    controlMap,
    players: createPlayersForKickoff(
      options.mode,
      options.teamSize,
      options.slotNames,
      humanSlots
    ),
    ball: {
      x: PITCH_CENTER_X,
      y: PITCH_CENTER_Y,
      vx: 0,
      vy: 0,
      possessorId: null,
      lastTouchTeam: null,
      spin: 0,
    },
    events: [{ type: 'whistle' }],
    tick: 0,
  };
  syncPlayerControlRoles(state);
  assignDynamicGoalkeepers(state);
  return state;
}

function computeAIInput(player: PlayerState, state: GameState): PlayerInput {
  const ball = state.ball;
  const isBlue = player.team === 'blue';
  const enemyGoalX = isBlue ? PITCH_RIGHT + 16 : PITCH_LEFT - 16;
  const ownGoalX = isBlue ? PITCH_LEFT : PITCH_RIGHT;
  const attackDir = isBlue ? 1 : -1;

  const isTraining = state.mode === 'training';
  const speedScale = isTraining ? 0.46 : 0.78;
  const shootRange = isTraining ? 230 : 350;
  const reactionBias = isTraining ? 0.15 : 0.65;

  const phaseOffset = player.number * 19;
  const hesitationCycle = (state.tick + phaseOffset) % 100;
  if (isTraining && hesitationCycle < 28) {
    return { moveX: 0, moveY: 0, shoot: false, dribble: false, pass: false, sprint: false };
  }

  const opponents = state.players.filter((p) => p.team !== player.team);
  const nearestEnemy = opponents.reduce<PlayerState | null>((best, curr) => {
    if (!best) return curr;
    return hypot(curr.x - player.x, curr.y - player.y) <
      hypot(best.x - player.x, best.y - player.y)
      ? curr
      : best;
  }, null);

  const carrier = ball.possessorId
    ? state.players.find((p) => p.id === ball.possessorId) ?? null
    : null;

  if (carrier && carrier.id === player.id) {
    const aimWobble = isTraining ? Math.sin(state.tick * 0.09) * 85 : 0;

    const targetGoalY =
      !isTraining && nearestEnemy && Math.abs(nearestEnemy.x - enemyGoalX) < 350
        ? nearestEnemy.y > PITCH_CENTER_Y
          ? PITCH_CENTER_Y - 48
          : PITCH_CENTER_Y + 48
        : PITCH_CENTER_Y + aimWobble;

    let dirX = enemyGoalX - player.x;
    let dirY = targetGoalY - player.y;
    const distToGoal = hypot(dirX, dirY) || 1;
    dirX /= distToGoal;
    dirY /= distToGoal;

    let wantDribble = false;
    if (nearestEnemy && !isTraining) {
      const ex = nearestEnemy.x - player.x;
      const enemyDist = hypot(ex, nearestEnemy.y - player.y);
      if (enemyDist < 95 && ex * attackDir > 0) {
        const evadeSign = player.y >= nearestEnemy.y ? 1 : -1;
        const safeEvadeSign =
          player.y < PITCH_TOP + 90 ? 1 : player.y > PITCH_BOTTOM - 90 ? -1 : evadeSign;
        dirY += safeEvadeSign * 0.55 * reactionBias;
        const norm = hypot(dirX, dirY) || 1;
        dirX /= norm;
        dirY /= norm;

        if (enemyDist < 80 && player.dribbleCooldown <= 0 && !player.prevDribble) {
          wantDribble = true;
        }
      }
    }

    const clearAngle = Math.abs(player.y - PITCH_CENTER_Y) < 220;
    const inRange = distToGoal < shootRange && clearAngle;
    const readyToShoot = !isTraining ? true : (state.tick + phaseOffset) % 18 === 0;
    const wantShoot = inRange && readyToShoot && !player.prevShoot;

    return {
      moveX: clamp(dirX * speedScale, -1, 1),
      moveY: clamp(dirY * speedScale, -1, 1),
      shoot: wantShoot,
      dribble: wantDribble,
      pass: false,
      sprint: false,
    };
  }

  if (carrier && carrier.team === player.team) {
    const slotNum = Number(player.id.split('-')[1] || 2);
    let targetX = clamp(carrier.x + attackDir * 120, PITCH_LEFT + 140, PITCH_RIGHT - 140);
    let targetY = clamp(
      PITCH_CENTER_Y + (slotNum === 2 ? -220 : slotNum === 3 ? 220 : 120),
      PITCH_TOP + 80,
      PITCH_BOTTOM - 80
    );

    if (player.isGoalkeeper || player.role === 'GK') {
      targetX = ownGoalX + attackDir * 68;
      targetY = clamp(
        PITCH_CENTER_Y + (ball.y - PITCH_CENTER_Y) * 0.25,
        GOAL_TOP + 18,
        GOAL_BOTTOM - 18
      );
    } else if (state.teamSize === 8) {
      if (player.role === 'DEF') {
        targetX = ownGoalX + attackDir * 330;
        targetY = PITCH_CENTER_Y + (slotNum % 2 === 0 ? -135 : 135);
      } else if (player.role === 'LAT') {
        targetX = clamp(carrier.x + attackDir * 70, PITCH_LEFT + 220, PITCH_RIGHT - 220);
        targetY = PITCH_CENTER_Y + (slotNum % 2 === 0 ? -345 : 345);
      } else if (player.role === 'MID') {
        targetX = clamp(carrier.x - attackDir * 110, PITCH_LEFT + 280, PITCH_RIGHT - 280);
        targetY = PITCH_CENTER_Y + (ball.y > PITCH_CENTER_Y ? -120 : 120);
      } else {
        targetX = clamp(carrier.x + attackDir * 220, PITCH_LEFT + 320, PITCH_RIGHT - 180);
        targetY = PITCH_CENTER_Y + (slotNum === 1 ? -155 : 155);
      }
    } else if (slotNum === 4) {
      targetX = ownGoalX + attackDir * 240;
      targetY = clamp(
        PITCH_CENTER_Y + (ball.y - PITCH_CENTER_Y) * 0.35,
        GOAL_TOP - 40,
        GOAL_BOTTOM + 40
      );
    }

    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const d = hypot(dx, dy);
    if (d < 36) {
      return { moveX: 0, moveY: 0, shoot: false, dribble: false, pass: false, sprint: false };
    }
    return {
      moveX: (dx / d) * speedScale * 0.72,
      moveY: (dy / d) * speedScale * 0.72,
      shoot: false,
      dribble: false,
      pass: false,
      sprint: false,
    };
  }

  const teammates = state.players.filter((p) => p.team === player.team);
  const ballDist = hypot(ball.x - player.x, ball.y - player.y);
  const ballDistToOwnGoal = hypot(ball.x - ownGoalX, ball.y - PITCH_CENTER_Y);
  const isClosestOnTeam = teammates.every(
    (tm) => tm.id === player.id || hypot(ball.x - tm.x, ball.y - tm.y) + 25 >= ballDist
  );

  // Dynamic Goalkeeper guarding the goal (or rushing out when shot enters box)
  if (player.isGoalkeeper && state.teamSize >= 2) {
    if (ballDistToOwnGoal < 245 && (!carrier || carrier.team !== player.team)) {
      const dx = ball.x - player.x;
      const dy = ball.y - player.y;
      const d = hypot(dx, dy) || 1;
      return {
        moveX: (dx / d) * speedScale * 0.95,
        moveY: (dy / d) * speedScale * 0.95,
        shoot: false,
        dribble: false,
        pass: false,
        sprint: !isTraining,
      };
    }

    const guardX = ownGoalX + attackDir * 58;
    const guardY = clamp(
      PITCH_CENTER_Y + (ball.y - PITCH_CENTER_Y) * 0.36,
      GOAL_TOP + 16,
      GOAL_BOTTOM - 16
    );
    const dx = guardX - player.x;
    const dy = guardY - player.y;
    const d = hypot(dx, dy);
    if (d < 16) {
      return { moveX: 0, moveY: 0, shoot: false, dribble: false, pass: false, sprint: false };
    }
    return {
      moveX: (dx / d) * speedScale * 0.82,
      moveY: (dy / d) * speedScale * 0.82,
      shoot: false,
      dribble: false,
      pass: false,
      sprint: false,
    };
  }

  if (player.id.endsWith('-4') && state.teamSize === 4 && !isClosestOnTeam && ballDist > 260) {
    const guardX = ownGoalX + attackDir * 185;
    const guardY = clamp(
      PITCH_CENTER_Y + (ball.y - PITCH_CENTER_Y) * 0.45,
      GOAL_TOP - 35,
      GOAL_BOTTOM + 35
    );
    const dx = guardX - player.x;
    const dy = guardY - player.y;
    const d = hypot(dx, dy);
    if (d < 28) {
      return { moveX: 0, moveY: 0, shoot: false, dribble: false, pass: false, sprint: false };
    }
    return {
      moveX: (dx / d) * speedScale * 0.75,
      moveY: (dy / d) * speedScale * 0.75,
      shoot: false,
      dribble: false,
      pass: false,
      sprint: false,
    };
  }

  if (!isClosestOnTeam && state.teamSize > 1) {
    const slotNum = Number(player.id.split('-')[1] || 2);
    let homeX = clamp(ball.x - attackDir * 170, PITCH_LEFT + 220, PITCH_RIGHT - 220);
    let homeY =
      slotNum === 2 ? PITCH_CENTER_Y - 230 : slotNum === 3 ? PITCH_CENTER_Y + 230 : PITCH_CENTER_Y;

    if (state.teamSize === 8) {
      if (player.role === 'DEF') {
        homeX = clamp(ownGoalX + attackDir * 270, PITCH_LEFT + 170, PITCH_RIGHT - 170);
        homeY = PITCH_CENTER_Y + (slotNum % 2 === 0 ? -140 : 140);
      } else if (player.role === 'LAT') {
        homeX = clamp(ball.x - attackDir * 180, PITCH_LEFT + 220, PITCH_RIGHT - 220);
        homeY = PITCH_CENTER_Y + (slotNum % 2 === 0 ? -340 : 340);
      } else if (player.role === 'MID') {
        homeX = clamp(ball.x - attackDir * 90, PITCH_LEFT + 260, PITCH_RIGHT - 260);
        homeY = clamp(PITCH_CENTER_Y + (ball.y - PITCH_CENTER_Y) * 0.45, PITCH_TOP + 120, PITCH_BOTTOM - 120);
      } else if (player.role === 'FWD') {
        homeX = clamp(ball.x + attackDir * 140, PITCH_LEFT + 320, PITCH_RIGHT - 220);
        homeY = PITCH_CENTER_Y + (slotNum === 1 ? -145 : 145);
      }
    }

    const dx = homeX - player.x;
    const dy = homeY - player.y;
    const d = hypot(dx, dy);
    if (d < 35) {
      return { moveX: 0, moveY: 0, shoot: false, dribble: false, pass: false, sprint: false };
    }
    return {
      moveX: (dx / d) * speedScale * 0.7,
      moveY: (dy / d) * speedScale * 0.7,
      shoot: false,
      dribble: false,
      pass: false,
      sprint: false,
    };
  }

  let targetX = ball.x;
  let targetY = ball.y;
  if (!carrier && !isTraining) {
    targetX = clamp(ball.x + ball.vx * 0.1, PITCH_LEFT + 10, PITCH_RIGHT - 10);
    targetY = clamp(ball.y + ball.vy * 0.1, PITCH_TOP + 10, PITCH_BOTTOM - 10);
  }

  const dx = targetX - player.x;
  const dy = targetY - player.y;
  const d = hypot(dx, dy) || 1;

  const wantDribble =
    !isTraining &&
    d > 160 &&
    d < 280 &&
    player.dribbleCooldown <= 0 &&
    !player.prevDribble;

  const wantLunge =
    !isTraining &&
    carrier !== null &&
    carrier.team !== player.team &&
    d < PLAYER_RADIUS + BALL_RADIUS + 14 &&
    !player.prevShoot;

  return {
    moveX: (dx / d) * speedScale,
    moveY: (dy / d) * speedScale,
    shoot: wantLunge,
    dribble: wantDribble,
    pass: false,
    sprint: false,
  };
}

function findNearestTeammate(player: PlayerState, state: GameState): PlayerState | null {
  const teammates = state.players.filter(
    (p) => p.team === player.team && p.id !== player.id
  );
  if (teammates.length === 0) return null;

  let nearest = teammates[0];
  let bestDist = hypot(nearest.x - player.x, nearest.y - player.y);
  for (let i = 1; i < teammates.length; i++) {
    const d = hypot(teammates[i].x - player.x, teammates[i].y - player.y);
    if (d < bestDist) {
      bestDist = d;
      nearest = teammates[i];
    }
  }
  return nearest;
}

export function performGoalkeeperDistribution(
  gk: PlayerState,
  state: GameState,
  rollOverride?: number
): 'throw' | 'rebound' {
  const ball = state.ball;
  const nearestAlly = findNearestTeammate(gk, state);
  const roll = rollOverride !== undefined ? rollOverride : Math.random();

  if (roll < 0.60 && nearestAlly) {
    // 60% chance: Arremessar a bola para o aliado mais próximo
    const leadX = nearestAlly.x + nearestAlly.vx * 0.1 - gk.x;
    const leadY = nearestAlly.y + nearestAlly.vy * 0.1 - gk.y;
    const dist = hypot(leadX, leadY) || 1;
    const dirX = leadX / dist;
    const dirY = leadY / dist;
    const throwSpeed = clamp(500 + dist * 0.62, 540, 740);

    gk.facingAngle = Math.atan2(dirY, dirX);
    gk.aimX = dirX;
    gk.aimY = dirY;
    gk.pickupLockout = 0.36;
    gk.isChargingShoot = false;
    gk.shootCharge = 0;

    ball.possessorId = null;
    ball.lastTouchTeam = gk.team;
    const startDist = PLAYER_RADIUS + BALL_RADIUS + 6;
    ball.x = clamp(
      gk.x + dirX * startDist,
      PITCH_LEFT - GOAL_DEPTH + BALL_RADIUS,
      PITCH_RIGHT + GOAL_DEPTH - BALL_RADIUS
    );
    ball.y = clamp(gk.y + dirY * startDist, PITCH_TOP + BALL_RADIUS, PITCH_BOTTOM - BALL_RADIUS);
    ball.vx = dirX * throwSpeed;
    ball.vy = dirY * throwSpeed;
    ball.spin = 0;
    state.events.push({ type: 'pass', x: ball.x, y: ball.y, team: gk.team });
    return 'throw';
  }

  // 40% chance: Rebater a bola para longe do gol
  const attackDir = gk.team === 'blue' ? 1 : -1;
  const sideSign = gk.y >= PITCH_CENTER_Y ? 1 : -1;
  const rawX = attackDir * 0.86;
  const rawY = sideSign * 0.51;
  const norm = hypot(rawX, rawY) || 1;
  const dirX = rawX / norm;
  const dirY = rawY / norm;
  const reboundSpeed = 620;

  gk.facingAngle = Math.atan2(dirY, dirX);
  gk.aimX = dirX;
  gk.aimY = dirY;
  gk.pickupLockout = 0.36;
  gk.isChargingShoot = false;
  gk.shootCharge = 0;

  ball.possessorId = null;
  ball.lastTouchTeam = gk.team;
  const startDist = PLAYER_RADIUS + BALL_RADIUS + 6;
  ball.x = clamp(
    gk.x + dirX * startDist,
    PITCH_LEFT - GOAL_DEPTH + BALL_RADIUS,
    PITCH_RIGHT + GOAL_DEPTH - BALL_RADIUS
  );
  ball.y = clamp(gk.y + dirY * startDist, PITCH_TOP + BALL_RADIUS, PITCH_BOTTOM - BALL_RADIUS);
  ball.vx = dirX * reboundSpeed;
  ball.vy = dirY * reboundSpeed;
  ball.spin = sideSign * 4.5;
  state.events.push({ type: 'kick', x: ball.x, y: ball.y, team: gk.team });
  return 'rebound';
}

function findBestPassTarget(player: PlayerState, state: GameState): PlayerState | null {
  const teammates = state.players.filter(
    (p) => p.team === player.team && p.id !== player.id
  );
  if (teammates.length === 0) return null;

  let best: PlayerState | null = null;
  let bestScore = -Infinity;

  for (const tm of teammates) {
    const dx = tm.x - player.x;
    const dy = tm.y - player.y;
    const dist = hypot(dx, dy) || 1;
    const dot = (dx / dist) * player.aimX + (dy / dist) * player.aimY;
    const distScore = 1 - clamp(dist / 1200, 0, 0.75);
    const score = dot * 2.4 + distScore * 0.8;
    if (score > bestScore) {
      bestScore = score;
      best = tm;
    }
  }

  return best;
}

function fireKick(player: PlayerState, state: GameState, speed: number): void {
  const ball = state.ball;
  const kickDirX = player.aimX;
  const kickDirY = player.aimY;

  ball.possessorId = null;
  ball.lastTouchTeam = player.team;
  player.pickupLockout = 0.24;

  const kickStartDist = PLAYER_RADIUS + BALL_RADIUS + 4;
  ball.x = clamp(
    player.x + kickDirX * kickStartDist,
    PITCH_LEFT - GOAL_DEPTH + BALL_RADIUS,
    PITCH_RIGHT + GOAL_DEPTH - BALL_RADIUS
  );
  ball.y = clamp(
    player.y + kickDirY * kickStartDist,
    PITCH_TOP + BALL_RADIUS,
    PITCH_BOTTOM - BALL_RADIUS
  );
  ball.vx = kickDirX * speed + player.vx * 0.15;
  ball.vy = kickDirY * speed + player.vy * 0.15;
  ball.spin = (kickDirX * player.vy - kickDirY * player.vx) * 0.02;

  state.events.push({ type: 'kick', x: ball.x, y: ball.y, team: player.team });
}

function resolveCircleCollision(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number
): { hit: boolean; nx: number; ny: number; overlap: number } {
  const dx = ax - bx;
  const dy = ay - by;
  const dist = hypot(dx, dy);
  const minDist = ar + br;
  if (dist >= minDist) {
    return { hit: false, nx: 0, ny: 0, overlap: 0 };
  }
  if (dist < 0.0001) {
    return { hit: true, nx: 1, ny: 0, overlap: minDist };
  }
  return {
    hit: true,
    nx: dx / dist,
    ny: dy / dist,
    overlap: minDist - dist,
  };
}

export function stepGameState(
  state: GameState,
  inputs: Record<string, PlayerInput>,
  dt: number,
  hacks?: DevHacksConfig
): void {
  const safeDt = Math.min(dt, 0.05);
  state.events = [];
  state.tick += 1;

  if (state.phase === 'FINISHED') {
    return;
  }

  const activeHacks = hacks && hacks.enabled ? hacks : null;

  // Match clock strictly paused during KICKOFF, GOAL celebration, and OVERTIME (or if Freeze Clock hack is ON)
  if (state.phase === 'KICKOFF' || state.phase === 'GOAL' || state.phase === 'OVERTIME') {
    state.phaseTimer -= safeDt;
    if (state.phase === 'GOAL') {
      state.ball.x += state.ball.vx * safeDt;
      state.ball.y += state.ball.vy * safeDt;
      const decay = Math.exp(-BALL_FRICTION * 1.4 * safeDt);
      state.ball.vx *= decay;
      state.ball.vy *= decay;
      state.ball.y = clamp(state.ball.y, GOAL_TOP + BALL_RADIUS, GOAL_BOTTOM - BALL_RADIUS);
      state.ball.x = clamp(
        state.ball.x,
        PITCH_LEFT - GOAL_DEPTH + BALL_RADIUS,
        PITCH_RIGHT + GOAL_DEPTH - BALL_RADIUS
      );
    }

    if (state.phaseTimer <= 0) {
      if (state.phase === 'GOAL' || state.phase === 'OVERTIME') {
        resetPositionsForKickoff(state);
      }
      state.phase = 'PLAYING';
      state.phaseTimer = 0;
      state.events.push({ type: 'whistle' });
    }
    return;
  }

  assignDynamicGoalkeepers(state);
  ensureCarrierHumanControl(state);

  const playerToBaseSlot = new Map<string, string>();
  for (const [baseSlot, playerId] of Object.entries(state.controlMap)) {
    playerToBaseSlot.set(playerId, baseSlot);
  }

  if (!activeHacks?.freezeClock) {
    state.timeRemaining -= safeDt;
    if (state.timeRemaining <= 0) {
      state.timeRemaining = 0;
      if (state.score.blue !== state.score.red) {
        state.phase = 'FINISHED';
        state.winner = state.score.blue > state.score.red ? 'blue' : 'red';
        state.events.push({ type: 'whistle' });
        return;
      } else if (state.overtimeCount < MAX_OVERTIMES) {
        state.overtimeCount += 1;
        state.timeRemaining = OVERTIME_DURATION_SECONDS;
        state.phase = 'OVERTIME';
        state.phaseTimer = 1.9;
        state.events.push({ type: 'overtime' });
        return;
      } else {
        state.phase = 'FINISHED';
        state.winner = 'draw';
        state.events.push({ type: 'whistle' });
        return;
      }
    }
  }

  // 1. Update each player's input, movement, sprint/stamina, dribble, pass, and kick/charge
  for (const player of state.players) {
    const ownerBaseSlot = playerToBaseSlot.get(player.id);
    const isFrozenEnemy =
      Boolean(activeHacks?.freezeEnemyAI) && !ownerBaseSlot && player.team === 'red';
    const rawInput = ownerBaseSlot
      ? inputs[ownerBaseSlot] ?? EMPTY_INPUT
      : isFrozenEnemy
      ? EMPTY_INPUT
      : computeAIInput(player, state);

    const mag = hypot(rawInput.moveX, rawInput.moveY);
    const normX = mag > 1 ? rawInput.moveX / mag : rawInput.moveX;
    const normY = mag > 1 ? rawInput.moveY / mag : rawInput.moveY;
    const activeMag = Math.min(mag, 1);

    if (player.dribbleTimer > 0) player.dribbleTimer = Math.max(0, player.dribbleTimer - safeDt);
    if (player.dribbleCooldown > 0) player.dribbleCooldown = Math.max(0, player.dribbleCooldown - safeDt);
    if (player.lungeTimer > 0) player.lungeTimer = Math.max(0, player.lungeTimer - safeDt);
    if (player.pickupLockout > 0) player.pickupLockout = Math.max(0, player.pickupLockout - safeDt);
    if (player.stealImmunity > 0) player.stealImmunity = Math.max(0, player.stealImmunity - safeDt);

    if (activeMag > 0.14) {
      player.facingAngle = Math.atan2(normY, normX);
      player.aimX = normX / activeMag;
      player.aimY = normY / activeMag;
    } else {
      player.aimX = Math.cos(player.facingAngle);
      player.aimY = Math.sin(player.facingAngle);
    }

    const shootPressed = rawInput.shoot && !player.prevShoot;
    const dribblePressed = rawInput.dribble && !player.prevDribble;
    const passPressed = rawInput.pass && !player.prevPass;
    player.prevShoot = rawInput.shoot;
    player.prevDribble = rawInput.dribble;
    player.prevPass = rawInput.pass;

    if (ownerBaseSlot && activeHacks?.noDribbleCooldown) {
      player.dribbleCooldown = 0;
    }

    if (dribblePressed && player.dribbleCooldown <= 0) {
      player.dribbleTimer = DRIBBLE_DURATION;
      player.dribbleCooldown =
        ownerBaseSlot && activeHacks?.noDribbleCooldown ? 0 : DRIBBLE_COOLDOWN;
      if (state.ball.possessorId === player.id) {
        player.stealImmunity = Math.max(player.stealImmunity, 0.22);
      }
      state.events.push({ type: 'dribble', x: player.x, y: player.y, team: player.team });
    }

    const ball = state.ball;
    const distToBall = hypot(ball.x - player.x, ball.y - player.y);
    const kickReachBonus = ownerBaseSlot && activeHacks?.ballMagnet ? 50 : 0;
    const canKick =
      ball.possessorId === player.id ||
      (ball.possessorId === null && distToBall <= PLAYER_RADIUS + BALL_RADIUS + 18 + kickReachBonus);

    if (passPressed) {
      player.isChargingShoot = false;
      player.shootCharge = 0;

      if (canKick) {
        const target = findBestPassTarget(player, state);
        let passDirX = player.aimX;
        let passDirY = player.aimY;
        let passSpeed = PASS_SPEED * 0.65;

        if (target) {
          const leadX = target.x + target.vx * 0.12 - player.x;
          const leadY = target.y + target.vy * 0.12 - player.y;
          const leadDist = hypot(leadX, leadY) || 1;
          passDirX = leadX / leadDist;
          passDirY = leadY / leadDist;
          passSpeed = clamp(480 + leadDist * 0.65, 520, PASS_SPEED + 120);
        }

        ball.possessorId = null;
        ball.lastTouchTeam = player.team;
        player.pickupLockout = 0.28;

        const kickStartDist = PLAYER_RADIUS + BALL_RADIUS + 4;
        ball.x = clamp(
          player.x + passDirX * kickStartDist,
          PITCH_LEFT - GOAL_DEPTH + BALL_RADIUS,
          PITCH_RIGHT + GOAL_DEPTH - BALL_RADIUS
        );
        ball.y = clamp(
          player.y + passDirY * kickStartDist,
          PITCH_TOP + BALL_RADIUS,
          PITCH_BOTTOM - BALL_RADIUS
        );
        ball.vx = passDirX * passSpeed + player.vx * 0.1;
        ball.vy = passDirY * passSpeed + player.vy * 0.1;
        ball.spin = (passDirX * player.vy - passDirY * player.vx) * 0.015;

        state.events.push({ type: 'pass', x: ball.x, y: ball.y, team: player.team });
      } else if (ownerBaseSlot && state.teamSize > 1) {
        const controlledSet = new Set(Object.values(state.controlMap));
        const candidates = state.players.filter(
          (p) => p.team === player.team && p.id !== player.id && !controlledSet.has(p.id)
        );
        if (candidates.length > 0) {
          let closestTm = candidates[0];
          let minD = hypot(closestTm.x - ball.x, closestTm.y - ball.y);
          for (let i = 1; i < candidates.length; i++) {
            const d = hypot(candidates[i].x - ball.x, candidates[i].y - ball.y);
            if (d < minD) {
              minD = d;
              closestTm = candidates[i];
            }
          }
          switchHumanSlotToPlayer(state, ownerBaseSlot, closestTm);
          playerToBaseSlot.delete(player.id);
          playerToBaseSlot.set(closestTm.id, ownerBaseSlot);
        }
      }
    } else if (!ownerBaseSlot) {
      // AI kicks immediately without charge delay
      if (shootPressed) {
        if (canKick) {
          const spd = player.dribbleTimer > 0 ? KICK_SPEED + DRIBBLE_KICK_BONUS : KICK_SPEED;
          fireKick(player, state, spd);
        } else if (player.lungeTimer <= 0 && player.dribbleTimer <= 0) {
          player.lungeTimer = LUNGE_DURATION;
        }
      }
    } else {
      // Human holds Shoot to fill the Power Bar, releases to kick
      if (rawInput.shoot) {
        if (canKick) {
          player.isChargingShoot = true;
          player.shootCharge = clamp(player.shootCharge + SHOOT_CHARGE_RATE * safeDt, 0, 1);
        } else if (player.isChargingShoot && distToBall > PLAYER_RADIUS + BALL_RADIUS + 28) {
          player.isChargingShoot = false;
          player.shootCharge = 0;
        } else if (shootPressed && player.lungeTimer <= 0 && player.dribbleTimer <= 0) {
          player.lungeTimer = LUNGE_DURATION;
        }
      } else if (player.isChargingShoot) {
        const charge = player.shootCharge;
        player.isChargingShoot = false;
        player.shootCharge = 0;
        if (canKick) {
          const bonus = player.dribbleTimer > 0 ? DRIBBLE_KICK_BONUS : 0;
          const baseSpeed = MIN_KICK_SPEED + (MAX_KICK_SPEED + bonus - MIN_KICK_SPEED) * charge;
          const speed = baseSpeed * (activeHacks?.kickPowerMultiplier ?? 1);
          fireKick(player, state, speed);
        }
      }
    }

    // Stamina & Sprint calculation
    const speedHackMult = ownerBaseSlot && activeHacks ? activeHacks.playerSpeedMultiplier : 1;
    let moveSpeed = BASE_PLAYER_SPEED * speedHackMult;
    if (state.ball.possessorId === player.id) {
      moveSpeed *= CARRIER_SPEED_FACTOR;
    }

    const wantsSprint =
      rawInput.sprint &&
      activeMag > 0.14 &&
      player.dribbleTimer <= 0 &&
      player.lungeTimer <= 0;

    if (ownerBaseSlot && activeHacks?.infiniteStamina) {
      player.stamina = MAX_STAMINA;
      player.staminaExhausted = false;
      if (wantsSprint) {
        player.isSprinting = true;
        moveSpeed *= SPRINT_SPEED_MULTIPLIER;
      } else {
        player.isSprinting = false;
      }
    } else if (wantsSprint && !player.staminaExhausted && player.stamina > 0) {
      player.isSprinting = true;
      player.stamina = Math.max(0, player.stamina - STAMINA_DRAIN_PER_SEC * safeDt);
      if (player.stamina <= 0) {
        player.staminaExhausted = true;
      }
      moveSpeed *= SPRINT_SPEED_MULTIPLIER;
    } else {
      player.isSprinting = false;
      const regen =
        activeMag > 0.14 ? STAMINA_REGEN_MOVING_PER_SEC : STAMINA_REGEN_IDLE_PER_SEC;
      player.stamina = Math.min(MAX_STAMINA, player.stamina + regen * safeDt);
      if (player.staminaExhausted && player.stamina >= STAMINA_RECOVERY_THRESHOLD) {
        player.staminaExhausted = false;
      }
    }

    if (player.dribbleTimer > 0) {
      const dirX = activeMag > 0.14 ? normX / activeMag : Math.cos(player.facingAngle);
      const dirY = activeMag > 0.14 ? normY / activeMag : Math.sin(player.facingAngle);
      player.vx = dirX * DRIBBLE_SPEED * speedHackMult;
      player.vy = dirY * DRIBBLE_SPEED * speedHackMult;
    } else if (player.lungeTimer > 0) {
      const dirX = Math.cos(player.facingAngle);
      const dirY = Math.sin(player.facingAngle);
      player.vx = dirX * LUNGE_SPEED * speedHackMult;
      player.vy = dirY * LUNGE_SPEED * speedHackMult;
    } else if (activeMag > 0.06) {
      player.vx = normX * moveSpeed;
      player.vy = normY * moveSpeed;
    } else {
      player.vx = 0;
      player.vy = 0;
    }

    player.x += player.vx * safeDt;
    player.y += player.vy * safeDt;

    player.x = clamp(player.x, PITCH_LEFT + PLAYER_RADIUS - 4, PITCH_RIGHT - PLAYER_RADIUS + 4);
    player.y = clamp(player.y, PITCH_TOP + PLAYER_RADIUS, PITCH_BOTTOM - PLAYER_RADIUS);
  }

  // 2. Player-to-Player collision resolution
  for (let i = 0; i < state.players.length; i++) {
    for (let j = i + 1; j < state.players.length; j++) {
      const a = state.players[i];
      const b = state.players[j];
      const col = resolveCircleCollision(a.x, a.y, PLAYER_RADIUS, b.x, b.y, PLAYER_RADIUS);
      if (col.hit) {
        const push = col.overlap * 0.5;
        a.x = clamp(a.x + col.nx * push, PITCH_LEFT + PLAYER_RADIUS - 4, PITCH_RIGHT - PLAYER_RADIUS + 4);
        a.y = clamp(a.y + col.ny * push, PITCH_TOP + PLAYER_RADIUS, PITCH_BOTTOM - PLAYER_RADIUS);
        b.x = clamp(b.x - col.nx * push, PITCH_LEFT + PLAYER_RADIUS - 4, PITCH_RIGHT - PLAYER_RADIUS + 4);
        b.y = clamp(b.y - col.ny * push, PITCH_TOP + PLAYER_RADIUS, PITCH_BOTTOM - PLAYER_RADIUS);
      }
    }
  }

  // 3. Ball possession, attachment on touch, and stealing by passing through the ball
  const ball = state.ball;
  const carryDist = PLAYER_RADIUS + BALL_RADIUS + 3;

  if (ball.possessorId) {
    const carrier = state.players.find((p) => p.id === ball.possessorId);
    if (carrier) {
      ball.x = carrier.x + Math.cos(carrier.facingAngle) * carryDist;
      ball.y = carrier.y + Math.sin(carrier.facingAngle) * carryDist;
      ball.vx = carrier.vx;
      ball.vy = carrier.vy;
      ball.spin += hypot(carrier.vx, carrier.vy) * safeDt * 0.03;

      if (carrier.stealImmunity <= 0) {
        for (const other of state.players) {
          if (other.team === carrier.team) continue;
          if (other.pickupLockout > 0) continue;

          const magnetStealBonus = playerToBaseSlot.has(other.id) && activeHacks?.ballMagnet ? 65 : 0;
          const distToBall = hypot(other.x - ball.x, other.y - ball.y);
          if (distToBall <= PLAYER_RADIUS + BALL_RADIUS + 5 + magnetStealBonus) {
            carrier.pickupLockout = 0.42;
            carrier.isChargingShoot = false;
            carrier.shootCharge = 0;
            other.stealImmunity = 0.32;
            ball.possessorId = other.id;
            ball.lastTouchTeam = other.team;
            ball.x = other.x + Math.cos(other.facingAngle) * carryDist;
            ball.y = other.y + Math.sin(other.facingAngle) * carryDist;
            state.events.push({ type: 'steal', x: ball.x, y: ball.y, team: other.team });
            if (other.isGoalkeeper && state.teamSize >= 2) {
              performGoalkeeperDistribution(
                other,
                state,
                activeHacks?.gkAlwaysThrow ? 0 : undefined
              );
            } else {
              ensureCarrierHumanControl(state);
            }
            break;
          }
        }
      }
    } else {
      ball.possessorId = null;
    }
  } else {
    if (activeHacks?.ballMagnet) {
      const targetId = state.controlMap?.['blue-1'] ?? 'blue-1';
      const hero = state.players.find((p) => p.id === targetId);
      if (hero && hero.pickupLockout <= 0) {
        const mdx = hero.x - ball.x;
        const mdy = hero.y - ball.y;
        const md = hypot(mdx, mdy);
        if (md > 1 && md < 260) {
          ball.vx += (mdx / md) * 1400 * safeDt;
          ball.vy += (mdy / md) * 1400 * safeDt;
        }
      }
    }

    ball.x += ball.vx * safeDt;
    ball.y += ball.vy * safeDt;

    const frictionMult = activeHacks ? activeHacks.ballFrictionMultiplier : 1;
    const decay = Math.exp(-BALL_FRICTION * frictionMult * safeDt);
    ball.vx *= decay;
    ball.vy *= decay;
    if (hypot(ball.vx, ball.vy) < 8) {
      ball.vx = 0;
      ball.vy = 0;
    }
    ball.spin += hypot(ball.vx, ball.vy) * safeDt * 0.03;

    const posts = [
      { x: PITCH_LEFT, y: GOAL_TOP },
      { x: PITCH_LEFT, y: GOAL_BOTTOM },
      { x: PITCH_RIGHT, y: GOAL_TOP },
      { x: PITCH_RIGHT, y: GOAL_BOTTOM },
    ];
    for (const post of posts) {
      const col = resolveCircleCollision(
        ball.x,
        ball.y,
        BALL_RADIUS,
        post.x,
        post.y,
        GOAL_POST_RADIUS
      );
      if (col.hit) {
        ball.x += col.nx * col.overlap;
        ball.y += col.ny * col.overlap;
        const dot = ball.vx * col.nx + ball.vy * col.ny;
        if (dot < 0) {
          ball.vx -= 1.8 * dot * col.nx;
          ball.vy -= 1.8 * dot * col.ny;
          state.events.push({ type: 'post', x: post.x, y: post.y });
        }
      }
    }

    if (ball.y - BALL_RADIUS < PITCH_TOP) {
      ball.y = PITCH_TOP + BALL_RADIUS;
      ball.vy = Math.abs(ball.vy) * 0.78;
    } else if (ball.y + BALL_RADIUS > PITCH_BOTTOM) {
      ball.y = PITCH_BOTTOM - BALL_RADIUS;
      ball.vy = -Math.abs(ball.vy) * 0.78;
    }

    const inGoalMouthY = ball.y > GOAL_TOP + 2 && ball.y < GOAL_BOTTOM - 2;
    if (!inGoalMouthY) {
      if (ball.x - BALL_RADIUS < PITCH_LEFT) {
        ball.x = PITCH_LEFT + BALL_RADIUS;
        ball.vx = Math.abs(ball.vx) * 0.78;
      } else if (ball.x + BALL_RADIUS > PITCH_RIGHT) {
        ball.x = PITCH_RIGHT - BALL_RADIUS;
        ball.vx = -Math.abs(ball.vx) * 0.78;
      }
    }

    let closestPlayer: PlayerState | null = null;
    let closestDist = Infinity;
    for (const player of state.players) {
      if (player.pickupLockout > 0) continue;
      const magnetBonus = playerToBaseSlot.has(player.id) && activeHacks?.ballMagnet ? 48 : 0;
      const d = hypot(player.x - ball.x, player.y - ball.y);
      if (d <= PLAYER_RADIUS + BALL_RADIUS + 5 + magnetBonus && d < closestDist) {
        closestDist = d;
        closestPlayer = player;
      }
    }

    if (closestPlayer) {
      const incomingSpeed = hypot(ball.vx, ball.vy);
      const isEnemyShot = ball.lastTouchTeam !== closestPlayer.team;
      if (
        closestPlayer.isGoalkeeper &&
        state.teamSize >= 2 &&
        (closestPlayer.isAI || isEnemyShot || incomingSpeed > 160)
      ) {
        performGoalkeeperDistribution(
          closestPlayer,
          state,
          activeHacks?.gkAlwaysThrow ? 0 : undefined
        );
      } else {
        ball.possessorId = closestPlayer.id;
        ball.lastTouchTeam = closestPlayer.team;
        closestPlayer.stealImmunity = 0.16;
        ball.x = closestPlayer.x + Math.cos(closestPlayer.facingAngle) * carryDist;
        ball.y = closestPlayer.y + Math.sin(closestPlayer.facingAngle) * carryDist;
        ensureCarrierHumanControl(state);
      }
    }
  }

  // 4. Goal Detection
  const ballInGoalY = ball.y >= GOAL_TOP + 4 && ball.y <= GOAL_BOTTOM - 4;
  if (ballInGoalY) {
    if (ball.x < PITCH_LEFT - 4) {
      scoreGoal(state, 'red');
    } else if (ball.x > PITCH_RIGHT + 4) {
      scoreGoal(state, 'blue');
    }
  }
}

function scoreGoal(state: GameState, scoringTeam: Team): void {
  const possessor = state.ball.possessorId
    ? state.players.find((p) => p.id === state.ball.possessorId)
    : null;
  const scorerName =
    possessor && possessor.team === scoringTeam
      ? possessor.name
      : scoringTeam === 'blue'
      ? 'Time Azul'
      : 'Time Vermelho';

  state.ball.possessorId = null;
  if (scoringTeam === 'blue' && state.ball.vx < 140) {
    state.ball.vx = 180;
  } else if (scoringTeam === 'red' && state.ball.vx > -140) {
    state.ball.vx = -180;
  }

  state.score[scoringTeam] += 1;
  state.lastScorerTeam = scoringTeam;
  state.lastScorerName = scorerName;
  state.phase = 'GOAL';
  state.phaseTimer = GOAL_CELEBRATION_SECONDS;
  state.events.push({
    type: 'goal',
    team: scoringTeam,
    scorerName,
    x: state.ball.x,
    y: state.ball.y,
  });
}
