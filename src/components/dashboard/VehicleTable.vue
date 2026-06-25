<script setup lang="ts">
import VehicleRow from "./VehicleRow.vue";
import DdfExpanded from "./DdfExpanded.vue";
import OrderCreationModal from "./modals/OrderCreationModal.vue";
import type { Vehicle } from "./vehicle.types";
import { ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useVehicleStore } from "@/stores/vehicle.store";
import { useAuthStore } from "@/stores/auth.store";
import { getVehicleStatusLabel } from "@/lib/status";

// Status is driven by the same order check as the play button: no order yet →
// "Eingeplant" (ready to start), otherwise the real order status.
function getVehicleStatus(vehicle: Vehicle) {
  if (!vehicle.orders?.length) {
    return { label: "Eingeplant", dotColor: "#ef8450" };
  }

  return {
    label: getVehicleStatusLabel(vehicle.orders[0].order_status).label,
    dotColor: "#01B990",
  };
}

const props = defineProps<{
  vehicles: Vehicle[];
  completedVehicles: Vehicle[];
}>();

const emit = defineEmits<{
  select: [vehicle: Vehicle | null];
}>();

const authStore = useAuthStore();
const vehicleStore = useVehicleStore();

const expandedId = ref<string | null>(null);
const activeAction = ref<{ id: string; action: string } | null>(null);
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

watch(
  () => props.vehicles,
  (newVehicles) => {
    if (newVehicles.length > 0 && !expandedId.value) {
      expandedId.value = newVehicles[0].id;
      emit("select", newVehicles[0]);
    }
  },
  { immediate: true },
);

async function handleOrderSuccess() {
  if (authStore.user?.id) {
    await vehicleStore.fetchVehicles(authStore.user.id);
  }
}

function handleCardAction(vehicle: Vehicle, action: string) {
  activeAction.value = { id: vehicle.id, action };
  if (action === "Start Process") {
    selectedVehicleForOrder.value = vehicle;
    orderModalOpen.value = true;
  }
}
</script>

<template>
  <!-- Desktop: Table view for desktop -->
  <div class="hidden md:block rounded-[12px] overflow-hidden border border-gray-100 shadow-sm">
    <Table>
      <TableHeader>
        <TableRow style="background-color: #01b990; height: 44px">
          <TableHead class="px-4 text-[13px] font-medium text-white">Kennzeichen</TableHead>
          <TableHead class="px-4 text-[13px] font-medium text-white">Modell</TableHead>
          <TableHead class="px-4 text-[13px] font-medium text-white">Leasingende</TableHead>
          <TableHead class="px-4 text-[13px] font-medium text-white">Rückgabestart</TableHead>
          <TableHead class="px-4 text-[13px] font-medium text-white">Status</TableHead>
          <TableHead class="px-4 text-[13px] font-medium text-white">Fahrzeugnutzer</TableHead>
          <TableHead class="px-4 text-[13px] font-medium text-white text-right">Optionen</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        <VehicleRow
          v-for="vehicle in vehicles"
          :key="vehicle.id"
          :vehicle="vehicle"
          :is-expanded="expandedId === vehicle.id"
          @toggle="handleToggle(vehicle)"
        />
        <TableRow
          v-if="completedVehicles.length"
          class="border-0 hover:bg-transparent"
          style="background-color: #01b990; height: 44px"
        >
          <TableCell colspan="7" class="h-[44px] px-4 text-[13px] font-bold text-white">
            Abgeschlossene Vorgänge
          </TableCell>
        </TableRow>
        <VehicleRow
          v-for="vehicle in completedVehicles"
          :key="vehicle.id"
          :vehicle="vehicle"
          :is-expanded="expandedId === vehicle.id"
          @toggle="handleToggle(vehicle)"
        />
      </TableBody>
    </Table>
  </div>

  <!-- Mobile: Card view for mobile -->
  <div class="md:hidden space-y-4">
    <!-- Active vehicles -->
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
            <div class="flex items-center gap-2">
              <span class="text-[16px] font-bold text-[#10393b]">{{ vehicle.licensePlate }}</span>
            </div>
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
          <div class="flex items-center gap-1">
            <Icon icon="mdi:account-outline" class="w-4 h-4" />
            <span>Fahrzeugnutzer: {{ vehicle.driver || "Nicht verfügbar" }}</span>
          </div>
        </div>
      </div>
      <!-- Expanded view -->
      <DdfExpanded v-if="expandedId === vehicle.id && !vehicle.completed" :vehicle="vehicle" />
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
            <!-- <DropdownMenuItem @click.stop="handleCardAction(vehicle, 'Assign Someone')"
              class="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50">
              <Icon icon="mdi:account-plus-outline" class="w-6 h-6 text-gray-600" />
              <span class="text-gray-800 font-medium">Assign Someone</span>
            </DropdownMenuItem> -->
            <!-- <DropdownMenuItem @click.stop="handleCardAction(vehicle, 'Archive')"
              class="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50">
              <Icon icon="mdi:archive-outline" class="w-6 h-6 text-gray-600" />
              <span class="text-gray-800 font-medium">Archive</span>
            </DropdownMenuItem> -->
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Completed vehicles header -->
    <div v-if="completedVehicles.length" class="mt-6">
      <div class="flex items-center gap-2 px-4 py-3 rounded-lg" style="background-color: #01b990">
        <span class="text-[14px] font-bold text-white">Abgeschlossene Vorgänge</span>
      </div>
    </div>

    <!-- Completed vehicles -->
    <div
      v-for="vehicle in completedVehicles"
      :key="vehicle.id"
      class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div class="p-4 cursor-pointer" @click="handleToggle(vehicle)">
        <div class="flex items-start justify-between">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <span class="text-[16px] font-bold text-[#10393b]">{{ vehicle.licensePlate }}</span>
            </div>
            <span class="text-[14px] text-gray-600">{{ vehicle.brand }} {{ vehicle.model }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Order Modal -->
  <OrderCreationModal
    v-model:open="orderModalOpen"
    :vehicle="selectedVehicleForOrder"
    @success="handleOrderSuccess"
  />
</template>
