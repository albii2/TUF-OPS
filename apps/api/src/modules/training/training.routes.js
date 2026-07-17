"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trainingRoutes = trainingRoutes;
const auth_1 = require("../../auth");
const training_controller_1 = require("./training.controller");
// Director+ only preHandler for cert-management endpoints
const directorAuth = [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.INVITE_USER)];
async function trainingRoutes(server) {
    // Onboarding endpoints — open for uncertified users (no certification gate)
    server.get('/modules', training_controller_1.getModulesByRoleHandler);
    server.get('/enrollment', training_controller_1.getEnrollmentHandler);
    server.post('/enrollment/start', training_controller_1.enrollUserHandler);
    server.post('/progress/start', training_controller_1.startModuleHandler);
    server.post('/progress/complete', training_controller_1.completeModuleHandler);
    server.post('/assessments/submit', training_controller_1.submitModuleAssessmentHandler);
    server.post('/assessments/evaluate-script', training_controller_1.evaluateScriptHandler);
    server.get('/progress/:enrollmentId', training_controller_1.getProgressHandler);
    server.post('/friction-point', training_controller_1.recordFrictionPointHandler);
    // Authenticated endpoints — require certification
    server.get('/friction-points', { preHandler: [(0, auth_1.requireCertification)()] }, training_controller_1.getFrictionPointsHandler);
    // Director+ certification management
    server.post('/reps/:id/hr-docs', { preHandler: directorAuth }, training_controller_1.toggleHrDocsHandler);
    server.post('/reps/:id/practical-exercise', { preHandler: directorAuth }, training_controller_1.togglePracticalExerciseHandler);
    server.post('/reps/:id/director-signoff', { preHandler: directorAuth }, training_controller_1.toggleDirectorSignoffHandler);
    server.get('/reps/:id/certification-status', { preHandler: directorAuth }, training_controller_1.getCertificationStatusHandler);
}
//# sourceMappingURL=training.routes.js.map