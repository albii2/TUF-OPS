"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorRoutes = vendorRoutes;
const vendors_controller_1 = require("./vendors.controller");
async function vendorRoutes(fastify) {
    // Vendor Management
    fastify.post('/vendors', vendors_controller_1.createVendorController);
    fastify.get('/vendors', vendors_controller_1.getVendorsController);
    fastify.get('/vendors/:id', vendors_controller_1.getVendorController);
    fastify.patch('/vendors/:id', vendors_controller_1.updateVendorController);
    // Vendor Agreements
    fastify.post('/vendors/:vendorId/agreements', vendors_controller_1.createVendorAgreementController);
    fastify.get('/vendors/:vendorId/agreements', vendors_controller_1.getVendorAgreementsController);
    fastify.get('/vendors/:vendorId/agreements/active', vendors_controller_1.getActiveVendorAgreementController);
    // Performance Metrics
    fastify.post('/vendors/:vendorId/performance', vendors_controller_1.recordPerformanceController);
    fastify.get('/vendors/:vendorId/performance', vendors_controller_1.getPerformanceController);
    // Vendor Payments
    fastify.post('/vendors/:vendorId/payments', vendors_controller_1.createPaymentController);
    fastify.get('/vendors/:vendorId/payments', vendors_controller_1.getPaymentsController);
    fastify.patch('/vendors/payments/:paymentId/status', vendors_controller_1.updatePaymentStatusController);
    // Order Assignment
    fastify.post('/orders/:orderId/assign-vendor', vendors_controller_1.assignOrderController);
    fastify.get('/orders/:orderId/vendor-assignments', vendors_controller_1.getOrderAssignmentsController);
    fastify.get('/vendors/:vendorId/active-orders', vendors_controller_1.getVendorActiveOrdersController);
    // Settlement
    fastify.patch('/orders/:orderId/settlement', vendors_controller_1.updateSettlementController);
    fastify.get('/orders/pending-vendor-payments', vendors_controller_1.getPendingPaymentsController);
    // Analytics
    fastify.get('/vendors/:vendorId/capacity-utilization', vendors_controller_1.getCapacityUtilizationController);
    fastify.get('/vendors/capacity-status/all', vendors_controller_1.getAllCapacityStatusController);
}
//# sourceMappingURL=vendors.routes.js.map