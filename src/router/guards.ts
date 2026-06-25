import type { Router, RouteLocationRaw } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import type { UserRole } from "@/types";

/**
 * Resolve the post-login destination for a user, taking onboarding into
 * account. If the user hasn't finished profile setup, send them to their
 * role's onboarding route. Otherwise, send them to their dashboard.
 */
function landingRouteFor(role: UserRole | null, onboardingComplete: boolean): RouteLocationRaw {
  if (!role) return { name: "login" };

  if (!onboardingComplete) {
    switch (role) {
      case "B2B":
        return { name: "register-company" };
      case "WORKSHOP":
        return { name: "register-workshop" };
      case "B2C":
        return { name: "b2c-register" };
      case "ADMIN":
        return { name: "admin" }; // admins skip onboarding
    }
  }

  switch (role) {
    case "B2B":
      return { name: "dashboard-b2b" };
    case "B2C":
      return { name: "dashboard-b2c" };
    case "WORKSHOP":
      // No workshop dashboard yet — send to account/onboarding.
      return { name: "register-workshop" };
    case "ADMIN":
      return { name: "admin" };
  }
}

export function registerGuards(router: Router): void {
  router.beforeEach((to) => {
    // Guards run inside the router context so Pinia is already active.
    const auth = useAuthStore();

    // Clear any previous error messages when navigating to a new page.
    auth.clearError();

    // NOTE: this assumes your auth store exposes an "onboarding complete"
    // flag. Rename to match your actual store property — e.g.
    //   auth.user?.profileCompleted
    //   auth.user?.onboardingDone
    //   auth.hasCompletedOnboarding
    // If the flag doesn't exist yet, treat it as `true` here so behavior
    // doesn't regress, and add the flag to the backend payload + store.
    const onboardingComplete = auth.user?.profileCompleted ?? true;

    // ── 1. Guest-only routes (login, register, forgot password) ──
    // Authenticated users shouldn't see these; send them where they
    // actually belong based on role and onboarding state.
    if (to.meta.guestOnly && auth.isAuthenticated) {
      // Always send to dashboard — the onboarding gate handles incomplete
      // profiles from there. Never send back to the registration flow.
      return landingRouteFor(auth.userRole, true);
    }

    // ── 2. Protected routes require authentication ──
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      return { name: "login", query: { redirect: to.fullPath } };
    }

    // ── 3. Force onboarding if incomplete ──
    // An authenticated user who hasn't finished onboarding can only
    // navigate to their own onboarding route (or logout). Trying to
    // reach a dashboard/account before that gets redirected.
    if (
      auth.isAuthenticated &&
      !onboardingComplete &&
      to.meta.requiresAuth &&
      !to.meta.isOnboarding
    ) {
      return landingRouteFor(auth.userRole, false);
    }

    // ── 4. Role-based access ──
    // If a route declares roles and the user's role isn't in the list,
    // bounce them to their OWN dashboard (not the B2C one, which was
    // the previous behavior and could cause loops).
    if (to.meta.roles && auth.userRole && !to.meta.roles.includes(auth.userRole)) {
      return landingRouteFor(auth.userRole, onboardingComplete);
    }

    // Dashboard redirection based on role
    if (to.name === "dashboard" && auth.userRole === "B2B") {
      return { name: "dashboard-b2b" };
    }

    if (to.name === "dashboard-b2b" && auth.userRole === "B2C") {
      return { name: "dashboard" };
    }

    // Account redirection based on role
    if (to.name === "b2c-account" && auth.userRole === "B2B") {
      return { name: "b2b-account" };
    }

    if (to.name === "b2b-account" && auth.userRole === "B2C") {
      return { name: "b2c-account" };
    }
  });

  // Keep the browser tab title in sync with the current route.
  router.afterEach((to) => {
    document.title = to.meta.title ? `${to.meta.title} — Leasyback` : "Leasyback";
  });
}
