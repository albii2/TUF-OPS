"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.intakeRoutes = intakeRoutes;
const intake_controller_1 = require("./intake.controller");
async function intakeRoutes(server) {
    // GET /api/intake — list all
    server.get('/', intake_controller_1.listHandler);
    // GET /api/intake/decisions — open critical/high decisions
    server.get('/decisions', intake_controller_1.decisionsHandler);
    // GET /api/intake/:id — single item
    server.get('/:id', intake_controller_1.getHandler);
    // POST /api/intake — create
    server.post('/', intake_controller_1.createHandler);
    // PUT /api/intake/:id — update
    server.put('/:id', intake_controller_1.updateHandler);
    // DELETE /api/intake/:id — delete
    server.delete('/:id', intake_controller_1.deleteHandler);
}
//# sourceMappingURL=intake.routes.js.map