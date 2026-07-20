<script setup lang="ts">
// Root component — layout and routing are handled by the router.
// LogoutOverlay/InactivityWarningModal are mounted once here (outside every
// layout) so they can cover the screen no matter which route is active, and
// useInactivityLogout() is bootstrapped here as the single call site that
// starts the centralized inactivity manager.
import LogoutOverlay from "@/components/auth/LogoutOverlay.vue";
import InactivityWarningModal from "@/components/auth/InactivityWarningModal.vue";
import { useInactivityLogout } from "@/composables/useInactivityLogout";

useInactivityLogout();
</script>

<template>
  <RouterView />
  <LogoutOverlay />
  <InactivityWarningModal />
</template>
