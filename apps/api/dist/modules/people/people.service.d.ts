export declare const PIPELINE_STAGES: readonly ["application", "interview", "offer", "acceptance", "documents", "account_created", "academy", "certified", "territory_assigned", "pipeline_assigned", "first_appointment", "first_proposal", "first_order"];
export declare const STAGE_LABELS: Record<string, string>;
export declare function getPipelineCandidates(filters?: {
    stage?: string;
    status?: string;
    assigned_hr?: string;
}): Promise<any[]>;
export declare function createPipelineCandidate(data: {
    candidate_name: string;
    email?: string;
    phone?: string;
    role?: string;
    territory?: string;
    assigned_director?: string;
    notes?: string;
    created_by: number;
}): Promise<any>;
export declare function advancePipelineStage(id: number, stage: string, notes?: string): Promise<any>;
export declare function getPipelineStats(): Promise<Record<string, number>>;
//# sourceMappingURL=people.service.d.ts.map