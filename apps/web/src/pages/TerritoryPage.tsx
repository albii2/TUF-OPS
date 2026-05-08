import { Link } from 'react-router-dom';
import { getStoredUser } from '../auth';
import { Card, DataTable, type Column } from '../components/primitives';
import { teamMembers } from '../data/mockSalesData';
import { useOrganizations, useStaleAccounts } from '../hooks/useOrganizations';
import { useOpportunities } from '../hooks/useOpportunities';
import { useTerritories } from '../hooks/useTerritory';
import { formatCurrency } from '../utils/format';

function healthLabel(totalAccounts: number, untouched: number) {
  const touchedPct = totalAccounts === 0 ? 0 : ((totalAccounts - untouched) / totalAccounts) * 100;
  if (touchedPct < 30) return 'Weak Coverage';
  if (touchedPct <= 55) return 'Building';
  if (touchedPct <= 75) return 'Active';
  return 'Dominating';
}

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

  const zoneCards = territories.map((zone) => {
    const zoneOrgs = scopedOrgs.filter((o) => o.territory === zone.id);
    const zoneOrgIds = new Set(zoneOrgs.map((o) => o.id));
    const zoneOpps = scopedOpps.filter((o) => zoneOrgIds.has(o.organizationId));
    const untouched = zoneOrgs.filter((o) => o.coverageStatus === 'UNTOUCHED' || !zoneOpps.some((opp) => opp.organizationId === o.id)).length;
    const activeOpps = zoneOpps.filter((o) => !['CLOSED_WON', 'CLOSED_LOST'].includes(o.stage)).length;
    const stuckDeals = zoneOpps.filter((o) => ['CONTACTED', 'DISCOVERY', 'MOCKUP_REQUESTED'].includes(o.stage)).length;
    const nearClose = zoneOpps.filter((o) => ['MOCKUP_DELIVERED', 'INVOICE_SENT', 'DECISION_PENDING'].includes(o.stage)).length;
    const directors = Array.from(new Set(zoneOrgs.map((o) => o.assignedDirector)));
    const reps = Array.from(new Set(zoneOrgs.map((o) => o.assignedRep)));
    const sports = Array.from(new Set(zoneOpps.map((o) => o.sport)));

    return {
      zone,
      totalAccounts: zoneOrgs.length,
      untouched,
      activeOpps,
      stuckDeals,
      nearClose,
      pipeline: zoneOpps.reduce((sum, o) => sum + o.value, 0),
      closedRevenue: zoneOpps.filter((o) => o.stage === 'CLOSED_WON').reduce((sum, o) => sum + o.value, 0),
      directors,
      reps,
      sports,
      laneBySport: sports.map((sport) => {
        const sportOpps = zoneOpps.filter((o) => o.sport === sport);
        const laneState = (lane: string) => {
          const laneOpp = sportOpps.find((o) => o.lane === lane);
          if (!laneOpp) return 'Open';
          if (laneOpp.stage === 'CLOSED_WON') return 'Won';
          if (laneOpp.stage === 'CLOSED_LOST') return 'Lost';
          return 'Active';
        };
        return {
          sport,
          uniform: laneState('UNIFORM'),
          teamStore: laneState('TEAM_STORE'),
          travelGear: laneState('TRAVEL_GEAR'),
          letterman: laneState('LETTERMAN'),
        };
      }),
    };
  });

  const repColumns: Column<{ rep: string; assigned: number; untouched: number; stuck: number; nearClose: number; pipeline: number }>[] = [
    { key: 'rep', header: 'Rep', cell: (r) => r.rep },
    { key: 'assigned', header: 'Assigned Accounts', cell: (r) => r.assigned },
    { key: 'untouched', header: 'Untouched', cell: (r) => r.untouched },
    { key: 'stuck', header: 'Stuck Deals', cell: (r) => r.stuck },
    { key: 'near', header: 'Near Close', cell: (r) => r.nearClose },
    { key: 'pipeline', header: 'Pipeline', cell: (r) => formatCurrency(r.pipeline) },
  ];

  const repRows = teamMembers
    .filter((m) => m.role === 'REP' && m.active)
    .filter((m) => m.territoryIds.some((id) => scopedZones.has(id)))
    .map((rep) => {
      const repOrgs = scopedOrgs.filter((o) => o.assignedRep === rep.name);
      const repOpps = scopedOpps.filter((o) => o.assignedRep === rep.name);
      return {
        rep: rep.name,
        assigned: repOrgs.length,
        untouched: repOrgs.filter((o) => o.coverageStatus === 'UNTOUCHED').length,
        stuck: repOpps.filter((o) => ['CONTACTED', 'DISCOVERY', 'MOCKUP_REQUESTED'].includes(o.stage)).length,
        nearClose: repOpps.filter((o) => ['MOCKUP_DELIVERED', 'INVOICE_SENT', 'DECISION_PENDING'].includes(o.stage)).length,
        pipeline: repOpps.reduce((sum, o) => sum + o.value, 0),
      };
    });

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold'>{user?.role === 'DIRECTOR' ? 'My Territory Coverage' : 'Territory Coverage'}</h2>
        <Link className='text-cyan-300 text-sm' to='/territory/map'>Open territory map</Link>
      </div>

      <div className='grid gap-3 md:grid-cols-2'>
        {zoneCards.map(({ zone, totalAccounts, untouched, activeOpps, pipeline, closedRevenue, directors, reps, laneBySport, stuckDeals, nearClose }) => (
          <Card key={zone.id} title={zone.name}>
            <p className='text-sm text-slate-300'>Total Accounts: {totalAccounts}</p>
            <p className='text-sm text-slate-300'>Untouched Accounts: {untouched}</p>
            <p className='text-sm text-slate-300'>Active Opportunities: {activeOpps}</p>
            <p className='text-sm text-slate-300'>Pipeline Value: {formatCurrency(pipeline)}</p>
            <p className='text-sm text-slate-300'>Closed Revenue: {formatCurrency(closedRevenue)}</p>
            <p className='text-sm text-slate-300'>Assigned Director: {directors.join(', ') || '—'}</p>
            <p className='text-sm text-slate-300'>Assigned Reps: {reps.join(', ') || '—'}</p>
            <p className='text-xs mt-1 text-cyan-300'>Zone Health: {healthLabel(totalAccounts, untouched)}</p>
            <p className='text-xs text-slate-400'>Stuck: {stuckDeals} · Near Close: {nearClose}</p>
            <div className='mt-2 space-y-1 text-xs text-slate-300'>
              {laneBySport.map((s) => (
                <p key={s.sport}>{s.sport} — Uniform: {s.uniform} · Team Store: {s.teamStore} · Travel Gear: {s.travelGear} · Letterman: {s.letterman}</p>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card title={user?.role === 'DIRECTOR' ? 'My Reps' : 'Rep Coverage'}>
        <DataTable columns={repColumns} rows={repRows} getRowId={(r) => r.rep} />
      </Card>

      <Card title='Territory Pressure'>
        <p className='text-sm text-slate-300'>Untouched Accounts: {scopedOrgs.filter((o) => o.coverageStatus === 'UNTOUCHED' || !scopedOpps.some((opp) => opp.organizationId === o.id)).length}</p>
        <p className='text-sm text-slate-300'>Accounts needing action: {scopedOrgs.filter((o) => o.coverageStatus !== 'CLOSED' && o.nextAction).length}</p>
        <p className='text-sm text-slate-300'>Stale accounts (14+ days): {scopedStale.length}</p>
      </Card>
    </div>
  );
}
