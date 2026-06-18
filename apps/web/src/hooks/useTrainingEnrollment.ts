import { useEffect, useState } from 'react';

export type TrainingPhase = 'DAY_1' | 'DAY_1_2' | 'WEEK_1_2' | 'MONTH_1';

const TRAINING_API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/training`;

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
  created_at: string;
  updated_at: string;
}

export interface TrainingEnrollment {
  id: number;
  user_id: number;
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
  enrollment_id: number;
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
    phaseCompletionStatus: Record<string, { completed: number; total: number; percentComplete: number }>;
  };
}

export const ACADEMY_PHASES = [
  'LEVEL_1_OPERATOR',
  'LEVEL_2_PRODUCT',
  'LEVEL_3_TERRITORY',
  'LEVEL_4_SALES',
  'LEVEL_5_EXPANSION',
  'SPECIALIZED_TRACKS',
  'LEVEL_7_DIRECTOR',
  'MARKET_MASTERY',
] as const;

export const ACADEMY_PHASE_LABELS: Record<string, string> = {
  LEVEL_1_OPERATOR: 'Level 1 • TUF Operator',
  LEVEL_2_PRODUCT: 'Level 2 • Product',
  LEVEL_3_TERRITORY: 'Level 3 • Territory Development',
  LEVEL_4_SALES: 'Level 4 • Sales',
  LEVEL_5_EXPANSION: 'Level 5 • Account Expansion',
  SPECIALIZED_TRACKS: 'Specialized Tracks',
  LEVEL_7_DIRECTOR: 'Level 7 • Director',
  MARKET_MASTERY: 'Market Mastery',
  DAY_1: 'Legacy • Day 1',
  DAY_1_2: 'Legacy • Day 1-2',
  WEEK_1_2: 'Legacy • Week 1-2',
  MONTH_1: 'Legacy • Month 1',
};

function lessonContent(title: string, application: string, action = 'Open TUF Ops, identify five assigned athletic programs, and create one specific next action for each account before lunch.'): string {
  return `## Learning Objective\nUse ${title} to improve the rep's ability to identify, create, advance, close, or expand athletic program opportunities.\n\n## Why It Matters\nTUF Academy exists to create self-sufficient territory developers who can consistently generate a minimum of four orders per month through disciplined prospecting, consultative selling, account expansion, and ecosystem development.\n\n## Core Lesson\nLearn the operating standard, buyer context, opportunity triggers, and qualification signals connected to ${title}. The rep should connect every conversation to a current state, desired state, business gap, next step, and expansion path.\n\n## TUF-Specific Application\n${application}\n\n## Real-World Example\nA rep starts with a football uniform conversation, maps the athletic director, booster contact, youth feeder program, and seasonal buying window, then expands the account into player packs, a team store, and lettermen timing.\n\n## Common Mistakes\nTreating TUF as a generic apparel vendor; leaving calls without a next step; failing to map additional sports, boosters, youth programs, stores, player packs, lettermen, and refresh cycles.\n\n## Action Steps\n1. Identify the buyer and buying window.\n2. Diagnose the current state, desired state, and gap.\n3. Position the TUF solution with a clear commercial insight.\n4. Create a dated follow-up and ecosystem expansion path.\n\n## Knowledge Check\nScenario question: Which buyer, pain, implication, next step, and expansion opportunity should be documented before the opportunity advances?\n\n## Practical Exercise\n${action}\n\n## Tomorrow Morning\n${action}`;
}

const productApplication = (name: string, sport: string) => `${name} serves ${sport}. Reps must know what it is, who buys it, when they buy it, how to position it, typical objections, expansion opportunities, team store opportunities, player pack opportunities, lettermen opportunities, and the exact follow-up that creates the next sale.`;

const module = (id: number, phase: string, order_index: number, title: string, description: string, content: string, requiredScore: number, module_type = 'CERTIFICATION_MODULE'): Omit<TrainingModule, 'role' | 'created_at' | 'updated_at'> => ({
  id,
  title,
  description: `${description} Required score: ${requiredScore}%.`,
  phase,
  order_index,
  content_markdown: content,
  estimated_duration_minutes: 30,
  module_type,
});

const DEFAULT_TRAINING_MODULES: Array<Omit<TrainingModule, 'role' | 'created_at' | 'updated_at'>> = [
  ...['Understanding TUF Ops','Navigating the Dashboard','Organizations, Opportunities, Activities & Orders','Territory Ownership','Performance Expectations & Four Orders Per Month'].map((title, i) => module(1101 + i, 'LEVEL_1_OPERATOR', i + 1, title, 'Understand TUF and TUF Ops so reps can operate independently.', lessonContent(title, 'Operate TUF Ops as the command center for accounts, opportunities, activities, orders, and four-order-per-month execution.'), 80)),
  ...[
    ['Football — TUF Overdrive™','football'], ['Basketball — TUF Overtime™','basketball'], ['Baseball — TUF Flex™','baseball'], ['Volleyball','volleyball'], ['Hockey','hockey programs in Minnesota, Wisconsin, and hockey-focused markets'], ['Wrestling — TUF Mat-Lock™','wrestling'], ['7v7 & Flag — TUF ISSUE™ SHIFT','7v7 and flag football'], ["Women's Basketball", "girls and women's basketball"], ["Women's Volleyball", "girls and women's volleyball"], ["Women's Flag Football", "girls and women's flag football"], ['Softball','softball'], ["Women's Soccer & Training Apparel", "girls and women's soccer and training"], ['Player Packs','all athletic programs'], ['Team Stores','schools, youth, travel, club, and fan ecosystems'], ['Lettermen Jackets','school pride and annual recognition cycles'], ['Tech Suits — TUF Third-Shift™','performance training'], ['Hoodies & Shorts','team and fan basics'], ['Fan & Team Tees','fundraising and fan apparel'], ['Headwear & Accessories','add-on and spirit opportunities'], ['Travel Bags','travel gear'], ['Production & Fulfillment','lead times, mockups, artwork, production, and delivery'],
  ].map(([title, sport], i) => module(1201 + i, 'LEVEL_2_PRODUCT', i + 1, title, 'Know products better than coaches and connect each product to ecosystem expansion.', lessonContent(title, productApplication(title, sport)), 90, 'PRODUCT_CERTIFICATION')),
  ...['Fanatical Prospecting for TUF','Understanding Athletic Departments','Account Intelligence & Opportunity Extraction','Expansion Ladder™','Ecosystem Referral™','Refresh Cycle™','Pipeline Management','Forecasting'].map((title, i) => module(1301 + i, 'LEVEL_3_TERRITORY', i + 1, title, 'Generate opportunities through disciplined prospecting and account mapping.', lessonContent(title, 'Map each school from athletic director to coaches, boosters, youth, travel, camps, additional sports, player packs, team stores, lettermen, and TUF School potential.'), 85)),
  ...['SPIN Selling for Coaches','Discovery Meetings','Gap Selling for Athletic Programs','Challenger Selling','Presenting Solutions','Objection Handling: Budget, Vendor, Timing & Brand Loyalty','Negotiation','Closing Techniques'].map((title, i) => module(1401 + i, 'LEVEL_4_SALES', i + 1, title, 'Close business through consultative discovery, insight, empathy, and next-step control.', lessonContent(title, 'Use situation, problem, implication, need-payoff, current-state/desired-state gaps, teaching insights, and tactical empathy without copying any third-party framework.'), 85)),
  ...['Growing Existing Accounts','Cross-Selling Sports','Player Pack Expansion','Team Store Expansion','Lettermen Expansion','Building TUF Schools'].map((title, i) => module(1501 + i, 'LEVEL_5_EXPANSION', i + 1, title, 'Increase account value through multi-sport agreements and long-term ecosystem development.', lessonContent(title, 'Convert single-order customers into annual athletic partnerships across sports, stores, player packs, lettermen, youth, travel, and fan apparel.'), 85)),
  ...["Women's Division Sales Certification", 'Hockey Certification', 'Wrestling Certification'].map((title, i) => module(1601 + i, 'SPECIALIZED_TRACKS', i + 1, title, 'Specialized certification required for relevant roles, territories, or market focus.', lessonContent(title, 'Apply specialized buyer knowledge, buying cycles, booster dynamics, store strategy, and expansion planning for the assigned market or division.'), 85, 'SPECIALIZED_CERTIFICATION')),
  ...['Recruiting','Interviewing','Training Reps','Pipeline Reviews','Forecasting','Performance Management','Territory Expansion','Building State Organizations','Leadership Accountability'].map((title, i) => module(1701 + i, 'LEVEL_7_DIRECTOR', i + 1, title, 'Certify State and Regional Directors to recruit, coach, forecast, and scale accountable territory organizations.', lessonContent(title, 'Directors use Academy standards to develop reps, review pipelines, enforce four-order-per-month execution, and build scalable state organizations.'), 85, 'DIRECTOR_CERTIFICATION')),
  ...['Minnesota Market Mastery','Wisconsin Market Mastery','Illinois Market Mastery'].map((title, i) => module(1801 + i, 'MARKET_MASTERY', i + 1, title, 'Regional playbook for buying cycles, priority sports, booster opportunities, and ecosystem timing.', lessonContent(title, 'Document football, basketball, hockey, wrestling, youth, travel, booster, lettermen, and team store cycles where relevant. Future markets can be added as new market mastery modules.'), 85, 'MARKET_PLAYBOOK')),
];

function getCurrentTrainingRole() {
  try {
    const raw = localStorage.getItem('tuf_ops_user_v3');
    if (!raw) return 'REP';
    const parsed = JSON.parse(raw);
    return parsed.role || 'REP';
  } catch {
    return 'REP';
  }
}

function buildDefaultEnrollment(userId: number, role = getCurrentTrainingRole()): TrainingEnrollmentWithProgress {
  const now = new Date().toISOString();
  const modules = DEFAULT_TRAINING_MODULES.map(module => ({
    ...module,
    role,
    created_at: now,
    updated_at: now,
  }));
  const phases = ACADEMY_PHASES;
  const phaseCompletionStatus: Record<string, { completed: number; total: number; percentComplete: number }> = {};
  phases.forEach(phase => {
    phaseCompletionStatus[phase] = {
      completed: 0,
      total: modules.filter(module => module.phase === phase).length,
      percentComplete: 0,
    };
  });

  return {
    enrollment: {
      id: userId,
      user_id: userId,
      role,
      status: 'ACTIVE',
      current_phase: 'LEVEL_1_OPERATOR',
      enrolled_at: now,
      created_at: now,
      updated_at: now,
    },
    modules,
    progress: [],
    completionMetrics: {
      totalModules: modules.length,
      completedModules: 0,
      percentComplete: 0,
      phaseCompletionStatus,
    },
  };
}

export function useTrainingEnrollment(userId: number) {
  const [enrollment, setEnrollment] = useState<TrainingEnrollmentWithProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrollment = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${TRAINING_API_BASE_URL}/enrollment?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch enrollment');
        }
        const data = await response.json();
        setEnrollment(data);
        localStorage.setItem(`tuf_ops_training_v1_${userId}`, JSON.stringify(data));
      } catch (err) {
        const cached = localStorage.getItem(`tuf_ops_training_v1_${userId}`);
        if (cached) {
          setEnrollment(JSON.parse(cached));
        } else {
          const fallbackEnrollment = buildDefaultEnrollment(userId);
          setEnrollment(fallbackEnrollment);
          localStorage.setItem(`tuf_ops_training_v1_${userId}`, JSON.stringify(fallbackEnrollment));
          setError(null);
        }
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchEnrollment();
    }
  }, [userId]);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<TrainingEnrollmentWithProgress>;
      if (customEvent.detail && customEvent.detail.enrollment.user_id === userId) {
        setEnrollment(customEvent.detail);
      }
    };
    window.addEventListener('tuf:training-updated', handleUpdate);
    return () => window.removeEventListener('tuf:training-updated', handleUpdate);
  }, [userId]);

  return { enrollment, loading, error };
}

export function useTrainingModule(moduleId: number, enrollmentId: number) {
  const [moduleData, setModuleData] = useState<{ module: TrainingModule; progress: TrainingProgress | undefined } | null>(null);
  const [loading, setLoading] = useState(false);

  const getUserIdFromLocalStorage = () => {
    const raw = localStorage.getItem('tuf_ops_user_v3');
    if (!raw) return 21; // fallback
    try {
      const parsed = JSON.parse(raw);
      return parseInt(parsed.id.replace('u-local-', '').replace('u-rep-', '').replace('u-director-', ''), 10) || 21;
    } catch {
      return 21;
    }
  };

  const updateLocalProgress = (modId: number, status: 'IN_PROGRESS' | 'COMPLETED', timeSpentSeconds?: number) => {
    const userId = getUserIdFromLocalStorage();
    const cacheKey = `tuf_ops_training_v1_${userId}`;
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as TrainingEnrollmentWithProgress;
      
      let progressRow = data.progress.find(p => p.module_id === modId);
      if (!progressRow) {
        progressRow = {
          id: Date.now(),
          enrollment_id: data.enrollment.id,
          module_id: modId,
          status,
          time_spent_seconds: timeSpentSeconds || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        data.progress.push(progressRow);
      } else {
        progressRow.status = status;
        if (timeSpentSeconds !== undefined) {
          progressRow.time_spent_seconds = timeSpentSeconds;
        }
        progressRow.updated_at = new Date().toISOString();
        if (status === 'COMPLETED') {
          progressRow.completed_at = new Date().toISOString();
        }
      }
      
      const completed = data.progress.filter(p => p.status === 'COMPLETED');
      const completedIds = new Set(completed.map(c => c.module_id));
      const completedModules = data.modules.filter(m => completedIds.has(m.id)).length;
      const totalModules = data.modules.length;
      const percentComplete = Math.round((completedModules / totalModules) * 100) || 0;
      
      const phases = ACADEMY_PHASES;
      const phaseCompletionStatus: Record<string, { completed: number; total: number; percentComplete: number }> = {};
      phases.forEach(p => {
        const phaseModules = data.modules.filter(m => m.phase === p);
        const phaseCompleted = phaseModules.filter(m => completedIds.has(m.id)).length;
        const phaseTotal = phaseModules.length;
        phaseCompletionStatus[p] = {
          completed: phaseCompleted,
          total: phaseTotal,
          percentComplete: Math.round((phaseCompleted / phaseTotal) * 100) || 0
        };
      });
      
      if (percentComplete === 100) {
        data.enrollment.status = 'COMPLETED';
        data.enrollment.completed_at = new Date().toISOString();
        
        const userRaw = localStorage.getItem('tuf_ops_user_v3');
        if (userRaw) {
          const userObj = JSON.parse(userRaw);
          if (userObj.role === 'REP') {
            const hrDocsCompleted = userObj.hrDocsCompleted || false;
            const directorSignedOff = userObj.directorSignedOff || false;
            userObj.isCertified = hrDocsCompleted && directorSignedOff;
            localStorage.setItem('tuf_ops_user_v3', JSON.stringify(userObj));
            window.dispatchEvent(new CustomEvent('tuf:user-updated', { detail: userObj }));
          }
        }
      }
      
      data.completionMetrics = {
        totalModules,
        completedModules,
        percentComplete,
        phaseCompletionStatus
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('tuf:training-updated', { detail: data }));
    } catch (e) {
      console.error('Failed to update local progress:', e);
    }
  };

  const startModule = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${TRAINING_API_BASE_URL}/progress/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId, moduleId }),
      });
      if (!response.ok) throw new Error('Failed to start module');
      return await response.json();
    } catch (err) {
      console.warn('API connection failed, updating LocalStorage offline:', err);
      updateLocalProgress(moduleId, 'IN_PROGRESS');
      return { success: true, offline: true };
    } finally {
      setLoading(false);
    }
  };

  const completeModule = async (timeSpentSeconds?: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${TRAINING_API_BASE_URL}/progress/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId, moduleId, timeSpentSeconds }),
      });
      if (!response.ok) throw new Error('Failed to complete module');
      return await response.json();
    } catch (err) {
      console.warn('API connection failed, updating LocalStorage offline:', err);
      updateLocalProgress(moduleId, 'COMPLETED', timeSpentSeconds);
      return { success: true, offline: true };
    } finally {
      setLoading(false);
    }
  };

  return { moduleData, loading, startModule, completeModule };
}
