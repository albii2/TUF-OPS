export type AcademyEventType = 'LOGIN' | 'MODULE_OPENED' | 'QUIZ_ATTEMPTED' | 'QUIZ_PASSED' | 'QUIZ_FAILED' | 'MODULE_ACKNOWLEDGED' | 'MISSION_STATEMENT_SAVED' | 'COACH_REVIEW_RECEIVED' | 'PAGE_VISITED';
export type AcademyActivityEvent = {
    id: number;
    user_id: number;
    event_type: AcademyEventType;
    entity_type: string | null;
    entity_id: number | null;
    metadata: Record<string, unknown>;
    created_at: string;
};
export type ParticipantStatus = 'ON_TRACK' | 'NEEDS_ATTENTION' | 'STALLED' | 'AWAITING_REVIEW' | 'ACADEMY_COMPLETE' | 'CERTIFIED';
export type ParticipantSummary = {
    userId: number;
    name: string;
    email: string;
    role: string;
    territory: string | null;
    cohort: string | null;
    enrollmentDate: string | null;
    currentPhase: string;
    currentModule: string | null;
    completionPercent: number;
    academyStatus: ParticipantStatus;
    lastLogin: string | null;
    loginCount: number;
    lastAcademyActivity: string | null;
    lastSalesActivity: string | null;
    daysSinceMeaningfulActivity: number;
    knowledgeProgress: number;
    productionProgress: number;
    prospectsCreated: number;
    outreachAttempts: number;
    meetings: number;
    opportunities: number;
    orders: number;
    pipelineValue: number;
    certificationStatus: string;
    isCertified: boolean;
    certifiedAt: string | null;
    certifiedBy: number | null;
    academyVersion: string | null;
};
export type ParticipantDetail = ParticipantSummary & {
    territory: string | null;
    stateMarket: string | null;
    division: string | null;
    rank: string | null;
    phaseProgress: Record<string, {
        completed: number;
        total: number;
    }>;
    moduleProgress: Array<{
        module_id: number;
        title: string;
        phase: string;
        order_index: number;
        status: string | null;
        started_at: string | null;
        completed_at: string | null;
        score: number | null;
        passed: boolean | null;
        last_attempt: string | null;
    }>;
    quizResults: Array<{
        module: string;
        score: number;
        passed: boolean;
        attempts: number;
        lastAttempt: string | null;
    }>;
    coachReviews: Array<{
        module: string;
        reviewedBy: string;
        reviewedAt: string | null;
    }>;
    acknowledgments: number;
    recentActivity: AcademyActivityEvent[];
    organizationsCount: number;
    opportunitiesByStage: Record<string, number>;
    activitiesByType: Record<string, number>;
    hrDocsCompleted: boolean;
    directorSignedOff: boolean;
    practicalExerciseCompleted: boolean;
    certificationDate: string | null;
    attentionFlags: string[];
};
export type ExecutiveSummary = {
    activeCohort: {
        totalEnrolled: number;
        activeThisWeek: number;
        stalled: number;
        academyComplete: number;
        certificationPending: number;
        certified: number;
    };
    averageCohortProgress: number;
    totalProspectingActivity: number;
    meetingsGenerated: number;
    qualifiedOpportunitiesCreated: number;
    ordersGenerated: number;
    participants: ParticipantSummary[];
    attentionRequired: ParticipantSummary[];
    recentActivity: Array<{
        id: number;
        userName: string;
        eventType: string;
        description: string;
        timestamp: string;
    }>;
};
export type LogEventPayload = {
    event_type: AcademyEventType;
    entity_type?: string;
    entity_id?: number;
    metadata?: Record<string, unknown>;
};
//# sourceMappingURL=academy-command.interface.d.ts.map