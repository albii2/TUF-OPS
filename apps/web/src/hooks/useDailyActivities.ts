import { useState, useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import { getStoredUser } from '../auth';

export interface DailyActivityEntry {
  id: number;
  user_id: number;
  activity_date: string;
  calls: number;
  emails: number;
  texts: number;
  linkedin_msgs: number;
  conversations: number;
  meetings: number;
  quotes: number;
  follow_ups: number;
  new_opps: number;
  next_actions: string | null;
  user_name?: string;
  user_role?: string;
}

export interface DailyActivityInput {
  calls?: number;
  emails?: number;
  texts?: number;
  linkedin_msgs?: number;
  conversations?: number;
  meetings?: number;
  quotes?: number;
  follow_ups?: number;
  new_opps?: number;
  next_actions?: string;
}

export function useDailyActivities() {
  const user = getStoredUser();
  const [today, setToday] = useState<DailyActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchToday = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient<{ activities: DailyActivityEntry[]; date: string }>('/daily-activities/today');
      setToday(data.activities || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveActivity = useCallback(async (input: DailyActivityInput) => {
    setSaving(true);
    try {
      const result = await apiClient<DailyActivityEntry>('/daily-activities', {
        method: 'POST',
        body: input,
      });
      await fetchToday();
      return result;
    } catch (err: any) {
      setError(err?.message || 'Failed to save');
      return null;
    } finally {
      setSaving(false);
    }
  }, [fetchToday]);

  const myEntry = today.find((e) => e.user_id === Number(user?.id)) || null;

  return { today, myEntry, loading, saving, error, fetchToday, saveActivity };
}
