import { FastifyInstance } from 'fastify';
import {
  getExecutiveSummaryHandler,
  getParticipantsHandler,
  getParticipantDetailHandler,
  getRecentActivityHandler,
  logEventHandler,
} from './academy-command.controller';

export async function academyCommandRoutes(server: FastifyInstance) {
  // Executive summary — the main command view
  server.get('/executive-summary', getExecutiveSummaryHandler);

  // All participants roster
  server.get('/participants', getParticipantsHandler);

  // Individual participant detail
  server.get('/participants/:userId', getParticipantDetailHandler);

  // Recent activity feed
  server.get('/recent-activity', getRecentActivityHandler);

  // Log an activity event
  server.post('/events', logEventHandler);
}
