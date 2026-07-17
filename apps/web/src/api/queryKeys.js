export const queryKeys = {
    organizations: {
        all: ['organizations'],
        list: (params) => ['organizations', 'list', params],
        detail: (id) => ['organizations', 'detail', id],
        untouched: () => ['organizations', 'untouched'],
        stale: () => ['organizations', 'stale'],
        needsAction: () => ['organizations', 'needs-action'],
    },
    opportunities: {
        all: ['opportunities'],
        list: (params) => ['opportunities', 'list', params],
        detail: (id) => ['opportunities', 'detail', id],
        stages: () => ['opportunities', 'stages'],
        revenueLanes: () => ['opportunities', 'revenue-lanes'],
    },
    orders: {
        all: ['orders'],
        list: (params) => ['orders', 'list', params],
        detail: (id) => ['orders', 'detail', id],
        byOpportunityId: (opportunityId) => ['orders', 'by-opportunity', opportunityId],
        opsWorkspace: () => ['orders', 'ops-workspace'],
    },
    dashboard: {
        metrics: (role, userId, userEmail) => ['dashboard', 'metrics', role, userId, userEmail],
    },
    activities: {
        list: (params) => ['activities', 'list', params],
        today: () => ['activities', 'today'],
    },
    users: {
        all: ['users'],
        list: () => ['users', 'list'],
    },
    reports: {
        summary: () => ['reports', 'summary'],
    },
    territory: {
        all: ['territory'],
        list: () => ['territory', 'list'],
        repCoverage: () => ['territory', 'rep-coverage'],
        untouched: () => ['territory', 'untouched'],
    },
    recruiting: {
        all: ['recruiting'],
        list: (params) => ['recruiting', 'list', params],
        detail: (id) => ['recruiting', 'detail', id],
        activities: (id) => ['recruiting', 'activities', id],
        dashboard: (directorId) => ['recruiting', 'dashboard', directorId],
    },
    candidates: {
        all: ['candidates'],
        list: (params) => ['candidates', 'list', params],
        detail: (id) => ['candidates', 'detail', id],
        activities: (id) => ['candidates', 'activities', id],
    },
};
//# sourceMappingURL=queryKeys.js.map