<script setup lang="ts">
import VehicleRow from './VehicleRow.vue'
import type { Vehicle } from './vehicle.types'

defineProps<{
  vehicles: Vehicle[]
  completedVehicles: Vehicle[]
}>()
</script>

<template>
  <div class="rounded-[5px] border border-green-gray overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow
          style="background-color: #01B990; height: 40px"
        >
          <TableHead class=" px-3 text-[18px  font-normal text-white">Kennzeichen</TableHead>
          <TableHead class=" px-3 text-[18px] font-normal text-white">Modell</TableHead>
          <TableHead class="  px-3 text-[18px] font-normal text-white">Leasingende</TableHead>
          <TableHead class="  px-3 text-[18px] font-normal text-white">Rückgabestart</TableHead>
          <TableHead class="  px-3 text-[18px] font-normal text-white">Fahrzeugnutzer</TableHead>
          <TableHead class="  px-3 text-left text-[18px] font-normal text-white">Optionen</TableHead>
        </TableRow>
      </TableHeader>

      
      <TableBody>
        <VehicleRow
          v-for="vehicle in vehicles"
          :key="vehicle.id"
          :vehicle="vehicle"
        />
        <TableRow
          v-if="completedVehicles.length"
          class="border-0 hover:bg-transparent"
          style="background-color: #01B990; height: 40px"
        >
          <TableCell colspan="6" class="h-[40px] px-3 text-[13px] font-bold text-white">
            Abgeschlossene Vorgänge
          </TableCell>
        </TableRow>
        <VehicleRow
          v-for="vehicle in completedVehicles"
          :key="vehicle.id"
          :vehicle="vehicle"
        />
      </TableBody>
    </Table>
  </div>
</template>
