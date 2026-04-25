
import { pool } from '@packages/database';
import { createOrganization } from '../../organizations/organizations.service';
import { createOpportunity, updateOpportunityStage } from '../../opportunities/opportunities.service';
import { createOrderFromOpportunity, getOrderById, getOrderByOpportunityId } from '../orders.service';
import { Opportunity, OpportunityStage } from '../../opportunities/opportunities.interface';
import { OrderStatus } from '../orders.interface';

describe('Orders Service - Integration Test', () => {
    beforeEach(async () => {
        // Truncate tables before each test to ensure isolation
        await pool.query('TRUNCATE TABLE "organizations", "opportunities", "orders" RESTART IDENTITY CASCADE');
    });

    afterAll(async () => {
        // Close the pool after all tests are done
        await pool.end();
    });

    const createTestOrgAndOpps = async () => {
        const org = await createOrganization({ name: 'Test Org', created_by: 1, updated_by: 1 });

        const openOpp = await createOpportunity({
            organization_id: org.id,
            name: 'Open Opp',
            status: 'open',
            value: 1000,
            deal_type: 'UNIFORM',
            created_by: 1,
            updated_by: 1,
            stage: OpportunityStage.INVOICE_SENT,
            assigned_rep_id: 1, // Added to satisfy commission prerequisites
            assigned_director_id: 2, // Added to satisfy commission prerequisites
        });

        const oppToWin = await createOpportunity({
            organization_id: org.id,
            name: 'Opp to be Won',
            status: 'open',
            value: 5000,
            deal_type: 'TRAVEL_GEAR',
            created_by: 1,
            updated_by: 1,
            stage: OpportunityStage.LEAD_ASSIGNED, // Start from the beginning
            assigned_rep_id: 1, // Added to satisfy commission prerequisites
            assigned_director_id: 2, // Added to satisfy commission prerequisites
        });
        
        // Correct stage progression
        await updateOpportunityStage(oppToWin.id, OpportunityStage.CONTACTED, 1);
        await updateOpportunityStage(oppToWin.id, OpportunityStage.DISCOVERY, 1);
        await updateOpportunityStage(oppToWin.id, OpportunityStage.MOCKUP_REQUESTED, 1);
        await updateOpportunityStage(oppToWin.id, OpportunityStage.MOCKUP_DELIVERED, 1);
        await updateOpportunityStage(oppToWin.id, OpportunityStage.INVOICE_SENT, 1);
        await updateOpportunityStage(oppToWin.id, OpportunityStage.DECISION_PENDING, 1);
        const closedWonOpp = await updateOpportunityStage(oppToWin.id, OpportunityStage.CLOSED_WON, 1, 'Won Deal', { actual_revenue: 5000, actual_cost: 3000 });

        return { org, openOpp, closedWonOpp };
    };

    it('should create an order from a valid CLOSED_WON opportunity', async () => {
        const { closedWonOpp } = await createTestOrgAndOpps();
        const order = await createOrderFromOpportunity(closedWonOpp.id);

        expect(order).toBeDefined();
        expect(order.opportunity_id).toBe(closedWonOpp.id);
        expect(order.organization_id).toBe(closedWonOpp.organization_id);
        expect(order.deal_type).toBe(closedWonOpp.deal_type);
        expect(order.status).toBe(OrderStatus.CREATED);
    });

    it('should reject order creation when opportunity does not exist', async () => {
        await expect(createOrderFromOpportunity(99999)).rejects.toThrow('Opportunity not found');
    });

    it('should reject order creation when opportunity is not CLOSED_WON', async () => {
        const { openOpp } = await createTestOrgAndOpps();
        await expect(createOrderFromOpportunity(openOpp.id)).rejects.toThrow('Only CLOSED_WON opportunities can be converted to orders');
    });

    it('should reject duplicate order creation for the same opportunity', async () => {
        const { closedWonOpp } = await createTestOrgAndOpps();
        // First creation is successful
        await createOrderFromOpportunity(closedWonOpp.id);
        // Second attempt for the same opportunity should fail
        await expect(createOrderFromOpportunity(closedWonOpp.id)).rejects.toThrow('Order already exists for this opportunity');
    });

    it('should return an order by id after creation', async () => {
        const { closedWonOpp } = await createTestOrgAndOpps();
        const createdOrder = await createOrderFromOpportunity(closedWonOpp.id);
        const fetchedOrder = await getOrderById(createdOrder.id);

        expect(fetchedOrder).toBeDefined();
        expect(fetchedOrder!.id).toBe(createdOrder.id);
    });

    it('should return an order by opportunity id after creation', async () => {
        const { closedWonOpp } = await createTestOrgAndOpps();
        const createdOrder = await createOrderFromOpportunity(closedWonOpp.id);
        const fetchedOrder = await getOrderByOpportunityId(closedWonOpp.id);

        expect(fetchedOrder).toBeDefined();
        expect(fetchedOrder!.id).toBe(createdOrder.id);
        expect(fetchedOrder!.opportunity_id).toBe(closedWonOpp.id);
    });

    it('should return null from getOrderById when missing', async () => {
        const fetchedOrder = await getOrderById(99999);
        expect(fetchedOrder).toBeNull();
    });

    it('should return null from getOrderByOpportunityId when missing', async () => {
        const { openOpp } = await createTestOrgAndOpps(); // An opportunity with no order
        const fetchedOrder = await getOrderByOpportunityId(openOpp.id);
        expect(fetchedOrder).toBeNull();
    });
});
