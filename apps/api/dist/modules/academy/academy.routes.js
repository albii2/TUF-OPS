"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.academyRoutes = academyRoutes;
const auth_1 = require("../../auth");
const academy_controller_1 = require("./academy.controller");
// Director+ only preHandler for review endpoints
const directorAuth = [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.INVITE_USER)];
async function academyRoutes(server) {
    // ── TAE-facing endpoints (open for uncertified users during training) ──
    server.get('/progress', academy_controller_1.getProgressHandler);
    server.post('/progress/phase', academy_controller_1.updatePhaseHandler);
    server.get('/missions', academy_controller_1.getMissionsHandler);
    server.post('/missions/start', academy_controller_1.startMissionHandler);
    server.post('/missions/submit', academy_controller_1.submitMissionHandler);
    server.get('/missions/reviews', academy_controller_1.getMissionsWithReviewsHandler);
    server.get('/graduation-check', academy_controller_1.getGraduationCheckHandler);
    server.post('/checklist/sync', academy_controller_1.syncChecklistHandler);
    // ── Director-facing endpoints ──
    server.post('/reviews', { preHandler: directorAuth }, academy_controller_1.createReviewHandler);
    server.get('/reviews/pending', { preHandler: directorAuth }, academy_controller_1.getPendingReviewsHandler);
    server.post('/territory/approve', { preHandler: directorAuth }, academy_controller_1.approveTerritoryHandler);
}
//# sourceMappingURL=academy.routes.js.map