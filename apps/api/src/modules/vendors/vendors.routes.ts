import { FastifyInstance } from 'fastify';
import { requireCertification, requirePermission, permissions } from '../../auth';
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

const vendorAuth = [requireCertification()];
const vendorWriteAuth = [requireCertification(), requirePermission(permissions.CONFIGURE_TERRITORY)];
const vendorOpsAuth = [requireCertification(), requirePermission(permissions.VIEW_OPERATIONS_QUEUE)];

export async function vendorRoutes(fastify: FastifyInstance) {
  // Vendor Management
  fastify.post('/vendors', { preHandler: vendorWriteAuth }, createVendorController);
  fastify.get('/vendors', { preHandler: vendorAuth }, getVendorsController);
  fastify.get('/vendors/:id', { preHandler: vendorAuth }, getVendorController);
  fastify.patch('/vendors/:id', { preHandler: vendorWriteAuth }, updateVendorController);

  // Vendor Agreements
  fastify.post('/vendors/:vendorId/agreements', { preHandler: vendorWriteAuth }, createVendorAgreementController);
  fastify.get('/vendors/:vendorId/agreements', { preHandler: vendorAuth }, getVendorAgreementsController);
  fastify.get('/vendors/:vendorId/agreements/active', { preHandler: vendorAuth }, getActiveVendorAgreementController);

  // Performance Metrics
  fastify.post('/vendors/:vendorId/performance', { preHandler: vendorOpsAuth }, recordPerformanceController);
  fastify.get('/vendors/:vendorId/performance', { preHandler: vendorAuth }, getPerformanceController);

  // Vendor Payments
  fastify.post('/vendors/:vendorId/payments', { preHandler: vendorWriteAuth }, createPaymentController);
  fastify.get('/vendors/:vendorId/payments', { preHandler: vendorAuth }, getPaymentsController);
  fastify.patch('/vendors/payments/:paymentId/status', { preHandler: vendorWriteAuth }, updatePaymentStatusController);

  // Order Assignment
  fastify.post('/orders/:orderId/assign-vendor', { preHandler: vendorOpsAuth }, assignOrderController);
  fastify.get('/orders/:orderId/vendor-assignments', { preHandler: vendorAuth }, getOrderAssignmentsController);
  fastify.get('/vendors/:vendorId/active-orders', { preHandler: vendorAuth }, getVendorActiveOrdersController);

  // Settlement
  fastify.patch('/orders/:orderId/settlement', { preHandler: vendorWriteAuth }, updateSettlementController);
  fastify.get('/orders/pending-vendor-payments', { preHandler: vendorAuth }, getPendingPaymentsController);

  // Analytics
  fastify.get('/vendors/:vendorId/capacity-utilization', { preHandler: vendorAuth }, getCapacityUtilizationController);
  fastify.get('/vendors/capacity-status/all', { preHandler: vendorAuth }, getAllCapacityStatusController);
}
