export type ApiRequestConfig = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

const MAX_RETRIES = 3;
const TIMEOUT_MS = 10_000;
const RETRY_DELAYS_MS = [1000, 2000, 4000]; // exponential backoff

function isRetryableError(status: number, errorName?: string): boolean {
  // Network errors and timeouts are retryable
  if (errorName === 'AbortError' || errorName === 'TypeError') return true;
  // Server errors (5xx) and 429 (rate limit) are retryable
  if (status >= 500) return true;
  if (status === 429) return true;
  // Client errors (4xx) are NOT retryable — retrying won't fix a bad request
  return false;
}

export async function apiClient<T>(path: string, config: ApiRequestConfig = {}): Promise<T> {
  const queryString = config.query
    ? `?${new URLSearchParams(
        Object.entries(config.query)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)]),
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

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${API_BASE_URL}${path}${queryString}`, {
        method: config.method ?? 'GET',
        headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Auth errors: throw immediately — no fallback, no localStorage
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            `Authentication required for ${path} (HTTP ${response.status}). Please log in again.`,
          );
        }

        const errorMsg = `API request to ${path} failed with status ${response.status} ${response.statusText}`;

        if (isRetryableError(response.status)) {
          throw new Error(errorMsg);
        }

        // Non-retryable client error — throw immediately
        throw new Error(errorMsg);
      }

      const text = await response.text();
      try {
        return JSON.parse(text) as T;
      } catch {
        // If the response isn't JSON, return the text as-is (cast to T)
        console.warn(`[apiClient] Non-JSON response from ${path}:`, text.substring(0, 100));
        return text as unknown as T;
      }
    } catch (error) {
      clearTimeout(timeoutId);

      const err = error instanceof Error ? error : new Error(String(error));
      lastError = err;

      const isRetryable = isRetryableError(
        (error as any)?.status ?? 0,
        err.name,
      );

      if (attempt < MAX_RETRIES && isRetryable) {
        const delay = RETRY_DELAYS_MS[attempt] ?? 4000;
        console.warn(
          `[apiClient] Request to ${path} failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}): ${err.message}. Retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Final attempt failed — throw with clear message
      break;
    }
  }

  throw new Error(
    `Unable to connect to server: request to ${path} failed after ${MAX_RETRIES + 1} attempts. Last error: ${lastError?.message}`,
  );
}
