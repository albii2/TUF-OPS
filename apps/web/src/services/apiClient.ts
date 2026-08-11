export type ApiRequestConfig = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

import { getApiBaseUrl } from './apiBaseUrl';
const API_BASE_URL = getApiBaseUrl();
const TOKEN_KEY = 'tuf_ops_token_v1';

export async function apiClient<T>(path: string, config: ApiRequestConfig = {}): Promise<T> {
  const queryString = config.query
    ? '?' + new URLSearchParams(
        Object.entries(config.query).filter(function(_a) { var _b = _a[1]; return _b !== undefined; }).map(function(_c) { var key = _c[0], value = _c[1]; return [key, String(value)]; }),
      ).toString()
    : '';

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Attach auth token if available — skip for login + auth endpoints
  try {
    if (!path.includes('/auth/login')) {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }
    }
  } catch (_e) {}

  const maxRetries = 3;
  const delays = [1000, 2000, 4000];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(API_BASE_URL + path + queryString, {
        method: config.method || 'GET',
        headers: headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.warn('[apiClient] Auth required for ' + path);
          throw new Error('Authentication required');
        }
        if (response.status === 409) {
          throw new Error('Conflict: ' + response.status);
        }
        throw new Error('API request failed: ' + response.status);
      }

      var text = await response.text();
      try {
        return JSON.parse(text) as T;
      } catch (_e2) {
        console.warn('[apiClient] Non-JSON response from ' + path + ': ' + text.substring(0, 100));
        return {} as T;
      }
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.warn('[apiClient] Retry ' + (attempt + 1) + '/' + maxRetries + ' for ' + path);
      await new Promise(function(resolve) { return setTimeout(resolve, delays[attempt]); });
    }
  }
  throw new Error('Unreachable');
}
