import fastify from 'fastify';
import cors from '@fastify/cors';
import { activityRoutes } from './modules/activities/activities.routes';
import { opportunityRoutes } from './modules/opportunities/opportunities.routes';
import { organizationRoutes } from './modules/organizations/organizations.routes';
import { productionRequestRoutes } from './modules/production-requests/production-requests.routes';
import { orderRoutes } from './modules/orders/orders.routes';
import { parsingRoutes } from './modules/parsing/parsing.routes';
import { reportingRoutes } from './modules/reporting/reporting.routes';

const server = fastify();

server.register(cors, {
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

server.register(organizationRoutes, { prefix: '/organizations' });
server.register(opportunityRoutes, { prefix: '/opportunities' });
server.register(activityRoutes, { prefix: '/activities' });
server.register(reportingRoutes, { prefix: '/reporting' });
server.register(productionRequestRoutes, { prefix: '/production-requests' });
server.register(orderRoutes, { prefix: '/orders' });
server.register(parsingRoutes, { prefix: '/parsing' });

const start = async () => {
  const port = 3001;
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
