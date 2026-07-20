import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { authApi } from "@/api";
import { configureClientAuth } from "@/api/client/auth";
import { normalizeApiError, type ApiError } from "@/api/client/error";
import type { AuthResponse, ChangePasswordPayload, LoginPayload, RegisterPayload } from "@/types";

type AuthStatus = "idle" | "loading" | "success" | "error";
export type LogoutReason = "manual" | "inactivity" | "session-expired";

// Cross-tab sync keys (see useInactivityLogout) — only timestamps live here,
// never token/user data.
export const LOGOUT_EVENT_KEY = "leasyback_logout_event";

export const useAuthStore = defineStore(
  "auth",
  () => {
    const accessToken = ref<string | null>(null);
    const user = ref<AuthResponse["user"] | null>(null);

    const status = ref<AuthStatus>("idle");
    const error = ref("");

    // Logout flow state — deliberately NOT persisted (see `persist.pick`
    // below): a fresh page load always starts with the overlay hidden.
    const isLoggingOut = ref(false);
    const logoutOverlay = ref<{ visible: boolean; reason: LogoutReason }>({
      visible: false,
      reason: "manual",
    });

    const isAuthenticated = computed(() => Boolean(accessToken.value));
    const userRole = computed(() => user.value?.role);

    function resetState(): void {
      accessToken.value = null;
      user.value = null;
      status.value = "idle";
      error.value = "";
    }

    function clearError(): void {
      error.value = "";
      status.value = "idle";
    }

    function setSession(payload: AuthResponse): void {
      user.value = payload.user;
      accessToken.value = payload.tokens.accessToken;
    }

    function updateProfile(updates: Partial<AuthResponse["user"]>): void {
      if (user.value) {
        user.value = { ...user.value, ...updates };
      }
    }

    function setError(apiError: ApiError): never {
      status.value = "error";

      if (apiError.status === 401 || apiError.status === 406) {
        error.value = "E-Mail oder Passwort ist falsch.";
      } else if (apiError.status === 422) {
        error.value = apiError.message || "Bitte überprüfen Sie Ihre Eingaben.";
      } else if (apiError.status === 0) {
        error.value = "Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.";
      } else {
        error.value = "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.";
      }

      throw apiError;
    }

    async function login(payload: LoginPayload): Promise<AuthResponse> {
      status.value = "loading";
      error.value = "";

      try {
        const response = await authApi.login(payload);

        setSession(response);

        status.value = "success";

        return response;
      } catch (err) {
        return setError(normalizeApiError(err));
      }
    }

    async function register(payload: RegisterPayload): Promise<AuthResponse> {
      status.value = "loading";
      error.value = "";

      try {
        await authApi.register(payload);

        const loginResponse = await authApi.login({
          user_email: payload.user_email,
          password: payload.password,
        });

        setSession(loginResponse);

        status.value = "success";

        return loginResponse;
      } catch (err) {
        return setError(normalizeApiError(err));
      }
    }

    async function changePassword(payload: ChangePasswordPayload): Promise<void> {
      // Self-contained: does not touch the shared login `status`/`error`,
      // callers surface their own feedback. Throws a normalized ApiError.
      try {
        await authApi.changePassword(payload);
      } catch (err) {
        throw normalizeApiError(err);
      }
    }

    // Single logout entry point for every trigger (manual click, inactivity
    // timeout, warning modal's "Jetzt abmelden", 401/419 interceptor, and a
    // foreign tab's logout event) — no parallel logout logic anywhere else.
    async function logout(reason: LogoutReason = "manual"): Promise<void> {
      // Dedupe: a second trigger firing while we're already tearing down
      // (e.g. several requests 401 at once) must not re-run this or spam
      // the backend logout call.
      if (isLoggingOut.value) return;
      isLoggingOut.value = true;
      logoutOverlay.value = { visible: true, reason };

      // Best-effort: tell the backend to end the session. Failures here
      // (network error, already-expired token, endpoint unavailable) must
      // never block the local logout — the user still gets logged out of
      // this browser regardless.
      try {
        await authApi.logout();
      } catch {
        // Intentionally swallowed — see comment above.
      }

      // Let other tabs know this session ended.
      try {
        localStorage.setItem(LOGOUT_EVENT_KEY, String(Date.now()));
      } catch {
        // localStorage can throw in private-browsing/storage-restricted
        // contexts — cross-tab sync is a nice-to-have, not load-bearing.
      }

      resetState();
      // `isLoggingOut` stays true (and the overlay stays visible) until
      // `finishLogoutOverlay()` — called by <LogoutOverlay> once its
      // animation finishes and it has navigated to the login page. This
      // keeps the dedupe guard active for the whole visible-overlay window,
      // not just the network round-trip.
    }

    function finishLogoutOverlay(): void {
      logoutOverlay.value = { ...logoutOverlay.value, visible: false };
      isLoggingOut.value = false;
    }

    function initAuthClient(): void {
      configureClientAuth({
        getAccessToken: () => accessToken.value,
        isLoggingOut: () => isLoggingOut.value,
        onAuthFailure: () => {
          void logout("session-expired");
        },
      });
    }

    return {
      accessToken,
      user,
      userRole,
      status,
      error,
      isAuthenticated,
      isLoggingOut,
      logoutOverlay,
      login,
      register,
      changePassword,
      logout,
      finishLogoutOverlay,
      clearError,
      initAuthClient,
      resetState,
      setSession,
      updateProfile,
    };
  },
  {
    persist: {
      key: "auth",
      storage: localStorage,
      pick: ["accessToken", "user"],
    },
  },
);
