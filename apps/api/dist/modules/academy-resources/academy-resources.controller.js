"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listResourcesHandler = listResourcesHandler;
exports.getResourceHandler = getResourceHandler;
const academy_resources_service_1 = require("./academy-resources.service");
async function listResourcesHandler(request, reply) {
    try {
        const resources = await (0, academy_resources_service_1.listResources)();
        return reply.send(resources);
    }
    catch (error) {
        console.error('[academy-resources:list]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function getResourceHandler(request, reply) {
    try {
        const { slug } = request.params;
        const resource = await (0, academy_resources_service_1.getResourceBySlug)(slug);
        if (!resource)
            return reply.code(404).send({ message: 'Resource not found' });
        return reply.send(resource);
    }
    catch (error) {
        console.error('[academy-resources:get]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
//# sourceMappingURL=academy-resources.controller.js.map