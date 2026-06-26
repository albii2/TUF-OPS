"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.announcementRoutes = announcementRoutes;
const announcements_controller_1 = require("./announcements.controller");
async function announcementRoutes(server) {
    // List announcements (all authenticated users)
    server.get('/announcements', announcements_controller_1.listAnnouncementsHandler);
    // Create announcement (Admin / Director / Regional Director only)
    server.post('/announcements', announcements_controller_1.createAnnouncementHandler);
    // Delete announcement (Admin / Director / Regional Director only)
    server.delete('/announcements/:id', announcements_controller_1.deleteAnnouncementHandler);
}
//# sourceMappingURL=announcements.routes.js.map