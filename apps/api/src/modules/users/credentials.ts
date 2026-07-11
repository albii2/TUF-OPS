import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 } as const;

export async function hashCredential(credential: string): Promise<string> {
  const salt = randomBytes(16).toString('base64url');
  const key = (await (scrypt as any)(credential, salt, KEY_LENGTH, SCRYPT_OPTIONS)) as Buffer;
  return `scrypt$${SCRYPT_OPTIONS.N}$${SCRYPT_OPTIONS.r}$${SCRYPT_OPTIONS.p}$${salt}$${key.toString('base64url')}`;
}

export async function verifyCredential(credential: string, storedHash: string): Promise<boolean> {
  const [algorithm, n, r, p, salt, encodedKey] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !n || !r || !p || !salt || !encodedKey) return false;
  const expected = Buffer.from(encodedKey, 'base64url');
  const actual = (await (scrypt as any)(credential, salt, expected.length, { N: Number(n), r: Number(r), p: Number(p) })) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** Generate a random 4-digit PIN (0000–9999). */
export function generateRandomPin(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
}

/**
 * Generate a unique 4-digit PIN not used by any active user.
 * Verifies uniqueness by checking every active user's stored hash.
 */
export async function generateUniquePin(verifyAgainstUser: (pin: string) => Promise<boolean>): Promise<string> {
  for (let attempt = 0; attempt < 50; attempt++) {
    const pin = generateRandomPin();
    const taken = await verifyAgainstUser(pin);
    if (!taken) return pin;
  }
  throw new Error('Could not generate a unique PIN after 50 attempts');
}

export function validatePin(pin: string) {
  if (!pin || !pin.trim()) throw new Error('PIN is required');
  if (!/^\d{4}$/.test(pin)) throw new Error('PIN must be exactly 4 digits');
}
