import { createOpportunity, updateOpportunityStage, getOpportunitiesByOrganization } from '../opportunities.service';
import { createOrganization } from '../../organizations/organizations.service';
import { pool } from '@packages/database';
import { OpportunityStage, OpportunityChannelType } from '../opportunities.interface';
import { STAGES } from '@packages/auth';

describe('Opportunities Workflow - Integration Test (TUF-004)', () => {
  let orgId: number;
  let opportunityId: number;

  beforeEach(async () => {
    // Clean tables before each test
    await pool.query('TRUNCATE TABLE "organizations", "opportunities", "opportunity_stage_history" RESTART IDENTITY CASCADE');

    // Create a dummy organization
    const org = await createOrganization({ name: 'Test Org for Workflow', assigned_rep_id: 1, assigned_director_id: 2, territory_id: 3, created_by: 4, updated_by: 4 });
    orgId = org.id;

    // Create an initial opportunity using canonical stage
    const newOppData = {
      name: 'Workflow Test Opp',
      organization_id: orgId,
      status: 'open',
      value: 1000.00,
      created_by: 1,
      updated_by: 1,
      stage: STAGES.LEAD,
      last_activity_date: new Date(),
      estimated_revenue: 5000.00,
      assigned_rep_id: 1,
      assigned_director_id: 2,
      deal_type: 'TRAVEL_GEAR',
      channel_type: OpportunityChannelType.TRAVEL_GEAR,
      sport: 'BASEBALL',
      season: 'SPRING',
      year: 2027,
    };
    const createdOpp = await createOpportunity(newOppData);
    opportunityId = createdOpp.id;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Basic Workflow with Canonical Stages', () => {
    it('should create an opportunity at the lead stage', async () => {
      const opps = await getOpportunitiesByOrganization(String(orgId));
      const createdOpp = opps.find(o => o.name === 'Workflow Test Opp');
      expect(createdOpp).toBeDefined();
      if (createdOpp) {
        expect(createdOpp.stage).toBe(STAGES.LEAD);
        expect(Number(createdOpp.estimated_revenue)).toBe(5000.00);
      }
    });

    it('should allow valid transition from lead to contacted', async () => {
      const updatedOpp = await updateOpportunityStage(opportunityId, STAGES.CONTACTED, 1, 'Contacted customer');
      expect(updatedOpp.stage).toBe(STAGES.CONTACTED);

      const historyResult = await pool.query('SELECT * FROM opportunity_stage_history WHERE opportunity_id = $1', [opportunityId]);
      expect(historyResult.rows.length).toBe(1);
      expect(historyResult.rows[0].from_stage).toBe(STAGES.LEAD);
      expect(historyResult.rows[0].to_stage).toBe(STAGES.CONTACTED);
    });

    it('should reject skipping stages (lead → proposal_sent)', async () => {
      await expect(updateOpportunityStage(opportunityId, STAGES.PROPOSAL_SENT, 1))
        .rejects.toThrow('Invalid stage transition');
    });

    it('should reject backward transition (contacted → lead)', async () => {
      // First advance to contacted
      await updateOpportunityStage(opportunityId, STAGES.CONTACTED, 1);
      // Then try to go backward
      await expect(updateOpportunityStage(opportunityId, STAGES.LEAD, 1))
        .rejects.toThrow('Invalid stage transition');
    });

    it('should allow transition to closed_lost from any sales stage', async () => {
      await updateOpportunityStage(opportunityId, STAGES.CLOSED_LOST, 1, 'Lost deal', { loss_reason: 'Budget cut' });
      const opps = await getOpportunitiesByOrganization(String(orgId));
      const opp = opps.find(o => o.id === opportunityId);
      expect(opp).toBeDefined();
      expect(opp!.stage).toBe(STAGES.CLOSED_LOST);
      expect(opp!.loss_reason).toBe('Budget cut');
      expect(opp!.closed_at).toBeDefined();
    });

    it('should reject closed_lost without loss_reason', async () => {
      await expect(updateOpportunityStage(opportunityId, STAGES.CLOSED_LOST, 1))
        .rejects.toThrow('loss_reason is required to close an opportunity as lost');
    });
  });

  describe('Full Sales Pipeline (Lead → Closed Won)', () => {
    it('should progress through all sales stages to closed_won', async () => {
      // lead → contacted
      let opp = await updateOpportunityStage(opportunityId, STAGES.CONTACTED, 1);
      expect(opp.stage).toBe(STAGES.CONTACTED);

      // contacted → proposal_sent
      opp = await updateOpportunityStage(opportunityId, STAGES.PROPOSAL_SENT, 1);
      expect(opp.stage).toBe(STAGES.PROPOSAL_SENT);

      // proposal_sent → negotiation
      opp = await updateOpportunityStage(opportunityId, STAGES.NEGOTIATION, 1);
      expect(opp.stage).toBe(STAGES.NEGOTIATION);

      // negotiation → order_assembly
      opp = await updateOpportunityStage(opportunityId, STAGES.ORDER_ASSEMBLY, 1);
      expect(opp.stage).toBe(STAGES.ORDER_ASSEMBLY);

      // order_assembly → director_qa
      opp = await updateOpportunityStage(opportunityId, STAGES.DIRECTOR_QA, 1);
      expect(opp.stage).toBe(STAGES.DIRECTOR_QA);

      // director_qa → closed_won (with financials)
      opp = await updateOpportunityStage(opportunityId, STAGES.CLOSED_WON, 1, 'Won!', {
        actual_revenue: 5000,
        actual_cost: 3000,
      });
      expect(opp.stage).toBe(STAGES.CLOSED_WON);
      expect(opp.gross_profit).toBe('2000.00');
      expect(opp.closed_at).toBeDefined();

      // Verify stage history
      const history = await pool.query(
        'SELECT from_stage, to_stage FROM opportunity_stage_history WHERE opportunity_id = $1 ORDER BY changed_at',
        [opportunityId]
      );
      expect(history.rows.length).toBe(6); // 6 transitions
    });
  });

  describe('Closed Won Financial Validation', () => {
    beforeEach(async () => {
      // Advance to director_qa
      await updateOpportunityStage(opportunityId, STAGES.CONTACTED, 1);
      await updateOpportunityStage(opportunityId, STAGES.PROPOSAL_SENT, 1);
      await updateOpportunityStage(opportunityId, STAGES.NEGOTIATION, 1);
      await updateOpportunityStage(opportunityId, STAGES.ORDER_ASSEMBLY, 1);
      await updateOpportunityStage(opportunityId, STAGES.DIRECTOR_QA, 1);
    });

    it('should reject closed_won without actual_revenue', async () => {
      await expect(updateOpportunityStage(opportunityId, STAGES.CLOSED_WON, 1, 'Won', {
        actual_cost: 3000,
      })).rejects.toThrow('actual_revenue and actual_cost are required');
    });

    it('should reject closed_won without actual_cost', async () => {
      await expect(updateOpportunityStage(opportunityId, STAGES.CLOSED_WON, 1, 'Won', {
        actual_revenue: 5000,
      })).rejects.toThrow('actual_revenue and actual_cost are required');
    });

    it('should allow closed_won with complete financial data', async () => {
      const opp = await updateOpportunityStage(opportunityId, STAGES.CLOSED_WON, 1, 'Won!', {
        actual_revenue: 8000,
        actual_cost: 5000,
      });
      expect(opp.stage).toBe(STAGES.CLOSED_WON);
      expect(opp.gross_profit).toBe('3000.00');
      expect(opp.actual_revenue).toBe('8000.00');
      expect(opp.actual_cost).toBe('5000.00');
    });
  });

  describe('Fulfillment Pipeline (Closed Won → Delivered)', () => {
    beforeEach(async () => {
      // Advance through sales to closed_won
      await updateOpportunityStage(opportunityId, STAGES.CONTACTED, 1);
      await updateOpportunityStage(opportunityId, STAGES.PROPOSAL_SENT, 1);
      await updateOpportunityStage(opportunityId, STAGES.NEGOTIATION, 1);
      await updateOpportunityStage(opportunityId, STAGES.ORDER_ASSEMBLY, 1);
      await updateOpportunityStage(opportunityId, STAGES.DIRECTOR_QA, 1);
      await updateOpportunityStage(opportunityId, STAGES.CLOSED_WON, 1, 'Won!', {
        actual_revenue: 5000,
        actual_cost: 3000,
      });
    });

    it('should progress through fulfillment stages', async () => {
      let opp = await updateOpportunityStage(opportunityId, STAGES.READY_FOR_OPS, 1);
      expect(opp.stage).toBe(STAGES.READY_FOR_OPS);

      opp = await updateOpportunityStage(opportunityId, STAGES.IN_PRODUCTION, 1);
      expect(opp.stage).toBe(STAGES.IN_PRODUCTION);

      opp = await updateOpportunityStage(opportunityId, STAGES.QUALITY_CONTROL, 1);
      expect(opp.stage).toBe(STAGES.QUALITY_CONTROL);

      opp = await updateOpportunityStage(opportunityId, STAGES.SHIPPED, 1);
      expect(opp.stage).toBe(STAGES.SHIPPED);

      opp = await updateOpportunityStage(opportunityId, STAGES.DELIVERED, 1);
      expect(opp.stage).toBe(STAGES.DELIVERED);
    });

    it('should reject advancing past delivered (terminal)', async () => {
      await updateOpportunityStage(opportunityId, STAGES.READY_FOR_OPS, 1);
      await updateOpportunityStage(opportunityId, STAGES.IN_PRODUCTION, 1);
      await updateOpportunityStage(opportunityId, STAGES.QUALITY_CONTROL, 1);
      await updateOpportunityStage(opportunityId, STAGES.SHIPPED, 1);
      await updateOpportunityStage(opportunityId, STAGES.DELIVERED, 1);

      await expect(updateOpportunityStage(opportunityId, STAGES.SHIPPED, 1))
        .rejects.toThrow('Invalid stage transition');
    });
  });

  describe('Legacy Stage Backward Compatibility', () => {
    it('should accept legacy LEAD_ASSIGNED and map to lead', async () => {
      const opp = await createOpportunity({
        name: 'Legacy Opp',
        organization_id: orgId,
        status: 'open',
        value: 500,
        created_by: 1,
        updated_by: 1,
        stage: OpportunityStage.LEAD_ASSIGNED as any,
        deal_type: 'UNIFORM',
        sport: 'SOCCER',
        season: 'SPRING',
        year: 2027,
      });
      expect(opp.stage).toBe(STAGES.LEAD);
    });

    it('should allow legacy CLOSED_WON string transition', async () => {
      // Advance through pipeline
      await updateOpportunityStage(opportunityId, STAGES.CONTACTED, 1);
      await updateOpportunityStage(opportunityId, STAGES.PROPOSAL_SENT, 1);
      await updateOpportunityStage(opportunityId, STAGES.NEGOTIATION, 1);
      await updateOpportunityStage(opportunityId, STAGES.ORDER_ASSEMBLY, 1);
      await updateOpportunityStage(opportunityId, STAGES.DIRECTOR_QA, 1);

      // Use legacy uppercase CLOSED_WON
      const opp = await updateOpportunityStage(opportunityId, 'CLOSED_WON', 1, 'Won!', {
        actual_revenue: 6000,
        actual_cost: 4000,
      });
      expect(opp.stage).toBe(STAGES.CLOSED_WON);
    });
  });
});
