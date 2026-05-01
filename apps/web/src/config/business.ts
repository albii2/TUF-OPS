import type { OpportunityStage, RevenueLane } from '../data/mockSalesData';

export const ACCOUNT_TYPES = ['School', 'Youth Program', 'Club', 'Rec Team', 'College', 'Business/Organization'] as const;
export const SCHOOL_PROGRAM_LEVELS = ['Varsity', 'JV', 'Freshman', '8th Grade', '7th Grade', 'Middle School', 'Elementary', 'All Athletics'] as const;
export const YOUTH_PROGRAM_LEVELS = ['6U', '7U', '8U', '9U', '10U', '11U', '12U', '13U', '14U', '15U', '16U', '17U', '18U'] as const;
export const CLUB_PROGRAM_LEVELS = ['National', 'Regional', 'Premier', 'Elite', 'Select'] as const;
export const SEASON_CODES = ['SP', 'SU', 'FA', 'WI'] as const;
export const REVENUE_LANES: RevenueLane[] = ['UNIFORM', 'TRAVEL_GEAR', 'TEAM_STORE', 'LETTERMAN'];
export const OPPORTUNITY_STAGES: OpportunityStage[] = ['LEAD_ASSIGNED','CONTACTED','DISCOVERY','MOCKUP_REQUESTED','MOCKUP_DELIVERED','INVOICE_SENT','DECISION_PENDING','CLOSED_WON','CLOSED_LOST'];
export const SPORT_OPTIONS = ['Football','Basketball','Baseball','Softball','Volleyball','Hockey','Soccer','Track','Wrestling','Lacrosse','Cheer','Dance','All Athletics'] as const;
