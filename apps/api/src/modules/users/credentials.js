"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashCredential = hashCredential;
exports.verifyCredential = verifyCredential;
exports.generateRandomPin = generateRandomPin;
exports.generateUniquePin = generateUniquePin;
exports.validatePin = validatePin;
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
/** Generate a random 4-digit PIN (0000–9999). */
function generateRandomPin() {
    return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
}
/**
 * Generate a unique 4-digit PIN not used by any active user.
 * Verifies uniqueness by checking every active user's stored hash.
 */
async function generateUniquePin(verifyAgainstUser) {
    for (let attempt = 0; attempt < 50; attempt++) {
        const pin = generateRandomPin();
        const taken = await verifyAgainstUser(pin);
        if (!taken)
            return pin;
    }
    throw new Error('Could not generate a unique PIN after 50 attempts');
}
function validatePin(pin) {
    if (!pin || !pin.trim())
        throw new Error('PIN is required');
    if (!/^\d{4}$/.test(pin))
        throw new Error('PIN must be exactly 4 digits');
}
//# sourceMappingURL=credentials.js.map