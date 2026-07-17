export type TrainingPhase = typeof ACADEMY_PHASES[number];
export interface TrainingModule {
    id: number;
    title: string;
    description?: string;
    role: string;
    phase: string;
    order_index: number;
    content_markdown: string;
    estimated_duration_minutes?: number;
    module_type: string;
    quiz_json?: Array<{
        question: string;
        options: string[];
        correctAnswer: string;
    }>;
    passing_score?: number;
    created_at: string;
    updated_at: string;
}
export interface TrainingEnrollment {
    id: number | string;
    user_id: number | string;
    role: string;
    status: string;
    current_phase: string;
    enrolled_at: string;
    completed_at?: string;
    created_at: string;
    updated_at: string;
}
export interface TrainingProgress {
    id: number;
    enrollment_id: number | string;
    module_id: number;
    status: string;
    started_at?: string;
    completed_at?: string;
    time_spent_seconds: number;
    created_at: string;
    updated_at: string;
}
export interface TrainingEnrollmentWithProgress {
    enrollment: TrainingEnrollment;
    modules: TrainingModule[];
    progress: TrainingProgress[];
    completionMetrics: {
        totalModules: number;
        completedModules: number;
        percentComplete: number;
        phaseCompletionStatus: Record<string, {
            completed: number;
            total: number;
            percentComplete: number;
        }>;
    };
}
export declare const ACADEMY_PHASES: readonly ["LEVEL_1_OPERATOR", "LEVEL_2_PRODUCT"];
export declare const ACADEMY_PHASE_LABELS: Record<string, string>;
export declare const ACADEMY_CERTIFICATION_LABELS: Record<string, string>;
export declare function useTrainingEnrollment(userId: number | string): {
    enrollment: TrainingEnrollmentWithProgress | null;
    loading: boolean;
    error: string | null;
};
export declare function useTrainingModule(moduleId: number, enrollmentId: number | string): {
    moduleData: {
        module: TrainingModule;
        progress: TrainingProgress | undefined;
    } | null;
    loading: boolean;
    startModule: () => Promise<any>;
    completeModule: (timeSpentSeconds?: number) => Promise<any>;
    submitQuiz: (answers: string[]) => Promise<any>;
};
//# sourceMappingURL=useTrainingEnrollment.d.ts.map