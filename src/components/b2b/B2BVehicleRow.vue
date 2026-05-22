<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { Vehicle } from '@/components/dashboard/vehicle.types'
import B2bDdfExpanded from './b2bDdfExpanded.vue';

const props = defineProps<{
   vehicle: Vehicle
   isExpanded: boolean
  }>()

const emit = defineEmits<{
  toggle: []
}>()

function handleClick() {
  if (props.vehicle.completed) return
  emit('toggle')
}


const manualStatuses = ["Eingeplant", "Planung", "Erledigt"];

const manualStatus = computed(() => {
  const id = props.vehicle.id || props.vehicle.licensePlate || "";

  const index =
    id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    manualStatuses.length;

  return manualStatuses[index];
});


const iconClasses = computed(() => [
  "text-[40px] text-primary transition-transform duration-200",
]);

console.log(props.vehicle);


function toggleExpand() {
  if (props.vehicle.completed) return
  expanded.value = !expanded.value
  emit('select', expanded.value ? props.vehicle : null)
}
</script>

<template>
  <TableRow
    class="border-b border-green-gray cursor-pointer"
    :class="isExpanded ? 'bg-gray-200' : 'bg-white'"
    style="height: 40px"
    @click="handleClick"
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
      
      
     <div class="flex items-center gap-2">
    <span
      class="size-2.5 rounded-full"
      :class="{
        'bg-[#EA7A55]': manualStatus === 'Eingeplant',
        'bg-[#8FA1A1]': manualStatus === 'Planung',
        'bg-[#2FC59A]': manualStatus === 'Erledigt',
      }"
    />
    <span class="font-bold text-[#10393B]">
      {{ manualStatus }}
    </span>
  </div>
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
          :class="isExpanded ? 'rotate-180' : ''"  
        >
          <Icon icon="ic:round-arrow-drop-down" :class="iconClasses" />
        </button>
      </div>
    </TableCell>
  </TableRow>
  <B2bDdfExpanded v-if="isExpanded" :vehicle="vehicle" />
</template>