export declare enum AcademyV3Phase {
    PHASE_1_FOUNDATIONS = "phase_1",
    PHASE_2_CRM_WALKTHROUGH = "phase_2",
    PHASE_3_TERRITORY_SANDBOX = "phase_3",
    PHASE_4_SALES_EXECUTION = "phase_4",
    PHASE_5_GRADUATION = "phase_5"
}
export declare enum LeadStatus {
    UNCLAIMED = "unclaimed",
    CLAIMED = "claimed",
    ACTIVE = "active",
    CLOSED = "closed",
    STALE = "stale"
}
export declare enum ActivityType {
    CALL = "call",
    EMAIL = "email",
    MEETING = "meeting",
    VISIT = "visit",
    ROLE_PLAY = "role_play",
    PITCH = "pitch"
}
export declare enum SalesExecutionType {
    PHONE_CALL = "phone_call",
    EMAIL_PITCH = "email_pitch",
    OBJECTION_HANDLING = "objection_handling",
    ROLE_PLAY = "role_play",
    SHADOW_SESSION = "shadow_session"
}
export declare enum QualityCheckType {
    MIN_FIELDS = "min_fields",
    SOURCE_CITATION = "source_citation",
    DUPLICATE_DETECTION = "duplicate_detection",
    RESEARCH_DEPTH = "research_depth",
    VERIFICATION = "verification"
}
export declare enum AuditType {
    RANDOM = "random",
    TARGETED = "targeted",
    GRADUATION = "graduation"
}
export interface SandboxOrgRow {
    id: number;
    user_id: number;
    name: string;
    website: string | null;
    physical_address: string | null;
    enrollment: number | null;
    sports_programs: string[];
    current_provider: string | null;
    research_notes: string | null;
    source_url: string | null;
    source_citation: string | null;
    verified: boolean;
    lead_status: LeadStatus;
    promoted_to_production: boolean;
    promoted_at: string | null;
    promoted_by: number | null;
    created_at: string;
    updated_at: string;
}
export interface SandboxContactRow {
    id: number;
    user_id: number;
    sandbox_org_id: number;
    full_name: string;
    title: string | null;
    email: string | null;
    phone: string | null;
    is_decision_maker: boolean;
    source_citation: string | null;
    verified: boolean;
    created_at: string;
    updated_at: string;
}
export interface SandboxOpportunityRow {
    id: number;
    user_id: number;
    sandbox_org_id: number;
    sandbox_contact_id: number | null;
    name: string;
    estimated_value: number;
    target_close_date: string | null;
    lane: string;
    stage: string;
    sport: string | null;
    notes: string | null;
    source_citation: string | null;
    created_at: string;
    updated_at: string;
}
export interface SandboxActivityRow {
    id: number;
    user_id: number;
    sandbox_org_id: number | null;
    sandbox_opp_id: number | null;
    activity_type: ActivityType;
    description: string | null;
    notes: string | null;
    template_used: string | null;
    scheduled_at: string;
    created_at: string;
    updated_at: string;
}
export interface SalesExecutionRow {
    id: number;
    user_id: number;
    execution_type: SalesExecutionType;
    sandbox_org_id: number | null;
    sandbox_opp_id: number | null;
    notes: string;
    objection_handled: string | null;
    feedback: string | null;
    mentor_id: number | null;
    score: number | null;
    completed_at: string;
    created_at: string;
}
export interface LeadTaxonomyRow {
    id: number;
    existing_lead_id: number | null;
    lead_name: string;
    lead_status: LeadStatus;
    claimed_by: number | null;
    claimed_at: string | null;
    territory_locked_at: string | null;
    duplicate_cluster_id: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}
export interface QualityCheckRow {
    id: number;
    user_id: number;
    entity_type: string;
    entity_id: number;
    check_type: QualityCheckType;
    passed: boolean;
    details: Record<string, any>;
    checked_at: string;
    created_at: string;
}
export interface VerificationAuditRow {
    id: number;
    user_id: number;
    entity_type: string;
    entity_id: number;
    auditor_id: number;
    audit_type: AuditType;
    passed: boolean | null;
    findings: string | null;
    audited_at: string;
    created_at: string;
}
export interface GraduationRow {
    id: number;
    user_id: number;
    phase1_completed: boolean;
    phase2_completed: boolean;
    phase3_completed: boolean;
    phase4_completed: boolean;
    phase5_completed: boolean;
    orgs_quality_count: number;
    contacts_quality_count: number;
    opps_quality_count: number;
    activities_quality_count: number;
    sales_executions_count: number;
    all_gates_passed: boolean;
    director_approved: boolean;
    approved_by: number | null;
    approved_at: string | null;
    mentor_id: number | null;
    data_promoted_at: string | null;
    created_at: string;
    updated_at: string;
}
export interface QuizAttemptRow {
    id: number;
    user_id: number;
    quiz_id: string;
    score: number;
    passed: boolean;
    answers: number[];
    attempted_at: string;
    created_at: string;
}
export interface WalkthroughStepRow {
    id: number;
    user_id: number;
    step_id: string;
    completed: boolean;
    completed_at: string | null;
    created_at: string;
}
export interface CohortRow {
    id: number;
    cohort_name: string;
    max_size: number;
    territory_zone: string;
    starts_at: string;
    ends_at: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface GraduationStatus {
    phase1: {
        completed: boolean;
    };
    phase2: {
        completed: boolean;
    };
    phase3: {
        completed: boolean;
    };
    phase4: {
        completed: boolean;
    };
    phase5: {
        completed: boolean;
    };
    gates: {
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
        opps: {
            current: number;
            required: number;
            met: boolean;
        };
        activities: {
            current: number;
            required: number;
            met: boolean;
        };
        sales_executions: {
            current: number;
            required: number;
            met: boolean;
        };
        directorApproved: {
            met: boolean;
        };
    };
    all_passed: boolean;
    ready_to_graduate: boolean;
}
export interface Phase1Status {
    completed: boolean;
    quizzes: {
        quizId: string;
        name: string;
        score: number | null;
        passed: boolean;
        attemptedAt: string | null;
    }[];
}
export interface Phase2Status {
    completed: boolean;
    steps: {
        stepId: string;
        label: string;
        description: string;
        completed: boolean;
        completedAt: string | null;
    }[];
}
export interface SandboxSummary {
    orgs: number;
    contacts: number;
    opportunities: number;
    activities: number;
    sales_executions: number;
    quality_checks_passed: number;
}
export interface LeadClaimResult {
    lead: LeadTaxonomyRow;
    sandboxOrg: SandboxOrgRow | null;
    alreadyClaimed: boolean;
    claimedBy: number | null;
}
export declare const GRADUATION_REQUIREMENTS: {
    readonly orgs: {
        readonly min_count: 5;
        readonly quality_checks: readonly ["verified_website", "physical_address", "research_notes_200_chars", "source_url"];
    };
    readonly contacts: {
        readonly min_count: 15;
        readonly quality_checks: readonly ["full_name", "title", "verified_email_or_phone", "source_citation"];
    };
    readonly opps: {
        readonly min_count: 5;
        readonly quality_checks: readonly ["non_zero_value", "target_close_date", "lane_set", "stage_set", "has_notes"];
    };
    readonly activities: {
        readonly min_count: 15;
        readonly quality_checks: readonly ["min_3_calls_with_notes", "min_5_emails_with_templates"];
    };
    readonly sales_executions: {
        readonly min_count: 3;
        readonly quality_checks: readonly ["min_1_phone_call", "min_1_sent_pitch", "min_1_objection_handling"];
    };
};
export declare const PHASE_1_QUIZZES: {
    quizId: string;
    name: string;
    questionCount: number;
}[];
export declare const CRM_WALKTHROUGH_STEPS: {
    stepId: string;
    label: string;
    description: string;
}[];
export interface SandboxMissionDefinition {
    missionNumber: number;
    title: string;
    description: string;
    instructions: string;
    requiredActions: string[];
    qualityChecks: {
        type: QualityCheckType;
        description: string;
    }[];
}
export declare const PHASE_3_MISSIONS_V3: SandboxMissionDefinition[];
export interface SalesExecutionMissionDefinition {
    missionNumber: number;
    title: string;
    description: string;
    instructions: string;
    executionType: SalesExecutionType;
}
export declare const PHASE_4_MISSIONS: SalesExecutionMissionDefinition[];
//# sourceMappingURL=academy-v2.interface.d.ts.map