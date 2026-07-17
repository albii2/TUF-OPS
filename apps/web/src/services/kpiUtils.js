const DAY_MS = 1000 * 60 * 60 * 24;
export function daysSince(dateIso, now = Date.now()) {
    const ts = new Date(dateIso).getTime();
    if (!Number.isFinite(ts))
        return 0;
    return Math.floor((now - ts) / DAY_MS);
}
export function isStale(dateIso, thresholdDays = 14, now = Date.now()) {
    return daysSince(dateIso, now) >= thresholdDays;
}
export function getStaleOrganizations(organizations, thresholdDays = 14) {
    return organizations.filter((org) => isStale(org.lastActivity, thresholdDays));
}
export function getStaleOpenOpportunities(opportunities, thresholdDays = 14) {
    return opportunities.filter((opp) => isStale(opp.lastActivity, thresholdDays) && !['CLOSED_WON', 'CLOSED_LOST'].includes(opp.stage));
}
export function getMomentumState(input) {
    const score = input.nearClose * 2 + input.touched - input.stuck - input.stale * 2;
    if (score >= 8)
        return 'HOT';
    if (score >= 3)
        return 'BUILDING';
    if (score >= -1)
        return 'STALLED';
    return 'CRITICAL';
}
//# sourceMappingURL=kpiUtils.js.map