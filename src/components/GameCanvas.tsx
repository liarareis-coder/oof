import React, { useEffect, useRef } from 'react';
import {
  BALL_RADIUS,
  GOAL_BOTTOM,
  GOAL_CELEBRATION_SECONDS,
  GOAL_DEPTH,
  GOAL_POST_RADIUS,
  GOAL_TOP,
  MAX_OVERTIMES,
  PITCH_BOTTOM,
  PITCH_CENTER_X,
  PITCH_CENTER_Y,
  PITCH_LEFT,
  PITCH_RIGHT,
  PITCH_TOP,
  PLAYER_RADIUS,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type ActiveEmote,
  type GameState,
  type Team,
} from '../shared/gameEngine.ts';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
}

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  w: number;
  h: number;
  life: number;
  maxLife: number;
  color: string;
}

interface ShockwaveRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface GameCanvasLabels {
  goalTitle: string;
  prepareTitle: string;
  prepareSub: string;
  overtimeTitle: string;
  overtimeSub: string;
  pausedClock: string;
  scoredFor: string;
  blueTeam: string;
  redTeam: string;
}

const DEFAULT_CANVAS_LABELS: GameCanvasLabels = {
  goalTitle: 'GOOOL!',
  prepareTitle: 'PREPARE-SE',
  prepareSub: 'Leve a bola ao gol adversário!',
  overtimeTitle: 'EMPATE! +30s',
  overtimeSub: 'Prorrogação {cur}/{max} — Quem fizer mais pontos vence',
  pausedClock: 'Relógio pausado durante a comemoração',
  scoredFor: '{scorer} marcou para o {team}',
  blueTeam: 'Time Azul',
  redTeam: 'Time Vermelho',
};

interface GameCanvasProps {
  stateRef: React.MutableRefObject<GameState>;
  localPlayerId?: string | null;
  emotesRef?: React.MutableRefObject<ActiveEmote[]>;
  labels?: GameCanvasLabels;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  stateRef,
  localPlayerId,
  emotesRef,
  labels,
}) => {
  const labelsRef = useRef<GameCanvasLabels>(labels ?? DEFAULT_CANVAS_LABELS);
  labelsRef.current = labels ?? DEFAULT_CANVAS_LABELS;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const confettiRef = useRef<ConfettiPiece[]>([]);
  const ringsRef = useRef<ShockwaveRing[]>([]);
  const lastEventTickRef = useRef<number>(-1);
  const netShakeRef = useRef<{ left: number; right: number }>({ left: 0, right: 0 });
  const goalFlashRef = useRef<{ alpha: number; team: Team }>({ alpha: 0, team: 'blue' });
  const screenShakeRef = useRef<number>(0);
  const cameraRef = useRef<{ x: number; y: number; zoom: number }>({
    x: PITCH_CENTER_X,
    y: PITCH_CENTER_Y,
    zoom: 1,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let lastTime = performance.now();

    const spawnParticles = (
      x: number,
      y: number,
      count: number,
      color: string,
      speed = 180
    ) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const mag = speed * (0.35 + Math.random() * 0.75);
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * mag,
          vy: Math.sin(angle) * mag,
          life: 0.35 + Math.random() * 0.35,
          maxLife: 0.7,
          radius: 2.5 + Math.random() * 2.8,
          color,
        });
      }
    };

    const spawnGoalConfetti = (team: Team) => {
      const palette =
        team === 'blue'
          ? ['#60A5FA', '#3B82F6', '#93C5FD', '#FBBF24', '#F8FAFC']
          : ['#F87171', '#EF4444', '#FCA5A5', '#FBBF24', '#F8FAFC'];
      for (let i = 0; i < 95; i++) {
        const fromLeft = i % 2 === 0;
        const startX = fromLeft ? Math.random() * 240 : VIEW_WIDTH - Math.random() * 240;
        const angle = fromLeft
          ? -Math.PI * 0.38 + (Math.random() - 0.5) * 0.65
          : -Math.PI * 0.62 + (Math.random() - 0.5) * 0.65;
        const speed = 260 + Math.random() * 440;
        confettiRef.current.push({
          x: startX,
          y: VIEW_HEIGHT * (0.3 + Math.random() * 0.5),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 80,
          rot: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 14,
          w: 6 + Math.random() * 6,
          h: 3.5 + Math.random() * 4.5,
          life: 1.6 + Math.random() * 0.8,
          maxLife: 2.4,
          color: palette[i % palette.length],
        });
      }
    };

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = VIEW_WIDTH * dpr;
      const targetH = VIEW_HEIGHT * dpr;
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const state = stateRef.current;

      // Resolve dynamic active player IDs (always tracks who the human currently controls)
      const activeBlueId = state.controlMap?.['blue-1'] ?? 'blue-1';
      const activeRedId = state.controlMap?.['red-1'] ?? 'red-1';
      const activeLocalId =
        localPlayerId && state.controlMap?.[localPlayerId]
          ? state.controlMap[localPlayerId]
          : localPlayerId ?? activeBlueId;

      // Trigger particle/goal effects for newly observed events
      if (state.tick !== lastEventTickRef.current) {
        lastEventTickRef.current = state.tick;
        for (const ev of state.events) {
          if (ev.type === 'kick' && ev.x !== undefined && ev.y !== undefined) {
            spawnParticles(ev.x, ev.y, 10, '#F8FAFC', 150);
          } else if (ev.type === 'pass' && ev.x !== undefined && ev.y !== undefined) {
            spawnParticles(ev.x, ev.y, 9, '#34D399', 130);
          } else if (ev.type === 'dribble' && ev.x !== undefined && ev.y !== undefined) {
            spawnParticles(ev.x, ev.y, 8, '#F59E0B', 120);
          } else if (ev.type === 'steal' && ev.x !== undefined && ev.y !== undefined) {
            spawnParticles(ev.x, ev.y, 12, '#38BDF8', 160);
          } else if (ev.type === 'post' && ev.x !== undefined && ev.y !== undefined) {
            spawnParticles(ev.x, ev.y, 10, '#FBBF24', 190);
          } else if (ev.type === 'goal') {
            const scoringTeam: Team = ev.team ?? 'blue';
            const gx = scoringTeam === 'blue' ? PITCH_RIGHT + 20 : PITCH_LEFT - 20;
            const gy = ev.y ?? PITCH_CENTER_Y;
            if (scoringTeam === 'blue') netShakeRef.current.right = 1.3;
            else netShakeRef.current.left = 1.3;

            goalFlashRef.current = { alpha: 0.55, team: scoringTeam };
            screenShakeRef.current = 12;

            ringsRef.current.push(
              {
                x: gx,
                y: gy,
                radius: 18,
                maxRadius: 340,
                life: 0.75,
                maxLife: 0.75,
                color: scoringTeam === 'blue' ? '#60A5FA' : '#F87171',
              },
              {
                x: gx,
                y: gy,
                radius: 10,
                maxRadius: 230,
                life: 0.55,
                maxLife: 0.55,
                color: '#FBBF24',
              }
            );

            spawnParticles(
              gx,
              gy,
              52,
              scoringTeam === 'blue' ? '#60A5FA' : '#F87171',
              320
            );
            spawnParticles(gx, gy, 24, '#FBBF24', 240);
            spawnGoalConfetti(scoringTeam);
          }
        }
      }

      netShakeRef.current.left = Math.max(0, netShakeRef.current.left - dt * 1.9);
      netShakeRef.current.right = Math.max(0, netShakeRef.current.right - dt * 1.9);
      goalFlashRef.current.alpha = Math.max(0, goalFlashRef.current.alpha - dt * 0.9);
      screenShakeRef.current = Math.max(0, screenShakeRef.current - dt * 28);

      const nextParticles: Particle[] = [];
      for (const p of particlesRef.current) {
        p.life -= dt;
        if (p.life > 0) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.92;
          p.vy *= 0.92;
          nextParticles.push(p);
        }
      }
      particlesRef.current = nextParticles;

      const nextRings: ShockwaveRing[] = [];
      for (const r of ringsRef.current) {
        r.life -= dt;
        if (r.life > 0) {
          const progress = 1 - r.life / r.maxLife;
          r.radius = 16 + (r.maxRadius - 16) * (1 - Math.pow(1 - progress, 2));
          nextRings.push(r);
        }
      }
      ringsRef.current = nextRings;

      const nextConfetti: ConfettiPiece[] = [];
      for (const c of confettiRef.current) {
        c.life -= dt;
        if (c.life > 0) {
          c.vy += 420 * dt;
          c.vx *= 0.985;
          c.x += c.vx * dt;
          c.y += c.vy * dt;
          c.rot += c.vRot * dt;
          nextConfetti.push(c);
        }
      }
      confettiRef.current = nextConfetti;

      // ---- CAMERA FOLLOW LOGIC ----
      let desiredX = PITCH_CENTER_X;
      let desiredY = PITCH_CENTER_Y;
      let desiredZoom = 1;

      if (state.phase === 'GOAL') {
        desiredX = state.ball.x;
        desiredY = state.ball.y;
        desiredZoom = 1.08;
      } else if (state.mode === '2p') {
        const p1 = state.players.find((p) => p.id === activeBlueId) ?? state.players[0];
        const p2 = state.players.find((p) => p.id === activeRedId) ?? state.players[1];
        if (p1 && p2) {
          const midX = (p1.x + p2.x) * 0.5;
          const midY = (p1.y + p2.y) * 0.5;
          desiredX = midX * 0.8 + state.ball.x * 0.2;
          desiredY = midY * 0.8 + state.ball.y * 0.2;

          const spanX = Math.abs(p1.x - p2.x) + 280;
          const spanY = Math.abs(p1.y - p2.y) + 220;
          const fitZoomX = VIEW_WIDTH / spanX;
          const fitZoomY = VIEW_HEIGHT / spanY;
          desiredZoom = clamp(Math.min(1, fitZoomX, fitZoomY), 0.54, 1);
        }
      } else {
        const tracked =
          state.players.find((p) => p.id === activeLocalId) ?? state.players[0];
        if (tracked) {
          const offsetX = clamp((state.ball.x - tracked.x) * 0.24, -180, 180);
          const offsetY = clamp((state.ball.y - tracked.y) * 0.24, -100, 100);
          desiredX = tracked.x + offsetX;
          desiredY = tracked.y + offsetY;
          desiredZoom = 1;
        }
      }

      const cam = cameraRef.current;
      const smooth = 1 - Math.exp(-8.5 * dt);
      cam.x += (desiredX - cam.x) * smooth;
      cam.y += (desiredY - cam.y) * smooth;
      cam.zoom += (desiredZoom - cam.zoom) * smooth;

      const halfViewW = VIEW_WIDTH / (2 * cam.zoom);
      const halfViewH = VIEW_HEIGHT / (2 * cam.zoom);
      cam.x = clamp(cam.x, halfViewW, WORLD_WIDTH - halfViewW);
      cam.y = clamp(cam.y, halfViewH, WORLD_HEIGHT - halfViewH);

      const shakeX =
        screenShakeRef.current > 0.2
          ? (Math.random() - 0.5) * screenShakeRef.current
          : 0;
      const shakeY =
        screenShakeRef.current > 0.2
          ? (Math.random() - 0.5) * screenShakeRef.current
          : 0;

      ctx.save();
      ctx.scale(dpr, dpr);

      ctx.fillStyle = '#0D191E';
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

      // Apply camera transform + goal impact shake
      ctx.save();
      ctx.translate(VIEW_WIDTH / 2 + shakeX, VIEW_HEIGHT / 2 + shakeY);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-cam.x, -cam.y);

      const pitchW = PITCH_RIGHT - PITCH_LEFT;
      const pitchH = PITCH_BOTTOM - PITCH_TOP;

      // 1. Stadium apron & turf
      ctx.fillStyle = '#0D191E';
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      ctx.fillStyle = '#0E3F27';
      ctx.fillRect(PITCH_LEFT - 24, PITCH_TOP - 24, pitchW + 48, pitchH + 48);

      const stripeCount = 16;
      const stripeW = pitchW / stripeCount;
      for (let i = 0; i < stripeCount; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#14532D' : '#166534';
        ctx.fillRect(PITCH_LEFT + i * stripeW, PITCH_TOP, stripeW + 0.6, pitchH);
      }

      const vignette = ctx.createRadialGradient(
        PITCH_CENTER_X,
        PITCH_CENTER_Y,
        pitchW * 0.18,
        PITCH_CENTER_X,
        PITCH_CENTER_Y,
        pitchW * 0.72
      );
      vignette.addColorStop(0, 'rgba(255,255,255,0.05)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.22)');
      ctx.fillStyle = vignette;
      ctx.fillRect(PITCH_LEFT, PITCH_TOP, pitchW, pitchH);

      // 2. Pitch Markings
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.78)';
      ctx.lineWidth = 3;
      ctx.strokeRect(PITCH_LEFT, PITCH_TOP, pitchW, pitchH);

      ctx.beginPath();
      ctx.moveTo(PITCH_CENTER_X, PITCH_TOP);
      ctx.lineTo(PITCH_CENTER_X, PITCH_BOTTOM);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(PITCH_CENTER_X, PITCH_CENTER_Y, 118, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(248, 250, 252, 0.85)';
      ctx.beginPath();
      ctx.arc(PITCH_CENTER_X, PITCH_CENTER_Y, 6, 0, Math.PI * 2);
      ctx.fill();

      const boxW = 220;
      const boxH = 440;
      const boxTop = PITCH_CENTER_Y - boxH / 2;
      ctx.strokeRect(PITCH_LEFT, boxTop, boxW, boxH);
      ctx.strokeRect(PITCH_RIGHT - boxW, boxTop, boxW, boxH);

      const smallBoxW = 84;
      const smallBoxH = 264;
      const smallBoxTop = PITCH_CENTER_Y - smallBoxH / 2;
      ctx.strokeRect(PITCH_LEFT, smallBoxTop, smallBoxW, smallBoxH);
      ctx.strokeRect(PITCH_RIGHT - smallBoxW, smallBoxTop, smallBoxW, smallBoxH);

      ctx.beginPath();
      ctx.arc(PITCH_LEFT + 165, PITCH_CENTER_Y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(PITCH_RIGHT - 165, PITCH_CENTER_Y, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(PITCH_LEFT + 165, PITCH_CENTER_Y, 85, -0.82, 0.82);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(PITCH_RIGHT - 165, PITCH_CENTER_Y, 85, Math.PI - 0.82, Math.PI + 0.82);
      ctx.stroke();

      const cornerR = 24;
      ctx.beginPath();
      ctx.arc(PITCH_LEFT, PITCH_TOP, cornerR, 0, Math.PI / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(PITCH_RIGHT, PITCH_TOP, cornerR, Math.PI / 2, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(PITCH_RIGHT, PITCH_BOTTOM, cornerR, Math.PI, Math.PI * 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(PITCH_LEFT, PITCH_BOTTOM, cornerR, Math.PI * 1.5, Math.PI * 2);
      ctx.stroke();

      // 3. Goals & Net Mesh
      drawGoal(
        ctx,
        'left',
        PITCH_LEFT - GOAL_DEPTH,
        GOAL_TOP,
        GOAL_DEPTH,
        GOAL_BOTTOM - GOAL_TOP,
        netShakeRef.current.left
      );
      drawGoal(
        ctx,
        'right',
        PITCH_RIGHT,
        GOAL_TOP,
        GOAL_DEPTH,
        GOAL_BOTTOM - GOAL_TOP,
        netShakeRef.current.right
      );

      // 4. Shockwave Rings & Particles
      for (const r of ringsRef.current) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, r.life / r.maxLife) * 0.85;
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      for (const p of particlesRef.current) {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Active emotes lookup (one newest per player)
      const nowMs = Date.now();
      const playerEmoteMap = new Map<string, ActiveEmote>();
      if (emotesRef) {
        for (const em of emotesRef.current) {
          if (nowMs - em.createdAt < 2600) {
            playerEmoteMap.set(em.playerId, em);
          }
        }
      }

      // 5. Players
      for (const player of state.players) {
        const isCarrier = state.ball.possessorId === player.id;
        const isDribbling = player.dribbleTimer > 0;
        const isLocalHighlight =
          state.mode === '2p'
            ? player.id === activeBlueId || player.id === activeRedId
            : player.id === activeLocalId;

        if (isCarrier) {
          const aimDist = PLAYER_RADIUS + BALL_RADIUS + 36 + (player.isChargingShoot ? player.shootCharge * 28 : 0);
          const ax = player.x + player.aimX * aimDist;
          const ay = player.y + player.aimY * aimDist;

          ctx.save();
          ctx.strokeStyle = player.isChargingShoot
            ? player.shootCharge > 0.78
              ? 'rgba(239, 68, 68, 0.95)'
              : player.shootCharge > 0.45
              ? 'rgba(245, 158, 11, 0.95)'
              : 'rgba(52, 211, 153, 0.95)'
            : player.team === 'blue'
            ? 'rgba(96, 165, 250, 0.92)'
            : 'rgba(248, 113, 113, 0.92)';
          ctx.lineWidth = player.isChargingShoot ? 3.8 : 3;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(
            player.x + player.aimX * (PLAYER_RADIUS + 6),
            player.y + player.aimY * (PLAYER_RADIUS + 6)
          );
          ctx.lineTo(ax, ay);
          ctx.stroke();
          ctx.setLineDash([]);

          const angle = Math.atan2(player.aimY, player.aimX);
          ctx.fillStyle = player.isChargingShoot
            ? player.shootCharge > 0.78
              ? '#EF4444'
              : player.shootCharge > 0.45
              ? '#F59E0B'
              : '#34D399'
            : player.team === 'blue'
            ? '#60A5FA'
            : '#F87171';
          ctx.beginPath();
          ctx.moveTo(ax + Math.cos(angle) * 7, ay + Math.sin(angle) * 7);
          ctx.lineTo(ax + Math.cos(angle + 2.4) * 7, ay + Math.sin(angle + 2.4) * 7);
          ctx.lineTo(ax + Math.cos(angle - 2.4) * 7, ay + Math.sin(angle - 2.4) * 7);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        if (player.isSprinting) {
          ctx.save();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.72)';
          ctx.lineWidth = 2.2;
          const backAngle = player.facingAngle + Math.PI;
          for (const offset of [-8, 0, 8]) {
            const px = player.x + Math.cos(backAngle + Math.PI / 2) * offset;
            const py = player.y + Math.sin(backAngle + Math.PI / 2) * offset;
            ctx.beginPath();
            ctx.moveTo(px + Math.cos(backAngle) * (PLAYER_RADIUS + 4), py + Math.sin(backAngle) * (PLAYER_RADIUS + 4));
            ctx.lineTo(px + Math.cos(backAngle) * (PLAYER_RADIUS + 18), py + Math.sin(backAngle) * (PLAYER_RADIUS + 18));
            ctx.stroke();
          }
          ctx.restore();
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
        ctx.beginPath();
        ctx.ellipse(player.x, player.y + PLAYER_RADIUS - 2, PLAYER_RADIUS * 0.92, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();

        if (player.isGoalkeeper) {
          ctx.save();
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.92)';
          ctx.lineWidth = 2.4;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.arc(player.x, player.y, PLAYER_RADIUS + 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        if (isDribbling) {
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.9)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(player.x, player.y, PLAYER_RADIUS + 6, 0, Math.PI * 2);
          ctx.stroke();
        } else if (player.isSprinting) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.arc(player.x, player.y, PLAYER_RADIUS + 6, 0, Math.PI * 2);
          ctx.stroke();
        } else if (isLocalHighlight) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(player.x, player.y, PLAYER_RADIUS + 6, 0, Math.PI * 2);
          ctx.stroke();
        }

        const grad = ctx.createRadialGradient(
          player.x - 5,
          player.y - 6,
          3,
          player.x,
          player.y,
          PLAYER_RADIUS
        );
        if (player.team === 'blue') {
          grad.addColorStop(0, '#60A5FA');
          grad.addColorStop(1, '#1D4ED8');
        } else {
          grad.addColorStop(0, '#F87171');
          grad.addColorStop(1, '#B91C1C');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isCarrier ? '#FBBF24' : player.isGoalkeeper ? '#FCD34D' : '#F8FAFC';
        ctx.lineWidth = isCarrier ? 2.5 : 2;
        ctx.stroke();

        const notchX = player.x + Math.cos(player.facingAngle) * (PLAYER_RADIUS - 2);
        const notchY = player.y + Math.sin(player.facingAngle) * (PLAYER_RADIUS - 2);
        ctx.fillStyle = '#F8FAFC';
        ctx.beginPath();
        ctx.arc(notchX, notchY, 3.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 13px "Barlow Condensed", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(player.number), player.x, player.y + 0.5);

        ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = isLocalHighlight ? '#FFFFFF' : 'rgba(248, 250, 252, 0.86)';
        const displayName = player.isGoalkeeper ? `🧤 ${player.name}` : player.name;
        ctx.fillText(displayName, player.x, player.y - PLAYER_RADIUS - 11);

        // Stamina bar (for highlighted player or anyone recovering stamina)
        if (isLocalHighlight || player.stamina < 99.5) {
          const sw = 36;
          const sh = 4;
          const sx = player.x - sw / 2;
          const sy = player.y + PLAYER_RADIUS + 7;
          const pct = clamp(player.stamina / 100, 0, 1);

          ctx.fillStyle = 'rgba(11, 18, 21, 0.82)';
          ctx.fillRect(sx - 0.5, sy - 0.5, sw + 1, sh + 1);
          ctx.fillStyle = player.staminaExhausted
            ? '#F59E0B'
            : player.isSprinting
            ? '#38BDF8'
            : '#34D399';
          ctx.fillRect(sx, sy, sw * pct, sh);
        }

        // Shot Power Bar when holding Shoot
        if (player.isChargingShoot) {
          const pw = 42;
          const ph = 5.5;
          const px = player.x - pw / 2;
          const py = player.y + PLAYER_RADIUS + 14;
          const cpct = clamp(player.shootCharge, 0, 1);

          ctx.fillStyle = 'rgba(11, 18, 21, 0.9)';
          ctx.fillRect(px - 1, py - 1, pw + 2, ph + 2);
          ctx.fillStyle =
            cpct > 0.78 ? '#EF4444' : cpct > 0.45 ? '#F59E0B' : '#10B981';
          ctx.fillRect(px, py, pw * cpct, ph);
          ctx.strokeStyle = 'rgba(255,255,255,0.45)';
          ctx.lineWidth = 0.8;
          ctx.strokeRect(px - 1, py - 1, pw + 2, ph + 2);
        }

        const activeEmote = playerEmoteMap.get(player.id);
        if (activeEmote) {
          drawEmoteBubble(
            ctx,
            player.x,
            player.y - PLAYER_RADIUS - 36,
            `${activeEmote.emoji} ${activeEmote.label}`,
            nowMs - activeEmote.createdAt,
            player.team
          );
        }
      }

      // 6. Football
      const ball = state.ball;
      ctx.fillStyle = 'rgba(0,0,0,0.38)';
      ctx.beginPath();
      ctx.ellipse(ball.x + 1, ball.y + BALL_RADIUS - 1, BALL_RADIUS * 0.95, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(ball.x, ball.y);
      ctx.rotate(ball.spin);

      const ballGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, BALL_RADIUS);
      ballGrad.addColorStop(0, '#FFFFFF');
      ballGrad.addColorStop(1, '#CBD5E1');
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const px = Math.cos(a) * 4.4;
        const py = Math.sin(a) * 4.4;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * (BALL_RADIUS - 1.5), Math.sin(a) * (BALL_RADIUS - 1.5), 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 7. Goal Posts
      const posts = [
        { x: PITCH_LEFT, y: GOAL_TOP },
        { x: PITCH_LEFT, y: GOAL_BOTTOM },
        { x: PITCH_RIGHT, y: GOAL_TOP },
        { x: PITCH_RIGHT, y: GOAL_BOTTOM },
      ];
      for (const post of posts) {
        ctx.fillStyle = '#F8FAFC';
        ctx.beginPath();
        ctx.arc(post.x, post.y, GOAL_POST_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.restore(); // End Camera Transform

      // 8. Screen-space Goal Stadium Flash & Confetti
      if (goalFlashRef.current.alpha > 0.01) {
        const flashColor =
          goalFlashRef.current.team === 'blue'
            ? `rgba(59, 130, 246, ${goalFlashRef.current.alpha * 0.45})`
            : `rgba(239, 68, 68, ${goalFlashRef.current.alpha * 0.45})`;
        const flashGrad = ctx.createRadialGradient(
          VIEW_WIDTH / 2,
          VIEW_HEIGHT / 2,
          VIEW_WIDTH * 0.12,
          VIEW_WIDTH / 2,
          VIEW_HEIGHT / 2,
          VIEW_WIDTH * 0.65
        );
        flashGrad.addColorStop(0, 'rgba(255,255,255,0.08)');
        flashGrad.addColorStop(1, flashColor);
        ctx.fillStyle = flashGrad;
        ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
      }

      for (const c of confettiRef.current) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, c.life / 0.45);
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
        ctx.restore();
      }

      // 9. Screen-space Tactical Minimap
      drawMinimap(ctx, state, cam, activeLocalId);

      // 10. Screen-space Phase Banners
      const activeLabels = labelsRef.current;
      if (state.phase === 'GOAL') {
        const elapsed = Math.max(0, GOAL_CELEBRATION_SECONDS - state.phaseTimer);
        const popScale =
          elapsed < 0.22 ? 0.72 + (elapsed / 0.22) * 0.34 : elapsed < 0.32 ? 1.06 - ((elapsed - 0.22) / 0.1) * 0.06 : 1;
        drawGoalBanner(
          ctx,
          state.lastScorerName ?? '',
          state.lastScorerTeam ?? 'blue',
          popScale,
          activeLabels
        );
      } else if (state.phase === 'OVERTIME') {
        drawCenterBanner(
          ctx,
          activeLabels.overtimeTitle,
          activeLabels.overtimeSub
            .replace('{cur}', String(state.overtimeCount))
            .replace('{max}', String(MAX_OVERTIMES)),
          '#D97706'
        );
      } else if (state.phase === 'KICKOFF') {
        drawCenterBanner(
          ctx,
          activeLabels.prepareTitle,
          activeLabels.prepareSub,
          '#059669'
        );
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [stateRef, localPlayerId, emotesRef]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full object-contain rounded-xl border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.55)] bg-[#0D191E]"
    />
  );
};

function drawEmoteBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  ageMs: number,
  team: Team
) {
  const alpha = ageMs < 180 ? ageMs / 180 : ageMs > 2200 ? Math.max(0, (2600 - ageMs) / 400) : 1;
  const floatOffset = Math.min(8, ageMs * 0.012);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
  const tw = ctx.measureText(text).width;
  const bw = tw + 18;
  const bh = 26;
  const bx = x - bw / 2;
  const by = y - bh - floatOffset;

  ctx.fillStyle = 'rgba(11, 18, 21, 0.92)';
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 8);
  ctx.fill();

  ctx.strokeStyle = team === 'blue' ? '#60A5FA' : '#F87171';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Tail
  ctx.fillStyle = 'rgba(11, 18, 21, 0.92)';
  ctx.beginPath();
  ctx.moveTo(x - 5, by + bh);
  ctx.lineTo(x + 5, by + bh);
  ctx.lineTo(x, by + bh + 5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#F8FAFC';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, by + bh / 2 + 0.5);
  ctx.restore();
}

function drawMinimap(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cam: { x: number; y: number; zoom: number },
  localPlayerId?: string | null
) {
  const mw = 152;
  const mh = 85;
  const mx = VIEW_WIDTH - mw - 14;
  const my = VIEW_HEIGHT - mh - 14;
  const sx = mw / WORLD_WIDTH;
  const sy = mh / WORLD_HEIGHT;

  ctx.save();
  ctx.fillStyle = 'rgba(11, 18, 21, 0.78)';
  ctx.beginPath();
  ctx.roundRect(mx, my, mw, mh, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.strokeRect(
    mx + PITCH_LEFT * sx,
    my + PITCH_TOP * sy,
    (PITCH_RIGHT - PITCH_LEFT) * sx,
    (PITCH_BOTTOM - PITCH_TOP) * sy
  );
  ctx.beginPath();
  ctx.moveTo(mx + PITCH_CENTER_X * sx, my + PITCH_TOP * sy);
  ctx.lineTo(mx + PITCH_CENTER_X * sx, my + PITCH_BOTTOM * sy);
  ctx.stroke();

  const viewW = VIEW_WIDTH / cam.zoom;
  const viewH = VIEW_HEIGHT / cam.zoom;
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.45)';
  ctx.lineWidth = 1;
  ctx.strokeRect(
    mx + (cam.x - viewW / 2) * sx,
    my + (cam.y - viewH / 2) * sy,
    viewW * sx,
    viewH * sy
  );

  for (const p of state.players) {
    const isLocal = p.id === localPlayerId;
    ctx.fillStyle = p.team === 'blue' ? '#60A5FA' : '#F87171';
    ctx.beginPath();
    ctx.arc(mx + p.x * sx, my + p.y * sy, isLocal ? 3.5 : 2.6, 0, Math.PI * 2);
    ctx.fill();
    if (isLocal) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  ctx.fillStyle = '#FBBF24';
  ctx.beginPath();
  ctx.arc(mx + state.ball.x * sx, my + state.ball.y * sy, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGoal(
  ctx: CanvasRenderingContext2D,
  side: 'left' | 'right',
  x: number,
  y: number,
  w: number,
  h: number,
  shake: number
) {
  const wobble = shake > 0 ? Math.sin(performance.now() * 0.045) * shake * 6 : 0;

  ctx.save();
  ctx.fillStyle =
    side === 'left' ? 'rgba(37, 99, 235, 0.14)' : 'rgba(220, 38, 38, 0.14)';
  ctx.fillRect(x + (side === 'left' ? wobble : 0), y, w + (side === 'right' ? wobble : 0), h);

  ctx.strokeStyle = 'rgba(248, 250, 252, 0.25)';
  ctx.lineWidth = 1;
  const step = 14;
  for (let gx = x; gx <= x + w; gx += step) {
    ctx.beginPath();
    ctx.moveTo(gx + wobble * 0.5, y);
    ctx.lineTo(gx + wobble * 0.5, y + h);
    ctx.stroke();
  }
  for (let gy = y; gy <= y + h; gy += step) {
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w + wobble, gy);
    ctx.stroke();
  }

  ctx.strokeStyle = side === 'left' ? '#60A5FA' : '#F87171';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  if (side === 'left') {
    ctx.moveTo(x + w, y);
    ctx.lineTo(x + wobble, y);
    ctx.lineTo(x + wobble, y + h);
    ctx.lineTo(x + w, y + h);
  } else {
    ctx.moveTo(x, y);
    ctx.lineTo(x + w + wobble, y);
    ctx.lineTo(x + w + wobble, y + h);
    ctx.lineTo(x, y + h);
  }
  ctx.stroke();
  ctx.restore();
}

function drawGoalBanner(
  ctx: CanvasRenderingContext2D,
  scorerName: string,
  team: Team,
  scale: number,
  labels: GameCanvasLabels
) {
  const accent = team === 'blue' ? '#3B82F6' : '#EF4444';
  const teamLabel = team === 'blue' ? labels.blueTeam : labels.redTeam;
  ctx.save();
  ctx.translate(VIEW_WIDTH / 2, VIEW_HEIGHT / 2);
  ctx.scale(scale, scale);

  const boxW = 490;
  const boxH = 122;
  ctx.fillStyle = 'rgba(11, 18, 21, 0.93)';
  ctx.beginPath();
  ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 16);
  ctx.fill();

  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#F8FAFC';
  ctx.font = '800 50px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(labels.goalTitle, 0, -22);

  ctx.fillStyle = team === 'blue' ? '#93C5FD' : '#FCA5A5';
  ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    labels.scoredFor.replace('{scorer}', scorerName).replace('{team}', teamLabel),
    0,
    17
  );

  ctx.fillStyle = '#94A3B8';
  ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(labels.pausedClock, 0, 41);
  ctx.restore();
}

function drawCenterBanner(
  ctx: CanvasRenderingContext2D,
  title: string,
  subtitle: string,
  accentColor: string
) {
  ctx.save();
  const boxW = 470;
  const boxH = 98;
  const bx = VIEW_WIDTH / 2 - boxW / 2;
  const by = VIEW_HEIGHT / 2 - boxH / 2;

  ctx.fillStyle = 'rgba(11, 18, 21, 0.9)';
  ctx.beginPath();
  ctx.roundRect(bx, by, boxW, boxH, 14);
  ctx.fill();

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = '#F8FAFC';
  ctx.font = '800 42px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, VIEW_WIDTH / 2, VIEW_HEIGHT / 2 - 14);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '500 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(subtitle, VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 24);
  ctx.restore();
}
