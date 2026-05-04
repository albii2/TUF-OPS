import { useMemo } from 'react';
import {
  getOrganizationById,
  listAccountsNeedingAction,
  listOrganizations,
  listStaleAccounts,
  listUntouchedAccounts,
  type OrganizationListParams,
} from '../services/organizationsService';

export function useOrganizations(params: OrganizationListParams) {
  return useMemo(
    () => listOrganizations(params),
    [params.search, params.status, params.rep, params.territory, params.director, params.coverageStatus, params.priority],
  );
}

export function useOrganizationById(id?: string) {
  return useMemo(() => (id ? getOrganizationById(id) : undefined), [id]);
}

export function useUntouchedAccounts() {
  return useMemo(() => listUntouchedAccounts(), []);
}

export function useStaleAccounts() {
  return useMemo(() => listStaleAccounts(), []);
}

export function useAccountsNeedingAction() {
  return useMemo(() => listAccountsNeedingAction(), []);
}
