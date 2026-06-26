import { STAGES, isValidTransition, isSalesStage, isFulfillmentStage, SALES_STAGES, FULFILLMENT_STAGES, VALID_TRANSITIONS } from '../stages';

describe('Stage definitions — TUF-004', () => {
  it('defines exactly 13 stages (12 pipeline + closed_lost)', () => {
    // 12 canonical pipeline stages + closed_lost terminal
    expect(Object.keys(STAGES)).toHaveLength(13);
  });

  it('exposes 6 sales stages (TAE domain)', () => {
    expect(SALES_STAGES).toHaveLength(6);
    expect(SALES_STAGES).toEqual([
      STAGES.LEAD,
      STAGES.CONTACTED,
      STAGES.PROPOSAL_SENT,
      STAGES.NEGOTIATION,
      STAGES.ORDER_ASSEMBLY,
      STAGES.DIRECTOR_QA,
    ]);
  });

  it('exposes 5 fulfillment stages (Operations domain)', () => {
    expect(FULFILLMENT_STAGES).toHaveLength(5);
    expect(FULFILLMENT_STAGES).toEqual([
      STAGES.READY_FOR_OPS,
      STAGES.IN_PRODUCTION,
      STAGES.QUALITY_CONTROL,
      STAGES.SHIPPED,
      STAGES.DELIVERED,
    ]);
  });
});

describe('isValidTransition — TUF-004', () => {
  it('lead → contacted is valid', () => {
    expect(isValidTransition(STAGES.LEAD, STAGES.CONTACTED)).toBe(true);
  });

  it('lead → closed_lost is valid', () => {
    expect(isValidTransition(STAGES.LEAD, STAGES.CLOSED_LOST)).toBe(true);
  });

  it('lead → closed_won is invalid (skip too many stages)', () => {
    expect(isValidTransition(STAGES.LEAD, STAGES.CLOSED_WON)).toBe(false);
  });

  it('lead → proposal_sent is invalid (skip stage)', () => {
    expect(isValidTransition(STAGES.LEAD, STAGES.PROPOSAL_SENT)).toBe(false);
  });

  it('contacted → negotiation is invalid (skip proposal_sent)', () => {
    expect(isValidTransition(STAGES.CONTACTED, STAGES.NEGOTIATION)).toBe(false);
  });

  it('proposal_sent → negotiation is valid', () => {
    expect(isValidTransition(STAGES.PROPOSAL_SENT, STAGES.NEGOTIATION)).toBe(true);
  });

  it('negotiation → order_assembly is valid', () => {
    expect(isValidTransition(STAGES.NEGOTIATION, STAGES.ORDER_ASSEMBLY)).toBe(true);
  });

  it('order_assembly → director_qa is valid', () => {
    expect(isValidTransition(STAGES.ORDER_ASSEMBLY, STAGES.DIRECTOR_QA)).toBe(true);
  });

  it('director_qa → closed_won is valid', () => {
    expect(isValidTransition(STAGES.DIRECTOR_QA, STAGES.CLOSED_WON)).toBe(true);
  });

  it('director_qa → closed_lost is valid', () => {
    expect(isValidTransition(STAGES.DIRECTOR_QA, STAGES.CLOSED_LOST)).toBe(true);
  });

  it('closed_won → ready_for_operations is valid', () => {
    expect(isValidTransition(STAGES.CLOSED_WON, STAGES.READY_FOR_OPS)).toBe(true);
  });

  it('closed_won → lead is invalid (no backward transitions)', () => {
    expect(isValidTransition(STAGES.CLOSED_WON, STAGES.LEAD)).toBe(false);
  });

  it('closed_won → director_qa is invalid (no backward)', () => {
    expect(isValidTransition(STAGES.CLOSED_WON, STAGES.DIRECTOR_QA)).toBe(false);
  });

  it('closed_won → in_production is invalid (skip ready_for_operations)', () => {
    expect(isValidTransition(STAGES.CLOSED_WON, STAGES.IN_PRODUCTION)).toBe(false);
  });

  it('delivered → anything is invalid (terminal)', () => {
    expect(isValidTransition(STAGES.DELIVERED, STAGES.SHIPPED)).toBe(false);
    expect(isValidTransition(STAGES.DELIVERED, STAGES.LEAD)).toBe(false);
  });

  it('closed_lost → anything is invalid (terminal)', () => {
    expect(isValidTransition(STAGES.CLOSED_LOST, STAGES.LEAD)).toBe(false);
    expect(isValidTransition(STAGES.CLOSED_LOST, STAGES.CLOSED_WON)).toBe(false);
  });

  it('ready_for_operations → in_production is valid', () => {
    expect(isValidTransition(STAGES.READY_FOR_OPS, STAGES.IN_PRODUCTION)).toBe(true);
  });

  it('in_production → quality_control is valid', () => {
    expect(isValidTransition(STAGES.IN_PRODUCTION, STAGES.QUALITY_CONTROL)).toBe(true);
  });

  it('quality_control → shipped is valid', () => {
    expect(isValidTransition(STAGES.QUALITY_CONTROL, STAGES.SHIPPED)).toBe(true);
  });

  it('shipped → delivered is valid', () => {
    expect(isValidTransition(STAGES.SHIPPED, STAGES.DELIVERED)).toBe(true);
  });

  // Verify all defined stages have valid transitions defined
  it('all stages have transition definitions', () => {
    const allStages = Object.values(STAGES);
    for (const stage of allStages) {
      expect(VALID_TRANSITIONS[stage]).toBeDefined();
    }
  });

  // No backward transitions in linear pipeline
  it('enforces forward-only linear transitions for pipeline stages', () => {
    const pipelineOrder = [
      STAGES.LEAD, STAGES.CONTACTED, STAGES.PROPOSAL_SENT,
      STAGES.NEGOTIATION, STAGES.ORDER_ASSEMBLY, STAGES.DIRECTOR_QA,
      STAGES.CLOSED_WON, STAGES.READY_FOR_OPS, STAGES.IN_PRODUCTION,
      STAGES.QUALITY_CONTROL, STAGES.SHIPPED, STAGES.DELIVERED,
    ];

    for (let i = 0; i < pipelineOrder.length; i++) {
      for (let j = 0; j < i; j++) {
        // Forward transitions only — no backward
        const backward = isValidTransition(pipelineOrder[i], pipelineOrder[j]);
        // CLOSED_LOST reachable from any sales stage, but that's about closed_lost, not backward in pipeline
        expect(backward).toBe(false);
      }
    }
  });
});

describe('isSalesStage / isFulfillmentStage — TUF-004', () => {
  it('correctly identifies sales stages', () => {
    expect(isSalesStage(STAGES.LEAD)).toBe(true);
    expect(isSalesStage(STAGES.CONTACTED)).toBe(true);
    expect(isSalesStage(STAGES.PROPOSAL_SENT)).toBe(true);
    expect(isSalesStage(STAGES.NEGOTIATION)).toBe(true);
    expect(isSalesStage(STAGES.ORDER_ASSEMBLY)).toBe(true);
    expect(isSalesStage(STAGES.DIRECTOR_QA)).toBe(true);
    expect(isSalesStage(STAGES.CLOSED_WON)).toBe(false);
    expect(isSalesStage(STAGES.CLOSED_LOST)).toBe(false);
    expect(isSalesStage(STAGES.READY_FOR_OPS)).toBe(false);
    expect(isSalesStage(STAGES.DELIVERED)).toBe(false);
  });

  it('correctly identifies fulfillment stages', () => {
    expect(isFulfillmentStage(STAGES.LEAD)).toBe(false);
    expect(isFulfillmentStage(STAGES.DIRECTOR_QA)).toBe(false);
    expect(isFulfillmentStage(STAGES.CLOSED_WON)).toBe(false);
    expect(isFulfillmentStage(STAGES.READY_FOR_OPS)).toBe(true);
    expect(isFulfillmentStage(STAGES.IN_PRODUCTION)).toBe(true);
    expect(isFulfillmentStage(STAGES.QUALITY_CONTROL)).toBe(true);
    expect(isFulfillmentStage(STAGES.SHIPPED)).toBe(true);
    expect(isFulfillmentStage(STAGES.DELIVERED)).toBe(true);
    expect(isFulfillmentStage(STAGES.CLOSED_LOST)).toBe(false);
  });
});
