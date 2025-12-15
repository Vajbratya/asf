/**
 * API client utilities
 * Centralized API configuration and fetch wrapper
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Fetch wrapper with default configuration
 * Includes credentials and proper headers
 */
export async function apiFetch(path: string, options?: RequestInit) {
  const url = `${API_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'Request failed',
    }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response;
}

/**
 * GET request
 */
export async function apiGet<T>(path: string): Promise<T> {
  const response = await apiFetch(path, { method: 'GET' });
  return response.json();
}

/**
 * POST request
 */
export async function apiPost<T>(path: string, data?: unknown): Promise<T> {
  const response = await apiFetch(path, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
  return response.json();
}

/**
 * PUT request
 */
export async function apiPut<T>(path: string, data?: unknown): Promise<T> {
  const response = await apiFetch(path, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
  return response.json();
}

/**
 * DELETE request
 */
export async function apiDelete<T>(path: string): Promise<T> {
  const response = await apiFetch(path, { method: 'DELETE' });
  return response.json();
}
