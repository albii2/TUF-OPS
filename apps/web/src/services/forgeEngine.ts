/**
 * Forge Engine v1.0 — Rule-Based Pipeline Intelligence
 * Helps the rep answer: what should I do today, and why?
 */

import { listOrganizations } from './organizationsService';
import { listOpportunities, type Opportunity } from './opportunitiesService';
import { listActivities } from './activitiesService';
import { getStoredUser } from '../auth';

// ── Types ──

export interface ForgeMission {
  dailyBriefing: string;
  repName: string;
  territory: string;
  topAccounts: ForgeAccount[];
  pipelineGaps: string[];
  atRiskOpportunities: ForgeAccount[];
  nextBestLane: string;
  academyTip: string;
}

export interface ForgeAccount {
  organizationId: string;
  organizationName: string;
  priority: number;
  reason: string;
  recommendedAction: string;
  opportunityStage: string | null;
  lastActivityDate: string | null;
  daysSinceContact: number | null;
}

// ── Priority Engine ──

function daysSince(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function stageOrder(stage: string): number {
  const map: Record<string, number> = {
    'INVOICE_SENT': 4, 'MOCKUP_STAGE': 3, 'DISCOVERY': 2, 'LEAD_ENGAGED': 1
  };
  return map[stage] || 0;
}

export function getForgeMission(): ForgeMission {
  const user = getStoredUser();
  const repName = user?.displayName || 'Rep';
  const territory = user?.territory || 'Unknown';
  
  const orgs = listOrganizations({});
  const opps = listOpportunities({});
  const activities = listActivities({});
  
  // Latest activity per org
  const latest: Record<string, { date: string; days: number }> = {};
  for (const a of activities) {
    if (!latest[a.organizationId] || a.createdAt > latest[a.organizationId].date) {
      latest[a.organizationId] = { date: a.createdAt, days: daysSince(a.createdAt) ?? 999 };
    }
  }
  
  // Group opps by org
  const oppMap: Record<string, Opportunity[]> = {};
  for (const o of opps) {
    if (!oppMap[o.organizationId]) oppMap[o.organizationId] = [];
    oppMap[o.organizationId].push(o);
  }
  
  // Score each org
  const scored: Array<{
    org: (typeof orgs)[0];
    score: number;
    reason: string;
    action: string;
    stage: string | null;
    lastDate: string | null;
    days: number;
  }> = [];
  
  for (const org of orgs) {
    const orgOpps = oppMap[org.id] || [];
    const act = latest[org.id];
    const days = act?.days ?? 999;
    const best = orgOpps.sort((a, b) => stageOrder(b.stage) - stageOrder(a.stage))[0];
    
    let score = 0;
    let reason = '';
    let action = '';
    let stage: string | null = null;
    
    if (best && best.stage === 'INVOICE_SENT') {
      score = 80; reason = 'Invoice sent — close the order.'; action = 'Call coach to confirm order and submit.'; stage = best.stage;
    } else if (best && best.stage === 'MOCKUP_STAGE') {
      score = 60; reason = 'Mockup in progress — advance quickly.'; action = 'Follow up on mockup approval.'; stage = best.stage;
    } else if (best && best.stage === 'DISCOVERY') {
      score = 40; reason = 'Discovery stage — deepen the conversation.'; action = 'Schedule product presentation.'; stage = best.stage;
    } else if (best && best.stage === 'LEAD_ENGAGED') {
      score = 25; reason = 'Initial contact made — build the relationship.'; action = 'Send lookbook and schedule call.'; stage = best.stage;
    } else if (days > 14) {
      score = 15; reason = `No contact in ${days} days — re-engage.`; action = 'Make contact via phone or email.';
    } else if (orgOpps.length === 0) {
      score = 5; reason = 'No opportunities — open a lane.'; action = 'Identify sport/program need and propose.';
    } else {
      score = 10; reason = 'Low activity — maintain relationship.'; action = 'Send seasonal update or catalog.';
    }
    
    // Add sport season urgency bonus
    const sport = best?.sport || '';
    if (sport.toLowerCase().includes('football')) score += 5;
    else if (sport.toLowerCase().includes('volleyball')) score += 4;
    else if (sport.toLowerCase().includes('basketball')) score += 3;
    
    scored.push({ org, score, reason, action, stage, lastDate: act?.date ?? null, days });
  }
  
  scored.sort((a, b) => b.score - a.score);
  
  const top5 = scored.slice(0, 5);
  const topAccounts: ForgeAccount[] = top5.map((s) => ({
    organizationId: s.org.id,
    organizationName: s.org.name,
    priority: s.score >= 60 ? 1 : s.score >= 35 ? 2 : s.score >= 20 ? 3 : s.score >= 10 ? 4 : 5,
    reason: s.reason,
    recommendedAction: s.action,
    opportunityStage: s.stage,
    lastActivityDate: s.lastDate,
    daysSinceContact: s.days,
  }));
  
  // Pipeline gaps
  const gaps: string[] = [];
  const orgsWithOpps = Object.keys(oppMap).length;
  if (orgs.length === 0) {
    gaps.push('No organizations in territory.');
  } else if (orgsWithOpps < orgs.length * 0.3) {
    gaps.push(`${orgs.length - orgsWithOpps} organizations have no opportunities — open lanes.`);
  }
  const pendingInvoices = opps.filter((o) => o.stage === 'INVOICE_SENT');
  if (pendingInvoices.length > 0) {
    gaps.push(`${pendingInvoices.length} invoices pending — close them.`);
  }
  const stageSet = new Set(opps.map((o) => o.stage));
  if (!stageSet.has('DISCOVERY') && !stageSet.has('LEAD_ENGAGED')) {
    gaps.push('No early-stage pipeline — need more outreach.');
  }
  
  // At-risk
  const atRisk: ForgeAccount[] = scored
    .filter((s) => s.days > 14 && s.stage && s.stage !== 'CLOSED_WON' && s.stage !== 'CLOSED_LOST')
    .slice(0, 3)
    .map((s) => ({
      organizationId: s.org.id,
      organizationName: s.org.name,
      priority: 4,
      reason: `${s.days} days since last contact — at risk of going cold.`,
      recommendedAction: 'Re-engage immediately.',
      opportunityStage: s.stage,
      lastActivityDate: s.lastDate,
      daysSinceContact: s.days,
    }));
  
  // Next best lane
  const laneCounts: Record<string, number> = {};
  for (const o of opps) {
    for (const l of o.lanes || []) {
      laneCounts[l] = (laneCounts[l] || 0) + 1;
    }
  }
  const sorted = Object.entries(laneCounts).sort((a, b) => a[1] - b[1]);
  const nextBestLane = sorted.length > 0
    ? `Expand into ${sorted[0][0]} — only ${sorted[0][1]} active.`
    : 'Start with Uniforms — highest-margin entry point.';
  
  // Academy tip
  const tipMap: Record<number, string> = {
    1: 'Module 5: Closing Techniques — The Invoice-to-Order Handoff',
    2: 'Module 3: Mockup Excellence — Speed Wins',
    3: 'Module 1: Discovery Calls That Convert',
    4: 'Module 1: First Contact — Coach-to-Coach Conversations',
    5: 'Module 2: Lane Penetration — Finding Your Entry Point',
  };
  const academyTip = tipMap[topAccounts[0]?.priority || 1];
  
  return {
    dailyBriefing: `${repName}, you have ${orgsWithOpps} active opportunities across ${orgs.length} organizations in ${territory}. ${gaps.length > 0 ? `${gaps.length} gaps need attention.` : 'Pipeline is healthy.'}`,
    repName,
    territory,
    topAccounts,
    pipelineGaps: gaps,
    atRiskOpportunities: atRisk,
    nextBestLane,
    academyTip,
  };
}
