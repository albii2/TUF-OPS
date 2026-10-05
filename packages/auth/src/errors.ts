/**
 * TUF Ops — shared authorization error.
 *
 * Extracted from `index.ts` so the 2.0 authorization model
 * (`authorization.ts`) and the legacy guards can both throw the same error
 * without a circular import between them.
 */
export class PermissionDenied extends Error {
  statusCode = 403;

  constructor(message: string) {
    super(message);
    this.name = 'PermissionDenied';
  }
}
