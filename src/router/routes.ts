import type { RouteRecordRaw, RouteLocationRaw } from "vue-router";
import type { UserRole } from "@/types";
import { useAuthStore } from "@/stores/auth.store";

declare module "vue-router" {
  interface RouteMeta {
    title?: string;
    requiresAuth?: boolean;
    guestOnly?: boolean;
    roles?: UserRole[];
    /**
     * Onboarding routes — users land here after first signup to complete
     * their profile. The guard skips the "redirect to dashboard if
     * authenticated" rule for these specifically.
     */
    isOnboarding?: boolean;
  }
}

/**
 * Resolve the right dashboard for the current user.
 * Used by `/` and the catch-all so role-mismatched redirects don't loop.
 */
const dashboardForCurrentUser = (): RouteLocationRaw => {
  const auth = useAuthStore();
  switch (auth.userRole) {
    case "B2B":
      return { name: "dashboard-b2b" };
    case "B2C":
      return { name: "dashboard-b2c" };
    case "WORKSHOP":
      // Workshops don't have a dashboard route of their own yet — send
      // them to their onboarding/account flow. Adjust if/when a
      // workshop dashboard view is added.
      return { name: "register-workshop" };
    case "ADMIN":
      return { name: "admin" };
    default:
      return { name: "login" };
  }
};

export const routes: RouteRecordRaw[] = [
  // ─── Auth (guest only) ──────────────────────────────────────────
  {
    path: "/auth",
    component: () => import("@/layouts/AuthLayout.vue"),
    meta: { guestOnly: true },
    children: [
      { path: "", redirect: "/auth/login" },
      {
        path: "login",
        name: "login",
        component: () => import("@/views/auth/LoginView.vue"),
        meta: { title: "Sign In" },
      },
      {
        path: "register",
        name: "register",
        component: () => import("@/views/auth/RegisterView.vue"),
        meta: { title: "Create Account" },
      },
      {
        path: "forgot-password",
        name: "forgot-password",
        component: () => import("@/views/auth/ForgotPasswordView.vue"),
        meta: { title: "Reset Password" },
      },
    ],
  },

  // ─── Authenticated app ──────────────────────────────────────────
  {
    path: "/",
    component: () => import("@/layouts/AppLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      // Smart root: send each role to its own dashboard.
      { path: "", redirect: dashboardForCurrentUser },

      // Dashboards — one per role.
      {
        path: "dashboard-b2c",
        name: "dashboard-b2c",
        component: () => import("@/views/DashboardView.vue"),
        meta: { title: "Dashboard", roles: ["B2C"] },
      },
      {
        path: "dashboard-b2b",
        name: "dashboard-b2b",
        component: () => import("@/views/DashboardB2B.vue"),
        meta: { title: "B2B Dashboard", roles: ["B2B"] },
      },

      // Account views — B2C and B2B only (workshops don't have one).
      {
        path: "b2c",
        name: "b2c-account",
        component: () => import("@/views/account/B2cAccountView.vue"),
        meta: { title: "B2C Account", roles: ["B2C"] },
      },
      {
        path: "b2b",
        name: "b2b-account",
        component: () => import("@/views/account/B2bAccountView.vue"),
<<<<<<< HEAD
        meta: { title: "B2B Account", roles: ["B2B"] },
      },

      // Shared across all authenticated roles.
=======
        meta: { title: "B2B Account" },
      },
>>>>>>> 48f52ed9f72f5e70ba9370c80a85f526e2accf41
      {
        path: "setting",
        name: "setting",
        component: () => import("@/views/setting/SettingView.vue"),
        meta: { title: "Einstellungen" },
      },
      {
        path: "payment",
        name: "payment",
        component: () => import("@/views/payment/HistoryB2c.vue"),
        meta: { title: "Zahlungen" },
      },
    ],
  },

  // ─── Onboarding (post-signup profile completion) ────────────────
  // These are authenticated routes that users hit AFTER signing up,
  // before they've completed their profile. `isOnboarding: true` tells
  // the guard not to bounce them back to a dashboard.
  {
    path: "/register/company",
    name: "register-company",
    component: () => import("@/views/auth/RegisterCompanyView.vue"),
    meta: {
      title: "Company Registration",
      requiresAuth: true,
      roles: ["B2B"],
      isOnboarding: true,
    },
  },
  {
    path: "/register/workshop",
    name: "register-workshop",
    component: () => import("@/views/auth/RegisterWorkshopView.vue"),
    meta: {
      title: "Workshop Registration",
      requiresAuth: true,
      roles: ["WORKSHOP"],
      isOnboarding: true,
    },
  },
  {
    path: "/register/b2c",
    name: "b2c-register",
    component: () => import("@/views/auth/B2CRegistrationView.vue"),
    meta: {
      title: "B2C Registrierung",
      requiresAuth: true,
      roles: ["B2C"],
      isOnboarding: true,
    },
  },

  // ─── Admin ──────────────────────────────────────────────────────
  // Was previously commented out — anyone could visit /admin. Restored.
  {
    path: "/admin",
    name: "admin",
    component: () => import("@/views/admin/AdminPanel.vue"),
    meta: {
      title: "Admin Panel",
      requiresAuth: true,
      roles: ["ADMIN"],
    },
  },

  // ─── Catch-all ──────────────────────────────────────────────────
  // Send unknown URLs through the smart root redirect, which handles
  // both authenticated (→ their dashboard) and guest (→ login) cases.
  { path: "/:pathMatch(.*)*", redirect: "/" },
];