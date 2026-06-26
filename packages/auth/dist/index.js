"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionDenied = void 0;
exports.hasPermission = hasPermission;
exports.requirePermission = requirePermission;
exports.requireRole = requireRole;
const permissions_js_1 = require("./permissions.js");
const roles_js_1 = require("./roles.js");
__exportStar(require("./roles.js"), exports);
__exportStar(require("./permissions.js"), exports);
__exportStar(require("./stages.js"), exports);
class PermissionDenied extends Error {
    statusCode = 403;
    constructor(message) {
        super(message);
        this.name = 'PermissionDenied';
    }
}
exports.PermissionDenied = PermissionDenied;
function hasPermission(userOrRole, permission) {
    if (!userOrRole)
        return false;
    if (typeof userOrRole === 'string')
        return (0, permissions_js_1.getPermissions)(userOrRole).has(permission);
    const roles = userOrRole.roles?.length ? userOrRole.roles : userOrRole.role ? [userOrRole.role] : [];
    return roles.some((role) => (0, permissions_js_1.getPermissions)(role).has(permission));
}
function requirePermission(userOrRole, permission) {
    if (hasPermission(userOrRole, permission))
        return;
    const rawRole = typeof userOrRole === 'string' ? userOrRole : userOrRole?.role ?? userOrRole?.roles?.[0] ?? 'anonymous';
    const normalized = (0, roles_js_1.normalizeRole)(rawRole) ?? String(rawRole);
    throw new PermissionDenied(`Permission '${permission}' required. Your role '${normalized}' does not have it.`);
}
function requireRole(userOrRole, role) {
    const roles = typeof userOrRole === 'string' ? [userOrRole] : userOrRole?.roles?.length ? userOrRole.roles : userOrRole?.role ? [userOrRole.role] : [];
    if (roles.some((candidate) => (0, roles_js_1.normalizeRole)(candidate) === role))
        return;
    throw new PermissionDenied(`Role '${role}' required.`);
}
//# sourceMappingURL=index.js.map