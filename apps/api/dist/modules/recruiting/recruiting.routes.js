"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recruitingRoutes = recruitingRoutes;
const auth_1 = require("../../auth");
const recruiting_controller_1 = require("./recruiting.controller");
async function recruitingRoutes(server) {
    // All recruiting routes require INVITE_USER permission (Director+)
    const pre = [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.INVITE_USER)];
    server.post('/', { preHandler: pre }, recruiting_controller_1.createCandidateHandler);
    server.get('/', { preHandler: pre }, recruiting_controller_1.getCandidatesHandler);
    server.get('/dashboard', { preHandler: pre }, recruiting_controller_1.getRecruitingDashboardHandler);
    server.get('/:id', { preHandler: pre }, recruiting_controller_1.getCandidateByIdHandler);
    server.put('/:id', { preHandler: pre }, recruiting_controller_1.updateCandidateHandler);
    server.post('/:id/resume', { preHandler: pre }, recruiting_controller_1.uploadResumeHandler);
    server.get('/:id/activities', { preHandler: pre }, recruiting_controller_1.getCandidateActivitiesHandler);
}
//# sourceMappingURL=recruiting.routes.js.map