import { Link } from 'react-router-dom';
import { getNearCloseOpportunities, getTerritoryHealthLabel } from '../services/businessSelectors';
import { getStoredUser } from '../auth';
import { TerritoryCommandMap } from '../components/TerritoryCommandMap';
import { useTerritories } from '../hooks/useTerritory';
import { useOrganizations, useStaleAccounts } from '../hooks/useOrganizations';
import { useOpportunities } from '../hooks/useOpportunities';
import { listUsers } from '../services/usersService';
import { Card, DataTable, type Column, SmallKpi } from '../components/primitives';
import { formatCurrency } from '../utils/format';
import type { TerritoryId } from '../data/mockSalesData';

export function TerritoryPage() {
  const user = getStoredUser();
  const territories = useTerritories();
  const orgs = useOrganizations({});
  const opps = useOpportunities({});
  const staleAccounts = useStaleAccounts();

  const scopedZones = new Set(territories.map((t) => t.id));
  const scopedOrgs = orgs.filter((o) => scopedZones.has(o.territory));
  const scopedOpps = opps.filter((o) => scopedOrgs.some((org) => org.id === o.organizationId));
  const scopedStale = staleAccounts.filter((o) => scopedZones.has(o.territory));
  const nearClose = getNearCloseOpportunities(scopedOpps);
  const untouched = scopedOrgs.filter((o) => o.coverageStatus === 'UNTOUCHED' || !scopedOpps.some((opp) => opp.organizationId === o.id));
  const pipeline = scopedOpps.filter((o) => !['CLOSED_WON', 'CLOSED_LOST'].includes(o.stage)).reduce((sum, o) => sum + o.value, 0);

  const pressure = getTerritoryHealthLabel(scopedOrgs.length ? Math.round(((scopedOrgs.length-untouched.length)/scopedOrgs.length)*100) : 0);

  const repRows = listUsers()
    .filter((m) => m.role === 'REP' && m.status === 'ACTIVE')
    .filter((m) => (m.territory ? scopedZones.has(m.territory as TerritoryId) : false))
    .map((rep) => {
      const repOrgs = scopedOrgs.filter((o) => o.assignedRep === rep.displayName);
      const repOpps = scopedOpps.filter((o) => o.assignedRep === rep.displayName);
      return {
        rep: rep.displayName,
        assigned: repOrgs.length,
        untouched: repOrgs.filter((o) => o.coverageStatus === 'UNTOUCHED').length,
        nearClose: repOpps.filter((o) => ['MOCKUP_DELIVERED', 'INVOICE_SENT', 'DECISION_PENDING'].includes(o.stage)).length,
        ordersPace: repOpps.filter((o) => o.stage === 'CLOSED_WON').length,
        pipeline: repOpps.reduce((sum, o) => sum + o.value, 0),
      };
    });

  const repColumns: Column<{ rep: string; assigned: number; untouched: number; nearClose: number; ordersPace: number; pipeline: number }>[] = [
    { key: 'rep', header: 'Rep', cell: (r) => r.rep },
    { key: 'assigned', header: 'Accounts', cell: (r) => r.assigned },
    { key: 'untouched', header: 'Untouched', cell: (r) => r.untouched },
    { key: 'near', header: 'Near Close', cell: (r) => r.nearClose },
    { key: 'pace', header: '4-Order Pace', cell: (r) => `${Math.min(r.ordersPace, 4)}/4` },
    { key: 'pipeline', header: 'Pipeline', cell: (r) => formatCurrency(r.pipeline) },
  ];

  return (
    <div className="space-y-3">
      <TerritoryCommandMap title={user?.role === 'DIRECTOR' ? 'MY TERRITORY COMMAND MAP' : 'TERRITORY COMMAND MAP'} />

      <Card title="Owner Territory Pressure"><p className="text-sm text-slate-300">Coverage pressure: {pressure}. Labels: Weak Coverage · Building · Active · Dominating.</p></Card>

      <div className="grid gap-3 md:grid-cols-3">
        <SmallKpi label="Untouched Accounts" value={String(untouched.length)} note="Highest priority for coverage discipline." />
        <SmallKpi label="Near Close" value={String(nearClose.length)} note="Move these into invoice, payment, and handoff." />
        <SmallKpi label="Open Pipeline" value={formatCurrency(pipeline)} note="Protect lane penetration while pushing 4 orders/month." />
      </div>

      <Card title={user?.role === 'DIRECTOR' ? 'Rep Accountability' : 'Rep Coverage'}>
        <DataTable columns={repColumns} rows={repRows} getRowId={(r) => r.rep} />
      </Card>

      <Card title="Accounts Needing Action">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {scopedStale.slice(0, 6).map((org) => (
            <Link key={org.id} to={`/organizations/${org.id}`} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 transition hover:border-cyan-400">
              <p className="font-semibold text-slate-100">{org.name}</p>
              <p className="text-sm text-slate-400">{org.nextAction}</p>
              <p className="mt-1 text-xs text-cyan-200">{org.assignedRep} · {org.territory.toUpperCase()}</p>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
