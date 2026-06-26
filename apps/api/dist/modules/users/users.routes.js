"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = userRoutes;
const auth_1 = require("../../auth");
const users_controller_1 = require("./users.controller");
async function userRoutes(server) {
    server.post('/login', users_controller_1.loginHandler);
    server.get('/me', users_controller_1.getMeHandler);
    server.get('/users', users_controller_1.listUsersHandler);
    server.post('/users', users_controller_1.createUserHandler);
    server.post('/users/:id/reset-credential', users_controller_1.resetCredentialHandler);
    server.post('/users/me/change-credential', users_controller_1.changeCredentialHandler);
    server.put('/users/:id/certify', { preHandler: (0, auth_1.requirePermission)(auth_1.permissions.INVITE_USER) }, users_controller_1.certifyUserHandler);
}
//# sourceMappingURL=users.routes.js.map