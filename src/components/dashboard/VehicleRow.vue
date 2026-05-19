<script setup lang="ts">
import { ref, computed } from "vue";
import { Icon } from "@iconify/vue";
import DdfExpanded from "./DdfExpanded.vue";
import type { Vehicle } from "./vehicle.types";

const props = defineProps<{ vehicle: Vehicle }>();

const emit = defineEmits<{
  select: [vehicle: Vehicle | null];
}>();

const expanded = ref(false);

const iconClasses = computed(() => [
  "text-[40px] text-primary transition-transform duration-200",
]);

function toggleExpand() {
  if (props.vehicle.completed) return;
  expanded.value = !expanded.value;
  emit("select", expanded.value ? props.vehicle : null);
}
</script>

<template>
  <TableRow
    class="border-b border-green-gray hover:bg-transparent"
    style="background-color: #fafafa; height: 40px"
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
          :class="expanded ? 'rotate-180' : ''"
          @click="toggleExpand"
        >
          <Icon icon="ic:round-arrow-drop-down" :class="iconClasses" />
        </button>
      </div>
    </TableCell>
  </TableRow>
  <DdfExpanded v-if="expanded && !vehicle.completed" :vehicle="vehicle" />
</template>
