<script setup lang="ts">
import { ref } from "vue";
import { Icon } from "@iconify/vue";
import DdfExpanded from "./DdfExpanded.vue";
import type { Vehicle } from "./vehicle.types";

defineProps<{ vehicle: Vehicle }>();
const expanded = ref(false);
</script>

<template>
  <TableRow
    class="border-b border-green-gray hover:bg-transparent"
    style="background-color: #fafafa; height: 40px"
  >
    <TableCell
      class="h-[40px] truncate px-3 text-[13px] font-medium text-custom-black"
    >
      {{ vehicle.licensePlate }}
    </TableCell>
    <TableCell class="h-[40px] truncate px-3 text-[13px] text-custom-black">
      {{ vehicle.brand }} {{ vehicle.model }}
    </TableCell>
    <TableCell class="h-[40px] w-[130px] px-3 text-[13px] text-custom-black">
      {{ vehicle.leaseEnd }}
    </TableCell>
    <TableCell class="h-[40px] w-[130px] px-3 text-[13px] text-custom-black">
      {{ vehicle.returnStart }}
    </TableCell>
    <TableCell
      class="h-[40px] w-[180px] truncate px-3 text-[13px] text-custom-black"
    >
      {{ vehicle.driver || "N/A" }}
    </TableCell>
    <TableCell class="h-[40px] w-[130px] px-3">
      <div class="flex items-center justify-end gap-3">
        <!-- Play icon — teal for active, grey for completed -->
        <button class="transition-opacity hover:opacity-70">
          <Icon
            icon="mdi:play"
            class="size-4"
            :style="vehicle.completed ? 'color:#B7C2C2' : 'color:#01B990'"
          />
        </button>

        <!-- Notification badge — only when vehicle has notifications -->
        <div
          v-if="vehicle.notifications"
          class="flex size-[19px] items-center justify-center rounded-full text-[13px] font-bold text-white"
          style="background-color: #ef8450"
        >
          {{ vehicle.notifications }}
        </div>

        <!-- Archive icon -->
        <button class="transition-opacity hover:opacity-70">
          <Icon
            icon="mdi:archive-outline"
            class="size-[18px]"
            style="color: #2e3e3f"
          />
        </button>

        <!-- Caret — rotates when expanded; all rows show it, only active rows toggle -->
        <button
          class="transition-transform"
          :class="expanded ? 'rotate-180' : ''"
          @click="vehicle.completed ? null : (expanded = !expanded)"
        >
          <Icon icon="mdi:chevron-down" class="size-4" style="color: #2e3e3f" />
        </button>
      </div>
    </TableCell>
  </TableRow>
  <DdfExpanded v-if="expanded && !vehicle.completed" :vehicle="vehicle" />
</template>
