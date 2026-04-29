import { Link, useParams } from 'react-router-dom';
import { Button, Card, EmptyState, StageBadge } from '../components/primitives';
import { formatCurrency } from '../utils/format';
import { useOpportunityById, useOpportunityStages } from '../hooks/useOpportunities';
import { useActivities } from '../hooks/useReports';

const stageCtas = {
  LEAD_ASSIGNED: 'Contact coach',
  CONTACTED: 'Log discovery',
  DISCOVERY: 'Request mockup',
  MOCKUP_REQUESTED: 'Mark mockup delivered',
  MOCKUP_DELIVERED: 'Send invoice',
  INVOICE_SENT: 'Follow up payment',
  DECISION_PENDING: 'Push decision',
  CLOSED_WON: 'View order',
  CLOSED_LOST: 'Review loss reason',
} as const;

export function OpportunityDetailPage() {
  const { id } = useParams();
  const opp = useOpportunityById(id);
  const opportunityStages = useOpportunityStages();
  const dealActivity = useActivities({ entityType: 'OPPORTUNITY', entityId: id });
  if (!opp) return <EmptyState title="Opportunity not found" description="Select another opportunity from the pipeline table." />;

  return (
    <div className="space-y-3">
      <Card title="Deal Header">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">{opp.title}</p>
            <Link to={`/organizations/${opp.organizationId}`} className="text-sm text-cyan-300">{opp.organizationName}</Link>
            <p className="text-xs text-slate-400">{opp.lane} · {opp.sport} · {opp.season}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold text-cyan-300">{formatCurrency(opp.value)}</p>
            <p className="text-xs text-slate-400">Assigned Rep: {opp.assignedRep}</p>
          </div>
        </div>
      </Card>

      <Card title="Stage Progress">
        <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-5">
          {opportunityStages.map((stage) => (
            <div key={stage} className={`rounded-md border p-2 ${stage === opp.stage ? 'border-cyan-400 bg-cyan-500/15' : 'border-slate-800 bg-slate-950/70'}`}>
              <StageBadge stage={stage} />
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Next Action Panel" className="lg:col-span-2"><p className="text-sm text-slate-300">{opp.nextAction}</p></Card>
        <Card title="Stage-specific CTA"><Button className="w-full">{stageCtas[opp.stage]}</Button></Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Activity Feed" className="lg:col-span-2">
          <div className="space-y-2 text-sm">
            {dealActivity.length ? dealActivity.map((entry) => <div key={entry.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">{entry.message}<p className="text-xs text-slate-400">{entry.timestamp} · {entry.user}</p></div>) : <p className="text-slate-400">No activity entries yet.</p>}
          </div>
        </Card>
        <Card title="Files / Mockup"><p className="text-sm text-slate-400">Mockups, files, and approvals placeholder.</p></Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Invoice / Payment" className="lg:col-span-2"><p className="text-sm text-slate-300">Invoice status placeholder and payment follow-up actions.</p></Card>
        <Card title="Outcome Controls"><div className="space-y-2"><Button className="w-full">Closed Won</Button><Button className="w-full border-slate-600 bg-slate-800/60 text-slate-200">Closed Lost</Button></div></Card>
      </div>
    </div>
  );
}
