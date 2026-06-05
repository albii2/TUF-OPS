import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { Button, Card, EmptyState, Select } from '../components/primitives';
import { formatCurrency } from '../utils/format';
import { useOrderById } from '../hooks/useOrders';
import { useOpportunityById } from '../hooks/useOpportunities';
import { useActivities } from '../hooks/useReports';
import { updateMockOrder } from '../services/ordersService';
import type { Order } from '../data/mockSalesData';
import { notify } from '../services/feedbackService';

export function OrderDetailPage() {
  const { id } = useParams();
  const order = useOrderById(id);
  const [localOrder, setLocalOrder] = useState<Order | undefined>();
  const activeOrder = localOrder ?? order;
  const [targetStatus, setTargetStatus] = useState<Order['productionStatus']>(activeOrder?.productionStatus ?? 'NEEDS_REVIEW');
  const [message, setMessage] = useState('');
  const linkedOpportunity = useOpportunityById(activeOrder?.opportunityId);
  const orderActivities = useActivities({ entityType: 'ORDER', entityId: id });

  if (!activeOrder) return <EmptyState title="Order not found" description="Select a valid order from the table." />;

  const saveOrder = () => {
    try {
      const updated = updateMockOrder(activeOrder.id, { productionStatus: targetStatus });
      setLocalOrder(updated);
      setMessage('Order updated.');
      notify('Order updated.', 'success');
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Please check the order and try again.';
      setMessage(detail);
      notify(`Order update failed: ${detail}`, 'error');
    }
  };

  return (
    <div className="space-y-3 min-w-0">
      <Card title="Order Execution Summary">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">{activeOrder.id}</p>
            <p className="text-sm text-slate-400">{activeOrder.organizationName} · {activeOrder.lane}</p>
          </div>
          <p className="text-xl font-semibold text-cyan-300">{formatCurrency(activeOrder.value)}</p>
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Source Opportunity" className="lg:col-span-2">
          {linkedOpportunity ? <Link className="text-cyan-300" to={`/opportunities/${linkedOpportunity.id}`}>{linkedOpportunity.title}</Link> : <p className="text-slate-400">No linked opportunity.</p>}
        </Card>
        <Card title="Current Production Stage"><p className="text-sm text-slate-200">{activeOrder.productionStatus}</p><p className='text-xs text-slate-400 mt-1'>Next production step: {activeOrder.missingInfo.length ? 'Collect missing info then release to vendor.' : activeOrder.productionStatus==='READY_FOR_VENDOR' ? 'Send vendor packet.' : activeOrder.productionStatus==='IN_PRODUCTION' ? 'Track vendor milestone + ship date.' : 'Review handoff package.'}</p></Card>
      </div>

      <Card title="Update Order">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={targetStatus} onChange={(event) => setTargetStatus(event.target.value as Order['productionStatus'])}>
            <option value="NEEDS_REVIEW">NEEDS REVIEW</option>
            <option value="READY_FOR_VENDOR">READY FOR VENDOR</option>
            <option value="IN_PRODUCTION">IN PRODUCTION</option>
            <option value="BLOCKED">BLOCKED</option>
            <option value="COMPLETED">COMPLETED</option>
          </Select>
          <Button onClick={saveOrder}>Save Order</Button>
          {message ? <p className="text-sm text-cyan-200">{message}</p> : null}
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Handoff Package" className="lg:col-span-2"><p className="text-sm text-slate-300">Lane: {activeOrder.lane}. Vendor: {activeOrder.vendor}. Production package is {activeOrder.missingInfo.length ? 'waiting on required details before release.' : 'clear for the current production step.'}</p></Card>
        <Card title="Missing Info Checklist"><p className="text-sm text-slate-300">{activeOrder.missingInfo.length ? `${activeOrder.missingInfo.length} item${activeOrder.missingInfo.length > 1 ? 's' : ''} still required.` : 'Roster and production details are complete for this order.'}</p></Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Vendor Notes" className="lg:col-span-2"><p className="text-sm text-slate-300">{activeOrder.vendorNotes}</p></Card>
        <Card title="Blockers To Clear">
          {activeOrder.missingInfo.length ? <ul className="list-disc pl-4 text-sm text-slate-300">{activeOrder.missingInfo.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="text-sm text-slate-400">No blockers.</p>}
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
