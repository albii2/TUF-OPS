import { pool } from '@packages/database';
import { createOrganization } from './organizations/organizations.service';
import { createOpportunity, getOpportunityById, updateOpportunityStage } from './opportunities/opportunities.service';
import { updateOpportunityStageHandler } from './opportunities/opportunities.controller';
import { createOrderFromOpportunity } from './orders/orders.service';
import { createActivity, markActivityComplete } from './activities/activities.service';
import { ActivityType } from './activities/activities.interface';
import { createCommission } from './commissions/commissions.service';
import { OpportunityChannelType, OpportunityStage } from './opportunities/opportunities.interface';

describe('v0.9.0 data integrity hardening', () => {
  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE "activity_audit_history", "activities", "contacts", "orders", "commissions", "opportunity_stage_history", "opportunities", "organizations" RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    await pool.end();
  });

  it('rejects duplicate organizations by normalized name and state at service and database layers', async () => {
    await createOrganization({ name: ' Central High ', state: 'tx', created_by: 1, updated_by: 1 });

    await expect(createOrganization({ name: 'central high', state: 'TX', created_by: 1, updated_by: 1 })).rejects.toThrow('Organization already exists for this name and state');
    await expect(pool.query('INSERT INTO organizations (name, state, created_by, updated_by) VALUES ($1, $2, $3, $4)', ['CENTRAL HIGH', 'tx', 1, 1])).rejects.toMatchObject({ code: '23505' });
  });

  it('rejects orphaned contacts through the contacts organization foreign key', async () => {
    await expect(pool.query('INSERT INTO contacts (organization_id, name) VALUES ($1, $2)', [9999, 'No Org Contact'])).rejects.toMatchObject({ code: '23503' });
  });

  it('blocks illegal opportunity stage jumps and reliably touches activity timestamps', async () => {
    const org = await createOrganization({ name: 'Pipeline Org', state: 'OK', created_by: 1, updated_by: 1 });
    const opportunity = await createOpportunity({
      organization_id: org.id,
      name: 'Pipeline Opp',
      sport: 'BASEBALL',
      season: 'SPRING',
      year: 2026,
      status: 'open',
      value: 1000,
      deal_type: OpportunityChannelType.UNIFORM,
      channel_type: OpportunityChannelType.UNIFORM,
      created_by: 1,
      updated_by: 1,
    });

    await expect(updateOpportunityStage(opportunity.id, OpportunityStage.CLOSED_WON, 1, 'skip', { actual_revenue: 1000, actual_cost: 500 })).rejects.toThrow('Invalid stage transition');

    const reply = {
      statusCode: 200,
      payload: undefined as unknown,
      code(code: number) {
        this.statusCode = code;
        return this;
      },
      send(payload: unknown) {
        this.payload = payload;
        return payload;
      },
    };

    await updateOpportunityStageHandler(
      {
        params: { id: String(opportunity.id) },
        body: {
          stage: OpportunityStage.CLOSED_WON,
          changed_by: 1,
          actual_revenue: 1000,
          actual_cost: 500,
          authorize_illegal_transition: true,
        },
      } as any,
      reply as any
    );
    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toEqual({ message: `Invalid stage transition from ${OpportunityStage.LEAD_ASSIGNED} to ${OpportunityStage.CLOSED_WON}` });

    const before = await getOpportunityById(opportunity.id);
    await updateOpportunityStage(opportunity.id, OpportunityStage.CONTACTED, 2, 'called');
    const after = await getOpportunityById(opportunity.id);
    expect(new Date(after.updated_at).getTime()).toBeGreaterThanOrEqual(new Date(before.updated_at).getTime());
    expect(new Date(after.last_activity_date).getTime()).toBeGreaterThanOrEqual(new Date(before.last_activity_date).getTime());
  });

  it('requires CLOSED_WON opportunities for orders and blocks duplicate orders cleanly', async () => {
    const org = await createOrganization({ name: 'Order Org', state: 'KS', created_by: 1, updated_by: 1 });
    const opportunity = await createOpportunity({
      organization_id: org.id,
      name: 'Order Opp',
      sport: 'SOCCER',
      season: 'FALL',
      year: 2026,
      status: 'open',
      value: 1000,
      deal_type: OpportunityChannelType.TEAM_STORE,
      channel_type: OpportunityChannelType.TEAM_STORE,
      created_by: 1,
      updated_by: 1,
      assigned_rep_id: 11,
    });

    await expect(createOrderFromOpportunity(opportunity.id)).rejects.toThrow('Only CLOSED_WON opportunities can be converted to orders');
    await expect(pool.query('INSERT INTO orders (opportunity_id, organization_id, deal_type, status) VALUES ($1, $2, $3, $4)', [opportunity.id, org.id, 'TEAM_STORE', 'CREATED'])).rejects.toMatchObject({ code: '23514' });

    await updateOpportunityStage(opportunity.id, OpportunityStage.CONTACTED, 1);
    await updateOpportunityStage(opportunity.id, OpportunityStage.DISCOVERY, 1);
    await updateOpportunityStage(opportunity.id, OpportunityStage.MOCKUP_REQUESTED, 1);
    await updateOpportunityStage(opportunity.id, OpportunityStage.MOCKUP_DELIVERED, 1);
    await updateOpportunityStage(opportunity.id, OpportunityStage.INVOICE_SENT, 1);
    await updateOpportunityStage(opportunity.id, OpportunityStage.DECISION_PENDING, 1);
    await updateOpportunityStage(opportunity.id, OpportunityStage.CLOSED_WON, 1, 'won', { actual_revenue: 1200, actual_cost: 700 });

    await expect(createOrderFromOpportunity(opportunity.id)).rejects.toThrow('Order already exists for this opportunity');
    const orderCount = await pool.query('SELECT COUNT(*)::int AS count FROM orders WHERE opportunity_id = $1', [opportunity.id]);
    expect(orderCount.rows[0].count).toBe(1);
  });

  it('rounds commissions to currency precision and rejects invalid payout sources', async () => {
    const org = await createOrganization({ name: 'Commission Precision Org', state: 'MO', created_by: 1, updated_by: 1 });
    const opportunity = await createOpportunity({
      organization_id: org.id,
      name: 'Commission Precision Opp',
      sport: 'TRACK',
      season: 'SPRING',
      year: 2026,
      status: 'open',
      value: 1000,
      deal_type: OpportunityChannelType.LETTERMAN,
      channel_type: OpportunityChannelType.LETTERMAN,
      created_by: 1,
      updated_by: 1,
      assigned_rep_id: 12,
      assigned_director_id: 13,
    });

    const commission = await createCommission({ ...opportunity, gross_profit: 100.005 });
    expect(commission?.rep_commission).toBe('18.00');
    expect(commission?.director_override).toBe('5.00');
    await expect(createCommission({ ...opportunity, gross_profit: -1 })).rejects.toThrow('gross_profit cannot be negative');
  });

  it('maintains relationship integrity on deletes and writes activity audit history atomically', async () => {
    const org = await createOrganization({ name: 'Activity Org', state: 'AR', created_by: 1, updated_by: 1 });
    const opportunity = await createOpportunity({
      organization_id: org.id,
      name: 'Activity Opp',
      sport: 'GOLF',
      season: 'SPRING',
      year: 2026,
      status: 'open',
      value: 1000,
      deal_type: OpportunityChannelType.TRAVEL_GEAR,
      channel_type: OpportunityChannelType.TRAVEL_GEAR,
      created_by: 1,
      updated_by: 1,
    });

    const activity = await createActivity({ type: ActivityType.NOTE, organization_id: org.id, opportunity_id: opportunity.id, description: 'Discussed timeline', created_by: 1 });
    await markActivityComplete(activity.id, 2);
    const audit = await pool.query('SELECT action FROM activity_audit_history WHERE activity_id = $1 ORDER BY id', [activity.id]);
    expect(audit.rows.map((row) => row.action)).toEqual(['CREATED', 'COMPLETED']);

    await pool.query('DELETE FROM organizations WHERE id = $1', [org.id]);
    const activityCount = await pool.query('SELECT COUNT(*)::int AS count FROM activities WHERE organization_id = $1', [org.id]);
    const opportunityCount = await pool.query('SELECT COUNT(*)::int AS count FROM opportunities WHERE organization_id = $1', [org.id]);
    expect(activityCount.rows[0].count).toBe(0);
    expect(opportunityCount.rows[0].count).toBe(0);
  });
});
