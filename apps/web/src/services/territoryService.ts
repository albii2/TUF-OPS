import { repCoverage, territories, territoryPressure, untouchedAccountsQueue } from '../data/territoryMock';

export const listTerritories = () => territories;
export const getTerritoryOverview = () => territories[0];
export const getRepCoverage = () => repCoverage;
export const getUntouchedAccounts = () => untouchedAccountsQueue;
export const getTerritoryPressure = () => territoryPressure;
