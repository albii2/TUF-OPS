import fastify from 'fastify';
import cors from '@fastify/cors';
import { activityRoutes } from './modules/activities/activities.routes';
import { opportunityRoutes } from './modules/opportunities/opportunities.routes';
import { organizationRoutes } from './modules/organizations/organizations.routes';
import { productionRequestRoutes } from './modules/production-requests/production-requests.routes';
import { reportingRoutes } from './modules/reporting/reporting.routes';
import { orderRoutes } from './modules/orders/orders.routes';
import { creativeRequestRoutes } from './modules/creative-requests/creative-requests.routes';
import { pool } from '@packages/database';

const server = fastify();
const port = Number(process.env.PORT || 4000);
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

server.register(cors, {
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

server.register(organizationRoutes, { prefix: '/organizations' });
server.register(opportunityRoutes, { prefix: '/opportunities' });
server.register(activityRoutes, { prefix: '/activities' });
server.register(reportingRoutes, { prefix: '/reporting' });
server.register(productionRequestRoutes, { prefix: '/production-requests' });
server.register(orderRoutes, { prefix: '/orders' });
server.register(creativeRequestRoutes);

server.get('/health', async () => ({
  status: 'ok',
  service: 'tuf-ops-api',
  timestamp: new Date().toISOString(),
}));

server.get('/health/data', async () => {
  const [orgs, opps, users] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS count FROM organizations'),
    pool.query('SELECT COUNT(*)::int AS count FROM opportunities'),
    pool.query('SELECT COUNT(*)::int AS count FROM users'),
  ]);
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    backup_last_success_at: process.env.BACKUP_LAST_SUCCESS_AT || null,
    counts: {
      organizations: orgs.rows[0]?.count ?? 0,
      opportunities: opps.rows[0]?.count ?? 0,
      users: users.rows[0]?.count ?? 0,
    },
  };
});

const start = async () => {
  try {
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    console.error(err);
    server.log.error(err);
    process.exit(1);
  }
};

start();
