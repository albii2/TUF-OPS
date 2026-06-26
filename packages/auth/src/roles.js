"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roles = void 0;
exports.normalizeRole = normalizeRole;
exports.isAdmin = isAdmin;
exports.isDirector = isDirector;
exports.isTae = isTae;
exports.isOperations = isOperations;
exports.roles = {
    ADMIN: 'admin',
    DIRECTOR: 'director',
    TAE: 'tae',
    OPERATIONS: 'operations',
};
function normalizeRole(role) {
    if (typeof role !== 'string')
        return null;
    const trimmed = role.trim();
    if (!trimmed)
        return null;
    const lower = trimmed.toLowerCase();
    if (trimmed === 'ADMIN' || trimmed === 'OWNER' || lower === exports.roles.ADMIN || lower === 'owner')
        return exports.roles.ADMIN;
    if (trimmed === 'DIRECTOR' || lower === exports.roles.DIRECTOR)
        return exports.roles.DIRECTOR;
    if (trimmed === 'REP' || lower === 'sales_rep' || lower === exports.roles.TAE)
        return exports.roles.TAE;
    if (trimmed === 'OPS' || trimmed === 'OPERATIONS' || trimmed === 'REGIONAL_DIRECTOR' || lower === exports.roles.OPERATIONS || lower === 'ops')
        return exports.roles.OPERATIONS;
    return null;
}
function isAdmin(role) {
    return normalizeRole(role) === exports.roles.ADMIN;
}
function isDirector(role) {
    return normalizeRole(role) === exports.roles.DIRECTOR;
}
function isTae(role) {
    return normalizeRole(role) === exports.roles.TAE;
}
function isOperations(role) {
    return normalizeRole(role) === exports.roles.OPERATIONS;
}
//# sourceMappingURL=roles.js.map