import React, { useState } from 'react';
import {
  Cloud,
  CloudUpload,
  FolderOpen,
  History,
  LogIn,
  LogOut,
  RefreshCw,
  RotateCcw,
  Save,
  Shield,
  Trophy,
  X,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type { LeaderboardEntry } from '../firebase.ts';
import {
  formatT,
  getLocalizedRankName,
  type Language,
  type TranslationDict,
} from '../i18n/translations.ts';
import { getRankInfo, RANK_TIERS } from '../shared/ranks.ts';
import type { SaveProfile } from '../utils/saveSystem.ts';

interface SaveRankModalProps {
  open: boolean;
  onClose: () => void;
  t: TranslationDict;
  lang: Language;
  profile: SaveProfile;
  onChangeName: (name: string) => void;
  onSaveNow: () => void;
  onLoadSave: () => void;
  onResetSave: () => void;
  user: User | null;
  cloudBusy: boolean;
  onSignInGoogle: () => void;
  onSignOutGoogle: () => void;
  onSyncCloud: () => void;
  leaderboard: LeaderboardEntry[];
  leaderboardLoading: boolean;
  onRefreshLeaderboard: () => void;
  feedbackMsg: string | null;
}

export const SaveRankModal: React.FC<SaveRankModalProps> = ({
  open,
  onClose,
  t,
  lang,
  profile,
  onChangeName,
  onSaveNow,
  onLoadSave,
  onResetSave,
  user,
  cloudBusy,
  onSignInGoogle,
  onSignOutGoogle,
  onSyncCloud,
  leaderboard,
  leaderboardLoading,
  onRefreshLeaderboard,
  feedbackMsg,
}) => {
  const [tab, setTab] = useState<'profile' | 'ranks' | 'leaderboard'>('profile');
  const [confirmingReset, setConfirmingReset] = useState(false);

  if (!open) return null;

  const rankInfo = getRankInfo(profile.exp);
  const rankName = getLocalizedRankName(rankInfo.tier.id, lang);
  const nextRankName = rankInfo.nextTier
    ? getLocalizedRankName(rankInfo.nextTier.id, lang)
    : null;

  const formattedLastSaved = profile.lastSavedAt
    ? formatT(t.lastSavedAt, {
        date: new Date(profile.lastSavedAt).toLocaleString(),
      })
    : t.notSavedYet;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-3xl max-h-[90dvh] bg-[#111C21] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-white">
              {t.saveModalTitle}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{t.saveModalSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-white/10 flex flex-wrap items-center gap-2 shrink-0 bg-[#0B1215]/50">
          <button
            type="button"
            onClick={() => setTab('profile')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              tab === 'profile'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{t.localSaveTitle}</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('ranks')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              tab === 'ranks'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{t.rankProgressionTitle}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('leaderboard');
              onRefreshLeaderboard();
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              tab === 'leaderboard'
                ? 'bg-sky-400 text-slate-950'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>{t.leaderboardTitle}</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {feedbackMsg && (
            <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-xs font-semibold text-emerald-200">
              {feedbackMsg}
            </div>
          )}

          {tab === 'profile' && (
            <div className="space-y-5">
              {/* Rank Banner + Name */}
              <div className="p-4 rounded-xl bg-[#0B1215] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-14 h-14 rounded-xl border flex items-center justify-center text-2xl shrink-0 ${rankInfo.tier.bgClass} ${rankInfo.tier.borderClass}`}
                  >
                    {rankInfo.tier.icon}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                      {t.currentRankLabel}
                    </div>
                    <div className={`font-display text-2xl font-extrabold ${rankInfo.tier.textClass}`}>
                      {rankName}
                    </div>
                    <div className="text-xs text-slate-300 font-mono-num">
                      {profile.exp} EXP ·{' '}
                      <span className="text-slate-400">
                        {nextRankName
                          ? formatT(t.expToNext, {
                              exp: rankInfo.expForNextTier,
                              rank: nextRankName,
                            })
                          : t.maxRankReached}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-56">
                  <label
                    htmlFor="save-player-name"
                    className="block text-[11px] font-semibold text-slate-400 mb-1"
                  >
                    {t.playerNameLabel}
                  </label>
                  <input
                    id="save-player-name"
                    type="text"
                    maxLength={16}
                    value={profile.displayName}
                    onChange={(e) => onChangeName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className="w-full px-3 py-2 rounded-lg bg-[#111C21] border border-white/15 text-sm text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* EXP Progress Bar */}
              <div className="space-y-1.5">
                <div className="h-2.5 rounded-full bg-[#0B1215] border border-white/10 overflow-hidden">
                  <div
                    style={{ width: `${rankInfo.progressPercent}%` }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-[width] duration-300"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono-num">
                  <span>
                    {rankName} ({rankInfo.tier.minExp} EXP)
                  </span>
                  <span>
                    {rankInfo.nextTier
                      ? `${nextRankName} (${rankInfo.nextTier.minExp} EXP)`
                      : 'MAX'}
                  </span>
                </div>
              </div>

              {/* Career Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#0B1215]/80 border border-white/10 text-center">
                  <div className="text-[11px] text-slate-400">{t.rankedRecordLabel}</div>
                  <div className="font-mono-num text-lg font-bold text-white mt-0.5">
                    {profile.rankedWins} / {profile.rankedDraws} / {profile.rankedLosses}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0B1215]/80 border border-white/10 text-center">
                  <div className="text-[11px] text-slate-400">{t.totalMatchesLabel}</div>
                  <div className="font-mono-num text-lg font-bold text-white mt-0.5">
                    {profile.totalMatches}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0B1215]/80 border border-white/10 text-center">
                  <div className="text-[11px] text-slate-400">{t.totalGoalsLabel}</div>
                  <div className="font-mono-num text-lg font-bold text-white mt-0.5">
                    {profile.totalGoals}
                  </div>
                </div>
              </div>

              {/* Local Save & Cloud Save */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Local Save Card */}
                <div className="p-4 rounded-xl bg-[#0B1215]/80 border border-white/10 space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Save className="w-4 h-4 text-emerald-400" />
                      <span>{t.localSaveTitle}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{formattedLastSaved}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingReset(false);
                        onSaveNow();
                      }}
                      className="flex-1 min-w-[110px] py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{t.saveNow}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingReset(false);
                        onLoadSave();
                      }}
                      className="flex-1 min-w-[110px] py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>{t.loadSave}</span>
                    </button>
                  </div>
                  {!confirmingReset ? (
                    <button
                      type="button"
                      onClick={() => setConfirmingReset(true)}
                      className="w-full py-1.5 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-300 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{t.resetSave}</span>
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmingReset(false);
                          onResetSave();
                        }}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer"
                      >
                        {t.confirmReset}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingReset(false)}
                        className="px-3 py-1.5 rounded-lg bg-white/10 text-slate-300 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Cloud Save Card */}
                <div className="p-4 rounded-xl bg-[#0B1215]/80 border border-white/10 space-y-3 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-sky-400" />
                      <span>{t.cloudSaveTitle}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {user
                        ? formatT(t.cloudSignedInAs, {
                            name: user.displayName || user.email || 'Google',
                          })
                        : t.cloudNotSignedIn}
                    </p>
                  </div>

                  {!user ? (
                    <button
                      type="button"
                      disabled={cloudBusy}
                      onClick={onSignInGoogle}
                      className="w-full py-2.5 px-4 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{t.signInGoogle}</span>
                    </button>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={cloudBusy}
                        onClick={onSyncCloud}
                        className="flex-1 py-2 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CloudUpload className="w-3.5 h-3.5" />
                        <span>{t.syncCloudNow}</span>
                      </button>
                      <button
                        type="button"
                        disabled={cloudBusy}
                        onClick={onSignOutGoogle}
                        className="py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t.signOutGoogle}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Match History */}
              <div className="p-4 rounded-xl bg-[#0B1215]/80 border border-white/10 space-y-2.5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-400" />
                  <span>{t.matchHistoryTitle}</span>
                </h3>
                {profile.recentMatches.length === 0 ? (
                  <p className="text-xs text-slate-400">{t.noMatchesYet}</p>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {profile.recentMatches.map((m) => (
                      <div
                        key={m.id}
                        className="px-3 py-2 rounded-lg bg-[#111C21] border border-white/5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                              m.result === 'win'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : m.result === 'loss'
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-slate-500/20 text-slate-300'
                            }`}
                          >
                            {m.result === 'win' ? 'W' : m.result === 'loss' ? 'L' : 'D'}
                          </span>
                          <span className="font-semibold text-white">
                            {m.teamSize}v{m.teamSize} · {m.mode.toUpperCase()}
                            {m.isRanked ? ` · ${t.rankedQueue}` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 font-mono-num">
                          <span className="text-slate-200 font-bold">
                            {m.blueScore} × {m.redScore}
                          </span>
                          {m.isRanked && (
                            <span
                              className={`font-bold ${
                                m.expDelta >= 0 ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {m.expDelta >= 0 ? `+${m.expDelta}` : m.expDelta} EXP
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'ranks' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {RANK_TIERS.map((tier, idx) => {
                const isCurrent = tier.id === rankInfo.tier.id;
                const unlocked = profile.exp >= tier.minExp;
                return (
                  <div
                    key={tier.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      isCurrent
                        ? `${tier.bgClass} ${tier.borderClass}`
                        : unlocked
                        ? 'bg-[#0B1215]/80 border-white/15'
                        : 'bg-[#0B1215]/40 border-white/5 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl leading-none">{tier.icon}</span>
                      <div>
                        <div className={`text-sm font-bold ${tier.textClass}`}>
                          {idx + 1}. {getLocalizedRankName(tier.id, lang)}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono-num">
                          {tier.minExp} EXP+
                        </div>
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded bg-white/15 text-[10px] font-bold text-white">
                        ★
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'leaderboard' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{t.leaderboardTitle}</span>
                <button
                  type="button"
                  disabled={leaderboardLoading}
                  onClick={onRefreshLeaderboard}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${leaderboardLoading ? 'animate-spin' : ''}`} />
                  <span>{t.refreshLeaderboard}</span>
                </button>
              </div>
              {leaderboard.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#0B1215] border border-white/10 text-center text-xs text-slate-400">
                  {t.leaderboardEmpty}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {leaderboard.map((entry, idx) => {
                    const tier = getRankInfo(entry.exp).tier;
                    return (
                      <div
                        key={entry.uid}
                        className="px-3.5 py-2.5 rounded-xl bg-[#0B1215] border border-white/10 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono-num font-bold text-slate-400 w-5">
                            #{idx + 1}
                          </span>
                          <span className="text-base leading-none">{tier.icon}</span>
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">
                              {entry.displayName}
                            </div>
                            <div className={`text-[11px] font-semibold ${tier.textClass}`}>
                              {getLocalizedRankName(tier.id, lang)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 font-mono-num shrink-0">
                          <span className="text-slate-400">
                            {entry.rankedWins}W / {entry.rankedMatches}P
                          </span>
                          <span className="font-bold text-amber-300">{entry.exp} EXP</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
