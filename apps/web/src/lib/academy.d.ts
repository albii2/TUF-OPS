/**
 * TUF Academy — Module definitions, quizzes, Learn→Demonstrate→Coach Review→Deploy flow,
 * Director feedback loop, and "Level 1 Certified Territory Account Executive" title.
 *
 * Governing specs:
 *   docs/canon/SOS_v1.0.md Section 2.3 (Sales Philosophy)
 *   docs/canon/Academy_v1.0.md
 *
 * MODULE STRUCTURE:
 *   ACAD-101: The TUF Philosophy
 *   ACAD-102: Prospecting
 *   ACAD-103: Discovery
 *   ACAD-104: Proposal
 *   ACAD-105: Order Handoff
 *   ACAD-106: Product Knowledge
 *
 * PHASES PER MODULE:
 *   LEARN → DEMONSTRATE → COACH REVIEW → DEPLOY
 */
export type AcademyModuleCode = 'ACAD-101' | 'ACAD-102' | 'ACAD-103' | 'ACAD-104' | 'ACAD-105' | 'ACAD-106';
/**
 * Module phases reflecting the Learn → Demonstrate → Coach Review → Deploy flow.
 *
 * locked          — Previous module not yet acknowledged; cannot start.
 * learn           — Available to study and take the quiz.
 * quiz_passed     — Quiz passed; now move to Demonstrate.
 * demonstrate     — Rep performs real work (auto-detected); exercise in progress.
 * awaiting_coach  — Exercise complete; waiting for Director to provide Coach Review.
 * coach_review    — Director has provided feedback; rep must ACKNOWLEDGE.
 * acknowledged    — Rep acknowledged Coach Review; module complete. Next module unlocks.
 * certified       — All modules acknowledged → DEPLOY → Level 1 Certified TAE.
 */
export type ModulePhase = 'locked' | 'learn' | 'quiz_passed' | 'demonstrate' | 'awaiting_coach' | 'coach_review' | 'acknowledged' | 'certified';
export interface CoachReview {
    /** What the rep did well */
    strengths: string;
    /** What needs improvement */
    corrections: string;
    /** General coaching guidance */
    coachingNotes: string;
    /** Director name who provided the review */
    reviewedBy: string;
    /** ISO date string */
    reviewedAt: string;
}
export interface ModuleProgress {
    code: AcademyModuleCode;
    phase: ModulePhase;
    currentValue: number;
    targetValue: number;
    label: string;
    /** Additional context like stages used count */
    extra?: string;
    /** Director feedback (only set after Coach Review phase) */
    coachReview?: CoachReview;
    /** ISO date when the rep acknowledged the Coach Review */
    acknowledgedAt?: string;
}
export interface AcademyModule {
    code: AcademyModuleCode;
    name: string;
    description: string;
    completionCriteria: string;
    /** What the rep must do in the Demonstrate phase */
    demonstrateTask: string;
    /** The SOS Sales Philosophy principle this module reinforces */
    philosophyPrinciple: number;
    /** Learning content for the Learn phase */
    learnContent: LearnContent[];
}
export interface LearnContent {
    heading: string;
    body: string;
}
/** Level 1 — TUF Sales System modules */
export declare const LEVEL_1_MODULES: AcademyModule[];
export declare const MODULE_ORDER: AcademyModuleCode[];
export interface PhilosophyPrinciple {
    number: number;
    title: string;
    meaning: string;
}
/** The 7 Sales Philosophy principles per SOS_v1.0 Section 2.3 */
export declare const SALES_PHILOSOPHY: PhilosophyPrinciple[];
export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
}
export interface QuizResult {
    moduleCode: AcademyModuleCode;
    score: number;
    passed: boolean;
    attempts: number;
    lastAttempt: string;
}
export declare const QUIZ_PASS_THRESHOLD = 80;
/**
 * Quiz questions per module (5 questions each).
 *
 * Design principles:
 * - At least 1 scenario-based question per module (tests judgment, not memory).
 * - At least 1 Sales Philosophy question per module (tests WHY, not just what).
 * - Distractors must be plausible — things a new rep might actually believe.
 * - Every answer is definitively findable in the module's learnContent.
 * - No "all of the above" shortcuts.
 * - Correct answer should not be obvious by length.
 */
export declare const QUIZZES: Record<AcademyModuleCode, QuizQuestion[]>;
export declare function getQuizResults(): Partial<Record<AcademyModuleCode, QuizResult>>;
export declare function getQuizResult(code: AcademyModuleCode): QuizResult | null;
export declare function saveQuizResult(result: QuizResult): void;
export declare function isQuizPassed(code: AcademyModuleCode): boolean;
/**
 * Grade a quiz submission and save the result.
 */
export declare function gradeQuiz(code: AcademyModuleCode, answers: number[]): QuizResult;
export declare function getMissionStatement(userId: string): string;
export declare function saveMissionStatement(userId: string, text: string): void;
export declare function hasMissionStatement(userId: string): boolean;
export declare function getCoachReviews(): Partial<Record<AcademyModuleCode, CoachReview>>;
export declare function getCoachReview(code: AcademyModuleCode): CoachReview | null;
export declare function saveCoachReview(code: AcademyModuleCode, review: CoachReview): void;
export declare function getAcknowledgments(userId: string): Set<AcademyModuleCode>;
export declare function isModuleAcknowledged(userId: string, code: AcademyModuleCode): boolean;
export declare function acknowledgeModule(userId: string, code: AcademyModuleCode): void;
/**
 * ACAD-101: Demonstrate — Rep writes a paragraph explaining TUF's mission.
 * Detection: checks if the mission statement has been saved.
 */
export declare function detectAcad101(userId: string): {
    completed: boolean;
    currentValue: number;
};
/**
 * ACAD-102: Demonstrate — Add 5 organizations, log 3 prospecting activities.
 */
export declare function detectAcad102(): Promise<{
    completed: boolean;
    currentValue: number;
    orgCount: number;
    activityCount: number;
}>;
/**
 * ACAD-103: Demonstrate — Create an opportunity, identify all sales lanes, record needs.
 * Detection: checks for opportunities with description/notes populated.
 */
export declare function detectAcad103(): Promise<{
    completed: boolean;
    currentValue: number;
    oppCount: number;
    oppsWithNeeds: number;
}>;
/**
 * ACAD-104: Demonstrate — Advance through stages (Contacted → Proposal Sent → Negotiation),
 * project deal value from discovery.
 * Detection: checks for opportunities at Proposal Sent or Negotiation with revenue > 0.
 */
export declare function detectAcad104(): Promise<{
    completed: boolean;
    currentValue: number;
    proposalOpps: number;
}>;
/**
 * ACAD-105: Demonstrate — Reach Closed Won correctly, complete all required info.
 * Detection: checks for Closed Won opportunities that have complete data.
 */
export declare function detectAcad105(): Promise<{
    completed: boolean;
    currentValue: number;
    closedWonOpps: number;
}>;
/**
 * ACAD-106: Demonstrate — deliver a 5-minute product walkthrough to Director.
 * Detection: verified by Director sign-off in the certification review.
 */
export declare function detectAcad106(): {
    completed: boolean;
    currentValue: number;
};
/**
 * Master detection function — runs all 6 module checks, applies sequential gating,
 * quiz requirements, coach review, and acknowledgment tracking.
 */
export declare function detectAllModules(): Promise<ModuleProgress[]>;
/**
 * Returns true if all 6 modules are acknowledged (Coach Review acknowledged by rep).
 * This combines with Director certification to achieve DEPLOY status.
 */
export declare function isLevel1Complete(progress: ModuleProgress[]): boolean;
/**
 * Returns certification progress percentage based on acknowledged modules.
 */
export declare function certificationProgress(progress: ModuleProgress[]): number;
/**
 * Count modules that have coach review (waiting on acknowledgment or already acknowledged).
 */
export declare function verifiedModuleCount(progress: ModuleProgress[]): number;
export interface CertificationRecord {
    userId: string;
    userName: string;
    role: string;
    isLevel1Certified: boolean;
    certificationTitle: string;
    certifiedAt?: string;
    certifiedBy?: string;
    moduleProgress: ModuleProgress[];
    lastChecked: string;
}
export declare const CERTIFICATION_TITLE = "Level 1 Certified Territory Account Executive";
export declare function getCertificationRecord(userId: string): CertificationRecord | null;
/**
 * Save certification progress WITHOUT auto-certifying.
 */
export declare function saveCertificationRecord(record: CertificationRecord): void;
export declare function getAllCertificationRecords(): CertificationRecord[];
export interface CertificationSubmission {
    userId: string;
    userName: string;
    submittedAt: string;
    moduleProgress: SubmittedModuleDetail[];
}
export interface SubmittedModuleDetail {
    code: AcademyModuleCode;
    quizScore: number;
    quizPassed: boolean;
    quizAttempts: number;
    exerciseVerified: boolean;
    exerciseValue: number;
    exerciseTarget: number;
}
export declare function getSubmission(userId: string): CertificationSubmission | null;
export declare function submitForApproval(userId: string, userName: string): Promise<CertificationSubmission>;
export declare function getAllSubmissions(): CertificationSubmission[];
export declare function clearSubmission(userId: string): void;
/**
 * Director approves a rep: certifies them as Level 1 Certified Territory Account Executive.
 */
export declare function directorApproveRep(repUserId: string, repUserName: string, directorName: string): Promise<CertificationRecord | null>;
/**
 * Legacy alias for backward compatibility.
 * @deprecated Use directorApproveRep instead.
 */
export declare function directorCertifyRep(repUserId: string, repUserName: string, directorName: string): Promise<CertificationRecord | null>;
export declare function updateUserCertificationStatus(userId: string, isCertified: boolean): void;
export declare function markPageVisited(page: string): void;
/**
 * Reset all certification data for all users.
 * Clears quiz results, submissions, coach reviews, acknowledgments, mission statements,
 * and certification records. Then updates all REP/TAE users to is_certified=false.
 *
 * Call this when you need a fresh start for all certifications (e.g., pre-launch reset).
 */
export declare function resetAllCertifications(): void;
//# sourceMappingURL=academy.d.ts.map