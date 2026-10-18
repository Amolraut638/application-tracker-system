import axios from 'axios'

/**
 * Centralized Axios instance.
 *
 * In development, Vite proxies /api → http://localhost:5000/api so we use
 * a relative baseURL. This makes every request same-origin, which means:
 *  - httpOnly cookies are sent automatically (no CORS preflight needed)
 *  - Content-Disposition headers are delivered directly to the browser
 *  - The `download` attribute on anchor tags works without blob-URL tricks
 *
 * In production, set VITE_API_BASE_URL to the deployed API origin.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api`
    : '/api',   // relative → proxied by Vite in dev, same path on same-host deploys
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10_000,
  withCredentials: true, // send httpOnly cookie on every request
})

// ── Request interceptor ───────────────────────────────────
apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
)

// ── Response interceptor ──────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ??
      error.message ??
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  },
)

export default apiClient
