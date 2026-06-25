<script setup lang="ts">
import { computed, ref } from "vue";
import { Icon } from "@iconify/vue";
import type { Vehicle } from "../dashboard/vehicle.types";
import B2bDdfExpanded from "./b2bDdfExpanded.vue";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import OrderCreationModal from "../dashboard/modals/OrderCreationModal.vue";
import { useB2BVehicleStore } from "@/stores/b2bVehicle.store";
import { useAuthStore } from "@/stores/auth.store";
import { getVehicleStatusLabel } from "@/lib/status";

const props = defineProps<{
  vehicle: Vehicle;
  isExpanded: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
}>();

const b2bVehicleStore = useB2BVehicleStore();
const authStore = useAuthStore();

function handleClick() {
  if (props.vehicle.completed) return;
  emit("toggle");
}

// Status is driven by the same order check as the play button / "Start Process":
// no order yet → "Eingeplant" (ready to start), otherwise the real order status.
const vehicleStatus = computed(() => {
  const orders = props.vehicle.orders;

  if (!orders?.length) {
    return { label: "Eingeplant", dotColor: "#ef8450" };
  }

  return {
    label: getVehicleStatusLabel(orders[0].order_status).label,
    dotColor: "#01B990",
  };
});

const iconClasses = computed(() => ["text-[32px] text-gray-400 transition-transform duration-200"]);

const activeAction = ref<string | null>(null);
const orderModalOpen = ref(false);

// "Start Process" creates the first order for a vehicle, so it only applies to
// vehicles that have not started a process yet (no existing order).
const canStartProcess = computed(() => !props.vehicle.orders?.length);

async function handleOrderSuccess() {
  if (authStore.user?.id) {
    await b2bVehicleStore.fetchVehicles(authStore.user.id);
  }
}

function handleAction(action: string) {
  activeAction.value = action;
  if (action === "Start Process") {
    orderModalOpen.value = true;
  }
}
</script>

<template>
  <TableRow
    class="border-b border-[#f0f5f5] cursor-pointer"
    style="height: 52px"
    :class="isExpanded ? 'bg-gray-50' : 'bg-white'"
    @click="handleClick"
  >
    <TableCell class="h-[52px] truncate px-4 text-[14px] font-medium text-gray-700">
      {{ vehicle.licensePlate }}
    </TableCell>
    <TableCell class="h-[52px] truncate px-4 text-[14px] text-gray-600">
      {{ vehicle.brand }} {{ vehicle.model }}
    </TableCell>
    <TableCell class="h-[52px] px-4 text-[14px] text-gray-600">
      {{ vehicle.leaseEnd }}
    </TableCell>
    <TableCell class="h-[52px] px-4 text-[14px] text-gray-600">
      {{ vehicle.returnStart }}
    </TableCell>
    <TableCell class="h-[52px] px-4">
      <div class="flex items-center gap-2">
        <span
          class="w-3 h-3 rounded-full"
          :style="{ backgroundColor: vehicleStatus.dotColor }"
        ></span>
        <span class="text-[14px] text-gray-600">{{ vehicleStatus.label }}</span>
      </div>
    </TableCell>
    <TableCell class="h-[52px] truncate px-4 text-[14px] text-gray-600">
      {{ vehicle.driver || "N/A" }}
    </TableCell>
    <TableCell class="h-[52px] px-4 text-right">
      <div class="flex items-center justify-end gap-1">
        <!-- Start Process button -->
        <button
          v-if="canStartProcess"
          @click.stop="handleAction('Start Process')"
          class="transition-opacity hover:opacity-70 hover:bg-orange-50 p-1 rounded"
        >
          <Icon icon="solar:play-bold" class="w-5 h-5" style="color: rgb(239, 132, 80)" />
        </button>
        <!-- Three dots menu — only relevant while the process can be started
             (its sole action is "Vorgang starten"). Hide it once an order exists. -->
        <DropdownMenu v-if="canStartProcess">
          <DropdownMenuTrigger as-child>
            <button
              class="transition-opacity hover:opacity-70 hover:bg-gray-100 p-1 rounded"
              @click.stop
            >
              <Icon icon="mdi:dots-vertical" class="w-5 h-5 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-56 rounded-xl shadow-lg border border-gray-100">
            <DropdownMenuItem
              v-if="canStartProcess"
              @click="handleAction('Start Process')"
              class="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
              :class="{ 'bg-gray-100': activeAction === 'Start Process' }"
            >
              <Icon icon="solar:play-bold" class="w-6 h-6 text-gray-600" />
              <span class="text-gray-800 font-medium">Vorgang starten</span>
            </DropdownMenuItem>
            <!-- <DropdownMenuItem
              @click="handleAction('Assign Someone')"
              class="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
              :class="{ 'bg-gray-100': activeAction === 'Assign Someone' }"
            >
              <Icon
                icon="mdi:account-plus-outline"
                class="w-6 h-6 text-gray-600"
              />
              <span class="text-gray-800 font-medium">Assign Someone</span>
            </DropdownMenuItem> -->
            <!-- <DropdownMenuItem
              @click="handleAction('Archive')"
              class="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
              :class="{ 'bg-gray-100': activeAction === 'Archive' }"
            >
              <Icon icon="mdi:archive-outline" class="w-6 h-6 text-gray-600" />
              <span class="text-gray-800 font-medium">Archive</span>
            </DropdownMenuItem> -->
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- Caret — rotates when expanded -->
        <button
          class="transition-transform focus:outline-none"
          :class="isExpanded ? 'rotate-180' : ''"
        >
          <Icon icon="ic:round-arrow-drop-down" :class="iconClasses" />
        </button>
      </div>
    </TableCell>
  </TableRow>
  <B2bDdfExpanded v-if="isExpanded && !vehicle.completed" :vehicle="vehicle" />
  <OrderCreationModal
    v-model:open="orderModalOpen"
    :vehicle="vehicle"
    @success="handleOrderSuccess"
  />
</template>
