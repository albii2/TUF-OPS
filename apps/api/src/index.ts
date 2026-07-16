import fastify, { type FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import { createReadStream, existsSync } from 'node:fs';
import path from 'node:path';
import { activityRoutes } from './modules/activities/activities.routes';
import { opportunityRoutes } from './modules/opportunities/opportunities.routes';
import { organizationRoutes } from './modules/organizations/organizations.routes';
import { productionRequestRoutes } from './modules/production-requests/production-requests.routes';
import { reportingRoutes } from './modules/reporting/reporting.routes';
import { orderRoutes } from './modules/orders/orders.routes';
import { creativeRequestRoutes } from './modules/creative-requests/creative-requests.routes';
import { trainingRoutes } from './modules/training/training.routes';
import { vendorRoutes } from './modules/vendors/vendors.routes';
import { announcementRoutes } from './modules/announcements/announcements.routes';
import { userRoutes } from './modules/users/users.routes';
import { dailyActivityRoutes } from './modules/daily-activities/daily-activities.routes';
import { recruitingRoutes } from './modules/recruiting/recruiting.routes';
import { intakeRoutes } from './modules/intake/intake.routes';
import { peopleRoutes } from './modules/people/people.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { commsRoutes } from './modules/comms/comms.routes';
import { workItemsRoutes } from './modules/work-items/work-items.routes';
import { assertAuthTokenSecretConfigured, seedInitialOwnerIfEmpty } from './modules/users/users.service';
import { pool } from '@packages/database';
import { authMiddleware, permissionErrorHandler } from './auth';

const server = fastify();
const port = Number(process.env.PORT || 4000);
const webDistPath = process.env.WEB_DIST_PATH || path.resolve(__dirname, '../../web/dist');
const indexHtmlPath = path.join(webDistPath, 'index.html');
const frontendRoutePattern = /^\/($|dashboard(?:\/.*)?|orders(?:\/.*)?|settings(?:\/.*)?|opportunities(?:\/.*)?|organizations(?:\/.*)?|login(?:\/.*)?|change-credential(?:\/.*)?|my-opportunities(?:\/.*)?|team-opportunities(?:\/.*)?|team-performance(?:\/.*)?|reports(?:\/.*)?|earnings(?:\/.*)?|territory(?:\/.*)?|users(?:\/.*)?|data-health(?:\/.*)?|ecosystem-pipeline(?:\/.*)?|ops-workspace(?:\/.*)?|daily-command(?:\/.*)?|recruiting(?:\/.*)?|intake(?:\/.*)?|people(?:\/.*)?|academy(?:\/.*)?|admin\/certification(?:\/.*)?|forge(?:\/.*)?|comms(?:\/.*)?)/;
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,https://ops.tufsports.us,https://tufops.app')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Also allow Vercel preview deployments
function resolveOrigin(origin: string | undefined, callback: (err: Error | null, allow: boolean) => void) {
  if (!origin || corsOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'), false);
  }
}

const mimeTypes: Record<string, string> = {
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

function sendStaticFile(reply: FastifyReply, filePath: string) {
  const extension = path.extname(filePath);
  reply.type(mimeTypes[extension] || 'application/octet-stream');
  reply.header('Cache-Control', extension === '.html' ? 'no-store' : 'public, max-age=31536000, immutable');
  return reply.send(createReadStream(filePath));
}

function getSafeStaticPath(requestPath: string) {
  const cleanPath = decodeURIComponent(requestPath.split('?')[0] || '/');
  const normalized = path.normalize(cleanPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const resolved = path.join(webDistPath, normalized);
  if (!resolved.startsWith(webDistPath)) return null;
  return existsSync(resolved) ? resolved : null;
}

function acceptsHtml(acceptHeader: unknown) {
  return typeof acceptHeader === 'string' && acceptHeader.includes('text/html');
}

function hasDatabaseConfig() {
  if (process.env.NODE_ENV === 'test') return Boolean(process.env.TEST_DATABASE_URL || process.env.DATABASE_URL);
  return Boolean(process.env.DATABASE_URL || process.env.PGHOST);
}

function emptyDataHealthPayload(status: 'ok' | 'degraded', reason?: string) {
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

server.register(cors, {
  origin: resolveOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

server.addHook('onRequest', authMiddleware);

server.setErrorHandler((error, request, reply) => {
  try {
    return permissionErrorHandler(error, reply);
  } catch (unhandled) {
    request.log.error(unhandled);
    return reply.code(500).send({ error: 'Internal server error' });
  }
});

server.addHook('onRequest', async (request, reply) => {
  const host = request.headers.host?.split(':')[0];
  const forwardedProto = request.headers['x-forwarded-proto'];
  const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;

  if (host === 'ops.tufsports.us' && proto === 'http' && process.env.FORCE_HTTPS !== 'false') {
    return reply.redirect(`https://ops.tufsports.us${request.url}`, 308);
  }

  const requestPath = request.url.split('?')[0];
  if (request.method === 'GET' && frontendRoutePattern.test(requestPath) && acceptsHtml(request.headers.accept) && existsSync(indexHtmlPath)) {
    return sendStaticFile(reply, indexHtmlPath);
  }
});

server.register(organizationRoutes, { prefix: '/api/organizations' });
server.register(opportunityRoutes, { prefix: '/api/opportunities' });
server.register(activityRoutes, { prefix: '/api/activities' });
server.register(reportingRoutes, { prefix: '/api/reporting' });
server.register(productionRequestRoutes, { prefix: '/api/production-requests' });
server.register(orderRoutes, { prefix: '/api/orders' });
server.register(creativeRequestRoutes, { prefix: '/api' });
server.register(userRoutes, { prefix: '/api/auth' });
server.register(userRoutes, { prefix: '/api' });  // Also register at /api/users for frontend compat
server.register(userRoutes, { prefix: '/api/v1/auth' });
server.register(organizationRoutes, { prefix: '/api/v1/organizations' });
server.register(opportunityRoutes, { prefix: '/api/v1/opportunities' });
server.register(activityRoutes, { prefix: '/api/v1/activities' });
server.register(reportingRoutes, { prefix: '/api/v1/reporting' });
server.register(productionRequestRoutes, { prefix: '/api/v1/production-requests' });
server.register(orderRoutes, { prefix: '/api/v1/orders' });
server.register(creativeRequestRoutes, { prefix: '/api/v1' });
server.register(trainingRoutes, { prefix: '/api/v1/training' });
server.register(announcementRoutes, { prefix: '/api/v1' });
server.register(dailyActivityRoutes, { prefix: '/api/daily-activities' });
server.register(dailyActivityRoutes, { prefix: '/api/v1/daily-activities' });
server.register(recruitingRoutes, { prefix: '/api/recruiting' });
server.register(intakeRoutes, { prefix: '/api/intake' });
server.register(peopleRoutes, { prefix: '/api/people' });
server.register(dashboardRoutes, { prefix: '/api/dashboard' });
server.register(commsRoutes, { prefix: '/api/comms' });
server.register(workItemsRoutes, { prefix: '/api/work-items' });
server.register(recruitingRoutes, { prefix: '/api/v1/recruiting' });
server.register(organizationRoutes, { prefix: '/organizations' });
server.register(opportunityRoutes, { prefix: '/opportunities' });
server.register(activityRoutes, { prefix: '/activities' });
server.register(reportingRoutes, { prefix: '/reporting' });
server.register(productionRequestRoutes, { prefix: '/production-requests' });
server.register(orderRoutes, { prefix: '/orders' });
server.register(creativeRequestRoutes);
server.register(userRoutes, { prefix: '/auth' });

const healthHandler = async () => ({
  status: 'ok',
  service: 'tuf-ops-api',
  timestamp: new Date().toISOString(),
});

server.get('/health', healthHandler);
server.get('/api/health', healthHandler);
server.get('/api/v1/health', healthHandler);

server.get('/health/data', async (request) => {
  if (!hasDatabaseConfig()) {
    return emptyDataHealthPayload('degraded', 'database configuration is missing');
  }

  try {
    const [orgs, opps, users] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM organizations'),
      pool.query('SELECT COUNT(*)::int AS count FROM opportunities'),
      pool.query('SELECT COUNT(*)::int AS count FROM users'),
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
  } catch (error: any) {
    request.log?.error?.(error);
    return emptyDataHealthPayload('degraded', error?.code || 'database query failed');
  }
});

server.setNotFoundHandler((request, reply) => {
  if (request.method !== 'GET') return reply.code(404).send({ error: 'Not found' });

  const requestPath = request.url.split('?')[0];
  const staticPath = getSafeStaticPath(requestPath);
  if (staticPath) return sendStaticFile(reply, staticPath);
  if (!requestPath.startsWith('/api') && acceptsHtml(request.headers.accept) && existsSync(indexHtmlPath)) {
    return sendStaticFile(reply, indexHtmlPath);
  }
  return reply.code(404).send({ error: 'Not found' });
});

const start = async () => {
  try {
    assertAuthTokenSecretConfigured();
    if (hasDatabaseConfig()) {
      await seedInitialOwnerIfEmpty();
    } else {
      server.log.warn('Skipping initial owner seed because database configuration is missing');
    }
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    console.error(err);
    server.log.error(err);
    process.exit(1);
  }
};

start();
