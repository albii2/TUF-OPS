import { Link } from 'react-router-dom';
import { Button, Card, DataTable, type Column } from '../components/primitives';
import { useRepCoverage, useTerritories, useUntouchedAccounts } from '../hooks/useTerritory';
import { useAccountsNeedingAction } from '../hooks/useOrganizations';
import { getAssignmentHealth } from '../services/territoryService';
import { formatCurrency } from '../utils/format';

export function TerritoryPage() {
  const territories = useTerritories();
  const repCoverage = useRepCoverage();
  const untouched = useUntouchedAccounts();
  const needsAction = useAccountsNeedingAction();

  const columns: Column<(typeof repCoverage)[number]>[] = [
    { key: 'rep', header: 'Rep', cell: (r) => r.rep },
    { key: 'territory', header: 'Territory', cell: (r) => r.territory.toUpperCase() },
    { key: 'assigned', header: 'Assigned Accounts', cell: (r) => r.assignedAccounts },
    { key: 'untouched', header: 'Untouched', cell: (r) => r.untouchedAccounts },
    { key: 'active', header: 'Active Opps', cell: (r) => r.activeOpportunities },
    { key: 'near', header: 'Near Close', cell: (r) => r.nearCloseOpportunities },
    { key: 'stuck', header: 'Stuck', cell: (r) => r.stuckOpportunities },
    { key: 'mtd', header: 'Closed Won MTD', cell: (r) => formatCurrency(r.closedWonMTD) },
    { key: 'pipeline', header: 'Pipeline', cell: (r) => formatCurrency(r.pipelineValue) },
    { key: 'health', header: 'Assignment Health', cell: (r) => getAssignmentHealth(r.assignedAccounts) },
  ];

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'><h2 className='text-xl font-semibold'>Territory System</h2><Link className='text-cyan-300 text-sm' to='/territory/map'>Open map layer (next slice)</Link></div>
      <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
        {territories.map((t) => (
          <Card key={t.id} title={t.name}>
            <p className='text-sm text-slate-300'>Accounts Assigned: {t.accounts}</p>
            <p className='text-sm text-slate-300'>Untouched Accounts: {t.untouched}</p>
            <p className='text-sm text-slate-300'>Pipeline Value: {formatCurrency(t.pipeline)}</p>
            <p className='text-sm text-slate-300'>Lane Penetration: U {t.lanePenetration.uniform}% · TS {t.lanePenetration.teamStore}% · TG {t.lanePenetration.travelGear}% · L {t.lanePenetration.letterman}%</p>
            <p className='text-xs mt-1 text-cyan-300'>Assignment Health: {getAssignmentHealth(Math.round(t.accounts / 3))}</p>
          </Card>
        ))}
      </div>
      <Card title='Rep Workload Panel'><DataTable columns={columns} rows={repCoverage} getRowId={(r) => `${r.rep}-${r.territory}`} /></Card>
      <Card title='Untouched Accounts Queue'>
        <p className='mb-2 text-xs text-slate-400'>{needsAction.length} accounts needing action in scoped territories.</p>
        <div className='space-y-2'>{untouched.map((a) => <div key={a.id} className='flex items-center justify-between rounded-md border border-slate-700 p-2 text-sm'><span>{a.name} ({a.territory.toUpperCase()})</span><div className='flex gap-1'><Button className='py-1 px-2 text-xs'>Assign Rep</Button><Button className='py-1 px-2 text-xs'>Add Opportunity</Button><Button className='py-1 px-2 text-xs'>Mark Contacted</Button></div></div>)}</div>
      </Card>
    </div>
  );
}
