"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trainingRoutes = trainingRoutes;
const training_controller_1 = require("./training.controller");
async function trainingRoutes(server) {
    // Get modules by role (with optional phase filter)
    server.get('/modules', training_controller_1.getModulesByRoleHandler);
    // Get user's current enrollment + progress
    server.get('/enrollment', training_controller_1.getEnrollmentHandler);
    // Enroll user in training
    server.post('/enrollment/start', training_controller_1.enrollUserHandler);
    // Start a module
    server.post('/progress/start', training_controller_1.startModuleHandler);
    // Complete a module
    server.post('/progress/complete', training_controller_1.completeModuleHandler);
    // Submit module quiz / knowledge check
    server.post('/assessments/submit', training_controller_1.submitModuleAssessmentHandler);
    // Evaluate simulator verbal objections pitch response
    server.post('/assessments/evaluate-script', training_controller_1.evaluateScriptHandler);
    // Get detailed progress for an enrollment
    server.get('/progress/:enrollmentId', training_controller_1.getProgressHandler);
    // Record a friction point
    server.post('/friction-point', training_controller_1.recordFrictionPointHandler);
    // Get all friction points
    server.get('/friction-points', training_controller_1.getFrictionPointsHandler);
    // Toggle HR documents completion
    server.post('/reps/:id/hr-docs', training_controller_1.toggleHrDocsHandler);
    // Toggle practical exercise completion
    server.post('/reps/:id/practical-exercise', training_controller_1.togglePracticalExerciseHandler);
    // Toggle Director sign-off
    server.post('/reps/:id/director-signoff', training_controller_1.toggleDirectorSignoffHandler);
    // Retrieve certification status
    server.get('/reps/:id/certification-status', training_controller_1.getCertificationStatusHandler);
}
//# sourceMappingURL=training.routes.js.map