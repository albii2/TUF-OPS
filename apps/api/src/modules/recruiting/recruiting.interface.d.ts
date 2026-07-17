export type CandidateStage = 'applied' | 'screening' | 'interview_scheduled' | 'interview_complete' | 'offer_extended' | 'offer_accepted' | 'activated' | 'academy' | 'certified' | 'territory_assigned' | 'active_tae' | 'rejected';
export type CandidateSource = 'indeed' | 'linkedin' | 'referral' | 'website' | 'other';
export type OfferStatus = 'pending' | 'sent' | 'accepted' | 'declined';
export interface Candidate {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    source: CandidateSource;
    stage: CandidateStage;
    position_applied: string | null;
    position_recommended: string | null;
    assigned_recruiter: string | null;
    assigned_director_id: number | null;
    territory_id: number | null;
    resume_url: string | null;
    notes: string | null;
    interview_date: string | null;
    interview_notes: string | null;
    interview_scorecard: Record<string, number> | null;
    offer_status: OfferStatus | null;
    offer_date: string | null;
    offer_details: Record<string, unknown> | null;
    certification_progress: Record<string, number> | null;
    user_id: number | null;
    created_by: number | null;
    created_at: string;
    updated_at: string;
}
export interface CandidateActivity {
    id: number;
    candidate_id: number;
    type: string;
    description: string | null;
    created_by: number | null;
    created_at: string;
}
export interface CreateCandidateInput {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    source?: CandidateSource;
    position_applied?: string;
    position_recommended?: string;
    assigned_recruiter?: string;
    notes?: string;
    assigned_director_id?: number;
    created_by?: number;
}
export interface UpdateCandidateInput {
    stage?: CandidateStage;
    assigned_director_id?: number;
    territory_id?: number;
    position_applied?: string;
    position_recommended?: string;
    assigned_recruiter?: string;
    notes?: string;
    interview_date?: string;
    interview_notes?: string;
    interview_scorecard?: Record<string, number>;
    offer_status?: OfferStatus;
    offer_date?: string;
    offer_details?: Record<string, unknown>;
    certification_progress?: Record<string, number>;
}
export declare const STAGE_ORDER: CandidateStage[];
export declare const STAGE_LABELS: Record<CandidateStage, string>;
//# sourceMappingURL=recruiting.interface.d.ts.map