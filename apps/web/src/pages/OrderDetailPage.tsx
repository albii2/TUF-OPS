import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { Button, Card, EmptyState, Select } from '../components/primitives';
import { formatCurrency } from '../utils/format';
import { useOrderById } from '../hooks/useOrders';
import { useOpportunityById } from '../hooks/useOpportunities';
import { useOrganizationById } from '../hooks/useOrganizations';
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

      <Card title="Stage Progress">
        <div className="grid gap-2 md:grid-cols-4 xl:grid-cols-8">
          {ORDER_STAGE_FLOW.map((flowStage, index) => {
            const currentIndex = ORDER_STAGE_FLOW.indexOf(stage);
            const isCurrent = flowStage === stage;
            const isComplete = currentIndex > index || stage === 'COMPLETED';
            const muted = currentIndex >= 0 && currentIndex < index;
            return (
              <div key={flowStage} className={`rounded-lg border p-2 ${isCurrent ? 'border-cyan-300 bg-cyan-400/15 text-cyan-50 ring-1 ring-cyan-300/40' : isComplete ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-100' : muted ? 'border-slate-800 bg-slate-950/40 text-slate-500' : 'border-slate-700 bg-slate-900/50 text-slate-300'}`}>
                <p className="text-[10px] font-bold uppercase tracking-wider">{isComplete ? 'Complete' : isCurrent ? 'Current' : 'Next'}</p>
                <p className="mt-1 text-xs font-semibold">{getOrderStageLabel(flowStage)}</p>
              </div>
            );
          })}
          {stage === 'BLOCKED_ON_HOLD' ? <div className="rounded-lg border border-rose-500/70 bg-rose-500/15 p-2 text-rose-100 ring-1 ring-rose-400/40"><p className="text-[10px] font-bold uppercase tracking-wider">Current</p><p className="mt-1 text-xs font-semibold">Blocked / On Hold</p></div> : null}
        </div>
      </Card>

      <Card title="Next Action">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="space-y-2">
            <p className="text-lg font-bold text-white">{getOrderNextAction(activeOrder)}</p>
            <div className="flex flex-wrap gap-2">
              <Chip label="Owner" value={owner} />
              <Chip label="Due" value={formatDate(dueDate)} />
              <Chip label="Risk" value={risk.reason} tone={risk.tone} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={!nextStage || !canAdvance} onClick={() => openDrawer('advance')}>{stage === 'BLOCKED_ON_HOLD' ? 'Resolve / Continue' : 'Advance Order'}</Button>
            <button className="rounded-lg border border-rose-500/40 px-3 py-2.5 text-sm font-bold text-rose-200" onClick={() => openDrawer('block')}>Block / Hold</button>
            <button className="rounded-lg border border-slate-700 px-3 py-2.5 text-sm font-bold text-slate-300" onClick={() => setMessage('Log Note placeholder: activity modal planned for a future sprint.')}>Log Note</button>
          </div>
        </div>
        {message ? <p className="mt-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">{message}</p> : null}
      </Card>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="Order Details" className="lg:col-span-2">
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <p className="rounded-lg border border-slate-800 bg-slate-950/40 p-2"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Product / Lane</span>{getLaneLabel(activeOrder.lane)}</p>
            <p className="rounded-lg border border-slate-800 bg-slate-950/40 p-2"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Sport</span>{activeOrder.sport ?? linkedOpportunity?.sport ?? 'Not recorded'}</p>
            <p className="rounded-lg border border-slate-800 bg-slate-950/40 p-2"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Quantity</span>{activeOrder.quantity ?? 'Not recorded'}</p>
            <p className="rounded-lg border border-slate-800 bg-slate-950/40 p-2"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Artwork / Mockup</span>{activeOrder.artworkStatus ?? 'Needs review'}</p>
            <p className="rounded-lg border border-slate-800 bg-slate-950/40 p-2"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Payment</span>{activeOrder.paymentStatus ?? (stage === 'ORDER_CREATED' ? 'Pending confirmation' : 'Confirmed or not recorded')}</p>
            <p className="rounded-lg border border-slate-800 bg-slate-950/40 p-2"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Vendor</span>{activeOrder.vendor} · {activeOrder.vendorStatus ?? 'Status not recorded'}</p>
            <p className="rounded-lg border border-slate-800 bg-slate-950/40 p-2"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Shipping / Delivery</span>{activeOrder.shippingStatus ?? 'Not shipped'}</p>
            <p className="rounded-lg border border-slate-800 bg-slate-950/40 p-2"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Customer Contact</span>{activeOrder.customerContact ?? organization?.headCoachName ?? organization?.athleticDirectorName ?? 'Not recorded'}</p>
          </div>
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

      <Card title="Activity Timeline">
        <div className="space-y-2 text-sm">
          {activityTimeline.length ? activityTimeline.map((activity) => <div key={activity.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"><p className="text-slate-200">{activity.message}</p><p className="text-xs text-slate-400">{formatDate(activity.timestamp)} · {activity.user}</p></div>) : <p className="rounded-lg border border-dashed border-slate-700 p-3 text-slate-400">No order activity yet.</p>}
        </div>
      </Card>

      <Card>
        <button className="flex w-full items-center justify-between text-left" onClick={() => setShowNotes((value) => !value)}>
          <span className="text-sm font-semibold text-white">Operational Notes</span>
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-300">{showNotes ? 'Hide' : 'Show'}</span>
        </button>
        {showNotes ? <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm text-slate-300">{activeOrder.vendorNotes || 'No long-form operational notes recorded.'}</div> : null}
      </Card>

      {showAdvanceDrawer && drawerTargetStage ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="h-full w-full max-w-lg overflow-y-auto border-l border-slate-800 bg-[#07101a] p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Order Advancement</p>
                <h2 className="text-xl font-bold text-white">{blockingMode ? 'Block / Hold Order' : `${getOrderStageLabel(stage)} → ${getOrderStageLabel(drawerTargetStage)}`}</h2>
                <p className="mt-1 text-sm text-slate-400">Collect only the fields needed for this transition.</p>
              </div>
              <button className="rounded-full border border-slate-700 px-2 py-1 text-slate-300" onClick={() => setShowAdvanceDrawer(false)}>✕</button>
            </div>
            {warning ? <p className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">{warning}</p> : null}
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">{field.label}{field.required ? ' *' : ''}</label>
                  <FieldInput field={field} value={form[field.key] ?? ''} onChange={(value) => setForm((prev) => ({ ...prev, [field.key]: value }))} />
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3">
              <Button className="w-full py-3" onClick={submitAdvance}>{blockingMode ? 'Save Blocker' : `Save & Advance to ${getOrderStageLabel(drawerTargetStage)}`}</Button>
              <button className="w-full rounded-md border border-slate-800 bg-slate-900/30 py-2.5 text-sm font-bold text-slate-400 transition hover:bg-slate-800" onClick={() => setShowAdvanceDrawer(false)}>Cancel</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
