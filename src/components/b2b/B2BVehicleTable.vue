<script setup lang="ts">
import { ref } from "vue";
import { Icon } from "@iconify/vue";
import B2BVehicleRow from "./B2BVehicleRow.vue";
import B2bDdfExpanded from "./b2bDdfExpanded.vue";
import OrderCreationModal from "../dashboard/modals/OrderCreationModal.vue";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useB2BVehicleStore } from "@/stores/b2bVehicle.store";
import { useAuthStore } from "@/stores/auth.store";
import { getVehicleStatusLabel } from "@/lib/status";
import type { Vehicle } from "@/components/dashboard/vehicle.types";

defineProps<{
  vehicles: Vehicle[];
}>();

const emit = defineEmits<{
  select: [vehicle: Vehicle | null];
}>();

const b2bVehicleStore = useB2BVehicleStore();
const authStore = useAuthStore();

const expandedId = ref<string | null>(null);
const orderModalOpen = ref(false);
const selectedVehicleForOrder = ref<Vehicle | null>(null);

function handleToggle(vehicle: Vehicle) {
  if (expandedId.value === vehicle.id) {
    expandedId.value = null;
    emit("select", null);
  } else {
    expandedId.value = vehicle.id;
    emit("select", vehicle);
  }
}

// Same status logic as the row / "Vorgang starten": no order yet → "Eingeplant"
// (ready to start), otherwise the real order status.
function getVehicleStatus(vehicle: Vehicle) {
  if (!vehicle.orders?.length) {
    return { label: "Eingeplant", dotColor: "#ef8450" };
  }

  return {
    label: getVehicleStatusLabel(vehicle.orders[0].order_status).label,
    dotColor: "#01B990",
  };
}

async function handleOrderSuccess() {
  if (authStore.user?.id) {
    await b2bVehicleStore.fetchVehicles(authStore.user.id);
  }
}

function handleCardAction(vehicle: Vehicle, action: string) {
  if (action === "Start Process") {
    selectedVehicleForOrder.value = vehicle;
    orderModalOpen.value = true;
  }
}
</script>

<template>
  <!-- Desktop: Table view -->
  <div class="hidden md:block rounded-[12px] overflow-hidden border border-gray-100 shadow-sm">
    <Table>
      <TableHeader>
        <TableRow style="background-color: #01b990; height: 44px">
          <TableHead class="px-4 text-[13px] font-medium text-white">Kennzeichen</TableHead>
          <TableHead class="px-4 text-[13px] font-medium text-white">Modell</TableHead>
          <TableHead class="px-4 text-[13px] font-medium text-white">Leasingende</TableHead>
          <TableHead class="px-4 text-[13px] font-medium text-white">Rückgabestart</TableHead>
          <TableHead class="px-4 text-[13px] font-medium text-white">Status</TableHead>
          <!-- Fahrzeugnutzer column hidden for now -->
          <!-- <TableHead class="px-4 text-[13px] font-medium text-white">Fahrzeugnutzer</TableHead> -->
          <TableHead class="px-4 text-[13px] font-medium text-white text-right">Optionen</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        <B2BVehicleRow
          v-for="vehicle in vehicles"
          :key="vehicle.id"
          :vehicle="vehicle"
          :is-expanded="expandedId === vehicle.id"
          @toggle="handleToggle(vehicle)"
        />
      </TableBody>
    </Table>
  </div>

  <!-- Mobile: Card view -->
  <div class="md:hidden space-y-4">
    <div
      v-for="vehicle in vehicles"
      :key="vehicle.id"
      class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div
        class="p-4 cursor-pointer"
        :class="expandedId === vehicle.id ? 'bg-gray-50' : ''"
        @click="handleToggle(vehicle)"
      >
        <div class="flex items-start justify-between">
          <div class="flex flex-col gap-1">
            <span class="text-[16px] font-bold text-[#10393b]">{{ vehicle.licensePlate }}</span>
            <span class="text-[14px] text-gray-600">{{ vehicle.brand }} {{ vehicle.model }}</span>
          </div>
          <div class="flex items-center gap-1">
            <span
              class="w-3 h-3 rounded-full"
              :style="{ backgroundColor: getVehicleStatus(vehicle).dotColor }"
            ></span>
            <span class="text-[12px] text-gray-600 ml-1">{{
              getVehicleStatus(vehicle).label
            }}</span>
            <button
              class="transition-transform focus:outline-none ml-1"
              :class="expandedId === vehicle.id ? 'rotate-180' : ''"
            >
              <Icon icon="ic:round-arrow-drop-down" class="text-[24px] text-gray-400" />
            </button>
          </div>
        </div>
        <div class="mt-3 flex flex-wrap gap-3 text-[12px] text-gray-500">
          <div class="flex items-center gap-1">
            <Icon icon="mdi:calendar-outline" class="w-4 h-4" />
            <span>Leasingende: {{ vehicle.leaseEnd }}</span>
          </div>
          <div class="flex items-center gap-1">
            <Icon icon="mdi:calendar-outline" class="w-4 h-4" />
            <span>Rückgabestart: {{ vehicle.returnStart }}</span>
          </div>
          <!-- Fahrzeugnutzer hidden for now -->
          <!-- <div class="flex items-center gap-1">
            <Icon icon="mdi:account-outline" class="w-4 h-4" />
            <span>Fahrzeugnutzer: {{ vehicle.driver || "N/A" }}</span>
          </div> -->
        </div>
      </div>

      <!-- Expanded detail -->
      <B2bDdfExpanded v-if="expandedId === vehicle.id && !vehicle.completed" :vehicle="vehicle" />

      <!-- Mobile actions — "Vorgang starten" only applies to vehicles without an existing order -->
      <div
        v-if="!vehicle.orders?.length"
        class="flex items-center justify-between px-4 py-3 border-t border-gray-100"
      >
        <button
          @click.stop="handleCardAction(vehicle, 'Start Process')"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-white font-medium"
          style="background-color: #ef8450"
        >
          <Icon icon="solar:play-bold" class="w-5 h-5" />
          <span class="text-[14px]">Vorgang starten</span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button
              class="transition-opacity hover:opacity-70 hover:bg-gray-100 p-2 rounded-lg"
              @click.stop
            >
              <Icon icon="mdi:dots-vertical" class="w-6 h-6 text-gray-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-56 rounded-xl shadow-lg border border-gray-100">
            <DropdownMenuItem
              @click.stop="handleCardAction(vehicle, 'Start Process')"
              class="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
            >
              <Icon icon="solar:play-bold" class="w-6 h-6 text-gray-600" />
              <span class="text-gray-800 font-medium">Vorgang starten</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </div>

  <!-- Order Modal (mobile) -->
  <OrderCreationModal
    v-model:open="orderModalOpen"
    :vehicle="selectedVehicleForOrder"
    @success="handleOrderSuccess"
  />
</template>
