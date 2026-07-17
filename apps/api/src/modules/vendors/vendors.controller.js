"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVendorController = createVendorController;
exports.getVendorController = getVendorController;
exports.getVendorsController = getVendorsController;
exports.updateVendorController = updateVendorController;
exports.createVendorAgreementController = createVendorAgreementController;
exports.getVendorAgreementsController = getVendorAgreementsController;
exports.getActiveVendorAgreementController = getActiveVendorAgreementController;
exports.recordPerformanceController = recordPerformanceController;
exports.getPerformanceController = getPerformanceController;
exports.createPaymentController = createPaymentController;
exports.getPaymentsController = getPaymentsController;
exports.updatePaymentStatusController = updatePaymentStatusController;
exports.assignOrderController = assignOrderController;
exports.getOrderAssignmentsController = getOrderAssignmentsController;
exports.getVendorActiveOrdersController = getVendorActiveOrdersController;
exports.updateSettlementController = updateSettlementController;
exports.getPendingPaymentsController = getPendingPaymentsController;
exports.getCapacityUtilizationController = getCapacityUtilizationController;
exports.getAllCapacityStatusController = getAllCapacityStatusController;
const vendors_service_1 = require("./vendors.service");
// Vendor Management
async function createVendorController(request, reply) {
    try {
        const body = request.body;
        if (!body.name?.trim()) {
            return reply.code(400).send({ error: 'Vendor name is required' });
        }
        const vendor = await (0, vendors_service_1.createVendor)(body);
        return reply.code(201).send(vendor);
    }
    catch (error) {
        return reply.code(400).send({ error: error.message });
    }
}
async function getVendorController(request, reply) {
    try {
        const { id } = request.params;
        const vendor = await (0, vendors_service_1.getVendorById)(parseInt(id, 10));
        if (!vendor) {
            return reply.code(404).send({ error: 'Vendor not found' });
        }
        return reply.send(vendor);
    }
    catch (error) {
        return reply.code(400).send({ error: error.message });
    }
}
async function getVendorsController(request, reply) {
    try {
        const { status, tier, limit, offset } = request.query;
        const vendors = await (0, vendors_service_1.getVendors)({ status, tier, limit: limit ? parseInt(limit, 10) : undefined, offset: offset ? parseInt(offset, 10) : undefined });
        return reply.send(vendors);
    }
    catch (error) {
        return reply.code(400).send({ error: error.message });
    }
}
async function updateVendorController(request, reply) {
    try {
        const { id } = request.params;
        const vendor = await (0, vendors_service_1.updateVendor)(parseInt(id, 10), request.body);
        return reply.send(vendor);
    }
    catch (error) {
        return reply.code(400).send({ error: error.message });
    }
}
// Vendor Agreements
async function createVendorAgreementController(request, reply) {
    try {
        const agreement = await (0, vendors_service_1.createVendorAgreement)(request.body);
        return reply.code(201).send(agreement);
    }
    catch (error) {
        return reply.code(400).send({ error: error.message });
    }
}
async function getVendorAgreementsController(request, reply) {
    try {
        const { vendorId } = request.params;
        const agreements = await (0, vendors_service_1.getVendorAgreements)(parseInt(vendorId, 10));
        return reply.send(agreements);
    }
    catch (error) {
        return reply.code(400).send({ error: error.message });
    }
}
async function getActiveVendorAgreementController(request, reply) {
    try {
        const { vendorId } = request.params;
        const agreement = await (0, vendors_service_1.getActiveVendorAgreement)(parseInt(vendorId, 10));
        if (!agreement) {
            return reply.code(404).send({ error: 'No active agreement found' });
        }
        return reply.send(agreement);
    }
    catch (error) {
        return reply.code(400).send({ error: error.message });
    }
}
// Performance Metrics
async function recordPerformanceController(request, reply) {
    try {
        const metric = await (0, vendors_service_1.recordVendorPerformance)(request.body);
        return reply.code(201).send(metric);
    }
    catch (error) {
        return reply.code(400).send({ error: error.message });
    }
}
async function getPerformanceController(request, reply) {
    try {
        const { vendorId } = request.params;
        const { monthsBack } = request.query;
        const metrics = await (0, vendors_service_1.getVendorPerformance)(parseInt(vendorId, 10), monthsBack ? parseInt(monthsBack, 10) : 6);
        return reply.send(metrics);
    }
    catch (error) {
        return reply.code(400).send({ error: error.message });
    }
}
// Vendor Payments
async function createPaymentController(request, reply) {
    try {
        const payment = await (0, vendors_service_1.createVendorPayment)(request.body);
        return reply.code(201).send(payment);
    }
    catch (error) {
        return reply.code(400).send({ error: error.message });
    }
}
async function getPaymentsController(request, reply) {
    try {
        const { vendorId } = request.params;
        const { status } = request.query;
        const payments = await (0, vendors_service_1.getVendorPayments)(parseInt(vendorId, 10), { status });
        return reply.send(payments);
    }
    catch (error) {
        return reply.code(400).send({ error: error.message });
    }
}
async function updatePaymentStatusController(request, reply) {
    try {
        const { paymentId } = request.params;
        const { status } = request.body;
        const payment = await (0, vendors_service_1.updateVendorPaymentStatus)(parseInt(paymentId, 10), status);
        return reply.send(payment);
    }
    catch (error) {
        return reply.code(400).send({ error: error.message });
    }
}
// Order Assignment
async function assignOrderController(request, reply) {
    try {
        const { orderId } = request.params;
        const { vendorId, quantityAllocated, notes } = request.body;
        const assignment = await (0, vendors_service_1.assignOrderToVendor)(parseInt(orderId, 10), vendorId, quantityAllocated, notes);
        return reply.code(201).send(assignment);
    }
    catch (error) {
        return reply.code(400).send({ error: error.message });
    }
}
async function getOrderAssignmentsController(request, reply) {
    try {
        const { orderId } = request.params;
        const assignments = await (0, vendors_service_1.getOrderVendorAssignments)(parseInt(orderId, 10));
        return reply.send(assignments);
    }
    catch (error) {
        return reply.code(400).send({ error: error.message });
    }
}
async function getVendorActiveOrdersController(request, reply) {
    try {
        const { vendorId } = request.params;
        const orders = await (0, vendors_service_1.getVendorActiveOrders)(parseInt(vendorId, 10));
        return reply.send(orders);
    }
    catch (error) {
        return reply.code(400).send({ error: error.message });
    }
}
// Settlement
async function updateSettlementController(request, reply) {
    try {
        const { orderId } = request.params;
        const order = await (0, vendors_service_1.updateOrderVendorSettlement)(parseInt(orderId, 10), request.body);
        return reply.send(order);
    }
    catch (error) {
        return reply.code(400).send({ error: error.message });
    }
}
async function getPendingPaymentsController(request, reply) {
    try {
        const orders = await (0, vendors_service_1.getPendingVendorPayments)();
        return reply.send(orders);
    }
    catch (error) {
        return reply.code(400).send({ error: error.message });
    }
}
// Analytics
async function getCapacityUtilizationController(request, reply) {
    try {
        const { vendorId } = request.params;
        const { month } = request.query;
        const utilization = await (0, vendors_service_1.getVendorCapacityUtilization)(parseInt(vendorId, 10), month ? new Date(month) : undefined);
        return reply.send(utilization);
    }
    catch (error) {
        return reply.code(400).send({ error: error.message });
    }
}
async function getAllCapacityStatusController(request, reply) {
    try {
        const { month } = request.query;
        const capacityStatus = await (0, vendors_service_1.getAllVendorsCapacityStatus)(month ? new Date(month) : undefined);
        return reply.send(capacityStatus);
    }
    catch (error) {
        return reply.code(400).send({ error: error.message });
    }
}
//# sourceMappingURL=vendors.controller.js.map