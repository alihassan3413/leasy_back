import { post } from '../client/request'
import type {
  AuthResponse,
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  RegisterResponse,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '@/types'

export const authApi = {
  login(payload: LoginPayload) {
    return post<AuthResponse, LoginPayload>('/auth/login', payload, {
      skipAuth: true,
    })
  },

  register(payload: RegisterPayload) {
    return post<RegisterResponse, RegisterPayload>('/auth/register', payload, {
      skipAuth: true,
    })
  },

  forgotPassword(payload: ForgotPasswordPayload) {
    return post<void, ForgotPasswordPayload>('/auth/forgot-password', payload, {
      skipAuth: true,
    })
  },

  resetPassword(payload: ResetPasswordPayload) {
    return post<void, ResetPasswordPayload>('/auth/reset-password', payload, {
      skipAuth: true,
    })
  },

  refreshToken(refreshToken: string) {
    return post<AuthTokens, { refreshToken: string }>(
      '/auth/refresh',
      { refreshToken },
      { skipAuth: true },
    )
  },

  logout(refreshToken: string) {
    return post<void, { refreshToken: string }>(
      '/auth/logout',
      { refreshToken },
    )
  },
}