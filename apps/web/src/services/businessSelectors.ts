import type { Opportunity, Organization, Order, RevenueLane } from '../data/mockSalesData';
import { getOrderRisk } from './orderWorkflow';
import { getMomentumState as getUnifiedMomentumState, getStaleOpenOpportunities, getStaleOrganizations } from './kpiUtils';

const NEAR_CLOSE_STAGES: Opportunity['stage'][] = ['MOCKUP_DELIVERED', 'INVOICE_SENT', 'DECISION_PENDING'];

export function getNearCloseOpportunities(opportunities: Opportunity[]): Opportunity[] {
  return opportunities
    .filter((opp) => NEAR_CLOSE_STAGES.includes(opp.stage))
    .sort((a, b) => b.closeProbability - a.closeProbability || b.value - a.value);
}

export function getStuckOpportunities(opportunities: Opportunity[]): Opportunity[] {
  return opportunities.filter((opp) => ['CONTACTED', 'DISCOVERY', 'MOCKUP_REQUESTED'].includes(opp.stage) || (opp.stage === 'DECISION_PENDING' && opp.closeProbability < 75));
}

export function getLanePenetration(organizations: Organization[]): Record<RevenueLane, number> {
  const totals: Record<RevenueLane, number> = {
    UNIFORM: 0, TRAVEL_GEAR: 0, TEAM_STORE: 0, LETTERMAN: 0,
  };
  if (!organizations || !Array.isArray(organizations)) return totals;

  organizations.forEach((org) => {
    if (!org?.laneStatuses) return;
    (Object.keys(org.laneStatuses) as RevenueLane[]).forEach((lane) => {
      if (org.laneStatuses[lane]?.status === 'ACTIVE' || org.laneStatuses[lane]?.status === 'WON') {
        totals[lane] += 1;
      }
    });
  });

  return totals;
}

export function getOrganizationPriorityScore(org: Organization): number {
  if (!org?.laneStatuses) return org?.pipelineValue || 0;
  const activeLaneCount = Object.values(org.laneStatuses).filter((lane) => lane?.status === 'ACTIVE').length;
  const openLaneCount = Object.values(org.laneStatuses).filter((lane) => lane?.status === 'OPEN').length;
  return (org.pipelineValue || 0) + activeLaneCount * 5000 + openLaneCount * 2500;
}

export function getOrderRiskScore(order: Order): number {
  return getOrderRisk(order).rank;
}

export function getOpenPipelineValue(opportunities: Opportunity[]): number {
  return opportunities
    .filter((opp) => !['CLOSED_WON', 'CLOSED_LOST'].includes(opp.stage))
    .reduce((total, opp) => total + opp.value, 0);
}

export function getUntouchedAccounts(organizations: Organization[]) {
  return organizations.filter((o) => o.coverageStatus === 'UNTOUCHED');
}

export function getStaleAccounts(organizations: Organization[], thresholdDays = 14) {
  return getStaleOrganizations(organizations, thresholdDays);
}

export function getStaleOpportunities(opportunities: Opportunity[], thresholdDays = 14) {
  return getStaleOpenOpportunities(opportunities, thresholdDays);
}

export function getMomentumState(input: { nearClose: number; stuck: number; stale: number; touched: number }) {
  return getUnifiedMomentumState(input);
}

export function getTerritoryHealthLabel(coveragePct: number) {
  if (coveragePct < 45) return 'Weak Coverage';
  if (coveragePct < 65) return 'Building';
  if (coveragePct < 82) return 'Active';
  return 'Dominating';
}

export function getAccountsNeedingAction(organizations: Organization[]) {
  return organizations.filter((o) => !!o.nextAction && o.coverageStatus !== 'CLOSED');
}
