"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCandidate = createCandidate;
exports.getCandidates = getCandidates;
exports.getCandidateById = getCandidateById;
exports.updateCandidate = updateCandidate;
exports.setResumeUrl = setResumeUrl;
exports.getCandidateActivities = getCandidateActivities;
exports.getRecruitingDashboard = getRecruitingDashboard;
const database_1 = require("@packages/database");
const audit_log_1 = require("../shared/audit-log");
async function createCandidate(input) {
    const result = await database_1.pool.query(`INSERT INTO candidates (first_name, last_name, email, phone, source, position_applied, position_recommended, assigned_recruiter, notes, assigned_director_id, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`, [
        input.first_name.trim(),
        input.last_name.trim(),
        input.email.trim().toLowerCase(),
        input.phone || null,
        input.source || 'other',
        input.position_applied || null,
        input.position_recommended || null,
        input.assigned_recruiter || null,
        input.notes || null,
        input.assigned_director_id || null,
        input.created_by || null,
    ]);
    // Log activity
    await database_1.pool.query(`INSERT INTO candidate_activities (candidate_id, type, description, created_by)
     VALUES ($1, 'resume_uploaded', 'Candidate created from external application', $2)`, [result.rows[0].id, input.created_by || null]);
    const candidate = result.rows[0];
    (0, audit_log_1.auditLog)({
        action: 'CREATE',
        user_id: input.created_by ?? null,
        resource_type: 'candidate',
        resource_id: candidate.id,
        metadata: { first_name: candidate.first_name, last_name: candidate.last_name, stage: candidate.stage },
    }).catch(() => { });
    return candidate;
}
async function getCandidates(params) {
    const conditions = [];
    const values = [];
    let paramIndex = 1;
    if (params.stage && params.stage !== 'ALL') {
        conditions.push(`stage = $${paramIndex++}`);
        values.push(params.stage);
    }
    else {
        // Default: exclude rejected
        conditions.push(`stage != 'rejected'`);
    }
    if (params.director_id) {
        conditions.push(`assigned_director_id = $${paramIndex++}`);
        values.push(params.director_id);
    }
    if (params.search) {
        conditions.push(`(first_name || ' ' || last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
        values.push(`%${params.search}%`);
        paramIndex++;
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await database_1.pool.query(`SELECT * FROM candidates ${where} ORDER BY created_at DESC`, values);
    return result.rows;
}
async function getCandidateById(id) {
    const result = await database_1.pool.query('SELECT * FROM candidates WHERE id = $1', [id]);
    return result.rows[0] || null;
}
async function updateCandidate(id, input) {
    const current = await getCandidateById(id);
    if (!current)
        return null;
    const sets = [];
    const values = [];
    let paramIndex = 1;
    const fields = [
        'stage', 'assigned_director_id', 'territory_id', 'notes',
        'interview_date', 'interview_scorecard', 'offer_details', 'certification_progress'
    ];
    for (const field of fields) {
        if (input[field] !== undefined) {
            sets.push(`${field} = $${paramIndex++}`);
            values.push(input[field]);
        }
    }
    if (sets.length === 0)
        return current;
    sets.push(`updated_at = NOW()`);
    const result = await database_1.pool.query(`UPDATE candidates SET ${sets.join(', ')} WHERE id = $${paramIndex} RETURNING *`, [...values, id]);
    const updatedCandidate = result.rows[0];
    // Log stage change activity
    if (input.stage && input.stage !== current.stage) {
        await database_1.pool.query(`INSERT INTO candidate_activities (candidate_id, type, description)
       VALUES ($1, 'stage_changed', $2)`, [id, `Stage changed from ${current.stage} to ${input.stage}`]);
    }
    if (updatedCandidate) {
        (0, audit_log_1.auditLog)({
            action: 'UPDATE',
            user_id: null, // updateCandidate doesn't receive actor ID currently
            resource_type: 'candidate',
            resource_id: id,
            metadata: { stage: updatedCandidate.stage },
        }).catch(() => { });
    }
    return updatedCandidate;
}
async function setResumeUrl(id, url) {
    const result = await database_1.pool.query('UPDATE candidates SET resume_url = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [url, id]);
    if (result.rows[0]) {
        await database_1.pool.query(`INSERT INTO candidate_activities (candidate_id, type, description)
       VALUES ($1, 'resume_uploaded', 'Resume uploaded')`, [id]);
    }
    return result.rows[0] || null;
}
async function getCandidateActivities(candidateId) {
    const result = await database_1.pool.query('SELECT * FROM candidate_activities WHERE candidate_id = $1 ORDER BY created_at DESC', [candidateId]);
    return result.rows;
}
async function getRecruitingDashboard(directorId) {
    // Count by stage
    const stageResult = await database_1.pool.query(`SELECT stage, COUNT(*)::int as count FROM candidates
     WHERE stage != 'rejected'
     ${directorId ? 'AND assigned_director_id = $1' : ''}
     GROUP BY stage ORDER BY stage`, directorId ? [directorId] : []);
    // Academy progress
    const academyResult = await database_1.pool.query(`SELECT id, first_name, last_name, certification_progress
     FROM candidates WHERE stage = 'academy'
     ${directorId ? 'AND assigned_director_id = $1' : ''}
     ORDER BY last_name`, directorId ? [directorId] : []);
    return {
        stages: stageResult.rows,
        academy: academyResult.rows.map(r => ({
            id: r.id,
            name: `${r.first_name} ${r.last_name}`,
            progress: r.certification_progress || {},
        })),
    };
}
//# sourceMappingURL=recruiting.service.js.map