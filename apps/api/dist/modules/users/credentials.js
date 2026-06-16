"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashCredential = hashCredential;
exports.verifyCredential = verifyCredential;
exports.generateTemporaryCredential = generateTemporaryCredential;
exports.validateTemporaryCredential = validateTemporaryCredential;
exports.validatePermanentCredential = validatePermanentCredential;
const crypto_1 = require("crypto");
const util_1 = require("util");
const scrypt = (0, util_1.promisify)(crypto_1.scrypt);
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 };
async function hashCredential(credential) {
    const salt = (0, crypto_1.randomBytes)(16).toString('base64url');
    const key = (await scrypt(credential, salt, KEY_LENGTH, SCRYPT_OPTIONS));
    return `scrypt$${SCRYPT_OPTIONS.N}$${SCRYPT_OPTIONS.r}$${SCRYPT_OPTIONS.p}$${salt}$${key.toString('base64url')}`;
}
async function verifyCredential(credential, storedHash) {
    const [algorithm, n, r, p, salt, encodedKey] = storedHash.split('$');
    if (algorithm !== 'scrypt' || !n || !r || !p || !salt || !encodedKey)
        return false;
    const expected = Buffer.from(encodedKey, 'base64url');
    const actual = (await scrypt(credential, salt, expected.length, { N: Number(n), r: Number(r), p: Number(p) }));
    return expected.length === actual.length && (0, crypto_1.timingSafeEqual)(expected, actual);
}
function generateTemporaryCredential() {
    return String(Math.floor(100000 + Math.random() * 900000));
}
function validateTemporaryCredential(credential) {
    if (!credential || !credential.trim())
        throw new Error('Credential is required');
    if (!/^\d{4,}$/.test(credential))
        throw new Error('Credential must be at least 4 numbers');
}
function validatePermanentCredential(credential) {
    validateTemporaryCredential(credential);
    const weak = new Set(['0000', '1111', '1234', '4321', '1212', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999']);
    if (weak.has(credential) || /^(\d)\1+$/.test(credential))
        throw new Error('Choose a less obvious credential');
}
//# sourceMappingURL=credentials.js.map