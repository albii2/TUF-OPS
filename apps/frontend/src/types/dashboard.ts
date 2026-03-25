import { Opportunity, Organization } from "@prisma/client";

export type FocusMetric = {
  label: string;
  value: number | string;
  change?: string;
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

export type DashboardData = {
  focusMetrics: FocusMetric[];
  nextActions: NextAction[];
  pipelineSnapshot: PipelineStageSummary[];
  revenueSummary: RevenueSummary;
  dealsNearClose: DealNearClose[];
  recentActivity: RecentActivity[];
};
