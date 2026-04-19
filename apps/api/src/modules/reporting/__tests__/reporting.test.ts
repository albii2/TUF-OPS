import { getOwnerDashboardMetrics, getDirectorDashboardMetrics, getRepDashboardMetrics } from '../reporting.service';
import { createOrganization } from '../../organizations/organizations.service';
import { createOpportunity, updateOpportunityStage } from '../../opportunities/opportunities.service';
import { pool } from '@packages/database';
import { OpportunityStage } from '../../opportunities/opportunities.interface';

describe('Reporting Service - Integration Test', () => {
  beforeAll(async () => {
    await pool.query('TRUNCATE TABLE "organizations", "opportunities", "commissions" RESTART IDENTITY CASCADE');

    // --- Create Users/Orgs ---
    const org1 = await createOrganization({ name: 'Org One', created_by: 1, updated_by: 1 });
    const org2 = await createOrganization({ name: 'Org Two', created_by: 1, updated_by: 1 });

    // --- Create Opportunities ---
    // Opp 1: Rep 10, Director 1, Open
    await createOpportunity({ organization_id: org1.id, name: 'Opp 1', value: 1000.00, assigned_rep_id: 10, assigned_director_id: 1, stage: OpportunityStage.LEAD_ASSIGNED, status: 'open', created_by: 1, updated_by: 1, deal_type: 'UNIFORM' });

    // Opp 2: Rep 10, Director 1, Won
    const opp2 = await createOpportunity({ organization_id: org1.id, name: 'Opp 2', value: 2500, assigned_rep_id: 10, assigned_director_id: 1, stage: OpportunityStage.INVOICE_SENT, status: 'open', created_by: 1, updated_by: 1, deal_type: 'UNIFORM' });
    await updateOpportunityStage(opp2.id, OpportunityStage.PAYMENT_RECEIVED, 1);
      await updateOpportunityStage(opp2.id, OpportunityStage.CLOSED_WON, 1, 'Won', { actual_revenue: 10000, actual_cost: 4000 });

    // Opp 3: Rep 20, Director 1, Lost
    const opp3 = await createOpportunity({ organization_id: org1.id, name: 'Opp 3', value: 5000, assigned_rep_id: 20, assigned_director_id: 1, stage: OpportunityStage.INVOICE_SENT, status: 'open', created_by: 1, updated_by: 1, deal_type: 'UNIFORM' });
    await updateOpportunityStage(opp3.id, OpportunityStage.CLOSED_LOST, 1, 'Lost', { loss_reason: 'Price' });

    // Opp 4: Rep 30, Director 2, Won
    const opp4 = await createOpportunity({ organization_id: org2.id, name: 'Opp 4', value: 10000, assigned_rep_id: 30, assigned_director_id: 2, stage: OpportunityStage.INVOICE_SENT, status: 'open', created_by: 1, updated_by: 1, deal_type: 'UNIFORM' });
    await updateOpportunityStage(opp4.id, OpportunityStage.PAYMENT_RECEIVED, 1);
      await updateOpportunityStage(opp4.id, OpportunityStage.CLOSED_WON, 1, 'Won', { actual_revenue: 20000, actual_cost: 15000 });

    // Opp 5: Rep 30, Director 2, Open
    await createOpportunity({ organization_id: org2.id, name: 'Opp 5', value: 20000, assigned_rep_id: 30, assigned_director_id: 2, stage: OpportunityStage.MOCKUP_APPROVED, status: 'open', created_by: 1, updated_by: 1, deal_type: 'UNIFORM' });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should return correct metrics for Owner (all records)', async () => {
    const metrics = await getOwnerDashboardMetrics();
    expect(metrics.total_opportunities_count).toBe(5);
    expect(metrics.closed_won_count).toBe(2);
    expect(metrics.closed_lost_count).toBe(1);
    expect(metrics.total_actual_revenue).toBe(30000);
    expect(metrics.total_gross_profit).toBe(11000); // 6000 + 5000
    expect(metrics.total_rep_commission).toBe(1100); // 600 + 500
    expect(metrics.total_director_override).toBe(550); // 300 + 250
    expect(metrics.opportunities_by_stage[OpportunityStage.LEAD_ASSIGNED]).toBe(1);
    expect(metrics.opportunities_by_stage[OpportunityStage.CLOSED_WON]).toBe(2);
    expect(metrics.opportunities_by_stage[OpportunityStage.CLOSED_LOST]).toBe(1);
    expect(metrics.opportunities_by_stage[OpportunityStage.MOCKUP_APPROVED]).toBe(1);
    expect(metrics.opportunities_by_stage[OpportunityStage.CONTACT_INITIATED]).toBe(0);
  });

  it('should return correct metrics for Director 1', async () => {
    const metrics = await getDirectorDashboardMetrics(1);
    expect(metrics.total_opportunities_count).toBe(3);
    expect(metrics.closed_won_count).toBe(1);
    expect(metrics.closed_lost_count).toBe(1);
    expect(metrics.total_actual_revenue).toBe(10000);
    expect(metrics.total_gross_profit).toBe(6000);
    expect(metrics.total_rep_commission).toBe(600);
    expect(metrics.total_director_override).toBe(300);
  });

  it('should return correct metrics for Rep 30', async () => {
    const metrics = await getRepDashboardMetrics(30);
    expect(metrics.total_opportunities_count).toBe(2);
    expect(metrics.closed_won_count).toBe(1);
    expect(metrics.closed_lost_count).toBe(0);
    expect(metrics.total_actual_revenue).toBe(20000);
    expect(metrics.total_gross_profit).toBe(5000);
    expect(metrics.total_rep_commission).toBe(500);
    expect(metrics.total_director_override).toBe(250);
    expect(metrics.opportunities_by_stage[OpportunityStage.MOCKUP_APPROVED]).toBe(1);
    expect(metrics.opportunities_by_stage[OpportunityStage.CLOSED_WON]).toBe(1);
  });
});
