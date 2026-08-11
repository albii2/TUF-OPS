"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.announcementRoutes = announcementRoutes;
const auth_1 = require("../../auth");
const announcements_controller_1 = require("./announcements.controller");
async function announcementRoutes(server) {
    // List announcements (all certified users)
    server.get('/announcements', { preHandler: [(0, auth_1.requireCertification)()] }, announcements_controller_1.listAnnouncementsHandler);
    // Create announcement (Director+ only)
    server.post('/announcements', { preHandler: [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.INVITE_USER)] }, announcements_controller_1.createAnnouncementHandler);
    // Delete announcement (Director+ only)
    server.delete('/announcements/:id', { preHandler: [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.INVITE_USER)] }, announcements_controller_1.deleteAnnouncementHandler);
}
//# sourceMappingURL=announcements.routes.js.map