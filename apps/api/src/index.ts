import fastify from 'fastify';
import cors from '@fastify/cors';
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

server.register(cors, {
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

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
