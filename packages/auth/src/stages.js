"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FULFILLMENT_STAGES = exports.SALES_STAGES = exports.VALID_TRANSITIONS = exports.STAGES = void 0;
exports.isValidTransition = isValidTransition;
exports.isSalesStage = isSalesStage;
exports.isFulfillmentStage = isFulfillmentStage;
exports.normalizeStage = normalizeStage;
exports.STAGES = {
    LEAD: 'lead',
    CONTACTED: 'contacted',
    PROPOSAL_SENT: 'proposal_sent',
    NEGOTIATION: 'negotiation',
    ORDER_ASSEMBLY: 'order_assembly',
    DIRECTOR_QA: 'director_qa',
    CLOSED_WON: 'closed_won',
    READY_FOR_OPS: 'ready_for_operations',
    IN_PRODUCTION: 'in_production',
    QUALITY_CONTROL: 'quality_control',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    // Additional terminal stage — not part of the 12-stage pipeline but valid
    CLOSED_LOST: 'closed_lost',
};
// Valid transitions per SOS 6.3. CLOSED_LOST is reachable from any sales stage.
exports.VALID_TRANSITIONS = {
    [exports.STAGES.LEAD]: [exports.STAGES.CONTACTED, exports.STAGES.CLOSED_LOST],
    [exports.STAGES.CONTACTED]: [exports.STAGES.PROPOSAL_SENT, exports.STAGES.CLOSED_LOST],
    [exports.STAGES.PROPOSAL_SENT]: [exports.STAGES.NEGOTIATION, exports.STAGES.CLOSED_LOST],
    [exports.STAGES.NEGOTIATION]: [exports.STAGES.ORDER_ASSEMBLY, exports.STAGES.CLOSED_LOST],
    [exports.STAGES.ORDER_ASSEMBLY]: [exports.STAGES.DIRECTOR_QA, exports.STAGES.CLOSED_LOST],
    [exports.STAGES.DIRECTOR_QA]: [exports.STAGES.CLOSED_WON, exports.STAGES.CLOSED_LOST],
    [exports.STAGES.CLOSED_WON]: [exports.STAGES.READY_FOR_OPS],
    [exports.STAGES.READY_FOR_OPS]: [exports.STAGES.IN_PRODUCTION],
    [exports.STAGES.IN_PRODUCTION]: [exports.STAGES.QUALITY_CONTROL],
    [exports.STAGES.QUALITY_CONTROL]: [exports.STAGES.SHIPPED],
    [exports.STAGES.SHIPPED]: [exports.STAGES.DELIVERED],
    [exports.STAGES.DELIVERED]: [], // terminal
    [exports.STAGES.CLOSED_LOST]: [], // terminal
};
// Sales stages (TAE domain — pre-Closed Won)
exports.SALES_STAGES = [
    exports.STAGES.LEAD, exports.STAGES.CONTACTED, exports.STAGES.PROPOSAL_SENT,
    exports.STAGES.NEGOTIATION, exports.STAGES.ORDER_ASSEMBLY, exports.STAGES.DIRECTOR_QA,
];
// Fulfillment stages (Operations domain — post-Closed Won)
exports.FULFILLMENT_STAGES = [
    exports.STAGES.READY_FOR_OPS, exports.STAGES.IN_PRODUCTION,
    exports.STAGES.QUALITY_CONTROL, exports.STAGES.SHIPPED, exports.STAGES.DELIVERED,
];
function isValidTransition(from, to) {
    return exports.VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
function isSalesStage(stage) {
    return exports.SALES_STAGES.includes(stage);
}
function isFulfillmentStage(stage) {
    return exports.FULFILLMENT_STAGES.includes(stage);
}
/** Normalize any stage string to lowercase for comparison (handles legacy uppercase values). */
function normalizeStage(stage) {
    return stage?.toLowerCase() ?? '';
}
//# sourceMappingURL=stages.js.map