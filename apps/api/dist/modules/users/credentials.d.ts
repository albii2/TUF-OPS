export declare function hashCredential(credential: string): Promise<string>;
export declare function verifyCredential(credential: string, storedHash: string): Promise<boolean>;
export declare function generateTemporaryCredential(): string;
export declare function validateTemporaryCredential(credential: string): void;
export declare function validatePermanentCredential(credential: string): void;
//# sourceMappingURL=credentials.d.ts.map