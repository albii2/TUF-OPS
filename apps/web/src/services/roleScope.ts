import { getStoredUser } from '../auth';
import type { Opportunity, Order, Organization, TerritoryId } from '../data/mockSalesData';
import { getManagedRepNamesForDirector, getManagedTerritoriesForDirector } from './usersService';

export function getViewer() {
  return getStoredUser();
}

export function getDirectorRepSet(directorName: string) {
  return new Set(getManagedRepNamesForDirector(directorName));
}

export function getDirectorTerritorySet(directorName: string) {
  return new Set<TerritoryId>(getManagedTerritoriesForDirector(directorName));
}

export function canViewOrganization(org: Organization) {
  const user = getViewer();
  if (!user || user.role === 'OWNER' || user.role === 'OPS') return true;
  if (user.role === 'REP') return org.assignedRep === user.name;
  if (user.role === 'DIRECTOR') {
    const territories = getDirectorTerritorySet(user.name);
    const reps = getDirectorRepSet(user.name);
    return org.assignedDirector === user.name || reps.has(org.assignedRep) || territories.has(org.territory);
  }
  return false;
}

export function canViewOpportunity(opp: Opportunity) {
  const user = getViewer();
  if (!user || user.role === 'OWNER' || user.role === 'OPS') return true;
  if (user.role === 'REP') return opp.assignedRep === user.name;
  if (user.role === 'DIRECTOR') {
    const reps = getDirectorRepSet(user.name);
    return reps.has(opp.assignedRep) || opp.assignedRep === user.name;
  }
  return false;
}

export function canViewOrder(order: Order, linkedOpportunity?: Opportunity) {
  const user = getViewer();
  if (!user || user.role === 'OWNER' || user.role === 'OPS') return true;
  const orderRep = order.assignedRep ?? linkedOpportunity?.assignedRep;
  const orderDirector = order.assignedDirector ?? linkedOpportunity?.assignedDirector;
  if (user.role === 'REP') return orderRep === user.name;
  if (user.role === 'DIRECTOR') return orderDirector === user.name || (!!orderRep && getDirectorRepSet(user.name).has(orderRep));
  return false;
}

export function canAdvanceOpportunity(opp: Opportunity) {
  const user = getViewer();
  if (!user) return false;
  if (user.role === 'OWNER') return true;
  if (user.role === 'REP') return opp.assignedRep === user.name;
  return false;
}

export function getAdvanceDeniedMessage(opp: Opportunity) {
  const user = getViewer();
  if (!user) return 'Log in before advancing an opportunity.';
  if (user.role === 'DIRECTOR') return 'Directors have read-only stage visibility for rep-owned opportunities in V0.8.5.';
  if (user.role === 'REP' && opp.assignedRep !== user.name) return 'You can only advance opportunities assigned to you.';
  return 'You do not have permission to advance this opportunity.';
}
