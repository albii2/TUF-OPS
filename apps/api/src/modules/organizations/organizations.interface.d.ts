/** Snake-case row returned by `SELECT * FROM organizations`. */
export interface OrganizationRow {
    id: number;
    name: string;
    state: string;
    assigned_rep_id: number | null;
    assigned_director_id: number | null;
    territory_id: number | null;
    status: string;
    created_by: number;
    updated_by: number;
    created_at: Date;
    updated_at: Date;
    sport?: string | null;
    address?: string | null;
    team_colors?: string | null;
    region?: string | null;
    state_market?: string | null;
    division?: string | null;
    territory?: string | null;
    subterritory?: string | null;
    sport_focus?: string | null;
    assigned_director_name?: string | null;
    assigned_director_email?: string | null;
    assigned_rep_name?: string | null;
    assigned_rep_email?: string | null;
    assignment_pool?: string | null;
    assignment_batch?: string | null;
    assignment_rationale?: string | null;
}
export interface OrganizationDto {
    id: number;
    name: string;
    state: string;
    assignedRepId: number | null;
    assignedDirectorId: number | null;
    territoryId: number | null;
    status: string;
    createdBy: number;
    updatedBy: number;
    createdAt: string;
    updatedAt: string;
    sport?: string | null;
    address?: string | null;
    teamColors?: string | null;
    region?: string | null;
    stateMarket?: string | null;
    division?: string | null;
    territory?: string | null;
    subterritory?: string | null;
    sportFocus?: string | null;
    assignedDirectorName?: string | null;
    assignedDirectorEmail?: string | null;
    assignedRepName?: string | null;
    assignedRepEmail?: string | null;
    assignmentPool?: string | null;
    assignmentBatch?: string | null;
    assignmentRationale?: string | null;
}
export interface CreateOrganizationInput {
    name: string;
    state: string;
    /** Frontend sends string names; backend resolves to numeric IDs. */
    assignedRep?: string;
    assignedDirector?: string;
    territoryId?: number;
    sport?: string;
    address?: string;
    teamColors?: string;
    region?: string;
    stateMarket?: string;
    division?: string;
    territory?: string;
    subterritory?: string;
    sportFocus?: string;
    createdBy?: number;
    updatedBy?: number;
}
export interface UpdateOrganizationInput {
    name?: string;
    state?: string;
    assignedRep?: string;
    assignedDirector?: string;
    territoryId?: number;
    status?: string;
    sport?: string;
    address?: string;
    teamColors?: string;
    region?: string;
    stateMarket?: string;
    division?: string;
    territory?: string;
    subterritory?: string;
    sportFocus?: string;
    updatedBy?: number;
}
export interface OrganizationListParams {
    search?: string;
    status?: string;
    rep?: string;
    territory?: string;
    director?: string;
    limit?: number;
    offset?: number;
}
//# sourceMappingURL=organizations.interface.d.ts.map