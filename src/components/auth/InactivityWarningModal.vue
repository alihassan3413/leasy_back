<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { useInactivityLogout } from "@/composables/useInactivityLogout";

// Deliberately no backdrop-click / Escape dismiss handler here: once shown,
// only an explicit button click may close this modal (see
// useInactivityLogout's recordActivity(), which ignores ambient page
// activity while the warning is up).
const { warningVisible, secondsRemaining, staySignedIn, logoutNow } = useInactivityLogout();
</script>

<template>
  <Teleport to="body">
    <Transition name="inactivity-modal-fade">
      <div
        v-if="warningVisible"
        class="fixed inset-0 z-[190] flex items-center justify-center bg-black/40 px-4 font-[Manrope,sans-serif]"
      >
        <div class="w-full max-w-sm rounded-[20px] bg-white p-7 text-center shadow-2xl">
          <div
            class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style="background: rgba(239, 132, 80, 0.12)"
          >
            <Icon icon="mdi:timer-alert-outline" class="size-7" style="color: #ef8450" />
          </div>

          <h2 class="text-[18px] font-bold text-[#10393b]">Sind Sie noch da?</h2>
          <p class="mt-2 text-[14px] text-[#5a6b7a]">
            Sie werden in {{ secondsRemaining }} Sekunden automatisch abgemeldet.
          </p>

          <div class="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              class="w-full rounded-full py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
              style="background: #01b990"
              @click="staySignedIn"
            >
              Angemeldet bleiben
            </button>
            <button
              type="button"
              class="w-full rounded-full border border-gray-300 py-3 text-[14px] font-medium text-[#2e3e3f] transition-colors hover:bg-gray-50"
              @click="logoutNow"
            >
              Jetzt abmelden
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.inactivity-modal-fade-enter-active,
.inactivity-modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.inactivity-modal-fade-enter-from,
.inactivity-modal-fade-leave-to {
  opacity: 0;
}
</style>
