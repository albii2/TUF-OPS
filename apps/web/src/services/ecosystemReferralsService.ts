import { getStoredUser } from '../auth';
import { listOrganizations } from './organizationsService';
import { listOpportunities } from './opportunitiesService';
import { getManagedRepNamesForDirector } from './usersService';

export type ReferredOrganizationType =
  | 'Youth Football'
  | 'Youth Basketball'
  | 'Youth Wrestling'
  | 'Youth Baseball'
  | 'Youth Softball'
  | 'Volleyball Club'
  | 'Booster Club'
  | 'Parent Organization'
  | 'Other';

export type WarmIntroductionStatus = 'Mentioned' | 'Referred' | 'Introduced' | 'Contacted' | 'Qualified';

export type EcosystemReferral = {
  id: string;
  referralSourceOrganizationId: string;
  referralSourceOrganization: string;
  referralSourceContact: string;
  referralSourceRole: string;
  referredOrganizationName: string;
  referredOrganizationType: ReferredOrganizationType;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  relationshipNotes: string;
  warmIntroductionStatus: WarmIntroductionStatus;
  linkedOpportunityId?: string;
  linkedOpportunityName?: string;
  assignedRep: string;
  createdAt: string;
  estimatedRevenue: number;
  revenueGenerated: number;
};

export type ReferralPipelineParams = {
  status?: 'ALL' | WarmIntroductionStatus;
  rep?: string;
  sourceOrganizationId?: string;
  search?: string;
  refreshKey?: number;
};

export const referredOrganizationTypes: ReferredOrganizationType[] = [
  'Youth Football',
  'Youth Basketball',
  'Youth Wrestling',
  'Youth Baseball',
  'Youth Softball',
  'Volleyball Club',
  'Booster Club',
  'Parent Organization',
  'Other',
];

export const warmIntroductionStatuses: WarmIntroductionStatus[] = ['Mentioned', 'Referred', 'Introduced', 'Contacted', 'Qualified'];

const LOCAL_REFERRALS_KEY = 'tuf_ops_ecosystem_referrals_v3';
const LEGACY_REFERRALS_KEYS = ['tuf_ops_mock_ecosystem_referrals_v1', 'tuf_ops_ecosystem_referrals_v2'];

function readLocalReferrals(): EcosystemReferral[] {
  try {
    LEGACY_REFERRALS_KEYS.forEach((key) => localStorage.removeItem(key));
    return JSON.parse(localStorage.getItem(LOCAL_REFERRALS_KEY) || '[]') as EcosystemReferral[];
  } catch {
    return [];
  }
}

function writeLocalReferrals(rows: EcosystemReferral[]) {
  localStorage.setItem(LOCAL_REFERRALS_KEY, JSON.stringify(rows));
}

function getAllReferrals() {
  const rows = readLocalReferrals();
  if (rows.length === 0) {
    seedMockEcosystemReferrals();
    return readLocalReferrals();
  }
  return rows;
}

function seedMockEcosystemReferrals() {
  const mockReferrals: EcosystemReferral[] = [
    { id: "ref-1", referralSourceOrganizationId: "org-86", referralSourceOrganization: "Eden Prairie HS", referralSourceContact: "Mike Thompson", referralSourceRole: "Athletic Director", referredOrganizationName: "Eden Prairie Youth Football", referredOrganizationType: "Youth Football", contactName: "Sarah Johnson", contactEmail: "sjohnson@epyf.local", contactPhone: "555-1000", relationshipNotes: "Strong relationship with AD. Youth org feeds into HS program.", warmIntroductionStatus: "Qualified", linkedOpportunityId: "opp-1", linkedOpportunityName: "Baseball Uniforms", assignedRep: "Josh Hoffman", createdAt: "2026-06-15", estimatedRevenue: 8500, revenueGenerated: 3200 },
    { id: "ref-2", referralSourceOrganizationId: "org-60", referralSourceOrganization: "Maple Grove HS", referralSourceContact: "Dave Anderson", referralSourceRole: "Head Coach", referredOrganizationName: "Maple Grove Basketball Club", referredOrganizationType: "Youth Basketball", contactName: "Tom Wilson", contactEmail: "twilson@mgbc.local", contactPhone: "555-1001", relationshipNotes: "Coach is well-connected in local youth scene.", warmIntroductionStatus: "Introduced", linkedOpportunityId: "opp-7", linkedOpportunityName: "Volleyball Uniforms", assignedRep: "Josh Hoffman", createdAt: "2026-06-22", estimatedRevenue: 12000, revenueGenerated: 0 },
    { id: "ref-3", referralSourceOrganizationId: "org-10", referralSourceOrganization: "Roseville HS", referralSourceContact: "Pat Nelson", referralSourceRole: "Athletic Director", referredOrganizationName: "Roseville Volleyball Club", referredOrganizationType: "Volleyball Club", contactName: "Lisa Chen", contactEmail: "lchen@rvc.local", contactPhone: "555-1002", relationshipNotes: "AD recommended reaching out for uniform refresh.", warmIntroductionStatus: "Contacted", linkedOpportunityId: "opp-51", linkedOpportunityName: "7v7 Flag Uniforms", assignedRep: "Jason Mulder", createdAt: "2026-07-03", estimatedRevenue: 9500, revenueGenerated: 0 },
    { id: "ref-4", referralSourceOrganizationId: "org-73", referralSourceOrganization: "Rochester Mayo", referralSourceContact: "Jim Baker", referralSourceRole: "Head Coach", referredOrganizationName: "Rochester Youth Wrestling", referredOrganizationType: "Youth Wrestling", contactName: "Mike Davis", contactEmail: "mdavis@ryw.local", contactPhone: "555-1003", relationshipNotes: "Coach Baker has been sending referrals all season.", warmIntroductionStatus: "Qualified", linkedOpportunityId: "opp-52", linkedOpportunityName: "Basketball Uniforms", assignedRep: "Jason Mulder", createdAt: "2026-07-10", estimatedRevenue: 7200, revenueGenerated: 4500 },
    { id: "ref-5", referralSourceOrganizationId: "org-42", referralSourceOrganization: "Prior Lake HS", referralSourceContact: "Karen Miller", referralSourceRole: "Athletic Director", referredOrganizationName: "Prior Lake Booster Club", referredOrganizationType: "Booster Club", contactName: "Steve Rogers", contactEmail: "srogers@plbc.local", contactPhone: "555-1004", relationshipNotes: "Booster club looking to outfit multiple sports.", warmIntroductionStatus: "Referred", linkedOpportunityId: "opp-53", linkedOpportunityName: "Volleyball Uniforms", assignedRep: "Jason Mulder", createdAt: "2026-07-18", estimatedRevenue: 18000, revenueGenerated: 0 },
    { id: "ref-6", referralSourceOrganizationId: "org-84", referralSourceOrganization: "Anoka HS", referralSourceContact: "Bob Larson", referralSourceRole: "Athletic Director", referredOrganizationName: "Anoka Youth Baseball", referredOrganizationType: "Youth Baseball", contactName: "Dan Harris", contactEmail: "dharris@ayb.local", contactPhone: "555-1005", relationshipNotes: "Long-standing relationship - annual reorder opportunity.", warmIntroductionStatus: "Qualified", linkedOpportunityId: "opp-76", linkedOpportunityName: "Football Uniforms", assignedRep: "David Lundberg", createdAt: "2026-06-28", estimatedRevenue: 6200, revenueGenerated: 6200 },
    { id: "ref-7", referralSourceOrganizationId: "org-80", referralSourceOrganization: "St. Cloud Tech", referralSourceContact: "Rick Martinez", referralSourceRole: "Head Coach", referredOrganizationName: "St. Cloud Parent Org", referredOrganizationType: "Parent Organization", contactName: "Amy White", contactEmail: "awhite@scpo.local", contactPhone: "555-1006", relationshipNotes: "Parent org handles all team gear orders.", warmIntroductionStatus: "Mentioned", linkedOpportunityId: "opp-77", linkedOpportunityName: "Volleyball Uniforms", assignedRep: "David Lundberg", createdAt: "2026-07-25", estimatedRevenue: 0, revenueGenerated: 0 },
    { id: "ref-8", referralSourceOrganizationId: "org-76", referralSourceOrganization: "Apple Valley HS", referralSourceContact: "Judy Park", referralSourceRole: "Athletic Director", referredOrganizationName: "Apple Valley Youth Softball", referredOrganizationType: "Youth Softball", contactName: "Rachel Green", contactEmail: "rgreen@avys.local", contactPhone: "555-1007", relationshipNotes: "New youth program starting up - excited to partner.", warmIntroductionStatus: "Introduced", linkedOpportunityId: "opp-78", linkedOpportunityName: "Wrestling Uniforms", assignedRep: "David Lundberg", createdAt: "2026-08-01", estimatedRevenue: 5500, revenueGenerated: 0 },
    { id: "ref-9", referralSourceOrganizationId: "org-48", referralSourceOrganization: "Moorhead HS", referralSourceContact: "Jeff Brown", referralSourceRole: "Head Coach", referredOrganizationName: "Moorhead Wrestling Club", referredOrganizationType: "Youth Wrestling", contactName: "Chris Taylor", contactEmail: "ctaylor@mwc.local", contactPhone: "555-1008", relationshipNotes: "Coach Brown is a TUF Ops advocate in the region.", warmIntroductionStatus: "Contacted", linkedOpportunityId: "opp-90", linkedOpportunityName: "Baseball Uniforms", assignedRep: "Primeau Hill", createdAt: "2026-08-05", estimatedRevenue: 6800, revenueGenerated: 0 },
    { id: "ref-10", referralSourceOrganizationId: "org-46", referralSourceOrganization: "Maple Grove HS", referralSourceContact: "Tom Clark", referralSourceRole: "Athletic Director", referredOrganizationName: "Maple Grove Flag Football", referredOrganizationType: "Youth Football", contactName: "Kevin Adams", contactEmail: "kadams@mgff.local", contactPhone: "555-1009", relationshipNotes: "Flag football expansion - needs full uniform kits.", warmIntroductionStatus: "Qualified", linkedOpportunityId: "opp-91", linkedOpportunityName: "7v7 Flag Uniforms", assignedRep: "Primeau Hill", createdAt: "2026-08-12", estimatedRevenue: 11000, revenueGenerated: 2500 },
    { id: "ref-11", referralSourceOrganizationId: "org-38", referralSourceOrganization: "Shakopee HS", referralSourceContact: "Nancy Lee", referralSourceRole: "Athletic Director", referredOrganizationName: "Shakopee Basketball Association", referredOrganizationType: "Youth Basketball", contactName: "Brian Scott", contactEmail: "bscott@sba.local", contactPhone: "555-1010", relationshipNotes: "Referred by happy customer - warm intro.", warmIntroductionStatus: "Referred", linkedOpportunityId: "opp-92", linkedOpportunityName: "Basketball Uniforms", assignedRep: "Primeau Hill", createdAt: "2026-08-18", estimatedRevenue: 8000, revenueGenerated: 0 },
    { id: "ref-12", referralSourceOrganizationId: "org-86", referralSourceOrganization: "Eden Prairie HS", referralSourceContact: "Mike Thompson", referralSourceRole: "Athletic Director", referredOrganizationName: "Eden Prairie Lacrosse Club", referredOrganizationType: "Booster Club", contactName: "Phil Roberts", contactEmail: "proberts@eplc.local", contactPhone: "555-1011", relationshipNotes: "Lacrosse is growing fast in Eden Prairie.", warmIntroductionStatus: "Mentioned", linkedOpportunityId: "opp-1", linkedOpportunityName: "Baseball Uniforms", assignedRep: "Josh Hoffman", createdAt: "2026-08-20", estimatedRevenue: 0, revenueGenerated: 0 },
    { id: "ref-13", referralSourceOrganizationId: "org-82", referralSourceOrganization: "Apple Valley HS", referralSourceContact: "Judy Park", referralSourceRole: "Athletic Director", referredOrganizationName: "Apple Valley Baseball Boosters", referredOrganizationType: "Booster Club", contactName: "Mark Rivera", contactEmail: "mrivera@avbb.local", contactPhone: "555-1012", relationshipNotes: "Follow-up from summer sports camp.", warmIntroductionStatus: "Introduced", linkedOpportunityId: "opp-36", linkedOpportunityName: "Volleyball Uniforms", assignedRep: "Shayla Hilliard", createdAt: "2026-06-20", estimatedRevenue: 7500, revenueGenerated: 0 },
    { id: "ref-14", referralSourceOrganizationId: "org-75", referralSourceOrganization: "Shakopee HS", referralSourceContact: "Nancy Lee", referralSourceRole: "Athletic Director", referredOrganizationName: "Shakopee Youth Hockey", referredOrganizationType: "Other", contactName: "Ryan Fisher", contactEmail: "rfisher@syh.local", contactPhone: "555-1013", relationshipNotes: "Hockey program needs new jerseys for 3 teams.", warmIntroductionStatus: "Qualified", linkedOpportunityId: "opp-60", linkedOpportunityName: "Hockey Uniforms", assignedRep: "Jason Mulder", createdAt: "2026-08-25", estimatedRevenue: 15000, revenueGenerated: 8500 },
    { id: "ref-15", referralSourceOrganizationId: "org-17", referralSourceOrganization: "Minnetonka HS", referralSourceContact: "Joe Kim", referralSourceRole: "Head Coach", referredOrganizationName: "Minnetonka Travel Baseball", referredOrganizationType: "Youth Baseball", contactName: "David Park", contactEmail: "dpark@mtb.local", contactPhone: "555-1014", relationshipNotes: "Coach Kim's son plays travel ball - direct connection.", warmIntroductionStatus: "Contacted", linkedOpportunityId: "opp-6", linkedOpportunityName: "7v7 Flag Uniforms", assignedRep: "Josh Hoffman", createdAt: "2026-07-08", estimatedRevenue: 9200, revenueGenerated: 0 },
  ];
  writeLocalReferrals(mockReferrals);
}

export function listEcosystemReferrals(params: ReferralPipelineParams = {}): EcosystemReferral[] {
  const user = getStoredUser();
  return getAllReferrals().filter((referral) => {
    const matchesStatus = !params.status || params.status === 'ALL' || referral.warmIntroductionStatus === params.status;
    const matchesRep = !params.rep || params.rep === 'ALL' || referral.assignedRep === params.rep;
    const matchesSource = !params.sourceOrganizationId || referral.referralSourceOrganizationId === params.sourceOrganizationId;
    const matchesSearch = !(params.search ?? '').trim() || [
      referral.referralSourceOrganization,
      referral.referralSourceContact,
      referral.referredOrganizationName,
      referral.contactName,
      referral.contactEmail,
      referral.assignedRep,
    ].join(' ').toLowerCase().includes((params.search ?? '').toLowerCase());
    const roleScoped = !user || user.role === 'ADMIN' || user.role === 'REGIONAL_DIRECTOR'
      ? true
      : user.role === 'DIRECTOR'
        ? getManagedRepNamesForDirector(user.name).includes(referral.assignedRep)
        : referral.assignedRep === user.name;
    return matchesStatus && matchesRep && matchesSource && matchesSearch && roleScoped;
  });
}

export function createEcosystemReferral(input: {
  referralSourceOrganizationId: string;
  referralSourceContact: string;
  referralSourceRole: string;
  referredOrganizationName: string;
  referredOrganizationType: ReferredOrganizationType;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  relationshipNotes: string;
  warmIntroductionStatus: WarmIntroductionStatus;
  linkedOpportunityId?: string;
}) {
  const source = listOrganizations({}).find((org) => org.id === input.referralSourceOrganizationId);
  const linkedOpportunity = input.linkedOpportunityId ? listOpportunities({}).find((opp) => opp.id === input.linkedOpportunityId) : undefined;
  const user = getStoredUser();
  const row: EcosystemReferral = {
    id: `ref-local-${Date.now()}`,
    referralSourceOrganizationId: input.referralSourceOrganizationId,
    referralSourceOrganization: source?.name ?? 'Unknown Organization',
    referralSourceContact: input.referralSourceContact,
    referralSourceRole: input.referralSourceRole,
    referredOrganizationName: input.referredOrganizationName,
    referredOrganizationType: input.referredOrganizationType,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    relationshipNotes: input.relationshipNotes,
    warmIntroductionStatus: input.warmIntroductionStatus,
    linkedOpportunityId: linkedOpportunity?.id,
    linkedOpportunityName: linkedOpportunity?.title,
    assignedRep: source?.assignedRep || user?.name || 'Unassigned',
    createdAt: new Date().toISOString().slice(0, 10),
    estimatedRevenue: input.warmIntroductionStatus === 'Qualified' ? 12000 : 0,
    revenueGenerated: 0,
  };
  writeLocalReferrals([row, ...readLocalReferrals()]);
  return row;
}

export function getEcosystemReferralSummary(referrals = listEcosystemReferrals({})) {
  const qualified = referrals.filter((referral) => referral.warmIntroductionStatus === 'Qualified');
  return {
    created: referrals.length,
    qualified: qualified.length,
    revenueGenerated: referrals.reduce((sum, referral) => sum + referral.revenueGenerated, 0),
  };
}

export function getReferralSourceEffectiveness(referrals = listEcosystemReferrals({})) {
  const sourceNames = Array.from(new Set(referrals.map((referral) => referral.referralSourceOrganization)));
  return sourceNames.map((source) => {
    const sourceRows = referrals.filter((referral) => referral.referralSourceOrganization === source);
    return {
      source,
      created: sourceRows.length,
      qualified: sourceRows.filter((referral) => referral.warmIntroductionStatus === 'Qualified').length,
      revenueGenerated: sourceRows.reduce((sum, referral) => sum + referral.revenueGenerated, 0),
    };
  }).sort((a, b) => b.qualified - a.qualified || b.created - a.created);
}

export function getReferralRepEffectiveness(referrals = listEcosystemReferrals({})) {
  const reps = Array.from(new Set(referrals.map((referral) => referral.assignedRep)));
  return reps.map((rep) => {
    const repRows = referrals.filter((referral) => referral.assignedRep === rep);
    return {
      rep,
      created: repRows.length,
      qualified: repRows.filter((referral) => referral.warmIntroductionStatus === 'Qualified').length,
      revenueGenerated: repRows.reduce((sum, referral) => sum + referral.revenueGenerated, 0),
    };
  }).sort((a, b) => b.qualified - a.qualified || b.created - a.created);
}
