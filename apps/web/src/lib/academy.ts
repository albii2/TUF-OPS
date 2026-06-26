/**
 * TUF Academy — Module definitions, quizzes, sequential gating, practical exercises,
 * and Director approval gate for Level 1 certification.
 *
 * Governing spec: docs/canon/Academy_v1.0.md Parts 3–8
 */

import { listOrganizations } from '../services/organizationsService';
import { listOpportunities } from '../services/opportunitiesService';
import { listActivities } from '../services/activitiesService';
import { getStoredUser } from '../auth';

// ─── Module Definitions ─────────────────────────────────────────────────────

export type AcademyModuleCode = 'ACAD-101' | 'ACAD-102' | 'ACAD-103' | 'ACAD-104' | 'ACAD-105';
export type ModuleStatus = 'locked' | 'available' | 'quiz_available' | 'quiz_passed' | 'verified' | 'submitted' | 'approved';

export interface AcademyModule {
  code: AcademyModuleCode;
  name: string;
  description: string;
  completionCriteria: string;
  /** The SOS Sales Philosophy principle this module reinforces */
  philosophyPrinciple: number;
}

export interface ModuleProgress {
  code: AcademyModuleCode;
  status: ModuleStatus;
  currentValue: number;
  targetValue: number;
  label: string;
  /** Additional context like stages used count */
  extra?: string;
}

/** Level 1 training modules per Academy_v1.0 Part 3 */
export const LEVEL_1_MODULES: AcademyModule[] = [
  {
    code: 'ACAD-101',
    name: 'Pipeline Management',
    description: 'Create and manage a healthy pipeline of 12+ active opportunities.',
    completionCriteria: '12+ active opportunities (pipeline health ≥ 100%)',
    philosophyPrinciple: 6, // Pipeline predicts revenue
  },
  {
    code: 'ACAD-102',
    name: 'Organization Management',
    description: 'Create complete organization records for every athletic program.',
    completionCriteria: '10+ organizations created with required fields',
    philosophyPrinciple: 2, // Relationships compound
  },
  {
    code: 'ACAD-103',
    name: 'Opportunity Creation',
    description: 'Create opportunities with accurate stage and value across the pipeline.',
    completionCriteria: '15+ opportunities across ≥ 4 stages',
    philosophyPrinciple: 5, // Activity creates opportunity
  },
  {
    code: 'ACAD-104',
    name: 'Prospecting Fundamentals',
    description: 'Identify, qualify, and make first contact with athletic programs.',
    completionCriteria: '15+ prospecting activities logged',
    philosophyPrinciple: 5, // Activity creates opportunity
  },
  {
    code: 'ACAD-105',
    name: 'TUF Ops Navigation',
    description: 'Navigate the TUF Ops system — Dashboard, Organizations, Opportunities.',
    completionCriteria: 'All 3 core pages visited (Dashboard, Organizations, Opportunities) + Academy page',
    philosophyPrinciple: 1, // We sell trust before apparel
  },
];

// ─── Sales Philosophy ────────────────────────────────────────────────────────

export interface PhilosophyPrinciple {
  number: number;
  title: string;
  meaning: string;
}

/** The 7 Sales Philosophy principles per SOS_v1.0 Section 2.3 */
export const SALES_PHILOSOPHY: PhilosophyPrinciple[] = [
  {
    number: 1,
    title: 'We sell trust before apparel.',
    meaning: 'A coach buys confidence that their team will look right, on time, with zero hassle.',
  },
  {
    number: 2,
    title: 'Relationships compound.',
    meaning: 'Every closed deal feeds the next one. Short-term deals don\'t build the company — relationships do.',
  },
  {
    number: 3,
    title: 'Four healthy orders beat one lucky order.',
    meaning: 'Consistency over size. The target is four per month, every month.',
  },
  {
    number: 4,
    title: 'Coaches buy from people.',
    meaning: 'They buy from someone who understands their program. The rep IS the product.',
  },
  {
    number: 5,
    title: 'Activity creates opportunity.',
    meaning: 'Pipeline is built through calls, visits, follow-ups. Measure activity first.',
  },
  {
    number: 6,
    title: 'Pipeline predicts revenue.',
    meaning: 'Look at this week\'s pipeline, not last quarter\'s revenue.',
  },
  {
    number: 7,
    title: 'The Director QA question.',
    meaning: '"Can Operations produce this order without contacting the customer again?" If no, the deal isn\'t ready.',
  },
];

// ─── Quiz Definitions ────────────────────────────────────────────────────────

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface QuizResult {
  moduleCode: AcademyModuleCode;
  score: number;       // 0–100
  passed: boolean;     // ≥ 80%
  attempts: number;
  lastAttempt: string; // ISO date
}

export const QUIZ_PASS_THRESHOLD = 80;

/** Quiz questions per module (3–5 each). Correct answer index is 0-based. */
export const QUIZZES: Record<AcademyModuleCode, QuizQuestion[]> = {
  'ACAD-101': [
    {
      id: '101-q1',
      question: 'What does pipeline health measure?',
      options: [
        'The ratio of active opportunities to the required target, indicating whether you are building enough pipeline',
        'The total revenue in all closed deals',
        'The number of organizations in your territory',
        'How many activities you logged this week',
      ],
      correctIndex: 0,
    },
    {
      id: '101-q2',
      question: "What is the target number of active opportunities for ACAD-101?",
      options: ['12+', '8', '15', '20'],
      correctIndex: 0,
    },
    {
      id: '101-q3',
      question: 'Which Sales Philosophy principle applies to pipeline management?',
      options: [
        '"Pipeline predicts revenue"',
        '"Relationships compound"',
        '"Activity creates opportunity"',
        '"Four healthy orders beat one lucky order"',
      ],
      correctIndex: 0,
    },
    {
      id: '101-q4',
      question: 'Why is maintaining pipeline health critical for a TUF rep?',
      options: [
        'It predicts future revenue and shows whether you are building enough opportunities to hit your monthly target',
        'Pipeline health is a vanity metric that only Directors care about',
        'Pipeline health auto-resets each month so it doesn\'t matter long-term',
        'Only opportunities in the Closed Won stage count toward health',
      ],
      correctIndex: 0,
    },
  ],
  'ACAD-102': [
    {
      id: '102-q1',
      question: 'Why must organization records be complete?',
      options: [
        'Complete records enable accurate territory tracking, pipeline development, and contact history — incomplete records break everything downstream',
        'Organization records auto-fill when an opportunity is created, so completeness is optional',
        'Only the organization name matters; everything else is cosmetic',
        'Incomplete records are automatically enriched from external databases',
      ],
      correctIndex: 0,
    },
    {
      id: '102-q2',
      question: "What is the minimum required information for an organization record?",
      options: [
        'A non-empty name',
        'Name, email, and phone number',
        'Name, address, and revenue',
        'Name and a linked opportunity',
      ],
      correctIndex: 0,
    },
    {
      id: '102-q3',
      question: 'Which Sales Philosophy principle applies to organization management?',
      options: [
        '"Relationships compound"',
        '"Activity creates opportunity"',
        '"Pipeline predicts revenue"',
        '"The Director QA question"',
      ],
      correctIndex: 0,
    },
  ],
  'ACAD-103': [
    {
      id: '103-q1',
      question: 'What are the correct opportunity stages in TUF Ops?',
      options: [
        'Lead, Contacted, Proposal Sent, Negotiation, Order Assembly, Director QA, Closed Won',
        'Lead, Qualified, Demo, Proposal, Negotiation, Close',
        'Lead, Discovery, Mockup, Invoice, Won',
        'Lead, Call, Meeting, Contract, Won',
      ],
      correctIndex: 0,
    },
    {
      id: '103-q2',
      question: 'Why does stage accuracy matter?',
      options: [
        'Stage accuracy determines pipeline health metrics, Director coaching priorities, and whether deals are truly advancing — mis-staged deals corrupt the entire system',
        'Stages only matter for reporting and can be fixed later',
        'Stages auto-update when activities are logged',
        'Stage accuracy only matters for Closed Won',
      ],
      correctIndex: 0,
    },
    {
      id: '103-q3',
      question: 'What is the minimum number of distinct stages needed across your opportunities for ACAD-103?',
      options: ['4 distinct stages', '2 stages', '5 stages', 'All 7 stages simultaneously'],
      correctIndex: 0,
    },
    {
      id: '103-q4',
      question: 'Which Sales Philosophy principle applies to opportunity creation?',
      options: [
        '"Activity creates opportunity"',
        '"Pipeline predicts revenue"',
        '"We sell trust before apparel"',
        '"Four healthy orders beat one lucky order"',
      ],
      correctIndex: 0,
    },
  ],
  'ACAD-104': [
    {
      id: '104-q1',
      question: "What is the first step with a new lead?",
      options: [
        'Log an activity to document your initial contact',
        'Create an opportunity immediately',
        'Send a proposal',
        'Wait for the lead to reach out to you',
      ],
      correctIndex: 0,
    },
    {
      id: '104-q2',
      question: 'Which Sales Philosophy principle applies to prospecting?',
      options: [
        '"Activity creates opportunity"',
        '"Pipeline predicts revenue"',
        '"Relationships compound"',
        '"Coaches buy from people"',
      ],
      correctIndex: 0,
    },
    {
      id: '104-q3',
      question: 'How many prospecting activities are required for ACAD-104 certification?',
      options: ['15+ logged activities', '5 logged activities', '10 logged activities', '25 logged activities'],
      correctIndex: 0,
    },
  ],
  'ACAD-105': [
    {
      id: '105-q1',
      question: 'Where do you find your pipeline in TUF Ops?',
      options: [
        'On the Dashboard page',
        'On the Organizations page',
        'On the Settings page',
        'On the Academy page only',
      ],
      correctIndex: 0,
    },
    {
      id: '105-q2',
      question: 'Where can you access guided tours?',
      options: [
        'Academy page and the Training Portal',
        'Only in external documentation',
        'Guided tours are emailed to reps weekly',
        'In the Settings menu under "Help"',
      ],
      correctIndex: 0,
    },
    {
      id: '105-q3',
      question: 'Which core pages must be visited to complete ACAD-105?',
      options: [
        'Dashboard, Organizations, Opportunities',
        'Dashboard only',
        'Every page in TUF Ops',
        'Dashboard and Academy page only',
      ],
      correctIndex: 0,
    },
    {
      id: '105-q4',
      question: 'Which Sales Philosophy principle applies to TUF Ops navigation?',
      options: [
        '"We sell trust before apparel"',
        '"Pipeline predicts revenue"',
        '"Activity creates opportunity"',
        '"Relationships compound"',
      ],
      correctIndex: 0,
    },
  ],
};

// ─── Quiz Storage ────────────────────────────────────────────────────────────

const QUIZ_RESULTS_KEY = 'tuf_academy_quiz_results';

export function getQuizResults(): Partial<Record<AcademyModuleCode, QuizResult>> {
  try {
    const raw = localStorage.getItem(QUIZ_RESULTS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<Record<AcademyModuleCode, QuizResult>>;
  } catch {
    return {};
  }
}

export function getQuizResult(code: AcademyModuleCode): QuizResult | null {
  const results = getQuizResults();
  return results[code] ?? null;
}

export function saveQuizResult(result: QuizResult): void {
  try {
    const results = getQuizResults();
    results[result.moduleCode] = result;
    localStorage.setItem(QUIZ_RESULTS_KEY, JSON.stringify(results));
  } catch {
    // fail silently
  }
}

export function isQuizPassed(code: AcademyModuleCode): boolean {
  return getQuizResult(code)?.passed === true;
}

/**
 * Grade a quiz submission and save the result.
 * Returns the QuizResult with score, passed flag, and attempt count.
 */
export function gradeQuiz(
  code: AcademyModuleCode,
  answers: number[]
): QuizResult {
  const questions = QUIZZES[code];
  const correct = answers.filter((a, i) => a === questions[i].correctIndex).length;
  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= QUIZ_PASS_THRESHOLD;

  const existing = getQuizResult(code);
  const attempts = (existing?.attempts ?? 0) + 1;

  const result: QuizResult = {
    moduleCode: code,
    score,
    passed,
    attempts,
    lastAttempt: new Date().toISOString(),
  };

  saveQuizResult(result);
  return result;
}

// ─── Certification Submission Storage ───────────────────────────────────────

const SUBMISSION_KEY = 'tuf_academy_submission';

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

export function getSubmission(userId: string): CertificationSubmission | null {
  try {
    const raw = localStorage.getItem(SUBMISSION_KEY);
    if (!raw) return null;
    const submissions = JSON.parse(raw) as Record<string, CertificationSubmission>;
    return submissions[userId] ?? null;
  } catch {
    return null;
  }
}

export function submitForApproval(userId: string, userName: string): CertificationSubmission {
  const progress = detectAllModules();
  const quizResults = getQuizResults();

  const moduleDetails: SubmittedModuleDetail[] = LEVEL_1_MODULES.map((mod) => {
    const quiz = quizResults[mod.code];
    const prog = progress.find((p) => p.code === mod.code);
    return {
      code: mod.code,
      quizScore: quiz?.score ?? 0,
      quizPassed: quiz?.passed ?? false,
      quizAttempts: quiz?.attempts ?? 0,
      exerciseVerified: prog?.status === 'verified',
      exerciseValue: prog?.currentValue ?? 0,
      exerciseTarget: prog?.targetValue ?? 0,
    };
  });

  const submission: CertificationSubmission = {
    userId,
    userName,
    submittedAt: new Date().toISOString(),
    moduleProgress: moduleDetails,
  };

  try {
    const raw = localStorage.getItem(SUBMISSION_KEY);
    const submissions = raw ? JSON.parse(raw) as Record<string, CertificationSubmission> : {};
    submissions[userId] = submission;
    localStorage.setItem(SUBMISSION_KEY, JSON.stringify(submissions));
  } catch {
    // fail silently
  }

  return submission;
}

export function getAllSubmissions(): CertificationSubmission[] {
  try {
    const raw = localStorage.getItem(SUBMISSION_KEY);
    if (!raw) return [];
    return Object.values(JSON.parse(raw) as Record<string, CertificationSubmission>);
  } catch {
    return [];
  }
}

export function clearSubmission(userId: string): void {
  try {
    const raw = localStorage.getItem(SUBMISSION_KEY);
    if (raw) {
      const submissions = JSON.parse(raw) as Record<string, CertificationSubmission>;
      delete submissions[userId];
      localStorage.setItem(SUBMISSION_KEY, JSON.stringify(submissions));
    }
  } catch {
    // fail silently
  }
}

// ─── Auto-Detection Logic ────────────────────────────────────────────────────

const ACTIVE_STAGES = new Set([
  'Lead', 'Contacted', 'Proposal Sent', 'Negotiation',
  'Order Assembly', 'Director QA', 'Closed Won',
]);

/**
 * ACAD-101: Complete when rep has 12+ active opportunities (pipeline health ≥ 100%).
 * "Active" means not in a terminal stage (Closed Lost, Delivered, etc.)
 * Only active as an exercise if the module's quiz has been passed.
 */
export function detectAcad101(): { completed: boolean; currentValue: number } {
  const opportunities = listOpportunities({});
  const active = opportunities.filter((o) => ACTIVE_STAGES.has(o.stage));
  return { completed: active.length >= 12, currentValue: active.length };
}

/**
 * ACAD-102: Complete when rep has created 10+ organizations with required fields.
 * Required fields: name must be non-empty.
 */
export function detectAcad102(): { completed: boolean; currentValue: number } {
  const orgs = listOrganizations({});
  const valid = orgs.filter((o) => o.name && o.name.trim().length > 0);
  return { completed: valid.length >= 10, currentValue: valid.length };
}

/**
 * ACAD-103: Complete when rep has created 15+ opportunities across ≥ 4 distinct stages.
 */
export function detectAcad103(): { completed: boolean; currentValue: number; stagesUsed: number } {
  const opportunities = listOpportunities({});
  const active = opportunities.filter((o) => ACTIVE_STAGES.has(o.stage));
  const stageSet = new Set(active.map((o) => o.stage));
  return {
    completed: active.length >= 15 && stageSet.size >= 4,
    currentValue: active.length,
    stagesUsed: stageSet.size,
  };
}

/**
 * ACAD-104: Complete when rep has logged 15+ prospecting activities.
 * Filters activities to the currently logged-in rep.
 */
export function detectAcad104(): { completed: boolean; currentValue: number } {
  const user = getStoredUser();
  const activities = listActivities({});
  const repActivities = user
    ? activities.filter((a) => a.user === user.name)
    : activities;
  return { completed: repActivities.length >= 15, currentValue: repActivities.length };
}

/**
 * ACAD-105: Complete when rep has visited all core pages + Academy.
 * Tracked via localStorage.
 */
const VISITED_PAGES_KEY = 'tuf_academy_visited_pages';

function getVisitedPages(): Set<string> {
  try {
    const raw = localStorage.getItem(VISITED_PAGES_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export function markPageVisited(page: string): void {
  const visited = getVisitedPages();
  visited.add(page);
  localStorage.setItem(VISITED_PAGES_KEY, JSON.stringify([...visited]));
}

export function detectAcad105(): { completed: boolean; currentValue: number; visitedPages: string[] } {
  const visited = getVisitedPages();
  const required = ['dashboard', 'organizations', 'opportunities'];
  const visitedRequired = required.filter((p) => visited.has(p));
  return {
    completed: visitedRequired.length >= required.length,
    currentValue: visitedRequired.length,
    visitedPages: [...visited],
  };
}

// ─── Module Order (for sequential gating) ────────────────────────────────────

export const MODULE_ORDER: AcademyModuleCode[] = [
  'ACAD-101', 'ACAD-102', 'ACAD-103', 'ACAD-104', 'ACAD-105',
];

/**
 * Determine the overall status of a module given its quiz result and exercise data.
 * Sequential gating applies: module N is locked until module N-1 quiz is passed.
 */
function computeModuleStatus(
  code: AcademyModuleCode,
  exerciseCompleted: boolean,
  currentValue: number,
  submissionExists: boolean,
  isApproved: boolean
): ModuleStatus {
  const idx = MODULE_ORDER.indexOf(code);

  // Check sequential lock: ACAD-101 is always available; others require previous quiz passed
  if (idx > 0) {
    const prevCode = MODULE_ORDER[idx - 1];
    if (!isQuizPassed(prevCode)) {
      return 'locked';
    }
  }

  if (isApproved) return 'approved';
  if (submissionExists) return 'submitted';

  // Module is unlocked; check quiz and exercise status
  const quizPassed = isQuizPassed(code);

  if (quizPassed && exerciseCompleted) return 'verified';
  if (quizPassed) return 'quiz_passed';
  return 'available';
}

/**
 * Master detection function — runs all 5 module checks, applies sequential gating
 * and quiz requirements. Exercises only activate after the quiz is passed.
 */
export function detectAllModules(): ModuleProgress[] {
  const acad101 = detectAcad101();
  const acad102 = detectAcad102();
  const acad103 = detectAcad103();
  const acad104 = detectAcad104();
  const acad105 = detectAcad105();

  const user = getStoredUser();
  const userId = user?.id ?? 'unknown';
  const submission = getSubmission(userId);
  const submissionExists = submission !== null;
  const record = getCertificationRecord(userId);
  const isApproved = record?.isLevel1Certified === true;

  const rawData: Record<AcademyModuleCode, { completed: boolean; currentValue: number }> = {
    'ACAD-101': acad101,
    'ACAD-102': acad102,
    'ACAD-103': acad103,
    'ACAD-104': acad104,
    'ACAD-105': acad105,
  };

  const extraData: Partial<Record<AcademyModuleCode, string>> = {
    'ACAD-103': `${acad103.stagesUsed} stages`,
    'ACAD-105': acad105.visitedPages.join(', ') || 'none visited',
  };

  return LEVEL_1_MODULES.map((mod) => {
    const raw = rawData[mod.code];
    const quizPassed = isQuizPassed(mod.code);
    // Exercise is only "active" (counts) after quiz is passed
    // If quiz not passed, exercise data is still collected but doesn't count toward completion
    const exerciseCompleted = quizPassed && raw.completed;

    const status = computeModuleStatus(mod.code, exerciseCompleted, raw.currentValue, submissionExists, isApproved);

    return {
      code: mod.code,
      status,
      currentValue: raw.currentValue,
      targetValue: mod.code === 'ACAD-101' ? 12 :
                    mod.code === 'ACAD-102' ? 10 :
                    mod.code === 'ACAD-103' ? 15 :
                    mod.code === 'ACAD-104' ? 15 : 3,
      label: mod.code === 'ACAD-101' ? 'active opportunities' :
             mod.code === 'ACAD-102' ? 'organizations' :
             mod.code === 'ACAD-103' ? `opportunities (${acad103.stagesUsed} stages)` :
             mod.code === 'ACAD-104' ? 'activities' : 'pages visited',
      extra: extraData[mod.code],
    };
  });
}

// ─── Completion Helpers ──────────────────────────────────────────────────────

/**
 * Returns true if all 5 modules are verified (quiz passed + exercise completed).
 * This is the gate for being able to submit for Director approval.
 */
export function isLevel1Complete(progress: ModuleProgress[]): boolean {
  return progress.every((p) => p.status === 'verified');
}

/**
 * Returns certification progress percentage based on verified modules.
 */
export function certificationProgress(progress: ModuleProgress[]): number {
  const verified = progress.filter((p) => p.status === 'verified' || p.status === 'submitted' || p.status === 'approved').length;
  return Math.round((verified / progress.length) * 100);
}

/**
 * Count modules that are fully verified (quiz passed + exercise done).
 */
export function verifiedModuleCount(progress: ModuleProgress[]): number {
  return progress.filter((p) => p.status === 'verified' || p.status === 'submitted' || p.status === 'approved').length;
}

// ─── Certification Storage ───────────────────────────────────────────────────

const CERTIFICATION_KEY = 'tuf_academy_certification';

export interface CertificationRecord {
  userId: string;
  userName: string;
  role: string;
  isLevel1Certified: boolean;
  certifiedAt?: string;
  certifiedBy?: string;
  moduleProgress: ModuleProgress[];
  lastChecked: string;
}

export function getCertificationRecord(userId: string): CertificationRecord | null {
  try {
    const raw = localStorage.getItem(CERTIFICATION_KEY);
    if (!raw) return null;
    const records = JSON.parse(raw) as Record<string, CertificationRecord>;
    return records[userId] || null;
  } catch {
    return null;
  }
}

/**
 * Save certification progress WITHOUT auto-certifying.
 * This only records progress; certification is a separate Director action.
 */
export function saveCertificationRecord(record: CertificationRecord): void {
  try {
    const raw = localStorage.getItem(CERTIFICATION_KEY);
    const records = raw ? JSON.parse(raw) as Record<string, CertificationRecord> : {};
    // Preserve existing certification status if already certified
    const existing = records[record.userId];
    if (existing?.isLevel1Certified) {
      record.isLevel1Certified = true;
      record.certifiedAt = existing.certifiedAt;
      record.certifiedBy = existing.certifiedBy;
    }
    records[record.userId] = record;
    localStorage.setItem(CERTIFICATION_KEY, JSON.stringify(records));
  } catch {
    // fail silently
  }
}

export function getAllCertificationRecords(): CertificationRecord[] {
  try {
    const raw = localStorage.getItem(CERTIFICATION_KEY);
    if (!raw) return [];
    return Object.values(JSON.parse(raw) as Record<string, CertificationRecord>);
  } catch {
    return [];
  }
}

/**
 * Director approval: certify a TAE after reviewing their submission.
 * This is the ONLY path to certification — no auto-certification.
 */
export function directorApproveRep(
  repUserId: string,
  repUserName: string,
  directorName: string
): CertificationRecord | null {
  // Only certify if the rep has submitted for approval
  const submission = getSubmission(repUserId);
  if (!submission) return null;

  // Verify all modules are complete (quiz + exercise)
  const allQuizzesPassed = submission.moduleProgress.every((m) => m.quizPassed);
  const allExercisesVerified = submission.moduleProgress.every((m) => m.exerciseVerified);
  if (!allQuizzesPassed || !allExercisesVerified) return null;

  const progress = detectAllModules();

  const record: CertificationRecord = {
    userId: repUserId,
    userName: repUserName,
    role: 'REP',
    isLevel1Certified: true,
    certifiedAt: new Date().toISOString(),
    certifiedBy: directorName,
    moduleProgress: progress,
    lastChecked: new Date().toISOString(),
  };

  saveCertificationRecord(record);

  // Update the user record so the front-end reflects certification
  updateUserCertificationStatus(repUserId, true);

  // Clear the submission after approval
  clearSubmission(repUserId);

  // ALSO update the server-side is_certified flag via API
  // This ensures the requireCertification() middleware allows CRM API access
  callCertifyApi(repUserId).catch((err) => {
    console.warn('[TUF Academy] Failed to sync certification to server:', err);
  });

  return record;
}

/**
 * Legacy alias for backward compatibility with AdminCertificationPage.
 * @deprecated Use directorApproveRep instead.
 */
export function directorCertifyRep(
  repUserId: string,
  repUserName: string,
  directorName: string
): CertificationRecord | null {
  return directorApproveRep(repUserId, repUserName, directorName);
}

function updateUserCertificationStatus(userId: string, isCertified: boolean): void {
  try {
    const raw = localStorage.getItem('tuf_ops_user_v3');
    if (raw) {
      const current = JSON.parse(raw);
      if (current.id === userId) {
        current.isCertified = isCertified;
        localStorage.setItem('tuf_ops_user_v3', JSON.stringify(current));
        window.dispatchEvent(new CustomEvent('tuf:user-updated', { detail: current }));
      }
    }
    // Also update in tuf_ops_users_v7
    const usersRaw = localStorage.getItem('tuf_ops_users_v7');
    if (usersRaw) {
      const users = JSON.parse(usersRaw);
      const updated = users.map((u: any) => u.id === userId ? { ...u, isCertified } : u);
      localStorage.setItem('tuf_ops_users_v7', JSON.stringify(updated));
    }
  } catch {
    // fail silently
  }
}

/**
 * Call the server-side certify endpoint to persist is_certified in the database.
 * This is the mirror of the PUT /api/v1/users/:id/certify endpoint.
 */
async function callCertifyApi(userId: string): Promise<void> {
  const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
  const numericId = userId.replace(/\\D/g, '');
  const response = await fetch(`${API_BASE}/v1/users/${numericId}/certify`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Certify API returned ${response.status}`);
  }
}
