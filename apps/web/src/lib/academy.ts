/**
 * TUF Academy — Module definitions, completion detection, and certification logic.
 *
 * This is the authoritative source for Level 1 Academy modules (ACAD-101 through ACAD-105).
 * Completion is auto-detected from real production data, not manually toggled.
 *
 * Governing spec: docs/canon/Academy_v1.0.md Parts 1–4
 */

import { listOrganizations } from '../services/organizationsService';
import { listOpportunities } from '../services/opportunitiesService';
import { listActivities } from '../services/activitiesService';
import { getStoredUser } from '../auth';

// ─── Module Definitions ─────────────────────────────────────────────────────

export type AcademyModuleCode = 'ACAD-101' | 'ACAD-102' | 'ACAD-103' | 'ACAD-104' | 'ACAD-105';
export type ModuleStatus = 'not_started' | 'in_progress' | 'completed';

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
    completionCriteria: 'All 3 core pages visited (Dashboard, Organizations, Opportunities)',
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

// ─── Auto-Detection Logic ────────────────────────────────────────────────────

const ACTIVE_STAGES = new Set([
  'Lead', 'Contacted', 'Proposal Sent', 'Negotiation',
  'Order Assembly', 'Director QA', 'Closed Won',
]);

/**
 * ACAD-101: Complete when rep has 12+ active opportunities (pipeline health ≥ 100%).
 * "Active" means not in a terminal stage (Closed Lost, Delivered, etc.)
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
 * ACAD-105: Complete when rep has visited all 3 core pages.
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

/**
 * Master detection function — runs all 5 module checks and returns progress.
 */
export function detectAllModules(): ModuleProgress[] {
  const acad101 = detectAcad101();
  const acad102 = detectAcad102();
  const acad103 = detectAcad103();
  const acad104 = detectAcad104();
  const acad105 = detectAcad105();

  return [
    {
      code: 'ACAD-101',
      status: acad101.completed ? 'completed' : acad101.currentValue > 0 ? 'in_progress' : 'not_started',
      currentValue: acad101.currentValue,
      targetValue: 12,
      label: 'active opportunities',
    },
    {
      code: 'ACAD-102',
      status: acad102.completed ? 'completed' : acad102.currentValue > 0 ? 'in_progress' : 'not_started',
      currentValue: acad102.currentValue,
      targetValue: 10,
      label: 'organizations',
    },
    {
      code: 'ACAD-103',
      status: acad103.completed ? 'completed' : acad103.currentValue > 0 ? 'in_progress' : 'not_started',
      currentValue: acad103.currentValue,
      targetValue: 15,
      label: `opportunities (${acad103.stagesUsed} stages)`,
    },
    {
      code: 'ACAD-104',
      status: acad104.completed ? 'completed' : acad104.currentValue > 0 ? 'in_progress' : 'not_started',
      currentValue: acad104.currentValue,
      targetValue: 15,
      label: 'activities',
    },
    {
      code: 'ACAD-105',
      status: acad105.completed ? 'completed' : acad105.currentValue > 0 ? 'in_progress' : 'not_started',
      currentValue: acad105.currentValue,
      targetValue: 3,
      label: 'pages visited',
    },
  ];
}

/**
 * Returns true if all 5 Level 1 modules are completed.
 */
export function isLevel1Complete(progress: ModuleProgress[]): boolean {
  return progress.every((p) => p.status === 'completed');
}

/**
 * Returns certification progress percentage.
 */
export function certificationProgress(progress: ModuleProgress[]): number {
  const completed = progress.filter((p) => p.status === 'completed').length;
  return Math.round((completed / progress.length) * 100);
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

export function saveCertificationRecord(record: CertificationRecord): void {
  try {
    const raw = localStorage.getItem(CERTIFICATION_KEY);
    const records = raw ? JSON.parse(raw) as Record<string, CertificationRecord> : {};
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
 * Director override: manually certify a TAE.
 */
export function directorCertifyRep(repUserId: string, repUserName: string, directorName: string): CertificationRecord {
  const progress = detectAllModules();
  const isComplete = isLevel1Complete(progress);

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

  // Also update the user's localStorage record
  updateUserCertificationStatus(repUserId, true);

  return record;
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
