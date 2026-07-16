import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../components/ui';
import { apiClient } from '../services/apiClient';
import { useWorkItems } from '../hooks/useWorkItems';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useOpportunities } from '../hooks/useOpportunities';
import { useOrders } from '../hooks/useOrders';
import { useOrganizations } from '../hooks/useOrganizations';
import { getStoredUser } from '../auth';
import { getLanePenetration, getNearCloseOpportunities, getStaleOpportunities, getStuckOpportunities, getStaleAccounts } from '../services/businessSelectors';
import { getEcosystemReferralSummary } from '../services/ecosystemReferralsService';
import { formatCurrency } from '../utils/format';

const openStages = ['LEAD_ENGAGED', 'DISCOVERY', 'MOCKUP_STAGE', 'INVOICE_SENT'];
const pipelineStages = ['LEAD_ENGAGED', 'DISCOVERY', 'MOCKUP_STAGE', 'INVOICE_SENT', 'CLOSED_WON'] as const;

function MetricTile({ value, label, tone, to }: { value: string; label: string; tone: string; to: string }) {
  return (
    <Link to={to} className={`group rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-cyan-300/70 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-2xl font-semibold text-slate-50">{value}</p>
        <span className="text-lg text-slate-200 transition group-hover:translate-x-1">›</span>
      </div>
      <p className="mt-1 text-sm text-slate-200">{label}</p>
    </Link>
  );
}

function WorkItemRow({ item, linkTo }: { item: { id: number; title: string; priority: string; due_at: string | null; suggested_action: string | null; ai_summary: string | null; status: string; source: string }; linkTo?: string }) {
  const priorityColors: Record<string, string> = {
    critical: 'border-red-500/40 bg-red-500/10',
    high: 'border-orange-500/40 bg-orange-500/10',
    medium: 'border-amber-500/40 bg-amber-500/10',
    low: 'border-slate-500/40 bg-slate-500/10',
  };
  const tone = priorityColors[item.priority] || priorityColors.medium;

  const inner = (
    <div className={`rounded-lg border p-3 transition hover:border-cyan-400/70 hover:bg-slate-900 ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{item.source.replace(/_/g, ' ')}</span>
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${item.priority === 'critical' ? 'bg-red-500/20 text-red-300' : item.priority === 'high' ? 'bg-orange-500/20 text-orange-300' : 'bg-amber-500/20 text-amber-300'}`}>
              {item.priority}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-100 truncate">{item.title}</p>
          {item.ai_summary && <p className="mt-1 text-xs text-slate-400 line-clamp-2">{item.ai_summary}</p>}
          {item.suggested_action && <p className="mt-1 text-xs font-medium text-cyan-300">Action: {item.suggested_action}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {item.due_at && <span className="text-[10px] uppercase tracking-wider text-slate-400">{new Date(item.due_at).toLocaleDateString()}</span>}
          <span className={`text-[10px] font-semibold uppercase ${item.status === 'open' ? 'text-cyan-300' : item.status === 'in_progress' ? 'text-emerald-300' : 'text-slate-500'}`}>{item.status.replace(/_/g, ' ')}</span>
        </div>
        <span className="ml-2 shrink-0 text-lg text-slate-600 group-hover:text-cyan-400">›</span>
      </div>
    </div>
  );

  if (linkTo) return <Link to={linkTo}>{inner}</Link>;
  return <div className="group">{inner}</div>;
}

function StagePipeline({ counts, values }: { counts: Record<string, number>; values: Record<string, number> }) {
  return (
    <div className="grid gap-2 md:grid-cols-5">
      {pipelineStages.map((stage) => (
        <div key={stage} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{stage.replace(/_/g, ' ')}</p>
          <p className="mt-1 text-2xl font-bold text-white">{counts[stage] ?? 0}</p>
          <p className="text-xs text-cyan-200">{formatCurrency(values[stage] ?? 0)}</p>
        </div>
      ))}
    </div>
  );
}

export default function CEOHome() {
  const user = getStoredUser();
  const { data: opportunities = [] } = useOpportunities({});
  const { data: organizations = [] } = useOrganizations({});
  const { data: orders = [] } = useOrders({});
  const { metrics: backendMetrics, isApiBacked } = useDashboardMetrics('ADMIN', user?.id, user?.email);

  // Work items from backend — decisions and blockers
  const { data: executiveItems = [] } = useWorkItems({ source: 'executive_intake' });
  const decisions = executiveItems.filter((item) => item.item_type === 'decision');
  const { data: revenueBlockers = [] } = useWorkItems({ source: 'order_blocker' });
  const { data: commsPending = [] } = useWorkItems({ source: 'leadership_comms', status: 'open' });
  const { data: allOpenItems = [] } = useWorkItems({ status: 'open' });

  const openOpps = opportunities.filter((opp) => openStages.includes(opp.stage));
  const wonOpps = opportunities.filter((opp) => opp.stage === 'CLOSED_WON');
  const nearClose = getNearCloseOpportunities(opportunities);
  const staleOpps = getStaleOpportunities(opportunities, 14);
  const stuckDeals = getStuckOpportunities(opportunities);
  const staleAccounts = getStaleAccounts(organizations, 14);
  const untouchedAccounts = organizations.filter((org) => org.coverageStatus === 'UNTOUCHED');
  const touchedAccounts = organizations.length - untouchedAccounts.length;
  const coveragePct = organizations.length ? Math.round((touchedAccounts / organizations.length) * 100) : 0;
  const pipelineValue = openOpps.reduce((sum, opp) => sum + opp.value, 0);
  const nearCloseValue = nearClose.reduce((sum, opp) => sum + opp.value, 0);
  const wonValue = wonOpps.reduce((sum, opp) => sum + opp.value, 0);
  const lanePenetration = getLanePenetration(organizations);
  const ecosystemSummary = getEcosystemReferralSummary();
  const blockedOrders = orders.filter((order) => order.productionStatus === 'BLOCKED');
  const stageCounts = Object.fromEntries(pipelineStages.map((stage) => [stage, opportunities.filter((opp) => opp.stage === stage).length]));
  const stageValues = Object.fromEntries(pipelineStages.map((stage) => [stage, opportunities.filter((opp) => opp.stage === stage).reduce((sum, opp) => sum + opp.value, 0)]));

  // Prioritized work queue
  const urgentItems = allOpenItems
    .filter((item) => item.priority === 'critical' || item.priority === 'high')
    .slice(0, 6);
  const upcomingItems = allOpenItems
    .filter((item) => item.priority !== 'critical' && item.priority !== 'high')
    .slice(0, 6);

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold text-white">CEO Command Center</h1>

      {/* Top Metrics */}
      <div className="grid gap-3 md:grid-cols-5">
        <MetricTile value={String(decisions.length + revenueBlockers.length)} label="Decisions & Blockers" tone="border-red-500/40 bg-red-500/15" to="/intake" />
        <MetricTile value={`${coveragePct}%`} label="Account Coverage" tone="border-cyan-500/40 bg-cyan-500/15" to="/organizations" />
        <MetricTile value={formatCurrency(pipelineValue)} label="Open Pipeline" tone="border-sky-500/40 bg-sky-500/15" to="/team-opportunities" />
        <MetricTile value={formatCurrency(nearCloseValue)} label="Near-Close Revenue" tone="border-emerald-500/40 bg-emerald-500/15" to="/team-opportunities" />
        <MetricTile value={String(blockedOrders.length)} label="Blocked Orders" tone="border-rose-500/40 bg-rose-500/15" to="/orders" />
      </div>

      {/* Decisions Queue & Revenue Blockers */}
      <div className="grid gap-3 lg:grid-cols-2">
        <GlassCard title={`🔴 EXECUTIVE DECISIONS (${decisions.length})`}>
          {decisions.length ? (
            <div className="space-y-2">
              {decisions.slice(0, 6).map((item) => (
                <WorkItemRow key={item.id} item={item} linkTo="/intake" />
              ))}
            </div>
          ) : <p className="text-sm text-slate-400">No decisions pending.</p>}
        </GlassCard>

        <GlassCard title={`💰 REVENUE BLOCKERS (${revenueBlockers.length})`}>
          {revenueBlockers.length ? (
            <div className="space-y-2">
              {revenueBlockers.slice(0, 6).map((item) => (
                <WorkItemRow key={item.id} item={item} linkTo="/orders" />
              ))}
            </div>
          ) : <p className="text-sm text-slate-400">No revenue blockers.</p>}
        </GlassCard>
      </div>

      {/* Pipeline At-a-Glance */}
      <GlassCard title="PIPELINE FROM COVERAGE TO CASH">
        <StagePipeline counts={stageCounts} values={stageValues} />
      </GlassCard>

      {/* Coverage Gaps & Revenue Risk */}
      <div className="grid gap-3 lg:grid-cols-2">
        <GlassCard title="COVERAGE GAPS">
          <p className="text-sm text-slate-300">Untouched accounts: {isApiBacked ? backendMetrics.untouched_schools : untouchedAccounts.length} · Stale accounts: {staleAccounts.length} · Ecosystem referrals: {ecosystemSummary.created}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {Object.entries(lanePenetration).map(([lane, count]) => (
              <p key={lane} className="text-xs text-slate-300">{lane.replace(/_/g, ' ')}: {count} active accounts</p>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="REVENUE RISK">
          <p className="text-sm text-slate-300">Stale opportunities: {staleOpps.length} · Stuck deals: {stuckDeals.length} · Blocked orders: {blockedOrders.length}</p>
          <div className="mt-2 space-y-2">
            {nearClose.slice(0, 4).map((opp) => (
              <Link key={opp.id} to={`/opportunities/${opp.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 transition hover:border-cyan-400/70 hover:bg-slate-900">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-100">{opp.title}</span>
                  <span className="block truncate text-xs text-slate-400">{opp.organizationName} · {opp.assignedRep}</span>
                </span>
                <span className="text-sm font-semibold text-slate-100">{formatCurrency(opp.value)}</span>
              </Link>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Prioritized Work Queue */}
      <GlassCard title="📋 PRIORITIZED WORK QUEUE">
        {urgentItems.length ? (
          <div className="space-y-2 mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-400">Critical / High Priority</p>
            {urgentItems.map((item) => (
              <WorkItemRow key={item.id} item={item} />
            ))}
          </div>
        ) : null}
        {upcomingItems.length ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Upcoming</p>
            {upcomingItems.map((item) => (
              <WorkItemRow key={item.id} item={item} />
            ))}
          </div>
        ) : null}
        {!urgentItems.length && !upcomingItems.length && <p className="text-sm text-slate-400">All clear — no work items pending.</p>}
      </GlassCard>

      {/* Leadership Comms Pending */}
      <GlassCard title={`📨 LEADERSHIP COMMS PENDING (${commsPending.length})`}>
        {commsPending.length ? (
          <div className="space-y-2">
            {commsPending.slice(0, 6).map((item) => (
              <WorkItemRow key={item.id} item={item} linkTo="/comms" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No pending leadership communications.</p>
        )}
        <Link to="/comms" className="mt-2 inline-block rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">Open Comm Center ›</Link>
      </GlassCard>
    </div>
  );
}
