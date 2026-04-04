import { Opportunity, Organization, User } from "@prisma/client";

export type DashboardData = {
  metrics: {
    needsAction: number;
    needsNextStep: number;
    needsUpdate: number;
  };
  snapshot: {
    totalOpportunities: number;
    totalValue: number;
    byStage: Record<string, number>;
  };
  deals: (Opportunity & { organization: Organization | null })[];
  owners: { ownerId: number; count: number; ownerName: string }[];
};

export type FocusMetric = {
  label: string;
  value: number;
};

export type NextAction = {
  id: string;
  opportunityName: string;
  organizationName: string;
  description: string;
  dueDate: Date;
  value: number;
};

export type PipelineStageSummary = {
  stage: string;
  count: number;
  totalValue: number;
};

export type RevenueSummary = {
  total: number;
  pending: number;
  overdue: number;
};

export type DealNearClose = {
  id: string;
  opportunityName: string;
  organizationName: string;
  value: number;
  closingDate: Date;
};

export type RecentActivity = {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  link: string;
};
