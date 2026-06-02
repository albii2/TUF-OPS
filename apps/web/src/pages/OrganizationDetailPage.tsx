import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { Button, Card, EmptyState, Input, LaneBadge, LaneStatusBadge, Select } from '../components/primitives';
import { formatCurrency } from '../utils/format';
import { useOrganizationById } from '../hooks/useOrganizations';
import { useOpportunities } from '../hooks/useOpportunities';
import { useOrders } from '../hooks/useOrders';
import { useActivities } from '../hooks/useReports';
import { getRevenueLanes } from '../services/opportunitiesService';
import { createEcosystemReferral, referredOrganizationTypes, warmIntroductionStatuses, type ReferredOrganizationType, type WarmIntroductionStatus } from '../services/ecosystemReferralsService';
import { useEcosystemReferrals } from '../hooks/useEcosystemReferrals';

export function OrganizationDetailPage() {
  const { id } = useParams();
  const org = useOrganizationById(id);
  const allOpportunities = useOpportunities({});
  const [laneMessage, setLaneMessage] = useState('');
  const [referralMessage, setReferralMessage] = useState('');
  const [referralRefreshKey, setReferralRefreshKey] = useState(0);
  const [referralForm, setReferralForm] = useState({
    referralSourceContact: '',
    referralSourceRole: '',
    referredOrganizationName: '',
    referredOrganizationType: 'Youth Football' as ReferredOrganizationType,
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    relationshipNotes: '',
    warmIntroductionStatus: 'Mentioned' as WarmIntroductionStatus,
    linkedOpportunityId: '',
  });
  const activeOpportunities = allOpportunities.filter((o) => o.organizationId === id && !['CLOSED_WON', 'CLOSED_LOST'].includes(o.stage));
  const orgOrders = useOrders({}).filter((o) => o.organizationId === id);
  const orgActivity = useActivities({ entityType: 'ORGANIZATION', entityId: id, limit: 5 });
  const orgReferrals = useEcosystemReferrals({ sourceOrganizationId: id, refreshKey: referralRefreshKey });
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

  const updateReferralForm = (field: keyof typeof referralForm, value: string) => {
    setReferralForm((current) => ({ ...current, [field]: value }));
    setReferralMessage('');
  };

  const submitReferral = () => {
    if (!id || !referralForm.referredOrganizationName.trim() || !referralForm.contactName.trim()) {
      setReferralMessage('Add the referred organization and contact name to save this ecosystem referral.');
      return;
    }

    createEcosystemReferral({
      referralSourceOrganizationId: id,
      referralSourceContact: referralForm.referralSourceContact || 'Not captured',
      referralSourceRole: referralForm.referralSourceRole || 'Relationship source',
      referredOrganizationName: referralForm.referredOrganizationName,
      referredOrganizationType: referralForm.referredOrganizationType,
      contactName: referralForm.contactName,
      contactEmail: referralForm.contactEmail,
      contactPhone: referralForm.contactPhone,
      relationshipNotes: referralForm.relationshipNotes,
      warmIntroductionStatus: referralForm.warmIntroductionStatus,
      linkedOpportunityId: referralForm.linkedOpportunityId || undefined,
    });
    setReferralForm({
      referralSourceContact: '',
      referralSourceRole: '',
      referredOrganizationName: '',
      referredOrganizationType: 'Youth Football',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      relationshipNotes: '',
      warmIntroductionStatus: 'Mentioned',
      linkedOpportunityId: '',
    });
    setReferralRefreshKey((key) => key + 1);
    setReferralMessage('Ecosystem referral captured and added to the dedicated Ecosystem Pipeline.');
  };

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


      <Card title="Quick Add Ecosystem Referral">
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          <Input aria-label="Referral Source Contact" placeholder="Referral source contact" value={referralForm.referralSourceContact} onChange={(e) => updateReferralForm('referralSourceContact', e.target.value)} />
          <Input aria-label="Referral Source Role" placeholder="Referral source role" value={referralForm.referralSourceRole} onChange={(e) => updateReferralForm('referralSourceRole', e.target.value)} />
          <Input aria-label="Referred Organization Name" placeholder="Referred organization name" value={referralForm.referredOrganizationName} onChange={(e) => updateReferralForm('referredOrganizationName', e.target.value)} />
          <Select aria-label="Referred Organization Type" value={referralForm.referredOrganizationType} onChange={(e) => updateReferralForm('referredOrganizationType', e.target.value)}>
            {referredOrganizationTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </Select>
          <Input aria-label="Contact Name" placeholder="Contact name" value={referralForm.contactName} onChange={(e) => updateReferralForm('contactName', e.target.value)} />
          <Input aria-label="Contact Email" placeholder="Contact email" value={referralForm.contactEmail} onChange={(e) => updateReferralForm('contactEmail', e.target.value)} />
          <Input aria-label="Contact Phone" placeholder="Contact phone" value={referralForm.contactPhone} onChange={(e) => updateReferralForm('contactPhone', e.target.value)} />
          <Select aria-label="Warm Introduction Status" value={referralForm.warmIntroductionStatus} onChange={(e) => updateReferralForm('warmIntroductionStatus', e.target.value)}>
            {warmIntroductionStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </Select>
          <Select aria-label="Linked Opportunity" value={referralForm.linkedOpportunityId} onChange={(e) => updateReferralForm('linkedOpportunityId', e.target.value)}>
            <option value="">No linked opportunity</option>
            {allOpportunities.filter((opp) => opp.organizationId === id).map((opp) => <option key={opp.id} value={opp.id}>{opp.title}</option>)}
          </Select>
          <Input className="md:col-span-2" aria-label="Relationship Notes" placeholder="Relationship notes" value={referralForm.relationshipNotes} onChange={(e) => updateReferralForm('relationshipNotes', e.target.value)} />
          <Button className="lg:col-span-1" onClick={submitReferral}>Create Referral</Button>
        </div>
        <p className="mt-2 text-xs text-slate-400">Designed for under-30-second capture so the primary sales conversation stays focused.</p>
        {referralMessage ? <p className="mt-2 text-sm text-cyan-200">{referralMessage}</p> : null}
      </Card>

      <Card title="Ecosystem Referrals from This Organization">
        {orgReferrals.length === 0 ? <p className="text-sm text-slate-400">No ecosystem referrals captured yet.</p> : (
          <div className="space-y-2 text-sm">
            {orgReferrals.map((referral) => (
              <div key={referral.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <p className="font-medium text-slate-100">{referral.referredOrganizationName}</p>
                <p className="text-xs text-slate-400">{referral.referredOrganizationType} · {referral.contactName} · {referral.warmIntroductionStatus}</p>
                <p className="text-xs text-slate-300">Notes: {referral.relationshipNotes || 'No notes captured'}</p>
              </div>
            ))}
          </div>
        )}
        <Link className="mt-3 inline-block text-sm text-cyan-200" to="/ecosystem-pipeline">Open Ecosystem Pipeline →</Link>
      </Card>

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
