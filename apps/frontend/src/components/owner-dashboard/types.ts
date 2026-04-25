export interface NextPlay {
  revenue: number
  opportunity_name: string
  organization_name: string
  stage: string
  time_in_stage: string
  rep_name: string
  next_action_display: string
  pressure_score: number
}

export interface CashBoard {
  pending_payment: number
  recently_paid_amount: number
  recently_closed_amount: number
  avg_days_to_payment: number
  conversion_rate: number
}

export interface PipelineStage {
  stage_name: string
  count: number
  status?: 'BOTTLENECK' | 'HEALTHY'
}

export interface OpsReady {
  needs_action: number
  ready_for_vendor: number
  in_production: number
  stalled: number
}

export interface OwnershipRow {
  name: string
  active_deals: number
  stuck_deals: number
  stuck_ratio: number
  total_revenue: number
}

export interface OwnershipData {
  reps: OwnershipRow[]
  directors: OwnershipRow[]
}

export interface OwnerDashboardData {
  next_plays: NextPlay[]
  cash_board: CashBoard
  pipeline_flow: PipelineStage[]
  ops_ready: OpsReady
  ownership: OwnershipData
}
