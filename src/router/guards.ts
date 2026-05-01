import type { Router } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";

export function registerGuards(router: Router): void {
  router.beforeEach((to) => {
    // Guards run inside the router context so Pinia is already active here.
    const auth = useAuthStore();

    // Clear any previous error messages when navigating to a new page.
    auth.clearError();

    // Already authenticated users don't need the login/register pages.
    if (to.meta.guestOnly && auth.isAuthenticated) {
      if (auth.userRole === "B2B") {
        return { name: "register-company" };
      } else if (auth.userRole === "WORKSHOP") {
        return { name: "register-workshop" };
      } else if (auth.userRole === "B2C") {
        return { name: "b2c-register" };
      }
      return { name: "dashboard" };
    }

    // Unauthenticated users cannot access protected routes.
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      return { name: "login", query: { redirect: to.fullPath } };
    }

    // Role-based access: redirect to dashboard if the user's role isn't allowed.
    if (
      to.meta.roles &&
      auth.userRole &&
      !to.meta.roles.includes(auth.userRole)
    ) {
      return { name: "dashboard" };
    }
  });

  // Keep the browser tab title in sync with the current route.
  router.afterEach((to) => {
    document.title = to.meta.title
      ? `${to.meta.title} — Leasyback`
      : "Leasyback";
  });
}
