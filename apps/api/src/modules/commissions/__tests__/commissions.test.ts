import { createOrganization } from '../../organizations/organizations.service';
import { createOpportunity, updateOpportunityStage } from '../../opportunities/opportunities.service';
import { createCommission } from '../commissions.service';
import { pool } from '@packages/database';
import { OpportunityStage } from '../../opportunities/opportunities.interface';
import { CommissionStatus } from '../commissions.interface';

describe('Commissions Service - Integration Test', () => {
  let orgId: number;
  let opportunityId: number;

  beforeEach(async () => {
    // Clean tables before each test
    await pool.query('TRUNCATE TABLE "organizations", "opportunities", "commissions" RESTART IDENTITY CASCADE');

    // Create a dummy organization
    const org = await createOrganization({ name: 'Test Org for Commissions', assigned_rep_id: 1, assigned_director_id: 2, territory_id: 3, created_by: 4, updated_by: 4 });
    orgId = org.id;

    // Create an initial opportunity
    const newOppData = {
      name: 'Commission Test Opp',
      organization_id: orgId,
      status: 'open',
      value: 1000.00,
      created_by: 1,
      updated_by: 1,
      stage: OpportunityStage.LEAD_ASSIGNED,
      last_activity_date: new Date(),
      estimated_revenue: 5000.00,
      assigned_rep_id: 1,
      assigned_director_id: 2,
      deal_type: 'UNIFORM',
    };
    const createdOpp = await createOpportunity(newOppData);
    opportunityId = createdOpp.id;
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should create a commission record on CLOSED_WON', async () => {
    await updateOpportunityStage(opportunityId, OpportunityStage.CONTACT_INITIATED, 1);
    await updateOpportunityStage(opportunityId, OpportunityStage.MOCKUP_IN_PROGRESS, 1);
    await updateOpportunityStage(opportunityId, OpportunityStage.MOCKUP_APPROVED, 1);
    await updateOpportunityStage(opportunityId, OpportunityStage.INVOICE_SENT, 1);
    await updateOpportunityStage(opportunityId, OpportunityStage.PAYMENT_RECEIVED, 1);
    const updatedOpp = await updateOpportunityStage(opportunityId, OpportunityStage.CLOSED_WON, 1, 'Won deal', { actual_revenue: 5000, actual_cost: 3000 });

    const commissionResult = await pool.query('SELECT * FROM commissions WHERE opportunity_id = $1', [opportunityId]);
    expect(commissionResult.rows.length).toBe(1);

    const commission = commissionResult.rows[0];
    expect(commission.rep_commission).toBe('200.00'); // 10% of 2000
    expect(commission.director_override).toBe('100.00'); // 5% of 2000
    expect(commission.status).toBe(CommissionStatus.PENDING);
  });

  it('should not create a commission record for non-closed opportunities', async () => {
    await updateOpportunityStage(opportunityId, OpportunityStage.CONTACT_INITIATED, 1);

    const commissionResult = await pool.query('SELECT * FROM commissions WHERE opportunity_id = $1', [opportunityId]);
    expect(commissionResult.rows.length).toBe(0);
  });

  it('should not duplicate a commission record on duplicate CLOSED_WON transition', async () => {
    await updateOpportunityStage(opportunityId, OpportunityStage.CONTACT_INITIATED, 1);
    await updateOpportunityStage(opportunityId, OpportunityStage.MOCKUP_IN_PROGRESS, 1);
    await updateOpportunityStage(opportunityId, OpportunityStage.MOCKUP_APPROVED, 1);
    await updateOpportunityStage(opportunityId, OpportunityStage.INVOICE_SENT, 1);
    await updateOpportunityStage(opportunityId, OpportunityStage.PAYMENT_RECEIVED, 1);
    await updateOpportunityStage(opportunityId, OpportunityStage.CLOSED_WON, 1, 'Won deal', { actual_revenue: 5000, actual_cost: 3000 });

    // Attempt to close again, should fail because transition is invalid
    await expect(updateOpportunityStage(opportunityId, OpportunityStage.CLOSED_WON, 1, 'Won deal again', { actual_revenue: 6000, actual_cost: 3500 })).rejects.toThrow('Invalid stage transition from CLOSED_WON to CLOSED_WON');

    const commissionResult = await pool.query('SELECT * FROM commissions WHERE opportunity_id = $1', [opportunityId]);
    expect(commissionResult.rows.length).toBe(1);
  });
});
