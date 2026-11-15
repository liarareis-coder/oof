import React, { useRef, useState } from 'react';
import { CornerUpRight, Target, Wind, Zap } from 'lucide-react';
import type { Team } from '../shared/gameEngine.ts';

interface ActionButtonProps {
  variant: 'shoot' | 'dribble' | 'pass' | 'sprint';
  team: Team;
  label?: string;
  keyHint?: string;
  cooldownRatio?: number; // 0 = ready, 1 = full cooldown (dribble)
  chargeRatio?: number; // 0..1 shot charge
  exhausted?: boolean; // stamina exhausted (sprint)
  active?: boolean;
  onPressChange: (pressed: boolean) => void;
  size?: number;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  variant,
  team,
  label: customLabel,
  keyHint,
  cooldownRatio = 0,
  chargeRatio = 0,
  exhausted = false,
  active = false,
  onPressChange,
  size = 76,
}) => {
  const pointerIdRef = useRef<number | null>(null);
  const [pressed, setPressed] = useState(false);

  const isShoot = variant === 'shoot';
  const isPass = variant === 'pass';
  const isDribble = variant === 'dribble';
  const isSprint = variant === 'sprint';
  const isCoolingDown = isDribble && cooldownRatio > 0.02;
  const isEngaged = pressed || active;

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerIdRef.current = e.pointerId;
    setPressed(true);
    onPressChange(true);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    pointerIdRef.current = null;
    setPressed(false);
    onPressChange(false);
  };

  const label =
    customLabel ??
    (isShoot
      ? 'Chutar'
      : isPass
      ? 'Passar'
      : isSprint
      ? 'Correr'
      : 'Driblar');

  const baseColor = isShoot
    ? team === 'blue'
      ? 'bg-blue-600 hover:bg-blue-500 border-blue-300/60 text-white shadow-[0_6px_20px_rgba(37,99,235,0.4)]'
      : 'bg-red-600 hover:bg-red-500 border-red-300/60 text-white shadow-[0_6px_20px_rgba(220,38,38,0.4)]'
    : isPass
    ? 'bg-emerald-500 hover:bg-emerald-400 border-emerald-200/70 text-slate-950 shadow-[0_6px_20px_rgba(16,185,129,0.35)]'
    : isSprint
    ? exhausted
      ? 'bg-slate-800 border-slate-600/60 text-slate-400'
      : 'bg-sky-500 hover:bg-sky-400 border-sky-200/70 text-slate-950 shadow-[0_6px_20px_rgba(14,165,233,0.35)]'
    : isCoolingDown
    ? 'bg-slate-800 border-slate-600/60 text-slate-400'
    : 'bg-amber-500 hover:bg-amber-400 border-amber-200/70 text-slate-950 shadow-[0_6px_20px_rgba(245,158,11,0.35)]';

  const radius = size / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const cdDashOffset = circumference * (1 - Math.min(1, Math.max(0, cooldownRatio)));
  const chargeDashOffset = circumference * (1 - Math.min(1, Math.max(0, chargeRatio)));

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <button
        type="button"
        aria-label={label}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ width: size, height: size }}
        className={`relative rounded-full border-2 flex flex-col items-center justify-center gap-0.5 touch-none transition-transform duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer ${baseColor} ${
          isEngaged ? 'scale-92 brightness-110' : 'scale-100'
        }`}
      >
        {isDribble && isCoolingDown && (
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="pointer-events-none absolute inset-0 -rotate-90"
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(245,158,11,0.75)"
              strokeWidth={3}
              strokeDasharray={circumference}
              strokeDashoffset={cdDashOffset}
              strokeLinecap="round"
            />
          </svg>
        )}
        {isShoot && chargeRatio > 0.01 && (
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="pointer-events-none absolute inset-0 -rotate-90"
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={chargeRatio > 0.78 ? '#EF4444' : chargeRatio > 0.45 ? '#F59E0B' : '#34D399'}
              strokeWidth={4}
              strokeDasharray={circumference}
              strokeDashoffset={chargeDashOffset}
              strokeLinecap="round"
            />
          </svg>
        )}
        {isShoot ? (
          <Target className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" strokeWidth={2.4} />
        ) : isPass ? (
          <CornerUpRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" strokeWidth={2.4} />
        ) : isSprint ? (
          <Wind className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" strokeWidth={2.4} />
        ) : (
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" strokeWidth={2.4} />
        )}
        <span className="text-[10px] sm:text-[11px] font-bold tracking-tight leading-none whitespace-nowrap">
          {label}
        </span>
      </button>
      {keyHint && (
        <span className="font-mono-num text-[10px] text-slate-400 whitespace-nowrap">
          {keyHint}
        </span>
      )}
    </div>
  );
};
