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
  const zoneLabel = org.territory === 'north' ? 'TUF NORTH' : org.territory === 'west' ? 'TUF WEST' : org.territory === 'south' ? 'TUF SOUTH' : org.territory === 'metro' ? 'TUF METRO' : 'UNASSIGNED';
  const activeSports = laneCoverageBySport.map((x) => x.sport).filter(Boolean);
  const closedRevenue = allOpportunities.filter((o) => o.organizationId === id && o.stage === 'CLOSED_WON').reduce((sum, o) => sum + o.value, 0);
  const pipelineRevenue = allOpportunities.filter((o) => o.organizationId === id && !['CLOSED_WON', 'CLOSED_LOST'].includes(o.stage)).reduce((sum, o) => sum + o.value, 0);
  const laneStates = [
    { lane: 'UNIFORM', status: org.laneStatuses.UNIFORM.status },
    { lane: 'TEAM_STORE', status: org.laneStatuses.TEAM_STORE.status },
    { lane: 'TRAVEL_GEAR', status: org.laneStatuses.TRAVEL_GEAR.status },
    { lane: 'LETTERMAN', status: org.laneStatuses.LETTERMAN.status },
  ];
  const missingLanes = laneStates.filter((x) => x.status === 'OPEN').map((x) => x.lane);
  const suggestedNextLane = missingLanes[0] ?? 'Maintain active lane pressure';

  return (
    <div className="space-y-3 min-w-0">
      <Card title="Account Penetration Console">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">{org.name}</p>
            <p className="text-sm text-slate-400">{org.city}, {org.state} · {zoneLabel}</p>
            <p className="text-xs text-slate-400">Rep {org.assignedRep} · Director {org.assignedDirector} · Lead Tier {org.leadTier ?? 'UNASSIGNED'}</p>
          </div>
          <p className="text-xl font-semibold text-cyan-300">{formatCurrency(org.pipelineValue)}</p>
        </div>
      </Card>

      <Card title="Lead Contact Lockbox">
        <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-xs uppercase text-slate-500">School Phone</p>
            <p className="font-medium text-slate-100">{org.schoolPhone || 'Not imported'}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-xs uppercase text-slate-500">Athletic Director</p>
            <p className="font-medium text-slate-100">{org.athleticDirectorName || 'Not imported'}</p>
            <p>{org.athleticDirectorEmail || 'No email'}</p>
            <p>{org.athleticDirectorPhone || 'No phone'}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-xs uppercase text-slate-500">Head Coach</p>
            <p className="font-medium text-slate-100">{org.headCoachName || 'Not imported'}</p>
            <p>{org.headCoachEmail || 'No email'}</p>
            <p>{org.headCoachPhone || 'No phone'}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Account Snapshot"><p className="text-sm text-slate-300">Active Sports: {activeSports.length ? activeSports.join(', ') : 'None logged'}</p></Card>
        <Card title="Open Opportunities"><p className="text-2xl font-semibold text-cyan-300">{activeOpportunities.length}</p></Card>
        <Card title="Closed Revenue"><p className="text-2xl font-semibold text-emerald-300">{formatCurrency(closedRevenue)}</p></Card>
        <Card title="Pipeline Revenue"><p className="text-2xl font-semibold text-cyan-300">{formatCurrency(pipelineRevenue)}</p></Card>
      </div>

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

      <Card title="Lane Penetration Grid & Next Move">
        <div className="space-y-1 text-sm text-slate-300">
          {laneStates.map((row) => <p key={row.lane}>{row.lane}: {row.status}</p>)}
          <p>Missing Lanes: {missingLanes.length ? missingLanes.join(', ') : 'None'}</p>
          <p>Suggested Next Lane: <span className="text-cyan-200">{suggestedNextLane}</span></p>
          <p>Next Best Relationship Move: {org.nextAction}</p>
          <p>Last Contact: {org.lastActivity}</p>
        </div>
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
