<script setup lang="ts">
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import VehicleTable from "@/components/dashboard/VehicleTable.vue";
import AddVehicleModal from "@/components/dashboard/modals/AddVehicleModal.vue";
import OnboardingModal from "@/components/dashboard/modals/OnboardingModal.vue";
import OrderCreationModal from "@/components/dashboard/modals/OrderCreationModal.vue";
import { useAuthStore } from "@/stores/auth.store";
import { useVehicleStore } from "@/stores/vehicle.store";
import { useOnboarding } from "@/composables/useOnboarding";
import { Icon } from "@iconify/vue";
import type { Vehicle } from "@/components/dashboard/vehicle.types";

const authStore = useAuthStore();
const vehicleStore = useVehicleStore();
const { vehicles, completedVehicles } = storeToRefs(vehicleStore);

const addVehicleOpen = ref(false);
const selectedVehicle = ref<Vehicle | null>(null);

// First-visit onboarding popup, keyed per B2C user (see useOnboarding).
const {
  isOpen: onboardingOpen,
  maybeShow: maybeShowOnboarding,
  open: openOnboarding,
  dismiss: dismissOnboarding,
} = useOnboarding(() => authStore.user?.id);

function onOnboardingOpenChange(value: boolean) {
  // Any close path (button, Escape, click-outside) persists "seen".
  if (!value) dismissOnboarding();
}

function onVehicleSelect(vehicle: Vehicle | null) {
  selectedVehicle.value = vehicle;
}

onMounted(() => {
  if (authStore.user?.id) {
    vehicleStore.fetchVehicles(authStore.user.id);
  }
  // Only for authenticated B2C users, once auth is ready — never flashes before.
  if (authStore.user?.id && authStore.user.role === "B2C") {
    maybeShowOnboarding();
  }
});
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Page header -->
    <div class="flex flex-col gap-4 mb-6 px-4 md:px-0">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <h1 class="text-[22px] md:text-[28px] font-semibold text-[#10393b]">Mein Dashboard</h1>

        <div class="flex flex-col items-stretch md:items-end gap-3 w-full md:w-auto">
          <!-- Notifications and info icons (only desktop) -->
          <!-- <div
            class="hidden md:flex items-center gap-2 px-4 py-2 rounded-full"
            style="background-color: #10393b"
          >
            <button class="text-white">
              <Icon icon="mdi:bell-outline" class="w-5 h-5" />
            </button>
            <button class="text-white">
              <Icon icon="mdi:information-outline" class="w-5 h-5" />
            </button>
          </div> -->

          <!-- Create new entry button -->
          <button
            @click="addVehicleOpen = true"
            class="flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium w-full md:w-auto justify-center"
            style="background-color: #ef8450"
          >
            <Icon icon="ic:baseline-plus" class="w-5 h-5" />
            <span>Neues Fahrzeug anlegen</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Vehicle table - takes remaining space -->
    <div class="flex-1 overflow-auto">
      <VehicleTable
        :vehicles="vehicles"
        :completed-vehicles="completedVehicles"
        @select="onVehicleSelect"
      />
    </div>

    <!-- Persistent help entry point: re-open the onboarding/intro popup anytime -->
    <button
      type="button"
      aria-label="Einführung ansehen"
      title="Einführung ansehen"
      class="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full py-3 pl-3 pr-4 text-white shadow-lg transition-all duration-200 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#01b990]/40 md:bottom-8 md:right-8"
      style="background-color: #10393b"
      @click="openOnboarding"
    >
      <span
        class="flex h-6 w-6 items-center justify-center rounded-full"
        style="background-color: #01b990"
      >
        <Icon icon="mdi:play" class="w-4 h-4" />
      </span>
      <span class="hidden text-sm font-medium sm:inline">Einführung</span>
    </button>

    <!-- Modals -->
    <AddVehicleModal v-model:open="addVehicleOpen" />
    <OnboardingModal :open="onboardingOpen" @update:open="onOnboardingOpenChange" />
  </div>
</template>
