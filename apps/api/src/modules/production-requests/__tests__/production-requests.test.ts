
import { pool } from '@packages/database';
import { createOrganization } from '../../organizations/organizations.service';
import { createOpportunity } from '../../opportunities/opportunities.service';
import { createProductionRequest, getProductionRequestsByOpportunity, updateProductionRequestStatus } from '../production-requests.service';
import { ProductionRequestStatus, ProductionRequestType } from '../production-requests.interface';

describe('Production Requests Service - Integration Test', () => {
    let orgId: number;
    let oppUniform: any;
    let oppJackets: any;
    let oppStore: any;

    beforeAll(async () => {
        await pool.query('TRUNCATE TABLE "organizations", "opportunities", "production_requests" RESTART IDENTITY CASCADE');

        const org = await createOrganization({ name: 'Test Org for Production Requests', created_by: 1, updated_by: 1 });
        orgId = org.id;

        oppUniform = await createOpportunity({
            organization_id: orgId,
            name: 'Uniform Opp',
            status: 'open',
            value: 1000,
            deal_type: 'UNIFORM',
            created_by: 1,
            updated_by: 1,
        });

        oppJackets = await createOpportunity({
            organization_id: orgId,
            name: 'Jackets Opp',
            status: 'open',
            value: 2000,
            deal_type: 'JACKETS',
            created_by: 1,
            updated_by: 1,
        });

        oppStore = await createOpportunity({
            organization_id: orgId,
            name: 'Store Opp',
            status: 'open',
            value: 3000,
            deal_type: 'STORE',
            created_by: 1,
            updated_by: 1,
        });
    });

    afterAll(async () => {
        await pool.end();
    });

    it('should create a mockup request for any deal type', async () => {
        const mockupRequest = await createProductionRequest({
            opportunity_id: oppStore.id,
            type: ProductionRequestType.MOCKUP,
            requested_by: 1,
            title: 'Mockup for Store',
        });
        expect(mockupRequest.id).toBeDefined();
        expect(mockupRequest.type).toBe(ProductionRequestType.MOCKUP);
    });

    it('should create a sample request for UNIFORM deal type', async () => {
        const sampleRequest = await createProductionRequest({
            opportunity_id: oppUniform.id,
            type: ProductionRequestType.SAMPLE,
            requested_by: 1,
            title: 'Sample for Uniform',
        });
        expect(sampleRequest.id).toBeDefined();
        expect(sampleRequest.type).toBe(ProductionRequestType.SAMPLE);
    });

    it('should create a sample request for JACKETS deal type', async () => {
        const sampleRequest = await createProductionRequest({
            opportunity_id: oppJackets.id,
            type: ProductionRequestType.SAMPLE,
            requested_by: 1,
            title: 'Sample for Jackets',
        });
        expect(sampleRequest.id).toBeDefined();
        expect(sampleRequest.type).toBe(ProductionRequestType.SAMPLE);
    });

    it('should reject sample request for STORE deal type', async () => {
        await expect(createProductionRequest({
            opportunity_id: oppStore.id,
            type: ProductionRequestType.SAMPLE,
            requested_by: 1,
            title: 'Sample for Store',
        })).rejects.toThrow('Sample requests not allowed for deal type: STORE');
    });

    it('should require waiver_reason if sample is waived', async () => {
        await expect(createProductionRequest({
            opportunity_id: oppUniform.id,
            type: ProductionRequestType.SAMPLE,
            requested_by: 1,
            title: 'Waived Sample',
            sample_waived_by_rep: true,
        })).rejects.toThrow('Waiver reason is required for waived samples');
    });

    it('should update production request status', async () => {
        const request = await createProductionRequest({
            opportunity_id: oppUniform.id,
            type: ProductionRequestType.MOCKUP,
            requested_by: 1,
            title: 'Status Update Test',
        });
        const updatedRequest = await updateProductionRequestStatus(request.id, ProductionRequestStatus.IN_PROGRESS);
        expect(updatedRequest.status).toBe(ProductionRequestStatus.IN_PROGRESS);
    });

    it('should get all production requests for an opportunity', async () => {
        await createProductionRequest({ opportunity_id: oppJackets.id, type: ProductionRequestType.MOCKUP, requested_by: 1, title: 'Req 1' });
        await createProductionRequest({ opportunity_id: oppJackets.id, type: ProductionRequestType.SAMPLE, requested_by: 1, title: 'Req 2' });
        const requests = await getProductionRequestsByOpportunity(oppJackets.id);
        // 2 new requests created, plus the one from the 'sample for jackets' test
        expect(requests.length).toBe(3);
    });
});
