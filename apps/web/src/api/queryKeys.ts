import type { Role } from '@tuf/shared';
import type { OrganizationListParams } from '../services/organizationsService';
import type { OpportunityListParams } from '../services/opportunitiesService';
import type { OrderListParams } from '../services/ordersService';
import type { ActivityParams } from '../services/activitiesService';

export const queryKeys = {
  organizations: {
    all: ['organizations'] as const,
    list: (params?: OrganizationListParams) => ['organizations', 'list', params] as const,
    detail: (id: string) => ['organizations', 'detail', id] as const,
    untouched: () => ['organizations', 'untouched'] as const,
    stale: () => ['organizations', 'stale'] as const,
    needsAction: () => ['organizations', 'needs-action'] as const,
  },

  opportunities: {
    all: ['opportunities'] as const,
    list: (params?: OpportunityListParams) => ['opportunities', 'list', params] as const,
    detail: (id: string) => ['opportunities', 'detail', id] as const,
    stages: () => ['opportunities', 'stages'] as const,
    revenueLanes: () => ['opportunities', 'revenue-lanes'] as const,
  },

  orders: {
    all: ['orders'] as const,
    list: (params?: OrderListParams) => ['orders', 'list', params] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
    byOpportunityId: (opportunityId: string) => ['orders', 'by-opportunity', opportunityId] as const,
    opsWorkspace: () => ['orders', 'ops-workspace'] as const,
  },

  dashboard: {
    metrics: (role: Role, userId?: string, userEmail?: string) =>
      ['dashboard', 'metrics', role, userId, userEmail] as const,
  },

  activities: {
    list: (params?: ActivityParams) => ['activities', 'list', params] as const,
    today: () => ['activities', 'today'] as const,
  },

  users: {
    all: ['users'] as const,
    list: () => ['users', 'list'] as const,
  },

  reports: {
    summary: () => ['reports', 'summary'] as const,
  },

  territory: {
    all: ['territory'] as const,
    list: () => ['territory', 'list'] as const,
    repCoverage: () => ['territory', 'rep-coverage'] as const,
    untouched: () => ['territory', 'untouched'] as const,
  },

  recruiting: {
    all: ['recruiting'] as const,
    list: (params?: { stage?: string; director_id?: number; search?: string }) =>
      ['recruiting', 'list', params] as const,
    detail: (id: number) => ['recruiting', 'detail', id] as const,
    activities: (id: number) => ['recruiting', 'activities', id] as const,
    dashboard: (directorId?: number) => ['recruiting', 'dashboard', directorId] as const,
  },

  candidates: {
    all: ['candidates'] as const,
    list: (params?: { stage?: string; director_id?: number; search?: string }) =>
      ['candidates', 'list', params] as const,
    detail: (id: number) => ['candidates', 'detail', id] as const,
    activities: (id: number) => ['candidates', 'activities', id] as const,
  },

  workItems: {
    all: ['work-items'] as const,
    list: (params?: { owner_id?: number; status?: string; source?: string; priority?: string }) =>
      ['work-items', 'list', params] as const,
  },
} as const;
