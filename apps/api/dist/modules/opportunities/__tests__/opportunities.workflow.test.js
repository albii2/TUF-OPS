"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const opportunities_service_1 = require("../opportunities.service");
const organizations_service_1 = require("../../organizations/organizations.service");
const database_1 = require("@packages/database");
const opportunities_interface_1 = require("../opportunities.interface");
describe('Opportunities Workflow - Integration Test', () => {
    let orgId;
    let opportunityId;
    beforeEach(async () => {
        // Clean tables before each test
        await database_1.pool.query('TRUNCATE TABLE "organizations", "opportunities", "opportunity_stage_history" RESTART IDENTITY CASCADE');
        // Create a dummy organization
        const org = await (0, organizations_service_1.createOrganization)({ name: 'Test Org for Workflow', assigned_rep_id: 1, assigned_director_id: 2, territory_id: 3, created_by: 4, updated_by: 4 });
        orgId = org.id;
        // Create an initial opportunity
        const newOppData = {
            name: 'Workflow Test Opp',
            organization_id: orgId,
            status: 'open',
            value: 1000.00,
            created_by: 1,
            updated_by: 1,
            stage: opportunities_interface_1.OpportunityStage.LEAD_ASSIGNED,
            last_activity_date: new Date(),
            estimated_revenue: 5000.00,
            assigned_rep_id: 1,
            assigned_director_id: 2,
            deal_type: 'UNIFORM',
        };
        const createdOpp = await (0, opportunities_service_1.createOpportunity)(newOppData);
        opportunityId = createdOpp.id;
    });
    afterAll(async () => {
        await database_1.pool.end();
    });
    describe('Basic Workflow', () => {
        it('should create an opportunity with the initial stage and estimated revenue', async () => {
            const opps = await (0, opportunities_service_1.getOpportunitiesByOrganization)(String(orgId));
            expect(opps.length).toBe(1);
            expect(opps[0].stage).toBe(opportunities_interface_1.OpportunityStage.LEAD_ASSIGNED);
            expect(opps[0].estimated_revenue).toBe('5000.00');
        });
        it('should allow a valid stage transition and record history', async () => {
            const updatedOpp = await (0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.CONTACTED, 1, 'Contacted customer');
            expect(updatedOpp.stage).toBe(opportunities_interface_1.OpportunityStage.CONTACTED);
            const historyResult = await database_1.pool.query('SELECT * FROM opportunity_stage_history WHERE opportunity_id = $1', [opportunityId]);
            expect(historyResult.rows.length).toBe(1);
            expect(historyResult.rows[0].from_stage).toBe(opportunities_interface_1.OpportunityStage.LEAD_ASSIGNED);
            expect(historyResult.rows[0].to_stage).toBe(opportunities_interface_1.OpportunityStage.CONTACTED);
        });
        it('should reject an invalid stage transition', async () => {
            await expect((0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.PROPOSAL_SENT, 1)).rejects.toThrow('Invalid stage transition from LEAD_ASSIGNED to PROPOSAL_SENT');
        });
    });
    describe('Financial Workflow', () => {
        beforeEach(async () => {
            // Move opportunity to a stage where it can be closed
            await (0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.CONTACTED, 1);
            await (0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.CONVERSATION_STARTED, 1);
            await (0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.NEEDS_IDENTIFIED, 1);
            await (0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.PROPOSAL_SENT, 1);
            await (0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.DECISION_PENDING, 1);
        });
        it('should reject CLOSED_WON without actual_revenue', async () => {
            await expect((0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.CLOSED_WON, 1, 'Won deal', { actual_cost: 3000 })).rejects.toThrow('actual_revenue and actual_cost are required to close an opportunity as won');
        });
        it('should reject CLOSED_WON without actual_cost', async () => {
            await expect((0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.CLOSED_WON, 1, 'Won deal', { actual_revenue: 5000 })).rejects.toThrow('actual_revenue and actual_cost are required to close an opportunity as won');
        });
        it('should allow CLOSED_WON with required financial data and calculate gross_profit', async () => {
            const updatedOpp = await (0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.CLOSED_WON, 1, 'Won deal', { actual_revenue: 5000, actual_cost: 3000 });
            expect(updatedOpp.stage).toBe(opportunities_interface_1.OpportunityStage.CLOSED_WON);
            expect(updatedOpp.actual_revenue).toBe('5000.00');
            expect(updatedOpp.actual_cost).toBe('3000.00');
            expect(updatedOpp.gross_profit).toBe('2000.00');
            expect(updatedOpp.closed_at).toBeDefined();
        });
        it('should reject CLOSED_LOST without loss_reason', async () => {
            await expect((0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.CLOSED_LOST, 1, 'Lost deal')).rejects.toThrow('loss_reason is required to close an opportunity as lost');
        });
        it('should allow CLOSED_LOST with loss_reason', async () => {
            const updatedOpp = await (0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.CLOSED_LOST, 1, 'Lost deal', { loss_reason: 'Went with competitor' });
            expect(updatedOpp.stage).toBe(opportunities_interface_1.OpportunityStage.CLOSED_LOST);
            expect(updatedOpp.loss_reason).toBe('Went with competitor');
            expect(updatedOpp.closed_at).toBeDefined();
        });
    });
});
//# sourceMappingURL=opportunities.workflow.test.js.map