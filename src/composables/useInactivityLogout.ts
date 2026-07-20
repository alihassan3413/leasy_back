import { computed, ref, watch } from "vue";
import { useThrottleFn } from "@vueuse/core";
import router from "@/router";
import { useAuthStore, LOGOUT_EVENT_KEY } from "@/stores/auth.store";

// ── Configuration ───────────────────────────────────────────────────────
// The five-minute auto-logout duration and the thirty-second warning window
// are configured here — change these two constants to adjust both.
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
const WARNING_BEFORE_MS = 30 * 1000;

const TICK_INTERVAL_MS = 1000;
const ACTIVITY_PERSIST_MIN_INTERVAL_MS = 1000;

// Cross-tab sync key — only a timestamp lives here, never token/user data.
// (Logout events use `LOGOUT_EVENT_KEY`, shared with the auth store.)
const LAST_ACTIVITY_KEY = "leasyback_last_activity";

const DIRECT_ACTIVITY_EVENTS = ["click", "keydown", "touchstart"] as const;
const THROTTLED_ACTIVITY_EVENTS = ["mousemove", "scroll"] as const;

// ── Module-level singleton state ────────────────────────────────────────
// Shared across every call site so there is exactly one timer/listener set
// no matter how many components call useInactivityLogout().
const lastActivity = ref(Date.now());
const now = ref(Date.now());
const warningVisible = ref(false);

const secondsRemaining = computed(() => {
  const remaining = INACTIVITY_TIMEOUT_MS - (now.value - lastActivity.value);
  return Math.max(0, Math.ceil(remaining / 1000));
});

let started = false;
let watcherRegistered = false;
let intervalHandle: ReturnType<typeof setInterval> | undefined;
let lastPersistedAt = 0;
let removeRouterHook: (() => void) | undefined;

function persistActivity(ts: number): void {
  const nowMs = Date.now();
  if (nowMs - lastPersistedAt < ACTIVITY_PERSIST_MIN_INTERVAL_MS) return;
  lastPersistedAt = nowMs;
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(ts));
  } catch {
    // Storage-restricted context (private browsing, quota, ...) — cross-tab
    // sync is a nice-to-have, not load-bearing for this tab's own timer.
  }
}

function recordActivity(): void {
  // Once the warning modal is up, ambient page activity (mouse jitter,
  // background scroll) must NOT silently reset the timer — only an
  // explicit "Angemeldet bleiben" click (staySignedIn, below) may.
  if (warningVisible.value) return;
  const ts = Date.now();
  lastActivity.value = ts;
  persistActivity(ts);
}

const throttledActivity = useThrottleFn(recordActivity, 1000, true, true);

function handleStorage(event: StorageEvent): void {
  if (event.key === LAST_ACTIVITY_KEY && event.newValue) {
    const ts = Number(event.newValue);
    if (!Number.isNaN(ts) && ts > lastActivity.value) {
      lastActivity.value = ts;
    }
    return;
  }

  if (event.key === LOGOUT_EVENT_KEY && event.newValue) {
    const auth = useAuthStore();
    if (auth.isAuthenticated) {
      void auth.logout("session-expired");
    }
  }
}

// Timestamp-based, not setTimeout-count-based: recomputes elapsed time from
// Date.now() on every fire (interval tick, or a visibilitychange re-check),
// so a throttled background tab or a sleep/wake cycle can never desync the
// actual elapsed idle time.
function tick(): void {
  now.value = Date.now();
  const remaining = INACTIVITY_TIMEOUT_MS - (now.value - lastActivity.value);

  if (remaining <= 0) {
    warningVisible.value = false;
    void useAuthStore().logout("inactivity");
    return;
  }

  warningVisible.value = remaining <= WARNING_BEFORE_MS;
}

function handleVisibilityChange(): void {
  if (document.visibilityState === "visible") tick();
}

function start(): void {
  if (started) return;
  started = true;

  lastActivity.value = Date.now();
  now.value = lastActivity.value;
  warningVisible.value = false;

  for (const evt of DIRECT_ACTIVITY_EVENTS) {
    window.addEventListener(evt, recordActivity, { passive: true });
  }
  for (const evt of THROTTLED_ACTIVITY_EVENTS) {
    window.addEventListener(evt, throttledActivity, { passive: true });
  }
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("storage", handleStorage);

  intervalHandle = setInterval(tick, TICK_INTERVAL_MS);
  removeRouterHook = router.afterEach(() => recordActivity());
}

function stop(): void {
  if (!started) return;
  started = false;

  for (const evt of DIRECT_ACTIVITY_EVENTS) {
    window.removeEventListener(evt, recordActivity);
  }
  for (const evt of THROTTLED_ACTIVITY_EVENTS) {
    window.removeEventListener(evt, throttledActivity);
  }
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  window.removeEventListener("storage", handleStorage);

  if (intervalHandle !== undefined) clearInterval(intervalHandle);
  intervalHandle = undefined;

  removeRouterHook?.();
  removeRouterHook = undefined;

  warningVisible.value = false;
}

function staySignedIn(): void {
  warningVisible.value = false;
  const ts = Date.now();
  lastActivity.value = ts;
  now.value = ts;
  persistActivity(ts);
}

function logoutNow(): void {
  void useAuthStore().logout("manual");
}

/**
 * Centralized inactivity manager. Safe to call from multiple components —
 * the underlying listeners/timer/watcher are registered exactly once.
 */
export function useInactivityLogout() {
  const auth = useAuthStore();

  if (!watcherRegistered) {
    watcherRegistered = true;
    // Active exactly when authenticated and off a public (guestOnly) route
    // — reuses the same route meta the router guard already relies on.
    watch(
      () => auth.isAuthenticated && router.currentRoute.value.meta.guestOnly !== true,
      (active) => {
        if (active) start();
        else stop();
      },
      { immediate: true },
    );
  }

  return {
    warningVisible,
    secondsRemaining,
    staySignedIn,
    logoutNow,
  };
}
