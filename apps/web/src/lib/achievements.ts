/**
 * TUF Ops Achievement / Badge System
 *
 * Badge categories: academy | territory | pipeline | lanes
 * Tiers: bronze | silver | gold | platinum
 *
 * Storage: localStorage key 'tuf_ops_achievements_v1'
 * Check badge conditions on relevant actions and trigger toast notifications.
 */

export type BadgeCategory = 'academy' | 'territory' | 'pipeline' | 'lanes';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  icon: string; // emoji
  tier: BadgeTier;
  condition: string; // human-readable
  check: (stats: RepStats) => boolean;
}

export interface RepStats {
  /** Academy */
  quizModulesPassed: number; // 0-5
  isLevel1Certified: boolean;
  isLevel2Certified: boolean;

  /** Territory */
  organizationsCreated: number;

  /** Pipeline */
  activeOpportunities: number;
  dealsClosedThisMonth: number;
  dealsClosedThisQuarter: number;

  /** Lanes */
  uniformsDealClosed: boolean;
  travelGearDealClosed: boolean;
  teamStoreDealClosed: boolean;
  lettermanDealClosed: boolean;
}

export interface EarnedBadge {
  badgeId: string;
  earnedAt: string; // ISO date string
}

export type AchievementsStore = {
  earned: EarnedBadge[];
  lastCheck: string; // ISO date
};

const STORAGE_KEY = 'tuf_ops_achievements_v1';

// ─── Badge Definitions ───────────────────────────────────────────────────────

export const ALL_BADGES: Badge[] = [
  // ── Academy ──────────────────────────────────────────────────────────────
  {
    id: 'academy-rookie',
    name: 'Rookie',
    description: 'Complete Module 1 quiz',
    category: 'academy',
    icon: '🎓',
    tier: 'bronze',
    condition: 'Pass Module 1 (ACAD-101) quiz',
    check: (s) => s.quizModulesPassed >= 1,
  },
  {
    id: 'academy-scholar',
    name: 'Scholar',
    description: 'Complete all 5 module quizzes',
    category: 'academy',
    icon: '📚',
    tier: 'silver',
    condition: 'Pass all 5 module quizzes',
    check: (s) => s.quizModulesPassed >= 5,
  },
  {
    id: 'academy-level1',
    name: 'Level 1 Certified',
    description: 'Director approved certification',
    category: 'academy',
    icon: '🏆',
    tier: 'gold',
    condition: 'Become Level 1 Certified',
    check: (s) => s.isLevel1Certified,
  },
  {
    id: 'academy-master',
    name: 'Master',
    description: 'Level 2 Certified',
    category: 'academy',
    icon: '🎯',
    tier: 'platinum',
    condition: 'Become Level 2 Certified',
    check: (s) => s.isLevel2Certified,
  },

  // ── Territory ────────────────────────────────────────────────────────────
  {
    id: 'territory-first-school',
    name: 'First School',
    description: 'Create your first organization',
    category: 'territory',
    icon: '🏠',
    tier: 'bronze',
    condition: 'Create 1 organization',
    check: (s) => s.organizationsCreated >= 1,
  },
  {
    id: 'territory-neighborhood',
    name: 'Neighborhood Watch',
    description: '10 organizations created',
    category: 'territory',
    icon: '🏘️',
    tier: 'silver',
    condition: 'Create 10 organizations',
    check: (s) => s.organizationsCreated >= 10,
  },
  {
    id: 'territory-city-builder',
    name: 'City Builder',
    description: '25 organizations created',
    category: 'territory',
    icon: '🏙️',
    tier: 'gold',
    condition: 'Create 25 organizations',
    check: (s) => s.organizationsCreated >= 25,
  },
  {
    id: 'territory-metro-owner',
    name: 'Metro Owner',
    description: '50+ organizations created',
    category: 'territory',
    icon: '🌆',
    tier: 'platinum',
    condition: 'Create 50 organizations',
    check: (s) => s.organizationsCreated >= 50,
  },

  // ── Pipeline ─────────────────────────────────────────────────────────────
  {
    id: 'pipeline-first-deal',
    name: 'First Deal',
    description: 'First opportunity created',
    category: 'pipeline',
    icon: '🌱',
    tier: 'bronze',
    condition: 'Create your first opportunity',
    check: (s) => s.activeOpportunities >= 1,
  },
  {
    id: 'pipeline-growing',
    name: 'Growing',
    description: '12+ active opportunities',
    category: 'pipeline',
    icon: '🌿',
    tier: 'silver',
    condition: 'Have 12+ active opportunities',
    check: (s) => s.activeOpportunities >= 12,
  },
  {
    id: 'pipeline-master',
    name: 'Pipeline Master',
    description: '4+ deals closed in one month',
    category: 'pipeline',
    icon: '🌳',
    tier: 'gold',
    condition: 'Close 4+ deals in a single month',
    check: (s) => s.dealsClosedThisMonth >= 4,
  },
  {
    id: 'pipeline-deal-factory',
    name: 'Deal Factory',
    description: '12+ deals closed in one quarter',
    category: 'pipeline',
    icon: '🏭',
    tier: 'platinum',
    condition: 'Close 12+ deals in a single quarter',
    check: (s) => s.dealsClosedThisQuarter >= 12,
  },

  // ── Lanes ────────────────────────────────────────────────────────────────
  {
    id: 'lanes-uniforms',
    name: 'Uniforms',
    description: 'Close a uniforms deal',
    category: 'lanes',
    icon: '👕',
    tier: 'bronze',
    condition: 'Close a deal in the Uniforms lane',
    check: (s) => s.uniformsDealClosed,
  },
  {
    id: 'lanes-travel-gear',
    name: 'Travel Gear',
    description: 'Close a travel gear deal',
    category: 'lanes',
    icon: '🧳',
    tier: 'silver',
    condition: 'Close a deal in the Travel Gear lane',
    check: (s) => s.travelGearDealClosed,
  },
  {
    id: 'lanes-team-store',
    name: 'Team Store',
    description: 'Close a team store deal',
    category: 'lanes',
    icon: '🏪',
    tier: 'gold',
    condition: 'Close a deal in the Team Store lane',
    check: (s) => s.teamStoreDealClosed,
  },
  {
    id: 'lanes-letterman',
    name: 'Letterman',
    description: 'Close a letterman jacket deal',
    category: 'lanes',
    icon: '🧥',
    tier: 'platinum',
    condition: 'Close a deal in the Letterman lane',
    check: (s) => s.lettermanDealClosed,
  },
];

// ─── Storage Helpers ─────────────────────────────────────────────────────────

export function loadAchievements(): AchievementsStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.earned)) {
        return parsed as AchievementsStore;
      }
    }
  } catch {
    // corrupt data — reset
  }
  return { earned: [], lastCheck: new Date().toISOString() };
}

export function saveAchievements(store: AchievementsStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function hasBadge(badgeId: string): boolean {
  const store = loadAchievements();
  return store.earned.some((e) => e.badgeId === badgeId);
}

/** Returns badges earned during this check that weren't already in the store */
export function checkAndAwardBadges(stats: RepStats): Badge[] {
  const store = loadAchievements();
  const newlyEarned: Badge[] = [];

  for (const badge of ALL_BADGES) {
    if (store.earned.some((e) => e.badgeId === badge.id)) continue;
    if (badge.check(stats)) {
      store.earned.push({ badgeId: badge.id, earnedAt: new Date().toISOString() });
      newlyEarned.push(badge);
    }
  }

  if (newlyEarned.length > 0) {
    store.lastCheck = new Date().toISOString();
    saveAchievements(store);
  }

  return newlyEarned;
}

export function getEarnedBadges(): EarnedBadge[] {
  return loadAchievements().earned;
}

export function getBadgeById(id: string): Badge | undefined {
  return ALL_BADGES.find((b) => b.id === id);
}

/** Returns badges sorted by tier weight (platinum first) and then category */
export function getBadgeProgress(stats: RepStats): Array<{ badge: Badge; earned: boolean; progress: number }> {
  const earned = loadAchievements().earned;
  const earnedIds = new Set(earned.map((e) => e.badgeId));

  return ALL_BADGES.map((badge) => {
    const isEarned = earnedIds.has(badge.id);
    const progress = isEarned ? 100 : computeBadgeProgress(badge, stats);
    return { badge, earned: isEarned, progress };
  });
}

function computeBadgeProgress(badge: Badge, stats: RepStats): number {
  switch (badge.id) {
    case 'academy-rookie':
      return Math.min(100, (stats.quizModulesPassed / 1) * 100);
    case 'academy-scholar':
      return Math.min(100, (stats.quizModulesPassed / 5) * 100);
    case 'academy-level1':
      return stats.isLevel1Certified ? 100 : (stats.quizModulesPassed >= 5 ? 50 : 0);
    case 'academy-master':
      return stats.isLevel2Certified ? 100 : (stats.isLevel1Certified ? 50 : 0);

    case 'territory-first-school':
      return Math.min(100, (stats.organizationsCreated / 1) * 100);
    case 'territory-neighborhood':
      return Math.min(100, (stats.organizationsCreated / 10) * 100);
    case 'territory-city-builder':
      return Math.min(100, (stats.organizationsCreated / 25) * 100);
    case 'territory-metro-owner':
      return Math.min(100, (stats.organizationsCreated / 50) * 100);

    case 'pipeline-first-deal':
      return Math.min(100, (stats.activeOpportunities / 1) * 100);
    case 'pipeline-growing':
      return Math.min(100, (stats.activeOpportunities / 12) * 100);
    case 'pipeline-master':
      return Math.min(100, (stats.dealsClosedThisMonth / 4) * 100);
    case 'pipeline-deal-factory':
      return Math.min(100, (stats.dealsClosedThisQuarter / 12) * 100);

    case 'lanes-uniforms':
      return stats.uniformsDealClosed ? 100 : 0;
    case 'lanes-travel-gear':
      return stats.travelGearDealClosed ? 100 : 0;
    case 'lanes-team-store':
      return stats.teamStoreDealClosed ? 100 : 0;
    case 'lanes-letterman':
      return stats.lettermanDealClosed ? 100 : 0;

    default:
      return 0;
  }
}

export function getTierColor(tier: BadgeTier): string {
  switch (tier) {
    case 'platinum':
      return 'border-purple-400 bg-purple-500/10 text-purple-200';
    case 'gold':
      return 'border-yellow-400 bg-yellow-500/10 text-yellow-200';
    case 'silver':
      return 'border-slate-300 bg-slate-400/10 text-slate-200';
    case 'bronze':
      return 'border-amber-600 bg-amber-700/10 text-amber-300';
  }
}

export function getCategoryLabel(category: BadgeCategory): string {
  switch (category) {
    case 'academy':
      return 'Academy';
    case 'territory':
      return 'Territory';
    case 'pipeline':
      return 'Pipeline';
    case 'lanes':
      return 'Lanes';
  }
}

export function getCategoryColor(category: BadgeCategory): string {
  switch (category) {
    case 'academy':
      return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200';
    case 'territory':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
    case 'pipeline':
      return 'border-blue-500/30 bg-blue-500/10 text-blue-200';
    case 'lanes':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  }
}
