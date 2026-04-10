import client from './client'
import type {
  AuthResponse,
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '@/types'

/**
 * All auth endpoints are unauthenticated (no Bearer token required).
 * The Axios interceptor will still attempt to attach a token if one exists,
 * but the server ignores it on these routes — that's fine.
 */
export const authApi = {
  login: (payload: LoginPayload) =>
    client.post<AuthResponse>('/auth/login', payload).then((r) => r.data),

  register: (payload: RegisterPayload) =>
    client.post<AuthResponse>('/auth/register', payload).then((r) => r.data),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    client.post<void>('/auth/forgot-password', payload).then((r) => r.data),

  resetPassword: (payload: ResetPasswordPayload) =>
    client.post<void>('/auth/reset-password', payload).then((r) => r.data),

  /**
   * Called automatically by the Axios interceptor — not called directly by
   * the store.  The store exposes `refreshTokens()` which delegates here.
   */
  refreshToken: (refreshToken: string) =>
    client.post<AuthTokens>('/auth/refresh', { refreshToken }).then((r) => r.data),

  /**
   * Invalidates the refresh token on the server.  Best-effort — we clear
   * the local session regardless of whether this call succeeds.
   */
  logout: (refreshToken: string) =>
    client.post<void>('/auth/logout', { refreshToken }).then((r) => r.data),
}
