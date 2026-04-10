import { storeToRefs } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { LoginPayload, RegisterPayload, ForgotPasswordPayload } from '@/types'

/**
 * Composable that combines the auth store with routing logic.
 *
 * Views should import this instead of the store directly — it keeps
 * navigation concerns out of the store and makes views easy to test.
 */
export function useAuth() {
  const store = useAuthStore()
  const router = useRouter()
  const route = useRoute()

  const { user, status, error, isAuthenticated, userRole, isAdmin, fullName } =
    storeToRefs(store)

  async function login(payload: LoginPayload): Promise<void> {
    await store.login(payload)
    // After login, honour any ?redirect= query param set by the auth guard.
    const redirect = (route.query.redirect as string) || '/dashboard'
    await router.push(redirect)
  }

  async function register(payload: RegisterPayload): Promise<void> {
    await store.register(payload)
    await router.push('/dashboard')
  }

  async function forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    // The view handles the success state — no redirect here.
    await store.forgotPassword(payload)
  }

  async function logout(): Promise<void> {
    await store.logout()
    await router.push({ name: 'login' })
  }

  return {
    // Reactive state
    user,
    status,
    error,
    isAuthenticated,
    userRole,
    isAdmin,
    fullName,
    // Actions (with routing)
    login,
    register,
    forgotPassword,
    logout,
  }
}
