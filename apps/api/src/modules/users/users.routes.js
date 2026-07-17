"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = userRoutes;
const auth_1 = require("../../auth");
const users_controller_1 = require("./users.controller");
async function userRoutes(server) {
    // Auth endpoints (no preHandler — handled inline by authMiddleware+controller)
    server.post('/login', users_controller_1.loginHandler);
    server.get('/me', users_controller_1.getMeHandler);
    server.post('/users/me/change-credential', users_controller_1.changeCredentialHandler);
    // Admin-only user management
    server.get('/users', users_controller_1.listUsersHandler);
    server.post('/users', { preHandler: (0, auth_1.requirePermission)(auth_1.permissions.INVITE_USER) }, users_controller_1.createUserHandler);
    server.post('/users/:id/reset-credential', { preHandler: (0, auth_1.requirePermission)(auth_1.permissions.INVITE_USER) }, users_controller_1.resetCredentialHandler);
    server.put('/users/:id/certify', { preHandler: (0, auth_1.requirePermission)(auth_1.permissions.INVITE_USER) }, users_controller_1.certifyUserHandler);
    server.put('/users/:id/status', { preHandler: (0, auth_1.requirePermission)(auth_1.permissions.INVITE_USER) }, users_controller_1.setUserStatusHandler);
    server.put('/users/:id', users_controller_1.updateUserHandler);
}
//# sourceMappingURL=users.routes.js.map