"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toOrganizationDto = toOrganizationDto;
exports.toOrganizationDtos = toOrganizationDtos;
exports.normalizeCreateInput = normalizeCreateInput;
exports.normalizeUpdateInput = normalizeUpdateInput;
// ---------------------------------------------------------------------------
// Pure transform: DB row → API response DTO (snake_case → camelCase).
// ---------------------------------------------------------------------------
function toOrganizationDto(row) {
    return {
        id: row.id,
        name: row.name,
        state: row.state,
        assignedRepId: row.assigned_rep_id ?? null,
        assignedDirectorId: row.assigned_director_id ?? null,
        territoryId: row.territory_id ?? null,
        status: row.status,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        createdAt: toISO(row.created_at),
        updatedAt: toISO(row.updated_at),
        sport: row.sport ?? null,
        address: row.address ?? null,
        teamColors: row.team_colors ?? null,
        region: row.region ?? null,
        stateMarket: row.state_market ?? null,
        division: row.division ?? null,
        territory: row.territory ?? null,
        subterritory: row.subterritory ?? null,
        sportFocus: row.sport_focus ?? null,
        assignedDirectorName: row.assigned_director_name ?? null,
        assignedDirectorEmail: row.assigned_director_email ?? null,
        assignedRepName: row.assigned_rep_name ?? null,
        assignedRepEmail: row.assigned_rep_email ?? null,
        assignmentPool: row.assignment_pool ?? null,
        assignmentBatch: row.assignment_batch ?? null,
        assignmentRationale: row.assignment_rationale ?? null,
    };
}
/** Batch transform for list endpoints. */
function toOrganizationDtos(rows) {
    return rows.map(toOrganizationDto);
}
/**
 * Prepare a create input for the DB layer.
 *
 * Callers should resolve name → ID before calling this:
 *   resolveUserId(input.assignedRep) → assigned_rep_id
 */
function normalizeCreateInput(input, resolvedRepId, resolvedDirectorId) {
    return {
        name: input.name.trim(),
        state: input.state.trim().toUpperCase(),
        assigned_rep_id: resolvedRepId,
        assigned_director_id: resolvedDirectorId,
        territory_id: input.territoryId ?? null,
        created_by: input.createdBy ?? resolvedRepId ?? 1,
        updated_by: input.updatedBy ?? resolvedRepId ?? 1,
        sport: input.sport ?? null,
        address: input.address ?? null,
        team_colors: input.teamColors ?? null,
        region: input.region ?? null,
        state_market: input.stateMarket ?? null,
        division: input.division ?? null,
        territory: input.territory ?? null,
        subterritory: input.subterritory ?? null,
        sport_focus: input.sportFocus ?? null,
    };
}
/**
 * Prepare an update input for the DB layer.
 */
function normalizeUpdateInput(input, resolvedRepId, resolvedDirectorId) {
    const params = {};
    if (input.name !== undefined)
        params.name = input.name.trim();
    if (input.state !== undefined)
        params.state = input.state.trim().toUpperCase();
    if (input.status !== undefined)
        params.status = input.status;
    if (resolvedRepId !== undefined)
        params.assigned_rep_id = resolvedRepId;
    if (resolvedDirectorId !== undefined)
        params.assigned_director_id = resolvedDirectorId;
    if (input.territoryId !== undefined)
        params.territory_id = input.territoryId;
    if (input.updatedBy !== undefined)
        params.updated_by = input.updatedBy;
    if (input.sport !== undefined)
        params.sport = input.sport;
    if (input.address !== undefined)
        params.address = input.address;
    if (input.teamColors !== undefined)
        params.team_colors = input.teamColors;
    if (input.region !== undefined)
        params.region = input.region;
    if (input.stateMarket !== undefined)
        params.state_market = input.stateMarket;
    if (input.division !== undefined)
        params.division = input.division;
    if (input.territory !== undefined)
        params.territory = input.territory;
    if (input.subterritory !== undefined)
        params.subterritory = input.subterritory;
    if (input.sportFocus !== undefined)
        params.sport_focus = input.sportFocus;
    return params;
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toISO(d) {
    if (d instanceof Date)
        return d.toISOString();
    if (typeof d === 'string')
        return d;
    return new Date().toISOString();
}
//# sourceMappingURL=organizations.dto.js.map