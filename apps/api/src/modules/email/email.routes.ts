import { FastifyInstance } from 'fastify';
import {
  sendHandler,
  logListHandler,
  logGetHandler,
  templatesListHandler,
  accountsListHandler,
  accountStatusHandler,
} from './email.controller';

export async function emailRoutes(server: FastifyInstance) {
  // Send email
  server.post('/send', sendHandler);

  // Email log
  server.get('/log', logListHandler);
  server.get('/log/:id', logGetHandler);

  // Templates
  server.get('/templates', templatesListHandler);

  // Accounts
  server.get('/accounts', accountsListHandler);
  server.get('/accounts/status', accountStatusHandler);
}
