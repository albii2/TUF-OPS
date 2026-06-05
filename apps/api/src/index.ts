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

const server = fastify();
const port = Number(process.env.PORT || 4000);
const webDistPath = process.env.WEB_DIST_PATH || path.resolve(__dirname, '../../web/dist');
const indexHtmlPath = path.join(webDistPath, 'index.html');
const frontendRoutePattern = /^\/($|dashboard(?:\/.*)?|orders(?:\/.*)?|settings(?:\/.*)?|opportunities(?:\/.*)?|organizations(?:\/.*)?|login(?:\/.*)?|my-opportunities(?:\/.*)?|team-opportunities(?:\/.*)?|team-performance(?:\/.*)?|reports(?:\/.*)?|earnings(?:\/.*)?|territory(?:\/.*)?|users(?:\/.*)?|training(?:\/.*)?|ops-workspace(?:\/.*)?)/;

const mimeTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
};

function sendStaticFile(reply: FastifyReply, filePath: string) {
  const extension = path.extname(filePath);
  reply.type(mimeTypes[extension] || 'application/octet-stream');
  reply.header('Cache-Control', extension === '.html' ? 'no-store' : 'public, max-age=31536000, immutable');
  return reply.send(createReadStream(filePath));
}

function getSafeStaticPath(requestPath: string) {
  const normalized = path.normalize(decodeURIComponent(requestPath)).replace(/^(\.\.(\/|\\|$))+/, '');
  const resolved = path.join(webDistPath, normalized);
  if (!resolved.startsWith(webDistPath)) return null;
  return existsSync(resolved) ? resolved : null;
}

function acceptsHtml(acceptHeader: unknown) {
  return typeof acceptHeader === 'string' && acceptHeader.includes('text/html');
}

server.register(cors, {
  origin: process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) || [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://ops.tufsports.us',
  ],
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
  if (request.method === 'GET' && frontendRoutePattern.test(requestPath) && acceptsHtml(request.headers.accept) && existsSync(indexHtmlPath)) {
    return sendStaticFile(reply, indexHtmlPath);
  }
});

server.get('/assets/*', async (request, reply) => {
  const assetPath = `/assets/${(request.params as { '*': string })['*']}`;
  const filePath = getSafeStaticPath(assetPath);
  if (!filePath) return reply.code(404).send({ error: 'Asset not found' });
  return sendStaticFile(reply, filePath);
});

server.get('/tuf-logo.svg', async (_request, reply) => {
  const filePath = getSafeStaticPath('/tuf-logo.svg');
  if (!filePath) return reply.code(404).send({ error: 'Asset not found' });
  return sendStaticFile(reply, filePath);
});

server.get('/tuf-mark.svg', async (_request, reply) => {
  const filePath = getSafeStaticPath('/tuf-mark.svg');
  if (!filePath) return reply.code(404).send({ error: 'Asset not found' });
  return sendStaticFile(reply, filePath);
});

server.register(organizationRoutes, { prefix: '/api/v1/organizations' });
server.register(opportunityRoutes, { prefix: '/api/v1/opportunities' });
server.register(activityRoutes, { prefix: '/api/v1/activities' });
server.register(reportingRoutes, { prefix: '/api/v1/reporting' });
server.register(productionRequestRoutes, { prefix: '/api/v1/production-requests' });
server.register(orderRoutes, { prefix: '/api/v1/orders' });
server.register(creativeRequestRoutes, { prefix: '/api/v1' });
server.register(trainingRoutes, { prefix: '/api/v1/training' });
server.register(organizationRoutes, { prefix: '/organizations' });
server.register(opportunityRoutes, { prefix: '/opportunities' });
server.register(activityRoutes, { prefix: '/activities' });
server.register(reportingRoutes, { prefix: '/reporting' });
server.register(productionRequestRoutes, { prefix: '/production-requests' });
server.register(orderRoutes, { prefix: '/orders' });
server.register(creativeRequestRoutes);
server.register(trainingRoutes, { prefix: '/training' });
server.register(vendorRoutes, { prefix: '/api' });

server.get('/health', async () => ({
  status: 'ok',
  service: 'tuf-ops-api',
  timestamp: new Date().toISOString(),
}));

server.setNotFoundHandler((request, reply) => {
  const requestPath = request.url.split('?')[0];
  if (request.method === 'GET' && !requestPath.startsWith('/api') && existsSync(indexHtmlPath)) {
    return sendStaticFile(reply, indexHtmlPath);
  }
  return reply.code(404).send({ error: 'Not found' });
});

const start = async () => {
  try {
    await server.listen({ port });
    console.log(`Server listening on http://localhost:${port}`);
  } catch (err) {
    console.error(err);
    server.log.error(err);
    process.exit(1);
  }
};

start();
