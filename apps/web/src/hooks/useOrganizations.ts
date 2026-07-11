import { useEffect, useMemo, useState } from 'react';
import {
  getOrganizationById,
  listAccountsNeedingAction,
  listOrganizations,
  listStaleAccounts,
  listUntouchedAccounts,
  type OrganizationListParams,
} from '../services/organizationsService';
import type { Organization } from '../data/mockSalesData';

export function useOrganizations(params: OrganizationListParams): Organization[] {
  const [apiData, setApiData] = useState<Organization[]>([]);

  useEffect(() => {
    let cancelled = false;
    listOrganizations(params).then((data) => {
      if (!cancelled) setApiData(data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [params.search, params.status, params.rep, params.territory, params.director, params.coverageStatus, params.priority, params.refreshKey]);

  return apiData;
}

export function useOrganizationById(id?: string): Organization | undefined {
  const [apiData, setApiData] = useState<Organization | undefined>(undefined);

  useEffect(() => {
    if (!id) { setApiData(undefined); return; }
    let cancelled = false;
    getOrganizationById(id).then((data) => {
      if (!cancelled) setApiData(data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [id]);

  return apiData;
}

export function useUntouchedAccounts(): Organization[] {
  const [apiData, setApiData] = useState<Organization[]>([]);

  useEffect(() => {
    let cancelled = false;
    listOrganizations({}).then((data) => {
      if (!cancelled) setApiData(data.filter((o) => o.coverageStatus === 'UNTOUCHED'));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return apiData;
}

export function useStaleAccounts(): Organization[] {
  const [apiData, setApiData] = useState<Organization[]>([]);

  useEffect(() => {
    let cancelled = false;
    listOrganizations({}).then((data) => {
      if (!cancelled) {
        const staleThreshold = new Date();
        staleThreshold.setDate(staleThreshold.getDate() - 14);
        setApiData(data.filter((o) => new Date(o.lastActivity) < staleThreshold));
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return apiData;
}

export function useAccountsNeedingAction(): Organization[] {
  const [apiData, setApiData] = useState<Organization[]>([]);

  useEffect(() => {
    let cancelled = false;
    listOrganizations({}).then((data) => {
      if (!cancelled) setApiData(data.filter((o) => o.coverageStatus !== 'CLOSED' && o.nextAction.trim().length > 0));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return apiData;
}
