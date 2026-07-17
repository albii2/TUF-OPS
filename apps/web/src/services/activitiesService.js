import { apiClient } from './apiClient';
export async function createActivity(input) {
    return apiClient('/activities', { method: 'POST', body: input });
}
export async function listActivities(params = {}) {
    const query = {};
    if (params.entityType)
        query.entityType = params.entityType;
    if (params.entityId)
        query.entityId = params.entityId;
    if (params.limit)
        query.limit = String(params.limit);
    return apiClient('/activities', { query });
}
//# sourceMappingURL=activitiesService.js.map