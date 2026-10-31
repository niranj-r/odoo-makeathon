/**
 * Base API Client utility
 * Prepares HTTP / REST communication layer for BrightLoop services.
 * In development, hooks consume mock data through service abstractions.
 */

const BASE_URL = import.meta.env?.VITE_API_URL || '/api';

/**
 * Standard HTTP request wrapper with json parsing and error handling.
 * @param {string} endpoint 
 * @param {RequestInit} [options]
 */
export async function apiClient(endpoint, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const error = new Error(errorBody.message || `API request failed with status ${response.status}`);
      error.status = response.status;
      error.data = errorBody;
      throw error;
    }

    return await response.json();
  } catch (error) {
    // Standard error logging; in production forward to telemetry
    console.error(`[API Client Error] ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * Helper to simulate network latency for mock data during development
 * @template T
 * @param {T} data
 * @param {number} [delayMs=120]
 * @returns {Promise<T>}
 */
export function mockAsyncResponse(data, delayMs = 120) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, delayMs);
  });
}

export default apiClient;

