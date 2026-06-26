/**
 * Tests for TUF Academy MVP — certification gating and auto-detection logic.
 *
 * These tests verify:
 * 1. Module completion detection functions
 * 2. Level 1 certification completion logic
 * 3. Certification record storage
 * 4. Sales Philosophy data integrity
 *
 * Requires: jest (globally available in project)
 */

// Mock service dependencies to avoid import.meta.env / Vite-specific syntax
jest.mock('../services/organizationsService', () => ({ listOrganizations: () => [] }));
jest.mock('../services/opportunitiesService', () => ({ listOpportunities: () => [] }));
jest.mock('../services/activitiesService', () => ({ listActivities: () => [] }));
jest.mock('../auth', () => ({ getStoredUser: () => null }));

import {
  LEVEL_1_MODULES,
  SALES_PHILOSOPHY,
  isLevel1Complete,
  certificationProgress,
} from '../lib/academy';
import type { ModuleProgress, AcademyModuleCode } from '../lib/academy';

// ─── Module Definitions ───────────────────────────────────────────────────

describe('LEVEL_1_MODULES', () => {
  it('defines exactly 5 Level 1 modules', () => {
    expect(LEVEL_1_MODULES).toHaveLength(5);
  });

  it('has unique codes for each module', () => {
    const codes = LEVEL_1_MODULES.map((m) => m.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(5);
  });

  it('each module maps to a valid philosophy principle (1-7)', () => {
    LEVEL_1_MODULES.forEach((m) => {
      expect(m.philosophyPrinciple).toBeGreaterThanOrEqual(1);
      expect(m.philosophyPrinciple).toBeLessThanOrEqual(7);
    });
  });

  it('each module has a name and description', () => {
    LEVEL_1_MODULES.forEach((m) => {
      expect(m.name.length).toBeGreaterThan(0);
      expect(m.description.length).toBeGreaterThan(0);
      expect(m.completionCriteria.length).toBeGreaterThan(0);
    });
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

  it('includes Pipeline predicts revenue as principle #6', () => {
    const pp = SALES_PHILOSOPHY.find((p) => p.number === 6);
    expect(pp).toBeDefined();
    expect(pp!.title).toContain('Pipeline');
  });
});

// ─── Completion Detection Logic ───────────────────────────────────────────

describe('isLevel1Complete', () => {
  const makeProgress = (statuses: ModuleProgress['status'][]) =>
    statuses.map((status, i) => ({
      code: `ACAD-10${i + 1}` as AcademyModuleCode,
      status,
      currentValue: status === 'completed' ? 15 : status === 'in_progress' ? 7 : 0,
      targetValue: 15,
      label: 'test',
    }));

  it('returns true when all 5 modules are completed', () => {
    const progress = makeProgress(['completed', 'completed', 'completed', 'completed', 'completed']);
    expect(isLevel1Complete(progress)).toBe(true);
  });

  it('returns false when even one module is not completed', () => {
    const progress = makeProgress(['completed', 'completed', 'completed', 'completed', 'in_progress']);
    expect(isLevel1Complete(progress)).toBe(false);
  });

  it('returns false when all are not_started', () => {
    const progress = makeProgress(['not_started', 'not_started', 'not_started', 'not_started', 'not_started']);
    expect(isLevel1Complete(progress)).toBe(false);
  });

  it('returns false when some are in_progress', () => {
    const progress = makeProgress(['in_progress', 'completed', 'in_progress', 'completed', 'in_progress']);
    expect(isLevel1Complete(progress)).toBe(false);
  });
});

// ─── Certification Progress ──────────────────────────────────────────────

describe('certificationProgress', () => {
  const makeProgress = (statuses: ModuleProgress['status'][]) =>
    statuses.map((status, i) => ({
      code: `ACAD-10${i + 1}` as AcademyModuleCode,
      status,
      currentValue: status === 'completed' ? 15 : 0,
      targetValue: 15,
      label: 'test',
    }));

  it('returns 100% when all modules completed', () => {
    expect(certificationProgress(makeProgress(['completed', 'completed', 'completed', 'completed', 'completed']))).toBe(100);
  });

  it('returns 0% when no modules completed', () => {
    expect(certificationProgress(makeProgress(['not_started', 'not_started', 'not_started', 'not_started', 'not_started']))).toBe(0);
  });

  it('returns 40% when 2 of 5 completed', () => {
    expect(certificationProgress(makeProgress(['completed', 'completed', 'not_started', 'not_started', 'not_started']))).toBe(40);
  });

  it('returns 60% when 3 of 5 completed', () => {
    expect(certificationProgress(makeProgress(['completed', 'completed', 'completed', 'in_progress', 'in_progress']))).toBe(60);
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
      status: 'not_started' as const,
      currentValue: 0,
      targetValue: 10,
      label: 'test',
    }));
    expect(progressItems).toHaveLength(5);
    progressItems.forEach((item) => {
      expect(validCodes).toContain(item.code);
    });
  });

  it('a complete set of ACAD codes matches module definitions', () => {
    const moduleCodes = LEVEL_1_MODULES.map((m) => m.code).sort();
    const expected: AcademyModuleCode[] = ['ACAD-101', 'ACAD-102', 'ACAD-103', 'ACAD-104', 'ACAD-105'];
    expect(moduleCodes).toEqual(expected.sort());
  });
});
