<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { useAuthStore, type LogoutReason } from "@/stores/auth.store";

// Spinner → checkmark, then redirect to login. Total visible time is ~1.5s
// (matches the "Sie wurden abgemeldet" acceptance criteria); the split
// below just controls when the spinner swaps for the checkmark.
const SUCCESS_AT_MS = 700;
const REDIRECT_AT_MS = 1500;

const auth = useAuthStore();
const router = useRouter();

const phase = ref<"spinning" | "success">("spinning");
let successTimer: ReturnType<typeof setTimeout> | undefined;
let redirectTimer: ReturnType<typeof setTimeout> | undefined;

const COPY: Record<LogoutReason, { title: string; description: string }> = {
  manual: {
    title: "Sie wurden abgemeldet",
    description: "Sie werden zur Anmeldung weitergeleitet.",
  },
  inactivity: {
    title: "Sie wurden abgemeldet",
    description: "Sie wurden aus Sicherheitsgründen aufgrund von Inaktivität abgemeldet.",
  },
  "session-expired": {
    title: "Sie wurden abgemeldet",
    description: "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.",
  },
};

const copy = computed(() => COPY[auth.logoutOverlay.reason]);

function clearTimers(): void {
  if (successTimer) clearTimeout(successTimer);
  if (redirectTimer) clearTimeout(redirectTimer);
  successTimer = undefined;
  redirectTimer = undefined;
}

watch(
  () => auth.logoutOverlay.visible,
  (visible) => {
    clearTimers();
    if (!visible) return;

    phase.value = "spinning";
    successTimer = setTimeout(() => {
      phase.value = "success";
    }, SUCCESS_AT_MS);

    redirectTimer = setTimeout(() => {
      void router.push({ name: "login" }).finally(() => {
        auth.finishLogoutOverlay();
      });
    }, REDIRECT_AT_MS);
  },
  { immediate: true },
);

onBeforeUnmount(clearTimers);
</script>

<template>
  <Teleport to="body">
    <Transition name="logout-overlay-fade">
      <div
        v-if="auth.logoutOverlay.visible"
        class="fixed inset-0 z-[200] flex items-center justify-center px-4 font-[Manrope,sans-serif]"
        style="
          background:
            radial-gradient(900px 500px at 78% -5%, rgba(1, 185, 144, 0.12), transparent 55%),
            linear-gradient(180deg, #10393b 0%, #0d3133 100%);
        "
        role="alert"
        aria-live="assertive"
      >
        <div class="flex flex-col items-center gap-5 text-center">
          <div
            class="flex h-20 w-20 items-center justify-center rounded-full"
            style="background: rgba(1, 185, 144, 0.14)"
          >
            <Icon
              v-if="phase === 'spinning'"
              icon="mdi:loading"
              class="size-10 animate-spin"
              style="color: #01b990"
            />
            <Icon
              v-else
              icon="mdi:check-circle"
              class="size-11 animate-in zoom-in-50 duration-300"
              style="color: #01b990"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <h2 class="text-[20px] font-extrabold tracking-[-0.4px] text-white">
              {{ copy.title }}
            </h2>
            <p class="max-w-xs text-[14px] font-medium text-white/70">
              {{ copy.description }}
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.logout-overlay-fade-enter-active,
.logout-overlay-fade-leave-active {
  transition: opacity 0.2s ease;
}

.logout-overlay-fade-enter-from,
.logout-overlay-fade-leave-to {
  opacity: 0;
}
</style>
