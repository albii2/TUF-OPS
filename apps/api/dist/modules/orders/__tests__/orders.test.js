"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("@packages/database");
const organizations_service_1 = require("../../organizations/organizations.service");
const opportunities_service_1 = require("../../opportunities/opportunities.service");
const orders_service_1 = require("../orders.service");
const opportunities_interface_1 = require("../../opportunities/opportunities.interface");
const orders_interface_1 = require("../orders.interface");
describe('Orders Service - Integration Test', () => {
    beforeEach(async () => {
        // Truncate tables before each test to ensure isolation
        await database_1.pool.query('TRUNCATE TABLE "organizations", "opportunities", "orders" RESTART IDENTITY CASCADE');
    });
    afterAll(async () => {
        // Close the pool after all tests are done
        await database_1.pool.end();
    });
    const createTestOrgAndOpps = async () => {
        const org = await (0, organizations_service_1.createOrganization)({ name: 'Test Org', created_by: 1, updated_by: 1 });
        const openOpp = await (0, opportunities_service_1.createOpportunity)({
            organization_id: org.id,
            name: 'Open Opp',
            status: 'open',
            value: 1000,
            deal_type: 'UNIFORM',
            created_by: 1,
            updated_by: 1,
            stage: opportunities_interface_1.OpportunityStage.INVOICE_SENT,
            assigned_rep_id: 1, // Added to satisfy commission prerequisites
            assigned_director_id: 2, // Added to satisfy commission prerequisites
        });
        const oppToWin = await (0, opportunities_service_1.createOpportunity)({
            organization_id: org.id,
            name: 'Opp to be Won',
            status: 'open',
            value: 5000,
            deal_type: 'JACKETS',
            created_by: 1,
            updated_by: 1,
            stage: opportunities_interface_1.OpportunityStage.LEAD_ASSIGNED, // Start from the beginning
            assigned_rep_id: 1, // Added to satisfy commission prerequisites
            assigned_director_id: 2, // Added to satisfy commission prerequisites
        });
        // Correct stage progression
        await (0, opportunities_service_1.updateOpportunityStage)(oppToWin.id, opportunities_interface_1.OpportunityStage.CONTACT_INITIATED, 1);
        await (0, opportunities_service_1.updateOpportunityStage)(oppToWin.id, opportunities_interface_1.OpportunityStage.MOCKUP_IN_PROGRESS, 1);
        await (0, opportunities_service_1.updateOpportunityStage)(oppToWin.id, opportunities_interface_1.OpportunityStage.MOCKUP_APPROVED, 1);
        await (0, opportunities_service_1.updateOpportunityStage)(oppToWin.id, opportunities_interface_1.OpportunityStage.INVOICE_SENT, 1);
        await (0, opportunities_service_1.updateOpportunityStage)(oppToWin.id, opportunities_interface_1.OpportunityStage.PAYMENT_RECEIVED, 1);
        const closedWonOpp = await (0, opportunities_service_1.updateOpportunityStage)(oppToWin.id, opportunities_interface_1.OpportunityStage.CLOSED_WON, 1, 'Won Deal', { actual_revenue: 5000, actual_cost: 3000 });
        return { org, openOpp, closedWonOpp };
    };
    it('should create an order from a valid CLOSED_WON opportunity', async () => {
        const { closedWonOpp } = await createTestOrgAndOpps();
        const order = await (0, orders_service_1.createOrderFromOpportunity)(closedWonOpp.id);
        expect(order).toBeDefined();
        expect(order.opportunity_id).toBe(closedWonOpp.id);
        expect(order.organization_id).toBe(closedWonOpp.organization_id);
        expect(order.deal_type).toBe(closedWonOpp.deal_type);
        expect(order.status).toBe(orders_interface_1.OrderStatus.CREATED);
    });
    it('should reject order creation when opportunity does not exist', async () => {
        await expect((0, orders_service_1.createOrderFromOpportunity)(99999)).rejects.toThrow('Opportunity not found');
    });
    it('should reject order creation when opportunity is not CLOSED_WON', async () => {
        const { openOpp } = await createTestOrgAndOpps();
        await expect((0, orders_service_1.createOrderFromOpportunity)(openOpp.id)).rejects.toThrow('Only CLOSED_WON opportunities can be converted to orders');
    });
    it('should reject duplicate order creation for the same opportunity', async () => {
        const { closedWonOpp } = await createTestOrgAndOpps();
        // First creation is successful
        await (0, orders_service_1.createOrderFromOpportunity)(closedWonOpp.id);
        // Second attempt for the same opportunity should fail
        await expect((0, orders_service_1.createOrderFromOpportunity)(closedWonOpp.id)).rejects.toThrow('Order already exists for this opportunity');
    });
    it('should return an order by id after creation', async () => {
        const { closedWonOpp } = await createTestOrgAndOpps();
        const createdOrder = await (0, orders_service_1.createOrderFromOpportunity)(closedWonOpp.id);
        const fetchedOrder = await (0, orders_service_1.getOrderById)(createdOrder.id);
        expect(fetchedOrder).toBeDefined();
        expect(fetchedOrder.id).toBe(createdOrder.id);
    });
    it('should return an order by opportunity id after creation', async () => {
        const { closedWonOpp } = await createTestOrgAndOpps();
        const createdOrder = await (0, orders_service_1.createOrderFromOpportunity)(closedWonOpp.id);
        const fetchedOrder = await (0, orders_service_1.getOrderByOpportunityId)(closedWonOpp.id);
        expect(fetchedOrder).toBeDefined();
        expect(fetchedOrder.id).toBe(createdOrder.id);
        expect(fetchedOrder.opportunity_id).toBe(closedWonOpp.id);
    });
    it('should return null from getOrderById when missing', async () => {
        const fetchedOrder = await (0, orders_service_1.getOrderById)(99999);
        expect(fetchedOrder).toBeNull();
    });
    it('should return null from getOrderByOpportunityId when missing', async () => {
        const { openOpp } = await createTestOrgAndOpps(); // An opportunity with no order
        const fetchedOrder = await (0, orders_service_1.getOrderByOpportunityId)(openOpp.id);
        expect(fetchedOrder).toBeNull();
    });
});
//# sourceMappingURL=orders.test.js.map