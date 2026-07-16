/**
 * Resolve the API base URL.
 *
 * On Vercel (production or preview), always use a relative path so the
 * Vercel `rewrites` proxy forwards requests to Railway — no CORS needed.
 * In local development, respect `VITE_API_BASE_URL` if set, otherwise
 * default to `/api`.
 */
export function getApiBaseUrl() {
    if (typeof window !== 'undefined' && typeof location !== 'undefined') {
        const hostname = location.hostname;
        // Vercel deployment — rely on the Vercel proxy
        if (hostname.endsWith('.vercel.app') ||
            hostname === 'ops.tufsports.us' ||
            hostname === 'tufops.app') {
            return '/api/v1';
        }
    }
    const viteEnv = import.meta.env;
    const envBase = viteEnv?.VITE_API_BASE_URL;
    // In production build, prefer relative path unless an explicit relative
    // base URL is set (absolute URLs bypass the proxy and trigger CORS).
    if (viteEnv?.PROD) {
        if (envBase && envBase.startsWith('/'))
            return envBase.replace(/\/$/, '');
        return '/api/v1';
    }
    return (envBase || '/api/v1').replace(/\/$/, '');
}
//# sourceMappingURL=apiBaseUrl.js.map