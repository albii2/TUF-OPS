import { Button, Card, LaneBadge } from '../components/primitives';
import { formatCurrency } from '../utils/format';
import { useReports } from '../hooks/useReports';

export function ReportsPage() {
  const reportsSummary = useReports();

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

      <div className="flex gap-2"><Button>Export Weekly (placeholder)</Button><Button>Export Monthly (placeholder)</Button></div>
    </div>
  );
}
