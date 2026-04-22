import { OpportunityStage } from '../opportunities/opportunities.interface';

export interface NextPlay {
  id: number;
  name: string;
  stage: OpportunityStage;
  time_in_stage: number;
  revenue: number;
  assigned_rep_id: number;
  assigned_director_id: number;
  next_action: string;
  pressure_score: number;
}

export interface CashBoard {
  pending_payment: number;
  recently_paid: number;
  closed_won: number;
  avg_days_to_payment: number;
  conversion_rate: number;
}

export interface PipelineFlow {
  [stage: string]: {
    count: number;
    status: 'OK' | 'BOTTLENECK';
    is_increasing: boolean;
  };
}

export interface OpsReady {
  needs_action: number;
  ready_for_vendor: number;
  in_production: number;
  stalled: number;
}

export interface OwnershipView {
  id: number;
  name: string;
  active_deals: number;
  stuck_deals: number;
  stuck_ratio: number;
  total_revenue: number;
}

export interface OwnerDashboardData {
  next_plays: NextPlay[];
  cash_board: CashBoard;
  pipeline_flow: PipelineFlow;
  ops_ready: OpsReady;
  ownership: {
    reps: OwnershipView[];
    directors: OwnershipView[];
  };
}
