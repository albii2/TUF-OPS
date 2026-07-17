/**
 * TUF Ops Qualification System
 *
 * Military-inspired qualification badges across 6 collections.
 * Metal tiers: Bronze → Silver → Gold → Black (highest).
 * Storage: localStorage key 'tuf_ops_qualifications_v1'
 */
export type CollectionId = 'academy' | 'activity' | 'sales' | 'territory' | 'lane' | 'leadership' | 'executive';
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
    condition: string;
    /** Shape identifier for rendering */
    shape: 'shield' | 'chevron' | 'hexagon' | 'compass' | 'diamond' | 'star';
    /** Collection accent color */
    accent: string;
    /** Tier progression thresholds — ALL 4 tiers for every badge */
    tiers: TierThreshold[];
    /** Compute earned tier based on stats (null if none earned) */
    check: (stats: RepStats) => {
        tier: MetalTier;
        value: number;
    } | null;
}
export interface RepStats {
    quizModulesPassed: number;
    isLevel1Certified: boolean;
    isLevel2Certified: boolean;
    isDirector: boolean;
    prospectingActivities: number;
    activeOpportunities: number;
    followUpActivities: number;
    ordersThisMonth: number;
    consecutiveMonthsWithOrders: number;
    totalClosedAmount: number;
    ordersClosed: number;
    organizationsCreated: number;
    territoryCoveragePercent: number;
    territoryPenetrationPercent: number;
    organizationsWithThreeSports: number;
    uniformsDealClosed: boolean;
    travelGearDealClosed: boolean;
    teamStoreDealClosed: boolean;
    lettermanDealClosed: boolean;
    dealsAssisted: number;
    repsCertified: number;
    territoryGrowthPercent: number;
    pipelineHealthPercent: number;
    territoriesProfitable: number;
    regionalDirectorsHired: number;
    statesOperational: number;
    seniorLeadershipPromoted: boolean;
}
export interface EarnedQualification {
    qualificationId: string;
    tier: MetalTier;
    earnedAt: string;
}
export type QualificationsStore = {
    earned: EarnedQualification[];
    lastCheck: string;
};
export interface CollectionConfig {
    id: CollectionId;
    label: string;
    shape: 'shield' | 'chevron' | 'hexagon' | 'compass' | 'diamond' | 'star';
    accent: string;
    description: string;
}
export declare const COLLECTIONS: CollectionConfig[];
export declare const ALL_QUALIFICATIONS: Qualification[];
export declare function getQualificationById(id: string): Qualification | undefined;
export declare function getQualificationsByCollection(collection: CollectionId): Qualification[];
export declare function getCollectionConfig(collectionId: CollectionId): CollectionConfig;
export declare function getTierLabel(tier: MetalTier): string;
export declare function getTierOrder(tier: MetalTier): number;
export declare function getCollectionColor(collectionId: CollectionId): string;
export declare function loadQualifications(): QualificationsStore;
export declare function saveQualifications(store: QualificationsStore): void;
export declare function getEarnedQualifications(): EarnedQualification[];
/**
 * Seed executive-level qualifications for the founder/VP account.
 * Called on login for the executive user to ensure their profile reflects
 * actual achievements: first TAE, $200K+, 50+ schools, community builder.
 */
export declare function seedExecutiveProfile(userId: string): void;
export declare function getHighestEarnedTier(qualificationId: string): MetalTier | null;
export declare function checkAndAwardQualifications(stats: RepStats): Qualification[];
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
export declare function getQualificationProgress(stats: RepStats): QualificationProgress[];
export declare function getCollectionSummary(stats: RepStats): Array<{
    collection: CollectionConfig;
    total: number;
    earned: number;
    progress: QualificationProgress[];
}>;
//# sourceMappingURL=achievements.d.ts.map