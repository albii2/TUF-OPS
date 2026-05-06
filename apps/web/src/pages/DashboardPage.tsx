import { Link } from 'react-router-dom';
import { GlassCard } from '../components/ui';
import type { Role } from '../types';
import { useOpportunities } from '../hooks/useOpportunities';
import { useActivities } from '../hooks/useReports';
import { useOrganizations } from '../hooks/useOrganizations';
import { formatCurrency } from '../utils/format';
import { getNearCloseOpportunities, getStuckOpportunities } from '../services/businessSelectors';

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return <GlassCard><p className='text-xs text-[var(--text-secondary)]'>{label}</p><p className='mt-1 text-[40px] font-semibold text-[var(--text-primary)]'>{value}</p><p className='text-sm text-[#1FB6FF]'>{sub}</p></GlassCard>;
}

function ActionRow({ title, sub, value, to }: { title: string; sub: string; value: string; to: string }) {
  return <Link to={to} className='block w-full rounded-lg panel-elevated p-2 text-left transition hover:bg-[#132133]'><div className='flex items-center justify-between'><div><p className='text-sm font-semibold'>{title}</p><p className='text-xs text-[var(--text-secondary)]'>{sub}</p></div><p className='text-sm font-semibold text-[#1FB6FF]'>{value}</p></div></Link>;
}

export function DashboardPage({ role }: { role: Role }) {
  const opportunities = useOpportunities({});
  const organizations = useOrganizations({});
  const activities = useActivities({ limit: 6 });
  const nearClose = getNearCloseOpportunities(opportunities);
  const stuck = getStuckOpportunities(opportunities);
  const paymentsPending = opportunities.filter((o) => o.stage === 'INVOICE_SENT');
  const closed = opportunities.filter((o) => o.stage === 'CLOSED_WON');

  const byStage = [
    ['LEAD_ASSIGNED', 'Lead Assigned'],
    ['CONTACTED', 'Contacted'],
    ['DISCOVERY', 'Conversation'],
    ['MOCKUP_DELIVERED', 'Proposal Sent'],
    ['DECISION_PENDING', 'Decision Pending'],
    ['CLOSED_WON', 'Closed Won'],
  ] as const;

  const stageValue = (stage: string) => opportunities.filter((o) => o.stage === stage).reduce((sum, o) => sum + o.value, 0);
  const stageCount = (stage: string) => opportunities.filter((o) => o.stage === stage).length;
  const totalPipeline = opportunities.reduce((s, o) => s + o.value, 0);

  const territoryOverview = ['metro', 'north', 'west', 'south'].map((zone) => {
    const zoneOrgs = organizations.filter((o) => o.territory === zone);
    const zoneOppIds = new Set(zoneOrgs.map((o) => o.id));
    const zoneOpps = opportunities.filter((o) => zoneOppIds.has(o.organizationId));
    return {
      zone: `TUF ${zone.toUpperCase()}`,
      accounts: zoneOrgs.length,
      untouched: zoneOrgs.filter((o) => o.coverageStatus === 'UNTOUCHED').length,
      pipeline: zoneOpps.reduce((s, o) => s + o.value, 0),
      closed: zoneOpps.filter((o) => o.stage === 'CLOSED_WON').reduce((s, o) => s + o.value, 0),
      coverage: zoneOrgs.length ? Math.round(((zoneOrgs.length - zoneOrgs.filter((o) => o.coverageStatus === 'UNTOUCHED').length) / zoneOrgs.length) * 100) : 0,
    };
  });

  const topOpps = [...opportunities].sort((a, b) => b.value - a.value).slice(0, 3);

  return (
    <div className='space-y-2.5'>
      <div><h1 className='text-[32px] font-semibold'>Dashboard</h1></div>
      <div className='grid gap-2 md:grid-cols-4'>
        <Metric label='Total Pipeline' value={formatCurrency(totalPipeline)} sub='+12% this month' />
        <Metric label='Open Opportunities' value={String(opportunities.filter((o) => !['CLOSED_WON', 'CLOSED_LOST'].includes(o.stage)).length)} sub='+5 this week' />
        <Metric label='Closed Won (YTD)' value={formatCurrency(closed.reduce((s, o) => s + o.value, 0))} sub='+18% this month' />
        <Metric label='Avg. Deal Size' value={formatCurrency(Math.round(totalPipeline / Math.max(1, opportunities.length)))} sub='+8% this month' />
      </div>

      <GlassCard title='PIPELINE BY STAGE'>
        <div className='grid gap-0 border border-[var(--border)] rounded-lg overflow-hidden lg:grid-cols-6'>
          {byStage.map(([key, label]) => (
            <div key={key} className='panel-elevated border-r border-[var(--border)] p-3 last:border-r-0'>
              <p className='text-xs text-[var(--text-secondary)]'>{label}</p>
              <p className='mt-1 text-[40px] font-semibold text-[#1FB6FF]'>{stageCount(key)}</p>
              <p className='text-sm text-[var(--text-primary)]'>{formatCurrency(stageValue(key))}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className='grid gap-2 lg:grid-cols-3'>
        <GlassCard title='LANE PENETRATION'>
          <p className='text-5xl font-semibold text-[#1FB6FF]'>68%</p>
          <p className='text-xs text-[var(--text-secondary)]'>AVG. PENETRATION</p>
          <div className='mt-2 space-y-1 text-sm text-[var(--text-primary)]'>
            <p>Uniform 68%</p><p>Travel Gear 54%</p><p>Team Store 42%</p><p>Letterman 35%</p>
          </div>
        </GlassCard>
        <GlassCard title='RECENT ACTIVITY'>
          <div className='space-y-2'>{activities.map((a:any) => <ActionRow key={a.id} title={a.user} sub={a.message} value='now' to='/opportunities' />)}</div>
          <Link className='mt-2 inline-block text-sm text-[#1FB6FF]' to='/reports'>View All Activity</Link>
        </GlassCard>
        <GlassCard title='TOP OPPORTUNITIES'>
          <div className='space-y-2'>{topOpps.map((o) => <ActionRow key={o.id} title={o.organizationName} sub={o.stage.replace(/_/g,' ')} value={formatCurrency(o.value)} to={`/opportunities/${o.id}`} />)}</div>
          <Link className='mt-2 inline-block text-sm text-[#1FB6FF]' to='/opportunities'>View All Opportunities</Link>
        </GlassCard>
      </div>

      {role === 'OWNER' ? (
        <GlassCard title='TERRITORY OVERVIEW'>
          <div className='grid gap-2 md:grid-cols-2 xl:grid-cols-4'>
            {territoryOverview.map((t) => (
              <div key={t.zone} className='panel-elevated rounded-lg p-3'>
                <p className='font-semibold'>{t.zone}</p>
                <p className='text-sm text-[var(--text-secondary)]'>Accounts {t.accounts}</p>
                <p className='text-sm text-[var(--text-secondary)]'>Untouched {t.untouched}</p>
                <p className='text-sm text-[var(--text-secondary)]'>Pipeline {formatCurrency(t.pipeline)}</p>
                <p className='text-sm text-[var(--text-secondary)]'>Closed {formatCurrency(t.closed)}</p>
                <p className='text-sm text-[#1FB6FF]'>Coverage {t.coverage}%</p>
              </div>
            ))}
          </div>
        </GlassCard>
      ) : null}

      {role !== 'OWNER' ? (
        <div className='grid gap-2 lg:grid-cols-2'>
          <GlassCard title={role === 'DIRECTOR' ? 'TEAM NEXT ACTIONS' : 'MY NEXT ACTIONS'}>
            <div className='space-y-2'>{opportunities.slice(0, 6).map((o) => <ActionRow key={o.id} title={o.nextAction} sub={o.organizationName} value={formatCurrency(o.value)} to={`/opportunities/${o.id}`} />)}</div>
          </GlassCard>
          <GlassCard title='DEALS NEAR CLOSE'>
            <div className='space-y-2'>{nearClose.slice(0, 6).map((o) => <ActionRow key={o.id} title={o.title} sub={o.stage.replace(/_/g,' ')} value={formatCurrency(o.value)} to={`/opportunities/${o.id}`} />)}</div>
          </GlassCard>
        </div>
      ) : null}

      {role === 'DIRECTOR' ? <GlassCard title='DIRECTOR FOCUS'><p className='text-sm text-[var(--text-secondary)]'>Stuck Deals: {stuck.length} · Reps Needing Coaching: {new Set(stuck.map((o) => o.assignedRep)).size} · Near Close: {nearClose.length}</p></GlassCard> : null}
      {role === 'REP' ? <GlassCard title='REP FOCUS'><p className='text-sm text-[var(--text-secondary)]'>My pipeline: {formatCurrency(totalPipeline)} · My revenue pending: {formatCurrency(paymentsPending.reduce((s,o)=>s+o.value,0))}</p></GlassCard> : null}
    </div>
  );
}
