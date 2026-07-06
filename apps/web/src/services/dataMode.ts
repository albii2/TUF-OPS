export type DataMode = 'mock' | 'api';
// PostgreSQL persistence — source of truth for production
export const DATA_MODE: DataMode = (import.meta.env.VITE_DATA_MODE || 'mock') === 'api' ? 'api' : 'mock';