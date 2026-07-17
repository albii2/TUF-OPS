import { getOrderRisk } from './orderWorkflow';
import { getMomentumState as getUnifiedMomentumState, getStaleOpenOpportunities, getStaleOrganizations } from './kpiUtils';
const NEAR_CLOSE_STAGES = ['MOCKUP_DELIVERED', 'INVOICE_SENT', 'DECISION_PENDING'];
export function getNearCloseOpportunities(opportunities) {
    return opportunities
        .filter((opp) => NEAR_CLOSE_STAGES.includes(opp.stage))
        .sort((a, b) => b.closeProbability - a.closeProbability || b.value - a.value);
}
export function getStuckOpportunities(opportunities) {
    return opportunities.filter((opp) => ['CONTACTED', 'DISCOVERY', 'MOCKUP_REQUESTED'].includes(opp.stage) || (opp.stage === 'DECISION_PENDING' && opp.closeProbability < 75));
}
export function getLanePenetration(organizations) {
    const totals = {
        UNIFORM: 0, TRAVEL_GEAR: 0, TEAM_STORE: 0, LETTERMAN: 0,
    };
    if (!organizations || !Array.isArray(organizations))
        return totals;
    organizations.forEach((org) => {
        if (!org?.laneStatuses)
            return;
        Object.keys(org.laneStatuses).forEach((lane) => {
            if (org.laneStatuses[lane]?.status === 'ACTIVE' || org.laneStatuses[lane]?.status === 'WON') {
                totals[lane] += 1;
            }
        });
    });
    return totals;
}
export function getOrganizationPriorityScore(org) {
    if (!org?.laneStatuses)
        return org?.pipelineValue || 0;
    const activeLaneCount = Object.values(org.laneStatuses).filter((lane) => lane?.status === 'ACTIVE').length;
    const openLaneCount = Object.values(org.laneStatuses).filter((lane) => lane?.status === 'OPEN').length;
    return (org.pipelineValue || 0) + activeLaneCount * 5000 + openLaneCount * 2500;
}
export function getOrderRiskScore(order) {
    return getOrderRisk(order).rank;
}
export function getOpenPipelineValue(opportunities) {
    return opportunities
        .filter((opp) => !['CLOSED_WON', 'CLOSED_LOST'].includes(opp.stage))
        .reduce((total, opp) => total + opp.value, 0);
}
export function getUntouchedAccounts(organizations) {
    return organizations.filter((o) => o.coverageStatus === 'UNTOUCHED');
}
export function getStaleAccounts(organizations, thresholdDays = 14) {
    return getStaleOrganizations(organizations, thresholdDays);
}
export function getStaleOpportunities(opportunities, thresholdDays = 14) {
    return getStaleOpenOpportunities(opportunities, thresholdDays);
}
export function getMomentumState(input) {
    return getUnifiedMomentumState(input);
}
export function getTerritoryHealthLabel(coveragePct) {
    if (coveragePct < 45)
        return 'Weak Coverage';
    if (coveragePct < 65)
        return 'Building';
    if (coveragePct < 82)
        return 'Active';
    return 'Dominating';
}
export function getAccountsNeedingAction(organizations) {
    return organizations.filter((o) => !!o.nextAction && o.coverageStatus !== 'CLOSED');
}
//# sourceMappingURL=businessSelectors.js.map