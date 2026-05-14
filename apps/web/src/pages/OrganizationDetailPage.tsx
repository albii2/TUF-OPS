import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { Button, Card, EmptyState, LaneBadge, LaneStatusBadge } from '../components/primitives';
import { formatCurrency } from '../utils/format';
import { useOrganizationById } from '../hooks/useOrganizations';
import { useOpportunities } from '../hooks/useOpportunities';
import { useOrders } from '../hooks/useOrders';
import { useActivities } from '../hooks/useReports';
import { getRevenueLanes } from '../services/opportunitiesService';

export function OrganizationDetailPage() {
  const { id } = useParams();
  const org = useOrganizationById(id);
  const allOpportunities = useOpportunities({});
  const [laneMessage, setLaneMessage] = useState('');
  const activeOpportunities = allOpportunities.filter((o) => o.organizationId === id && !['CLOSED_WON', 'CLOSED_LOST'].includes(o.stage));
  const orgOrders = useOrders({}).filter((o) => o.organizationId === id);
  const orgActivity = useActivities({ entityType: 'ORGANIZATION', entityId: id, limit: 5 });
  const revenueLanes = getRevenueLanes();

  const laneCoverageBySport = Array.from(new Set(allOpportunities.filter((o) => o.organizationId === id).map((o) => o.sport))).map((sport) => {
    const sportOpps = allOpportunities.filter((o) => o.organizationId === id && o.sport === sport);
    const has = (lane: 'UNIFORM' | 'TEAM_STORE' | 'TRAVEL_GEAR' | 'LETTERMAN') => sportOpps.some((o) => o.lane === lane);
    return { sport, UNIFORM: has('UNIFORM'), TEAM_STORE: has('TEAM_STORE'), TRAVEL_GEAR: has('TRAVEL_GEAR'), LETTERMAN: has('LETTERMAN') };
  });

  if (!org) return <EmptyState title="Organization not found" description="Check the selected account and try again." />;

  return (
    <div className="space-y-3 min-w-0">
      <Card title="Account Growth Summary">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">{org.name}</p>
            <p className="text-sm text-slate-400">{org.city}, {org.state} · Rep {org.assignedRep} · Director {org.assignedDirector}</p>
          </div>
          <p className="text-xl font-semibold text-cyan-300">{formatCurrency(org.pipelineValue)}</p>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {revenueLanes.map((lane) => {
          const laneData = org.laneStatuses[lane];
          return (
            <Card key={lane}>
              <div className="space-y-2">
                <LaneBadge lane={lane} />
                <LaneStatusBadge status={laneData.status} />
                <p className="text-lg font-semibold text-cyan-300">{formatCurrency(laneData.estimatedValue)}</p>
                <p className="text-xs text-slate-400">Active Opps: {laneData.activeOpportunityCount}</p>
                <p className="text-xs text-slate-300">Next: {laneData.nextAction}</p>
                <Button className="w-full" onClick={() => setLaneMessage(`${lane.replace(/_/g, ' ')} lane action added to this account's mock next-action plan.`)}>Attack This Lane</Button>
              </div>
            </Card>
          );
        })}
      </div>
      {laneMessage ? <p className="text-sm text-cyan-200">{laneMessage}</p> : null}

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Open Deals Driving Revenue" className="lg:col-span-2">
          {activeOpportunities.length === 0 ? <p className="text-sm text-slate-400">No active opportunities.</p> : (
            <div className="space-y-2 text-sm">
              {activeOpportunities.map((opp) => (
                <Link key={opp.id} className="block rounded-lg border border-slate-800 bg-slate-950/60 p-3 hover:border-cyan-400/40" to={`/opportunities/${opp.id}`}>
                  <p className="font-medium">{opp.title}</p>
                  <p className="text-xs text-slate-400">{opp.stage} · {formatCurrency(opp.value)}</p>
                </Link>
              ))}
            </div>
          )}
        </Card>
        <Card title="Execution Throughput">
          <p className="text-2xl font-semibold text-cyan-300">{orgOrders.length}</p>
          <p className="text-xs text-slate-400">Orders currently tied to this account</p>
        </Card>
      </div>

      <Card title="Lane Coverage by Sport"><div className='space-y-1 text-sm'>{laneCoverageBySport.map((x) => <p key={x.sport}>{x.sport}: Uniform {x.UNIFORM ? 'Yes' : 'No'} · Team Store {x.TEAM_STORE ? 'Yes' : 'No'} · Travel Gear {x.TRAVEL_GEAR ? 'Yes' : 'No'} · Letterman {x.LETTERMAN ? 'Yes' : 'No'}</p>)}</div></Card>

      <Card title="Where We Can Grow This Account Next">
        <p className="text-sm text-slate-300">{org.expansionRecommendation}</p>
      </Card>

      <Card title="Activity & Relationship Signals">
        <div className="space-y-2 text-sm">
          {orgActivity.length ? orgActivity.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p>{entry.message}</p>
              <p className="text-xs text-slate-400">{entry.timestamp} · {entry.user}</p>
            </div>
          )) : <p className="text-slate-400">No account activity yet.</p>}
        </div>
      </Card>
    </div>
  );
}
