import { useQuery } from '@tanstack/react-query';
import { getRepCoverage, getUntouchedAccounts, listTerritories } from '../services/territoryService';
import { queryKeys } from '../api';

export function useTerritories() {
  return useQuery({
    queryKey: queryKeys.territory.list(),
    queryFn: listTerritories,
  });
}

export function useRepCoverage() {
  return useQuery({
    queryKey: queryKeys.territory.repCoverage(),
    queryFn: getRepCoverage,
  });
}

export function useUntouchedAccounts() {
  return useQuery({
    queryKey: queryKeys.territory.untouched(),
    queryFn: getUntouchedAccounts,
  });
}
