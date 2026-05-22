<script setup lang="ts">
import { computed } from "vue";
import { Icon } from "@iconify/vue";
import DdfExpanded from "./DdfExpanded.vue";
import type { Vehicle } from "./vehicle.types";

const props = defineProps<{
   vehicle: Vehicle
   isExpanded: boolean
  }>();

const emit = defineEmits<{
  toggle: []
}>();
function handleClick() {
  if (props.vehicle.completed) return
  emit('toggle')
}

const iconClasses = computed(() => [
  "text-[40px] text-primary transition-transform duration-200",
]);



</script>

<template>
  <TableRow
    class="border-b border-green-gray cursor-pointer"
    style="height: 40px"
    :class="isExpanded ? 'bg-gray-200' : 'bg-white'"
    @click="handleClick"
  >
    <TableCell
      class="h-[40px] truncate px-3 text-[16px] font-medium text-custom-black"
    >
      {{ vehicle.licensePlate }}
    </TableCell>
    <TableCell class="h-[40px] truncate px-3 text-[16px] text-custom-black">
      {{ vehicle.brand }} {{ vehicle.model }}
    </TableCell>
    <TableCell class="h-[40px] w-[160px] px-3 text-[16px] text-custom-black">
      {{ vehicle.leaseEnd }}
    </TableCell>
    <TableCell class="h-[40px] w-[130px] px-3 text-[16px] text-custom-black">
      {{ vehicle.returnStart }}
    </TableCell>
    <TableCell
      class="h-[40px] w-[180px] truncate px-3 text-[16px] text-custom-black"
    >
      {{ vehicle.driver || "N/A" }}
    </TableCell>
    <TableCell class="h-[40px] w-[180px] px-3">
      <div class="flex items-center justify-start gap-4">
        <!-- Play icon -->
        <button class="transition-opacity hover:opacity-70">
          <Icon
            icon="solar:play-bold"
            class="size-6 text-custom-green"
            :style="vehicle.completed ? 'color: #B7C2C2' : '#01B990'"
          />
        </button>

        <!-- Notification badge -->
        <div
          v-if="vehicle.notifications"
          class="flex size-[19px] items-center justify-center rounded-full bg-custom-orange text-[13px] font-bold text-white"
        >
          {{ vehicle.notifications }}
        </div>

        <!-- Archive icon -->
        <button class="transition-opacity hover:opacity-70">
          <Icon
            icon="mdi:archive-outline"
            class="size-[24px]"
            style="color: #2e3e3f"
          />
        </button>

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
  <DdfExpanded v-if="isExpanded && !vehicle.completed" :vehicle="vehicle" />
</template>
