import type { Qualification, MetalTier, QualificationProgress } from '../lib/achievements';
interface QualificationBadgeProps {
    qualification: Qualification;
    earnedTier: MetalTier | null;
    progress?: QualificationProgress;
    size?: 'sm' | 'md' | 'lg';
}
export declare function QualificationBadge({ qualification, earnedTier, progress, size, }: QualificationBadgeProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=QualificationBadge.d.ts.map