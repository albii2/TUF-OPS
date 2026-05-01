import { Button, Card, DataTable, type Column } from '../components/primitives';
import { useRepCoverage, useTerritoryOverview, useUntouchedAccounts } from '../hooks/useTerritory';
import { formatCurrency } from '../utils/format';

export function TerritoryPage() {
  const territory = useTerritoryOverview();
  const repCoverage = useRepCoverage();
  const untouched = useUntouchedAccounts();

  const columns: Column<(typeof repCoverage)[number]>[] = [
    { key: 'rep', header: 'Rep', cell: (r) => r.rep },
    { key: 'accounts', header: 'Accounts', cell: (r) => r.accounts },
    { key: 'pipeline', header: 'Pipeline', cell: (r) => formatCurrency(r.pipeline) },
    { key: 'closed', header: 'Closed', cell: (r) => formatCurrency(r.closed) },
    { key: 'untouched', header: 'Untouched', cell: (r) => r.untouched },
  ];

  const coverage = Math.round((territory.assignedAccounts / territory.totalAccounts) * 100);
  return <div className="space-y-3"><Card title="Territory Overview"><p className="text-lg font-semibold">{territory.name}</p><p className="text-sm text-slate-300">Total Accounts: {territory.totalAccounts} · Assigned: {territory.assignedAccounts} · Untouched: {territory.untouchedAccounts}</p><p className="text-sm text-slate-300">Pipeline: {formatCurrency(territory.pipelineValue)} · Closed: {formatCurrency(territory.closedRevenue)}</p></Card><div className="grid gap-3 lg:grid-cols-2"><Card title="Territory Health"><p className="text-sm text-slate-300">Coverage: {coverage}% · Status: {territory.status}</p><p className="text-sm text-slate-300">Uniform {territory.lanePenetration.uniform}% · Team Store {territory.lanePenetration.teamStore}% · Travel Gear {territory.lanePenetration.travelGear}% · Letterman {territory.lanePenetration.letterman}%</p></Card><Card title="CEO Controls"><div className="flex flex-wrap gap-2"><Button>Assign Territory</Button><Button>Expand Territory</Button><Button>Set Performance Threshold</Button></div></Card></div><Card title="Rep Coverage Table"><DataTable columns={columns} rows={repCoverage} getRowId={(r) => r.rep} /></Card><Card title="Untouched Accounts Queue"><div className="space-y-2">{untouched.map((a) => <div key={a.id} className="flex items-center justify-between rounded-md border border-slate-700 p-2 text-sm"><span>{a.name}</span><div className="flex gap-1"><Button className="py-1 px-2 text-xs">Assign Rep</Button><Button className="py-1 px-2 text-xs">Add Opportunity</Button><Button className="py-1 px-2 text-xs">Mark Contacted</Button></div></div>)}</div></Card></div>;
}
