export { OrganizationsPage } from './OrganizationsPage';
export { OrganizationDetailPage } from './OrganizationDetailPage';
export { OpportunitiesPage } from './OpportunitiesPage';
export { OpportunityDetailPage } from './OpportunityDetailPage';
export { OrdersPage } from './OrdersPage';
export { OrderDetailPage } from './OrderDetailPage';
export { OpsWorkspacePage } from './OpsWorkspacePage';
export { ReportsPage } from './ReportsPage';
export { SettingsPage } from './SettingsPage';
export { OrganizationNewPage, OpportunityNewPage } from './NewPages';
import { useParams } from 'react-router-dom';
import { GlassCard } from '../components/ui';
import { lanes, opportunityStages } from '../data/mock';

export function OrganizationsPage() {
  return (
    <GlassCard title="Organizations">
      <p className="mb-3 text-sm text-slate-300">Revenue Lanes</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {lanes.map((lane) => (
          <div key={lane} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-sm text-cyan-200">{lane}</div>
        ))}
      </div>
    </GlassCard>
  );
}

export function OrganizationNewPage() {
  return <GlassCard title="New Organization">Compact new organization intake form placeholder.</GlassCard>;
}

export function OrganizationDetailPage() {
  const { id } = useParams();
  return <GlassCard title={`Organization ${id}`}>Organization detail placeholder with lane penetration and contact stack.</GlassCard>;
}

export function OpportunitiesPage() {
  return <GlassCard title="Pipeline">Opportunity pipeline board placeholder by stage.</GlassCard>;
}

export function OpportunityNewPage() {
  return <GlassCard title="New Opportunity">Opportunity creation placeholder with stage and lane selection.</GlassCard>;
}

export function OpportunityDetailPage() {
  const { id } = useParams();
  const currentStage = 'MOCKUP_DELIVERED';
  return (
    <div className="space-y-3">
      <GlassCard title={`Opportunity ${id}`}>
        <p className="text-sm text-slate-300">Stage Progress</p>
        <div className="mt-2 grid gap-2 md:grid-cols-3 xl:grid-cols-5">
          {opportunityStages.map((stage) => (
            <div key={stage} className={`rounded-md border p-2 text-[10px] uppercase tracking-[0.18em] ${stage === currentStage ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200' : 'border-slate-800 bg-slate-950/70 text-slate-400'}`}>
              {stage}
            </div>
          ))}
        </div>
      </GlassCard>
      <div className="grid gap-3 lg:grid-cols-3">
        <GlassCard title="Next Action" className="lg:col-span-2">
          Confirm mascot color correction before invoice send.
        </GlassCard>
        <GlassCard title="Stage CTA">
          <button className="w-full rounded-lg border border-cyan-400/60 bg-cyan-500/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-cyan-200">Send Invoice</button>
        </GlassCard>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <GlassCard title="Activity Feed" className="lg:col-span-2">Recent notes and communication history placeholder.</GlassCard>
        <GlassCard title="Files / Mockup / Invoice">Document pane placeholder.</GlassCard>
      </div>
      <GlassCard title="Outcome Controls">
        <div className="flex gap-2">
          <button className="rounded-lg border border-cyan-400/60 px-3 py-2 text-xs uppercase tracking-[0.18em] text-cyan-200">Closed Won</button>
          <button className="rounded-lg border border-slate-600 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-300">Closed Lost</button>
        </div>
      </GlassCard>
    </div>
  );
}

export function OrdersPage() {
  return <GlassCard title="Orders">Order queue placeholder.</GlassCard>;
}

export function OrderDetailPage() {
  const { id } = useParams();
  return <GlassCard title={`Order ${id}`}>Order detail placeholder with production milestones.</GlassCard>;
}

export function OpsWorkspacePage() {
  return <GlassCard title="Ops Workspace">Operational board and vendor routing placeholder.</GlassCard>;
}

export function ReportsPage() {
  return <GlassCard title="Reports">Programs, territory, performance, and messages reporting placeholders.</GlassCard>;
}

export function SettingsPage() {
  return <GlassCard title="Settings">Role preferences, compact density, and app controls.</GlassCard>;
}
