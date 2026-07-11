import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import { getStoredUser } from '../auth';
import { queryKeys } from '../api';

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
  const queryClient = useQueryClient();

  const todayQuery = useQuery<DailyActivityEntry[]>({
    queryKey: queryKeys.activities.today(),
    queryFn: async () => {
      const data = await apiClient<{ activities: DailyActivityEntry[]; date: string }>('/daily-activities/today');
      return data.activities || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (input: DailyActivityInput) => {
      return apiClient<DailyActivityEntry>('/daily-activities', {
        method: 'POST',
        body: input,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.today() });
    },
  });

  const fetchToday = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.today() });
  }, [queryClient]);

  const myEntry = (todayQuery.data || []).find((e) => e.user_id === Number(user?.id)) || null;

  return {
    today: todayQuery.data || [],
    myEntry,
    loading: todayQuery.isLoading,
    saving: saveMutation.isPending,
    error: todayQuery.error ? (todayQuery.error instanceof Error ? todayQuery.error.message : 'Failed to load') : null,
    fetchToday,
    saveActivity: saveMutation.mutateAsync,
  };
}
