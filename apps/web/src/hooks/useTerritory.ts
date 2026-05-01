import { useMemo } from 'react';
import { getRepCoverage, getUntouchedAccounts, listTerritories } from '../services/territoryService';

export function useTerritories() { return useMemo(() => listTerritories(), []); }
export function useRepCoverage() { return useMemo(() => getRepCoverage(), []); }
export function useUntouchedAccounts() { return useMemo(() => getUntouchedAccounts(), []); }
