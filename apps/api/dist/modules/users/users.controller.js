"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsersHandler = listUsersHandler;
exports.getMeHandler = getMeHandler;
exports.createUserHandler = createUserHandler;
exports.resetCredentialHandler = resetCredentialHandler;
exports.changeCredentialHandler = changeCredentialHandler;
exports.loginHandler = loginHandler;
exports.certifyUserHandler = certifyUserHandler;
const users_service_1 = require("./users.service");
function bearerToken(request) {
    const raw = request.headers.authorization;
    const value = Array.isArray(raw) ? raw[0] : raw;
    const [scheme, token] = (value || '').split(' ');
    return scheme?.toLowerCase() === 'bearer' ? token : undefined;
}
async function authenticatedUser(request) {
    return (0, users_service_1.verifyAuthToken)(bearerToken(request));
}
async function requireAuthenticatedUser(request, reply) {
    const user = await authenticatedUser(request);
    if (!user) {
        reply.code(401).send({ error: 'Authentication required' });
        return null;
    }
    return user;
}
function handleError(reply, error) {
    const message = error?.message || 'Request failed';
    const status = message.includes('Only Owner/Admin') ? 403 : message.includes('not found') ? 404 : 400;
    return reply.code(status).send({ error: message });
}
async function listUsersHandler(request, reply) {
    const actor = await requireAuthenticatedUser(request, reply);
    if (!actor)
        return;
    try {
        return reply.send({ users: await (0, users_service_1.listUsers)(actor) });
    }
    catch (error) {
        return handleError(reply, error);
    }
}
async function getMeHandler(request, reply) {
    const user = await requireAuthenticatedUser(request, reply);
    if (!user)
        return;
    return reply.send({ user });
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
        const result = await (0, users_service_1.resetUserCredential)(Number(request.params.id), actor, request.body?.temporary_credential);
        return reply.send(result);
    }
    catch (error) {
        return handleError(reply, error);
    }
}
async function changeCredentialHandler(request, reply) {
    const actor = await requireAuthenticatedUser(request, reply);
    if (!actor)
        return;
    try {
        const user = await (0, users_service_1.changeOwnCredential)(actor.id, request.body);
        return reply.send({ user });
    }
    catch (error) {
        return handleError(reply, error);
    }
}
async function loginHandler(request, reply) {
    const result = await (0, users_service_1.loginWithCredential)(request.body);
    if (!result)
        return reply.code(401).send({ error: 'Invalid credentials' });
    return reply.send(result);
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
//# sourceMappingURL=users.controller.js.map