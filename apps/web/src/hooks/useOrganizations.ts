import { useEffect, useMemo, useState } from 'react';
import {
  getOrganizationById,
  getOrganizationByIdAsync,
  listAccountsNeedingAction,
  listOrganizations,
  listOrganizationsAsync,
  listStaleAccounts,
  listUntouchedAccounts,
  type OrganizationListParams,
} from '../services/organizationsService';
import type { Organization } from '../data/mockSalesData';
import { DATA_MODE } from '../services/dataMode';

export function useOrganizations(params: OrganizationListParams): Organization[] {
  const [apiData, setApiData] = useState<Organization[]>([]);

  useEffect(() => {
    if (DATA_MODE === 'api') {
      let cancelled = false;
      listOrganizationsAsync(params).then((data) => {
        if (!cancelled) setApiData(data);
      }).catch(() => {});
      return () => { cancelled = true; };
    }
  }, [params.search, params.status, params.rep, params.territory, params.director, params.coverageStatus, params.priority, params.refreshKey]);

  if (DATA_MODE === 'api') return apiData;

  return useMemo(
    () => listOrganizations(params),
    [params.search, params.status, params.rep, params.territory, params.director, params.coverageStatus, params.priority, params.refreshKey],
  );
}

export function useOrganizationById(id?: string): Organization | undefined {
  const [apiData, setApiData] = useState<Organization | undefined>(undefined);

  useEffect(() => {
    if (DATA_MODE === 'api') {
      if (!id) { setApiData(undefined); return; }
      let cancelled = false;
      getOrganizationByIdAsync(id).then((data) => {
        if (!cancelled) setApiData(data);
      }).catch(() => {});
      return () => { cancelled = true; };
    }
  }, [id]);

  if (DATA_MODE === 'api') return apiData;

  return useMemo(() => (id ? getOrganizationById(id) : undefined), [id]);
}

export function useUntouchedAccounts(): Organization[] {
  const [apiData, setApiData] = useState<Organization[]>([]);

  useEffect(() => {
    if (DATA_MODE === 'api') {
      let cancelled = false;
      listOrganizationsAsync({}).then((data) => {
        if (!cancelled) setApiData(data.filter((o) => o.coverageStatus === 'UNTOUCHED'));
      }).catch(() => {});
      return () => { cancelled = true; };
    }
  }, []);

  if (DATA_MODE === 'api') return apiData;
  return useMemo(() => listUntouchedAccounts(), []);
}

export function useStaleAccounts(): Organization[] {
  const [apiData, setApiData] = useState<Organization[]>([]);

  useEffect(() => {
    if (DATA_MODE === 'api') {
      let cancelled = false;
      listOrganizationsAsync({}).then((data) => {
        if (!cancelled) {
          const staleThreshold = new Date();
          staleThreshold.setDate(staleThreshold.getDate() - 14);
          setApiData(data.filter((o) => new Date(o.lastActivity) < staleThreshold));
        }
      }).catch(() => {});
      return () => { cancelled = true; };
    }
  }, []);

  if (DATA_MODE === 'api') return apiData;
  return useMemo(() => listStaleAccounts(), []);
}

export function useAccountsNeedingAction(): Organization[] {
  const [apiData, setApiData] = useState<Organization[]>([]);

  useEffect(() => {
    if (DATA_MODE === 'api') {
      let cancelled = false;
      listOrganizationsAsync({}).then((data) => {
        if (!cancelled) setApiData(data.filter((o) => o.coverageStatus !== 'CLOSED' && o.nextAction.trim().length > 0));
      }).catch(() => {});
      return () => { cancelled = true; };
    }
  }, []);

  if (DATA_MODE === 'api') return apiData;
  return useMemo(() => listAccountsNeedingAction(), []);
}
