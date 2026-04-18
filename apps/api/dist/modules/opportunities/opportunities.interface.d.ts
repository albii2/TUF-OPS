export declare enum OpportunityStage {
    LEAD_ASSIGNED = "LEAD_ASSIGNED",
    CONTACTED = "CONTACTED",
    CONVERSATION_STARTED = "CONVERSATION_STARTED",
    NEEDS_IDENTIFIED = "NEEDS_IDENTIFIED",
    PROPOSAL_SENT = "PROPOSAL_SENT",
    DECISION_PENDING = "DECISION_PENDING",
    CLOSED_WON = "CLOSED_WON",
    CLOSED_LOST = "CLOSED_LOST"
}
export interface Opportunity {
    id: number;
    name: string;
    organization_id: number;
    status: string;
    value: number;
    created_by: number;
    updated_by: number;
    created_at: Date;
    updated_at: Date;
    stage: OpportunityStage;
    next_action?: string;
    expected_close_date?: Date;
    last_activity_date: Date;
    assigned_rep_id?: number;
    assigned_director_id?: number;
    estimated_revenue?: number;
    actual_revenue?: number;
    actual_cost?: number;
    gross_profit?: number;
    closed_at?: Date;
    loss_reason?: string;
    deal_type?: string;
}
export interface OpportunityStageHistory {
    id: number;
    opportunity_id: number;
    from_stage: OpportunityStage;
    to_stage: OpportunityStage;
    changed_by: number;
    changed_at: Date;
    note?: string;
}
//# sourceMappingURL=opportunities.interface.d.ts.map