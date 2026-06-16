"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("@packages/database");
const organizations_service_1 = require("../../organizations/organizations.service");
const opportunities_service_1 = require("../../opportunities/opportunities.service");
const production_requests_service_1 = require("../production-requests.service");
const production_requests_interface_1 = require("../production-requests.interface");
const opportunities_interface_1 = require("../../opportunities/opportunities.interface");
describe('Production Requests Service - Integration Test', () => {
    let orgId;
    let oppUniform;
    let oppJackets;
    let oppStore;
    beforeAll(async () => {
        await database_1.pool.query('TRUNCATE TABLE "organizations", "opportunities", "production_requests" RESTART IDENTITY CASCADE');
        const org = await (0, organizations_service_1.createOrganization)({ name: 'Test Org for Production Requests', created_by: 1, updated_by: 1 });
        orgId = org.id;
        oppUniform = await (0, opportunities_service_1.createOpportunity)({
            organization_id: orgId,
            name: 'Uniform Opp',
            status: 'open',
            value: 1000,
            deal_type: 'UNIFORM',
            channel_type: opportunities_interface_1.OpportunityChannelType.UNIFORM,
            created_by: 1,
            updated_by: 1,
        });
        oppJackets = await (0, opportunities_service_1.createOpportunity)({
            organization_id: orgId,
            name: 'Jackets Opp',
            status: 'open',
            value: 2000,
            deal_type: 'LETTERMAN',
            channel_type: opportunities_interface_1.OpportunityChannelType.LETTERMAN,
            created_by: 1,
            updated_by: 1,
        });
        oppStore = await (0, opportunities_service_1.createOpportunity)({
            organization_id: orgId,
            name: 'Store Opp',
            status: 'open',
            value: 3000,
            deal_type: 'TEAM_STORE',
            channel_type: opportunities_interface_1.OpportunityChannelType.TEAM_STORE,
            created_by: 1,
            updated_by: 1,
        });
    });
    afterAll(async () => {
        await database_1.pool.end();
    });
    it('should create a mockup request for any deal type', async () => {
        const mockupRequest = await (0, production_requests_service_1.createProductionRequest)({
            opportunity_id: oppStore.id,
            type: production_requests_interface_1.ProductionRequestType.MOCKUP,
            requested_by: 1,
            title: 'Mockup for Store',
        });
        expect(mockupRequest.id).toBeDefined();
        expect(mockupRequest.type).toBe(production_requests_interface_1.ProductionRequestType.MOCKUP);
    });
    it('should create a sample request for UNIFORM deal type', async () => {
        const sampleRequest = await (0, production_requests_service_1.createProductionRequest)({
            opportunity_id: oppUniform.id,
            type: production_requests_interface_1.ProductionRequestType.SAMPLE,
            requested_by: 1,
            title: 'Sample for Uniform',
        });
        expect(sampleRequest.id).toBeDefined();
        expect(sampleRequest.type).toBe(production_requests_interface_1.ProductionRequestType.SAMPLE);
    });
    it('should create a sample request for JACKETS deal type', async () => {
        const sampleRequest = await (0, production_requests_service_1.createProductionRequest)({
            opportunity_id: oppJackets.id,
            type: production_requests_interface_1.ProductionRequestType.SAMPLE,
            requested_by: 1,
            title: 'Sample for Jackets',
        });
        expect(sampleRequest.id).toBeDefined();
        expect(sampleRequest.type).toBe(production_requests_interface_1.ProductionRequestType.SAMPLE);
    });
    it('should reject sample request for STORE deal type', async () => {
        await expect((0, production_requests_service_1.createProductionRequest)({
            opportunity_id: oppStore.id,
            type: production_requests_interface_1.ProductionRequestType.SAMPLE,
            requested_by: 1,
            title: 'Sample for Store',
        })).rejects.toThrow('Sample requests not allowed for deal type: TEAM_STORE');
    });
    it('should require waiver_reason if sample is waived', async () => {
        await expect((0, production_requests_service_1.createProductionRequest)({
            opportunity_id: oppUniform.id,
            type: production_requests_interface_1.ProductionRequestType.SAMPLE,
            requested_by: 1,
            title: 'Waived Sample',
            sample_waived_by_rep: true,
        })).rejects.toThrow('Waiver reason is required for waived samples');
    });
    it('should update production request status', async () => {
        const request = await (0, production_requests_service_1.createProductionRequest)({
            opportunity_id: oppUniform.id,
            type: production_requests_interface_1.ProductionRequestType.MOCKUP,
            requested_by: 1,
            title: 'Status Update Test',
        });
        const updatedRequest = await (0, production_requests_service_1.updateProductionRequestStatus)(request.id, production_requests_interface_1.ProductionRequestStatus.IN_PROGRESS);
        expect(updatedRequest.status).toBe(production_requests_interface_1.ProductionRequestStatus.IN_PROGRESS);
    });
    it('should get all production requests for an opportunity', async () => {
        await (0, production_requests_service_1.createProductionRequest)({ opportunity_id: oppJackets.id, type: production_requests_interface_1.ProductionRequestType.MOCKUP, requested_by: 1, title: 'Req 1' });
        await (0, production_requests_service_1.createProductionRequest)({ opportunity_id: oppJackets.id, type: production_requests_interface_1.ProductionRequestType.SAMPLE, requested_by: 1, title: 'Req 2' });
        const requests = await (0, production_requests_service_1.getProductionRequestsByOpportunity)(oppJackets.id);
        // 2 new requests created, plus the one from the 'sample for jackets' test
        expect(requests.length).toBe(3);
    });
});
//# sourceMappingURL=production-requests.test.js.map