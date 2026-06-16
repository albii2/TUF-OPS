"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRoutes = orderRoutes;
const orders_controller_1 = require("./orders.controller");
async function orderRoutes(server) {
    server.get('/', orders_controller_1.getOrdersHandler);
    server.post('/', orders_controller_1.createOrderHandler);
    server.get('/:id', orders_controller_1.getOrderByIdHandler);
}
//# sourceMappingURL=orders.routes.js.map