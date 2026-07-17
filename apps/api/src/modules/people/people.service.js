"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STAGE_LABELS = exports.PIPELINE_STAGES = void 0;
exports.getPipelineCandidates = getPipelineCandidates;
exports.createPipelineCandidate = createPipelineCandidate;
exports.advancePipelineStage = advancePipelineStage;
exports.getPipelineStats = getPipelineStats;
const database_1 = require("@packages/database");
exports.PIPELINE_STAGES = [
    'application', 'interview', 'offer', 'acceptance',
    'documents', 'account_created', 'academy', 'certified',
    'territory_assigned', 'pipeline_assigned', 'first_appointment',
    'first_proposal', 'first_order'
];
exports.STAGE_LABELS = {
    application: '📋 Application',
    interview: '🎙️ Interview',
    offer: '📝 Offer',
    acceptance: '✅ Acceptance',
    documents: '📄 Documents',
    account_created: '🔑 Account Created',
    academy: '📚 Academy',
    certified: '🎓 Certified',
    territory_assigned: '🗺️ Territory Assigned',
    pipeline_assigned: '📊 Pipeline Assigned',
    first_appointment: '📅 First Appointment',
    first_proposal: '💰 First Proposal',
    first_order: '🏆 First Order',
};
async function getPipelineCandidates(filters) {
    let q = 'SELECT * FROM people_pipeline WHERE 1=1';
    const params = [];
    let i = 1;
    if (filters?.stage) {
        q += ` AND current_stage = $${i++}`;
        params.push(filters.stage);
    }
    if (filters?.status) {
        q += ` AND status = $${i++}`;
        params.push(filters.status);
    }
    if (filters?.assigned_hr) {
        q += ` AND assigned_hr = $${i++}`;
        params.push(filters.assigned_hr);
    }
    q += ' ORDER BY created_at DESC';
    const r = await database_1.pool.query(q, params);
    return r.rows;
}
async function createPipelineCandidate(data) {
    const r = await database_1.pool.query(`INSERT INTO people_pipeline (candidate_name, email, phone, role, territory, assigned_director, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`, [data.candidate_name, data.email || '', data.phone || '', data.role || 'REP',
        data.territory || '', data.assigned_director || '', data.notes || '', data.created_by]);
    return r.rows[0];
}
async function advancePipelineStage(id, stage, notes) {
    const dateField = stage + '_date';
    await database_1.pool.query(`UPDATE people_pipeline SET current_stage = $1, ${dateField} = NOW(), updated_at = NOW() WHERE id = $2`, [stage, id]);
    await database_1.pool.query(`INSERT INTO pipeline_stage_history (pipeline_id, stage, notes) VALUES ($1, $2, $3)`, [id, stage, notes || '']);
    const r = await database_1.pool.query('SELECT * FROM people_pipeline WHERE id = $1', [id]);
    return r.rows[0];
}
async function getPipelineStats() {
    const r = await database_1.pool.query(`SELECT current_stage, COUNT(*) as count FROM people_pipeline WHERE status = 'active' GROUP BY current_stage`);
    const stats = {};
    for (const row of r.rows) {
        stats[row.current_stage] = parseInt(row.count);
    }
    return stats;
}
//# sourceMappingURL=people.service.js.map