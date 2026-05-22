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
const orderModalOpen = ref(false);
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
  <div class="flex flex-col gap-5 overflow-hidden">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <h1 class="text-[22px] font-normal leading-normal not-italic text-primary">My Dashboard</h1>
      <div class="flex items-center gap-4">
        <button
          class="rounded-[5px] px-6 py-2 text-sm font-bold text-white transition-opacity"
          :class="selectedVehicle
            ? 'bg-custom-orange cursor-pointer hover:opacity-90'
            : 'bg-[#B7C2C2] cursor-not-allowed opacity-60'"
          :disabled="!selectedVehicle"
          @click="selectedVehicle && (orderModalOpen = true)"
        >
          Rückgabeprozess starten
        </button>
        <div @click="addVehicleOpen = true" class="flex items-center gap-2">
          <Icon icon="ic:baseline-plus" class="w-8 h-8 text-custom-orange cursor-pointer" />
        </div>
      </div>
    </div>

    <!-- Vehicle table -->
    <VehicleTable
      :vehicles="vehicles"
      :completed-vehicles="completedVehicles"
      @select="onVehicleSelect"
    />

    <!-- Modals -->
    <AddVehicleModal v-model:open="addVehicleOpen" />
    <OrderCreationModal v-model:open="orderModalOpen" :vehicle="selectedVehicle" @success="vehicleStore.fetchVehicles(authStore.user!.id)" />
  </div>
</template>
