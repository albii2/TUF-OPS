import { getStoredUser } from '../auth';
import type { AppUser } from '../types';
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
  if (!user || user.role === 'ADMIN' || user.role === 'REGIONAL_DIRECTOR') return true;
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
  if (!user || user.role === 'ADMIN' || user.role === 'REGIONAL_DIRECTOR') return true;
  if (user.role === 'REP') return opp.assignedRep === user.name;
  if (user.role === 'DIRECTOR') {
    const reps = getDirectorRepSet(user.name);
    return reps.has(opp.assignedRep) || opp.assignedRep === user.name;
  }
  return false;
}

export function canViewOrder(order: Order, linkedOpportunity?: Opportunity) {
  const user = getViewer();
  if (!user || user.role === 'ADMIN' || user.role === 'REGIONAL_DIRECTOR') return true;
  const orderRep = order.assignedRep ?? linkedOpportunity?.assignedRep;
  const orderDirector = order.assignedDirector ?? linkedOpportunity?.assignedDirector;
  if (user.role === 'REP') return orderRep === user.name;
  if (user.role === 'DIRECTOR') return orderDirector === user.name || (!!orderRep && getDirectorRepSet(user.name).has(orderRep));
  return false;
}

export function isRepCertified(user: AppUser | null) {
  if (!user) return false;
  return user.isCertified === true;
}

export function canCreateOpportunity() {
  const user = getViewer();
  if (!user) return false;
  if (user.role === 'ADMIN' || user.role === 'REGIONAL_DIRECTOR' || user.role === 'DIRECTOR') return true;
  const isSandboxActive = typeof window !== 'undefined' && localStorage.getItem('tuf_combine_sandbox_active') === 'true';
  if (user.role === 'REP') return isRepCertified(user) || isSandboxActive;
  return false;
}

export function canAdvanceOpportunity(opp: Opportunity) {
  const user = getViewer();
  if (!user) return false;
  const isSandboxActive = typeof window !== 'undefined' && localStorage.getItem('tuf_combine_sandbox_active') === 'true';
  if (!isRepCertified(user) && !isSandboxActive) return false;
  if (user.role === 'ADMIN') return true;
  if (user.role === 'REP') return opp.assignedRep === user.name;
  // DIRECTOR can advance opportunities assigned to them (personal book) or to their reps
  if (user.role === 'DIRECTOR') return opp.assignedRep === user.name;
  return false;
}

export function getAdvanceDeniedMessage(opp: Opportunity) {
  const user = getViewer();
  if (!user) return 'Log in before advancing an opportunity.';
  const isSandboxActive = typeof window !== 'undefined' && localStorage.getItem('tuf_combine_sandbox_active') === 'true';
  if (!isRepCertified(user) && !isSandboxActive) return 'Onboarding and certification is required before you can perform sales actions.';
  if (user.role === 'DIRECTOR') return opp.assignedRep === user.name ? '' : 'You can only advance opportunities assigned to you.';
  if (user.role === 'REP' && opp.assignedRep !== user.name) return 'You can only advance opportunities assigned to you.';
  return 'You do not have permission to advance this opportunity.';
}
