"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorRoutes = vendorRoutes;
const auth_1 = require("../../auth");
const vendors_controller_1 = require("./vendors.controller");
const vendorAuth = [(0, auth_1.requireCertification)()];
const vendorWriteAuth = [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.CONFIGURE_TERRITORY)];
const vendorOpsAuth = [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.VIEW_OPERATIONS_QUEUE)];
async function vendorRoutes(fastify) {
    // Vendor Management
    fastify.post('/vendors', { preHandler: vendorWriteAuth }, vendors_controller_1.createVendorController);
    fastify.get('/vendors', { preHandler: vendorAuth }, vendors_controller_1.getVendorsController);
    fastify.get('/vendors/:id', { preHandler: vendorAuth }, vendors_controller_1.getVendorController);
    fastify.patch('/vendors/:id', { preHandler: vendorWriteAuth }, vendors_controller_1.updateVendorController);
    // Vendor Agreements
    fastify.post('/vendors/:vendorId/agreements', { preHandler: vendorWriteAuth }, vendors_controller_1.createVendorAgreementController);
    fastify.get('/vendors/:vendorId/agreements', { preHandler: vendorAuth }, vendors_controller_1.getVendorAgreementsController);
    fastify.get('/vendors/:vendorId/agreements/active', { preHandler: vendorAuth }, vendors_controller_1.getActiveVendorAgreementController);
    // Performance Metrics
    fastify.post('/vendors/:vendorId/performance', { preHandler: vendorOpsAuth }, vendors_controller_1.recordPerformanceController);
    fastify.get('/vendors/:vendorId/performance', { preHandler: vendorAuth }, vendors_controller_1.getPerformanceController);
    // Vendor Payments
    fastify.post('/vendors/:vendorId/payments', { preHandler: vendorWriteAuth }, vendors_controller_1.createPaymentController);
    fastify.get('/vendors/:vendorId/payments', { preHandler: vendorAuth }, vendors_controller_1.getPaymentsController);
    fastify.patch('/vendors/payments/:paymentId/status', { preHandler: vendorWriteAuth }, vendors_controller_1.updatePaymentStatusController);
    // Order Assignment
    fastify.post('/orders/:orderId/assign-vendor', { preHandler: vendorOpsAuth }, vendors_controller_1.assignOrderController);
    fastify.get('/orders/:orderId/vendor-assignments', { preHandler: vendorAuth }, vendors_controller_1.getOrderAssignmentsController);
    fastify.get('/vendors/:vendorId/active-orders', { preHandler: vendorAuth }, vendors_controller_1.getVendorActiveOrdersController);
    // Settlement
    fastify.patch('/orders/:orderId/settlement', { preHandler: vendorWriteAuth }, vendors_controller_1.updateSettlementController);
    fastify.get('/orders/pending-vendor-payments', { preHandler: vendorAuth }, vendors_controller_1.getPendingPaymentsController);
    // Analytics
    fastify.get('/vendors/:vendorId/capacity-utilization', { preHandler: vendorAuth }, vendors_controller_1.getCapacityUtilizationController);
    fastify.get('/vendors/capacity-status/all', { preHandler: vendorAuth }, vendors_controller_1.getAllCapacityStatusController);
}
//# sourceMappingURL=vendors.routes.js.map