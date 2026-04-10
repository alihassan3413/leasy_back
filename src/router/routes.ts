import type { RouteRecordRaw } from 'vue-router'
import type { UserRole } from '@/types'

// Augment RouteMeta so every route definition is type-safe.
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    guestOnly?: boolean    // redirect away if the user is already authenticated
    roles?: UserRole[]     // if set, only these roles may access the route
  }
}

export const routes: RouteRecordRaw[] = [
  // ── Auth routes (accessible only when NOT logged in) ──────────────────────
  {
    path: '/auth',
    component: () => import('@/layouts/AuthLayout.vue'),
    meta: { guestOnly: true },
    children: [
      { path: '', redirect: '/auth/login' },
      {
        path: 'login',
        name: 'login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: { title: 'Sign In' },
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('@/views/auth/RegisterView.vue'),
        meta: { title: 'Create Account' },
      },
      {
        path: 'forgot-password',
        name: 'forgot-password',
        component: () => import('@/views/auth/ForgotPasswordView.vue'),
        meta: { title: 'Reset Password' },
      },
    ],
  },

  // ── Protected app routes ──────────────────────────────────────────────────
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { title: 'Dashboard' },
      },
    ],
  },

  // ── Fallback ──────────────────────────────────────────────────────────────
  { path: '/:pathMatch(.*)*', redirect: '/' },
]
