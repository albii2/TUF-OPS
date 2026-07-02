export type ApiRequestConfig = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export async function apiClient<T>(path: string, config: ApiRequestConfig = {}): Promise<T> {
  const queryString = config.query
    ? `?${new URLSearchParams(
        Object.entries(config.query).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)]),
      ).toString()}`
    : '';

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Attach auth token if available (stored in localStorage after login)
  try {
    const rawUser = localStorage.getItem('tuf_ops_user_v3');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed.token) {
        headers['Authorization'] = `Bearer ${parsed.token}`;
      }
    }
  } catch {
    // fail silently — no token, no auth header
  }

  const response = await fetch(`${API_BASE_URL}${path}${queryString}`, {
    method: config.method ?? 'GET',
    headers,
    body: config.body ? JSON.stringify(config.body) : undefined,
  });

  if (!response.ok) {
    // 401/403 = auth issue — fail silently, let the UI fall back to empty state
    if (response.status === 401 || response.status === 403) {
      console.warn(`[apiClient] Auth required for ${path} (${response.status})`);
      return {} as T;
    }
    throw new Error(`API request failed: ${response.status}`);
  }

  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    console.warn(`[apiClient] Non-JSON response from ${path}:`, text.substring(0, 100));
    return {} as T;
  }
}
