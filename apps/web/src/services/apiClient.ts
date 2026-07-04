export type ApiRequestConfig = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

import { getApiBaseUrl } from './apiBaseUrl';
const API_BASE_URL = getApiBaseUrl();

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

  const maxRetries = 3;
  const delays = [1000, 2000, 4000];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}${path}${queryString}`, {
        method: config.method ?? 'GET',
        headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.warn(`[apiClient] Auth required for ${path}`);
          throw new Error('Authentication required');
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
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.warn(`[apiClient] Retry ${attempt + 1}/${maxRetries} for ${path}`);
      await new Promise(resolve => setTimeout(resolve, delays[attempt]));
    }
  }
  throw new Error('Unreachable');
}
