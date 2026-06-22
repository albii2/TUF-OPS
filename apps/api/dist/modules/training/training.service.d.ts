import { TrainingModule, TrainingEnrollment, TrainingProgress, TrainingRole, TrainingPhase, TrainingEnrollmentWithProgress } from './training.interface';
export declare function getModulesByRole(role: TrainingRole, phase?: TrainingPhase): Promise<TrainingModule[]>;
export declare function enrollUserInTraining(userId: number, role: TrainingRole): Promise<TrainingEnrollment>;
export declare function getEnrollmentWithProgress(enrollmentId: number): Promise<TrainingEnrollmentWithProgress>;
export declare function markModuleStarted(enrollmentId: number, moduleId: number): Promise<TrainingProgress>;
export declare function markModuleCompleted(enrollmentId: number, moduleId: number, timeSpentSeconds?: number): Promise<{
    progress: TrainingProgress;
    enrollment: TrainingEnrollment;
}>;
export declare function checkAndUpdateCertification(userId: number): Promise<boolean>;
export declare function toggleHrDocs(userId: number, hrDocsCompleted: boolean): Promise<any>;
export declare function togglePracticalExercise(userId: number, practicalExerciseCompleted: boolean): Promise<any>;
export declare function toggleDirectorSignoff(userId: number, directorSignedOff: boolean): Promise<any>;
export declare function submitModuleAssessment(enrollmentId: number, moduleId: number, answers: string[]): Promise<any>;
export declare function resolveUserId(id: string | number): Promise<number>;
export declare function getCertificationStatus(userId: number | string): Promise<any>;
export declare function getEnrollmentById(enrollmentId: number): Promise<TrainingEnrollment>;
export declare function getUserEnrollment(userId: number): Promise<TrainingEnrollment | null>;
export declare function getProgressByEnrollment(enrollmentId: number): Promise<TrainingProgress[]>;
export declare function recordFrictionPoint(enrollmentId: number, frictionPointText: string, moduleId?: number, resolutionText?: string): Promise<void>;
export declare function getFrictionPoints(): Promise<any[]>;
//# sourceMappingURL=training.service.d.ts.map