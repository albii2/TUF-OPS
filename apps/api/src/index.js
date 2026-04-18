"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const organizations_routes_1 = require("./modules/organizations/organizations.routes");
const server = (0, fastify_1.default)();
server.register(organizations_routes_1.organizationRoutes, { prefix: '/organizations' });
const start = async () => {
    try {
        await server.listen({ port: 3000 });
        console.log('Server listening on http://localhost:3000');
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
