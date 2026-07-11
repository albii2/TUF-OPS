export type DataMode = 'mock' | 'api';
// TUF Ops is a live production system. The PostgreSQL database is the single source of truth.
// During transition: set to 'api' once all hooks and pages handle async loading without crashes.
export const DATA_MODE: DataMode = (import.meta.env.VITE_DATA_MODE || 'mock') === 'api' ? 'api' : 'mock';
