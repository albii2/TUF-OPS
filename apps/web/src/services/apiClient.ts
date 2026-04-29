export type ApiRequestConfig = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

const API_BASE_URL = '/api/v1';

export async function apiClient<T>(path: string, config: ApiRequestConfig = {}): Promise<T> {
  const queryString = config.query
    ? `?${new URLSearchParams(
        Object.entries(config.query).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)]),
      ).toString()}`
    : '';

  const response = await fetch(`${API_BASE_URL}${path}${queryString}`, {
    method: config.method ?? 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: config.body ? JSON.stringify(config.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
