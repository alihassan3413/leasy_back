<script setup lang="ts">
import { ref, onMounted } from "vue";
import { storeToRefs } from "pinia";
import AddVehicleModal from "@/components/dashboard/modals/AddVehicleModal.vue";
import OrderCreationModal from "@/components/dashboard/modals/OrderCreationModal.vue";
import B2BVehicleTable from "@/components/b2b/B2BVehicleTable.vue";
import { useAuthStore } from "@/stores/auth.store";
import { useB2BStore } from "@/stores/b2b.store";
import { useB2BVehicleStore } from "@/stores/b2bVehicle.store";
import { Icon } from "@iconify/vue";
import type { Vehicle } from "@/components/dashboard/vehicle.types";

const authStore = useAuthStore();
const b2bStore = useB2BStore();
const b2bVehicleStore = useB2BVehicleStore();
const { vehicles, isLoading } = storeToRefs(b2bVehicleStore);

const addVehicleOpen = ref(false);
const orderModalOpen = ref(false);
const selectedVehicle = ref<Vehicle | null>(null);

onMounted(async () => {
  if (authStore.user?.id) {
    await b2bVehicleStore.fetchVehicles(authStore.user.id);
  }
});
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Page header -->
    <div class="flex flex-col gap-4 mb-6">
      <div class="flex items-start justify-between">
        <h1 class="text-[28px] font-semibold text-[#10393b]">My Dashboard</h1>

        <div class="flex flex-col items-end gap-3">
          <!-- Notifications and info icons -->
          <!-- <div
            class="flex items-center gap-2 px-4 py-2 rounded-full"
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
            class="flex items-center gap-2 px-5 py-2 rounded-full text-white font-medium"
            style="background-color: #ef8450"
          >
            <Icon icon="ic:baseline-plus" class="w-5 h-5" />
            <span>Neues Fahrzeug anlegen</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading state or table -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <p class="text-gray-500">Laden...</p>
    </div>
    <div v-else class="flex-1 overflow-auto">
      <B2BVehicleTable
        :vehicles="vehicles"
        @select="selectedVehicle = $event"
      />
    </div>

    <!-- Modals -->
    <AddVehicleModal v-model:open="addVehicleOpen" />
    <OrderCreationModal
      v-model:open="orderModalOpen"
      :vehicle="selectedVehicle"
      @success="b2bVehicleStore.fetchVehicles(authStore.user!.id)"
    />
  </div>
</template>
