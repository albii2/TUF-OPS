import fastify from 'fastify';
import { activityRoutes } from './modules/activities/activities.routes';
import { opportunityRoutes } from './modules/opportunities/opportunities.routes';
import { organizationRoutes } from './modules/organizations/organizations.routes';
import { productionRequestRoutes } from './modules/production-requests/production-requests.routes';
import { reportingRoutes } from './modules/reporting/reporting.routes';

const server = fastify();

server.register(organizationRoutes, { prefix: '/organizations' });
server.register(opportunityRoutes, { prefix: '/opportunities' });
server.register(activityRoutes, { prefix: '/activities' });
server.register(reportingRoutes, { prefix: '/reporting' });
server.register(productionRequestRoutes, { prefix: '/production-requests' });

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
