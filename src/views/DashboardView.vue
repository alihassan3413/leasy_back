<script setup lang="ts">
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import VehicleTable from "@/components/dashboard/VehicleTable.vue";
import AddVehicleModal from "@/components/dashboard/modals/AddVehicleModal.vue";
import { useAuthStore } from "@/stores/auth.store";
import { useVehicleStore } from "@/stores/vehicle.store";

const authStore = useAuthStore();
const vehicleStore = useVehicleStore();
const { vehicles, completedVehicles, isLoading } = storeToRefs(vehicleStore);

const addVehicleOpen = ref(false);

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
      <h1 class="text-2xl font-bold text-custom-black">My Dashboard</h1>
      <div class="flex items-center gap-2">
        <button
          class="rounded-[5px] px-4 py-1.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          style="background-color: #ef8450"
        >
          Rückgabeprozess starten
        </button>
        <button
          class="flex size-8 items-center justify-center rounded-[5px] text-white transition-opacity hover:opacity-90"
          style="background-color: #ef8450"
          @click="addVehicleOpen = true"
        >
          <span class="text-lg font-bold leading-none">+</span>
        </button>
      </div>
    </div>

    <!-- Vehicle table -->
    <VehicleTable
      :vehicles="vehicles"
      :completed-vehicles="completedVehicles"
    />

    <!-- Modals -->
    <AddVehicleModal v-model:open="addVehicleOpen" />
  </div>
</template>
