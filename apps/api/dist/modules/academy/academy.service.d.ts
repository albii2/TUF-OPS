import { AcademyProgressRow, AcademyMissionRow, DirectorReviewRow, DirectorReviewStatus, AcademyChecklistRow, AcademyProgressResponse, MissionWithReview, GraduationCheck, AcademyPhase } from './academy.interface';
export declare function getOrCreateProgress(userId: number): Promise<AcademyProgressRow>;
export declare function getProgress(userId: number): Promise<AcademyProgressRow | null>;
export declare function updatePhaseCompletion(userId: number, phase: AcademyPhase, completed: boolean): Promise<AcademyProgressRow>;
export declare function getOrCreateMissions(userId: number): Promise<AcademyMissionRow[]>;
export declare function getMissions(userId: number): Promise<AcademyMissionRow[]>;
export declare function startMission(userId: number, missionNumber: number): Promise<AcademyMissionRow>;
export declare function submitMission(userId: number, missionNumber: number): Promise<AcademyMissionRow>;
export declare function getMissionsWithReviews(userId: number): Promise<MissionWithReview[]>;
export declare function createReview(missionId: number, reviewerId: number, status: DirectorReviewStatus, strengths: string, corrections: string, coachingNotes: string): Promise<DirectorReviewRow>;
export declare function getReviewsByMission(missionId: number): Promise<DirectorReviewRow[]>;
export declare function getOrCreateChecklist(userId: number): Promise<AcademyChecklistRow>;
export declare function getChecklist(userId: number): Promise<AcademyChecklistRow | null>;
export declare function syncChecklist(userId: number): Promise<AcademyChecklistRow>;
export declare function getGraduationCheck(userId: number): Promise<GraduationCheck>;
export declare function getFullProgress(userId: number): Promise<AcademyProgressResponse>;
export declare function directorApproveTerritory(userId: number, directorId: number): Promise<AcademyProgressRow>;
export declare function getPendingReviews(): Promise<MissionWithReview[]>;
//# sourceMappingURL=academy.service.d.ts.map