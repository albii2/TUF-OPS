import { useMemo } from 'react';
import { getRepCoverage, getTerritoryOverview, getTerritoryPressure, getUntouchedAccounts, listTerritories } from '../services/territoryService';

export function useTerritories() { return useMemo(() => listTerritories(), []); }
export function useTerritoryOverview() { return useMemo(() => getTerritoryOverview(), []); }
export function useRepCoverage() { return useMemo(() => getRepCoverage(), []); }
export function useUntouchedAccounts() { return useMemo(() => getUntouchedAccounts(), []); }
export function useTerritoryPressure() { return useMemo(() => getTerritoryPressure(), []); }
