import type { FastifyInstance } from 'fastify';
import {
  listIssuesHandler,
  getIssueHandler,
  createIssueHandler,
  updateIssueHandler,
  updateIssueStatusHandler,
} from './issues.controller';

export async function issuesRoutes(server: FastifyInstance) {
  // GET /issues — list all (with optional filters)
  server.get('/', listIssuesHandler);
  // GET /issues/:id — single issue detail
  server.get('/:id', getIssueHandler);
  // POST /issues — create new issue
  server.post('/', createIssueHandler);
  // PUT /issues/:id — update issue fields
  server.put('/:id', updateIssueHandler);
  // PUT /issues/:id/status — update status only (convenience endpoint)
  server.put('/:id/status', updateIssueStatusHandler);
}
