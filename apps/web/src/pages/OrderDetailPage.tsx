import { Link, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Button, Card, EmptyState, Input } from '../components/primitives';
import { formatCurrency, formatDate } from '../utils/format';
import { useOrderById } from '../hooks/useOrders';
import { useOpportunityById } from '../hooks/useOpportunities';
import { useOrganizationById } from '../hooks/useOrganizations';
import { useActivities } from '../hooks/useReports';
import { updateOrder } from '../services/ordersService';
import type { Order } from '../data/mockSalesData';
import { notify } from '../services/feedbackService';
import {
  BLOCKER_FIELDS,
  ORDER_STAGE_FLOW,
  canAdvanceOrder,
  canSeeOrderValue,
  getAdvanceFields,
  getNextOrderStage,
  getOrderAdvanceWarning,
  getOrderDueDate,
  getOrderNextAction,
  getOrderOwner,
  getOrderRisk,
  getOrderStage,
  getOrderStageLabel,
  getOrderTitle,
  toProductionStatus,
  type AdvancementField,
  type OrderStage,
} from '../services/orderWorkflow';
import { getLaneLabel } from '../utils/naming';

function Chip({ label, value, tone = 'border-slate-700 bg-slate-900/60 text-slate-100' }: { label: string; value: string; tone?: string }) {
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}><span className="text-slate-400">{label}:</span> {value}</span>;
}

function FieldInput({ field, value, onChange }: { field: AdvancementField; value: string; onChange: (value: string) => void }) {
  if (field.type === 'select') {
    return (
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-white">
        <option value="">Select…</option>
        {(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    );
  }
  if (field.type === 'textarea') {
    return <textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-20 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white" />;
  }
  return <Input type={field.type ?? 'text'} value={value} onChange={(event) => onChange(event.target.value)} className="w-full" />;
}


const REQUIRED_YES_GATE_FIELDS = new Set([
  'paymentReceived',
  'artworkApproved',
  'productionSpecsComplete',
  'sizeQuantityComplete',
  'vendorConfirmation',
  'productionComplete',
  'customerNotified',
  'deliveryConfirmed',
  'customerSatisfied',
  'finalFollowUpScheduled',
  'blockerResolved',
]);

function getGateFailures(fields: AdvancementField[], form: Record<string, string>) {
  return fields.filter((field) => REQUIRED_YES_GATE_FIELDS.has(field.key) && (form[field.key] ?? '') !== 'Yes');
}

function buildPatchForStage(stage: OrderStage, form: Record<string, string>, existing: Order): Partial<Order> {
  const base: Partial<Order> = {
    orderStage: stage,
    productionStatus: toProductionStatus(stage),
    nextActionOwner: form.blockerOwner || existing.nextActionOwner || existing.assignedRep,
    dueDate: form.resolutionDueDate || form.expectedProductionCompletionDate || form.deliveryDate || existing.dueDate,
    vendorNotes: form.notes || form.resolutionNotes || form.issueNotes || existing.vendorNotes,
  };
  if (stage === 'PAYMENT_CONFIRMED') return { ...base, paymentStatus: `Confirmed ${form.paymentDate || ''}`.trim() };
  if (stage === 'ARTWORK_FINALIZED') return { ...base, artworkStatus: `Approved ${form.approvalDate || ''}`.trim() };
  if (stage === 'VENDOR_READY') return { ...base, vendor: form.vendorSelected || existing.vendor, vendorStatus: 'Vendor ready' };
  if (stage === 'IN_PRODUCTION') return { ...base, vendorStatus: `Submitted ${form.vendorSubmissionDate || ''}`.trim() };
  if (stage === 'QUALITY_CHECK') return { ...base, vendorStatus: 'Production complete / QC', shippingStatus: form.issueNotes || 'Ready for shipment' };
  if (stage === 'SHIPPED_DELIVERED') return { ...base, shippingStatus: form.trackingInfo || 'Shipped / delivery pending' };
  if (stage === 'COMPLETED') return { ...base, completedDate: new Date().toISOString().slice(0, 10), shippingStatus: 'Delivery confirmed' };
  if (stage === 'BLOCKED_ON_HOLD') return { ...base, resolutionDueDate: form.resolutionDueDate, nextAction: `Resolve blocker: ${form.blockerReason}`, vendorNotes: form.notes || form.blockerReason };
  return base;
}

export function OrderDetailPage() {
  const { id } = useParams();
  const order = useOrderById(id);
  const [localOrder, setLocalOrder] = useState<Order | undefined>();
  const [showAdvanceDrawer, setShowAdvanceDrawer] = useState(false);
  const [blockingMode, setBlockingMode] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [showNotes, setShowNotes] = useState(false);
  const [message, setMessage] = useState('');
  const activeOrder = localOrder ?? order;
  const linkedOpportunity = useOpportunityById(activeOrder?.opportunityId);
  const organization = useOrganizationById(activeOrder?.organizationId);
  const orderActivities = useActivities({ entityType: 'ORDER', entityId: id, limit: 20 });

  const activityTimeline = useMemo(() => [...orderActivities].sort((a, b) => b.timestamp.localeCompare(a.timestamp)), [orderActivities]);

  if (!activeOrder) return <EmptyState title="Order not found" description="Select a valid order from the execution queue." />;

  const stage = getOrderStage(activeOrder);
  const nextStage = getNextOrderStage(activeOrder);
  const drawerTargetStage = blockingMode ? 'BLOCKED_ON_HOLD' : nextStage;
  const fields = blockingMode ? BLOCKER_FIELDS : drawerTargetStage ? getAdvanceFields(stage) : [];
  const risk = getOrderRisk(activeOrder);
  const owner = getOrderOwner(activeOrder, linkedOpportunity);
  const dueDate = getOrderDueDate(activeOrder);
  const canAdvance = canAdvanceOrder(activeOrder, linkedOpportunity);
  const warning = getOrderAdvanceWarning(activeOrder, linkedOpportunity);
  const canShowValue = canSeeOrderValue();

  const openDrawer = (mode: 'advance' | 'block') => {
    if (!canAdvance) {
      notify(warning || 'You do not have permission to update this order.', 'error');
      return;
    }
    if (warning && !window.confirm(warning)) return;
    setBlockingMode(mode === 'block');
    setForm({});
    setShowAdvanceDrawer(true);
  };

  const submitAdvance = async () => {
    if (!drawerTargetStage) return;
    const missing = fields.filter((field) => field.required && !(form[field.key] ?? '').trim());
    if (missing.length) {
      notify(`Missing required fields: ${missing.map((field) => field.label).join(', ')}`, 'error');
      return;
    }
    const gateFailures = getGateFailures(fields, form);
    if (gateFailures.length) {
      notify(`Cannot advance until these are Yes: ${gateFailures.map((field) => field.label).join(', ')}`, 'error');
      return;
    }
    try {
      const updated = await updateOrder(activeOrder.id, {
        ...buildPatchForStage(drawerTargetStage, form, activeOrder),
        advancementNotes: form.notes || form.resolutionNotes || form.blockerReason,
      } as Partial<Order>);
      setLocalOrder(updated);
      setMessage(`${blockingMode ? 'Order placed on hold' : `Advanced to ${getOrderStageLabel(drawerTargetStage)}`}.`);
      notify(blockingMode ? 'Order blocked / on hold.' : 'Order advanced.', 'success');
      setShowAdvanceDrawer(false);
      setForm({});
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Please check the order and try again.';
      setMessage(detail);
      notify(`Order update failed: ${detail}`, 'error');
    }
  };

  return (
    <div className="space-y-3 min-w-0">
      <Card className="border-cyan-500/30 bg-cyan-500/5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xl font-bold text-white">{getOrderTitle(activeOrder, linkedOpportunity)}</p>
            <p className="text-sm text-slate-400">{activeOrder.organizationName}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip label="Stage" value={getOrderStageLabel(activeOrder)} tone="border-cyan-500/50 bg-cyan-500/10 text-cyan-100" />
              <Chip label="Risk" value={risk.label} tone={risk.tone} />
              <Chip label="Next owner" value={owner} />
              <Chip label="Due" value={formatDate(dueDate)} />
              <Chip label="Rep" value={activeOrder.assignedRep ?? linkedOpportunity?.assignedRep ?? 'Unassigned'} />
              {linkedOpportunity ? <Link className="rounded-full border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-xs font-semibold text-cyan-300" to={`/opportunities/${linkedOpportunity.id}`}>Opportunity: {linkedOpportunity.title}</Link> : <Chip label="Opportunity" value="Not linked" />}
            </div>
          </div>
          {canShowValue ? <p className="text-2xl font-bold text-cyan-200">{formatCurrency(activeOrder.value)}</p> : null}
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
        <Card title="Blockers">
          {activeOrder.missingInfo.length ? <ul className="space-y-2 text-sm text-rose-100">{activeOrder.missingInfo.map((item) => <li key={item} className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-2">{item}</li>)}</ul> : <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">No blockers recorded.</p>}
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
