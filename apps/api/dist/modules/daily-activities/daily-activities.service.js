"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertDailyActivity = upsertDailyActivity;
exports.getTodayActivities = getTodayActivities;
exports.getActivityHistory = getActivityHistory;
const database_1 = require("@packages/database");
const FIELDS = [
    'calls', 'emails', 'texts', 'linkedin_msgs', 'conversations',
    'meetings', 'quotes', 'follow_ups', 'new_opps',
];
async function upsertDailyActivity(userId, input) {
    const date = new Date().toISOString().slice(0, 10);
    const client = await database_1.pool.connect();
    try {
        const existing = await client.query('SELECT * FROM daily_activities WHERE user_id = $1 AND activity_date = $2', [userId, date]);
        if (existing.rows[0]) {
            // Update — add to existing counts
            const current = existing.rows[0];
            const result = await client.query(`UPDATE daily_activities SET
          calls = $1, emails = $2, texts = $3, linkedin_msgs = $4,
          conversations = $5, meetings = $6, quotes = $7,
          follow_ups = $8, new_opps = $9, next_actions = $10,
          updated_at = NOW()
        WHERE id = $11 RETURNING *`, [
                input.calls ?? current.calls,
                input.emails ?? current.emails,
                input.texts ?? current.texts,
                input.linkedin_msgs ?? current.linkedin_msgs,
                input.conversations ?? current.conversations,
                input.meetings ?? current.meetings,
                input.quotes ?? current.quotes,
                input.follow_ups ?? current.follow_ups,
                input.new_opps ?? current.new_opps,
                input.next_actions ?? current.next_actions,
                current.id,
            ]);
            return result.rows[0];
        }
        // Insert new row
        const result = await client.query(`INSERT INTO daily_activities
        (user_id, activity_date, calls, emails, texts, linkedin_msgs, conversations, meetings, quotes, follow_ups, new_opps, next_actions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`, [
            userId, date,
            input.calls ?? 0, input.emails ?? 0, input.texts ?? 0,
            input.linkedin_msgs ?? 0, input.conversations ?? 0,
            input.meetings ?? 0, input.quotes ?? 0,
            input.follow_ups ?? 0, input.new_opps ?? 0,
            input.next_actions ?? null,
        ]);
        return result.rows[0];
    }
    finally {
        client.release();
    }
}
async function getTodayActivities(requestingUserId, role) {
    const date = new Date().toISOString().slice(0, 10);
    // Admin and Director see all reps
    if (role === 'ADMIN' || role === 'DIRECTOR' || role === 'REGIONAL_DIRECTOR' || role === 'OPERATIONS') {
        const result = await database_1.pool.query(`SELECT da.*, u.name as user_name, u.role as user_role
       FROM daily_activities da
       JOIN users u ON u.id = da.user_id
       WHERE da.activity_date = $1
       ORDER BY u.name`, [date]);
        return result.rows;
    }
    // Rep sees only themselves
    const result = await database_1.pool.query(`SELECT da.*, u.name as user_name, u.role as user_role
     FROM daily_activities da
     JOIN users u ON u.id = da.user_id
     WHERE da.activity_date = $1 AND da.user_id = $2`, [date, requestingUserId]);
    return result.rows;
}
async function getActivityHistory(userId, days = 7) {
    const result = await database_1.pool.query(`SELECT * FROM daily_activities
     WHERE user_id = $1
     ORDER BY activity_date DESC
     LIMIT $2`, [userId, days]);
    return result.rows;
}
//# sourceMappingURL=daily-activities.service.js.map