import { normalizeAccountName, toTitleCase } from './naming';

type RawRow = Record<string, string>;
export type NormalizedLead = {
  organizationName: string; accountType: string; sourceUrl: string; websiteUrl: string; brandColors: string; address: string; city: string; state: string; zip: string; phone: string;
  enrollmentOrSize: string; districtOrLeague: string; primaryContactName: string; primaryContactTitle: string; primaryContactEmail: string; primaryContactPhone: string;
  sportsOffered: string[]; sportUrls: string[]; tufZone: string; territory: 'metro'|'north'|'west'|'south'|''; tufPriority: string; sourceType: string; duplicateKey: string; validationErrors: string[];
};

const TERRITORY_MAP: Record<string, 'metro'|'north'|'west'|'south'> = { metro: 'metro', north: 'north', west: 'west', south: 'south' };

export function mapCsvHeaders(headers: string[]) {
  const mapped = headers.map((h) => h.trim().toLowerCase());
  return Object.fromEntries(headers.map((h, i) => [h, mapped[i]]));
}

export function parseSportsFromWideColumns(row: RawRow) {
  const sports = ['football','basketball','hockey','baseball'] as const;
  const offered: string[] = [];
  const urls: string[] = [];
  sports.forEach((s) => {
    if ((row[`${s}_offered`] ?? '').toLowerCase() === 'yes' || (row[`${s}_offered`] ?? '').toLowerCase() === 'true') offered.push(toTitleCase(s));
    if (row[`${s}_urls`]) urls.push(row[`${s}_urls`]);
  });
  if (row.sports_offered) offered.push(...row.sports_offered.split('|').map((x) => toTitleCase(x.trim())).filter(Boolean));
  if (row.sport_urls) urls.push(...row.sport_urls.split('|').map((x) => x.trim()).filter(Boolean));
  return { sportsOffered: Array.from(new Set(offered)), sportUrls: urls };
}

export function buildDuplicateKey(row: { organizationName: string; state: string }) {
  return `${normalizeAccountName(row.organizationName)}|${(row.state || '').toUpperCase()}`.toLowerCase();
}

export function validateLeadRow(row: NormalizedLead) {
  const errors: string[] = [];
  if (!row.organizationName) errors.push('organizationName required');
  if (!row.city) errors.push('city required');
  if (!row.state) errors.push('state required');
  if (!row.accountType) errors.push('accountType required');
  if (row.primaryContactEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(row.primaryContactEmail)) errors.push('invalid contact email');
  if (row.tufZone && !row.territory) errors.push('unknown territory/zone');
  return errors;
}

export function normalizeLeadRow(rawRow: RawRow): NormalizedLead {
  const sports = parseSportsFromWideColumns(rawRow);
  const territoryKey = (rawRow.tuf_zone || rawRow.territory || '').toLowerCase().trim();
  const territory = TERRITORY_MAP[territoryKey] ?? '';
  const [city = '', state = '', zip = ''] = (rawRow.address || '').split(',').map((x) => x.trim());
  const normalized: NormalizedLead = {
    organizationName: normalizeAccountName(rawRow.school_name || rawRow.organization_name || ''),
    accountType: rawRow.account_type || 'High School',
    sourceUrl: rawRow.school_url || '', websiteUrl: rawRow.website_link || rawRow.website_url || '', brandColors: rawRow.school_colors || '',
    address: rawRow.address || '', city: rawRow.city || city, state: (rawRow.state || state).toUpperCase(), zip: rawRow.zip || zip, phone: rawRow.phone_number || rawRow.phone || '',
    enrollmentOrSize: rawRow.enrollment || '', districtOrLeague: rawRow.isd_number || rawRow.district_or_league || '',
    primaryContactName: normalizeAccountName(rawRow.activities_director_name || rawRow.primary_contact_name || ''), primaryContactTitle: rawRow.primary_contact_title || 'Activities Director',
    primaryContactEmail: rawRow.activities_director_email || rawRow.primary_contact_email || '', primaryContactPhone: rawRow.activities_director_phone_number || rawRow.primary_contact_phone || '',
    sportsOffered: sports.sportsOffered, sportUrls: sports.sportUrls, tufZone: rawRow.tuf_zone || '', territory,
    tufPriority: rawRow.tuf_priority || '', sourceType: rawRow.source_type || 'csv', duplicateKey: '', validationErrors: [],
  };
  normalized.duplicateKey = buildDuplicateKey(normalized);
  normalized.validationErrors = validateLeadRow(normalized);
  return normalized;
}
