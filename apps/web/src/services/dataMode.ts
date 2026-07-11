export type DataMode = 'mock' | 'api';
// Set VITE_DATA_MODE=api at build time to switch to live PostgreSQL mode.
export const DATA_MODE: DataMode = (import.meta.env.VITE_DATA_MODE || 'mock') === 'api' ? 'api' : 'mock';
