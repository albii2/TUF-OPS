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

function ActionRow({ title, sub, value }: { title: string; sub: string; value: string }) {
  return <button className='w-full rounded-lg panel-elevated p-2 text-left transition hover:bg-[#132133]'><div className='flex items-center justify-between'><div><p className='text-sm font-semibold'>{title}</p><p className='text-xs text-[var(--text-secondary)]'>{sub}</p></div><p className='text-sm font-semibold text-[#1FB6FF]'>{value}</p></div></button>;
}

export function DashboardPage({ role }: { role: Role }) {
  const opportunities = useOpportunities({});
  const organizations = useOrganizations({});
  const activities = useActivities({ limit: 5 });
  const nearClose = getNearCloseOpportunities(opportunities);
  const stuck = getStuckOpportunities(opportunities);
  const paymentsPending = opportunities.filter((o) => o.stage === 'INVOICE_SENT');
  const closed = opportunities.filter((o) => o.stage === 'CLOSED_WON');

  const stageValue = (stage: string) => opportunities.filter((o) => o.stage === stage).reduce((sum, o) => sum + o.value, 0);
  const stageCount = (stage: string) => opportunities.filter((o) => o.stage === stage).length;

  const roleActions = role === 'DIRECTOR' ? opportunities : role === 'REP' ? opportunities : opportunities;

  return (
    <div className='space-y-2.5'>
      <div>
        <h1 className='text-[32px] font-semibold'>Dashboard</h1>
      </div>

      <div className='grid gap-2 md:grid-cols-3'>
        <Metric label={role === 'DIRECTOR' ? 'Stuck Deals' : 'Deals Need Action'} value={String(role === 'DIRECTOR' ? stuck.length : opportunities.length)} sub={role === 'DIRECTOR' ? 'needs coaching' : 'today'} />
        <Metric label='Near Close' value={String(nearClose.length)} sub='this week' />
        <Metric label='Payments Pending' value={String(paymentsPending.length)} sub='follow up required' />
      </div>

      <div className='grid gap-2 lg:grid-cols-[1.2fr_1fr_1fr]'>
        <div className='space-y-2'>
          <GlassCard title={role === 'DIRECTOR' ? 'TEAM NEXT ACTIONS' : 'NEXT ACTIONS'}>
            <div className='space-y-2'>{roleActions.slice(0,4).map((o) => <ActionRow key={o.id} title={o.nextAction} sub={`${o.organizationName} · ${o.assignedRep}`} value={formatCurrency(o.value)} />)}</div>
          </GlassCard>
          <GlassCard title='DEALS NEAR CLOSE'>
            <div className='space-y-2'>{nearClose.slice(0,4).map((o) => <ActionRow key={o.id} title={o.title} sub={o.stage.replace(/_/g, ' ')} value={formatCurrency(o.value)} />)}</div>
          </GlassCard>
        </div>

        <GlassCard title='PIPELINE SNAPSHOT'>
          <div className='space-y-2'>
            {[['CONTACTED','Contacted'],['MOCKUP_DELIVERED','Mockup Created'],['INVOICE_SENT','Invoice Sent'],['CLOSED_WON','Closed']].map(([k,label]) => {
              const value = stageValue(k);
              const count = stageCount(k);
              const width = Math.min(100, Math.round((value / Math.max(1, opportunities.reduce((s,o)=>s+o.value,0))) * 100));
              return <div key={k}><div className='mb-1 flex items-center justify-between text-xs text-[var(--text-secondary)]'><span>{label}</span><span>{count}</span></div><div className='h-2 rounded-full bg-[#0c1a2a]'><div className='h-2 rounded-full bg-gradient-to-r from-[#1FB6FF] to-[#3B82F6]' style={{width:`${width}%`}} /></div></div>;
            })}
          </div>
        </GlassCard>

        <GlassCard title='REVENUE'>
          <p className='text-sm text-[var(--text-secondary)]'>Total</p>
          <p className='text-[32px] font-semibold'>{formatCurrency(opportunities.reduce((s,o)=>s+o.value,0))}</p>
          <p className='mt-3 text-sm text-[var(--text-secondary)]'>Pending</p>
          <p className='text-xl font-semibold text-[#1FB6FF]'>{formatCurrency(paymentsPending.reduce((s,o)=>s+o.value,0))}</p>
          <p className='mt-3 text-sm text-[var(--text-secondary)]'>Overdue</p>
          <p className='text-xl font-semibold text-[var(--danger)]'>{formatCurrency(stuck.reduce((s,o)=>s+o.value,0))}</p>
          {role === 'OWNER' ? <p className='mt-3 text-xs text-[var(--text-secondary)]'>Territory overview: {organizations.length} accounts</p> : null}
          {role === 'DIRECTOR' ? <p className='mt-3 text-xs text-[var(--text-secondary)]'>My territory accounts: {organizations.length}</p> : null}
        </GlassCard>
      </div>

      <div className='grid gap-2 lg:grid-cols-2'>
        <GlassCard title={role === 'DIRECTOR' ? 'RECENT REP ACTIVITY' : 'RECENT ACTIVITY'}>
          <div className='space-y-2'>{activities.map((a:any) => <div key={a.id} className='rounded-md panel-elevated p-2 text-sm'><div className='flex items-center justify-between'><span>{a.message}</span><span className='text-xs text-[var(--text-secondary)]'>{a.user}</span></div></div>)}</div>
        </GlassCard>
        <GlassCard title={role === 'OWNER' ? 'REP PERFORMANCE SNAPSHOT' : role === 'DIRECTOR' ? 'WEEKLY COACHING SUMMARY' : 'MY PIPELINE'}>
          <p className='text-sm text-[var(--text-secondary)]'>Open opportunities: {opportunities.length}</p>
          <p className='text-sm text-[var(--text-secondary)]'>Near close deals: {nearClose.length}</p>
          <p className='text-sm text-[var(--text-secondary)]'>Closed won: {closed.length}</p>
        </GlassCard>
      </div>
    </div>
  );
}
