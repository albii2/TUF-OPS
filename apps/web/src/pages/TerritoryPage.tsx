import { Link } from 'react-router-dom';
import { getStoredUser } from '../auth';
import { Button, Card, DataTable, type Column } from '../components/primitives';
import { useRepCoverage, useTerritories, useUntouchedAccounts } from '../hooks/useTerritory';
import { formatCurrency } from '../utils/format';

export function TerritoryPage() {
  const user = getStoredUser();
  const allTerritories = useTerritories();
  const territories = user?.role === 'DIRECTOR' ? allTerritories.filter((t) => ['north','west'].includes(t.id)) : allTerritories;
  const repCoverage = useRepCoverage();
  const untouched = useUntouchedAccounts();

  const columns: Column<(typeof repCoverage)[number]>[] = [
    { key: 'rep', header: 'Rep', cell: (r) => r.rep },
    { key: 'territory', header: 'Territory', cell: (r) => r.territory.toUpperCase() },
    { key: 'accounts', header: 'Accounts', cell: (r) => r.accounts },
    { key: 'pipeline', header: 'Pipeline', cell: (r) => formatCurrency(r.pipeline) },
    { key: 'closed', header: 'Closed', cell: (r) => formatCurrency(r.closed) },
    { key: 'untouched', header: 'Untouched', cell: (r) => r.untouched },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Territory System</h2><Link className="text-cyan-300 text-sm" to="/territory/map">Open map layer (next slice)</Link></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {territories.map((t) => <Card key={t.id} title={t.name}><p className="text-sm text-slate-300">Accounts: {t.accounts}</p><p className="text-sm text-slate-300">Untouched: {t.untouched}</p><p className="text-sm text-slate-300">Pipeline: {formatCurrency(t.pipeline)}</p><p className="text-sm text-slate-300">Closed: {formatCurrency(t.closed)}</p></Card>)}
      </div>
      <Card title="Rep Coverage Table"><DataTable columns={columns} rows={repCoverage} getRowId={(r) => `${r.rep}-${r.territory}`} /></Card>
      <Card title="Untouched Accounts Queue">
        <div className="space-y-2">{untouched.map((a) => <div key={a.id} className="flex items-center justify-between rounded-md border border-slate-700 p-2 text-sm"><span>{a.name} ({a.territory.toUpperCase()})</span><div className="flex gap-1"><Button className="py-1 px-2 text-xs">Assign Rep</Button><Button className="py-1 px-2 text-xs">Add Opportunity</Button><Button className="py-1 px-2 text-xs">Mark Contacted</Button></div></div>)}</div>
      </Card>
    </div>
  );
}
