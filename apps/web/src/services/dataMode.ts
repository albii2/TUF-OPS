export type DataMode = 'mock' | 'api';
export const DATA_MODE: DataMode = (import.meta.env.VITE_DATA_MODE || 'mock') === 'api' ? 'api' : 'mock';