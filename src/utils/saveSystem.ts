import type { Language } from '../i18n/translations.ts';
import type { GameMode, TeamSize } from '../shared/gameEngine.ts';
import { getRankInfo, type RankId } from '../shared/ranks.ts';

export const LOCAL_SAVE_KEY = 'arena_futebol_save_v1';

export interface SaveMatchRecord {
  id: string;
  mode: GameMode;
  isRanked: boolean;
  teamSize: TeamSize;
  blueScore: number;
  redScore: number;
  result: 'win' | 'loss' | 'draw';
  expDelta: number;
  rankAfter: RankId;
  createdAt: number;
}

export interface SaveProfile {
  displayName: string;
  language: Language;
  exp: number;
  rankId: RankId;
  rankedWins: number;
  rankedLosses: number;
  rankedDraws: number;
  totalMatches: number;
  totalGoals: number;
  preferredMode: GameMode;
  preferredTeamSize: TeamSize;
  muted: boolean;
  lastSavedAt: number | null;
  recentMatches: SaveMatchRecord[];
}

export function createDefaultSaveProfile(): SaveProfile {
  return {
    displayName: 'Jogador',
    language: 'pt-BR',
    exp: 0,
    rankId: 'bronze',
    rankedWins: 0,
    rankedLosses: 0,
    rankedDraws: 0,
    totalMatches: 0,
    totalGoals: 0,
    preferredMode: '1p',
    preferredTeamSize: 1,
    muted: false,
    lastSavedAt: null,
    recentMatches: [],
  };
}

export function loadLocalSave(): SaveProfile {
  try {
    const raw = localStorage.getItem(LOCAL_SAVE_KEY);
    if (!raw) return createDefaultSaveProfile();
    const parsed = JSON.parse(raw) as Partial<SaveProfile>;
    const exp = Math.max(0, Math.floor(Number(parsed.exp || 0)));
    const rankId = getRankInfo(exp).tier.id;
    return {
      displayName:
        typeof parsed.displayName === 'string' && parsed.displayName.trim().length > 0
          ? parsed.displayName.trim().slice(0, 16)
          : 'Jogador',
      language:
        parsed.language === 'pt-PT' ||
        parsed.language === 'en-US' ||
        parsed.language === 'es'
          ? parsed.language
          : 'pt-BR',
      exp,
      rankId,
      rankedWins: Math.max(0, Math.floor(Number(parsed.rankedWins || 0))),
      rankedLosses: Math.max(0, Math.floor(Number(parsed.rankedLosses || 0))),
      rankedDraws: Math.max(0, Math.floor(Number(parsed.rankedDraws || 0))),
      totalMatches: Math.max(0, Math.floor(Number(parsed.totalMatches || 0))),
      totalGoals: Math.max(0, Math.floor(Number(parsed.totalGoals || 0))),
      preferredMode:
        parsed.preferredMode === '2p' ||
        parsed.preferredMode === 'training' ||
        parsed.preferredMode === 'online'
          ? parsed.preferredMode
          : '1p',
      preferredTeamSize:
        parsed.preferredTeamSize === 8
          ? 8
          : parsed.preferredTeamSize === 4
          ? 4
          : parsed.preferredTeamSize === 2
          ? 2
          : 1,
      muted: Boolean(parsed.muted),
      lastSavedAt: typeof parsed.lastSavedAt === 'number' ? parsed.lastSavedAt : null,
      recentMatches: Array.isArray(parsed.recentMatches)
        ? parsed.recentMatches.slice(0, 12)
        : [],
    };
  } catch {
    return createDefaultSaveProfile();
  }
}

export function saveLocalProfile(profile: SaveProfile): SaveProfile {
  const exp = Math.max(0, Math.floor(profile.exp));
  const normalized: SaveProfile = {
    ...profile,
    displayName: profile.displayName.trim().slice(0, 16) || 'Jogador',
    exp,
    rankId: getRankInfo(exp).tier.id,
    lastSavedAt: Date.now(),
    recentMatches: profile.recentMatches.slice(0, 12),
  };
  try {
    localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(normalized));
  } catch {
    // Ignore storage quota errors cleanly
  }
  return normalized;
}

export function resetLocalSave(language?: Language): SaveProfile {
  const fresh = createDefaultSaveProfile();
  if (language) fresh.language = language;
  try {
    localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(fresh));
  } catch {
    // ignore
  }
  return fresh;
}

export function mergeCloudAndLocalSave(
  local: SaveProfile,
  cloud: SaveProfile
): SaveProfile {
  const preferCloud =
    cloud.exp > local.exp ||
    cloud.totalMatches > local.totalMatches ||
    (cloud.exp === local.exp && (cloud.lastSavedAt ?? 0) >= (local.lastSavedAt ?? 0));

  const primary = preferCloud ? cloud : local;
  const secondary = preferCloud ? local : cloud;

  const exp = Math.max(local.exp, cloud.exp);
  const rankId = getRankInfo(exp).tier.id;

  const combinedMatchesMap = new Map<string, SaveMatchRecord>();
  for (const m of [...primary.recentMatches, ...secondary.recentMatches]) {
    if (!combinedMatchesMap.has(m.id)) {
      combinedMatchesMap.set(m.id, m);
    }
  }
  const mergedMatches = Array.from(combinedMatchesMap.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 12);

  return {
    displayName: primary.displayName || secondary.displayName || 'Jogador',
    language: local.language,
    exp,
    rankId,
    rankedWins: Math.max(local.rankedWins, cloud.rankedWins),
    rankedLosses: Math.max(local.rankedLosses, cloud.rankedLosses),
    rankedDraws: Math.max(local.rankedDraws, cloud.rankedDraws),
    totalMatches: Math.max(local.totalMatches, cloud.totalMatches),
    totalGoals: Math.max(local.totalGoals, cloud.totalGoals),
    preferredMode: local.preferredMode,
    preferredTeamSize: local.preferredTeamSize,
    muted: local.muted,
    lastSavedAt: Date.now(),
    recentMatches: mergedMatches,
  };
}
