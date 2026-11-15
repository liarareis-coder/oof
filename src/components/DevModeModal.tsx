import React, { useEffect, useState } from 'react';
import {
  Check,
  Code2,
  Flame,
  Lock,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Unlock,
  X,
  Zap,
} from 'lucide-react';
import {
  DEFAULT_DEV_HACKS,
  type DevHacksConfig,
  type GameMode,
  type Team,
} from '../shared/gameEngine.ts';
import { RANK_TIERS, getRankInfo, type RankId } from '../shared/ranks.ts';

export const DEV_MODE_PASSWORD = '23022013';

interface DevModeModalProps {
  open: boolean;
  onClose: () => void;
  unlocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
  hacks: DevHacksConfig;
  onChangeHacks: (next: DevHacksConfig) => void;
  isPlaying: boolean;
  gameMode: GameMode;
  currentScore: { blue: number; red: number };
  currentTimeRemaining: number;
  onAddGoal: (team: Team, delta: number) => void;
  onResetScore: () => void;
  onAdjustTime: (mode: 'add30' | 'set5' | 'set999' | 'finish') => void;
  onBringBallToMe: () => void;
  currentExp: number;
  onSetExp: (nextExp: number) => void;
  onSelectRank: (rankId: RankId) => void;
}

export const DevModeModal: React.FC<DevModeModalProps> = ({
  open,
  onClose,
  unlocked,
  onUnlock,
  onLock,
  hacks,
  onChangeHacks,
  isPlaying,
  gameMode,
  currentScore,
  currentTimeRemaining,
  onAddGoal,
  onResetScore,
  onAdjustTime,
  onBringBallToMe,
  currentExp,
  onSetExp,
  onSelectRank,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expInput, setExpInput] = useState(String(currentExp));
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setExpInput(String(currentExp));
    }
  }, [open, currentExp]);

  if (!open) return null;

  const isOnlineMatch = isPlaying && gameMode === 'online';

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === DEV_MODE_PASSWORD) {
      setErrorMsg(null);
      setPasswordInput('');
      onUnlock();
    } else {
      setErrorMsg('Senha incorreta! Acesso negado.');
    }
  };

  const flashNotice = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice((p) => (p === msg ? null : p)), 2200);
  };

  const activateGodMode = () => {
    onChangeHacks({
      enabled: true,
      playerSpeedMultiplier: 2.2,
      kickPowerMultiplier: 2.4,
      ballFrictionMultiplier: 0.7,
      infiniteStamina: true,
      noDribbleCooldown: true,
      freezeClock: false,
      freezeEnemyAI: false,
      ballMagnet: true,
      gkAlwaysThrow: true,
    });
    flashNotice('Modo Deus ativado!');
  };

  const resetAllHacks = () => {
    onChangeHacks({ ...DEFAULT_DEV_HACKS, enabled: false });
    flashNotice('Hacks restaurados ao padrão.');
  };

  const currentRank = getRankInfo(currentExp);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto bg-[#0E171B] border border-amber-400/35 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0E171B]/95 backdrop-blur-xs px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-xl font-extrabold text-white leading-tight flex items-center gap-2">
                <span>Modo Desenvolvedor</span>
                {unlocked && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold uppercase tracking-wider">
                    Desbloqueado
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">
                Painel de hacks, física em tempo real, placar e patente
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unlocked && (
              <button
                type="button"
                onClick={onLock}
                className="px-2.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-400/35 text-xs font-bold text-red-200 flex items-center gap-1 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Bloquear</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {!unlocked ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-sm mx-auto py-4 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Digite a senha de desenvolvedor</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Área restrita para alterar física, hacks, placar, tempo e EXP.
                </p>
              </div>
              <input
                type="password"
                autoFocus
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Senha de acesso..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#0B1215] border border-white/15 text-center font-mono-num text-base tracking-widest text-white focus:outline-none focus:border-amber-400"
              />
              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-400/40 text-xs font-semibold text-red-200">
                  {errorMsg}
                </div>
              )}
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Desbloquear Hacks</span>
              </button>
            </form>
          ) : (
            <>
              {savedNotice && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-xs font-bold text-emerald-200 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{savedNotice}</span>
                </div>
              )}

              {isOnlineMatch && (
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/35 text-xs text-amber-200 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>
                    Em partidas Online o servidor controla a física e o placar. Hacks de física, placar e IA funcionam nos modos 1P, 2P e Treino; EXP/Patente aplicam ao seu perfil.
                  </span>
                </div>
              )}

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#0B1215] border border-white/10">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hacks.enabled}
                    onChange={(e) => onChangeHacks({ ...hacks, enabled: e.target.checked })}
                    className="w-4 h-4 accent-amber-400 cursor-pointer"
                  />
                  <span className="text-sm font-bold text-white">Ativar Hacks em Campo</span>
                </label>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={activateGodMode}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>God Mode</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetAllHacks}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Resetar Hacks</span>
                  </button>
                </div>
              </div>

              {/* Physics & Multiplier Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#0B1215] border border-white/10 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-200">Velocidade</span>
                    <span className="font-mono-num text-emerald-300">
                      {hacks.playerSpeedMultiplier.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.5"
                    step="0.1"
                    value={hacks.playerSpeedMultiplier}
                    onChange={(e) =>
                      onChangeHacks({
                        ...hacks,
                        enabled: true,
                        playerSpeedMultiplier: Number(e.target.value),
                      })
                    }
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-[#0B1215] border border-white/10 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-200">Força do Chute</span>
                    <span className="font-mono-num text-amber-300">
                      {hacks.kickPowerMultiplier.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={hacks.kickPowerMultiplier}
                    onChange={(e) =>
                      onChangeHacks({
                        ...hacks,
                        enabled: true,
                        kickPowerMultiplier: Number(e.target.value),
                      })
                    }
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-[#0B1215] border border-white/10 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-200">Atrito da Bola</span>
                    <span className="font-mono-num text-sky-300">
                      {hacks.ballFrictionMultiplier.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="2.5"
                    step="0.1"
                    value={hacks.ballFrictionMultiplier}
                    onChange={(e) =>
                      onChangeHacks({
                        ...hacks,
                        enabled: true,
                        ballFrictionMultiplier: Number(e.target.value),
                      })
                    }
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Hack Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {(
                  [
                    { key: 'infiniteStamina', label: 'Stamina Infinita', icon: '⚡' },
                    { key: 'noDribbleCooldown', label: 'Drible Sem Cooldown', icon: '💨' },
                    { key: 'ballMagnet', label: 'Ímã de Bola / Alcance', icon: '🧲' },
                    { key: 'freezeEnemyAI', label: 'Congelar IA Rival', icon: '🧊' },
                    { key: 'freezeClock', label: 'Congelar Relógio', icon: '⏱️' },
                    { key: 'gkAlwaysThrow', label: 'Goleiro 100% Arremesso', icon: '🧤' },
                  ] as const
                ).map((item) => {
                  const active = hacks[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() =>
                        onChangeHacks({
                          ...hacks,
                          enabled: true,
                          [item.key]: !active,
                        })
                      }
                      className={`p-3 rounded-xl border text-left text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                        active
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                          : 'bg-[#0B1215] border-white/10 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span className="leading-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Live Match Controls */}
              <div className="p-4 rounded-xl bg-[#0B1215] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Controle Ao Vivo da Partida</span>
                  </h3>
                  {!isPlaying && (
                    <span className="text-[11px] text-slate-500">Inicie uma partida local para usar</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Score Editor */}
                  <div className="p-3 rounded-lg bg-[#111C21] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold">Placar</span>
                      <span className="font-mono-num font-bold text-white">
                        {currentScore.blue} × {currentScore.red}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        disabled={!isPlaying || isOnlineMatch}
                        onClick={() => onAddGoal('blue', 1)}
                        className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-xs font-bold text-white cursor-pointer"
                      >
                        +1 Azul
                      </button>
                      <button
                        type="button"
                        disabled={!isPlaying || isOnlineMatch}
                        onClick={() => onAddGoal('blue', -1)}
                        className="px-2 py-1 rounded bg-blue-950/70 border border-blue-500/40 disabled:opacity-40 text-xs font-bold text-blue-200 cursor-pointer"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        disabled={!isPlaying || isOnlineMatch}
                        onClick={() => onAddGoal('red', 1)}
                        className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 disabled:opacity-40 text-xs font-bold text-white cursor-pointer"
                      >
                        +1 Verm.
                      </button>
                      <button
                        type="button"
                        disabled={!isPlaying || isOnlineMatch}
                        onClick={() => onAddGoal('red', -1)}
                        className="px-2 py-1 rounded bg-red-950/70 border border-red-500/40 disabled:opacity-40 text-xs font-bold text-red-200 cursor-pointer"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        disabled={!isPlaying || isOnlineMatch}
                        onClick={onResetScore}
                        className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 disabled:opacity-40 text-xs font-semibold text-slate-200 cursor-pointer"
                      >
                        0×0
                      </button>
                    </div>
                  </div>

                  {/* Clock & Ball Teleport */}
                  <div className="p-3 rounded-lg bg-[#111C21] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold">Relógio & Bola</span>
                      <span className="font-mono-num font-bold text-amber-300">
                        {Math.ceil(currentTimeRemaining)}s
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        disabled={!isPlaying || isOnlineMatch}
                        onClick={() => onAdjustTime('add30')}
                        className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 disabled:opacity-40 text-xs font-bold text-white cursor-pointer"
                      >
                        +30s
                      </button>
                      <button
                        type="button"
                        disabled={!isPlaying || isOnlineMatch}
                        onClick={() => onAdjustTime('set5')}
                        className="px-2 py-1 rounded bg-amber-500/20 border border-amber-400/40 disabled:opacity-40 text-xs font-bold text-amber-200 cursor-pointer"
                      >
                        Ir p/ 5s
                      </button>
                      <button
                        type="button"
                        disabled={!isPlaying || isOnlineMatch}
                        onClick={() => onAdjustTime('set999')}
                        className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 disabled:opacity-40 text-xs font-bold text-white cursor-pointer"
                      >
                        999s
                      </button>
                      <button
                        type="button"
                        disabled={!isPlaying || isOnlineMatch}
                        onClick={() => onAdjustTime('finish')}
                        className="px-2 py-1 rounded bg-red-500/20 border border-red-400/40 disabled:opacity-40 text-xs font-bold text-red-200 cursor-pointer"
                      >
                        Encerrar
                      </button>
                      <button
                        type="button"
                        disabled={!isPlaying || isOnlineMatch}
                        onClick={onBringBallToMe}
                        className="px-2.5 py-1 rounded bg-emerald-500/25 border border-emerald-400/45 disabled:opacity-40 text-xs font-bold text-emerald-200 cursor-pointer"
                      >
                        ⚽ Bola no meu pé
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* EXP & Rank Editor */}
              <div className="p-4 rounded-xl bg-[#0B1215] border border-white/10 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Editor de EXP & Patente</span>
                  </h3>
                  <span className={`text-xs font-bold ${currentRank.tier.textClass}`}>
                    Atual: {currentRank.tier.icon} {currentRank.tier.name} ({currentExp} EXP)
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <input
                    type="number"
                    min={0}
                    max={999999}
                    value={expInput}
                    onChange={(e) => setExpInput(e.target.value)}
                    className="w-32 px-3 py-1.5 rounded-lg bg-[#111C21] border border-white/15 font-mono-num text-sm text-white focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = Math.max(0, Math.floor(Number(expInput) || 0));
                      onSetExp(val);
                      flashNotice(`EXP definido para ${val}`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    Aplicar EXP
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const val = currentExp + 500;
                      setExpInput(String(val));
                      onSetExp(val);
                      flashNotice('+500 EXP adicionado!');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold text-white cursor-pointer"
                  >
                    +500 EXP
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const val = 5800;
                      setExpInput(String(val));
                      onSetExp(val);
                      flashNotice('Supersonic Champion desbloqueado!');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/45 text-xs font-bold text-amber-200 cursor-pointer"
                  >
                    🏆 Máximo (5800)
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {RANK_TIERS.map((tier) => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => {
                        setExpInput(String(tier.minExp));
                        onSelectRank(tier.id);
                        flashNotice(`Patente alterada para ${tier.name}`);
                      }}
                      className={`px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                        currentRank.tier.id === tier.id
                          ? `${tier.bgClass} ${tier.borderClass} ${tier.textClass}`
                          : 'bg-[#111C21] border-white/10 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      <span>{tier.icon}</span>
                      <span>{tier.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
