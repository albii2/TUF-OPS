import { useQuery } from '@tanstack/react-query';
import { listWorkItems, queryKeys } from '../api';
import type { WorkItem, WorkItemListParams } from '../services/workItemsService';

export function useWorkItems(params: WorkItemListParams = {}) {
  return useQuery<WorkItem[]>({
    queryKey: queryKeys.workItems.list(params),
    queryFn: () => listWorkItems(params),
  });
}
