import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { authApi } from '@/api'
import { configureClientAuth } from '@/api/client/auth'
import { normalizeApiError, type ApiError } from '@/api/client/error'
import type {
  AuthResponse,
  AuthTokens,
  LoginPayload,
  RegisterPayload,
} from '@/types'

type AuthStatus = 'idle' | 'loading' | 'success' | 'error'

export const useAuthStore = defineStore(
  'auth',
  () => {
    const accessToken = ref<string | null>(null)
    const refreshToken = ref<string | null>(null)
    const user = ref<AuthResponse['user'] | null>(null)

    const status = ref<AuthStatus>('idle')
    const error = ref('')

    const isAuthenticated = computed(() => Boolean(accessToken.value))

    function resetState(): void {
      accessToken.value = null
      refreshToken.value = null
      user.value = null
      status.value = 'idle'
      error.value = ''
    }

    function setTokens(tokens: AuthTokens): void {
      accessToken.value = tokens.accessToken
      refreshToken.value = tokens.refreshToken
    }

    function setSession(payload: AuthResponse): void {
      user.value = payload.user
      setTokens(payload.tokens)
    }

    function setError(apiError: ApiError): never {
      status.value = 'error'
      error.value = apiError.message
      throw apiError
    }

    async function login(payload: LoginPayload): Promise<AuthResponse> {
      status.value = 'loading'
      error.value = ''

      try {
        const response = await authApi.login(payload)
        setSession(response)
        status.value = 'success'
        return response
      } catch (err) {
        return setError(normalizeApiError(err))
      }
    }

    async function register(payload: RegisterPayload) {
      status.value = 'loading'
      error.value = ''

      try {
        const response = await authApi.register(payload)
        status.value = 'success'
        return response
      } catch (err) {
        return setError(normalizeApiError(err))
      }
    }

    async function refreshTokensAction(): Promise<string> {
      if (!refreshToken.value) {
        resetState()
        throw new Error('No refresh token available.')
      }

      try {
        const tokens = await authApi.refreshToken(refreshToken.value)
        setTokens(tokens)
        return tokens.accessToken
      } catch (err) {
        resetState()
        throw err
      }
    }

    async function logout(): Promise<void> {
      const currentRefreshToken = refreshToken.value

      try {
        if (currentRefreshToken) {
          await authApi.logout(currentRefreshToken)
        }
      } catch {
        // best effort logout
      } finally {
        resetState()
      }
    }

    function initAuthClient(): void {
      configureClientAuth({
        getAccessToken: () => accessToken.value,
        refreshAccessToken: refreshTokensAction,
        onAuthFailure: resetState,
      })
    }

    return {
      accessToken,
      refreshToken,
      user,
      status,
      error,
      isAuthenticated,
      login,
      register,
      logout,
      initAuthClient,
      resetState,
      setSession,
      setTokens,
      refreshTokens: refreshTokensAction,
    }
  },
  {
    persist: {
      key: 'auth',
      storage: localStorage,
      pick: ['accessToken', 'refreshToken', 'user'],
    },
  },
)