import type { RouteRecordRaw } from "vue-router";
import type { UserRole } from "@/types";

declare module "vue-router" {
  interface RouteMeta {
    title?: string;
    requiresAuth?: boolean;
    guestOnly?: boolean;
    roles?: UserRole[];
  }
}

export const routes: RouteRecordRaw[] = [
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

  {
    path: "/",
    component: () => import("@/layouts/AppLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      { path: "", redirect: "/dashboard" },
      {
        path: "dashboard",
        name: "dashboard",
        component: () => import("@/views/DashboardView.vue"),
        meta: { title: "Dashboard" },
      },
    ],
  },
  {
    path: "/register/company",
    name: "register-company",
    component: () => import("@/views/auth/RegisterCompanyView.vue"),
    meta: { title: "Company registration",
            requiresAuth: true,
            roles: ['B2B']
     },
  },
  {
    path: "/register/workshop",
    name: "register-workshop",
    component: () => import("@/views/auth/RegisterWorkshopView.vue"),
    meta: { 
      title: "Workshop registration",
      requiresAuth: true,
      roles: ['WORKSHOP']
    },
  },

  { path: "/:pathMatch(.*)*", redirect: "/" },
];
