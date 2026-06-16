"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCreativeRequestsByOpportunity = listCreativeRequestsByOpportunity;
exports.createCreativeRequest = createCreativeRequest;
exports.updateCreativeRequest = updateCreativeRequest;
exports.createTrelloCardForCreativeRequest = createTrelloCardForCreativeRequest;
const database_1 = require("@packages/database");
const opportunities_service_1 = require("../opportunities/opportunities.service");
async function listCreativeRequestsByOpportunity(opportunityId) {
    const r = await database_1.pool.query('SELECT * FROM creative_requests WHERE opportunity_id = $1 ORDER BY created_at DESC, id DESC', [opportunityId]);
    return r.rows;
}
async function createCreativeRequest(opportunityId, payload) {
    const opp = await (0, opportunities_service_1.getOpportunityById)(opportunityId);
    if (!payload.title || !payload.request_type || !payload.design_team || !payload.design_notes)
        throw new Error('Missing required fields');
    const r = await database_1.pool.query(`INSERT INTO creative_requests (opportunity_id, organization_id, created_by_user_id, assigned_designer_id, request_type, design_team, priority, title, sport, season, needed_items, design_notes, inspiration_notes, due_date, asset_links, internal_notes, status, trello_card_id, trello_card_url)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`, [opportunityId, opp.organization_id ?? null, payload.created_by_user_id ?? 0, payload.assigned_designer_id ?? null, payload.request_type, payload.design_team, payload.priority ?? 'NORMAL', payload.title, payload.sport ?? null, payload.season ?? null, JSON.stringify(payload.needed_items ?? []), payload.design_notes, payload.inspiration_notes ?? null, payload.due_date ?? null, payload.asset_links ?? null, payload.internal_notes ?? null, payload.status ?? 'SUBMITTED', payload.trello_card_id ?? null, payload.trello_card_url ?? null]);
    return r.rows[0];
}
async function updateCreativeRequest(id, updates) {
    const existing = await database_1.pool.query('SELECT * FROM creative_requests WHERE id = $1', [id]);
    if (!existing.rows.length)
        throw new Error('Creative request not found');
    const merged = { ...existing.rows[0], ...updates };
    const r = await database_1.pool.query(`UPDATE creative_requests SET assigned_designer_id=$1, priority=$2, title=$3, sport=$4, season=$5, needed_items=$6::jsonb, design_notes=$7, inspiration_notes=$8, due_date=$9, asset_links=$10, internal_notes=$11, status=$12, trello_card_id=$13, trello_card_url=$14, updated_at=current_timestamp WHERE id=$15 RETURNING *`, [merged.assigned_designer_id, merged.priority, merged.title, merged.sport, merged.season, JSON.stringify(merged.needed_items ?? []), merged.design_notes, merged.inspiration_notes, merged.due_date, merged.asset_links, merged.internal_notes, merged.status, merged.trello_card_id, merged.trello_card_url, id]);
    return r.rows[0];
}
async function createTrelloCardForCreativeRequest(_creativeRequestId) {
    // TODO: integrate Trello card creation when credentials and workflow are available.
}
//# sourceMappingURL=creative-requests.service.js.map