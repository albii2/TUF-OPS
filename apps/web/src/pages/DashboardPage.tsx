import { GlassCard } from '../components/ui';
import type { Role } from '../types';
import { useOpportunities } from '../hooks/useOpportunities';
import { useOrders } from '../hooks/useOrders';
import { useActivities } from '../hooks/useReports';
import { useOrganizations, useStaleAccounts } from '../hooks/useOrganizations';
import { formatCurrency } from '../utils/format';
import { getNearCloseOpportunities, getStuckOpportunities, getLanePenetration } from '../services/businessSelectors';

function FocusPill({ label, value, tone }: { label: string; value: string; tone: 'blue' | 'teal' | 'red' }) {
  const toneClass = tone === 'blue' ? 'from-blue-500/20 to-indigo-500/10 border-blue-400/40' : tone === 'teal' ? 'from-cyan-500/20 to-emerald-500/10 border-cyan-400/40' : 'from-rose-500/18 to-red-500/10 border-rose-400/40';
  return <div className={`rounded-lg border bg-gradient-to-r p-3 ${toneClass}`}><p className="text-2xl font-semibold text-slate-100">{value}</p><p className="text-sm text-slate-200">{label}</p></div>;
}
function ActionRow({ title, subtitle, value }: { title: string; subtitle: string; value: string }) {
  return <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2"><div><p className="text-sm font-semibold text-slate-100">{title}</p><p className="text-xs text-slate-400">{subtitle}</p></div><div className="text-right"><p className="text-sm font-semibold text-slate-100">{value}</p><p className="text-xs text-slate-500">›</p></div></div>;
}

function DashboardFrame({ a,b,c, actionsTitle, actions, nearCloseTitle, nearClose, snapshotTitle, snapshotBody, revenueTitle, revenueBody, recentTitle, recent, monthTitle, monthBody }:{a:[string,string,'blue'|'teal'|'red'];b:[string,string,'blue'|'teal'|'red'];c:[string,string,'blue'|'teal'|'red'];actionsTitle:string;actions:any[];nearCloseTitle:string;nearClose:any[];snapshotTitle:string;snapshotBody:React.ReactNode;revenueTitle:string;revenueBody:React.ReactNode;recentTitle:string;recent:any[];monthTitle:string;monthBody:React.ReactNode;}){
  return <div className="space-y-3"><h2 className="text-3xl font-semibold tracking-tight">Today’s Focus</h2><div className="grid gap-2 md:grid-cols-3"><FocusPill label={a[0]} value={a[1]} tone={a[2]}/><FocusPill label={b[0]} value={b[1]} tone={b[2]}/><FocusPill label={c[0]} value={c[1]} tone={c[2]}/></div><div className="grid gap-2 lg:grid-cols-3"><GlassCard title={actionsTitle}><div className="space-y-2">{actions.map((x:any)=><ActionRow key={x.id||x.title} title={x.title} subtitle={x.subtitle} value={x.value}/>)}</div></GlassCard><GlassCard title={snapshotTitle}>{snapshotBody}</GlassCard><GlassCard title={revenueTitle}>{revenueBody}</GlassCard></div><div className="grid gap-2 lg:grid-cols-3"><GlassCard title={nearCloseTitle}><div className="space-y-2">{nearClose.map((x:any)=><ActionRow key={x.id||x.title} title={x.title} subtitle={x.subtitle} value={x.value}/>)}</div></GlassCard><GlassCard title={recentTitle} className="lg:col-span-2"><div className="space-y-2">{recent.map((a:any)=><div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm"><span className="text-slate-200">• {a.message}</span><span className="text-xs text-slate-400">{a.user}</span></div>)}</div></GlassCard></div><GlassCard title={monthTitle}>{monthBody}</GlassCard></div>;
}

function DirectorDashboard() {
  const opportunities = useOpportunities({});
  const organizations = useOrganizations({});
  const activities = useActivities({ limit: 6 });
  const stale = useStaleAccounts();
  const nearClose = getNearCloseOpportunities(opportunities);
  const stuck = getStuckOpportunities(opportunities);

  const myOpportunities = opportunities.slice(0, 3);
  const reps = Array.from(new Set(opportunities.map((o) => o.assignedRep)));
  const repsNeedingCoaching = reps.filter((rep) => opportunities.some((o) => o.assignedRep === rep && ['CONTACTED', 'DISCOVERY', 'MOCKUP_REQUESTED'].includes(o.stage)));

  const repAccountability = reps.map((rep) => {
    const repOpps = opportunities.filter((o) => o.assignedRep === rep);
    return { rep, stuck: repOpps.filter((o) => ['CONTACTED', 'DISCOVERY', 'MOCKUP_REQUESTED'].includes(o.stage)).length, nearClose: repOpps.filter((o) => ['MOCKUP_DELIVERED', 'INVOICE_SENT', 'DECISION_PENDING'].includes(o.stage)).length, pipeline: repOpps.reduce((sum, o) => sum + o.value, 0) };
  });

  const laneBySport = Array.from(new Set(opportunities.map((o) => o.sport))).map((sport) => {
    const sportOpps = opportunities.filter((o) => o.sport === sport);
    return { sport, uniform: sportOpps.filter((o) => o.lane === 'UNIFORM').length, teamStore: sportOpps.filter((o) => o.lane === 'TEAM_STORE').length, travelGear: sportOpps.filter((o) => o.lane === 'TRAVEL_GEAR').length, letterman: sportOpps.filter((o) => o.lane === 'LETTERMAN').length };
  });

  return (
    <div className="space-y-3">
      <h2 className="text-3xl font-semibold tracking-tight">Today’s Focus</h2>
      <div className="grid gap-2 md:grid-cols-3">
        <FocusPill label="Stuck Deals" value={String(stuck.length)} tone="red" />
        <FocusPill label="Reps Needing Coaching" value={String(repsNeedingCoaching.length)} tone="blue" />
        <FocusPill label="Near Close" value={String(nearClose.length)} tone="teal" />
      </div>

      <div className="grid gap-2 lg:grid-cols-3">
        <GlassCard title="TEAM NEXT ACTIONS">
          <div className="space-y-2">{opportunities.slice(0, 4).map((o) => <ActionRow key={o.id} title={o.nextAction} subtitle={`${o.assignedRep} · ${o.organizationName}`} value={formatCurrency(o.value)} />)}</div>
        </GlassCard>
        <GlassCard title="REP ACCOUNTABILITY">
          <div className="space-y-2 text-sm">{repAccountability.map((r) => <p key={r.rep} className="text-slate-300">{r.rep}: Stuck {r.stuck} · Near Close {r.nearClose} · Pipeline {formatCurrency(r.pipeline)}</p>)}</div>
        </GlassCard>
        <GlassCard title="TEAM PIPELINE SNAPSHOT">
          <p className="text-sm text-slate-300">Open Pipeline: {formatCurrency(opportunities.reduce((sum, o) => sum + o.value, 0))}</p>
          <p className="text-sm text-slate-300">Untouched Accounts: {organizations.filter((o) => o.coverageStatus === 'UNTOUCHED').length}</p>
          <p className="text-sm text-slate-300">Stale Accounts (14+): {stale.length}</p>
        </GlassCard>
      </div>

      <div className="grid gap-2 lg:grid-cols-3">
        <GlassCard title="MY OPPORTUNITIES">
          <div className="space-y-2">{myOpportunities.map((o) => <ActionRow key={o.id} title={o.title} subtitle={o.stage} value={formatCurrency(o.value)} />)}</div>
        </GlassCard>
        <GlassCard title="TERRITORY COVERAGE">
          <p className="text-sm text-slate-300">Accounts Needing Action: {organizations.filter((o) => o.coverageStatus !== 'CLOSED' && o.nextAction).length}</p>
          <p className="text-sm text-slate-300">Untouched Accounts: {organizations.filter((o) => o.coverageStatus === 'UNTOUCHED').length}</p>
          <p className="text-sm text-slate-300">Stuck Deals: {stuck.length}</p>
        </GlassCard>
        <GlassCard title="LANE PENETRATION">
          <div className="space-y-1 text-sm text-slate-300">{laneBySport.map((s) => <p key={s.sport}>{s.sport}: U {s.uniform} · TS {s.teamStore} · TG {s.travelGear} · L {s.letterman}</p>)}</div>
        </GlassCard>
      </div>

      <div className="grid gap-2 lg:grid-cols-3">
        <GlassCard title="WEEKLY COACHING SUMMARY">
          <p className="text-sm text-slate-300">1:1 Priority: {repsNeedingCoaching.join(', ') || 'No coaching alerts'}</p>
          <p className="text-sm text-slate-300">Close Assist Queue: {nearClose.length} deals</p>
        </GlassCard>
        <GlassCard title="RECENT REP ACTIVITY" className="lg:col-span-2">
          <div className="space-y-2">{activities.map((a:any) => <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm"><span className="text-slate-200">• {a.message}</span><span className="text-xs text-slate-400">{a.user}</span></div>)}</div>
        </GlassCard>
      </div>
    </div>
  );
}

function RoleDashboard({ role }: { role: Role }) {
  const opportunities = useOpportunities({}); const orders = useOrders({}); const organizations = useOrganizations({}); const activities = useActivities({ limit: 4 }); const nearClose = getNearCloseOpportunities(opportunities); const stuck = getStuckOpportunities(opportunities); const lane = getLanePenetration(organizations);
  const actionsBase = opportunities.slice(0,3).map(o=>({id:o.id,title:o.nextAction,subtitle:o.organizationName,value:formatCurrency(o.value)}));
  const nearBase = nearClose.slice(0,3).map(o=>({id:o.id,title:o.organizationName,subtitle:o.nextAction,value:formatCurrency(o.value)}));
  if(role==='REP') return <DashboardFrame a={['Deals Need Action',String(opportunities.length),'blue']} b={['Near Close',String(nearClose.length),'teal']} c={['Payments Pending',String(opportunities.filter(o=>o.stage==='INVOICE_SENT').length),'red']} actionsTitle="NEXT ACTIONS" actions={actionsBase} nearCloseTitle="DEALS NEAR CLOSE" nearClose={nearBase} snapshotTitle="PIPELINE SNAPSHOT" snapshotBody={<div className='text-sm text-slate-300'>Contacted {formatCurrency(opportunities.filter(o=>o.stage==='CONTACTED').reduce((a,b)=>a+b.value,0))}<br/>Mockup {formatCurrency(opportunities.filter(o=>o.stage==='MOCKUP_DELIVERED').reduce((a,b)=>a+b.value,0))}<br/>Invoice {formatCurrency(opportunities.filter(o=>o.stage==='INVOICE_SENT').reduce((a,b)=>a+b.value,0))}</div>} revenueTitle="REVENUE" revenueBody={<div className='text-sm text-slate-300'>Closed {formatCurrency(opportunities.filter(o=>o.stage==='CLOSED_WON').reduce((a,b)=>a+b.value,0))}<br/>Pending {formatCurrency(opportunities.filter(o=>o.stage==='INVOICE_SENT').reduce((a,b)=>a+b.value,0))}</div>} recentTitle="RECENT ACTIVITY" recent={activities} monthTitle="THIS MONTH" monthBody={<p className='text-sm text-slate-300'>2 / 4 Orders</p>} />;
  if(role==='OWNER') return <DashboardFrame a={['Revenue at Risk',formatCurrency(stuck.reduce((a,b)=>a+b.value,0)),'red']} b={['Near Close Pipeline',formatCurrency(nearClose.reduce((a,b)=>a+b.value,0)),'teal']} c={['Payments Pending',String(opportunities.filter(o=>o.stage==='INVOICE_SENT').length),'blue']} actionsTitle="STRATEGIC ALERTS" actions={stuck.slice(0,3).map(o=>({id:o.id,title:o.organizationName,subtitle:o.nextAction,value:formatCurrency(o.value)}))} nearCloseTitle="TOP OPPORTUNITIES" nearClose={nearBase} snapshotTitle="LANE PENETRATION" snapshotBody={<p className='text-sm text-slate-300'>Uniform {lane.UNIFORM} · Travel {lane.TRAVEL_GEAR} · Store {lane.TEAM_STORE} · Letterman {lane.LETTERMAN}</p>} revenueTitle="REVENUE OVERVIEW" revenueBody={<p className='text-sm text-slate-300'>Open Pipeline {formatCurrency(opportunities.reduce((a,b)=>a+b.value,0))}</p>} recentTitle="RECENT ACTIVITY" recent={activities} monthTitle="LEADERSHIP PRIORITY" monthBody={<p className='text-sm text-slate-300'>Unblock stuck deals and expand lane coverage.</p>} />;
  if(role==='DIRECTOR') return <DirectorDashboard />;
  return <DashboardFrame a={['New Orders',String(orders.filter(o=>o.productionStatus==='NEEDS_REVIEW').length),'blue']} b={['Missing Info',String(orders.filter(o=>o.missingInfo.length).length),'teal']} c={['Blocked Orders',String(orders.filter(o=>o.productionStatus==='BLOCKED').length),'red']} actionsTitle="READY FOR VENDOR" actions={orders.filter(o=>o.productionStatus==='READY_FOR_VENDOR').slice(0,3).map(o=>({id:o.id,title:o.organizationName,subtitle:o.productionStatus,value:formatCurrency(o.value)}))} nearCloseTitle="BLOCKER REASONS" nearClose={orders.filter(o=>o.productionStatus==='BLOCKED').slice(0,3).map(o=>({id:o.id,title:o.organizationName,subtitle:o.missingInfo.join(', ')||'Missing details',value:formatCurrency(o.value)}))} snapshotTitle="IN PRODUCTION" snapshotBody={<p className='text-sm text-slate-300'>{orders.filter(o=>o.productionStatus==='IN_PRODUCTION').length} active orders</p>} revenueTitle="EXECUTION VALUE" revenueBody={<p className='text-sm text-slate-300'>{formatCurrency(orders.reduce((a,b)=>a+b.value,0))}</p>} recentTitle="RECENT HANDOFFS" recent={activities} monthTitle="OPS GOAL" monthBody={<p className='text-sm text-slate-300'>Clear blocked orders within 48 hours.</p>} />;
}

export function DashboardPage({ role }: { role: Role }) { return <RoleDashboard role={role} />; }
