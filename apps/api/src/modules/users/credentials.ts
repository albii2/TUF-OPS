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

export function generateTemporaryCredential(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function validateTemporaryCredential(credential: string) {
  if (!credential || !credential.trim()) throw new Error('Credential is required');
  if (!/^\d{4,}$/.test(credential)) throw new Error('Credential must be at least 4 numbers');
}

export function validatePermanentCredential(credential: string) {
  validateTemporaryCredential(credential);
  const weak = new Set(['0000', '1111', '1234', '4321', '1212', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999']);
  if (weak.has(credential) || /^(\d)\1+$/.test(credential)) throw new Error('Choose a less obvious credential');
}
