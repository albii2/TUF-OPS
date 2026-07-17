export function toTitleCase(value) {
    return value
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .map((part) => {
        if (/^\d+u$/.test(part))
            return `${part.slice(0, -1)}U`;
        if (/^\d+(st|nd|rd|th)$/.test(part))
            return part;
        return part.charAt(0).toUpperCase() + part.slice(1);
    })
        .join(' ');
}
export const normalizeAccountName = (value) => toTitleCase(value);
export const normalizeSport = (value) => toTitleCase(value);
export const normalizeProgramLevel = (value) => toTitleCase(value);
export const normalizeSeasonCode = (value) => value.trim().toUpperCase();
export function getSeasonLabel(code) {
    const key = normalizeSeasonCode(code).slice(0, 2);
    if (key === 'SP')
        return 'Spring';
    if (key === 'SU')
        return 'Summer';
    if (key === 'FA')
        return 'Fall';
    if (key === 'WI')
        return 'Winter';
    return 'Unknown';
}
export function getLaneLabel(lane) {
    return lane === 'TRAVEL_GEAR' ? 'Team Gear' : toTitleCase(lane.replace('_', ' '));
}
export function buildOpportunityDisplayName(input) {
    const lanePart = input.lanes.map((l) => getLaneLabel(l)).join(' + ');
    return `${normalizeProgramLevel(input.programLevel)} ${normalizeSport(input.sport)} ${normalizeSeasonCode(input.seasonCode)} — ${lanePart}`;
}
//# sourceMappingURL=naming.js.map