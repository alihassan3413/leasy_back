import type { RouteRecordRaw, RouteLocationRaw } from "vue-router";
import type { UserRole } from "@/types";
import { useAuthStore } from "@/stores/auth.store";

declare module "vue-router" {
  interface RouteMeta {
    title?: string;
    requiresAuth?: boolean;
    guestOnly?: boolean;
    roles?: UserRole[];
    isOnboarding?: boolean;
  }
}

const dashboardForCurrentUser = (): RouteLocationRaw => {
  const auth = useAuthStore();
  switch (auth.userRole) {
    case "B2B":
      return { name: "dashboard-b2b" };
    case "B2C":
      return { name: "dashboard-b2c" };
    case "WORKSHOP":
      return { name: "register-workshop" };
    case "ADMIN":
      return { name: "admin" };
    default:
      return { name: "login" };
  }
};

export const routes: RouteRecordRaw[] = [
  // ─── Guest-only auth pages ──────────────────────────────────────
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
        meta: { title: "Anmelden" },
      },
      {
        path: "register",
        name: "register",
        component: () => import("@/views/auth/RegisterView.vue"),
        meta: { title: "Registrieren" },
      },
      {
        path: "forgot-password",
        name: "forgot-password",
        component: () => import("@/views/auth/ForgotPasswordView.vue"),
        meta: { title: "Passwort zurücksetzen" },
      },
    ],
  },

  // ─── B2B / B2C / Workshop app (uses AppLayout with its own navbar) ─
  {
    path: "/",
    component: () => import("@/layouts/AppLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      { path: "", redirect: dashboardForCurrentUser },
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
      {
        path: "b2c",
        name: "b2c-account",
        component: () => import("@/views/account/B2cAccountView.vue"),
        meta: { title: "B2C Konto", roles: ["B2C"] },
      },
      {
        path: "b2b",
        name: "b2b-account",
        component: () => import("@/views/account/B2bAccountView.vue"),
        meta: { title: "B2B Konto", roles: ["B2B"] },
      },
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

  // ─── Admin (completely separate — uses AdminLayout, NO AppLayout) ─
  {
    path: "/admin",
    component: () => import("@/layouts/AdminLayout.vue"),
    meta: { requiresAuth: true, roles: ["ADMIN"] },
    children: [
      {
        path: "",
        name: "admin",
        component: () => import("@/views/AdminPanel.vue"),
        meta: { title: "Admin Dashboard", roles: ["ADMIN"] },
      },
      {
        path: "kunden",
        name: "admin-kunden",
        component: () => import("@/views/admin/UsersView.vue"),
        meta: { title: "Kunden & Benutzer", roles: ["ADMIN"] },
      },
      {
        path: "fahrzeuge",
        name: "admin-fahrzeuge",
        component: () => import("@/views/admin/VehiclesView.vue"),
        meta: { title: "Fahrzeuge", roles: ["ADMIN"] },
      },
      {
        path: "auftraege",
        name: "admin-auftraege",
        component: () => import("@/views/admin/OrdersView.vue"),
        meta: { title: "Alle Aufträge", roles: ["ADMIN"] },
      },
    ],
  },

  // ─── Onboarding (post-signup) ────────────────────────────────────
  {
    path: "/register/company",
    name: "register-company",
    component: () => import("@/views/auth/RegisterCompanyView.vue"),
    meta: { title: "Firmenregistrierung", requiresAuth: true, roles: ["B2B"], isOnboarding: true },
  },
  {
    path: "/register/workshop",
    name: "register-workshop",
    component: () => import("@/views/auth/RegisterWorkshopView.vue"),
    meta: {
      title: "Werkstattregistrierung",
      requiresAuth: true,
      roles: ["WORKSHOP"],
      isOnboarding: true,
    },
  },
  {
    path: "/register/b2c",
    name: "b2c-register",
    component: () => import("@/views/auth/B2CRegistrationView.vue"),
    meta: { title: "B2C Registrierung", requiresAuth: true, roles: ["B2C"], isOnboarding: true },
  },

  // ─── Catch-all ───────────────────────────────────────────────────
  { path: "/:pathMatch(.*)*", redirect: "/" },
];
