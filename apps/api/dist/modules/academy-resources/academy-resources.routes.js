"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.academyResourcesRoutes = academyResourcesRoutes;
const auth_1 = require("../../auth");
const academy_resources_controller_1 = require("./academy-resources.controller");
async function academyResourcesRoutes(server) {
    // Any authenticated user (reps included) can read Academy resources
    server.addHook('onRequest', async (request, reply) => {
        await (0, auth_1.authMiddleware)(request);
        if (!request.currentUser) {
            return reply.code(401).send({ error: 'Authentication required' });
        }
    });
    server.get('/', academy_resources_controller_1.listResourcesHandler);
    server.get('/:slug', academy_resources_controller_1.getResourceHandler);
}
//# sourceMappingURL=academy-resources.routes.js.map