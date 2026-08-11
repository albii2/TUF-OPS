"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workItemsRoutes = workItemsRoutes;
const auth_1 = require("../../auth");
const work_items_controller_1 = require("./work-items.controller");
async function workItemsRoutes(server) {
    const pre = [(0, auth_1.requireCertification)()];
    server.get('/', { preHandler: pre }, work_items_controller_1.listWorkItemsHandler);
    server.post('/', { preHandler: pre }, work_items_controller_1.createWorkItemHandler);
    server.put('/:id', { preHandler: pre }, work_items_controller_1.updateWorkItemHandler);
    server.patch('/:id/status', { preHandler: pre }, work_items_controller_1.updateWorkItemStatusHandler);
}
//# sourceMappingURL=work-items.routes.js.map