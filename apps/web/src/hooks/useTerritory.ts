import { useEffect, useState } from 'react';
import { getRepCoverage, getUntouchedAccounts, listTerritories } from '../services/territoryService';

export function useTerritories() {
  const [data, setData] = useState<ReturnType<typeof listTerritories> extends Promise<infer T> ? T : never>([]);
  useEffect(() => {
    let cancelled = false;
    listTerritories().then((v) => { if (!cancelled) setData(v); });
    return () => { cancelled = true; };
  }, []);
  return data;
}
export function useRepCoverage() {
  const [data, setData] = useState<ReturnType<typeof getRepCoverage> extends Promise<infer T> ? T : never>([]);
  useEffect(() => {
    let cancelled = false;
    getRepCoverage().then((v) => { if (!cancelled) setData(v); });
    return () => { cancelled = true; };
  }, []);
  return data;
}
export function useUntouchedAccounts() {
  const [data, setData] = useState<ReturnType<typeof getUntouchedAccounts> extends Promise<infer T> ? T : never>([]);
  useEffect(() => {
    let cancelled = false;
    getUntouchedAccounts().then((v) => { if (!cancelled) setData(v); });
    return () => { cancelled = true; };
  }, []);
  return data;
}
