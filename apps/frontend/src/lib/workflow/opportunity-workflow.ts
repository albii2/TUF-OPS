import { differenceInDays } from "date-fns";
import {
  NON_ACTIONABLE_OPPORTUNITY_STAGES,
  OPPORTUNITY_STAGE_LABELS,
  type OpportunityStage,
} from "./opportunity-stages";

type WorkflowOpportunityLike = {
  stage?: string | null;
  nextStep?: string | null;
  nextStepDueDate?: Date | string | null;
  updatedAt?: Date | string | null;
};

export function isOpportunityStage(value: string | null | undefined): value is OpportunityStage {
  return !!value && value in OPPORTUNITY_STAGE_LABELS;
}

export function getOpportunityStageLabel(stage?: string | null): string {
  if (isOpportunityStage(stage)) return OPPORTUNITY_STAGE_LABELS[stage];
  return "Unstaged";
}

export function isTerminalOpportunityStage(stage?: string | null): boolean {
  return stage === "won" || stage === "closed_lost";
}

export function isNonActionableOpportunityStage(stage?: string | null): boolean {
  return stage === "won" || stage === "closed_lost" || stage === "inactive";
}

export function hasNextStep(opportunity: WorkflowOpportunityLike): boolean {
  return !!opportunity.nextStep?.trim();
}

export function isNextStepOverdue(opportunity: WorkflowOpportunityLike, now = new Date()): boolean {
  if (!opportunity.nextStepDueDate) return false;
  const due = new Date(opportunity.nextStepDueDate);
  return due.getTime() < now.getTime();
}

export function isOpportunityAtRisk(opportunity: WorkflowOpportunityLike, now = new Date()): boolean {
    if (!opportunity.nextStepDueDate) return false;
    const due = new Date(opportunity.nextStepDueDate);
    return differenceInDays(due, now) <= 3;
}

export function getOpportunityStaleThresholdDays(stage?: string | null): number | null {
  switch (stage) {
    case "invoice_ready":
    case "invoice_sent":
    case "payment_pending":
      return 3;
    case "awaiting_approval":
    case "mockup_sent":
    case "sample_sent":
      return 5;
    case "lead_identified":
    case "contacting":
    case "discovery":
    case "mockup_requested":
    case "sample_required":
      return 7;
    case "won":
    case "closed_lost":
    case "inactive":
      return null;
    default:
      return 7;
  }
}

export function isOpportunityStale(opportunity: WorkflowOpportunityLike, now = new Date()): boolean {
  const thresholdDays = getOpportunityStaleThresholdDays(opportunity.stage);
  if (thresholdDays == null || !opportunity.updatedAt) return false;

  const updated = new Date(opportunity.updatedAt);
  const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;

  return now.getTime() - updated.getTime() > thresholdMs;
}

export function needsOpportunityAction(opportunity: WorkflowOpportunityLike, now = new Date()): boolean {
  if (isNonActionableOpportunityStage(opportunity.stage)) return false;
  if (!hasNextStep(opportunity)) return true;
  if (isNextStepOverdue(opportunity, now)) return true;
  if (isOpportunityStale(opportunity, now)) return true;
  return false;
}

export function getOpportunityHealth(opportunity: WorkflowOpportunityLike, now = new Date()): "overdue" | "at_risk" | "missing_step" | "healthy" {
    if (isNonActionableOpportunityStage(opportunity.stage)) return "healthy";
    if (isNextStepOverdue(opportunity, now)) return "overdue";
    if (!hasNextStep(opportunity)) return "missing_step";
    if (isOpportunityStale(opportunity, now)) return "at_risk";
    if (isOpportunityAtRisk(opportunity, now)) return "at_risk";
    return "healthy";
}

export function getOpportunityHealthState(opportunity: WorkflowOpportunityLike, now = new Date()): "healthy" | "warning" | "urgent" | "inactive" {
  if (opportunity.stage === "inactive") return "inactive";
  if (isNextStepOverdue(opportunity, now)) return "urgent";
  if (needsOpportunityAction(opportunity, now)) return "warning";
  return "healthy";
}
