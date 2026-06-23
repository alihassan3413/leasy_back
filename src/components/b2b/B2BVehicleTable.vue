<script setup lang="ts">
import B2BVehicleRow from './B2BVehicleRow.vue'
import type { Vehicle } from '@/components/dashboard/vehicle.types'

defineProps<{
  vehicles: Vehicle[]
}>()

const emit = defineEmits<{
  select: [vehicle: Vehicle | null]
}>()

const expandedId = ref<string | null>(null)

function handleToggle(vehicle: Vehicle) {
  if (expandedId.value === vehicle.id) {
    expandedId.value = null
    emit('select', null)
  } else {
    expandedId.value = vehicle.id
    emit('select', vehicle)
  }
}
</script>

<template>
  <div class="rounded-[12px] overflow-hidden border border-gray-100 shadow-sm">
    <Table>
      <TableHeader>
        <TableRow
          style="background-color: #01B990; height: 44px"
        >
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
</template>