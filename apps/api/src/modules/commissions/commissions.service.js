"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommission = createCommission;
const database_1 = require("@packages/database");
const commissions_interface_1 = require("./commissions.interface");
const REP_BASE_RATES = {
    UNIFORM: 0.10,
    TRAVEL_GEAR: 0.10,
    TEAM_STORE: 0.15,
    LETTERMAN: 0.18,
    DEFAULT: 0.10,
};
const DIRECTOR_OVERRIDE_RATE = 0.05;
function roundCurrency(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
function requireValidCommissionSource(opportunity) {
    if (opportunity.gross_profit === null || opportunity.gross_profit === undefined) {
        return false;
    }
    if (Number(opportunity.gross_profit) < 0) {
        throw new Error('gross_profit cannot be negative for commission creation');
    }
    if (!opportunity.assigned_rep_id) {
        throw new Error('assigned_rep_id is required for commission creation');
    }
    return true;
}
async function createCommission(opportunity, db = database_1.pool) {
    if (!requireValidCommissionSource(opportunity)) {
        return null;
    }
    const existingCommission = await db.query('SELECT * FROM commissions WHERE opportunity_id = $1', [opportunity.id]);
    if (existingCommission.rows.length > 0) {
        return existingCommission.rows[0];
    }
    const dealType = opportunity.deal_type || 'UNIFORM';
    const repRate = REP_BASE_RATES[dealType] || REP_BASE_RATES.DEFAULT;
    const grossProfit = roundCurrency(Number(opportunity.gross_profit));
    const repCommission = roundCurrency(grossProfit * repRate);
    const directorOverride = roundCurrency(grossProfit * DIRECTOR_OVERRIDE_RATE);
    const result = await db.query('INSERT INTO commissions (opportunity_id, rep_user_id, director_user_id, gross_profit, rep_rate, rep_commission, director_rate, director_override, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *', [
        opportunity.id,
        opportunity.assigned_rep_id,
        opportunity.assigned_director_id ?? opportunity.assigned_rep_id,
        grossProfit,
        repRate,
        repCommission,
        DIRECTOR_OVERRIDE_RATE,
        directorOverride,
        commissions_interface_1.CommissionStatus.PENDING,
    ]);
    return result.rows[0];
}
//# sourceMappingURL=commissions.service.js.map