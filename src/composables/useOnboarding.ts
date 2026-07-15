import { ref } from "vue";

// First-visit onboarding state for the B2C dashboard.
//
// The project has no backend onboarding-preference field (the B2C `preferences`
// object only carries timezone/language/notification flags), so the "already
// seen" flag is persisted client-side under a user-specific, versioned key:
//
//   leasyback_b2c_onboarding_v1_<USER_ID>
//
// Being user-specific means a different B2C user on the same browser still gets
// their own first-visit popup. Bump the version segment to re-show the popup to
// everyone after a redesign.
const STORAGE_PREFIX = "leasyback_b2c_onboarding_v1_";

export function onboardingStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

/**
 * @param getUserId reactive getter for the authenticated user's id (may be
 *                  undefined until auth is ready).
 */
export function useOnboarding(getUserId: () => string | undefined) {
  const isOpen = ref(false);

  function hasSeen(): boolean {
    const id = getUserId();
    // No user → treat as "seen" so nothing ever flashes before auth is ready.
    if (!id) return true;
    try {
      return localStorage.getItem(onboardingStorageKey(id)) === "1";
    } catch {
      return true;
    }
  }

  function markSeen(): void {
    const id = getUserId();
    if (!id) return;
    try {
      localStorage.setItem(onboardingStorageKey(id), "1");
    } catch {
      // Storage unavailable (private mode / quota) — silently ignore; the popup
      // may show again next visit, which is acceptable.
    }
  }

  /** Open the popup only on a genuine first visit. */
  function maybeShow(): void {
    if (!hasSeen()) isOpen.value = true;
  }

  /** Manually (re)open the popup — e.g. from the dashboard help button. */
  function open(): void {
    isOpen.value = true;
  }

  /** Close the popup and persist that the user has seen it. */
  function dismiss(): void {
    markSeen();
    isOpen.value = false;
  }

  return { isOpen, maybeShow, open, dismiss };
}
