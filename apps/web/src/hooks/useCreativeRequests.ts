import { useMemo } from 'react';
import { createCreativeRequest, listCreativeRequestsByOpportunity, type CreativeRequest } from '../services/creativeRequestsService';

export function useCreativeRequests(opportunityId?: string) {
  return useMemo(() => opportunityId ? listCreativeRequestsByOpportunity(opportunityId) : [], [opportunityId]);
}

export function submitCreativeRequest(payload: Omit<CreativeRequest,'id'|'createdAt'|'updatedAt'|'createdBy'|'status'> & {status?: CreativeRequest['status']}) {
  return createCreativeRequest(payload);
}
