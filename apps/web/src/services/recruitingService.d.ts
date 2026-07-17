export type { Candidate, CandidateActivity, CreateCandidateInput } from '@tuf/shared';
export interface RecruitingDashboard {
    stages: {
        stage: string;
        count: number;
    }[];
    academy: {
        id: number;
        name: string;
        progress: Record<string, number>;
    }[];
}
export declare function getCandidates(params?: {
    stage?: string;
    director_id?: number;
    search?: string;
}): Promise<import('@tuf/shared').Candidate[]>;
export declare function getCandidate(id: number): Promise<import('@tuf/shared').Candidate>;
export declare function createCandidate(input: import('@tuf/shared').CreateCandidateInput): Promise<import('@tuf/shared').Candidate>;
export declare function updateCandidate(id: number, input: Partial<import('@tuf/shared').Candidate>): Promise<import('@tuf/shared').Candidate>;
export declare function getCandidateActivities(id: number): Promise<import('@tuf/shared').CandidateActivity[]>;
export declare function getRecruitingDashboard(directorId?: number): Promise<RecruitingDashboard>;
export { STAGE_ORDER as STAGES, STAGE_LABELS } from '@tuf/shared';
export declare const STAGE_COLORS: Record<string, string>;
//# sourceMappingURL=recruitingService.d.ts.map