var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/roles.js
var require_roles = __commonJS({
  "src/roles.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.rolePermissions = exports.permissions = exports.roles = void 0;
    exports.roles = {
      ADMIN: "admin",
      USER: "user"
    };
    exports.permissions = {
      ORGANIZATIONS_READ: "organizations:read",
      ORGANIZATIONS_WRITE: "organizations:write",
      OPPORTUNITIES_READ: "opportunities:read",
      OPPORTUNITIES_WRITE: "opportunities:write"
    };
    exports.rolePermissions = {
      [exports.roles.ADMIN]: [
        exports.permissions.ORGANIZATIONS_READ,
        exports.permissions.ORGANIZATIONS_WRITE,
        exports.permissions.OPPORTUNITIES_READ,
        exports.permissions.OPPORTUNITIES_WRITE
      ],
      [exports.roles.USER]: [
        exports.permissions.ORGANIZATIONS_READ,
        exports.permissions.OPPORTUNITIES_READ
      ]
    };
  }
});

// src/index.ts
var index_exports = {};
__export(index_exports, {
  hasPermission: () => hasPermission
});
var import_roles = __toESM(require_roles());
__reExport(index_exports, __toESM(require_roles()));
function hasPermission(user, permission) {
  if (!user || !user.roles) {
    return false;
  }
  for (const role of user.roles) {
    const userPermissions = import_roles.rolePermissions[role];
    if (userPermissions && userPermissions.includes(permission)) {
      return true;
    }
  }
  return false;
}
export {
  hasPermission
};
