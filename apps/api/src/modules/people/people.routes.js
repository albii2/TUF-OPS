"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.peopleRoutes = peopleRoutes;
const people_controller_1 = require("./people.controller");
async function peopleRoutes(server) {
    server.get('/', people_controller_1.listHandler);
    server.get('/stats', people_controller_1.statsHandler);
    server.post('/', people_controller_1.createHandler);
    server.put('/:id/advance', people_controller_1.advanceHandler);
}
//# sourceMappingURL=people.routes.js.map