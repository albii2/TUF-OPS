import type { RevenueLane } from './organization.js';

export type OpportunityStage =
  | 'LEAD_ENGAGED' | 'DISCOVERY' | 'MOCKUP_STAGE'
  | 'INVOICE_SENT' | 'CLOSED_WON' | 'CLOSED_LOST'
  | 'LEAD_ASSIGNED' | 'CONTACTED' | 'MOCKUP_REQUESTED'
  | 'MOCKUP_DELIVERED' | 'DECISION_PENDING' | 'PAYMENT_RECEIVED';

export interface Opportunity {
  id: string;
  title: string;
  organizationId: string;
  organizationName: string;
  lanes: RevenueLane[];
  sport: string;
  season: string;
  stage: OpportunityStage;
  value: number;
  assignedRep: string;
  assignedDirector?: string;
  estimatedValue?: number;
  nextAction: string;
  nextActionDueDate?: string;
  lastActivity: string;
  createdAt?: string;
  updatedAt?: string;
  dueDate?: string;
  orderId?: string | null;
  closeProbability: number;
}

export const opportunityStages: OpportunityStage[] = [
  'LEAD_ENGAGED', 'DISCOVERY', 'MOCKUP_STAGE',
  'INVOICE_SENT', 'CLOSED_WON', 'CLOSED_LOST',
];
