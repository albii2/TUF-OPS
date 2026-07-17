/**
 * Resolve the API base URL.
 *
 * On Vercel (production or preview), always use a relative path so the
 * Vercel `rewrites` proxy forwards requests to Railway — no CORS needed.
 * In local development, respect `VITE_API_BASE_URL` if set, otherwise
 * default to `/api`.
 */
export declare function getApiBaseUrl(): string;
//# sourceMappingURL=apiBaseUrl.d.ts.map