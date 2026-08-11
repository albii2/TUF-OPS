import type { Candidate, CandidateActivity, CreateCandidateInput, UpdateCandidateInput } from '@tuf/shared';
export declare function createCandidate(input: CreateCandidateInput): Promise<Candidate>;
export declare function getCandidates(params: {
    stage?: string;
    director_id?: number;
    search?: string;
}): Promise<Candidate[]>;
export declare function getCandidateById(id: number): Promise<Candidate | null>;
export declare function updateCandidate(id: number, input: UpdateCandidateInput): Promise<Candidate | null>;
export declare function setResumeUrl(id: number, url: string): Promise<Candidate | null>;
export declare function getCandidateActivities(candidateId: number): Promise<CandidateActivity[]>;
export declare function getRecruitingDashboard(directorId?: number): Promise<{
    stages: {
        stage: string;
        count: number;
    }[];
    academy: {
        id: number;
        name: string;
        progress: any;
    }[];
}>;
//# sourceMappingURL=recruiting.service.d.ts.map