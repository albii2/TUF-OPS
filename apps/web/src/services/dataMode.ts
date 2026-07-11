export type DataMode = 'mock' | 'api';
// TUF Ops is a live production system. Always use the API — the PostgreSQL database is the single source of truth.
export const DATA_MODE: DataMode = 'api';
