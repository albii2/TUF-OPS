import fastify from 'fastify';
import { organizationRoutes } from './modules/organizations/organizations.routes';

const server = fastify();

server.register(organizationRoutes, { prefix: '/organizations' });

const start = async () => {
  try {
    await server.listen({ port: 3000 });
    console.log('Server listening on http://localhost:3000');
  } catch (err) {
    console.error(err);
    server.log.error(err);
    process.exit(1);
  }
};

start();
