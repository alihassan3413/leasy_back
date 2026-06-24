<script setup lang="ts">
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import VehicleTable from "@/components/dashboard/VehicleTable.vue";
import AddVehicleModal from "@/components/dashboard/modals/AddVehicleModal.vue";
import OrderCreationModal from "@/components/dashboard/modals/OrderCreationModal.vue";
import { useAuthStore } from "@/stores/auth.store";
import { useVehicleStore } from "@/stores/vehicle.store";
import { Icon } from "@iconify/vue";
import type { Vehicle } from "@/components/dashboard/vehicle.types";

const authStore = useAuthStore();
const vehicleStore = useVehicleStore();
const { vehicles, completedVehicles } = storeToRefs(vehicleStore);

const addVehicleOpen = ref(false);
const selectedVehicle = ref<Vehicle | null>(null);

function onVehicleSelect(vehicle: Vehicle | null) {
  selectedVehicle.value = vehicle;
}

onMounted(() => {
  if (authStore.user?.id) {
    vehicleStore.fetchVehicles(authStore.user.id);
  }
});
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Page header -->
    <div class="flex flex-col gap-4 mb-6 px-4 md:px-0">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <h1 class="text-[22px] md:text-[28px] font-semibold text-[#10393b]">My Dashboard</h1>

        <div class="flex flex-col items-stretch md:items-end gap-3 w-full md:w-auto">
          <!-- Notifications and info icons (only desktop) -->
          <div
            class="hidden md:flex items-center gap-2 px-4 py-2 rounded-full"
            style="background-color: #10393b"
          >
            <button class="text-white">
              <Icon icon="mdi:bell-outline" class="w-5 h-5" />
            </button>
            <button class="text-white">
              <Icon icon="mdi:information-outline" class="w-5 h-5" />
            </button>
          </div>

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

    <!-- Modals -->
    <AddVehicleModal v-model:open="addVehicleOpen" />
  </div>
</template>
