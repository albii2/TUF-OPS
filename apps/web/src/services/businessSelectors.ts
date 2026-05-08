import type { Opportunity, Organization, Order, RevenueLane } from '../data/mockSalesData';

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
    UNIFORM: 0,
    TRAVEL_GEAR: 0,
    TEAM_STORE: 0,
    LETTERMAN: 0,
  };

  organizations.forEach((org) => {
    (Object.keys(org.laneStatuses) as RevenueLane[]).forEach((lane) => {
      if (org.laneStatuses[lane].status === 'ACTIVE' || org.laneStatuses[lane].status === 'WON') {
        totals[lane] += 1;
      }
    });
  });

  return totals;
}

export function getOrganizationPriorityScore(org: Organization): number {
  const activeLaneCount = Object.values(org.laneStatuses).filter((lane) => lane.status === 'ACTIVE').length;
  const openLaneCount = Object.values(org.laneStatuses).filter((lane) => lane.status === 'OPEN').length;
  return org.pipelineValue + activeLaneCount * 5000 + openLaneCount * 2500;
}

export function getOrderRiskScore(order: Order): number {
  const statusWeight: Record<Order['productionStatus'], number> = {
    NEEDS_REVIEW: 80,
    BLOCKED: 100,
    READY_FOR_VENDOR: 40,
    IN_PRODUCTION: 25,
    COMPLETED: 0,
  };
  return statusWeight[order.productionStatus] + order.missingInfo.length * 15;
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
  const now = new Date('2026-05-01');
  return organizations.filter((o) => {
    const d = new Date(o.lastActivity);
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= thresholdDays;
  });
}

export function getAccountsNeedingAction(organizations: Organization[]) {
  return organizations.filter((o) => !!o.nextAction && o.coverageStatus !== 'CLOSED');
}
