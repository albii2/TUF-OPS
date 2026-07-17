export declare function hashCredential(credential: string): Promise<string>;
export declare function verifyCredential(credential: string, storedHash: string): Promise<boolean>;
/** Generate a random 4-digit PIN (0000–9999). */
export declare function generateRandomPin(): string;
/**
 * Generate a unique 4-digit PIN not used by any active user.
 * Verifies uniqueness by checking every active user's stored hash.
 */
export declare function generateUniquePin(verifyAgainstUser: (pin: string) => Promise<boolean>): Promise<string>;
export declare function validatePin(pin: string): void;
//# sourceMappingURL=credentials.d.ts.map