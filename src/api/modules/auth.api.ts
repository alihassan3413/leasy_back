import { post } from '../client/request'
import { mapLoginResponse } from '../mappers/auth.mapper'
import type {
  AuthResponse,
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  RegisterResponse,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  RawLoginResponse,
} from '@/types'

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const raw = await post<RawLoginResponse, LoginPayload>('/auth/login', payload, {
      skipAuth: true,
    })

    return mapLoginResponse(raw, payload.user_email)
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