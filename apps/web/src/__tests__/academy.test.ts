/**
 * Tests for TUF Academy — TUF Sales System modules, Learn→Demonstrate→Coach Review→Deploy flow,
 * Director feedback loop, and "Level 1 Certified Territory Account Executive" title.
 *
 * These tests verify:
 * 1. Module definitions and quiz definitions for the TUF Sales System
 * 2. Quiz grading and pass threshold logic
 * 3. Sequential gating (module locked until previous Coach Review acknowledged)
 * 4. Coach Review storage and acknowledgment logic
 * 5. Mission statement storage (ACAD-101 Demonstrate)
 * 6. Sales Philosophy data integrity
 * 7. Detection functions for each module
 *
 * Requires: jest (globally available in project)
 */

// Mock service dependencies to avoid import.meta.env / Vite-specific syntax
jest.mock('../services/organizationsService', () => ({
  listOrganizations: () => [],
}));
jest.mock('../services/opportunitiesService', () => ({
  listOpportunities: () => [],
}));
jest.mock('../services/activitiesService', () => ({
  listActivities: () => [],
}));
jest.mock('../auth', () => ({ getStoredUser: () => null }));

import {
  LEVEL_1_MODULES,
  SALES_PHILOSOPHY,
  QUIZZES,
  QUIZ_PASS_THRESHOLD,
  MODULE_ORDER,
  CERTIFICATION_TITLE,
  gradeQuiz,
  isQuizPassed,
  isLevel1Complete,
  certificationProgress,
  verifiedModuleCount,
  saveMissionStatement,
  getMissionStatement,
  hasMissionStatement,
  saveCoachReview,
  getCoachReview,
  getCoachReviews,
  acknowledgeModule,
  isModuleAcknowledged,
  getAcknowledgments,
  detectAcad101,
  detectAcad102,
  detectAcad103,
  detectAcad104,
  detectAcad105,
  detectAllModules,
} from '../lib/academy';
import type {
  ModuleProgress,
  AcademyModuleCode,
  QuizResult,
  CoachReview,
} from '../lib/academy';

// ─── Helper ────────────────────────────────────────────────────────────────

/** Clear all academy localStorage between tests */
function clearStorage() {
  localStorage.clear();
}

// ─── Module Definitions ───────────────────────────────────────────────────

describe('LEVEL_1_MODULES — TUF Sales System', () => {
  it('defines exactly 5 Level 1 modules', () => {
    expect(LEVEL_1_MODULES).toHaveLength(5);
  });

  it('has unique codes for each module', () => {
    const codes = LEVEL_1_MODULES.map((m) => m.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(5);
  });

  it('modules are named for TUF Sales System, not CRM', () => {
    const names = LEVEL_1_MODULES.map((m) => m.name);
    expect(names).toEqual([
      'The TUF Philosophy',
      'Prospecting',
      'Discovery',
      'Proposal',
      'Order Handoff',
    ]);
  });

  it('each module maps to a valid philosophy principle (1-7)', () => {
    LEVEL_1_MODULES.forEach((m) => {
      expect(m.philosophyPrinciple).toBeGreaterThanOrEqual(1);
      expect(m.philosophyPrinciple).toBeLessThanOrEqual(7);
    });
  });

  it('each module has a name, description, completionCriteria, and demonstrateTask', () => {
    LEVEL_1_MODULES.forEach((m) => {
      expect(m.name.length).toBeGreaterThan(0);
      expect(m.description.length).toBeGreaterThan(0);
      expect(m.completionCriteria.length).toBeGreaterThan(0);
      expect(m.demonstrateTask.length).toBeGreaterThan(0);
    });
  });

  it('each module has Learn content with at least 3 sections', () => {
    LEVEL_1_MODULES.forEach((m) => {
      expect(m.learnContent.length).toBeGreaterThanOrEqual(3);
      m.learnContent.forEach((section) => {
        expect(section.heading.length).toBeGreaterThan(0);
        expect(section.body.length).toBeGreaterThan(0);
      });
    });
  });

  it('module order is Philosophy → Prospecting → Discovery → Proposal → Order Handoff', () => {
    expect(MODULE_ORDER).toEqual([
      'ACAD-101',
      'ACAD-102',
      'ACAD-103',
      'ACAD-104',
      'ACAD-105',
    ]);
  });

  it('ACAD-101 (Philosophy) maps to principle 1 (We sell trust before apparel)', () => {
    const mod = LEVEL_1_MODULES.find((m) => m.code === 'ACAD-101')!;
    expect(mod.philosophyPrinciple).toBe(1);
  });

  it('ACAD-105 (Order Handoff) maps to principle 7 (Director QA question)', () => {
    const mod = LEVEL_1_MODULES.find((m) => m.code === 'ACAD-105')!;
    expect(mod.philosophyPrinciple).toBe(7);
  });
});

// ─── Quiz Definitions ─────────────────────────────────────────────────────

describe('QUIZZES — TUF Sales System', () => {
  it('defines quizzes for all 5 modules', () => {
    expect(Object.keys(QUIZZES)).toHaveLength(5);
  });

  it('each quiz has exactly 4 questions', () => {
    Object.entries(QUIZZES).forEach(([code, questions]) => {
      expect(questions.length).toBe(4);
    });
  });

  it('each question has 4 options and a valid correctIndex', () => {
    Object.entries(QUIZZES).forEach(([code, questions]) => {
      questions.forEach((q) => {
        expect(q.options).toHaveLength(4);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(4);
        expect(q.question.length).toBeGreaterThan(0);
        expect(q.id.length).toBeGreaterThan(0);
      });
    });
  });

  it('pass threshold is 80%', () => {
    expect(QUIZ_PASS_THRESHOLD).toBe(80);
  });

  it('ACAD-101 quiz covers TUF philosophy: why TUF exists, four-order baseline, lane penetration', () => {
    const questions = QUIZZES['ACAD-101'];
    const allText = questions.map((q) => q.question).join(' ');
    expect(allText).toMatch(/exist/i);
    expect(allText).toMatch(/four-order|baseline/i);
    expect(allText).toMatch(/lane penetration/i);
  });

  it('ACAD-105 quiz covers Director QA question and Closed Won standard', () => {
    const questions = QUIZZES['ACAD-105'];
    const allText = questions.map((q) => q.question + q.options.join(' ')).join(' ');
    expect(allText).toMatch(/Director QA/i);
    expect(allText).toMatch(/Closed Won/i);
    expect(allText).toMatch(/Operations/i);
  });
});

// ─── Quiz Grading ─────────────────────────────────────────────────────────

describe('gradeQuiz', () => {
  beforeEach(clearStorage);

  it('returns 100% for all correct answers', () => {
    const questions = QUIZZES['ACAD-101'];
    const answers = questions.map((q) => q.correctIndex);
    const result = gradeQuiz('ACAD-101', answers);
    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
  });

  it('returns 0% for all wrong answers', () => {
    const questions = QUIZZES['ACAD-102'];
    const answers = questions.map((q) => (q.correctIndex + 1) % 4);
    const result = gradeQuiz('ACAD-102', answers);
    expect(result.score).toBe(0);
    expect(result.passed).toBe(false);
  });

  it('tracks multiple attempts', () => {
    const questions = QUIZZES['ACAD-103'];
    // First attempt: all wrong
    gradeQuiz('ACAD-103', questions.map(() => 0));
    // Second attempt: all correct
    const result2 = gradeQuiz('ACAD-103', questions.map((q) => q.correctIndex));
    expect(result2.attempts).toBe(2);
    expect(result2.score).toBe(100);
    expect(result2.passed).toBe(true);
  });

  it('fails below 80% on ACAD-101 (3/4 correct = 75%)', () => {
    const questions = QUIZZES['ACAD-101'];
    const answers = [...questions.map((q) => q.correctIndex)];
    answers[0] = (answers[0] + 1) % 4; // Make one wrong
    const result = gradeQuiz('ACAD-101', answers);
    expect(result.score).toBe(75);
    expect(result.passed).toBe(false);
  });

  it('records the lastAttempt timestamp', () => {
    const before = new Date();
    const result = gradeQuiz(
      'ACAD-104',
      QUIZZES['ACAD-104'].map((q) => q.correctIndex)
    );
    const after = new Date(result.lastAttempt);
    expect(after.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
  });

  it('isQuizPassed returns true only after passing', () => {
    expect(isQuizPassed('ACAD-101')).toBe(false);
    gradeQuiz(
      'ACAD-101',
      QUIZZES['ACAD-101'].map((q) => q.correctIndex)
    );
    expect(isQuizPassed('ACAD-101')).toBe(true);
  });
});

// ─── Sequential Gating ────────────────────────────────────────────────────

describe('MODULE_ORDER — sequential gating via Coach Review acknowledgment', () => {
  beforeEach(clearStorage);

  it('MODULE_ORDER contains exactly 5 modules', () => {
    expect(MODULE_ORDER).toHaveLength(5);
  });

  it('ACAD-101 is the first module (Philosophy)', () => {
    expect(MODULE_ORDER[0]).toBe('ACAD-101');
  });

  it('ACAD-105 is the last module (Order Handoff)', () => {
    expect(MODULE_ORDER[MODULE_ORDER.length - 1]).toBe('ACAD-105');
  });

  it('detectAllModules shows ACAD-101 with learn phase and ACAD-102 locked', () => {
    const progress = detectAllModules();
    const mod101 = progress.find((p) => p.code === 'ACAD-101')!;
    const mod102 = progress.find((p) => p.code === 'ACAD-102')!;
    expect(mod101.phase).toBe('learn');
    expect(mod102.phase).toBe('locked');
  });
});

// ─── Mission Statement (ACAD-101) ─────────────────────────────────────────

describe('Mission Statement — ACAD-101 Demonstrate', () => {
  beforeEach(clearStorage);

  it('returns empty string when no mission statement saved', () => {
    expect(getMissionStatement('test-user')).toBe('');
  });

  it('saves and retrieves mission statement', () => {
    saveMissionStatement('test-user', 'TUF exists to help coaches focus on athletes.');
    expect(getMissionStatement('test-user')).toBe(
      'TUF exists to help coaches focus on athletes.'
    );
  });

  it('hasMissionStatement returns false for empty or whitespace-only', () => {
    expect(hasMissionStatement('test-user')).toBe(false);
    saveMissionStatement('test-user', '   ');
    expect(hasMissionStatement('test-user')).toBe(false);
  });

  it('hasMissionStatement returns true when text is saved', () => {
    saveMissionStatement('test-user', 'My mission is clear.');
    expect(hasMissionStatement('test-user')).toBe(true);
  });

  it('different users have separate mission statements', () => {
    saveMissionStatement('user-a', 'Mission A');
    saveMissionStatement('user-b', 'Mission B');
    expect(getMissionStatement('user-a')).toBe('Mission A');
    expect(getMissionStatement('user-b')).toBe('Mission B');
  });

  it('detectAcad101 returns completed when mission statement exists', () => {
    expect(detectAcad101('test-user').completed).toBe(false);
    saveMissionStatement('test-user', 'A meaningful mission statement.');
    expect(detectAcad101('test-user').completed).toBe(true);
  });
});

// ─── Coach Review Storage ─────────────────────────────────────────────────

describe('Coach Review — Director Feedback Loop', () => {
  beforeEach(clearStorage);

  const sampleReview: CoachReview = {
    strengths: 'Clear understanding of prospecting fundamentals.',
    corrections: 'Need to qualify programs more thoroughly before first contact.',
    coachingNotes: 'Keep practicing. Focus on budget questions during discovery.',
    reviewedBy: 'Director Jane',
    reviewedAt: new Date().toISOString(),
  };

  it('returns null when no coach review exists', () => {
    expect(getCoachReview('ACAD-102')).toBeNull();
  });

  it('saves and retrieves coach review', () => {
    saveCoachReview('ACAD-102', sampleReview);
    const retrieved = getCoachReview('ACAD-102')!;
    expect(retrieved.strengths).toBe(sampleReview.strengths);
    expect(retrieved.corrections).toBe(sampleReview.corrections);
    expect(retrieved.coachingNotes).toBe(sampleReview.coachingNotes);
    expect(retrieved.reviewedBy).toBe('Director Jane');
  });

  it('different modules have separate coach reviews', () => {
    saveCoachReview('ACAD-102', sampleReview);
    const review2: CoachReview = {
      ...sampleReview,
      strengths: 'Discovery notes are excellent.',
    };
    saveCoachReview('ACAD-103', review2);
    expect(getCoachReview('ACAD-102')!.strengths).toContain('prospecting');
    expect(getCoachReview('ACAD-103')!.strengths).toContain('Discovery');
  });

  it('getCoachReviews returns all reviews', () => {
    saveCoachReview('ACAD-102', sampleReview);
    saveCoachReview('ACAD-103', { ...sampleReview, strengths: 'Great work.' });
    const all = getCoachReviews();
    expect(Object.keys(all)).toHaveLength(2);
  });

  it('overwrites existing review for same module', () => {
    saveCoachReview('ACAD-102', sampleReview);
    const updated: CoachReview = { ...sampleReview, strengths: 'Much improved.' };
    saveCoachReview('ACAD-102', updated);
    expect(getCoachReview('ACAD-102')!.strengths).toBe('Much improved.');
  });
});

// ─── Acknowledgment Logic ─────────────────────────────────────────────────

describe('Acknowledgment — Rep acknowledges Coach Review', () => {
  beforeEach(clearStorage);

  it('isModuleAcknowledged returns false when nothing acknowledged', () => {
    expect(isModuleAcknowledged('rep-1', 'ACAD-101')).toBe(false);
  });

  it('acknowledgeModule marks a module as acknowledged', () => {
    acknowledgeModule('rep-1', 'ACAD-101');
    expect(isModuleAcknowledged('rep-1', 'ACAD-101')).toBe(true);
  });

  it('getAcknowledgments returns all acknowledged modules', () => {
    acknowledgeModule('rep-1', 'ACAD-101');
    acknowledgeModule('rep-1', 'ACAD-102');
    const acked = getAcknowledgments('rep-1');
    expect(acked.has('ACAD-101')).toBe(true);
    expect(acked.has('ACAD-102')).toBe(true);
    expect(acked.has('ACAD-103')).toBe(false);
  });

  it('different reps have separate acknowledgments', () => {
    acknowledgeModule('rep-a', 'ACAD-101');
    expect(isModuleAcknowledged('rep-a', 'ACAD-101')).toBe(true);
    expect(isModuleAcknowledged('rep-b', 'ACAD-101')).toBe(false);
  });

  it('acknowledging again is idempotent', () => {
    acknowledgeModule('rep-1', 'ACAD-101');
    acknowledgeModule('rep-1', 'ACAD-101');
    const acked = getAcknowledgments('rep-1');
    expect(acked.size).toBe(1);
  });
});

// ─── Completion Detection Logic ───────────────────────────────────────────

describe('isLevel1Complete', () => {
  const makeProgress = (phases: ModuleProgress['phase'][]) =>
    phases.map((phase, i) => ({
      code: `ACAD-10${i + 1}` as AcademyModuleCode,
      phase,
      currentValue: phase === 'acknowledged' || phase === 'certified' ? 1 : 0,
      targetValue: 1,
      label: 'test',
    }));

  it('returns true when all 5 modules are acknowledged', () => {
    const progress = makeProgress([
      'acknowledged',
      'acknowledged',
      'acknowledged',
      'acknowledged',
      'acknowledged',
    ]);
    expect(isLevel1Complete(progress)).toBe(true);
  });

  it('returns true when all 5 modules are certified', () => {
    const progress = makeProgress([
      'certified',
      'certified',
      'certified',
      'certified',
      'certified',
    ]);
    expect(isLevel1Complete(progress)).toBe(true);
  });

  it('returns false when even one module is not acknowledged', () => {
    const progress = makeProgress([
      'acknowledged',
      'acknowledged',
      'acknowledged',
      'acknowledged',
      'coach_review',
    ]);
    expect(isLevel1Complete(progress)).toBe(false);
  });

  it('returns false when all are locked', () => {
    const progress = makeProgress([
      'locked',
      'locked',
      'locked',
      'locked',
      'locked',
    ]);
    expect(isLevel1Complete(progress)).toBe(false);
  });

  it('returns false when all are in learn phase (no quiz taken)', () => {
    const progress = makeProgress([
      'learn',
      'learn',
      'learn',
      'learn',
      'learn',
    ]);
    expect(isLevel1Complete(progress)).toBe(false);
  });

  it('returns false when quizzes passed but not acknowledged', () => {
    const progress = makeProgress([
      'quiz_passed',
      'quiz_passed',
      'quiz_passed',
      'quiz_passed',
      'quiz_passed',
    ]);
    expect(isLevel1Complete(progress)).toBe(false);
  });
});

// ─── Certification Progress ──────────────────────────────────────────────

describe('certificationProgress', () => {
  const makeProgress = (phases: ModuleProgress['phase'][]) =>
    phases.map((phase, i) => ({
      code: `ACAD-10${i + 1}` as AcademyModuleCode,
      phase,
      currentValue: 0,
      targetValue: 1,
      label: 'test',
    }));

  it('returns 100% when all modules acknowledged', () => {
    expect(
      certificationProgress(
        makeProgress([
          'acknowledged',
          'acknowledged',
          'acknowledged',
          'acknowledged',
          'acknowledged',
        ])
      )
    ).toBe(100);
  });

  it('returns 100% when all modules certified', () => {
    expect(
      certificationProgress(
        makeProgress([
          'certified',
          'certified',
          'certified',
          'certified',
          'certified',
        ])
      )
    ).toBe(100);
  });

  it('returns 0% when no modules have coach review', () => {
    expect(
      certificationProgress(
        makeProgress(['learn', 'quiz_passed', 'demonstrate', 'demonstrate', 'learn'])
      )
    ).toBe(0);
  });

  it('returns 40% when 2 of 5 have coach review', () => {
    expect(
      certificationProgress(
        makeProgress([
          'coach_review',
          'coach_review',
          'demonstrate',
          'quiz_passed',
          'learn',
        ])
      )
    ).toBe(40);
  });

  it('returns 60% when 3 of 5 have coach review', () => {
    expect(
      certificationProgress(
        makeProgress([
          'coach_review',
          'coach_review',
          'coach_review',
          'demonstrate',
          'quiz_passed',
        ])
      )
    ).toBe(60);
  });
});

// ─── Verified Module Count ────────────────────────────────────────────────

describe('verifiedModuleCount', () => {
  const makeProgress = (phases: ModuleProgress['phase'][]) =>
    phases.map((phase, i) => ({
      code: `ACAD-10${i + 1}` as AcademyModuleCode,
      phase,
      currentValue: 0,
      targetValue: 1,
      label: 'test',
    }));

  it('counts awaiting_coach, coach_review, acknowledged, and certified modules', () => {
    const progress = makeProgress([
      'certified',
      'acknowledged',
      'coach_review',
      'awaiting_coach',
      'learn',
    ]);
    expect(verifiedModuleCount(progress)).toBe(4);
  });

  it('returns 0 when nothing is in any review state', () => {
    const progress = makeProgress([
      'learn',
      'quiz_passed',
      'demonstrate',
      'learn',
      'locked',
    ]);
    expect(verifiedModuleCount(progress)).toBe(0);
  });
});

// ─── Certification Title ──────────────────────────────────────────────────

describe('CERTIFICATION_TITLE', () => {
  it('is "Level 1 Certified Territory Account Executive"', () => {
    expect(CERTIFICATION_TITLE).toBe('Level 1 Certified Territory Account Executive');
  });
});

// ─── Sales Philosophy ─────────────────────────────────────────────────────

describe('SALES_PHILOSOPHY', () => {
  it('contains exactly 7 principles', () => {
    expect(SALES_PHILOSOPHY).toHaveLength(7);
  });

  it('each principle has a sequential number 1-7', () => {
    SALES_PHILOSOPHY.forEach((p, i) => {
      expect(p.number).toBe(i + 1);
    });
  });

  it('each principle has a title and meaning', () => {
    SALES_PHILOSOPHY.forEach((p) => {
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.meaning.length).toBeGreaterThan(0);
    });
  });

  it('includes the Director QA question as principle #7', () => {
    const qa = SALES_PHILOSOPHY.find((p) => p.number === 7);
    expect(qa).toBeDefined();
    expect(qa!.title).toContain('Director QA');
  });

  it('includes "Coaches buy from people" as principle #4', () => {
    const p = SALES_PHILOSOPHY.find((p) => p.number === 4);
    expect(p).toBeDefined();
    expect(p!.title).toContain('Coaches buy from people');
  });

  it('includes "Pipeline predicts revenue" as principle #6', () => {
    const pp = SALES_PHILOSOPHY.find((p) => p.number === 6);
    expect(pp).toBeDefined();
    expect(pp!.title).toContain('Pipeline');
  });
});

// ─── Module Progress Type Validation ─────────────────────────────────────

describe('ModuleProgress type validation', () => {
  it('verify that all ACAD codes are valid', () => {
    const validCodes: AcademyModuleCode[] = [
      'ACAD-101',
      'ACAD-102',
      'ACAD-103',
      'ACAD-104',
      'ACAD-105',
    ];
    const progressItems: ModuleProgress[] = validCodes.map((code) => ({
      code,
      phase: 'learn' as const,
      currentValue: 0,
      targetValue: 1,
      label: 'test',
    }));
    expect(progressItems).toHaveLength(5);
    progressItems.forEach((item) => {
      expect(validCodes).toContain(item.code);
    });
  });

  it('a complete set of ACAD codes matches module definitions', () => {
    const moduleCodes = LEVEL_1_MODULES.map((m) => m.code).sort();
    const expected: AcademyModuleCode[] = [
      'ACAD-101',
      'ACAD-102',
      'ACAD-103',
      'ACAD-104',
      'ACAD-105',
    ];
    expect(moduleCodes).toEqual(expected.sort());
  });

  it('ModuleProgress uses phase not status', () => {
    const progress: ModuleProgress = {
      code: 'ACAD-101',
      phase: 'learn',
      currentValue: 0,
      targetValue: 1,
      label: 'test',
    };
    // Verify phase exists (this is a compile-time check, but makes intent explicit)
    expect(progress.phase).toBe('learn');
  });

  it('ModuleProgress supports coachReview optional field', () => {
    const progress: ModuleProgress = {
      code: 'ACAD-101',
      phase: 'coach_review',
      currentValue: 1,
      targetValue: 1,
      label: 'mission statement',
      coachReview: {
        strengths: 'Excellent',
        corrections: 'None',
        coachingNotes: 'Keep it up',
        reviewedBy: 'Director Jane',
        reviewedAt: new Date().toISOString(),
      },
      acknowledgedAt: new Date().toISOString(),
    };
    expect(progress.coachReview).toBeDefined();
    expect(progress.coachReview!.strengths).toBe('Excellent');
    expect(progress.acknowledgedAt).toBeDefined();
  });
});

// ─── Detection Functions ──────────────────────────────────────────────────

describe('detectAcad101 (Mission Statement)', () => {
  beforeEach(clearStorage);

  it('returns not completed when no mission statement', () => {
    const result = detectAcad101('test-user');
    expect(result.completed).toBe(false);
    expect(result.currentValue).toBe(0);
  });

  it('returns completed when mission statement exists', () => {
    saveMissionStatement('test-user', 'TUF exists to serve coaches.');
    const result = detectAcad101('test-user');
    expect(result.completed).toBe(true);
    expect(result.currentValue).toBe(1);
  });
});

describe('detectAllModules — phase computation', () => {
  beforeEach(clearStorage);

  it('returns all 5 modules', () => {
    const progress = detectAllModules();
    expect(progress).toHaveLength(5);
  });

  it('ACAD-101 starts in learn phase (first module)', () => {
    const progress = detectAllModules();
    const mod101 = progress.find((p) => p.code === 'ACAD-101')!;
    expect(mod101.phase).toBe('learn');
  });

  it('modules after ACAD-101 are locked until ACAD-101 is acknowledged', () => {
    const progress = detectAllModules();
    // ACAD-102 through ACAD-105 should all be locked
    ['ACAD-102', 'ACAD-103', 'ACAD-104', 'ACAD-105'].forEach((code) => {
      const mod = progress.find((p) => p.code === code)!;
      expect(mod.phase).toBe('locked');
    });
  });

  it('coachReview field is included when a review exists', () => {
    const review: CoachReview = {
      strengths: 'Good work',
      corrections: 'Review pricing',
      coachingNotes: 'Continue practicing',
      reviewedBy: 'Director Jane',
      reviewedAt: new Date().toISOString(),
    };
    saveCoachReview('ACAD-101', review);
    const progress = detectAllModules();
    const mod101 = progress.find((p) => p.code === 'ACAD-101')!;
    expect(mod101.coachReview).toBeDefined();
    expect(mod101.coachReview!.strengths).toBe('Good work');
  });
});
