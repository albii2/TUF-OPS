export type ApiRequestConfig = {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
};
export declare function apiClient<T>(path: string, config?: ApiRequestConfig): Promise<T>;
//# sourceMappingURL=apiClient.d.ts.map