import type { RevenueLane } from '../data/mockSalesData';

export function toTitleCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((part) => {
      if (/^\d+u$/.test(part)) return `${part.slice(0, -1)}U`;
      if (/^\d+(st|nd|rd|th)$/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');
}

export const normalizeAccountName = (value: string) => toTitleCase(value);
export const normalizeSport = (value: string) => toTitleCase(value);
export const normalizeProgramLevel = (value: string) => toTitleCase(value);
export const normalizeSeasonCode = (value: string) => value.trim().toUpperCase();

export function getSeasonLabel(code: string): string {
  const key = normalizeSeasonCode(code).slice(0, 2);
  if (key === 'SP') return 'Spring';
  if (key === 'SU') return 'Summer';
  if (key === 'FA') return 'Fall';
  if (key === 'WI') return 'Winter';
  return 'Unknown';
}

export function getLaneLabel(lane: RevenueLane): string {
  return lane === 'TRAVEL_GEAR' ? 'Team Gear' : toTitleCase(lane.replace('_', ' '));
}

export function buildOpportunityDisplayName(input: { programLevel: string; sport: string; seasonCode: string; lane: RevenueLane }): string {
  return `${normalizeProgramLevel(input.programLevel)} ${normalizeSport(input.sport)} ${normalizeSeasonCode(input.seasonCode)} — ${getLaneLabel(input.lane)}`;
}
