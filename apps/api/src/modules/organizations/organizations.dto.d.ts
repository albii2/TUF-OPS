import type { OrganizationRow, OrganizationDto, CreateOrganizationInput, UpdateOrganizationInput } from './organizations.interface';
export declare function toOrganizationDto(row: OrganizationRow): OrganizationDto;
/** Batch transform for list endpoints. */
export declare function toOrganizationDtos(rows: OrganizationRow[]): OrganizationDto[];
export interface ResolvedCreateParams {
    name: string;
    state: string;
    assigned_rep_id: number | null;
    assigned_director_id: number | null;
    territory_id: number | null;
    created_by: number;
    updated_by: number;
    sport?: string | null;
    address?: string | null;
    team_colors?: string | null;
    region?: string | null;
    state_market?: string | null;
    division?: string | null;
    territory?: string | null;
    subterritory?: string | null;
    sport_focus?: string | null;
}
export interface ResolvedUpdateParams {
    name?: string;
    state?: string;
    assigned_rep_id?: number | null;
    assigned_director_id?: number | null;
    territory_id?: number | null;
    updated_by?: number;
    status?: string;
    sport?: string | null;
    address?: string | null;
    team_colors?: string | null;
    region?: string | null;
    state_market?: string | null;
    division?: string | null;
    territory?: string | null;
    subterritory?: string | null;
    sport_focus?: string | null;
}
/**
 * Prepare a create input for the DB layer.
 *
 * Callers should resolve name → ID before calling this:
 *   resolveUserId(input.assignedRep) → assigned_rep_id
 */
export declare function normalizeCreateInput(input: CreateOrganizationInput, resolvedRepId: number | null, resolvedDirectorId: number | null): ResolvedCreateParams;
/**
 * Prepare an update input for the DB layer.
 */
export declare function normalizeUpdateInput(input: UpdateOrganizationInput, resolvedRepId: number | null, resolvedDirectorId: number | null): ResolvedUpdateParams;
//# sourceMappingURL=organizations.dto.d.ts.map