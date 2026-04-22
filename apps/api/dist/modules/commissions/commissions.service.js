"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommission = createCommission;
const database_1 = require("@packages/database");
const commissions_interface_1 = require("./commissions.interface");
const REP_BASE_RATES = {
    UNIFORM: 0.10,
    STORE: 0.15,
    JACKETS: 0.18,
};
const DIRECTOR_OVERRIDE_RATE = 0.05; // Default placeholder override rule
async function createCommission(opportunity) {
    if (!opportunity.gross_profit) {
        return null;
    }
    const existingCommission = await database_1.pool.query('SELECT * FROM commissions WHERE opportunity_id = $1', [opportunity.id]);
    if (existingCommission.rows.length > 0) {
        return existingCommission.rows[0];
    }
    const dealType = opportunity.deal_type || 'UNIFORM'; // Default to UNIFORM if not specified
    const repRate = REP_BASE_RATES[dealType];
    const repCommission = opportunity.gross_profit * repRate;
    const directorOverride = opportunity.gross_profit * DIRECTOR_OVERRIDE_RATE;
    console.log('COMMISSION DEBUG:', {
        opportunity_id: opportunity.id,
        assigned_rep_id: opportunity.assigned_rep_id,
        assigned_director_id: opportunity.assigned_director_id
    });
    const result = await database_1.pool.query('INSERT INTO commissions (opportunity_id, rep_user_id, director_user_id, gross_profit, rep_rate, rep_commission, director_rate, director_override, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *', [
        opportunity.id,
        opportunity.assigned_rep_id,
        opportunity.assigned_director_id,
        opportunity.gross_profit,
        repRate,
        repCommission,
        DIRECTOR_OVERRIDE_RATE,
        directorOverride,
        commissions_interface_1.CommissionStatus.PENDING,
    ]);
    return result.rows[0];
}
//# sourceMappingURL=commissions.service.js.map