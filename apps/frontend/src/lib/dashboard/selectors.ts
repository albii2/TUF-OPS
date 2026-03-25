import { Opportunity, Organization } from "@prisma/client";
import { 
  DashboardData,
  FocusMetric,
  NextAction,
  PipelineStageSummary,
  RevenueSummary,
  DealNearClose,
  RecentActivity
} from "@/types/dashboard";

// Placeholder selectors - these will be replaced with real logic

export function selectFocusMetrics(opportunities: Opportunity[]): FocusMetric[] {
  return [
    { label: "Deals Need Action", value: 6 },
    { label: "Near Close", value: 3 },
    { label: "Payments Pending", value: 4 },
  ];
}

export function selectNextActions(opportunities: Opportunity[]): NextAction[] {
  return [
    { id: "1", opportunityName: "Maple Grove Football", organizationName: "Maple Grove HS", description: "Send Invoice", dueDate: new Date(), value: 3240 },
    { id: "2", opportunityName: "Eden Prairie Football", organizationName: "Eden Prairie HS", description: "Follow Up (3 days)", dueDate: new Date(), value: 5100 },
    { id: "3", opportunityName: "Wayzata Basketball", organizationName: "Wayzata HS", description: "Send Mockup", dueDate: new Date(), value: 2800 },
  ];
}

export function selectPipelineSnapshot(opportunities: Opportunity[]): PipelineStageSummary[] {
  return [
    { stage: "Contacted", count: 42, totalValue: 42000 },
    { stage: "Mockup Created", count: 33, totalValue: 331000 },
    { stage: "Invoice Sent", count: 22, totalValue: 222000 },
    { stage: "Closed", count: 11, totalValue: 115000 },
  ];
}

export function selectRevenueSummary(opportunities: Opportunity[]): RevenueSummary {
  return {
    total: 38400,
    pending: 21200,
    overdue: 6800,
  };
}

export function selectDealsNearClose(opportunities: Opportunity[]): DealNearClose[] {
  return [
    { id: "1", opportunityName: "Maple Grove Football", organizationName: "Maple Grove HS", value: 6200, closingDate: new Date() },
    { id: "2", opportunityName: "Lakeville North", organizationName: "Lakeville North HS", value: 6200, closingDate: new Date() },
  ];
}

export function selectRecentActivity(opportunities: Opportunity[]): RecentActivity[] {
  return [
    { id: "1", type: "invoice", description: "You sent invoice", timestamp: new Date(), link: "/invoices/1" },
    { id: "2", type: "sample", description: "Sample approved", timestamp: new Date(), link: "/samples/1" },
    { id: "3", type: "deal", description: "New deal created", timestamp: new Date(), link: "/opportunities/1" },
  ];
}
