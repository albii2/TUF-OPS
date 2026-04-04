import { Opportunity, User } from "@prisma/client";
import { 
  DashboardData,
  FocusMetric,
  NextAction,
  PipelineStageSummary,
  RevenueSummary,
  DealNearClose,
  RecentActivity
} from "@/types/dashboard";
import {
    needsOpportunityAction,
    isNextStepOverdue
} from "@/lib/workflow/opportunity-workflow";

export function selectFocusMetrics(opportunities: Opportunity[], user: User | null): FocusMetric[] {
  const myOpps = opportunities.filter(opp => opp.ownerId === user?.id);
  const dealsNeedAction = myOpps.filter(opp => needsOpportunityAction(opp)).length;
  const nearClose = myOpps.filter(opp => ["invoice"].includes(opp.stage || "")).length;

  return [
    { label: "My Deals Need Action", value: dealsNeedAction },
    { label: "My Deals Near Close", value: nearClose },
  ];
}

export function selectNextActions(opportunities: (Opportunity & { program: { name: string } | null})[], user: User | null): NextAction[] {
    const myOpps = opportunities.filter(opp => opp.ownerId === user?.id);
    const actions = myOpps
        .filter(opp => needsOpportunityAction({
            stage: opp.stage,
            nextStep: opp.nextStep,
            nextStepDueDate: opp.nextStepDueDate,
            updatedAt: opp.updated_at,
        }))
        .sort((a, b) => {
            const aIsOverdue = isNextStepOverdue(a);
            const bIsOverdue = isNextStepOverdue(b);
            if (aIsOverdue && !bIsOverdue) return -1;
            if (!aIsOverdue && bIsOverdue) return 1;
            return (b.estimated_value ? Number(b.estimated_value) : 0) - (a.estimated_value ? Number(a.estimated_value) : 0);
        })
        .map(opp => ({
            id: opp.id.toString(),
            opportunityName: opp.name,
            programName: opp.program?.name || "-",
            description: opp.nextStep || "Define next step",
            dueDate: opp.nextStepDueDate || new Date(),
            value: opp.estimated_value ? Number(opp.estimated_value) : 0,
        }));

  return actions;
}

export function selectPipelineSnapshot(opportunities: Opportunity[], user: User | null): PipelineStageSummary[] {
  // Placeholder logic remains for now
  return [
    { stage: "Contacted", count: 42, totalValue: 42000 },
    { stage: "Mockup Created", count: 33, totalValue: 331000 },
    { stage: "Invoice Sent", count: 22, totalValue: 222000 },
    { stage: "Closed", count: 11, totalValue: 115000 },
  ];
}

export function selectRevenueSummary(opportunities: Opportunity[], user: User | null): RevenueSummary {
  // Placeholder logic remains for now
  return {
    total: 38400,
    pending: 21200,
    overdue: 6800,
  };
}

export function selectDealsNearClose(opportunities: (Opportunity & { program: { name: string } | null})[], user: User | null): DealNearClose[] {
    const myOpps = opportunities.filter(opp => opp.ownerId === user?.id);
    return myOpps
        .filter(opp => ["invoice"].includes(opp.stage || ""))
        .map(opp => ({
            id: opp.id.toString(),
            opportunityName: opp.name,
            programName: opp.program?.name || "-",
            value: opp.estimated_value ? Number(opp.estimated_value) : 0,
            closingDate: opp.close_date || new Date(),
        }));
}

export function selectRecentActivity(opportunities: Opportunity[], user: User | null): RecentActivity[] {
  // Placeholder logic remains for now
  return [
    { id: "1", type: "invoice", description: "You sent invoice", timestamp: new Date(), link: "/invoices/1" },
    { id: "2", type: "sample", description: "Sample approved", timestamp: new Date(), link: "/samples/1" },
    { id: "3", type: "deal", description: "New deal created", timestamp: new Date(), link: "/opportunities/1" },
  ];
}
