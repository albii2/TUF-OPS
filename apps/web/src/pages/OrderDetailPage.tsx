import { Link, useParams } from 'react-router-dom';
import { Card, EmptyState } from '../components/primitives';
import { formatCurrency } from '../utils/format';
import { useOrderById } from '../hooks/useOrders';
import { useOpportunityById } from '../hooks/useOpportunities';
import { useActivities } from '../hooks/useReports';

export function OrderDetailPage() {
  const { id } = useParams();
  const order = useOrderById(id);
  const linkedOpportunity = useOpportunityById(order?.opportunityId);
  const orderActivities = useActivities({ entityType: 'ORDER', entityId: id });

  if (!order) return <EmptyState title="Order not found" description="Select a valid order from the table." />;

  return (
    <div className="space-y-3 min-w-0">
      <Card title="Order Execution Summary">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">{order.id}</p>
            <p className="text-sm text-slate-400">{order.organizationName} · {order.lane}</p>
          </div>
          <p className="text-xl font-semibold text-cyan-300">{formatCurrency(order.value)}</p>
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Source Opportunity" className="lg:col-span-2">
          {linkedOpportunity ? <Link className="text-cyan-300" to={`/opportunities/${linkedOpportunity.id}`}>{linkedOpportunity.title}</Link> : <p className="text-slate-400">No linked opportunity.</p>}
        </Card>
        <Card title="Current Production Stage"><p className="text-sm text-slate-200">{order.productionStatus}</p><p className='text-xs text-slate-400 mt-1'>Next production step: {order.missingInfo.length ? 'Collect missing info then release to vendor.' : order.productionStatus==='READY_FOR_VENDOR' ? 'Send vendor packet.' : order.productionStatus==='IN_PRODUCTION' ? 'Track vendor milestone + ship date.' : 'Review handoff package.'}</p></Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Handoff Package" className="lg:col-span-2"><p className="text-sm text-slate-300">Lane: {order.lane}. Vendor: {order.vendor}. Production package is {order.missingInfo.length ? 'waiting on required details before release.' : 'clear for the current production step.'}</p></Card>
        <Card title="Missing Info Checklist"><p className="text-sm text-slate-300">{order.missingInfo.length ? `${order.missingInfo.length} item${order.missingInfo.length > 1 ? 's' : ''} still required.` : 'Roster and production details are complete for this mock order.'}</p></Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Vendor Notes" className="lg:col-span-2"><p className="text-sm text-slate-300">{order.vendorNotes}</p></Card>
        <Card title="Blockers To Clear">
          {order.missingInfo.length ? <ul className="list-disc pl-4 text-sm text-slate-300">{order.missingInfo.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="text-sm text-slate-400">No blockers.</p>}
        </Card>
      </div>

      <Card title="Ops Activity Timeline">
        <div className="space-y-2 text-sm">
          {orderActivities.length ? orderActivities.map((a) => <div key={a.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">{a.message}<p className="text-xs text-slate-400">{a.timestamp} · {a.user}</p></div>) : <p className="text-slate-400">No order activity yet.</p>}
        </div>
      </Card>
    </div>
  );
}
