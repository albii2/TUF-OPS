import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  getOrganizationById,
  listAccountsNeedingAction,
  listOrganizations,
  listStaleAccounts,
  listUntouchedAccounts,
  listOrganizationsAsync,
  type OrganizationListParams,
} from '../services/organizationsService';
import { DATA_MODE } from '../services/dataMode';

export function useOrganizations(params: OrganizationListParams) {
  const [apiOrgs, setApiOrgs] = useState<any[]>([]);

  const refreshKey = params.refreshKey ?? 0;

  useEffect(() => {
    if (DATA_MODE === 'api') {
      let cancelled = false;
      listOrganizationsAsync(params).then((orgs) => {
        if (!cancelled) setApiOrgs(orgs);
      });
      return () => { cancelled = true; };
    }
  }, [params.search, params.status, params.rep, params.territory, params.director, params.coverageStatus, params.priority, refreshKey]);

  // In mock mode, use sync localStorage
  const mockOrgs = useMemo(
    () => listOrganizations(params),
    [params.search, params.status, params.rep, params.territory, params.director, params.coverageStatus, params.priority, refreshKey],
  );

  return DATA_MODE === 'api' ? apiOrgs : mockOrgs;
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
