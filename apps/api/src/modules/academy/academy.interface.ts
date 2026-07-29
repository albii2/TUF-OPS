// ─── Academy v2 — Evidence-Based Certification ───
// Interfaces for the new TUF Academy certification system

export enum AcademyMissionStatus {
  LOCKED = 'locked',
  AVAILABLE = 'available',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum DirectorReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum AcademyPhase {
  PHASE_1_FOUNDATIONS = 'phase_1',
  PHASE_2_CRM = 'phase_2',
  PHASE_3_TERRITORY = 'phase_3',
}

// ─── Database row interfaces ───

export interface AcademyProgressRow {
  id: number;
  user_id: number;
  phase1_completed: boolean;
  phase2_completed: boolean;
  phase3_completed: boolean;
  graduated: boolean;
  director_approved: boolean;
  approved_by: number | null;
  approved_at: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AcademyMissionRow {
  id: number;
  user_id: number;
  mission_number: number;
  title: string;
  description: string | null;
  status: AcademyMissionStatus;
  started_at: string | null;
  submitted_at: string | null;
  completed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DirectorReviewRow {
  id: number;
  mission_id: number;
  reviewer_id: number;
  status: DirectorReviewStatus;
  strengths: string | null;
  corrections: string | null;
  coaching_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AcademyChecklistRow {
  id: number;
  user_id: number;
  orgs_created: number;
  orgs_required: number;
  contacts_added: number;
  contacts_required: number;
  opportunities_created: number;
  opportunities_required: number;
  activities_logged: number;
  activities_required: number;
  all_opps_have_details: boolean;
  territory_approved: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── API response types ───

export interface AcademyProgressResponse {
  progress: AcademyProgressRow | null;
  missions: AcademyMissionRow[];
  checklist: AcademyChecklistRow | null;
  graduationReady: boolean;
  missingRequirements: string[];
}

export interface MissionWithReview extends AcademyMissionRow {
  latestReview: DirectorReviewRow | null;
}

export interface GraduationCheck {
  passed: boolean;
  requirements: {
    orgs: { current: number; required: number; met: boolean };
    contacts: { current: number; required: number; met: boolean };
    opportunities: { current: number; required: number; met: boolean };
    activities: { current: number; required: number; met: boolean };
    oppDetails: { met: boolean };
    territoryApproved: { met: boolean };
  };
}

// ─── Mission definitions ───

export interface MissionDefinition {
  mission_number: number;
  title: string;
  description: string;
  instructions: string;
  requiredActions: string[];
}

export const PHASE_3_MISSIONS: MissionDefinition[] = [
  {
    mission_number: 1,
    title: 'Find 5 Schools',
    description: 'Research enrollment, sports, AD, coaches, existing provider. Create organizations.',
    instructions: `Research 5 high schools in your territory. For each school:
1. Find enrollment numbers
2. List all sports programs offered
3. Identify the Athletic Director
4. List head coaches (Football, Volleyball at minimum)
5. Identify their current uniform/apparel provider
6. Create the organization in TUF Ops with all details`,
    requiredActions: ['Create 5 organizations', 'Add enrollment data', 'Add sports programs', 'Note current provider'],
  },
  {
    mission_number: 2,
    title: 'Create Contacts',
    description: 'Create contacts (Principal, AD, Football Coach, Volleyball Coach, Activities Director) for each org.',
    instructions: `For each of your 5 organizations, create contacts:
• Principal
• Athletic Director
• Football Coach
• Volleyball Coach
• Activities Director

Add email, phone, and any notes from your research. These are real people at real schools.`,
    requiredActions: ['Create 15-20 contacts across 5 orgs', 'Add emails and phone numbers', 'Include role/title for each contact'],
  },
  {
    mission_number: 3,
    title: 'Create First Opportunity',
    description: 'Create first real opportunity with estimated value, close date, lane, stage.',
    instructions: `Create your first real opportunity. Select one of your organizations and one sport.

Required fields:
• Organization and sport
• Lane (Uniforms, Travel Gear, Team Store, Letterman)
• Stage (LEAD → LEAD_ENGAGED minimum)
• Estimated value
• Target close date
• Notes about the program's needs
• Next action with date`,
    requiredActions: ['Create 5 opportunities', 'Set estimated value on each', 'Set stage on each', 'Add notes on each', 'Set next action with date'],
  },
  {
    mission_number: 4,
    title: 'Schedule First Outreach',
    description: 'Schedule first outreach (phone/email/visit), log activity.',
    instructions: `Schedule and log your first outreach activities:
• Phone calls to your contacts
• Emails introducing TUF
• Planned school visits

Log every activity in TUF Ops. Each activity should include:
• Type (call, email, meeting, visit)
• Date/time
• Notes about the conversation or plan
• Linked to the correct opportunity or organization`,
    requiredActions: ['Log 15 activities', 'Include activity type and date', 'Link activities to orgs/opps', 'Add meaningful notes'],
  },
  {
    mission_number: 5,
    title: 'Director Review',
    description: 'Director reviews all work before advancing.',
    instructions: `Your Director will review your territory:
• All 5 organizations with complete details
• All contacts with roles and contact info
• All 5 opportunities with values, stages, and notes
• All 15 activities with dates and notes

Your Director must approve each component before you graduate.`,
    requiredActions: ['All orgs verified', 'All contacts verified', 'All opportunities verified', 'All activities verified', 'Director approval'],
  },
];
