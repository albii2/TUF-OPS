import { FastifyRequest, FastifyReply } from 'fastify';
import {
  createVendor,
  getVendorById,
  getVendors,
  updateVendor,
  createVendorAgreement,
  getVendorAgreements,
  getActiveVendorAgreement,
  recordVendorPerformance,
  getVendorPerformance,
  createVendorPayment,
  getVendorPayments,
  updateVendorPaymentStatus,
  assignOrderToVendor,
  getOrderVendorAssignments,
  getVendorActiveOrders,
  updateOrderVendorSettlement,
  getPendingVendorPayments,
  getVendorCapacityUtilization,
  getAllVendorsCapacityStatus,
} from './vendors.service';

// Vendor Management
export async function createVendorController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const vendor = await createVendor(request.body as any);
    return reply.code(201).send(vendor);
  } catch (error) {
    return reply.code(400).send({ error: (error as Error).message });
  }
}

export async function getVendorController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const vendor = await getVendorById(parseInt(id, 10));
    if (!vendor) {
      return reply.code(404).send({ error: 'Vendor not found' });
    }
    return reply.send(vendor);
  } catch (error) {
    return reply.code(400).send({ error: (error as Error).message });
  }
}

export async function getVendorsController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { status, tier, limit, offset } = request.query as any;
    const vendors = await getVendors({ status, tier, limit: limit ? parseInt(limit, 10) : undefined, offset: offset ? parseInt(offset, 10) : undefined });
    return reply.send(vendors);
  } catch (error) {
    return reply.code(400).send({ error: (error as Error).message });
  }
}

export async function updateVendorController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const vendor = await updateVendor(parseInt(id, 10), request.body as any);
    return reply.send(vendor);
  } catch (error) {
    return reply.code(400).send({ error: (error as Error).message });
  }
}

// Vendor Agreements
export async function createVendorAgreementController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const agreement = await createVendorAgreement(request.body as any);
    return reply.code(201).send(agreement);
  } catch (error) {
    return reply.code(400).send({ error: (error as Error).message });
  }
}

export async function getVendorAgreementsController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { vendorId } = request.params as { vendorId: string };
    const agreements = await getVendorAgreements(parseInt(vendorId, 10));
    return reply.send(agreements);
  } catch (error) {
    return reply.code(400).send({ error: (error as Error).message });
  }
}

export async function getActiveVendorAgreementController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { vendorId } = request.params as { vendorId: string };
    const agreement = await getActiveVendorAgreement(parseInt(vendorId, 10));
    if (!agreement) {
      return reply.code(404).send({ error: 'No active agreement found' });
    }
    return reply.send(agreement);
  } catch (error) {
    return reply.code(400).send({ error: (error as Error).message });
  }
}

// Performance Metrics
export async function recordPerformanceController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const metric = await recordVendorPerformance(request.body as any);
    return reply.code(201).send(metric);
  } catch (error) {
    return reply.code(400).send({ error: (error as Error).message });
  }
}

export async function getPerformanceController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { vendorId } = request.params as { vendorId: string };
    const { monthsBack } = request.query as any;
    const metrics = await getVendorPerformance(parseInt(vendorId, 10), monthsBack ? parseInt(monthsBack, 10) : 6);
    return reply.send(metrics);
  } catch (error) {
    return reply.code(400).send({ error: (error as Error).message });
  }
}

// Vendor Payments
export async function createPaymentController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payment = await createVendorPayment(request.body as any);
    return reply.code(201).send(payment);
  } catch (error) {
    return reply.code(400).send({ error: (error as Error).message });
  }
}

export async function getPaymentsController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { vendorId } = request.params as { vendorId: string };
    const { status } = request.query as any;
    const payments = await getVendorPayments(parseInt(vendorId, 10), { status });
    return reply.send(payments);
  } catch (error) {
    return reply.code(400).send({ error: (error as Error).message });
  }
}

export async function updatePaymentStatusController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { paymentId } = request.params as { paymentId: string };
    const { status } = request.body as { status: string };
    const payment = await updateVendorPaymentStatus(parseInt(paymentId, 10), status);
    return reply.send(payment);
  } catch (error) {
    return reply.code(400).send({ error: (error as Error).message });
  }
}

// Order Assignment
export async function assignOrderController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { orderId } = request.params as { orderId: string };
    const { vendorId, quantityAllocated, notes } = request.body as any;
    const assignment = await assignOrderToVendor(
      parseInt(orderId, 10),
      vendorId,
      quantityAllocated,
      notes
    );
    return reply.code(201).send(assignment);
  } catch (error) {
    return reply.code(400).send({ error: (error as Error).message });
  }
}

export async function getOrderAssignmentsController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { orderId } = request.params as { orderId: string };
    const assignments = await getOrderVendorAssignments(parseInt(orderId, 10));
    return reply.send(assignments);
  } catch (error) {
    return reply.code(400).send({ error: (error as Error).message });
  }
}

export async function getVendorActiveOrdersController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { vendorId } = request.params as { vendorId: string };
    const orders = await getVendorActiveOrders(parseInt(vendorId, 10));
    return reply.send(orders);
  } catch (error) {
    return reply.code(400).send({ error: (error as Error).message });
  }
}

// Settlement
export async function updateSettlementController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { orderId } = request.params as { orderId: string };
    const order = await updateOrderVendorSettlement(parseInt(orderId, 10), request.body as any);
    return reply.send(order);
  } catch (error) {
    return reply.code(400).send({ error: (error as Error).message });
  }
}

export async function getPendingPaymentsController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const orders = await getPendingVendorPayments();
    return reply.send(orders);
  } catch (error) {
    return reply.code(400).send({ error: (error as Error).message });
  }
}

// Analytics
export async function getCapacityUtilizationController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { vendorId } = request.params as { vendorId: string };
    const { month } = request.query as any;
    const utilization = await getVendorCapacityUtilization(
      parseInt(vendorId, 10),
      month ? new Date(month) : undefined
    );
    return reply.send(utilization);
  } catch (error) {
    return reply.code(400).send({ error: (error as Error).message });
  }
}

export async function getAllCapacityStatusController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { month } = request.query as any;
    const capacityStatus = await getAllVendorsCapacityStatus(month ? new Date(month) : undefined);
    return reply.send(capacityStatus);
  } catch (error) {
    return reply.code(400).send({ error: (error as Error).message });
  }
}
