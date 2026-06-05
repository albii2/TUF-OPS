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

export function useTrainingEnrollment(userId: number) {
  const [enrollment, setEnrollment] = useState<TrainingEnrollmentWithProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrollment = async () => {
      try {
        setLoading(true);
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
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchEnrollment();
    }
  }, [userId]);

  return { enrollment, loading, error };
}

export function useTrainingModule(moduleId: number, enrollmentId: number) {
  const [moduleData, setModuleData] = useState<{ module: TrainingModule; progress: TrainingProgress | undefined } | null>(null);
  const [loading, setLoading] = useState(false);

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
      console.error(err);
      throw err;
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
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { moduleData, loading, startModule, completeModule };
}
