export declare enum AcademyMissionStatus {
    LOCKED = "locked",
    AVAILABLE = "available",
    IN_PROGRESS = "in_progress",
    SUBMITTED = "submitted",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare enum DirectorReviewStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare enum AcademyPhase {
    PHASE_1_FOUNDATIONS = "phase_1",
    PHASE_2_CRM = "phase_2",
    PHASE_3_TERRITORY = "phase_3"
}
export interface AcademyProgressRow {
    id: number;
    user_id: number;
    phase1_completed: boolean;
    phase2_completed: boolean;
    phase3_completed: boolean;
    graduated: boolean;
    director_approved: boolean;
    approved_by: number | null;
    approved_at: string | null;
    started_at: string;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}
export interface AcademyMissionRow {
    id: number;
    user_id: number;
    mission_number: number;
    title: string;
    description: string | null;
    status: AcademyMissionStatus;
    started_at: string | null;
    submitted_at: string | null;
    completed_at: string | null;
    rejection_reason: string | null;
    created_at: string;
    updated_at: string;
}
export interface DirectorReviewRow {
    id: number;
    mission_id: number;
    reviewer_id: number;
    status: DirectorReviewStatus;
    strengths: string | null;
    corrections: string | null;
    coaching_notes: string | null;
    reviewed_at: string | null;
    created_at: string;
    updated_at: string;
}
export interface AcademyChecklistRow {
    id: number;
    user_id: number;
    orgs_created: number;
    orgs_required: number;
    contacts_added: number;
    contacts_required: number;
    opportunities_created: number;
    opportunities_required: number;
    activities_logged: number;
    activities_required: number;
    all_opps_have_details: boolean;
    territory_approved: boolean;
    last_synced_at: string | null;
    created_at: string;
    updated_at: string;
}
export interface AcademyProgressResponse {
    progress: AcademyProgressRow | null;
    missions: AcademyMissionRow[];
    checklist: AcademyChecklistRow | null;
    graduationReady: boolean;
    missingRequirements: string[];
}
export interface MissionWithReview extends AcademyMissionRow {
    latestReview: DirectorReviewRow | null;
}
export interface GraduationCheck {
    passed: boolean;
    requirements: {
        orgs: {
            current: number;
            required: number;
            met: boolean;
        };
        contacts: {
            current: number;
            required: number;
            met: boolean;
        };
        opportunities: {
            current: number;
            required: number;
            met: boolean;
        };
        activities: {
            current: number;
            required: number;
            met: boolean;
        };
        oppDetails: {
            met: boolean;
        };
        territoryApproved: {
            met: boolean;
        };
    };
}
export interface MissionDefinition {
    mission_number: number;
    title: string;
    description: string;
    instructions: string;
    requiredActions: string[];
}
export declare const PHASE_3_MISSIONS: MissionDefinition[];
//# sourceMappingURL=academy.interface.d.ts.map