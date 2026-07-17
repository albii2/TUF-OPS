import type { Role } from '@tuf/shared';
import type { OrganizationListParams } from '../services/organizationsService';
import type { OpportunityListParams } from '../services/opportunitiesService';
import type { OrderListParams } from '../services/ordersService';
import type { ActivityParams } from '../services/activitiesService';
export declare const queryKeys: {
    readonly organizations: {
        readonly all: readonly ["organizations"];
        readonly list: (params?: OrganizationListParams) => readonly ["organizations", "list", any];
        readonly detail: (id: string) => readonly ["organizations", "detail", string];
        readonly untouched: () => readonly ["organizations", "untouched"];
        readonly stale: () => readonly ["organizations", "stale"];
        readonly needsAction: () => readonly ["organizations", "needs-action"];
    };
    readonly opportunities: {
        readonly all: readonly ["opportunities"];
        readonly list: (params?: OpportunityListParams) => readonly ["opportunities", "list", any];
        readonly detail: (id: string) => readonly ["opportunities", "detail", string];
        readonly stages: () => readonly ["opportunities", "stages"];
        readonly revenueLanes: () => readonly ["opportunities", "revenue-lanes"];
    };
    readonly orders: {
        readonly all: readonly ["orders"];
        readonly list: (params?: OrderListParams) => readonly ["orders", "list", any];
        readonly detail: (id: string) => readonly ["orders", "detail", string];
        readonly byOpportunityId: (opportunityId: string) => readonly ["orders", "by-opportunity", string];
        readonly opsWorkspace: () => readonly ["orders", "ops-workspace"];
    };
    readonly dashboard: {
        readonly metrics: (role: Role, userId?: string, userEmail?: string) => readonly ["dashboard", "metrics", Role, string | undefined, string | undefined];
    };
    readonly activities: {
        readonly list: (params?: ActivityParams) => readonly ["activities", "list", any];
        readonly today: () => readonly ["activities", "today"];
    };
    readonly users: {
        readonly all: readonly ["users"];
        readonly list: () => readonly ["users", "list"];
    };
    readonly reports: {
        readonly summary: () => readonly ["reports", "summary"];
    };
    readonly territory: {
        readonly all: readonly ["territory"];
        readonly list: () => readonly ["territory", "list"];
        readonly repCoverage: () => readonly ["territory", "rep-coverage"];
        readonly untouched: () => readonly ["territory", "untouched"];
    };
    readonly recruiting: {
        readonly all: readonly ["recruiting"];
        readonly list: (params?: {
            stage?: string;
            director_id?: number;
            search?: string;
        }) => readonly ["recruiting", "list", {
            stage?: string;
            director_id?: number;
            search?: string;
        } | undefined];
        readonly detail: (id: number) => readonly ["recruiting", "detail", number];
        readonly activities: (id: number) => readonly ["recruiting", "activities", number];
        readonly dashboard: (directorId?: number) => readonly ["recruiting", "dashboard", number | undefined];
    };
    readonly candidates: {
        readonly all: readonly ["candidates"];
        readonly list: (params?: {
            stage?: string;
            director_id?: number;
            search?: string;
        }) => readonly ["candidates", "list", {
            stage?: string;
            director_id?: number;
            search?: string;
        } | undefined];
        readonly detail: (id: number) => readonly ["candidates", "detail", number];
        readonly activities: (id: number) => readonly ["candidates", "activities", number];
    };
};
//# sourceMappingURL=queryKeys.d.ts.map