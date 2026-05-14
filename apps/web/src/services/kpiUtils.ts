import type { Opportunity, Organization } from '../data/mockSalesData';

const DAY_MS = 1000 * 60 * 60 * 24;

export type MomentumInput = { nearClose: number; stuck: number; stale: number; touched: number };

export function daysSince(dateIso: string, now = Date.now()): number {
  const ts = new Date(dateIso).getTime();
  if (!Number.isFinite(ts)) return 0;
  return Math.floor((now - ts) / DAY_MS);
}

export function isStale(dateIso: string, thresholdDays = 14, now = Date.now()): boolean {
  return daysSince(dateIso, now) >= thresholdDays;
}

export function getStaleOrganizations(organizations: Organization[], thresholdDays = 14): Organization[] {
  return organizations.filter((org) => isStale(org.lastActivity, thresholdDays));
}

export function getStaleOpenOpportunities(opportunities: Opportunity[], thresholdDays = 14): Opportunity[] {
  return opportunities.filter((opp) => isStale(opp.lastActivity, thresholdDays) && !['CLOSED_WON', 'CLOSED_LOST'].includes(opp.stage));
}

export function getMomentumState(input: MomentumInput): 'HOT' | 'BUILDING' | 'STALLED' | 'CRITICAL' {
  const score = input.nearClose * 2 + input.touched - input.stuck - input.stale * 2;
  if (score >= 8) return 'HOT';
  if (score >= 3) return 'BUILDING';
  if (score >= -1) return 'STALLED';
  return 'CRITICAL';
}
