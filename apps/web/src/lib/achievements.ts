/**
 * TUF Ops Qualification System
 *
 * Military-inspired qualification badges across 6 collections.
 * Metal tiers: Bronze → Silver → Gold → Black (highest).
 * Storage: localStorage key 'tuf_ops_qualifications_v1'
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type CollectionId =
  | 'academy'
  | 'activity'
  | 'sales'
  | 'territory'
  | 'lane'
  | 'leadership'
  | 'executive';

export type MetalTier = 'bronze' | 'silver' | 'gold' | 'black';

export interface TierThreshold {
  tier: MetalTier;
  required: number;
  /** Human-readable value for the progress bar (e.g. "10", "10/10") */
  label: string;
}

export interface Qualification {
  id: string;
  name: string;
  collection: CollectionId;
  description: string;
  condition: string; // human-readable
  /** Shape identifier for rendering */
  shape: 'shield' | 'chevron' | 'hexagon' | 'compass' | 'diamond' | 'star';
  /** Collection accent color */
  accent: string;
  /** Tier progression thresholds — ALL 4 tiers for every badge */
  tiers: TierThreshold[];
  /** Compute earned tier based on stats (null if none earned) */
  check: (stats: RepStats) => { tier: MetalTier; value: number } | null;
}

export interface RepStats {
  // Academy
  quizModulesPassed: number;
  isLevel1Certified: boolean;
  isLevel2Certified: boolean;
  isDirector: boolean;

  // Activity
  prospectingActivities: number;
  activeOpportunities: number;
  followUpActivities: number;
  ordersThisMonth: number;
  consecutiveMonthsWithOrders: number;

  // Sales
  totalClosedAmount: number;
  ordersClosed: number;

  // Territory
  organizationsCreated: number;
  territoryCoveragePercent: number;
  territoryPenetrationPercent: number;
  organizationsWithThreeSports: number;

  // Lane
  uniformsDealClosed: boolean;
  travelGearDealClosed: boolean;
  teamStoreDealClosed: boolean;
  lettermanDealClosed: boolean;

  // Leadership
  dealsAssisted: number;
  repsCertified: number;
  territoryGrowthPercent: number;
  pipelineHealthPercent: number;
  territoriesProfitable: number;

  // Executive (VP)
  regionalDirectorsHired: number;
  statesOperational: number;
  seniorLeadershipPromoted: boolean;
}

export interface EarnedQualification {
  qualificationId: string;
  tier: MetalTier;
  earnedAt: string; // ISO date string
}

export type QualificationsStore = {
  earned: EarnedQualification[];
  lastCheck: string;
};

const STORAGE_KEY = 'tuf_ops_qualifications_v1';

// ─── Collection Config ───────────────────────────────────────────────────────

export interface CollectionConfig {
  id: CollectionId;
  label: string;
  shape: 'shield' | 'chevron' | 'hexagon' | 'compass' | 'diamond' | 'star';
  accent: string;
  description: string;
}

export const COLLECTIONS: CollectionConfig[] = [
  { id: 'academy', label: 'Academy', shape: 'shield', accent: '#2563EB', description: 'Knowledge' },
  { id: 'activity', label: 'Activity', shape: 'chevron', accent: '#94A3B8', description: 'Daily Discipline' },
  { id: 'sales', label: 'Sales', shape: 'hexagon', accent: '#D97706', description: 'Production' },
  { id: 'territory', label: 'Territory', shape: 'compass', accent: '#059669', description: 'Ownership' },
  { id: 'lane', label: 'Lane', shape: 'diamond', accent: '#DC2626', description: 'Product Mastery' },
  { id: 'leadership', label: 'Leadership', shape: 'star', accent: '#1E293B', description: 'Responsibility' },
  { id: 'executive', label: 'Executive', shape: 'star', accent: '#D97706', description: 'Vision' },
];

// ─── Qualification Definitions ───────────────────────────────────────────────

export const ALL_QUALIFICATIONS: Qualification[] = [

  // ═══ ACADEMY (Shield, Blue #2563EB) ════════════════════════════════════

  {
    id: 'academy-foundation',
    name: 'FOUNDATION',
    collection: 'academy',
    description: 'Complete Module 1',
    condition: 'Complete Module 1 (ACAD-101)',
    shape: 'shield',
    accent: '#2563EB',
    tiers: [
      { tier: 'bronze', required: 1, label: '1/1' },
      { tier: 'silver', required: 3, label: '3/3' },
      { tier: 'gold', required: 5, label: '5/5' },
      { tier: 'black', required: 6, label: 'Black' },
    ],
    check: (s) => {
      if (s.quizModulesPassed >= 5) return { tier: 'gold', value: s.quizModulesPassed };
      if (s.quizModulesPassed >= 3) return { tier: 'silver', value: s.quizModulesPassed };
      if (s.quizModulesPassed >= 1) return { tier: 'bronze', value: s.quizModulesPassed };
      return null;
    },
  },
  {
    id: 'academy-scholar',
    name: 'SCHOLAR',
    collection: 'academy',
    description: 'Complete all 5 module quizzes',
    condition: 'Pass all 5 module quizzes',
    shape: 'shield',
    accent: '#2563EB',
    tiers: [
      { tier: 'bronze', required: 1, label: '1/5' },
      { tier: 'silver', required: 5, label: '5/5' },
      { tier: 'gold', required: 6, label: 'Gold' },
      { tier: 'black', required: 7, label: 'Black' },
    ],
    check: (s) => {
      if (s.quizModulesPassed >= 5) return { tier: 'silver', value: s.quizModulesPassed };
      if (s.quizModulesPassed >= 1) return { tier: 'bronze', value: s.quizModulesPassed };
      return null;
    },
  },
  {
    id: 'academy-certified-tae',
    name: 'CERTIFIED TAE',
    collection: 'academy',
    description: 'Level 1 Certification approved by Director',
    condition: 'Level 1 Certification',
    shape: 'shield',
    accent: '#2563EB',
    tiers: [
      { tier: 'bronze', required: 1, label: 'Provisional' },
      { tier: 'silver', required: 2, label: 'Silver' },
      { tier: 'gold', required: 3, label: 'Certified' },
      { tier: 'black', required: 4, label: 'Black' },
    ],
    check: (s) => {
      if (s.isLevel1Certified) return { tier: 'gold', value: 3 };
      if (s.quizModulesPassed >= 5) return { tier: 'silver', value: 2 };
      if (s.quizModulesPassed >= 1) return { tier: 'bronze', value: 1 };
      return null;
    },
  },
  {
    id: 'academy-senior-tae',
    name: 'SENIOR TAE',
    collection: 'academy',
    description: 'Level 2 Certification',
    condition: 'Level 2 Certification',
    shape: 'shield',
    accent: '#2563EB',
    tiers: [
      { tier: 'bronze', required: 1, label: 'Candidate' },
      { tier: 'silver', required: 2, label: 'Silver' },
      { tier: 'gold', required: 3, label: 'Gold' },
      { tier: 'black', required: 4, label: 'Senior' },
    ],
    check: (s) => {
      if (s.isLevel2Certified) return { tier: 'black', value: 4 };
      if (s.isLevel1Certified) return { tier: 'gold', value: 3 };
      return null;
    },
  },
  {
    id: 'academy-director',
    name: 'DIRECTOR',
    collection: 'academy',
    description: 'Promoted to Director',
    condition: 'Director Promotion',
    shape: 'shield',
    accent: '#2563EB',
    tiers: [
      { tier: 'bronze', required: 1, label: 'Rep' },
      { tier: 'silver', required: 2, label: 'Silver' },
      { tier: 'gold', required: 3, label: 'Gold' },
      { tier: 'black', required: 4, label: 'Director' },
    ],
    check: (s) => {
      if (s.isDirector) return { tier: 'black', value: 4 };
      return null;
    },
  },

  // ═══ ACTIVITY (Chevron, White/Silver #94A3B8) ══════════════════════════

  {
    id: 'activity-first-contact',
    name: 'FIRST CONTACT',
    collection: 'activity',
    description: 'Log first prospecting activity',
    condition: '1 prospecting activity',
    shape: 'chevron',
    accent: '#94A3B8',
    tiers: [
      { tier: 'bronze', required: 1, label: '1' },
      { tier: 'silver', required: 5, label: '5' },
      { tier: 'gold', required: 10, label: '10' },
      { tier: 'black', required: 25, label: '25' },
    ],
    check: (s) => {
      if (s.prospectingActivities >= 1) return { tier: 'bronze', value: s.prospectingActivities };
      return null;
    },
  },
  {
    id: 'activity-25-calls',
    name: '25 CALLS',
    collection: 'activity',
    description: '25 prospecting activities',
    condition: '25 prospecting activities',
    shape: 'chevron',
    accent: '#94A3B8',
    tiers: [
      { tier: 'bronze', required: 25, label: '25' },
      { tier: 'silver', required: 50, label: '50' },
      { tier: 'gold', required: 75, label: '75' },
      { tier: 'black', required: 100, label: '100' },
    ],
    check: (s) => {
      if (s.prospectingActivities >= 25) return { tier: 'bronze', value: s.prospectingActivities };
      return null;
    },
  },
  {
    id: 'activity-100-calls',
    name: '100 CALLS',
    collection: 'activity',
    description: '100 prospecting activities',
    condition: '100 prospecting activities',
    shape: 'chevron',
    accent: '#94A3B8',
    tiers: [
      { tier: 'bronze', required: 100, label: '100' },
      { tier: 'silver', required: 250, label: '250' },
      { tier: 'gold', required: 500, label: '500' },
      { tier: 'black', required: 750, label: '750' },
    ],
    check: (s) => {
      if (s.prospectingActivities >= 100) return { tier: 'silver', value: s.prospectingActivities };
      return null;
    },
  },
  {
    id: 'activity-500-calls',
    name: '500 CALLS',
    collection: 'activity',
    description: '500 prospecting activities',
    condition: '500 prospecting activities',
    shape: 'chevron',
    accent: '#94A3B8',
    tiers: [
      { tier: 'bronze', required: 500, label: '500' },
      { tier: 'silver', required: 750, label: '750' },
      { tier: 'gold', required: 1000, label: '1000' },
      { tier: 'black', required: 1500, label: '1500' },
    ],
    check: (s) => {
      if (s.prospectingActivities >= 500) return { tier: 'gold', value: s.prospectingActivities };
      return null;
    },
  },
  {
    id: 'activity-1000-calls',
    name: '1000 CALLS',
    collection: 'activity',
    description: '1000 prospecting activities',
    condition: '1000 prospecting activities',
    shape: 'chevron',
    accent: '#94A3B8',
    tiers: [
      { tier: 'bronze', required: 1000, label: '1000' },
      { tier: 'silver', required: 1500, label: '1500' },
      { tier: 'gold', required: 2000, label: '2000' },
      { tier: 'black', required: 2500, label: '2500' },
    ],
    check: (s) => {
      if (s.prospectingActivities >= 1000) return { tier: 'black', value: s.prospectingActivities };
      return null;
    },
  },
  {
    id: 'activity-pipeline-builder',
    name: 'PIPELINE BUILDER',
    collection: 'activity',
    description: '12+ active opportunities',
    condition: '12+ active opportunities',
    shape: 'chevron',
    accent: '#94A3B8',
    tiers: [
      { tier: 'bronze', required: 4, label: '4' },
      { tier: 'silver', required: 12, label: '12' },
      { tier: 'gold', required: 24, label: '24' },
      { tier: 'black', required: 48, label: '48' },
    ],
    check: (s) => {
      if (s.activeOpportunities >= 12) return { tier: 'silver', value: s.activeOpportunities };
      if (s.activeOpportunities >= 4) return { tier: 'bronze', value: s.activeOpportunities };
      return null;
    },
  },
  {
    id: 'activity-followup-specialist',
    name: 'FOLLOW-UP SPECIALIST',
    collection: 'activity',
    description: '50+ follow-up activities',
    condition: '50+ follow-up activities',
    shape: 'chevron',
    accent: '#94A3B8',
    tiers: [
      { tier: 'bronze', required: 10, label: '10' },
      { tier: 'silver', required: 25, label: '25' },
      { tier: 'gold', required: 50, label: '50' },
      { tier: 'black', required: 100, label: '100' },
    ],
    check: (s) => {
      if (s.followUpActivities >= 50) return { tier: 'gold', value: s.followUpActivities };
      if (s.followUpActivities >= 25) return { tier: 'silver', value: s.followUpActivities };
      if (s.followUpActivities >= 10) return { tier: 'bronze', value: s.followUpActivities };
      return null;
    },
  },
  {
    id: 'activity-consistency',
    name: 'CONSISTENCY',
    collection: 'activity',
    description: '4+ orders/month for 3 consecutive months',
    condition: '4+ orders/month × 3 months',
    shape: 'chevron',
    accent: '#94A3B8',
    tiers: [
      { tier: 'bronze', required: 1, label: '1 month' },
      { tier: 'silver', required: 2, label: '2 months' },
      { tier: 'gold', required: 3, label: '3 months' },
      { tier: 'black', required: 6, label: '6 months' },
    ],
    check: (s) => {
      if (s.consecutiveMonthsWithOrders >= 3) return { tier: 'gold', value: s.consecutiveMonthsWithOrders };
      if (s.consecutiveMonthsWithOrders >= 2) return { tier: 'silver', value: s.consecutiveMonthsWithOrders };
      if (s.consecutiveMonthsWithOrders >= 1) return { tier: 'bronze', value: s.consecutiveMonthsWithOrders };
      return null;
    },
  },

  // ═══ SALES (Hexagon, Gold #D97706) ═════════════════════════════════════

  {
    id: 'sales-first-win',
    name: 'FIRST WIN',
    collection: 'sales',
    description: 'Close first order',
    condition: '1 order closed',
    shape: 'hexagon',
    accent: '#D97706',
    tiers: [
      { tier: 'bronze', required: 1, label: '1' },
      { tier: 'silver', required: 5, label: '5' },
      { tier: 'gold', required: 25, label: '25' },
      { tier: 'black', required: 100, label: '100' },
    ],
    check: (s) => {
      if (s.ordersClosed >= 1) return { tier: 'bronze', value: s.ordersClosed };
      return null;
    },
  },
  {
    id: 'sales-10k',
    name: '$10K',
    collection: 'sales',
    description: '$10K total closed',
    condition: '$10,000 total closed',
    shape: 'hexagon',
    accent: '#D97706',
    tiers: [
      { tier: 'bronze', required: 10000, label: '$10K' },
      { tier: 'silver', required: 25000, label: '$25K' },
      { tier: 'gold', required: 50000, label: '$50K' },
      { tier: 'black', required: 75000, label: '$75K' },
    ],
    check: (s) => {
      if (s.totalClosedAmount >= 10000) return { tier: 'bronze', value: s.totalClosedAmount };
      return null;
    },
  },
  {
    id: 'sales-50k',
    name: '$50K',
    collection: 'sales',
    description: '$50K total closed',
    condition: '$50,000 total closed',
    shape: 'hexagon',
    accent: '#D97706',
    tiers: [
      { tier: 'bronze', required: 50000, label: '$50K' },
      { tier: 'silver', required: 100000, label: '$100K' },
      { tier: 'gold', required: 250000, label: '$250K' },
      { tier: 'black', required: 500000, label: '$500K' },
    ],
    check: (s) => {
      if (s.totalClosedAmount >= 50000) return { tier: 'silver', value: s.totalClosedAmount };
      return null;
    },
  },
  {
    id: 'sales-100k',
    name: '$100K',
    collection: 'sales',
    description: '$100K total closed',
    condition: '$100,000 total closed',
    shape: 'hexagon',
    accent: '#D97706',
    tiers: [
      { tier: 'bronze', required: 100000, label: '$100K' },
      { tier: 'silver', required: 250000, label: '$250K' },
      { tier: 'gold', required: 500000, label: '$500K' },
      { tier: 'black', required: 1000000, label: '$1M' },
    ],
    check: (s) => {
      if (s.totalClosedAmount >= 100000) return { tier: 'gold', value: s.totalClosedAmount };
      return null;
    },
  },
  {
    id: 'sales-250k',
    name: '$250K',
    collection: 'sales',
    description: '$250K total closed',
    condition: '$250,000 total closed',
    shape: 'hexagon',
    accent: '#D97706',
    tiers: [
      { tier: 'bronze', required: 250000, label: '$250K' },
      { tier: 'silver', required: 500000, label: '$500K' },
      { tier: 'gold', required: 750000, label: '$750K' },
      { tier: 'black', required: 1000000, label: '$1M' },
    ],
    check: (s) => {
      if (s.totalClosedAmount >= 250000) return { tier: 'gold', value: s.totalClosedAmount };
      return null;
    },
  },
  {
    id: 'sales-500k',
    name: '$500K',
    collection: 'sales',
    description: '$500K total closed',
    condition: '$500,000 total closed',
    shape: 'hexagon',
    accent: '#D97706',
    tiers: [
      { tier: 'bronze', required: 500000, label: '$500K' },
      { tier: 'silver', required: 750000, label: '$750K' },
      { tier: 'gold', required: 1000000, label: '$1M' },
      { tier: 'black', required: 1500000, label: '$1.5M' },
    ],
    check: (s) => {
      if (s.totalClosedAmount >= 500000) return { tier: 'black', value: s.totalClosedAmount };
      return null;
    },
  },
  {
    id: 'sales-1m-club',
    name: '$1M CLUB',
    collection: 'sales',
    description: '$1M total closed',
    condition: '$1,000,000 total closed',
    shape: 'hexagon',
    accent: '#D97706',
    tiers: [
      { tier: 'bronze', required: 1000000, label: '$1M' },
      { tier: 'silver', required: 2000000, label: '$2M' },
      { tier: 'gold', required: 3000000, label: '$3M' },
      { tier: 'black', required: 5000000, label: '$5M' },
    ],
    check: (s) => {
      if (s.totalClosedAmount >= 1000000) return { tier: 'black', value: s.totalClosedAmount };
      return null;
    },
  },

  // ═══ TERRITORY (Compass, Green #059669) ════════════════════════════════

  {
    id: 'territory-first-school',
    name: 'FIRST SCHOOL',
    collection: 'territory',
    description: 'Create first organization',
    condition: '1 organization',
    shape: 'compass',
    accent: '#059669',
    tiers: [
      { tier: 'bronze', required: 1, label: '1' },
      { tier: 'silver', required: 5, label: '5' },
      { tier: 'gold', required: 10, label: '10' },
      { tier: 'black', required: 25, label: '25' },
    ],
    check: (s) => {
      if (s.organizationsCreated >= 1) return { tier: 'bronze', value: s.organizationsCreated };
      return null;
    },
  },
  {
    id: 'territory-10-schools',
    name: '10 SCHOOLS',
    collection: 'territory',
    description: '10 organizations',
    condition: '10 organizations',
    shape: 'compass',
    accent: '#059669',
    tiers: [
      { tier: 'bronze', required: 10, label: '10' },
      { tier: 'silver', required: 25, label: '25' },
      { tier: 'gold', required: 50, label: '50' },
      { tier: 'black', required: 75, label: '75' },
    ],
    check: (s) => {
      if (s.organizationsCreated >= 10) return { tier: 'bronze', value: s.organizationsCreated };
      return null;
    },
  },
  {
    id: 'territory-25-schools',
    name: '25 SCHOOLS',
    collection: 'territory',
    description: '25 organizations',
    condition: '25 organizations',
    shape: 'compass',
    accent: '#059669',
    tiers: [
      { tier: 'bronze', required: 25, label: '25' },
      { tier: 'silver', required: 50, label: '50' },
      { tier: 'gold', required: 75, label: '75' },
      { tier: 'black', required: 100, label: '100' },
    ],
    check: (s) => {
      if (s.organizationsCreated >= 25) return { tier: 'silver', value: s.organizationsCreated };
      return null;
    },
  },
  {
    id: 'territory-50-schools',
    name: '50 SCHOOLS',
    collection: 'territory',
    description: '50 organizations',
    condition: '50 organizations',
    shape: 'compass',
    accent: '#059669',
    tiers: [
      { tier: 'bronze', required: 50, label: '50' },
      { tier: 'silver', required: 75, label: '75' },
      { tier: 'gold', required: 100, label: '100' },
      { tier: 'black', required: 150, label: '150' },
    ],
    check: (s) => {
      if (s.organizationsCreated >= 50) return { tier: 'gold', value: s.organizationsCreated };
      return null;
    },
  },
  {
    id: 'territory-full-coverage',
    name: 'FULL COVERAGE',
    collection: 'territory',
    description: '100% territory coverage',
    condition: '100% territory coverage',
    shape: 'compass',
    accent: '#059669',
    tiers: [
      { tier: 'bronze', required: 25, label: '25%' },
      { tier: 'silver', required: 50, label: '50%' },
      { tier: 'gold', required: 100, label: '100%' },
      { tier: 'black', required: 110, label: 'Black' },
    ],
    check: (s) => {
      if (s.territoryCoveragePercent >= 100) return { tier: 'gold', value: s.territoryCoveragePercent };
      if (s.territoryCoveragePercent >= 50) return { tier: 'silver', value: s.territoryCoveragePercent };
      if (s.territoryCoveragePercent >= 25) return { tier: 'bronze', value: s.territoryCoveragePercent };
      return null;
    },
  },
  {
    id: 'territory-master',
    name: 'TERRITORY MASTER',
    collection: 'territory',
    description: '75%+ territory penetration',
    condition: '75%+ penetration',
    shape: 'compass',
    accent: '#059669',
    tiers: [
      { tier: 'bronze', required: 25, label: '25%' },
      { tier: 'silver', required: 50, label: '50%' },
      { tier: 'gold', required: 75, label: '75%' },
      { tier: 'black', required: 90, label: '90%' },
    ],
    check: (s) => {
      if (s.territoryPenetrationPercent >= 75) return { tier: 'black', value: s.territoryPenetrationPercent };
      if (s.territoryPenetrationPercent >= 50) return { tier: 'silver', value: s.territoryPenetrationPercent };
      if (s.territoryPenetrationPercent >= 25) return { tier: 'bronze', value: s.territoryPenetrationPercent };
      return null;
    },
  },
  {
    id: 'territory-ecosystem-builder',
    name: 'ECOSYSTEM BUILDER',
    collection: 'territory',
    description: '50+ organizations with 3+ sports each',
    condition: '50 orgs × 3+ sports',
    shape: 'compass',
    accent: '#059669',
    tiers: [
      { tier: 'bronze', required: 10, label: '10' },
      { tier: 'silver', required: 25, label: '25' },
      { tier: 'gold', required: 35, label: '35' },
      { tier: 'black', required: 50, label: '50' },
    ],
    check: (s) => {
      if (s.organizationsWithThreeSports >= 50) return { tier: 'black', value: s.organizationsWithThreeSports };
      if (s.organizationsWithThreeSports >= 25) return { tier: 'silver', value: s.organizationsWithThreeSports };
      if (s.organizationsWithThreeSports >= 10) return { tier: 'bronze', value: s.organizationsWithThreeSports };
      return null;
    },
  },

  // ═══ LANE (Diamond, Red #DC2626) ═══════════════════════════════════════

  {
    id: 'lane-uniform-specialist',
    name: 'UNIFORM SPECIALIST',
    collection: 'lane',
    description: 'Close a uniforms deal',
    condition: 'Uniforms deal',
    shape: 'diamond',
    accent: '#DC2626',
    tiers: [
      { tier: 'bronze', required: 1, label: '1' },
      { tier: 'silver', required: 2, label: '2' },
      { tier: 'gold', required: 3, label: '3' },
      { tier: 'black', required: 4, label: '4' },
    ],
    check: (s) => {
      if (s.uniformsDealClosed) return { tier: 'bronze', value: 1 };
      return null;
    },
  },
  {
    id: 'lane-travel-gear',
    name: 'TRAVEL GEAR',
    collection: 'lane',
    description: 'Close a travel gear deal',
    condition: 'Travel gear deal',
    shape: 'diamond',
    accent: '#DC2626',
    tiers: [
      { tier: 'bronze', required: 1, label: '1' },
      { tier: 'silver', required: 2, label: '2' },
      { tier: 'gold', required: 3, label: '3' },
      { tier: 'black', required: 4, label: '4' },
    ],
    check: (s) => {
      if (s.travelGearDealClosed) return { tier: 'silver', value: 1 };
      return null;
    },
  },
  {
    id: 'lane-team-store',
    name: 'TEAM STORE',
    collection: 'lane',
    description: 'Close a team store deal',
    condition: 'Team store deal',
    shape: 'diamond',
    accent: '#DC2626',
    tiers: [
      { tier: 'bronze', required: 1, label: '1' },
      { tier: 'silver', required: 2, label: '2' },
      { tier: 'gold', required: 3, label: '3' },
      { tier: 'black', required: 4, label: '4' },
    ],
    check: (s) => {
      if (s.teamStoreDealClosed) return { tier: 'gold', value: 1 };
      return null;
    },
  },
  {
    id: 'lane-letterman',
    name: 'LETTERMAN',
    collection: 'lane',
    description: 'Close a letterman jacket deal',
    condition: 'Letterman deal',
    shape: 'diamond',
    accent: '#DC2626',
    tiers: [
      { tier: 'bronze', required: 1, label: '1' },
      { tier: 'silver', required: 2, label: '2' },
      { tier: 'gold', required: 3, label: '3' },
      { tier: 'black', required: 4, label: '4' },
    ],
    check: (s) => {
      if (s.lettermanDealClosed) return { tier: 'gold', value: 1 };
      return null;
    },
  },
  {
    id: 'lane-four-lane-operator',
    name: 'FOUR LANE OPERATOR',
    collection: 'lane',
    description: 'Close deals in all 4 lanes at one school',
    condition: 'All 4 lanes × 1 school',
    shape: 'diamond',
    accent: '#DC2626',
    tiers: [
      { tier: 'bronze', required: 1, label: '1 lane' },
      { tier: 'silver', required: 2, label: '2 lanes' },
      { tier: 'gold', required: 3, label: '3 lanes' },
      { tier: 'black', required: 4, label: 'All 4' },
    ],
    check: (s) => {
      const lanes = [s.uniformsDealClosed, s.travelGearDealClosed, s.teamStoreDealClosed, s.lettermanDealClosed].filter(Boolean).length;
      if (lanes >= 4) return { tier: 'black', value: lanes };
      if (lanes >= 3) return { tier: 'gold', value: lanes };
      if (lanes >= 2) return { tier: 'silver', value: lanes };
      if (lanes >= 1) return { tier: 'bronze', value: lanes };
      return null;
    },
  },

  // ═══ LEADERSHIP (Star, Black/Gold #1E293B) ═════════════════════════════

  {
    id: 'leadership-mentor',
    name: 'MENTOR',
    collection: 'leadership',
    description: 'Assist another rep on 5+ deals',
    condition: '5+ assisted deals',
    shape: 'star',
    accent: '#1E293B',
    tiers: [
      { tier: 'bronze', required: 1, label: '1' },
      { tier: 'silver', required: 5, label: '5' },
      { tier: 'gold', required: 15, label: '15' },
      { tier: 'black', required: 30, label: '30' },
    ],
    check: (s) => {
      if (s.dealsAssisted >= 5) return { tier: 'silver', value: s.dealsAssisted };
      if (s.dealsAssisted >= 1) return { tier: 'bronze', value: s.dealsAssisted };
      return null;
    },
  },
  {
    id: 'leadership-coach',
    name: 'COACH',
    collection: 'leadership',
    description: 'Promoted to Director + 2 reps certified',
    condition: 'Director + 2 certified reps',
    shape: 'star',
    accent: '#1E293B',
    tiers: [
      { tier: 'bronze', required: 1, label: 'Director' },
      { tier: 'silver', required: 2, label: '+1 rep' },
      { tier: 'gold', required: 3, label: '+2 reps' },
      { tier: 'black', required: 4, label: 'Master Coach' },
    ],
    check: (s) => {
      if (s.isDirector && s.repsCertified >= 2) return { tier: 'gold', value: s.repsCertified };
      if (s.isDirector && s.repsCertified >= 1) return { tier: 'silver', value: s.repsCertified };
      if (s.isDirector) return { tier: 'bronze', value: 1 };
      return null;
    },
  },
  {
    id: 'leadership-builder',
    name: 'BUILDER',
    collection: 'leadership',
    description: 'Territory grew 25%+ under direction',
    condition: '25%+ territory growth',
    shape: 'star',
    accent: '#1E293B',
    tiers: [
      { tier: 'bronze', required: 10, label: '10%' },
      { tier: 'silver', required: 20, label: '20%' },
      { tier: 'gold', required: 25, label: '25%' },
      { tier: 'black', required: 50, label: '50%' },
    ],
    check: (s) => {
      if (s.territoryGrowthPercent >= 25) return { tier: 'gold', value: s.territoryGrowthPercent };
      if (s.territoryGrowthPercent >= 20) return { tier: 'silver', value: s.territoryGrowthPercent };
      if (s.territoryGrowthPercent >= 10) return { tier: 'bronze', value: s.territoryGrowthPercent };
      return null;
    },
  },
  {
    id: 'leadership-directors-circle',
    name: "DIRECTOR'S CIRCLE",
    collection: 'leadership',
    description: 'Full team at 100% pipeline health',
    condition: '100% team pipeline health',
    shape: 'star',
    accent: '#1E293B',
    tiers: [
      { tier: 'bronze', required: 50, label: '50%' },
      { tier: 'silver', required: 75, label: '75%' },
      { tier: 'gold', required: 90, label: '90%' },
      { tier: 'black', required: 100, label: '100%' },
    ],
    check: (s) => {
      if (s.pipelineHealthPercent >= 100) return { tier: 'black', value: s.pipelineHealthPercent };
      if (s.pipelineHealthPercent >= 90) return { tier: 'gold', value: s.pipelineHealthPercent };
      if (s.pipelineHealthPercent >= 75) return { tier: 'silver', value: s.pipelineHealthPercent };
      if (s.pipelineHealthPercent >= 50) return { tier: 'bronze', value: s.pipelineHealthPercent };
      return null;
    },
  },
  {
    id: 'leadership-regional-builder',
    name: 'REGIONAL BUILDER',
    collection: 'leadership',
    description: 'Multiple territories profitable',
    condition: '2+ profitable territories',
    shape: 'star',
    accent: '#1E293B',
    tiers: [
      { tier: 'bronze', required: 1, label: '1' },
      { tier: 'silver', required: 2, label: '2' },
      { tier: 'gold', required: 3, label: '3' },
      { tier: 'black', required: 5, label: '5+' },
    ],
    check: (s) => {
      if (s.territoriesProfitable >= 2) return { tier: 'black', value: s.territoriesProfitable };
      if (s.territoriesProfitable >= 1) return { tier: 'bronze', value: s.territoriesProfitable };
      return null;
    },
  },
  // ═══ EXECUTIVE (Star, Black/Gold #D97706) ═══════════════════════════════════
  {
    id: 'exec-regional-architect',
    name: 'REGIONAL ARCHITECT',
    collection: 'executive',
    description: 'Hired your first Regional Director',
    condition: '1+ Regional Director hired',
    shape: 'star',
    accent: '#D97706',
    tiers: [
      { tier: 'bronze', required: 1, label: 'First' },
      { tier: 'silver', required: 2, label: '2' },
      { tier: 'gold', required: 3, label: '3' },
      { tier: 'black', required: 4, label: '4+' },
    ],
    check: (s) => {
      if (s.regionalDirectorsHired >= 4) return { tier: 'black', value: s.regionalDirectorsHired };
      if (s.regionalDirectorsHired >= 3) return { tier: 'gold', value: s.regionalDirectorsHired };
      if (s.regionalDirectorsHired >= 2) return { tier: 'silver', value: s.regionalDirectorsHired };
      if (s.regionalDirectorsHired >= 1) return { tier: 'bronze', value: s.regionalDirectorsHired };
      return null;
    },
  },
  {
    id: 'exec-midwest-builder',
    name: 'MIDWEST BUILDER',
    collection: 'executive',
    description: 'States operational across the Midwest',
    condition: '4 states operational',
    shape: 'star',
    accent: '#D97706',
    tiers: [
      { tier: 'bronze', required: 1, label: '1 state' },
      { tier: 'silver', required: 2, label: '2 states' },
      { tier: 'gold', required: 3, label: '3 states' },
      { tier: 'black', required: 4, label: '4 states' },
    ],
    check: (s) => {
      if (s.statesOperational >= 4) return { tier: 'black', value: s.statesOperational };
      if (s.statesOperational >= 3) return { tier: 'gold', value: s.statesOperational };
      if (s.statesOperational >= 2) return { tier: 'silver', value: s.statesOperational };
      if (s.statesOperational >= 1) return { tier: 'bronze', value: s.statesOperational };
      return null;
    },
  },
  {
    id: 'exec-senior-leadership',
    name: 'SENIOR LEADERSHIP',
    collection: 'executive',
    description: 'Promoted a Senior Regional Director — built the bench',
    condition: 'Promoted first Senior Regional Director',
    shape: 'star',
    accent: '#D97706',
    tiers: [
      { tier: 'bronze', required: 1, label: 'First' },
      { tier: 'silver', required: 2, label: '2' },
      { tier: 'gold', required: 3, label: '3' },
      { tier: 'black', required: 4, label: '4+' },
    ],
    check: (s) => {
      if (s.seniorLeadershipPromoted) return { tier: 'bronze', value: 1 };
      return null;
    },
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getQualificationById(id: string): Qualification | undefined {
  return ALL_QUALIFICATIONS.find((q) => q.id === id);
}

export function getQualificationsByCollection(collection: CollectionId): Qualification[] {
  return ALL_QUALIFICATIONS.filter((q) => q.collection === collection);
}

export function getCollectionConfig(collectionId: CollectionId): CollectionConfig {
  return COLLECTIONS.find((c) => c.id === collectionId)!;
}

export function getTierLabel(tier: MetalTier): string {
  switch (tier) {
    case 'bronze': return 'BRONZE';
    case 'silver': return 'SILVER';
    case 'gold': return 'GOLD';
    case 'black': return 'BLACK';
  }
}

export function getTierOrder(tier: MetalTier): number {
  switch (tier) {
    case 'bronze': return 0;
    case 'silver': return 1;
    case 'gold': return 2;
    case 'black': return 3;
  }
}

export function getCollectionColor(collectionId: CollectionId): string {
  const c = getCollectionConfig(collectionId);
  return c.accent;
}

// ─── Storage ─────────────────────────────────────────────────────────────────

export function loadQualifications(): QualificationsStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.earned)) {
        return parsed as QualificationsStore;
      }
    }
  } catch {
    // corrupt
  }
  return { earned: [], lastCheck: new Date().toISOString() };
}

export function saveQualifications(store: QualificationsStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getEarnedQualifications(): EarnedQualification[] {
  return loadQualifications().earned;
}

/**
 * Seed executive-level qualifications for the founder/VP account.
 * Called on login for the executive user to ensure their profile reflects
 * actual achievements: first TAE, $200K+, 50+ schools, community builder.
 */
export function seedExecutiveProfile(userId: string): void {
  const store = loadQualifications();
  const existing = new Set(store.earned.map((e) => e.qualificationId));
  const now = new Date().toISOString();

  const executiveBadges: EarnedQualification[] = [
    // Academy — certified at every level
    { qualificationId: 'acad-certified-tae', tier: 'gold', earnedAt: now },
    { qualificationId: 'acad-senior-tae', tier: 'black', earnedAt: now },
    // Activity — 1000+ calls, consistency
    { qualificationId: 'act-1000-calls', tier: 'black', earnedAt: now },
    { qualificationId: 'act-consistency', tier: 'gold', earnedAt: now },
    // Sales — $200K+ and counting
    { qualificationId: 'sales-first-win', tier: 'black', earnedAt: now },
    { qualificationId: 'sales-100k', tier: 'gold', earnedAt: now },
    { qualificationId: 'sales-250k', tier: 'gold', earnedAt: now },
    // Territory — 50 schools, ecosystem builder
    { qualificationId: 'territory-50-schools', tier: 'gold', earnedAt: now },
    { qualificationId: 'territory-ecosystem-builder', tier: 'black', earnedAt: now },
    // Lane — four lane operator
    { qualificationId: 'lane-four-lane-operator', tier: 'black', earnedAt: now },
    // Leadership — built the system
    { qualificationId: 'leadership-directors-circle', tier: 'black', earnedAt: now },
    { qualificationId: 'leadership-regional-builder', tier: 'black', earnedAt: now },
    // Executive — VP-level achievements
    { qualificationId: 'exec-regional-architect', tier: 'black', earnedAt: now },
    { qualificationId: 'exec-midwest-builder', tier: 'black', earnedAt: now },
    { qualificationId: 'exec-senior-leadership', tier: 'black', earnedAt: now },
  ];

  for (const badge of executiveBadges) {
    if (!existing.has(badge.qualificationId)) {
      store.earned.push(badge);
    }
  }

  store.lastCheck = now;
  saveQualifications(store);
}

export function getHighestEarnedTier(qualificationId: string): MetalTier | null {
  const store = loadQualifications();
  const entries = store.earned.filter((e) => e.qualificationId === qualificationId);
  if (entries.length === 0) return null;
  const maxOrder = Math.max(...entries.map((e) => getTierOrder(e.tier)));
  return (['bronze', 'silver', 'gold', 'black'] as MetalTier[])[maxOrder] ?? null;
}

// ─── Check & Award ───────────────────────────────────────────────────────────

export function checkAndAwardQualifications(stats: RepStats): Qualification[] {
  const store = loadQualifications();
  const newlyEarned: Qualification[] = [];

  for (const qual of ALL_QUALIFICATIONS) {
    const result = qual.check(stats);
    if (!result) continue;

    // Only award if tier is higher than previously earned
    const existing = store.earned.filter((e) => e.qualificationId === qual.id);
    const maxExistingOrder = existing.length > 0
      ? Math.max(...existing.map((e) => getTierOrder(e.tier)))
      : -1;

    const resultOrder = getTierOrder(result.tier);
    if (resultOrder > maxExistingOrder) {
      store.earned.push({
        qualificationId: qual.id,
        tier: result.tier,
        earnedAt: new Date().toISOString(),
      });
      newlyEarned.push(qual);
    }
  }

  if (newlyEarned.length > 0) {
    store.lastCheck = new Date().toISOString();
    saveQualifications(store);
  }

  return newlyEarned;
}

// ─── Progress Summary ────────────────────────────────────────────────────────

export interface QualificationProgress {
  qualification: Qualification;
  /** The highest tier currently earned (null if locked) */
  earnedTier: MetalTier | null;
  /** When the highest tier was earned */
  earnedAt: string | null;
  /** Tier-by-tier progress with 0-100% completion */
  tierProgress: Array<{
    tier: MetalTier;
    label: string;
    required: number;
    current: number;
    percent: number;
    unlocked: boolean;
  }>;
}

export function getQualificationProgress(
  stats: RepStats,
): QualificationProgress[] {
  const store = loadQualifications();
  const earnedMap = new Map<string, EarnedQualification[]>();
  for (const e of store.earned) {
    const list = earnedMap.get(e.qualificationId) ?? [];
    list.push(e);
    earnedMap.set(e.qualificationId, list);
  }

  return ALL_QUALIFICATIONS.map((qual) => {
    const earned = earnedMap.get(qual.id) ?? [];
    const maxOrder = earned.length > 0
      ? Math.max(...earned.map((e) => getTierOrder(e.tier)))
      : -1;
    const earnedTier: MetalTier | null = maxOrder >= 0
      ? (['bronze', 'silver', 'gold', 'black'] as MetalTier[])[maxOrder] ?? null
      : null;

    const earnedAt = earned.length > 0
      ? earned.reduce((latest, e) => e.earnedAt > latest ? e.earnedAt : latest, '')
      : null;

    // Build tier progress
    const checkResult = qual.check(stats);
    const currentValue = checkResult?.value ?? 0;

    const tierProgress = qual.tiers.map((t) => {
      const tOrder = getTierOrder(t.tier);
      const percent = t.required > 0
        ? Math.min(100, Math.round((currentValue / t.required) * 100))
        : 0;
      return {
        tier: t.tier,
        label: t.label,
        required: t.required,
        current: currentValue,
        percent,
        unlocked: maxOrder >= tOrder,
      };
    });

    return {
      qualification: qual,
      earnedTier,
      earnedAt,
      tierProgress,
    };
  });
}

export function getCollectionSummary(stats: RepStats): Array<{
  collection: CollectionConfig;
  total: number;
  earned: number;
  progress: QualificationProgress[];
}> {
  const allProgress = getQualificationProgress(stats);

  return COLLECTIONS.map((col) => {
    const colProgress = allProgress.filter((p) => p.qualification.collection === col.id);
    const earned = colProgress.filter((p) => p.earnedTier !== null).length;
    return {
      collection: col,
      total: colProgress.length,
      earned,
      progress: colProgress,
    };
  });
}
