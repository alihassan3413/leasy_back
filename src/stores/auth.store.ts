import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { authApi } from '@/api'
import { configureClientAuth } from '@/api/client/auth'
import { normalizeApiError, type ApiError } from '@/api/client/error'
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  RegisterResponse,
} from '@/types'

type AuthStatus = 'idle' | 'loading' | 'success' | 'error'

export const useAuthStore = defineStore(
  'auth',
  () => {
    const accessToken = ref<string | null>(null)
    const user = ref<AuthResponse['user'] | null>(null)

    const status = ref<AuthStatus>('idle')
    const error = ref('')

    const isAuthenticated = computed(() => Boolean(accessToken.value))

    function resetState(): void {
      accessToken.value = null
      user.value = null
      status.value = 'idle'
      error.value = ''
    }

    function setSession(payload: AuthResponse): void {
      user.value = payload.user
      accessToken.value = payload.tokens.accessToken
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

    async function register(payload: RegisterPayload): Promise<RegisterResponse> {
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

    function logout(): void {
      resetState()
    }

    function initAuthClient(): void {
      configureClientAuth({
        getAccessToken: () => accessToken.value,
        onAuthFailure: resetState,
      })
    }

    return {
      accessToken,
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
    }
  },
  {
    persist: {
      key: 'auth',
      storage: localStorage,
      pick: ['accessToken', 'user'],
    },
  },
)