"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("@packages/database");
const organizations_service_1 = require("../../organizations/organizations.service");
const opportunities_service_1 = require("../../opportunities/opportunities.service");
const creative_requests_service_1 = require("../creative-requests.service");
describe('Creative Requests Service', () => {
    let opportunityId;
    beforeEach(async () => {
        await database_1.pool.query('TRUNCATE TABLE "creative_requests", "opportunities", "organizations" RESTART IDENTITY CASCADE');
        const org = await (0, organizations_service_1.createOrganization)({ name: 'CR Org', assigned_rep_id: 1, assigned_director_id: 2, territory_id: 3, created_by: 1, updated_by: 1 });
        const opp = await (0, opportunities_service_1.createOpportunity)({ name: 'CR Opp', organization_id: Number(org.id), status: 'open', value: 1000, created_by: 1, updated_by: 1, deal_type: 'UNIFORM' });
        opportunityId = Number(opp.id);
    });
    afterAll(async () => { await database_1.pool.end(); });
    it('creates and fetches creative requests by opportunity', async () => {
        const created = await (0, creative_requests_service_1.createCreativeRequest)(opportunityId, { created_by_user_id: 1, request_type: 'MOCKUP', design_team: 'APPAREL_MOCKUP', priority: 'HIGH', title: 'Home/Away Mockups', design_notes: 'Need two concepts', needed_items: ['Home Uniform', 'Away Uniform'] });
        expect(created.id).toBeDefined();
        expect(created.status).toBe('SUBMITTED');
        const list = await (0, creative_requests_service_1.listCreativeRequestsByOpportunity)(opportunityId);
        expect(list.length).toBe(1);
    });
    it('validates required fields', async () => {
        await expect((0, creative_requests_service_1.createCreativeRequest)(opportunityId, { created_by_user_id: 1, request_type: 'MOCKUP', design_team: 'APPAREL_MOCKUP', title: '', design_notes: '' })).rejects.toThrow('Missing required fields');
    });
});
//# sourceMappingURL=creative-requests.test.js.map