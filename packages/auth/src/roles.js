"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolePermissions = exports.permissions = exports.roles = void 0;
exports.roles = {
    ADMIN: 'admin',
    USER: 'user',
};
exports.permissions = {
    ORGANIZATIONS_READ: 'organizations:read',
    ORGANIZATIONS_WRITE: 'organizations:write',
    OPPORTUNITIES_READ: 'opportunities:read',
    OPPORTUNITIES_WRITE: 'opportunities:write',
};
exports.rolePermissions = {
    [exports.roles.ADMIN]: [
        exports.permissions.ORGANIZATIONS_READ,
        exports.permissions.ORGANIZATIONS_WRITE,
        exports.permissions.OPPORTUNITIES_READ,
        exports.permissions.OPPORTUNITIES_WRITE,
    ],
    [exports.roles.USER]: [
        exports.permissions.ORGANIZATIONS_READ,
        exports.permissions.OPPORTUNITIES_READ,
    ],
};
