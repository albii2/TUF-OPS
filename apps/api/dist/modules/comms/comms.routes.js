"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commsRoutes = commsRoutes;
const comms_controller_1 = require("./comms.controller");
async function commsRoutes(server) {
    server.get('/', comms_controller_1.listHandler);
    server.get('/upcoming', comms_controller_1.upcomingHandler);
    server.get('/:id', comms_controller_1.getHandler);
    server.post('/', comms_controller_1.createHandler);
    server.put('/:id', comms_controller_1.updateHandler);
    server.delete('/:id', comms_controller_1.deleteHandler);
}
//# sourceMappingURL=comms.routes.js.map