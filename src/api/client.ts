import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from 'axios'

// ─────────────────────────────────────────────────────────────────────────────
// Auth callbacks
//
// The Axios client cannot import the Pinia store directly — that creates a
// circular dependency (store → api/auth → client → store).  Instead, the
// store calls `configureClientAuth` at bootstrap time to hand over the
// token getter and refresh handler as plain callbacks.
// ─────────────────────────────────────────────────────────────────────────────

type TokenGetter = () => string | null
type TokenRefresher = () => Promise<string>  // resolves with the new access token
type AuthFailureHandler = () => void

let getAccessToken: TokenGetter = () => null
let doRefreshToken: TokenRefresher = () => Promise.reject(new Error('Auth not configured'))
let onAuthFailure: AuthFailureHandler = () => {}

export function configureClientAuth(opts: {
  getAccessToken: TokenGetter
  refreshAccessToken: TokenRefresher
  onAuthFailure: AuthFailureHandler
}): void {
  getAccessToken = opts.getAccessToken
  doRefreshToken = opts.refreshAccessToken
  onAuthFailure = opts.onAuthFailure
}

// ─────────────────────────────────────────────────────────────────────────────
// Axios instance
// ─────────────────────────────────────────────────────────────────────────────

const client: AxiosInstance = axios.create({
  // VITE_API_URL is typed via src/env.d.ts — no `any` here.
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor ───────────────────────────────────────────────────────
// Attach the Bearer token to every outgoing request.

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor ──────────────────────────────────────────────────────
// On a 401 we attempt a transparent token refresh.  While the refresh is in
// flight we queue all other failing requests so they replay with the new token
// instead of being rejected — this avoids a cascade of login redirects when
// multiple requests fire simultaneously near token expiry.

let isRefreshing = false
let pendingQueue: Array<{
  resolve: (newToken: string) => void
  reject: (err: unknown) => void
}> = []

function drainQueue(newToken: string): void {
  pendingQueue.forEach(({ resolve }) => resolve(newToken))
  pendingQueue = []
}

function rejectQueue(err: unknown): void {
  pendingQueue.forEach(({ reject }) => reject(err))
  pendingQueue = []
}

// Extend the Axios config type to carry our internal retry flag.
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retried?: boolean
  }
}

client.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: unknown) => {
    // Pass non-Axios errors straight through — we only handle HTTP errors here.
    if (!axios.isAxiosError(error)) throw error

    const original = error.config

    // Only intercept 401s on non-refresh endpoints and only once per request.
    const isRefreshEndpoint = original?.url?.includes('/auth/refresh')
    if (error.response?.status !== 401 || original?._retried || isRefreshEndpoint) {
      throw error
    }

    if (isRefreshing) {
      // Park this request until the ongoing refresh settles.
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      }).then((newToken) => {
        if (!original) throw error
        original.headers.Authorization = `Bearer ${newToken}`
        return client(original)
      })
    }

    original!._retried = true
    isRefreshing = true

    try {
      const newToken = await doRefreshToken()
      drainQueue(newToken)
      original!.headers.Authorization = `Bearer ${newToken}`
      return client(original!)
    } catch (refreshError) {
      rejectQueue(refreshError)
      onAuthFailure()
      throw refreshError
    } finally {
      isRefreshing = false
    }
  },
)

export default client
