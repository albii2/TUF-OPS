import { FastifyInstance } from 'fastify';
import {
  createVendorController,
  getVendorController,
  getVendorsController,
  updateVendorController,
  createVendorAgreementController,
  getVendorAgreementsController,
  getActiveVendorAgreementController,
  recordPerformanceController,
  getPerformanceController,
  createPaymentController,
  getPaymentsController,
  updatePaymentStatusController,
  assignOrderController,
  getOrderAssignmentsController,
  getVendorActiveOrdersController,
  updateSettlementController,
  getPendingPaymentsController,
  getCapacityUtilizationController,
  getAllCapacityStatusController,
} from './vendors.controller';

export async function vendorRoutes(fastify: FastifyInstance) {
  // Vendor Management
  fastify.post('/vendors', createVendorController);
  fastify.get('/vendors', getVendorsController);
  fastify.get('/vendors/:id', getVendorController);
  fastify.patch('/vendors/:id', updateVendorController);

  // Vendor Agreements
  fastify.post('/vendors/:vendorId/agreements', createVendorAgreementController);
  fastify.get('/vendors/:vendorId/agreements', getVendorAgreementsController);
  fastify.get('/vendors/:vendorId/agreements/active', getActiveVendorAgreementController);

  // Performance Metrics
  fastify.post('/vendors/:vendorId/performance', recordPerformanceController);
  fastify.get('/vendors/:vendorId/performance', getPerformanceController);

  // Vendor Payments
  fastify.post('/vendors/:vendorId/payments', createPaymentController);
  fastify.get('/vendors/:vendorId/payments', getPaymentsController);
  fastify.patch('/vendors/payments/:paymentId/status', updatePaymentStatusController);

  // Order Assignment
  fastify.post('/orders/:orderId/assign-vendor', assignOrderController);
  fastify.get('/orders/:orderId/vendor-assignments', getOrderAssignmentsController);
  fastify.get('/vendors/:vendorId/active-orders', getVendorActiveOrdersController);

  // Settlement
  fastify.patch('/orders/:orderId/settlement', updateSettlementController);
  fastify.get('/orders/pending-vendor-payments', getPendingPaymentsController);

  // Analytics
  fastify.get('/vendors/:vendorId/capacity-utilization', getCapacityUtilizationController);
  fastify.get('/vendors/capacity-status/all', getAllCapacityStatusController);
}
