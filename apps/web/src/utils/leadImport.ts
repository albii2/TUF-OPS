import { normalizeAccountName, toTitleCase } from './naming';

type RawRow = Record<string, string>;
export type NormalizedLead = {
  organizationName: string; accountType: string; sourceUrl: string; websiteUrl: string; brandColors: string; address: string; city: string; state: string; zip: string; phone: string;
  enrollmentOrSize: string; districtOrLeague: string; primaryContactName: string; primaryContactTitle: string; primaryContactEmail: string; primaryContactPhone: string;
  athleticDirectorName: string; athleticDirectorEmail: string; athleticDirectorPhone: string; headCoachName: string; headCoachEmail: string; headCoachPhone: string;
  sportsOffered: string[]; sportUrls: string[]; tufZone: string; territory: 'metro'|'north'|'west'|'south'|''; tufPriority: string; sourceType: string; duplicateKey: string; validationErrors: string[];
};

const TERRITORY_MAP: Record<string, 'metro'|'north'|'west'|'south'> = {
  metro: 'metro',
  'tuf metro': 'metro',
  north: 'north',
  'tuf north': 'north',
  west: 'west',
  'tuf west': 'west',
  south: 'south',
  'tuf south': 'south',
  // East-metro schools (Woodbury/Stillwater/Hastings) belong in the Metro command zone.
  east: 'metro',
  'tuf east': 'metro',
};

function normalizeTerritory(value: string): 'metro'|'north'|'west'|'south'|'' {
  const territoryKey = value.toLowerCase().trim();
  if (!territoryKey || territoryKey === 'unassigned') return '';
  return TERRITORY_MAP[territoryKey] ?? '';
}

function parseMinnesotaAddress(address: string) {
  const normalized = address.replace(/\s+/g, ' ').trim();
  const match = normalized.match(/^(.+?)\s*,\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i);
  if (!match) return { city: '', state: '', zip: '' };

  const streetAndCity = match[1].trim();
  const words = streetAndCity.split(' ').filter(Boolean);
  const streetTerminators = new Set([
    'avenue', 'ave', 'boulevard', 'blvd', 'circle', 'cir', 'court', 'ct', 'drive', 'dr', 'east', 'highway', 'hwy', 'lane', 'ln',
    'north', 'parkway', 'pkwy', 'place', 'pl', 'road', 'rd', 'se', 'south', 'street', 'st', 'trail', 'way', 'west',
  ]);
  const directionals = new Set(['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']);
  const cleanToken = (word: string) => word.toLowerCase().replace(/\.$/, '');
  const stripNonCityLeadTokens = (candidateWords: string[]) => {
    const cleaned = [...candidateWords];

    while (cleaned.length && directionals.has(cleanToken(cleaned[0]))) cleaned.shift();

    if (cleaned.length >= 2 && cleanToken(cleaned[0]) === 'po' && cleanToken(cleaned[1]) === 'box') {
      cleaned.splice(0, Math.min(3, cleaned.length));
    }

    while (cleaned.length && directionals.has(cleanToken(cleaned[0]))) cleaned.shift();

    return cleaned;
  };
  const terminatorIndex = words.reduce((lastIndex, word, index) => (streetTerminators.has(cleanToken(word)) ? index : lastIndex), -1);
  const rawCityWords = terminatorIndex >= 0 ? words.slice(terminatorIndex + 1) : words.slice(-2);
  const city = stripNonCityLeadTokens(rawCityWords).join(' ');
  return { city, state: match[2].toUpperCase(), zip: match[3] };
}

function firstPresent(row: RawRow, keys: string[]) {
  return keys.map((key) => row[key]?.trim() ?? '').find(Boolean) ?? '';
}

function normalizePhone(value: string) {
  return value.trim();
}

function normalizeEmail(value: string) {
  return value.trim();
}

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
  if (row.headCoachEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(row.headCoachEmail)) errors.push('invalid head coach email');
  return errors;
}

export function normalizeLeadRow(rawRow: RawRow): NormalizedLead {
  const sports = parseSportsFromWideColumns(rawRow);
  const territory = normalizeTerritory(rawRow.tuf_zone || rawRow.territory || '');
  const addressParts = parseMinnesotaAddress(rawRow.address || '');
  const athleticDirectorName = normalizeAccountName(firstPresent(rawRow, ['activities_director_name', 'athletic_director_name', 'athletic_director', 'ad_name', 'primary_contact_name']));
  const athleticDirectorEmail = normalizeEmail(firstPresent(rawRow, ['activities_director_email', 'athletic_director_email', 'ad_email', 'primary_contact_email']));
  const athleticDirectorPhone = normalizePhone(firstPresent(rawRow, ['activities_director_phone_number', 'activities_director_phone', 'athletic_director_phone_number', 'athletic_director_phone', 'ad_phone', 'primary_contact_phone']));
  const headCoachName = normalizeAccountName(firstPresent(rawRow, ['head_coach_name', 'head_coach', 'coach_name', 'primary_head_coach_name', 'football_head_coach_name', 'football_coach_name']));
  const headCoachEmail = normalizeEmail(firstPresent(rawRow, ['head_coach_email', 'coach_email', 'primary_head_coach_email', 'football_head_coach_email', 'football_coach_email']));
  const headCoachPhone = normalizePhone(firstPresent(rawRow, ['head_coach_phone_number', 'head_coach_phone', 'coach_phone_number', 'coach_phone', 'primary_head_coach_phone', 'football_head_coach_phone', 'football_coach_phone']));
  const normalized: NormalizedLead = {
    organizationName: normalizeAccountName(rawRow.school_name || rawRow.organization_name || ''),
    accountType: rawRow.account_type || 'High School',
    sourceUrl: rawRow.school_url || '', websiteUrl: rawRow.website_link || rawRow.website_url || '', brandColors: rawRow.school_colors || '',
    address: rawRow.address || '', city: rawRow.city || addressParts.city, state: (rawRow.state || addressParts.state).toUpperCase(), zip: rawRow.zip || addressParts.zip, phone: normalizePhone(rawRow.phone_number || rawRow.school_phone || rawRow.phone || ''),
    enrollmentOrSize: rawRow.enrollment || '', districtOrLeague: rawRow.isd_number || rawRow.district_or_league || '',
    primaryContactName: athleticDirectorName, primaryContactTitle: rawRow.primary_contact_title || 'Activities Director',
    primaryContactEmail: athleticDirectorEmail, primaryContactPhone: athleticDirectorPhone,
    athleticDirectorName, athleticDirectorEmail, athleticDirectorPhone, headCoachName, headCoachEmail, headCoachPhone,
    sportsOffered: sports.sportsOffered, sportUrls: sports.sportUrls, tufZone: rawRow.tuf_zone || '', territory,
    tufPriority: rawRow.tuf_priority || '', sourceType: rawRow.source_type || 'csv', duplicateKey: '', validationErrors: [],
  };
  normalized.duplicateKey = buildDuplicateKey(normalized);
  normalized.validationErrors = validateLeadRow(normalized);
  return normalized;
}

export function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(field.trim());
      field = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(field.trim());
      field = '';
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.trim());
    if (row.some((c) => c.length > 0)) rows.push(row);
  }

  return rows;
}
