export type DataMode = 'mock' | 'api';
// Forced to mock until API/CORS infrastructure is stable for 6-25 users
export const DATA_MODE: DataMode = 'mock';