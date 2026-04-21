"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const production_requests_routes_1 = require("./modules/production-requests/production-requests.routes");
const reporting_routes_1 = require("./modules/reporting/reporting.routes");
const activities_routes_1 = require("./modules/activities/activities.routes");
const opportunities_routes_1 = require("./modules/opportunities/opportunities.routes");
const organizations_routes_1 = require("./modules/organizations/organizations.routes");
const fastify_1 = __importDefault(require("fastify"));
const server = (0, fastify_1.default)();
server.register(organizations_routes_1.organizationRoutes, { prefix: '/organizations' });
server.register(opportunities_routes_1.opportunityRoutes, { prefix: '/opportunities' });
server.register(activities_routes_1.activityRoutes, { prefix: '/activities' });
server.register(reporting_routes_1.reportingRoutes, { prefix: '/reporting' });
server.register(production_requests_routes_1.productionRequestRoutes, { prefix: '/production-requests' });
const start = async () => {
    const port = 3001;
    try {
        await server.listen({ port });
        console.log(`Server listening on http://localhost:${port}`);
    }
    catch (err) {
        console.error(err);
        server.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=index.js.map