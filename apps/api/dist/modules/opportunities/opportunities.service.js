"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpportunityById = getOpportunityById;
exports.createOpportunity = createOpportunity;
exports.getOpportunitiesByOrganization = getOpportunitiesByOrganization;
exports.getOrganizationChannelPenetration = getOrganizationChannelPenetration;
exports.updateOpportunityStage = updateOpportunityStage;
const database_1 = require("@packages/database");
const opportunities_interface_1 = require("./opportunities.interface");
const commissions_service_1 = require("../commissions/commissions.service");
const REQUIRED_CHANNELS = [
    opportunities_interface_1.OpportunityChannelType.UNIFORM,
    opportunities_interface_1.OpportunityChannelType.TRAVEL_GEAR,
    opportunities_interface_1.OpportunityChannelType.TEAM_STORE,
    opportunities_interface_1.OpportunityChannelType.LETTERMAN,
];
async function getOpportunityById(id) {
    const result = await database_1.pool.query('SELECT * FROM opportunities WHERE id = $1', [id]);
    if (result.rows.length === 0) {
        throw new Error('Opportunity not found');
    }
    return result.rows[0];
}
const VALID_TRANSITIONS = {
    [opportunities_interface_1.OpportunityStage.NOT_STARTED]: [opportunities_interface_1.OpportunityStage.LEAD_ASSIGNED, opportunities_interface_1.OpportunityStage.CLOSED_LOST],
    [opportunities_interface_1.OpportunityStage.LEAD_ASSIGNED]: [opportunities_interface_1.OpportunityStage.CONTACT_INITIATED, opportunities_interface_1.OpportunityStage.CLOSED_LOST],
    [opportunities_interface_1.OpportunityStage.CONTACT_INITIATED]: [opportunities_interface_1.OpportunityStage.MOCKUP_IN_PROGRESS, opportunities_interface_1.OpportunityStage.CLOSED_LOST],
    [opportunities_interface_1.OpportunityStage.MOCKUP_IN_PROGRESS]: [opportunities_interface_1.OpportunityStage.MOCKUP_APPROVED, opportunities_interface_1.OpportunityStage.CLOSED_LOST],
    [opportunities_interface_1.OpportunityStage.MOCKUP_APPROVED]: [opportunities_interface_1.OpportunityStage.SAMPLE_REQUESTED, opportunities_interface_1.OpportunityStage.INVOICE_SENT, opportunities_interface_1.OpportunityStage.CLOSED_LOST],
    [opportunities_interface_1.OpportunityStage.SAMPLE_REQUESTED]: [opportunities_interface_1.OpportunityStage.SAMPLE_IN_PRODUCTION, opportunities_interface_1.OpportunityStage.CLOSED_LOST],
    [opportunities_interface_1.OpportunityStage.SAMPLE_IN_PRODUCTION]: [opportunities_interface_1.OpportunityStage.SAMPLE_APPROVED, opportunities_interface_1.OpportunityStage.CLOSED_LOST],
    [opportunities_interface_1.OpportunityStage.SAMPLE_APPROVED]: [opportunities_interface_1.OpportunityStage.INVOICE_SENT, opportunities_interface_1.OpportunityStage.CLOSED_LOST],
    [opportunities_interface_1.OpportunityStage.INVOICE_SENT]: [opportunities_interface_1.OpportunityStage.PAYMENT_RECEIVED, opportunities_interface_1.OpportunityStage.CLOSED_LOST],
    [opportunities_interface_1.OpportunityStage.PAYMENT_RECEIVED]: [opportunities_interface_1.OpportunityStage.CLOSED_WON, opportunities_interface_1.OpportunityStage.CLOSED_LOST],
    [opportunities_interface_1.OpportunityStage.CLOSED_WON]: [],
    [opportunities_interface_1.OpportunityStage.CLOSED_LOST]: [],
};
function normalizeChannelType(value) {
    if (!value || typeof value !== 'string') {
        return null;
    }
    const normalized = value.toUpperCase();
    return REQUIRED_CHANNELS.includes(normalized) ? normalized : null;
}
async function createOpportunity(opportunity) {
    const { name, organization_id, status, value, created_by, updated_by, stage, next_action, expected_close_date, last_activity_date, assigned_rep_id, assigned_director_id, estimated_revenue, deal_type, channel_type } = opportunity;
    const resolvedChannelType = normalizeChannelType(channel_type ?? deal_type);
    if (!resolvedChannelType) {
        throw new Error('channel_type is required and must be one of UNIFORM, TRAVEL_GEAR, TEAM_STORE, LETTERMAN');
    }
    const existing = await database_1.pool.query('SELECT id FROM opportunities WHERE organization_id = $1 AND channel_type = $2 LIMIT 1', [organization_id, resolvedChannelType]);
    if (existing.rows.length > 0) {
        throw new Error(`Opportunity already exists for organization ${organization_id} and channel ${resolvedChannelType}`);
    }
    const result = await database_1.pool.query('INSERT INTO opportunities (name, organization_id, status, value, created_by, updated_by, stage, next_action, expected_close_date, last_activity_date, assigned_rep_id, assigned_director_id, estimated_revenue, deal_type, channel_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *', [
        name,
        organization_id,
        status || 'open',
        value ?? 0,
        created_by,
        updated_by,
        stage || opportunities_interface_1.OpportunityStage.NOT_STARTED,
        next_action,
        expected_close_date,
        last_activity_date || new Date(),
        assigned_rep_id,
        assigned_director_id,
        estimated_revenue,
        deal_type || resolvedChannelType,
        resolvedChannelType,
    ]);
    return result.rows[0];
}
async function getOpportunitiesByOrganization(organizationId) {
    const result = await database_1.pool.query('SELECT * FROM opportunities WHERE organization_id = $1', [organizationId]);
    return result.rows;
}
async function getOrganizationChannelPenetration(organizationId) {
    const result = await database_1.pool.query('SELECT channel_type, stage FROM opportunities WHERE organization_id = $1 AND channel_type IS NOT NULL', [organizationId]);
    const channels = {
        uniform: opportunities_interface_1.OpportunityStage.NOT_STARTED,
        travel_gear: opportunities_interface_1.OpportunityStage.NOT_STARTED,
        team_store: opportunities_interface_1.OpportunityStage.NOT_STARTED,
        letterman: opportunities_interface_1.OpportunityStage.NOT_STARTED,
    };
    for (const row of result.rows) {
        if (row.channel_type === opportunities_interface_1.OpportunityChannelType.UNIFORM)
            channels.uniform = row.stage;
        if (row.channel_type === opportunities_interface_1.OpportunityChannelType.TRAVEL_GEAR)
            channels.travel_gear = row.stage;
        if (row.channel_type === opportunities_interface_1.OpportunityChannelType.TEAM_STORE)
            channels.team_store = row.stage;
        if (row.channel_type === opportunities_interface_1.OpportunityChannelType.LETTERMAN)
            channels.letterman = row.stage;
    }
    const closedWonCount = Object.values(channels).filter((stageValue) => stageValue === opportunities_interface_1.OpportunityStage.CLOSED_WON).length;
    return {
        channels,
        channel_penetration_score: closedWonCount / REQUIRED_CHANNELS.length,
    };
}
async function updateOpportunityStage(opportunityId, toStage, changedBy, note, financialData) {
    const currentOpportunityResult = await database_1.pool.query('SELECT * FROM opportunities WHERE id = $1', [opportunityId]);
    if (currentOpportunityResult.rows.length === 0) {
        throw new Error('Opportunity not found');
    }
    const currentOpp = currentOpportunityResult.rows[0];
    const fromStage = currentOpp.stage;
    if (!VALID_TRANSITIONS[fromStage] || !VALID_TRANSITIONS[fromStage].includes(toStage)) {
        throw new Error(`Invalid stage transition from ${fromStage} to ${toStage}`);
    }
    let gross_profit;
    let closed_at = null;
    if (toStage === opportunities_interface_1.OpportunityStage.CLOSED_WON) {
        const { actual_revenue, actual_cost } = { ...currentOpp, ...financialData };
        if (actual_revenue === null || actual_cost === null || actual_revenue === undefined || actual_cost === undefined) {
            throw new Error('actual_revenue and actual_cost are required to close an opportunity as won');
        }
        gross_profit = actual_revenue - actual_cost;
        closed_at = new Date();
    }
    else if (toStage === opportunities_interface_1.OpportunityStage.CLOSED_LOST) {
        const { loss_reason } = { ...currentOpp, ...financialData };
        if (!loss_reason) {
            throw new Error('loss_reason is required to close an opportunity as lost');
        }
        closed_at = new Date();
    }
    const client = await database_1.pool.connect();
    try {
        await client.query('BEGIN');
        const updateQuery = `
      UPDATE opportunities
      SET
        stage = $1,
        last_activity_date = $2,
        updated_at = current_timestamp,
        actual_revenue = $3,
        actual_cost = $4,
        gross_profit = $5,
        closed_at = $6,
        loss_reason = $7
      WHERE id = $8
      RETURNING *
    `;
        const updatedOpportunityResult = await client.query(updateQuery, [
            toStage,
            new Date(),
            financialData?.actual_revenue,
            financialData?.actual_cost,
            gross_profit,
            closed_at,
            financialData?.loss_reason,
            opportunityId,
        ]);
        const updatedOpp = updatedOpportunityResult.rows[0];
        await client.query('INSERT INTO opportunity_stage_history (opportunity_id, from_stage, to_stage, changed_by, note) VALUES ($1, $2, $3, $4, $5) RETURNING *', [opportunityId, fromStage, toStage, changedBy, note]);
        if (toStage === opportunities_interface_1.OpportunityStage.CLOSED_WON) {
            await (0, commissions_service_1.createCommission)(updatedOpp);
        }
        await client.query('COMMIT');
        return updatedOpp;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
//# sourceMappingURL=opportunities.service.js.map