export type DataMode = 'mock' | 'api';
// PostgreSQL persistence deferred until migration/infrastructure stabilizes.
// localStorage handles 6-25 users reliably. No CORS, no token, no database.
export const DATA_MODE: DataMode = 'mock';