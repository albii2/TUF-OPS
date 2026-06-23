import { FastifyInstance } from 'fastify';
import {
  listAnnouncementsHandler,
  createAnnouncementHandler,
  deleteAnnouncementHandler,
} from './announcements.controller';

export async function announcementRoutes(server: FastifyInstance) {
  // List announcements (all authenticated users)
  server.get('/announcements', listAnnouncementsHandler);

  // Create announcement (Admin / Director / Regional Director only)
  server.post('/announcements', createAnnouncementHandler);

  // Delete announcement (Admin / Director / Regional Director only)
  server.delete('/announcements/:id', deleteAnnouncementHandler);
}
