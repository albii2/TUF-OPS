"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRoutes = orderRoutes;
const auth_1 = require("../../auth");
const orders_controller_1 = require("./orders.controller");
async function orderRoutes(server) {
    server.get('/', { preHandler: [(0, auth_1.requireCertification)()] }, orders_controller_1.getOrdersHandler);
    server.post('/', { preHandler: [(0, auth_1.requireCertification)()] }, orders_controller_1.createOrderHandler);
    server.get('/:id', { preHandler: [(0, auth_1.requireCertification)()] }, orders_controller_1.getOrderByIdHandler);
}
//# sourceMappingURL=orders.routes.js.map