import { daysSince } from './kpiUtils';
import { getViewer } from './roleScope';
export const ORDER_STAGE_FLOW = [
    'ORDER_CREATED',
    'PAYMENT_CONFIRMED',
    'ARTWORK_FINALIZED',
    'VENDOR_READY',
    'IN_PRODUCTION',
    'QUALITY_CHECK',
    'SHIPPED_DELIVERED',
    'COMPLETED',
];
export const ORDER_STAGE_LABELS = {
    ORDER_CREATED: 'Order Created',
    PAYMENT_CONFIRMED: 'Payment Confirmed',
    ARTWORK_FINALIZED: 'Artwork / Mockup Finalized',
    VENDOR_READY: 'Vendor Ready',
    IN_PRODUCTION: 'In Production',
    QUALITY_CHECK: 'Quality Check',
    SHIPPED_DELIVERED: 'Shipped / Delivered',
    COMPLETED: 'Completed',
    BLOCKED_ON_HOLD: 'Blocked / On Hold',
};
const STATUS_STAGE_MAP = {
    NEEDS_REVIEW: 'ORDER_CREATED',
    READY_FOR_VENDOR: 'VENDOR_READY',
    IN_PRODUCTION: 'IN_PRODUCTION',
    BLOCKED: 'BLOCKED_ON_HOLD',
    COMPLETED: 'COMPLETED',
};
const STAGE_STATUS_MAP = {
    ORDER_CREATED: 'NEEDS_REVIEW',
    PAYMENT_CONFIRMED: 'NEEDS_REVIEW',
    ARTWORK_FINALIZED: 'NEEDS_REVIEW',
    VENDOR_READY: 'READY_FOR_VENDOR',
    IN_PRODUCTION: 'IN_PRODUCTION',
    QUALITY_CHECK: 'IN_PRODUCTION',
    SHIPPED_DELIVERED: 'IN_PRODUCTION',
    COMPLETED: 'COMPLETED',
    BLOCKED_ON_HOLD: 'BLOCKED',
};
const TRANSITION_FIELDS = {
    ORDER_CREATED: [
        { key: 'paymentReceived', label: 'Payment received?', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'paymentAmount', label: 'Payment amount', type: 'number', required: true },
        { key: 'paymentDate', label: 'Payment date', type: 'date', required: true },
        { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    PAYMENT_CONFIRMED: [
        { key: 'artworkApproved', label: 'Artwork approved?', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'mockupLink', label: 'Mockup/design link', type: 'text' },
        { key: 'approvalDate', label: 'Approval date', type: 'date', required: true },
        { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    ARTWORK_FINALIZED: [
        { key: 'vendorSelected', label: 'Vendor selected', type: 'text', required: true },
        { key: 'productionSpecsComplete', label: 'Production specs complete?', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'sizeQuantityComplete', label: 'Size/quantity info complete?', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    VENDOR_READY: [
        { key: 'vendorSubmissionDate', label: 'Vendor submission date', type: 'date', required: true },
        { key: 'expectedProductionCompletionDate', label: 'Expected production completion date', type: 'date', required: true },
        { key: 'vendorConfirmation', label: 'Vendor confirmation?', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    IN_PRODUCTION: [
        { key: 'productionComplete', label: 'Production complete?', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'qcNeeded', label: 'QC needed?', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'issueNotes', label: 'Issue notes', type: 'textarea' },
    ],
    QUALITY_CHECK: [
        { key: 'trackingInfo', label: 'Shipping/tracking info', type: 'text', required: true },
        { key: 'deliveryDate', label: 'Delivery or estimated delivery date', type: 'date', required: true },
        { key: 'customerNotified', label: 'Customer notified?', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    SHIPPED_DELIVERED: [
        { key: 'deliveryConfirmed', label: 'Delivery confirmed?', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'customerSatisfied', label: 'Customer satisfied?', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'finalFollowUpScheduled', label: 'Final follow-up scheduled?', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    BLOCKED_ON_HOLD: [
        { key: 'blockerResolved', label: 'Blocker resolved?', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'resolutionNotes', label: 'Resolution notes', type: 'textarea', required: true },
    ],
};
export const BLOCKER_FIELDS = [
    { key: 'blockerReason', label: 'Blocker reason', type: 'textarea', required: true },
    { key: 'blockerOwner', label: 'Blocker owner', type: 'text', required: true },
    { key: 'resolutionDueDate', label: 'Resolution due date', type: 'date', required: true },
    { key: 'notes', label: 'Notes', type: 'textarea' },
];
function addDays(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
}
export function getOrderStage(order) {
    return order.orderStage ?? STATUS_STAGE_MAP[order.productionStatus] ?? 'ORDER_CREATED';
}
export function getOrderStageLabel(stageOrOrder) {
    const stage = typeof stageOrOrder === 'string' ? stageOrOrder : getOrderStage(stageOrOrder);
    return ORDER_STAGE_LABELS[stage];
}
export function toProductionStatus(stage) {
    return STAGE_STATUS_MAP[stage];
}
export function getPreviousActiveStage(order) {
    const stage = getOrderStage(order);
    if (stage !== 'BLOCKED_ON_HOLD')
        return stage;
    return order.previousActiveStage ?? 'VENDOR_READY';
}
export function getNextOrderStage(order) {
    const stage = getOrderStage(order);
    if (stage === 'BLOCKED_ON_HOLD')
        return getPreviousActiveStage(order);
    const index = ORDER_STAGE_FLOW.indexOf(stage);
    if (index < 0 || index >= ORDER_STAGE_FLOW.length - 1)
        return null;
    return ORDER_STAGE_FLOW[index + 1];
}
export function getAdvanceFields(stage) {
    return TRANSITION_FIELDS[stage] ?? [];
}
export function getOrderTitle(order, opportunity) {
    return order.title ?? opportunity?.title ?? `${getOrderStageLabel(order)} · ${getLaneLabel(order.lane)}`;
}
function getLaneLabel(lane) {
    return lane
        .split('_')
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ');
}
export function getOrderOwner(order, opportunity) {
    return order.nextActionOwner ?? order.assignedRep ?? opportunity?.assignedRep ?? 'Ops';
}
export function getOrderDueDate(order) {
    if (order.dueDate)
        return order.dueDate;
    const stage = getOrderStage(order);
    if (stage === 'COMPLETED')
        return order.completedDate ?? order.createdDate;
    if (stage === 'BLOCKED_ON_HOLD')
        return order.resolutionDueDate ?? addDays(1);
    const age = daysSince(order.createdDate);
    if (age >= 7)
        return addDays(-1);
    if (stage === 'ORDER_CREATED' || stage === 'PAYMENT_CONFIRMED' || stage === 'ARTWORK_FINALIZED')
        return addDays(1);
    if (stage === 'VENDOR_READY')
        return addDays(2);
    return addDays(5);
}
export function getOrderNextAction(order) {
    const stage = getOrderStage(order);
    if (stage === 'BLOCKED_ON_HOLD')
        return `Resolve blocker: ${order.missingInfo[0] ?? 'On hold'}`;
    if (order.nextAction)
        return order.nextAction;
    if (order.missingInfo.length)
        return `Clear ${order.missingInfo.length} blocker${order.missingInfo.length > 1 ? 's' : ''}`;
    const nextStage = getNextOrderStage(order);
    if (!nextStage)
        return 'No next action';
    const actionByStage = {
        ORDER_CREATED: 'Confirm payment',
        PAYMENT_CONFIRMED: 'Finalize artwork/mockup',
        ARTWORK_FINALIZED: 'Select vendor and complete specs',
        VENDOR_READY: 'Submit packet to vendor',
        IN_PRODUCTION: 'Confirm production completion',
        QUALITY_CHECK: 'Ship order / notify customer',
        SHIPPED_DELIVERED: 'Confirm delivery and close order',
        COMPLETED: 'No next action',
        BLOCKED_ON_HOLD: 'Resolve blocker',
    };
    return actionByStage[stage];
}
export function getOrderRisk(order) {
    const stage = getOrderStage(order);
    const dueDate = getOrderDueDate(order);
    const today = new Date().toISOString().slice(0, 10);
    const dueSoon = dueDate <= addDays(2);
    const overdue = dueDate < today;
    const missingRequiredHandoff = order.missingInfo.length > 0 || order.vendor === 'Unassigned';
    if (stage === 'COMPLETED')
        return { level: 'gray', label: 'Completed', reason: 'Order complete', rank: 0, tone: 'border-slate-500/50 bg-slate-500/10 text-slate-300' };
    if (stage === 'BLOCKED_ON_HOLD' || overdue || missingRequiredHandoff)
        return { level: 'red', label: stage === 'BLOCKED_ON_HOLD' ? 'Blocked' : overdue ? 'Overdue' : 'Missing handoff', reason: stage === 'BLOCKED_ON_HOLD' ? order.missingInfo[0] ?? 'On hold' : overdue ? `Due ${dueDate}` : 'Required handoff info missing', rank: stage === 'BLOCKED_ON_HOLD' ? 100 : overdue ? 90 : 80, tone: 'border-rose-500/60 bg-rose-500/10 text-rose-200' };
    if (dueSoon || stage === 'VENDOR_READY' || stage === 'IN_PRODUCTION')
        return { level: 'yellow', label: dueSoon ? 'Due soon' : stage === 'VENDOR_READY' ? 'Needs vendor' : 'In production', reason: dueSoon ? `Due ${dueDate}` : stage === 'VENDOR_READY' ? 'Waiting on vendor confirmation' : 'Track vendor milestone', rank: dueDate === today ? 70 : stage === 'IN_PRODUCTION' ? 40 : 60, tone: 'border-amber-500/60 bg-amber-500/10 text-amber-200' };
    return { level: 'green', label: 'On track', reason: 'No immediate blocker', rank: 20, tone: 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200' };
}
export function matchesOrderQueueFilter(order, filter) {
    const stage = getOrderStage(order);
    const risk = getOrderRisk(order);
    if (filter === 'ALL')
        return true;
    if (filter === 'ACTION_NEEDED')
        return stage !== 'COMPLETED' && (risk.level === 'red' || risk.level === 'yellow' || stage !== 'IN_PRODUCTION');
    if (filter === 'IN_PRODUCTION')
        return stage === 'IN_PRODUCTION' || stage === 'QUALITY_CHECK';
    if (filter === 'BLOCKED')
        return stage === 'BLOCKED_ON_HOLD' || risk.level === 'red';
    if (filter === 'COMPLETED')
        return stage === 'COMPLETED';
    return true;
}
export function sortOrdersForExecution(a, b) {
    const riskA = getOrderRisk(a);
    const riskB = getOrderRisk(b);
    const stageA = getOrderStage(a);
    const stageB = getOrderStage(b);
    const productionBoostA = stageA === 'IN_PRODUCTION' || stageA === 'QUALITY_CHECK' ? 5 : 0;
    const productionBoostB = stageB === 'IN_PRODUCTION' || stageB === 'QUALITY_CHECK' ? 5 : 0;
    return (riskB.rank + productionBoostB) - (riskA.rank + productionBoostA) || getOrderDueDate(a).localeCompare(getOrderDueDate(b));
}
export function canAdvanceOrder(order, opportunity) {
    const user = getViewer();
    if (!user)
        return false;
    if (user.role === 'ADMIN' || user.role === 'REGIONAL_DIRECTOR' || user.role === 'OPERATIONS')
        return true;
    if (user.role === 'REP')
        return (order.assignedRep ?? opportunity?.assignedRep) === user.name;
    if (user.role === 'DIRECTOR')
        return true;
    return false;
}
export function getOrderAdvanceWarning(order, opportunity) {
    const user = getViewer();
    if (!user)
        return 'Log in before updating this order.';
    if (user.role === 'DIRECTOR')
        return 'You are updating this order as a director. This action will be logged.';
    if (user.role === 'REP' && (order.assignedRep ?? opportunity?.assignedRep) !== user.name)
        return 'You can only advance orders assigned to you.';
    return '';
}
export function canSeeOrderValue() {
    const user = getViewer();
    return !user || user.role === 'ADMIN' || user.role === 'DIRECTOR' || user.role === 'REGIONAL_DIRECTOR' || user.role === 'REP' || user.role === 'OPERATIONS';
}
//# sourceMappingURL=orderWorkflow.js.map