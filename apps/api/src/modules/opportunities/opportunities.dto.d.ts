import type { Opportunity, OpportunityDto, OpportunityChannelType, CreateOpportunityInput, UpdateOpportunityInput } from './opportunities.interface';
export declare function toOpportunityDto(row: Opportunity): OpportunityDto;
/** Batch transform for list endpoints. */
export declare function toOpportunityDtos(rows: Opportunity[]): OpportunityDto[];
export interface ResolvedOpportunityCreateParams {
    name: string;
    organization_id: number;
    sport: string;
    season: string;
    year: number;
    status: string;
    value: number;
    stage: string;
    channel_type: OpportunityChannelType;
    deal_type: string;
    created_by: number;
    updated_by: number;
    assigned_rep_id: number | null;
    assigned_director_id: number | null;
    next_action?: string | null;
    expected_close_date?: Date | string | null;
    estimated_revenue?: number | null;
}
export interface ResolvedOpportunityUpdateParams {
    name?: string;
    organization_id?: number;
    sport?: string;
    season?: string;
    year?: number;
    status?: string;
    value?: number;
    stage?: string;
    channel_type?: OpportunityChannelType;
    deal_type?: string;
    updated_by?: number;
    created_by?: number;
    assigned_rep_id?: number | null;
    assigned_director_id?: number | null;
    next_action?: string | null;
    expected_close_date?: Date | string | null;
    estimated_revenue?: number | null;
    actual_revenue?: number | null;
    actual_cost?: number | null;
    loss_reason?: string | null;
}
/**
 * Prepare a create input for the DB layer.
 *
 * Callers should resolve name → ID before calling this:
 *   resolveUserId(input.assignedRep) → assigned_rep_id
 */
export declare function normalizeCreateOpportunityInput(input: CreateOpportunityInput, resolvedRepId: number | null, resolvedDirectorId: number | null): ResolvedOpportunityCreateParams;
/**
 * Prepare an update input for the DB layer.
 */
export declare function normalizeUpdateOpportunityInput(input: UpdateOpportunityInput, resolvedRepId: number | null, resolvedDirectorId: number | null): ResolvedOpportunityUpdateParams;
//# sourceMappingURL=opportunities.dto.d.ts.map