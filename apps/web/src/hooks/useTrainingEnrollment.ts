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

const DEFAULT_TRAINING_MODULES: Array<Omit<TrainingModule, 'role' | 'created_at' | 'updated_at'>> = [
  {
    id: 1001,
    title: 'Welcome to TUF Academy',
    description: 'Get oriented to the TUF Sports operating system and onboarding path.',
    phase: 'DAY_1',
    order_index: 1,
    content_markdown: 'Welcome to TUF Academy. This module introduces the expectations, tools, and daily rhythm for every Rep.',
    estimated_duration_minutes: 10,
    module_type: 'MODULE',
  },
  {
    id: 1002,
    title: 'NDA & Confidentiality',
    description: 'Review confidentiality expectations before accessing playbooks and sales materials.',
    phase: 'DAY_1',
    order_index: 2,
    content_markdown: 'Review and acknowledge the NDA requirements before working with TUF customer, pricing, and operating information.',
    estimated_duration_minutes: 15,
    module_type: 'INTERACTIVE',
  },
  {
    id: 1003,
    title: 'TUF Sales Playbook',
    description: 'Learn the core talk tracks, territory standards, and account strategy.',
    phase: 'DAY_1_2',
    order_index: 3,
    content_markdown: 'Study the TUF Sales Playbook and understand how to position uniforms, travel gear, team stores, and letterman opportunities.',
    estimated_duration_minutes: 30,
    module_type: 'MODULE',
  },
  {
    id: 1004,
    title: 'Prospecting & Account Coverage',
    description: 'Practice account research, outreach sequencing, and next-action discipline.',
    phase: 'DAY_1_2',
    order_index: 4,
    content_markdown: 'Build a prospecting plan for your territory and define the next action for every assigned school or organization.',
    estimated_duration_minutes: 25,
    module_type: 'HANDS_ON',
  },
  {
    id: 1005,
    title: 'KPIs & Daily Operating Cadence',
    description: 'Understand the metrics that drive territory performance.',
    phase: 'WEEK_1_2',
    order_index: 5,
    content_markdown: 'Learn how pipeline value, order volume, activity quality, and lane penetration combine into a successful TUF territory.',
    estimated_duration_minutes: 20,
    module_type: 'MODULE',
  },
  {
    id: 1006,
    title: 'The Challenger Sale',
    description: 'Use commercial insight to reframe customer needs and create urgency.',
    phase: 'WEEK_1_2',
    order_index: 6,
    content_markdown: 'Apply Challenger Sale principles to teach, tailor, and take control during customer conversations.',
    estimated_duration_minutes: 35,
    module_type: 'VIDEO',
  },
  {
    id: 1007,
    title: 'Gap Selling',
    description: 'Identify the current state, future state, and business impact for every opportunity.',
    phase: 'MONTH_1',
    order_index: 7,
    content_markdown: 'Use Gap Selling to diagnose customer problems and connect TUF solutions to measurable outcomes.',
    estimated_duration_minutes: 35,
    module_type: 'MODULE',
  },
  {
    id: 1008,
    title: 'Extreme Ownership',
    description: 'Set the accountability standard for territory execution and customer follow-through.',
    phase: 'MONTH_1',
    order_index: 8,
    content_markdown: 'Complete onboarding by committing to ownership over activity, communication, and results.',
    estimated_duration_minutes: 20,
    module_type: 'INTERACTIVE',
  },
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
  const phases = ['DAY_1', 'DAY_1_2', 'WEEK_1_2', 'MONTH_1'];
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
      current_phase: 'DAY_1',
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
      
      const phases = ['DAY_1', 'DAY_1_2', 'WEEK_1_2', 'MONTH_1'];
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
