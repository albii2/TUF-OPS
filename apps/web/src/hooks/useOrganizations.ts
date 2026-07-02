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

export function useOrganizations(params: OrganizationListParams) {
  const [orgs, setOrgs] = useState<Organization[]>([]);

  useEffect(() => {
    let cancelled = false;
    listOrganizations(params).then((result) => {
      if (!cancelled) setOrgs(result);
    }).catch(() => {
      if (!cancelled) setOrgs([]);
    });
    return () => { cancelled = true; };
  }, [params.search, params.status, params.rep, params.territory, params.director, params.coverageStatus, params.priority, params.refreshKey]);

  return orgs;
}

export function useOrganizationById(id?: string) {
  const [org, setOrg] = useState<Organization | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    if (id) {
      getOrganizationById(id).then((result) => {
        if (!cancelled) setOrg(result);
      }).catch(() => {
        if (!cancelled) setOrg(undefined);
      });
    } else {
      setOrg(undefined);
    }
    return () => { cancelled = true; };
  }, [id]);

  return org;
}

export function useUntouchedAccounts() {
  const [accounts, setAccounts] = useState<Organization[]>([]);

  useEffect(() => {
    let cancelled = false;
    listUntouchedAccounts().then((result) => {
      if (!cancelled) setAccounts(result);
    }).catch(() => {
      if (!cancelled) setAccounts([]);
    });
    return () => { cancelled = true; };
  }, []);

  return accounts;
}

export function useStaleAccounts() {
  const [accounts, setAccounts] = useState<Organization[]>([]);

  useEffect(() => {
    let cancelled = false;
    listStaleAccounts().then((result) => {
      if (!cancelled) setAccounts(result);
    }).catch(() => {
      if (!cancelled) setAccounts([]);
    });
    return () => { cancelled = true; };
  }, []);

  return accounts;
}

export function useAccountsNeedingAction() {
  const [accounts, setAccounts] = useState<Organization[]>([]);

  useEffect(() => {
    let cancelled = false;
    listAccountsNeedingAction().then((result) => {
      if (!cancelled) setAccounts(result);
    }).catch(() => {
      if (!cancelled) setAccounts([]);
    });
    return () => { cancelled = true; };
  }, []);

  return accounts;
}
