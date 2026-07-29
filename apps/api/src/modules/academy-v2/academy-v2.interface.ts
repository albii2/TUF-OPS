// ─── Academy v3 Interfaces ───
// Sandbox-based certification with 5 phases, quality gates, lead taxonomy

export enum AcademyV3Phase {
  PHASE_1_FOUNDATIONS = 'phase_1',
  PHASE_2_CRM_WALKTHROUGH = 'phase_2',
  PHASE_3_TERRITORY_SANDBOX = 'phase_3',
  PHASE_4_SALES_EXECUTION = 'phase_4',
  PHASE_5_GRADUATION = 'phase_5',
}

export enum LeadStatus {
  UNCLAIMED = 'unclaimed',
  CLAIMED = 'claimed',
  ACTIVE = 'active',
  CLOSED = 'closed',
  STALE = 'stale',
}

export enum ActivityType {
  CALL = 'call',
  EMAIL = 'email',
  MEETING = 'meeting',
  VISIT = 'visit',
  ROLE_PLAY = 'role_play',
  PITCH = 'pitch',
}

export enum SalesExecutionType {
  PHONE_CALL = 'phone_call',
  EMAIL_PITCH = 'email_pitch',
  OBJECTION_HANDLING = 'objection_handling',
  ROLE_PLAY = 'role_play',
  SHADOW_SESSION = 'shadow_session',
}

export enum QualityCheckType {
  MIN_FIELDS = 'min_fields',
  SOURCE_CITATION = 'source_citation',
  DUPLICATE_DETECTION = 'duplicate_detection',
  RESEARCH_DEPTH = 'research_depth',
  VERIFICATION = 'verification',
}

export enum AuditType {
  RANDOM = 'random',
  TARGETED = 'targeted',
  GRADUATION = 'graduation',
}

// ─── Sandbox Row Types ───

export interface SandboxOrgRow {
  id: number;
  user_id: number;
  name: string;
  website: string | null;
  physical_address: string | null;
  enrollment: number | null;
  sports_programs: string[];
  current_provider: string | null;
  research_notes: string | null;
  source_url: string | null;
  source_citation: string | null;
  verified: boolean;
  lead_status: LeadStatus;
  promoted_to_production: boolean;
  promoted_at: string | null;
  promoted_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface SandboxContactRow {
  id: number;
  user_id: number;
  sandbox_org_id: number;
  full_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  is_decision_maker: boolean;
  source_citation: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface SandboxOpportunityRow {
  id: number;
  user_id: number;
  sandbox_org_id: number;
  sandbox_contact_id: number | null;
  name: string;
  estimated_value: number;
  target_close_date: string | null;
  lane: string;
  stage: string;
  sport: string | null;
  notes: string | null;
  source_citation: string | null;
  created_at: string;
  updated_at: string;
}

export interface SandboxActivityRow {
  id: number;
  user_id: number;
  sandbox_org_id: number | null;
  sandbox_opp_id: number | null;
  activity_type: ActivityType;
  description: string | null;
  notes: string | null;
  template_used: string | null;
  scheduled_at: string;
  created_at: string;
  updated_at: string;
}

export interface SalesExecutionRow {
  id: number;
  user_id: number;
  execution_type: SalesExecutionType;
  sandbox_org_id: number | null;
  sandbox_opp_id: number | null;
  notes: string;
  objection_handled: string | null;
  feedback: string | null;
  mentor_id: number | null;
  score: number | null;
  completed_at: string;
  created_at: string;
}

export interface LeadTaxonomyRow {
  id: number;
  existing_lead_id: number | null;
  lead_name: string;
  lead_status: LeadStatus;
  claimed_by: number | null;
  claimed_at: string | null;
  territory_locked_at: string | null;
  duplicate_cluster_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface QualityCheckRow {
  id: number;
  user_id: number;
  entity_type: string;
  entity_id: number;
  check_type: QualityCheckType;
  passed: boolean;
  details: Record<string, any>;
  checked_at: string;
  created_at: string;
}

export interface VerificationAuditRow {
  id: number;
  user_id: number;
  entity_type: string;
  entity_id: number;
  auditor_id: number;
  audit_type: AuditType;
  passed: boolean | null;
  findings: string | null;
  audited_at: string;
  created_at: string;
}

export interface GraduationRow {
  id: number;
  user_id: number;
  phase1_completed: boolean;
  phase2_completed: boolean;
  phase3_completed: boolean;
  phase4_completed: boolean;
  phase5_completed: boolean;
  orgs_quality_count: number;
  contacts_quality_count: number;
  opps_quality_count: number;
  activities_quality_count: number;
  sales_executions_count: number;
  all_gates_passed: boolean;
  director_approved: boolean;
  approved_by: number | null;
  approved_at: string | null;
  mentor_id: number | null;
  data_promoted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuizAttemptRow {
  id: number;
  user_id: number;
  quiz_id: string;
  score: number;
  passed: boolean;
  answers: number[];
  attempted_at: string;
  created_at: string;
}

export interface WalkthroughStepRow {
  id: number;
  user_id: number;
  step_id: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface CohortRow {
  id: number;
  cohort_name: string;
  max_size: number;
  territory_zone: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── API Response Types ───

export interface GraduationStatus {
  phase1: { completed: boolean };
  phase2: { completed: boolean };
  phase3: { completed: boolean };
  phase4: { completed: boolean };
  phase5: { completed: boolean };
  gates: {
    orgs: { current: number; required: number; met: boolean };
    contacts: { current: number; required: number; met: boolean };
    opps: { current: number; required: number; met: boolean };
    activities: { current: number; required: number; met: boolean };
    sales_executions: { current: number; required: number; met: boolean };
    directorApproved: { met: boolean };
  };
  all_passed: boolean;
  ready_to_graduate: boolean;
}

export interface Phase1Status {
  completed: boolean;
  quizzes: {
    quizId: string;
    name: string;
    score: number | null;
    passed: boolean;
    attemptedAt: string | null;
  }[];
}

export interface Phase2Status {
  completed: boolean;
  steps: {
    stepId: string;
    label: string;
    description: string;
    completed: boolean;
    completedAt: string | null;
  }[];
}

export interface SandboxSummary {
  orgs: number;
  contacts: number;
  opportunities: number;
  activities: number;
  sales_executions: number;
  quality_checks_passed: number;
}

export interface LeadClaimResult {
  lead: LeadTaxonomyRow;
  sandboxOrg: SandboxOrgRow | null;
  alreadyClaimed: boolean;
  claimedBy: number | null;
}

// ─── Graduation Requirements (with quality gates) ───

export const GRADUATION_REQUIREMENTS = {
  orgs: {
    min_count: 5,
    quality_checks: [
      'verified_website',
      'physical_address',
      'research_notes_200_chars',
      'source_url',
    ],
  },
  contacts: {
    min_count: 15,
    quality_checks: [
      'full_name',
      'title',
      'verified_email_or_phone',
      'source_citation',
    ],
  },
  opps: {
    min_count: 5,
    quality_checks: [
      'non_zero_value',
      'target_close_date',
      'lane_set',
      'stage_set',
      'has_notes',
    ],
  },
  activities: {
    min_count: 15,
    quality_checks: [
      'min_3_calls_with_notes',
      'min_5_emails_with_templates',
    ],
  },
  sales_executions: {
    min_count: 3,
    quality_checks: [
      'min_1_phone_call',
      'min_1_sent_pitch',
      'min_1_objection_handling',
    ],
  },
} as const;

// ─── Phase 1 Quiz Definitions (70 questions across modules) ───

export const PHASE_1_QUIZZES = [
  { quizId: 'philosophy', name: 'TUF Philosophy & Sales Principles', questionCount: 10 },
  { quizId: 'prospecting', name: 'Prospecting & Territory Awareness', questionCount: 10 },
  { quizId: 'discovery', name: 'Discovery & Needs Analysis', questionCount: 10 },
  { quizId: 'proposal', name: 'Proposal Building & Pricing', questionCount: 10 },
  { quizId: 'order_handoff', name: 'Order Handoff & Closed Won Standard', questionCount: 10 },
  { quizId: 'product_knowledge', name: 'Product Knowledge & Collections', questionCount: 10 },
  { quizId: 'pipeline_accelerator', name: 'Pipeline Accelerator & Emergency Tactics', questionCount: 10 },
];

// ─── Phase 2 CRM Walkthrough Steps ───

export const CRM_WALKTHROUGH_STEPS = [
  { stepId: 'dashboard_overview', label: 'Dashboard Overview', description: 'Navigate the Command Center and understand key metrics' },
  { stepId: 'organizations_list', label: 'Organizations List', description: 'Browse and search existing organizations in the CRM' },
  { stepId: 'org_detail', label: 'Organization Detail', description: 'View a full organization profile with contacts, opps, and activities' },
  { stepId: 'pipeline_view', label: 'Pipeline View', description: 'Understand the opportunity board and pipeline stages' },
  { stepId: 'opp_detail', label: 'Opportunity Detail', description: 'Explore opportunity fields: value, stage, next actions' },
  { stepId: 'activities_log', label: 'Activities Log', description: 'View logged activities and understand activity tracking' },
  { stepId: 'territory_map', label: 'Territory Map', description: 'Explore territory assignment and account distribution' },
  { stepId: 'orders_view', label: 'Orders View', description: 'Understand the order lifecycle and fulfillment flow' },
];

// ─── Phase 3 Sandbox Mission Definitions ───

export interface SandboxMissionDefinition {
  missionNumber: number;
  title: string;
  description: string;
  instructions: string;
  requiredActions: string[];
  qualityChecks: { type: QualityCheckType; description: string }[];
}

export const PHASE_3_MISSIONS_V3: SandboxMissionDefinition[] = [
  {
    missionNumber: 1,
    title: 'Claim Your Territory Leads',
    description: 'Review 296 existing leads, deduplicate, claim 5 schools for your sandbox territory.',
    instructions: `1. Browse the lead taxonomy to see all 296 existing leads
2. Search for schools in your assigned territory zone
3. Use the dedup scan to identify duplicate entries
4. Claim 5 schools for development (they move to your sandbox)
5. For each claimed school: research and add website, address, enrollment, sports programs

🔴 QUALITY GATE: Each org must have a verified website, physical address, research notes (200+ chars), and source URL.`,
    requiredActions: ['Run dedup scan', 'Claim 5 schools', 'Add website', 'Add physical address', 'Add research notes (200+ chars)', 'Add source URL'],
    qualityChecks: [
      { type: QualityCheckType.DUPLICATE_DETECTION, description: 'No duplicate schools in your sandbox' },
      { type: QualityCheckType.MIN_FIELDS, description: 'Website, address, enrollment, and sports programs required' },
      { type: QualityCheckType.RESEARCH_DEPTH, description: 'Research notes must be 200+ characters with source citation' },
      { type: QualityCheckType.SOURCE_CITATION, description: 'Source URL required for each organization' },
    ],
  },
  {
    missionNumber: 2,
    title: 'Build Your Contact Roster',
    description: 'Create 15-20 contacts across your 5 schools with verified info and source citations.',
    instructions: `For each of your 5 claimed schools, create contacts:
• Principal
• Athletic Director
• Football Coach
• Volleyball Coach
• Activities Director

For each contact, you must have:
• Full name (verified from school website)
• Title/role
• Email OR phone (at least one verified)
• Source citation (where you found this contact info)

🔴 QUALITY GATE: No generic contacts. Every contact must be traceable to a real person at a real school.`,
    requiredActions: ['Create 15-20 contacts', 'Full name on each', 'Title on each', 'Verified email or phone', 'Source citation for each'],
    qualityChecks: [
      { type: QualityCheckType.MIN_FIELDS, description: 'Full name, title, and email/phone required on every contact' },
      { type: QualityCheckType.SOURCE_CITATION, description: 'Source citation required for each contact\'s information' },
      { type: QualityCheckType.DUPLICATE_DETECTION, description: 'No duplicate contacts within the same org' },
    ],
  },
  {
    missionNumber: 3,
    title: 'Create Pipeline Opportunities',
    description: 'Create 5 opportunities with non-zero values, target close dates, lanes, stages, and notes.',
    instructions: `For your 5 claimed schools, create 5 opportunities:

Required fields for each:
• Organization and sport
• Lane (Uniforms, Travel Gear, Team Store, Letterman)
• Stage (at minimum LEAD → LEAD_ENGAGED)
• Estimated value (> $0)
• Target close date
• Notes about the program's needs

🔴 QUALITY GATE: Every opportunity must have a non-zero value, target close date, lane, stage, and notes.`,
    requiredActions: ['Create 5 opportunities', 'Non-zero value on each', 'Target close date on each', 'Lane set on each', 'Stage set on each', 'Notes on each'],
    qualityChecks: [
      { type: QualityCheckType.MIN_FIELDS, description: 'Value > 0, target close date, lane, stage, and notes required' },
      { type: QualityCheckType.DUPLICATE_DETECTION, description: 'No duplicate opportunities (same org + sport + lane)' },
    ],
  },
  {
    missionNumber: 4,
    title: 'Log Activities & Outreach',
    description: 'Log 15 activities: at least 3 calls with notes, 5 emails with templates, and 7 additional activities.',
    instructions: `Log 15 activities across your sandbox territory:

Required breakdown:
• 3+ logged calls with conversation notes
• 5+ emails using TUF email templates
• 7+ additional activities (meetings, visits, follow-ups)

Each activity must include:
• Activity type
• Date/time
• Description or notes
• Linked to correct opportunity or organization

🔴 QUALITY GATE: At least 3 calls with notes and 5 template-based emails.`,
    requiredActions: ['Log 3+ calls with notes', 'Send 5+ emails with templates', 'Log 7+ additional activities', 'Link each activity to org/opp'],
    qualityChecks: [
      { type: QualityCheckType.MIN_FIELDS, description: 'At least 3 calls with notes and 5 emails with templates' },
    ],
  },
  {
    missionNumber: 5,
    title: 'Director Review & Territory Approval',
    description: 'Submit your sandbox territory for Director sampling review. Data review is sampling-based, not 100%.',
    instructions: `Your Director will review a sample of your sandbox territory:
• Random sampling of organizations, contacts, opportunities
• Automated quality gates must all pass
• Director provides final approval or feedback

This is NOT a 100% review. The system samples your work.
If your sample passes, all work is approved. If not, you get specific feedback.`,
    requiredActions: ['All quality gates passed', 'Director sampling review', 'Territory approval'],
    qualityChecks: [
      { type: QualityCheckType.VERIFICATION, description: 'Random audit of at least 20% of your entities' },
    ],
  },
];

// ─── Phase 4 Sales Execution Missions ───

export interface SalesExecutionMissionDefinition {
  missionNumber: number;
  title: string;
  description: string;
  instructions: string;
  executionType: SalesExecutionType;
}

export const PHASE_4_MISSIONS: SalesExecutionMissionDefinition[] = [
  {
    missionNumber: 1,
    title: 'First Phone Call',
    description: 'Make and log a real phone call to one of your school contacts. Role-play first.',
    instructions: `1. Identify a target school and contact from your sandbox
2. Prepare a call script: intro, reason for calling, one question
3. Role-play the call with your mentor or a peer
4. Review the role-play feedback
5. Make the actual call and log it

What to log:
• Who you called
• What was discussed
• Outcome (voicemail, conversation, next steps)
• Follow-up date

🔴 QUALITY GATE: Must have role-play first, then real call logged with notes.`,
    executionType: SalesExecutionType.PHONE_CALL,
  },
  {
    missionNumber: 2,
    title: 'Send a Pitch Email',
    description: 'Compose and send a real pitch email using TUF templates to a school decision-maker.',
    instructions: `1. Select a target school and Athletic Director or Coach from your sandbox
2. Choose an appropriate email template (Intro, Follow-up, Lane Expansion)
3. Customize the template with school-specific research
4. Review with mentor
5. Send the email and log it

Template options:
• "First Contact" — introducing TUF to a new prospect
• "Lane Expansion" — introducing a new lane to an existing relationship
• "Follow-up" — re-engaging after initial contact

🔴 QUALITY GATE: Must use a template and include school-specific details.`,
    executionType: SalesExecutionType.EMAIL_PITCH,
  },
  {
    missionNumber: 3,
    title: 'Handle a Price Objection',
    description: 'Prepare for and document handling of the most common price objection.',
    instructions: `Price objections are the most common pushback. Prepare your response:

1. Write down the 3 most common price objections you expect
2. For each: write your response (2-3 sentences)
3. Role-play the toughest objection with your mentor
4. Document your objection-handling playbook

Example objections to prepare for:
• "We can get cheaper uniforms online"
• "Our budget is already set for this year"
• "We're happy with our current provider"

🔴 QUALITY GATE: Must role-play at least one objection with mentor, documented.`,
    executionType: SalesExecutionType.OBJECTION_HANDLING,
  },
];
