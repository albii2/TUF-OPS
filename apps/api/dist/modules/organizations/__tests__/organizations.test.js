"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const organizations_service_1 = require("../organizations.service");
const database_1 = require("@packages/database");
describe('Organizations Service - Integration Test', () => {
    // Clean the tables before each test
    beforeEach(async () => {
        await database_1.pool.query('TRUNCATE TABLE "organizations" RESTART IDENTITY CASCADE');
    });
    // Close the pool after all tests are done
    afterAll(async () => {
        await database_1.pool.end();
    });
    it('should create an organization and retrieve it', async () => {
        const newOrgData = { name: 'Test Create Org', assigned_rep_id: 1, assigned_director_id: 2, territory_id: 3, created_by: 4, updated_by: 4 };
        const createdOrg = await (0, organizations_service_1.createOrganization)(newOrgData);
        expect(createdOrg.id).toBeDefined();
        const allOrgs = await (0, organizations_service_1.getOrganizations)();
        expect(allOrgs.length).toBe(1);
        expect(allOrgs[0].name).toBe(newOrgData.name);
    });
    it('should update an organization', async () => {
        const initialOrgData = { name: 'Initial Org', assigned_rep_id: 1, assigned_director_id: 2, territory_id: 3, created_by: 4, updated_by: 4 };
        const createdOrg = await (0, organizations_service_1.createOrganization)(initialOrgData);
        const updateData = { name: 'Updated Org Name', assigned_rep_id: 10, assigned_director_id: 20, territory_id: 30, updated_by: 5 };
        await (0, organizations_service_1.updateOrganization)(String(createdOrg.id), updateData);
        const allOrgs = await (0, organizations_service_1.getOrganizations)();
        expect(allOrgs[0].name).toBe('Updated Org Name');
    });
});
//# sourceMappingURL=organizations.test.js.map