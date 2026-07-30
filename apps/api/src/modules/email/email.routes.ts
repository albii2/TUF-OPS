import { FastifyInstance } from 'fastify';
import {
  sendHandler,
  logListHandler,
  logGetHandler,
  templatesListHandler,
  accountsListHandler,
  accountStatusHandler,
  inboxListHandler,
  inboxGetHandler,
  inboxAnalyzeHandler,
  inboxPollHandler,
  inboxProcessHandler,
  inboxStatsHandler,
  inboxAccountStatusHandler,
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

  // ── Inbound Email Routes ───────────────────────────────────
  // Inbox listing with filters
  server.get('/inbox', inboxListHandler);
  // Single email detail
  server.get('/inbox/:id', inboxGetHandler);
  // Analyze a specific email
  server.post('/inbox/:id/analyze', inboxAnalyzeHandler);
  // Manual poll trigger
  server.post('/inbox/poll', inboxPollHandler);
  // Process pending emails
  server.post('/inbox/process', inboxProcessHandler);
  // Stats
  server.get('/inbox/stats', inboxStatsHandler);
  // Inbox account status
  server.get('/inbox/accounts/status', inboxAccountStatusHandler);
}
