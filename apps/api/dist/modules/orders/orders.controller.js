"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderFromOpportunityHandler = createOrderFromOpportunityHandler;
exports.getOrderByIdHandler = getOrderByIdHandler;
exports.getOrderByOpportunityIdHandler = getOrderByOpportunityIdHandler;
const orders_service_1 = require("./orders.service");
async function createOrderFromOpportunityHandler(request, reply) {
    try {
        const { opportunityId } = request.params;
        const order = await (0, orders_service_1.createOrderFromOpportunity)(Number(opportunityId));
        reply.code(201).send(order);
    }
    catch (error) {
        reply.code(400).send({ error: error.message });
    }
}
async function getOrderByIdHandler(request, reply) {
    try {
        const { id } = request.params;
        const order = await (0, orders_service_1.getOrderById)(Number(id));
        if (!order) {
            return reply.code(404).send({ error: 'Order not found' });
        }
        reply.send(order);
    }
    catch (error) {
        reply.code(400).send({ error: error.message });
    }
}
async function getOrderByOpportunityIdHandler(request, reply) {
    try {
        const { opportunityId } = request.params;
        const order = await (0, orders_service_1.getOrderByOpportunityId)(Number(opportunityId));
        if (!order) {
            return reply.code(404).send({ error: 'Order not found for this opportunity' });
        }
        reply.send(order);
    }
    catch (error) {
        reply.code(400).send({ error: error.message });
    }
}
//# sourceMappingURL=orders.controller.js.map