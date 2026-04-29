import { organizations, type Organization } from '../data/mockSalesData';
import { DATA_MODE } from './dataMode';

export type OrganizationListParams = {
  search?: string;
  status?: 'ALL' | Organization['status'];
  rep?: string;
};

export function listOrganizations(params: OrganizationListParams = {}): Organization[] {
  if (DATA_MODE !== 'mock') return [];

  return organizations.filter((org) => {
    const matchesSearch = (params.search ?? '').trim()
      ? [org.name, org.city, org.state, org.assignedRep, org.assignedDirector].join(' ').toLowerCase().includes((params.search ?? '').toLowerCase())
      : true;
    const matchesStatus = !params.status || params.status === 'ALL' || org.status === params.status;
    const matchesRep = !params.rep || params.rep === 'ALL' || org.assignedRep === params.rep;
    return matchesSearch && matchesStatus && matchesRep;
  });
}

export function getOrganizationById(id: string): Organization | undefined {
  if (DATA_MODE !== 'mock') return undefined;
  return organizations.find((org) => org.id === id);
}
