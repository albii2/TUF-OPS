"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("../index.js");
describe('hasPermission', () => {
    it('should return true for a user with the required permission', () => {
        const user = { id: '1', roles: [index_js_1.roles.ADMIN] };
        expect((0, index_js_1.hasPermission)(user, index_js_1.permissions.ORGANIZATIONS_WRITE)).toBe(true);
    });
    it('should return false for a user without the required permission', () => {
        const user = { id: '1', roles: [index_js_1.roles.USER] };
        expect((0, index_js_1.hasPermission)(user, index_js_1.permissions.ORGANIZATIONS_WRITE)).toBe(false);
    });
    it('should return false for a user with no roles', () => {
        const user = { id: '1', roles: [] };
        expect((0, index_js_1.hasPermission)(user, index_js_1.permissions.ORGANIZATIONS_READ)).toBe(false);
    });
    it('should return false for a null or undefined user', () => {
        expect((0, index_js_1.hasPermission)(null, index_js_1.permissions.ORGANIZATIONS_READ)).toBe(false);
        expect((0, index_js_1.hasPermission)(undefined, index_js_1.permissions.ORGANIZATIONS_READ)).toBe(false);
    });
    it('should handle users with multiple roles', () => {
        const user = { id: '1', roles: [index_js_1.roles.USER, index_js_1.roles.ADMIN] };
        expect((0, index_js_1.hasPermission)(user, index_js_1.permissions.ORGANIZATIONS_WRITE)).toBe(true);
    });
});
