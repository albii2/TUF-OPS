import { useMemo, useState } from 'react';
import { getStoredUser } from '../auth';
import { useOpportunities } from '../hooks/useOpportunities';
import { useOrganizations } from '../hooks/useOrganizations';
import { getNearCloseOpportunities, getStaleAccounts, getStaleOpportunities } from '../services/businessSelectors';
import { Button, Card, LaneBadge } from '../components/primitives';
import { useOrders } from '../hooks/useOrders';
import { formatCurrency } from '../utils/format';
import { useReports } from '../hooks/useReports';

export function ReportsPage() {
  const reportsSummary = useReports();
  const user = getStoredUser();
  const opportunities = useOpportunities({});
  const orders = useOrders({});
  const organizations = useOrganizations({});
  const staleOpps = getStaleOpportunities(opportunities);
  const staleOrgs = getStaleAccounts(organizations);
  const nearClose = getNearCloseOpportunities(opportunities);
  const accountability = useMemo(() => reportsSummary.repPerformance.map((rep: any) => ({ ...rep, stale: staleOpps.filter((o)=>o.assignedRep===rep.rep).length, nearClose: nearClose.filter((o)=>o.assignedRep===rep.rep).length })), [reportsSummary, staleOpps, nearClose]);
  const [message, setMessage] = useState('');

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Card title="Weekly Summary">
          <p className="text-sm text-slate-300">Pipeline Added: {formatCurrency(reportsSummary.weeklySummary.pipelineAdded)}</p>
          <p className="text-sm text-slate-300">Closed Won: {formatCurrency(reportsSummary.weeklySummary.closedWon)}</p>
          <p className="text-sm text-slate-300">New Organizations: {reportsSummary.weeklySummary.newOrganizations}</p>
          <p className="text-sm text-slate-300">Blocked Orders: {reportsSummary.weeklySummary.blockedOrders}</p>
        </Card>
        <Card title="Monthly Summary">
          <p className="text-sm text-slate-300">Pipeline Total: {formatCurrency(reportsSummary.monthlySummary.pipelineTotal)}</p>
          <p className="text-sm text-slate-300">Closed Won: {formatCurrency(reportsSummary.monthlySummary.closedWon)}</p>
          <p className="text-sm text-slate-300">Win Rate: {reportsSummary.monthlySummary.winRate}%</p>
          <p className="text-sm text-slate-300">Avg Deal: {formatCurrency(reportsSummary.monthlySummary.averageDeal)}</p>
        </Card>
      </div>

      <Card title="Lane Performance">
        <div className="grid gap-2 md:grid-cols-2">
          {reportsSummary.lanePerformance.map((lane) => (
            <div key={lane.lane} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm">
              <LaneBadge lane={lane.lane} />
              <p className="mt-2 text-slate-300">Pipeline: {formatCurrency(lane.pipeline)}</p>
              <p className="text-slate-300">Won: {formatCurrency(lane.won)}</p>
              <p className="text-slate-300">Win Rate: {lane.winRate}%</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Rep Performance">
        <div className="grid gap-2 md:grid-cols-2">
          {reportsSummary.repPerformance.map((rep: any) => (
            <div key={rep.rep} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm">
              <p className="font-medium text-slate-100">{rep.rep}</p>
              <p className="text-slate-300">Pipeline: {formatCurrency(rep.pipeline)}</p>
              <p className="text-slate-300">Won: {formatCurrency(rep.won)}</p>
              <p className="text-slate-300">Open Deals: {rep.openDeals}</p>
            </div>
          ))}
        </div>
      </Card>

      {user?.role === 'DIRECTOR' ? <Card title="Director Coaching Summary"><div className="grid gap-2 md:grid-cols-2"><p className="text-sm text-slate-300">Stale pipeline: {staleOpps.length} opportunities</p><p className="text-sm text-slate-300">Territory coverage risk accounts: {staleOrgs.length}</p><p className="text-sm text-slate-300">Near-close forecast: {nearClose.length} deals</p><p className="text-sm text-slate-300">Weekly coaching focus reps: {accountability.filter((r:any)=>r.stale>0||r.nearClose>0).length}</p></div><div className="mt-2 space-y-1">{accountability.map((rep:any)=><p key={rep.rep} className="text-xs text-slate-300">{rep.rep}: stale {rep.stale} · near-close {rep.nearClose} · open deals {rep.openDeals}</p>)}</div></Card> : null}

      {user?.role === 'OPS' ? <Card title='Ops Fulfillment Summary'><div className='grid gap-2 md:grid-cols-3'><p className='text-sm text-slate-300'>Blocked orders: {orders.filter((o)=>o.productionStatus==='BLOCKED').length}</p><p className='text-sm text-slate-300'>Needs review: {orders.filter((o)=>o.productionStatus==='NEEDS_REVIEW').length}</p><p className='text-sm text-slate-300'>Vendor-ready: {orders.filter((o)=>o.productionStatus==='READY_FOR_VENDOR').length}</p><p className='text-sm text-slate-300'>In production: {orders.filter((o)=>o.productionStatus==='IN_PRODUCTION').length}</p><p className='text-sm text-slate-300'>Completed: {orders.filter((o)=>o.productionStatus==='COMPLETED').length}</p><p className='text-sm text-slate-300'>Aging blockers: {orders.filter((o)=>o.productionStatus==='BLOCKED' && o.missingInfo.length>0).length}</p></div></Card> : null}

      <div className="flex flex-wrap items-center gap-2"><Button onClick={() => setMessage('Weekly report export prepared for internal review.')}>Export Weekly Report</Button><Button onClick={() => setMessage('Monthly report export prepared for internal review.')}>Export Monthly Report</Button>{message ? <p className="text-sm text-cyan-200">{message}</p> : null}</div>
    </div>
  );
}
