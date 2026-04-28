<script setup lang="ts">
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import VehicleTable from "@/components/dashboard/VehicleTable.vue";
import AddVehicleModal from "@/components/dashboard/modals/AddVehicleModal.vue";
import { useAuthStore } from "@/stores/auth.store";
import { useVehicleStore } from "@/stores/vehicle.store";
import { Icon } from "@iconify/vue";

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
      <h1 class="text-[22px] font-normal leading-normal not-italic text-primary">My Dashboard</h1>
      <div class="flex items-center gap-4">
        <button
          class="rounded-[5px] px-6 py-2 text-sm font-bold bg-custom-orange text-white cursor-pointer transition-opacity hover:opacity-90"
        >
          Rückgabeprozess starten
        </button>
        <div  @click="addVehicleOpen = true" class="flex items-center gap-2 ">
        
          <Icon icon="ic:baseline-plus" class=" w-8 h-8 text-custom-orange cursor-pointer" />
      </div>
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
