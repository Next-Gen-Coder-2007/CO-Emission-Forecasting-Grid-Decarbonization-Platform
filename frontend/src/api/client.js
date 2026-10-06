/**
 * Centralized API Client
 * Dynamically resolves the API base URL from the VITE_API_URL environment variable.
 * In local development: defaults to http://localhost:5000.
 * In cloud deployment (Vercel / Render / Railway): uses the configured cloud URL or same-domain path.
 */

const RAW_API_URL = import.meta.env.VITE_API_URL;
export const API_BASE_URL = RAW_API_URL ? RAW_API_URL.replace(/\/+$/, '') : '';

/**
 * Resolves an API endpoint path to the full target URL based on environment settings.
 * @param {string} endpoint - e.g. '/api/overview' or 'api/models'
 * @returns {string} - Full API URL
 */
export function apiUrl(endpoint) {
  if (!endpoint) return API_BASE_URL || '';
  if (/^https?:\/\//i.test(endpoint)) return endpoint;

  const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalized}` : normalized;
}

/**
 * Convenience wrapper around native fetch that automatically prepends the API base URL.
 * @param {string} endpoint 
 * @param {RequestInit} options 
 * @returns {Promise<Response>}
 */
export async function apiFetch(endpoint, options = {}) {
  const url = apiUrl(endpoint);
  return fetch(url, options);
}

export default {
  apiUrl,
  apiFetch,
  API_BASE_URL
};
