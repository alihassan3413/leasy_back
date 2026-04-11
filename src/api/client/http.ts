import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { authConfig } from './auth'

const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.skipAuth) return config

  const token = authConfig().getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

let isRefreshing = false
let pendingQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function resolveQueue(token: string) {
  pendingQueue.forEach(({ resolve }) => resolve(token))
  pendingQueue = []
}

function rejectQueue(error: unknown) {
  pendingQueue.forEach(({ reject }) => reject(error))
  pendingQueue = []
}

http.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) throw error

    const original = error.config
    const isRefreshCall = original?.url?.includes('/auth/refresh')

    if (
      error.response?.status !== 401 ||
      !original ||
      original._retried ||
      isRefreshCall ||
      original.skipAuth
    ) {
      throw error
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      }).then((newToken) => {
        original.headers.Authorization = `Bearer ${newToken}`
        return http(original)
      })
    }

    original._retried = true
    isRefreshing = true

    try {
      const newToken = await authConfig().refreshAccessToken()
      resolveQueue(newToken)
      original.headers.Authorization = `Bearer ${newToken}`
      return http(original)
    } catch (refreshError) {
      rejectQueue(refreshError)
      authConfig().onAuthFailure()
      throw refreshError
    } finally {
      isRefreshing = false
    }
  },
)

export default http