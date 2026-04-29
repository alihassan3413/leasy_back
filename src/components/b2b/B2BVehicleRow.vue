<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { Vehicle } from '@/components/dashboard/vehicle.types'
import B2bDdfExpanded from './b2bDdfExpanded.vue';

defineProps<{ vehicle: Vehicle }>()

const expanded = ref(false)



const iconClasses = computed(() => [
  "text-[40px] text-primary transition-transform duration-200",
 
]);

</script>

<template>
  <TableRow
    class="border-b border-green-gray hover:bg-transparent"
    style="background-color: #FAFAFA; height: 40px"
  >
    <TableCell class="h-[40px] truncate px-3 text-[16px] font-medium text-custom-black leading-normal not-italic font-normal">
      {{ vehicle.licensePlate }}
    </TableCell>
    <TableCell class="h-[40px] truncate px-3 text-[16px] text-custom-black leading-normal not-italic font-normal">
      {{ vehicle.brand }} {{ vehicle.model }}
    </TableCell>
    <TableCell class="h-[40px] w-[130px] px-3 text-[16px] text-custom-black leading-normal not-italic font-normal">
      {{ vehicle.leaseEnd }}
    </TableCell>
    <TableCell class="h-[40px] w-[130px] px-3 text-[16px] text-custom-black leading-normal not-italic font-normal">
      {{ vehicle.returnStart }}
    </TableCell>
     <TableCell class="h-[40px] w-[160px] truncate px-3 text-[16px] text-custom-black leading-normal not-italic font-normal">
      {{ vehicle.status }}
    </TableCell>
    <TableCell class="h-[40px] w-[180px] truncate px-3 text-[16px] text-custom-black leading-normal not-italic font-normal">
      {{ vehicle.driver }}
    </TableCell>
    <TableCell class="h-[40px] w-[100px] px-3">
      <div class="flex items-center justify-end gap-4">
        <!-- Play icon — teal for active, grey for completed -->
        <button class="transition-opacity hover:opacity-70">
          <Icon
            icon="solar:play-bold"
            class="size-6 text-custom-green"
          />
        </button>

        <!-- Notification badge — only when vehicle has notifications -->
        <div
          v-if="vehicle.notifications"
          class="flex size-[19px] items-center justify-center rounded-full bg-custom-orange text-[13px] font-bold text-white"
          
        >
          {{ vehicle.notifications }}
        </div>
        <!-- Asssign icon -->
        <button class="transition-opacity hover:opacity-70">
          <Icon icon="material-symbols:person-add-outline" class="size-[28px]" style="color:#2E3E3F" />
        </button>

        <!-- Archive icon -->
        <button class="transition-opacity hover:opacity-70">
          <Icon icon="mdi:archive-outline" class="size-[24px]" style="color:#2E3E3F" />
        </button>

        <!-- Caret — rotates when expanded; all rows show it, only active rows toggle -->
        <button
          class="transition-transform focus:outline-none"
          :class="expanded ? 'rotate-180' : ''"
          @click="vehicle.completed ? null : (expanded = !expanded)"
        >
          <Icon icon="ic:round-arrow-drop-down" :class="iconClasses" />
        </button>
      </div>
    </TableCell>
  </TableRow>
  <B2bDdfExpanded v-if="expanded" :vehicle="vehicle" />
</template>