export type RankId =
  | 'bronze'
  | 'prata'
  | 'ouro'
  | 'diamante'
  | 'platina'
  | 'titanio'
  | 'legend'
  | 'supersonic-legend'
  | 'champion'
  | 'supersonic-champion';

export interface RankTier {
  id: RankId;
  name: string;
  shortName: string;
  minExp: number;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  icon: string;
}

export const RANK_TIERS: RankTier[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    shortName: 'Bronze',
    minExp: 0,
    color: '#CD7F32',
    bgClass: 'bg-amber-900/35',
    borderClass: 'border-amber-700/60',
    textClass: 'text-amber-400',
    icon: '🥉',
  },
  {
    id: 'prata',
    name: 'Prata',
    shortName: 'Prata',
    minExp: 200,
    color: '#CBD5E1',
    bgClass: 'bg-slate-400/15',
    borderClass: 'border-slate-300/45',
    textClass: 'text-slate-200',
    icon: '🥈',
  },
  {
    id: 'ouro',
    name: 'Ouro',
    shortName: 'Ouro',
    minExp: 450,
    color: '#FBBF24',
    bgClass: 'bg-yellow-500/20',
    borderClass: 'border-yellow-400/55',
    textClass: 'text-yellow-300',
    icon: '🥇',
  },
  {
    id: 'diamante',
    name: 'Diamante',
    shortName: 'Diamante',
    minExp: 800,
    color: '#38BDF8',
    bgClass: 'bg-sky-500/20',
    borderClass: 'border-sky-400/55',
    textClass: 'text-sky-300',
    icon: '💎',
  },
  {
    id: 'platina',
    name: 'Platina',
    shortName: 'Platina',
    minExp: 1250,
    color: '#2DD4BF',
    bgClass: 'bg-teal-500/20',
    borderClass: 'border-teal-300/55',
    textClass: 'text-teal-200',
    icon: '💠',
  },
  {
    id: 'titanio',
    name: 'Titânio',
    shortName: 'Titânio',
    minExp: 1800,
    color: '#A78BFA',
    bgClass: 'bg-violet-500/20',
    borderClass: 'border-violet-400/55',
    textClass: 'text-violet-200',
    icon: '🛡️',
  },
  {
    id: 'legend',
    name: 'Legend',
    shortName: 'Legend',
    minExp: 2500,
    color: '#FB7185',
    bgClass: 'bg-rose-500/20',
    borderClass: 'border-rose-400/55',
    textClass: 'text-rose-300',
    icon: '🔥',
  },
  {
    id: 'supersonic-legend',
    name: 'Supersonic Legend',
    shortName: 'S. Legend',
    minExp: 3400,
    color: '#F472B6',
    bgClass: 'bg-fuchsia-500/20',
    borderClass: 'border-fuchsia-400/60',
    textClass: 'text-fuchsia-200',
    icon: '⚡',
  },
  {
    id: 'champion',
    name: 'Champion',
    shortName: 'Champion',
    minExp: 4500,
    color: '#F97316',
    bgClass: 'bg-orange-500/20',
    borderClass: 'border-orange-400/60',
    textClass: 'text-orange-300',
    icon: '👑',
  },
  {
    id: 'supersonic-champion',
    name: 'Supersonic Champion',
    shortName: 'S. Champion',
    minExp: 5800,
    color: '#FDE047',
    bgClass: 'bg-amber-400/25',
    borderClass: 'border-yellow-300/75',
    textClass: 'text-yellow-200',
    icon: '🏆',
  },
];

export interface RankProgressInfo {
  tier: RankTier;
  tierIndex: number;
  nextTier: RankTier | null;
  exp: number;
  expInTier: number;
  expForNextTier: number;
  progressPercent: number;
}

export function getRankInfo(rawExp: number): RankProgressInfo {
  const exp = Math.max(0, Math.floor(rawExp || 0));
  let tierIndex = 0;
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (exp >= RANK_TIERS[i].minExp) {
      tierIndex = i;
      break;
    }
  }
  const tier = RANK_TIERS[tierIndex];
  const nextTier = tierIndex < RANK_TIERS.length - 1 ? RANK_TIERS[tierIndex + 1] : null;
  if (!nextTier) {
    return {
      tier,
      tierIndex,
      nextTier: null,
      exp,
      expInTier: exp - tier.minExp,
      expForNextTier: 0,
      progressPercent: 100,
    };
  }
  const span = Math.max(1, nextTier.minExp - tier.minExp);
  const inTier = Math.max(0, exp - tier.minExp);
  return {
    tier,
    tierIndex,
    nextTier,
    exp,
    expInTier: inTier,
    expForNextTier: nextTier.minExp - exp,
    progressPercent: Math.min(100, Math.round((inTier / span) * 100)),
  };
}

export function calculateRankedExpDelta(
  result: 'win' | 'loss' | 'draw',
  goalsFor: number,
  goalsAgainst: number,
  currentExp: number
): { expDelta: number; nextExp: number; prevRank: RankTier; nextRank: RankTier; promoted: boolean } {
  const safeExp = Math.max(0, Math.floor(currentExp || 0));
  const prevInfo = getRankInfo(safeExp);
  const goalBonus = Math.min(40, Math.max(0, goalsFor) * 8);
  const cleanSheetBonus = goalsAgainst === 0 && result === 'win' ? 15 : 0;

  let delta = 0;
  if (result === 'win') {
    delta = 65 + goalBonus + cleanSheetBonus;
  } else if (result === 'draw') {
    delta = 25 + Math.min(20, Math.max(0, goalsFor) * 5);
  } else {
    const basePenalty = prevInfo.tierIndex >= 5 ? -28 : prevInfo.tierIndex >= 2 ? -18 : -10;
    const goalOffset = Math.min(15, Math.max(0, goalsFor) * 4);
    delta = Math.min(-4, basePenalty + goalOffset);
  }

  const nextExp = Math.max(0, safeExp + delta);
  const actualDelta = nextExp - safeExp;
  const nextInfo = getRankInfo(nextExp);

  return {
    expDelta: actualDelta,
    nextExp,
    prevRank: prevInfo.tier,
    nextRank: nextInfo.tier,
    promoted: nextInfo.tierIndex > prevInfo.tierIndex,
  };
}
