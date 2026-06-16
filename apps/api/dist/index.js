"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const activities_routes_1 = require("./modules/activities/activities.routes");
const opportunities_routes_1 = require("./modules/opportunities/opportunities.routes");
const organizations_routes_1 = require("./modules/organizations/organizations.routes");
const production_requests_routes_1 = require("./modules/production-requests/production-requests.routes");
const reporting_routes_1 = require("./modules/reporting/reporting.routes");
const orders_routes_1 = require("./modules/orders/orders.routes");
const creative_requests_routes_1 = require("./modules/creative-requests/creative-requests.routes");
const training_routes_1 = require("./modules/training/training.routes");
const users_routes_1 = require("./modules/users/users.routes");
const users_service_1 = require("./modules/users/users.service");
const database_1 = require("@packages/database");
const server = (0, fastify_1.default)();
const port = Number(process.env.PORT || 4000);
const webDistPath = process.env.WEB_DIST_PATH || node_path_1.default.resolve(__dirname, '../../web/dist');
const indexHtmlPath = node_path_1.default.join(webDistPath, 'index.html');
const frontendRoutePattern = /^\/($|dashboard(?:\/.*)?|orders(?:\/.*)?|settings(?:\/.*)?|opportunities(?:\/.*)?|organizations(?:\/.*)?|login(?:\/.*)?|change-credential(?:\/.*)?|my-opportunities(?:\/.*)?|team-opportunities(?:\/.*)?|team-performance(?:\/.*)?|reports(?:\/.*)?|earnings(?:\/.*)?|territory(?:\/.*)?|users(?:\/.*)?|data-health(?:\/.*)?|ecosystem-pipeline(?:\/.*)?|ops-workspace(?:\/.*)?)/;
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,https://ops.tufsports.us,https://tufops.app')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
const mimeTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.webmanifest': 'application/manifest+json',
    '.webp': 'image/webp',
};
function sendStaticFile(reply, filePath) {
    const extension = node_path_1.default.extname(filePath);
    reply.type(mimeTypes[extension] || 'application/octet-stream');
    reply.header('Cache-Control', extension === '.html' ? 'no-store' : 'public, max-age=31536000, immutable');
    return reply.send((0, node_fs_1.createReadStream)(filePath));
}
function getSafeStaticPath(requestPath) {
    const cleanPath = decodeURIComponent(requestPath.split('?')[0] || '/');
    const normalized = node_path_1.default.normalize(cleanPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const resolved = node_path_1.default.join(webDistPath, normalized);
    if (!resolved.startsWith(webDistPath))
        return null;
    return (0, node_fs_1.existsSync)(resolved) ? resolved : null;
}
function acceptsHtml(acceptHeader) {
    return typeof acceptHeader === 'string' && acceptHeader.includes('text/html');
}
function hasDatabaseConfig() {
    if (process.env.NODE_ENV === 'test')
        return Boolean(process.env.TEST_DATABASE_URL || process.env.DATABASE_URL);
    return Boolean(process.env.DATABASE_URL || process.env.PGHOST);
}
function emptyDataHealthPayload(status, reason) {
    return {
        status,
        timestamp: new Date().toISOString(),
        backup_last_success_at: process.env.BACKUP_LAST_SUCCESS_AT || null,
        backup_older_than_24_hours: true,
        database: reason ? { status: 'unavailable', reason } : { status: 'available' },
        counts: {
            organizations: null,
            opportunities: null,
            users: null,
        },
    };
}
server.register(cors_1.default, {
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});
server.addHook('onRequest', async (request, reply) => {
    const host = request.headers.host?.split(':')[0];
    const forwardedProto = request.headers['x-forwarded-proto'];
    const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
    if (host === 'ops.tufsports.us' && proto === 'http' && process.env.FORCE_HTTPS !== 'false') {
        return reply.redirect(`https://ops.tufsports.us${request.url}`, 308);
    }
    const requestPath = request.url.split('?')[0];
    if (request.method === 'GET' && frontendRoutePattern.test(requestPath) && acceptsHtml(request.headers.accept) && (0, node_fs_1.existsSync)(indexHtmlPath)) {
        return sendStaticFile(reply, indexHtmlPath);
    }
});
server.register(organizations_routes_1.organizationRoutes, { prefix: '/api/organizations' });
server.register(opportunities_routes_1.opportunityRoutes, { prefix: '/api/opportunities' });
server.register(activities_routes_1.activityRoutes, { prefix: '/api/activities' });
server.register(reporting_routes_1.reportingRoutes, { prefix: '/api/reporting' });
server.register(production_requests_routes_1.productionRequestRoutes, { prefix: '/api/production-requests' });
server.register(orders_routes_1.orderRoutes, { prefix: '/api/orders' });
server.register(creative_requests_routes_1.creativeRequestRoutes, { prefix: '/api' });
server.register(users_routes_1.userRoutes, { prefix: '/api/auth' });
server.register(organizations_routes_1.organizationRoutes, { prefix: '/api/v1/organizations' });
server.register(opportunities_routes_1.opportunityRoutes, { prefix: '/api/v1/opportunities' });
server.register(activities_routes_1.activityRoutes, { prefix: '/api/v1/activities' });
server.register(reporting_routes_1.reportingRoutes, { prefix: '/api/v1/reporting' });
server.register(production_requests_routes_1.productionRequestRoutes, { prefix: '/api/v1/production-requests' });
server.register(orders_routes_1.orderRoutes, { prefix: '/api/v1/orders' });
server.register(creative_requests_routes_1.creativeRequestRoutes, { prefix: '/api/v1' });
server.register(users_routes_1.userRoutes, { prefix: '/api/v1/auth' });
server.register(organizations_routes_1.organizationRoutes, { prefix: '/organizations' });
server.register(opportunities_routes_1.opportunityRoutes, { prefix: '/opportunities' });
server.register(activities_routes_1.activityRoutes, { prefix: '/activities' });
server.register(reporting_routes_1.reportingRoutes, { prefix: '/reporting' });
server.register(production_requests_routes_1.productionRequestRoutes, { prefix: '/production-requests' });
server.register(orders_routes_1.orderRoutes, { prefix: '/orders' });
server.register(creative_requests_routes_1.creativeRequestRoutes);
server.register(users_routes_1.userRoutes, { prefix: '/auth' });
server.register(training_routes_1.trainingRoutes, { prefix: '/training' });
server.get('/health', async () => ({
    status: 'ok',
    service: 'tuf-ops-api',
    timestamp: new Date().toISOString(),
}));
server.get('/health/data', async (request) => {
    if (!hasDatabaseConfig()) {
        return emptyDataHealthPayload('degraded', 'database configuration is missing');
    }
    try {
        const [orgs, opps, users] = await Promise.all([
            database_1.pool.query('SELECT COUNT(*)::int AS count FROM organizations'),
            database_1.pool.query('SELECT COUNT(*)::int AS count FROM opportunities'),
            database_1.pool.query('SELECT COUNT(*)::int AS count FROM users'),
        ]);
        const now = new Date();
        const backupLastSuccessAt = process.env.BACKUP_LAST_SUCCESS_AT || null;
        const backupTimestamp = backupLastSuccessAt ? Date.parse(backupLastSuccessAt) : Number.NaN;
        const backupAgeHours = Number.isNaN(backupTimestamp) ? null : (now.getTime() - backupTimestamp) / (1000 * 60 * 60);
        const backupOlderThan24Hours = backupAgeHours === null || backupAgeHours > 24;
        return {
            status: backupOlderThan24Hours ? 'degraded' : 'ok',
            timestamp: now.toISOString(),
            backup_last_success_at: backupLastSuccessAt,
            backup_older_than_24_hours: backupOlderThan24Hours,
            database: { status: 'available' },
            counts: {
                organizations: orgs.rows[0]?.count ?? 0,
                opportunities: opps.rows[0]?.count ?? 0,
                users: users.rows[0]?.count ?? 0,
            },
        };
    }
    catch (error) {
        request.log?.error?.(error);
        return emptyDataHealthPayload('degraded', error?.code || 'database query failed');
    }
});
server.setNotFoundHandler((request, reply) => {
    if (request.method !== 'GET')
        return reply.code(404).send({ error: 'Not found' });
    const requestPath = request.url.split('?')[0];
    const staticPath = getSafeStaticPath(requestPath);
    if (staticPath)
        return sendStaticFile(reply, staticPath);
    if (!requestPath.startsWith('/api') && acceptsHtml(request.headers.accept) && (0, node_fs_1.existsSync)(indexHtmlPath)) {
        return sendStaticFile(reply, indexHtmlPath);
    }
    return reply.code(404).send({ error: 'Not found' });
});
server.setNotFoundHandler((request, reply) => {
    if (request.method !== 'GET')
        return reply.code(404).send({ error: 'Not found' });
    const requestPath = request.url.split('?')[0];
    const staticPath = getSafeStaticPath(requestPath);
    if (staticPath)
        return sendStaticFile(reply, staticPath);
    if (!requestPath.startsWith('/api') && acceptsHtml(request.headers.accept) && (0, node_fs_1.existsSync)(indexHtmlPath)) {
        return sendStaticFile(reply, indexHtmlPath);
    }
    return reply.code(404).send({ error: 'Not found' });
});
const start = async () => {
    try {
        (0, users_service_1.assertAuthTokenSecretConfigured)();
        if (hasDatabaseConfig()) {
            await (0, users_service_1.seedInitialOwnerIfEmpty)();
        }
        else {
            server.log.warn('Skipping initial owner seed because database configuration is missing');
        }
        await server.listen({ port, host: '0.0.0.0' });
        console.log(`Server listening on port ${port}`);
    }
    catch (err) {
        console.error(err);
        server.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=index.js.map