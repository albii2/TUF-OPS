import { useMemo } from 'react';
import { getOrganizationById, listOrganizations, type OrganizationListParams } from '../services/organizationsService';

export function useOrganizations(params: OrganizationListParams) {
  return useMemo(() => listOrganizations(params), [params.search, params.status, params.rep]);
}

export function useOrganizationById(id?: string) {
  return useMemo(() => (id ? getOrganizationById(id) : undefined), [id]);
}
