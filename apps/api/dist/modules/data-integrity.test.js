"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("@packages/database");
const organizations_service_1 = require("./organizations/organizations.service");
const opportunities_service_1 = require("./opportunities/opportunities.service");
const opportunities_controller_1 = require("./opportunities/opportunities.controller");
const orders_service_1 = require("./orders/orders.service");
const activities_service_1 = require("./activities/activities.service");
const activities_interface_1 = require("./activities/activities.interface");
const commissions_service_1 = require("./commissions/commissions.service");
const opportunities_interface_1 = require("./opportunities/opportunities.interface");
describe('v0.9.0 data integrity hardening', () => {
    beforeEach(async () => {
        await database_1.pool.query('TRUNCATE TABLE "activity_audit_history", "activities", "contacts", "orders", "commissions", "opportunity_stage_history", "opportunities", "organizations" RESTART IDENTITY CASCADE');
    });
    afterAll(async () => {
        await database_1.pool.end();
    });
    it('rejects duplicate organizations by normalized name and state at service and database layers', async () => {
        await (0, organizations_service_1.createOrganization)({ name: ' Central High ', state: 'tx', created_by: 1, updated_by: 1 });
        await expect((0, organizations_service_1.createOrganization)({ name: 'central high', state: 'TX', created_by: 1, updated_by: 1 })).rejects.toThrow('Organization already exists for this name and state');
        await expect(database_1.pool.query('INSERT INTO organizations (name, state, created_by, updated_by) VALUES ($1, $2, $3, $4)', ['CENTRAL HIGH', 'tx', 1, 1])).rejects.toMatchObject({ code: '23505' });
    });
    it('rejects orphaned contacts through the contacts organization foreign key', async () => {
        await expect(database_1.pool.query('INSERT INTO contacts (organization_id, name) VALUES ($1, $2)', [9999, 'No Org Contact'])).rejects.toMatchObject({ code: '23503' });
    });
    it('blocks illegal opportunity stage jumps and reliably touches activity timestamps', async () => {
        const org = await (0, organizations_service_1.createOrganization)({ name: 'Pipeline Org', state: 'OK', created_by: 1, updated_by: 1 });
        const opportunity = await (0, opportunities_service_1.createOpportunity)({
            organization_id: org.id,
            name: 'Pipeline Opp',
            sport: 'BASEBALL',
            season: 'SPRING',
            year: 2026,
            status: 'open',
            value: 1000,
            deal_type: opportunities_interface_1.OpportunityChannelType.UNIFORM,
            channel_type: opportunities_interface_1.OpportunityChannelType.UNIFORM,
            created_by: 1,
            updated_by: 1,
        });
        await expect((0, opportunities_service_1.updateOpportunityStage)(opportunity.id, opportunities_interface_1.OpportunityStage.CLOSED_WON, 1, 'skip', { actual_revenue: 1000, actual_cost: 500 })).rejects.toThrow('Invalid stage transition');
        const reply = {
            statusCode: 200,
            payload: undefined,
            code(code) {
                this.statusCode = code;
                return this;
            },
            send(payload) {
                this.payload = payload;
                return payload;
            },
        };
        await (0, opportunities_controller_1.updateOpportunityStageHandler)({
            params: { id: String(opportunity.id) },
            body: {
                stage: opportunities_interface_1.OpportunityStage.CLOSED_WON,
                changed_by: 1,
                actual_revenue: 1000,
                actual_cost: 500,
                authorize_illegal_transition: true,
            },
        }, reply);
        expect(reply.statusCode).toBe(400);
        expect(reply.payload).toEqual({ message: `Invalid stage transition from ${opportunities_interface_1.OpportunityStage.LEAD_ASSIGNED} to ${opportunities_interface_1.OpportunityStage.CLOSED_WON}` });
        const before = await (0, opportunities_service_1.getOpportunityById)(opportunity.id);
        await (0, opportunities_service_1.updateOpportunityStage)(opportunity.id, opportunities_interface_1.OpportunityStage.CONTACTED, 2, 'called');
        const after = await (0, opportunities_service_1.getOpportunityById)(opportunity.id);
        expect(new Date(after.updated_at).getTime()).toBeGreaterThanOrEqual(new Date(before.updated_at).getTime());
        expect(new Date(after.last_activity_date).getTime()).toBeGreaterThanOrEqual(new Date(before.last_activity_date).getTime());
    });
    it('requires CLOSED_WON opportunities for orders and blocks duplicate orders cleanly', async () => {
        const org = await (0, organizations_service_1.createOrganization)({ name: 'Order Org', state: 'KS', created_by: 1, updated_by: 1 });
        const opportunity = await (0, opportunities_service_1.createOpportunity)({
            organization_id: org.id,
            name: 'Order Opp',
            sport: 'SOCCER',
            season: 'FALL',
            year: 2026,
            status: 'open',
            value: 1000,
            deal_type: opportunities_interface_1.OpportunityChannelType.TEAM_STORE,
            channel_type: opportunities_interface_1.OpportunityChannelType.TEAM_STORE,
            created_by: 1,
            updated_by: 1,
            assigned_rep_id: 11,
        });
        await expect((0, orders_service_1.createOrderFromOpportunity)(opportunity.id)).rejects.toThrow('Only CLOSED_WON opportunities can be converted to orders');
        await expect(database_1.pool.query('INSERT INTO orders (opportunity_id, organization_id, deal_type, status) VALUES ($1, $2, $3, $4)', [opportunity.id, org.id, 'TEAM_STORE', 'CREATED'])).rejects.toMatchObject({ code: '23514' });
        await (0, opportunities_service_1.updateOpportunityStage)(opportunity.id, opportunities_interface_1.OpportunityStage.CONTACTED, 1);
        await (0, opportunities_service_1.updateOpportunityStage)(opportunity.id, opportunities_interface_1.OpportunityStage.DISCOVERY, 1);
        await (0, opportunities_service_1.updateOpportunityStage)(opportunity.id, opportunities_interface_1.OpportunityStage.MOCKUP_REQUESTED, 1);
        await (0, opportunities_service_1.updateOpportunityStage)(opportunity.id, opportunities_interface_1.OpportunityStage.MOCKUP_DELIVERED, 1);
        await (0, opportunities_service_1.updateOpportunityStage)(opportunity.id, opportunities_interface_1.OpportunityStage.INVOICE_SENT, 1);
        await (0, opportunities_service_1.updateOpportunityStage)(opportunity.id, opportunities_interface_1.OpportunityStage.DECISION_PENDING, 1);
        await (0, opportunities_service_1.updateOpportunityStage)(opportunity.id, opportunities_interface_1.OpportunityStage.CLOSED_WON, 1, 'won', { actual_revenue: 1200, actual_cost: 700 });
        await expect((0, orders_service_1.createOrderFromOpportunity)(opportunity.id)).rejects.toThrow('Order already exists for this opportunity');
        const orderCount = await database_1.pool.query('SELECT COUNT(*)::int AS count FROM orders WHERE opportunity_id = $1', [opportunity.id]);
        expect(orderCount.rows[0].count).toBe(1);
    });
    it('rounds commissions to currency precision and rejects invalid payout sources', async () => {
        const org = await (0, organizations_service_1.createOrganization)({ name: 'Commission Precision Org', state: 'MO', created_by: 1, updated_by: 1 });
        const opportunity = await (0, opportunities_service_1.createOpportunity)({
            organization_id: org.id,
            name: 'Commission Precision Opp',
            sport: 'TRACK',
            season: 'SPRING',
            year: 2026,
            status: 'open',
            value: 1000,
            deal_type: opportunities_interface_1.OpportunityChannelType.LETTERMAN,
            channel_type: opportunities_interface_1.OpportunityChannelType.LETTERMAN,
            created_by: 1,
            updated_by: 1,
            assigned_rep_id: 12,
            assigned_director_id: 13,
        });
        const commission = await (0, commissions_service_1.createCommission)({ ...opportunity, gross_profit: 100.005 });
        expect(commission?.rep_commission).toBe('18.00');
        expect(commission?.director_override).toBe('5.00');
        await expect((0, commissions_service_1.createCommission)({ ...opportunity, gross_profit: -1 })).rejects.toThrow('gross_profit cannot be negative');
    });
    it('maintains relationship integrity on deletes and writes activity audit history atomically', async () => {
        const org = await (0, organizations_service_1.createOrganization)({ name: 'Activity Org', state: 'AR', created_by: 1, updated_by: 1 });
        const opportunity = await (0, opportunities_service_1.createOpportunity)({
            organization_id: org.id,
            name: 'Activity Opp',
            sport: 'GOLF',
            season: 'SPRING',
            year: 2026,
            status: 'open',
            value: 1000,
            deal_type: opportunities_interface_1.OpportunityChannelType.TRAVEL_GEAR,
            channel_type: opportunities_interface_1.OpportunityChannelType.TRAVEL_GEAR,
            created_by: 1,
            updated_by: 1,
        });
        const activity = await (0, activities_service_1.createActivity)({ type: activities_interface_1.ActivityType.NOTE, organization_id: org.id, opportunity_id: opportunity.id, description: 'Discussed timeline', created_by: 1 });
        await (0, activities_service_1.markActivityComplete)(activity.id, 2);
        const audit = await database_1.pool.query('SELECT action FROM activity_audit_history WHERE activity_id = $1 ORDER BY id', [activity.id]);
        expect(audit.rows.map((row) => row.action)).toEqual(['CREATED', 'COMPLETED']);
        await database_1.pool.query('DELETE FROM organizations WHERE id = $1', [org.id]);
        const activityCount = await database_1.pool.query('SELECT COUNT(*)::int AS count FROM activities WHERE organization_id = $1', [org.id]);
        const opportunityCount = await database_1.pool.query('SELECT COUNT(*)::int AS count FROM opportunities WHERE organization_id = $1', [org.id]);
        expect(activityCount.rows[0].count).toBe(0);
        expect(opportunityCount.rows[0].count).toBe(0);
    });
});
//# sourceMappingURL=data-integrity.test.js.map