exports.up = (pgm) => {
  pgm.sql(`
    -- TUF-004: Stage validation
    -- Add CHECK constraint to enforce valid stage values per SOS 6.3

    -- First, backfill existing non-canonical stage values to canonical equivalents
    UPDATE opportunities SET stage = 'lead'
      WHERE stage IN ('LEAD_ASSIGNED', 'LEAD_ENGAGED', 'NOT_STARTED');

    UPDATE opportunities SET stage = 'contacted'
      WHERE stage IN ('CONTACTED', 'CONTACT_INITIATED');

    UPDATE opportunities SET stage = 'proposal_sent'
      WHERE stage IN ('DISCOVERY', 'MOCKUP_REQUESTED', 'MOCKUP_STAGE', 'MOCKUP_IN_PROGRESS');

    UPDATE opportunities SET stage = 'negotiation'
      WHERE stage IN ('MOCKUP_DELIVERED', 'MOCKUP_APPROVED');

    UPDATE opportunities SET stage = 'order_assembly'
      WHERE stage IN ('INVOICE_SENT', 'SAMPLE_REQUESTED');

    UPDATE opportunities SET stage = 'director_qa'
      WHERE stage IN ('DECISION_PENDING', 'SAMPLE_IN_PRODUCTION', 'SAMPLE_APPROVED', 'PAYMENT_RECEIVED');

    UPDATE opportunities SET stage = 'closed_won'
      WHERE stage = 'CLOSED_WON';

    UPDATE opportunities SET stage = 'closed_lost'
      WHERE stage = 'CLOSED_LOST';

    -- Add the CHECK constraint for canonical stages plus legacy uppercase values
    ALTER TABLE opportunities
      ADD CONSTRAINT opportunities_stage_check
      CHECK (stage IN (
        'lead', 'contacted', 'proposal_sent', 'negotiation',
        'order_assembly', 'director_qa', 'closed_won',
        'ready_for_operations', 'in_production',
        'quality_control', 'shipped', 'delivered',
        'closed_lost',
        -- Legacy uppercase values for backward compatibility
        'LEAD', 'CONTACTED', 'PROPOSAL_SENT', 'NEGOTIATION',
        'ORDER_ASSEMBLY', 'DIRECTOR_QA', 'CLOSED_WON',
        'CLOSED_LOST', 'READY_FOR_OPS', 'IN_PRODUCTION',
        'QUALITY_CONTROL', 'SHIPPED', 'DELIVERED',
        'NOT_STARTED', 'LEAD_ASSIGNED', 'INVOICE_SENT',
        'DECISION_PENDING'
      ));
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    -- Remove the CHECK constraint (down migration)
    ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_stage_check;
  `);
};
