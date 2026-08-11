import { FastifyInstance } from 'fastify';
import { requireCertification, requirePermission, permissions } from '../../auth';
import {
  listAnnouncementsHandler,
  createAnnouncementHandler,
  deleteAnnouncementHandler,
} from './announcements.controller';

export async function announcementRoutes(server: FastifyInstance) {
  // List announcements (all certified users)
  server.get('/announcements', { preHandler: [requireCertification()] }, listAnnouncementsHandler);

  // Create announcement (Director+ only)
  server.post('/announcements', { preHandler: [requireCertification(), requirePermission(permissions.INVITE_USER)] }, createAnnouncementHandler);

  // Delete announcement (Director+ only)
  server.delete('/announcements/:id', { preHandler: [requireCertification(), requirePermission(permissions.INVITE_USER)] }, deleteAnnouncementHandler);
}
