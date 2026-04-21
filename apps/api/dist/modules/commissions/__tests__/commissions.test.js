"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const organizations_service_1 = require("../../organizations/organizations.service");
const opportunities_service_1 = require("../../opportunities/opportunities.service");
const database_1 = require("@packages/database");
const opportunities_interface_1 = require("../../opportunities/opportunities.interface");
const commissions_interface_1 = require("../commissions.interface");
describe('Commissions Service - Integration Test', () => {
    let orgId;
    let opportunityId;
    beforeEach(async () => {
        // Clean tables before each test
        await database_1.pool.query('TRUNCATE TABLE "organizations", "opportunities", "commissions" RESTART IDENTITY CASCADE');
        // Create a dummy organization
        const org = await (0, organizations_service_1.createOrganization)({ name: 'Test Org for Commissions', assigned_rep_id: 1, assigned_director_id: 2, territory_id: 3, created_by: 4, updated_by: 4 });
        orgId = org.id;
        // Create an initial opportunity
        const newOppData = {
            name: 'Commission Test Opp',
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
    it('should create a commission record on CLOSED_WON', async () => {
        await (0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.CONTACTED, 1);
        await (0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.CONVERSATION_STARTED, 1);
        await (0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.NEEDS_IDENTIFIED, 1);
        await (0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.PROPOSAL_SENT, 1);
        await (0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.DECISION_PENDING, 1);
        const updatedOpp = await (0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.CLOSED_WON, 1, 'Won deal', { actual_revenue: 5000, actual_cost: 3000 });
        const commissionResult = await database_1.pool.query('SELECT * FROM commissions WHERE opportunity_id = $1', [opportunityId]);
        expect(commissionResult.rows.length).toBe(1);
        const commission = commissionResult.rows[0];
        expect(commission.rep_commission).toBe('200.00'); // 10% of 2000
        expect(commission.director_override).toBe('100.00'); // 5% of 2000
        expect(commission.status).toBe(commissions_interface_1.CommissionStatus.PENDING);
    });
    it('should not create a commission record for non-closed opportunities', async () => {
        await (0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.CONTACTED, 1);
        const commissionResult = await database_1.pool.query('SELECT * FROM commissions WHERE opportunity_id = $1', [opportunityId]);
        expect(commissionResult.rows.length).toBe(0);
    });
    it('should not duplicate a commission record on duplicate CLOSED_WON transition', async () => {
        await (0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.CONTACTED, 1);
        await (0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.CONVERSATION_STARTED, 1);
        await (0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.NEEDS_IDENTIFIED, 1);
        await (0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.PROPOSAL_SENT, 1);
        await (0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.DECISION_PENDING, 1);
        await (0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.CLOSED_WON, 1, 'Won deal', { actual_revenue: 5000, actual_cost: 3000 });
        // Attempt to close again, should fail because transition is invalid
        await expect((0, opportunities_service_1.updateOpportunityStage)(opportunityId, opportunities_interface_1.OpportunityStage.CLOSED_WON, 1, 'Won deal again', { actual_revenue: 6000, actual_cost: 3500 })).rejects.toThrow('Invalid stage transition from CLOSED_WON to CLOSED_WON');
        const commissionResult = await database_1.pool.query('SELECT * FROM commissions WHERE opportunity_id = $1', [opportunityId]);
        expect(commissionResult.rows.length).toBe(1);
    });
});
//# sourceMappingURL=commissions.test.js.map