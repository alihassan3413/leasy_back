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
  <div class="flex flex-col gap-5">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <h1
        class="text-[22px] font-normal leading-normal not-italic text-primary"
      >
        My Dashboard
      </h1>
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
          <Icon
            icon="ic:baseline-plus"
            class="w-8 h-8 text-custom-orange cursor-pointer"
          />
        </div>
      </div>
    </div>

    <!-- Vehicle table -->
    <div v-if="isLoading" class="flex justify-center py-10">
      <!-- Simple loading state -->
      <p>Laden...</p>
    </div>
    <B2BVehicleTable v-else :vehicles="vehicles" @select="selectedVehicle = $event" />

    <AddVehicleModal v-model:open="addVehicleOpen" />
    <OrderCreationModal v-model:open="orderModalOpen" :vehicle="selectedVehicle" @success="b2bVehicleStore.fetchVehicles(authStore.user!.id)" />
  </div>
</template>
