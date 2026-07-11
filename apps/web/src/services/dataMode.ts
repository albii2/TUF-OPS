export type DataMode = 'mock' | 'api';
// Vercel builds with VITE_DATA_MODE=api — always use live PostgreSQL.
export const DATA_MODE: DataMode = (import.meta.env.VITE_DATA_MODE || 'api') === 'mock' ? 'mock' : 'api';
