/**
 * Lighthouse Engine v1.0 — Account Intelligence
 * Shows what we know, what we're missing, and how to develop each account.
 */

import { getOrganizationById } from './organizationsService';
import { listOpportunities } from './opportunitiesService';
import { listActivities } from './activitiesService';
import type { RevenueLane } from '../data/mockSalesData';

// ── Types ──

export interface OrganizationIntel {
  organizationId: string;
  organizationName: string;
  territoryDevelopmentScore: number;
  knownContacts: number;
  missingContacts: string[];
  sportsMapped: string[];
  revenueLanesActivated: RevenueLane[];
  revenueLanesMissing: RevenueLane[];
  lastActivityDate: string | null;
  nextActionRecommendation: string;
  buyingWindows: BuyingWindow[];
  ecosystemLinks: EcosystemLink[];
}

export interface BuyingWindow {
  sport: string;
  season: string;
  urgency: 'NOW' | 'SOON' | 'LATER';
  description: string;
}

export interface EcosystemLink {
  organizationId: string;
  organizationName: string;
  relationship: string;
}

const ALL_LANES = ['Uniforms', 'Travel', 'TeamStore', 'Letterman'];
const ALL_CONTACTS = ['Athletic Director', 'Head Coach', 'Assistant Coach', 'Equipment Manager', 'Athletic Secretary'];

function getSeason(sport: string): string {
  const s = sport.toLowerCase();
  if (s.includes('football') || s.includes('volleyball') || s.includes('soccer') || s.includes('cross country')) return 'Fall';
  if (s.includes('basketball') || s.includes('wrestling') || s.includes('hockey')) return 'Winter';
  if (s.includes('baseball') || s.includes('softball') || s.includes('track') || s.includes('golf') || s.includes('tennis')) return 'Spring';
  return 'Year-round';
}

function getSeasonUrgency(season: string): 'NOW' | 'SOON' | 'LATER' {
  const now = new Date();
  const month = now.getMonth(); // 0=Jan, 6=Jul
  if (season === 'Summer' && (month >= 4 && month <= 7)) return 'NOW';
  if (season === 'Fall' && (month >= 6 && month <= 10)) return 'NOW';
  if (season === 'Winter' && (month >= 9 && month <= 12)) return 'NOW';
  if (season === 'Spring' && (month >= 1 && month <= 4)) return 'NOW';
  if (season === 'Fall' && month >= 4) return 'SOON';
  if (season === 'Winter' && month >= 7) return 'SOON';
  if (season === 'Spring' && month >= 10) return 'SOON';
  return 'LATER';
}

export function getOrganizationIntel(orgId: string): OrganizationIntel {
  const org = getOrganizationById(orgId);
  if (!org) throw new Error(`Organization ${orgId} not found`);
  
  const opps = listOpportunities({ organizationId: orgId });
  const activities = listActivities({ organizationId: orgId });
  
  // Sports mapped
  const sportsMapped: string[] = [];
  const seenSports = new Set<string>();
  for (const o of opps) {
    const sport = o.sport || 'Unspecified';
    if (!seenSports.has(sport)) {
      seenSports.add(sport);
      sportsMapped.push(sport);
    }
  }
  
  // Lanes activated
  const lanesActivated = new Set<RevenueLane>();
  for (const o of opps) {
    for (const l of o.lanes || []) {
      lanesActivated.add(l);
    }
  }
  const revenueLanesActivated = Array.from(lanesActivated);
  const revenueLanesMissing = ALL_LANES.filter((l) => !lanesActivated.has(l as RevenueLane)) as RevenueLane[];
  
  // Contacts
  const knownContacts = 1; // Placeholder — contacts aren't tracked as separate entities yet
  const missingContacts = ALL_CONTACTS.filter((_, i) => i > 0); // We know at least 1 contact exists
  
  // Activity
  const latestActivity = activities.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const lastActivityDate = latestActivity?.createdAt || null;
  
  // Buying windows
  const buyingWindows: BuyingWindow[] = sportsMapped.map((sport) => {
    const season = getSeason(sport);
    const urgency = getSeasonUrgency(season);
    return { sport, season, urgency, description: `${sport} ${season.toLowerCase()} season` };
  });
  // Add lanes that haven't been explored as potential buying windows
  for (const missing of revenueLanesMissing) {
    if (missing === 'Letterman') {
      buyingWindows.push({ sport: 'Multi-sport', season: 'Spring', urgency: 'SOON', description: 'Letterman jacket season — senior campaigns' });
    } else if (missing === 'TeamStore') {
      buyingWindows.push({ sport: 'Multi-sport', season: 'Year-round', urgency: 'NOW', description: 'Team store — always in season' });
    }
  }
  
  // Ecosystem links — find orgs in same city
  const allOrgs = require('./organizationsService').listOrganizations({});
  const ecosystemLinks: EcosystemLink[] = [];
  for (const o of allOrgs) {
    if (o.id !== orgId && o.city === org.city) {
      ecosystemLinks.push({ organizationId: o.id, organizationName: o.name, relationship: `Same city: ${org.city}` });
    }
  }
  
  // Territory development score
  let score = 0;
  if (sportsMapped.length > 0) score += 20; // Has mapped sports
  if (sportsMapped.length >= 3) score += 15; // Multiple sports
  if (revenueLanesActivated.length > 0) score += 20; // Has active lanes
  if (revenueLanesActivated.length >= 2) score += 15; // Multiple lanes
  if (activities.length > 0) score += 10; // Has activity
  if (activities.length >= 5) score += 10; // Significant activity
  if (opps.some((o) => o.stage === 'CLOSED_WON')) score += 10; // Has won business
  score = Math.min(100, score); // Cap at 100
  
  // Next action recommendation
  let nextAction = '';
  if (revenueLanesMissing.length > 0) {
    nextAction = `Open ${revenueLanesMissing[0]} lane — highest untapped opportunity.`;
  } else if (sportsMapped.length < 2) {
    nextAction = 'Map additional sports to expand account penetration.';
  } else if (activities.length === 0) {
    nextAction = 'Make first contact — no activities recorded yet.';
  } else {
    nextAction = 'Advance existing opportunities or expand into team store.';
  }
  
  return {
    organizationId: orgId,
    organizationName: org.name,
    territoryDevelopmentScore: score,
    knownContacts,
    missingContacts,
    sportsMapped,
    revenueLanesActivated,
    revenueLanesMissing,
    lastActivityDate,
    nextActionRecommendation: nextAction,
    buyingWindows,
    ecosystemLinks,
  };
}
