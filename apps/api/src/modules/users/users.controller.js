"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginHandler = loginHandler;
exports.getMeHandler = getMeHandler;
exports.listUsersHandler = listUsersHandler;
exports.createUserHandler = createUserHandler;
exports.resetCredentialHandler = resetCredentialHandler;
exports.changeCredentialHandler = changeCredentialHandler;
exports.certifyUserHandler = certifyUserHandler;
exports.setUserStatusHandler = setUserStatusHandler;
exports.updateUserHandler = updateUserHandler;
const users_service_1 = require("./users.service");
function bearerToken(request) {
    const header = request.headers.authorization;
    return header?.startsWith('Bearer ') ? header.slice(7) : undefined;
}
async function requireAuthenticatedUser(request, reply) {
    const token = bearerToken(request);
    const user = await (0, users_service_1.verifyAuthToken)(token);
    if (!user) {
        reply.code(401).send({ error: 'Authentication required' });
        return null;
    }
    return user;
}
function handleError(reply, error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('Only Owner') || message.includes('Only Director'))
        return reply.code(403).send({ error: message });
    if (message.includes('not found'))
        return reply.code(404).send({ error: message });
    if (message.includes('required'))
        return reply.code(400).send({ error: message });
    if (message.includes('invalid') || message.includes('Invalid'))
        return reply.code(400).send({ error: message });
    return reply.code(500).send({ error: message });
}
async function loginHandler(request, reply) {
    try {
        const result = await (0, users_service_1.loginWithCredential)(request.body);
        if (!result)
            return reply.code(401).send({ error: 'Invalid PIN' });
        return reply.send(result);
    }
    catch (error) {
        return handleError(reply, error);
    }
}
async function getMeHandler(request, reply) {
    const token = bearerToken(request);
    const user = await (0, users_service_1.verifyAuthToken)(token);
    if (!user)
        return reply.code(401).send({ error: 'Not authenticated' });
    return reply.send({ user });
}
async function listUsersHandler(request, reply) {
    const actor = await requireAuthenticatedUser(request, reply);
    if (!actor)
        return;
    try {
        const users = await (0, users_service_1.listUsers)(actor);
        return reply.send({ users });
    }
    catch (error) {
        return handleError(reply, error);
    }
}
async function createUserHandler(request, reply) {
    const actor = await requireAuthenticatedUser(request, reply);
    if (!actor)
        return;
    try {
        const result = await (0, users_service_1.createUserWithTemporaryCredential)(request.body, actor);
        return reply.code(201).send(result);
    }
    catch (error) {
        return handleError(reply, error);
    }
}
async function resetCredentialHandler(request, reply) {
    const actor = await requireAuthenticatedUser(request, reply);
    if (!actor)
        return;
    try {
        const result = await (0, users_service_1.resetUserCredential)(Number(request.params.id), actor);
        return reply.send(result);
    }
    catch (error) {
        return handleError(reply, error);
    }
}
async function changeCredentialHandler(request, reply) {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user)
        return;
    try {
        const updated = await (0, users_service_1.changeOwnCredential)(user.id, request.body);
        return reply.send({ user: updated });
    }
    catch (error) {
        return handleError(reply, error);
    }
}
async function certifyUserHandler(request, reply) {
    const actor = await requireAuthenticatedUser(request, reply);
    if (!actor)
        return;
    try {
        const user = await (0, users_service_1.certifyUser)(Number(request.params.id), actor);
        return reply.send({ user });
    }
    catch (error) {
        return handleError(reply, error);
    }
}
async function setUserStatusHandler(request, reply) {
    const actor = await requireAuthenticatedUser(request, reply);
    if (!actor)
        return;
    try {
        await (0, users_service_1.setUserStatus)(Number(request.params.id), request.body?.status || 'INACTIVE', actor);
        return reply.send({ success: true });
    }
    catch (error) {
        return handleError(reply, error);
    }
}
async function updateUserHandler(request, reply) {
    const actor = await requireAuthenticatedUser(request, reply);
    if (!actor)
        return;
    try {
        const result = await (0, users_service_1.updateUser)(Number(request.params.id), request.body, actor);
        return reply.send(result);
    }
    catch (error) {
        return handleError(reply, error);
    }
}
//# sourceMappingURL=users.controller.js.map