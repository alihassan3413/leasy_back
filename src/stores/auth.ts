import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authApi } from '@/api/auth'
import { configureClientAuth } from '@/api/client'
import { isTokenExpired } from '@/utils/token'
import type {
  User,
  AuthTokens,
  UserRole,
  LoginPayload,
  RegisterPayload,
  ForgotPasswordPayload,
} from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useAuthStore = defineStore(
  'auth',
  () => {
    // ── State ────────────────────────────────────────────────────────────────
    const user = ref<User | null>(null)
    const tokens = ref<AuthTokens | null>(null)
    const status = ref<'idle' | 'loading' | 'error'>('idle')
    const error = ref<string | null>(null)

    // ── Getters ──────────────────────────────────────────────────────────────
    const isAuthenticated = computed(
      () => !!user.value && !!tokens.value && !isTokenExpired(tokens.value.expiresAt),
    )

    const userRole = computed<UserRole | null>(() => user.value?.role ?? null)

    const isAdmin = computed(() => user.value?.role === 'ADMIN')

    const fullName = computed(() =>
      user.value ? `${user.value.firstName} ${user.value.lastName}` : '',
    )

    // ── Internal helpers ─────────────────────────────────────────────────────
    function setSession(data: { user: User; tokens: AuthTokens }): void {
      user.value = data.user
      tokens.value = data.tokens
      error.value = null
    }

    function clearSession(): void {
      user.value = null
      tokens.value = null
    }

    // ── Actions ──────────────────────────────────────────────────────────────
    async function login(payload: LoginPayload): Promise<void> {
      status.value = 'loading'
      error.value = null
      try {
        const response = await authApi.login(payload)
        setSession(response)
        status.value = 'idle'
      } catch (err) {
        status.value = 'error'
        error.value = extractErrorMessage(err)
        throw err  // re-throw so the view can react if needed
      }
    }

    async function register(payload: RegisterPayload): Promise<void> {
      status.value = 'loading'
      error.value = null
      try {
        const response = await authApi.register(payload)
        setSession(response)
        status.value = 'idle'
      } catch (err) {
        status.value = 'error'
        error.value = extractErrorMessage(err)
        throw err
      }
    }

    async function forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
      status.value = 'loading'
      error.value = null
      try {
        await authApi.forgotPassword(payload)
        status.value = 'idle'
      } catch (err) {
        status.value = 'error'
        error.value = extractErrorMessage(err)
        throw err
      }
    }

    async function logout(): Promise<void> {
      // Always clear the local session — even if the server call fails.
      try {
        if (tokens.value) {
          await authApi.logout(tokens.value.refreshToken)
        }
      } finally {
        clearSession()
      }
    }

    /**
     * Called by the Axios client interceptor on 401.
     * Resolves with the new access token so the interceptor can
     * replay the original request without the caller knowing.
     */
    async function refreshTokens(): Promise<string> {
      if (!tokens.value) throw new Error('No session — cannot refresh')
      const fresh = await authApi.refreshToken(tokens.value.refreshToken)
      tokens.value = fresh
      return fresh.accessToken
    }

    /**
     * Wire the Axios client to this store's token state.
     * Must be called once after Pinia is mounted (in main.ts).
     */
    function bootstrap(): void {
      configureClientAuth({
        getAccessToken: () => tokens.value?.accessToken ?? null,
        refreshAccessToken: () => refreshTokens(),
        onAuthFailure: () => clearSession(),
      })
    }

    return {
      // State
      user,
      tokens,
      status,
      error,
      // Getters
      isAuthenticated,
      userRole,
      isAdmin,
      fullName,
      // Actions
      login,
      register,
      forgotPassword,
      logout,
      refreshTokens,
      bootstrap,
    }
  },
  {
    // Only persist the session data — not loading/error UI state.
    persist: {
      pick: ['user', 'tokens'],
    },
  },
)

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as { response?: { data?: { message?: string } } }
    return axiosErr.response?.data?.message ?? 'An unexpected error occurred.'
  }
  return 'An unexpected error occurred.'
}
