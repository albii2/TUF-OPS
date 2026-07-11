import { useEffect, useState } from 'react';
import {
  getOrganizationByIdAsync,
  listOrganizationsAsync,
  type OrganizationListParams,
} from '../services/organizationsService';
import type { Organization } from '../data/mockSalesData';

export function useOrganizations(params: OrganizationListParams): Organization[] {
  const [data, setData] = useState<Organization[]>([]);

  useEffect(() => {
    let cancelled = false;
    listOrganizationsAsync(params).then((res) => {
      if (!cancelled) setData(res);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [params.search, params.status, params.rep, params.territory, params.director, params.coverageStatus, params.priority, params.refreshKey]);

  return data;
}

export function useOrganizationById(id?: string): Organization | undefined {
  const [data, setData] = useState<Organization | undefined>(undefined);

  useEffect(() => {
    if (!id) { setData(undefined); return; }
    let cancelled = false;
    getOrganizationByIdAsync(id).then((res) => {
      if (!cancelled) setData(res);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [id]);

  return data;
}

export function useUntouchedAccounts(): Organization[] {
  const [data, setData] = useState<Organization[]>([]);

  useEffect(() => {
    let cancelled = false;
    listOrganizationsAsync({}).then((res) => {
      if (!cancelled) setData(res.filter((o) => o.coverageStatus === 'UNTOUCHED'));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return data;
}

export function useStaleAccounts(): Organization[] {
  const [data, setData] = useState<Organization[]>([]);

  useEffect(() => {
    let cancelled = false;
    listOrganizationsAsync({}).then((res) => {
      if (!cancelled) {
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - 14);
        setData(res.filter((o) => new Date(o.lastActivity) < threshold));
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return data;
}

export function useAccountsNeedingAction(): Organization[] {
  const [data, setData] = useState<Organization[]>([]);

  useEffect(() => {
    let cancelled = false;
    listOrganizationsAsync({}).then((res) => {
      if (!cancelled) setData(res.filter((o) => o.coverageStatus !== 'CLOSED' && o.nextAction.trim().length > 0));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return data;
}
