import { organizations } from './mockSalesData';

export type TerritoryZoneId = 'metro' | 'north' | 'west' | 'south';

export type Territory = {
  id: TerritoryZoneId;
  name: string;
  accounts: number;
  untouched: number;
  pipeline: number;
  closed: number;
};

export const territories: Territory[] = [
  { id: 'metro', name: 'TUF Metro', accounts: 112, untouched: 38, pipeline: 185000, closed: 42000 },
  { id: 'north', name: 'North Zone', accounts: 76, untouched: 29, pipeline: 94000, closed: 18000 },
  { id: 'west', name: 'West Zone', accounts: 64, untouched: 22, pipeline: 73000, closed: 12000 },
  { id: 'south', name: 'South Zone', accounts: 44, untouched: 16, pipeline: 60000, closed: 14000 },
];

export const repCoverage = [
  { rep: 'Maya Cole', territory: 'metro', accounts: 32, pipeline: 80000, closed: 12000, untouched: 10 },
  { rep: 'Evan Shaw', territory: 'metro', accounts: 28, pipeline: 61000, closed: 9000, untouched: 12 },
  { rep: 'Chris Vale', territory: 'north', accounts: 24, pipeline: 54000, closed: 8000, untouched: 8 },
];

export const untouchedAccountsQueue = organizations
  .filter((o) => o.coverageStatus === 'UNTOUCHED')
  .map((o) => ({ id: o.id, name: o.name, territory: o.territory, state: o.state }))
  .slice(0, 20);
