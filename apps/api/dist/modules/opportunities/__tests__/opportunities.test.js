"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const opportunities_service_1 = require("../opportunities.service");
const organizations_service_1 = require("../../organizations/organizations.service");
const database_1 = require("@packages/database");
describe('Opportunities Service - Integration Test', () => {
    let orgId;
    beforeEach(async () => {
        // Clean tables before each test
        await database_1.pool.query('TRUNCATE TABLE "organizations", "opportunities" RESTART IDENTITY CASCADE');
        // Create a dummy organization to associate opportunities with
        const org = await (0, organizations_service_1.createOrganization)({ name: 'Test Org for Opps', assigned_rep_id: 1, assigned_director_id: 2, territory_id: 3, created_by: 4, updated_by: 4 });
        orgId = Number(org.id);
    });
    afterAll(async () => {
        await database_1.pool.end();
    });
    it('should create an opportunity and associate it with an organization', async () => {
        const newOppData = {
            name: 'New Test Opp',
            organization_id: orgId,
            status: 'open',
            value: 1000.00,
            created_by: 1,
            updated_by: 1
        };
        const createdOpp = await (0, opportunities_service_1.createOpportunity)(newOppData);
        expect(createdOpp.id).toBeDefined();
        expect(createdOpp.organization_id).toBe(orgId);
        const opps = await (0, opportunities_service_1.getOpportunitiesByOrganization)(String(orgId));
        expect(opps.length).toBe(1);
        expect(opps[0].name).toBe(newOppData.name);
    });
});
//# sourceMappingURL=opportunities.test.js.map