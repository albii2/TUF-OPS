"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderHandler = createOrderHandler;
exports.getOrdersHandler = getOrdersHandler;
exports.getOrderByIdHandler = getOrderByIdHandler;
const orders_service_1 = require("./orders.service");
async function createOrderHandler(request, reply) {
    try {
        const { opportunityId } = request.body;
        if (!opportunityId) {
            return reply.code(400).send({ message: 'opportunityId is required' });
        }
        const order = await (0, orders_service_1.createOrderFromOpportunity)(Number(opportunityId));
        return reply.code(201).send(order);
    }
    catch (error) {
        return reply.code(400).send({ message: error.message });
    }
}
async function getOrdersHandler(request, reply) {
    const orders = await (0, orders_service_1.getOrders)();
    return reply.send(orders);
}
async function getOrderByIdHandler(request, reply) {
    try {
        const { id } = request.params;
        const order = await (0, orders_service_1.getOrderById)(Number(id));
        if (!order) {
            return reply.code(404).send({ message: 'Order not found' });
        }
        return reply.send(order);
    }
    catch (error) {
        return reply.code(400).send({ message: error.message });
    }
}
//# sourceMappingURL=orders.controller.js.map