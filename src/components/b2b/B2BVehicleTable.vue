<script setup lang="ts">
import B2BVehicleRow from './B2BVehicleRow.vue'
import type { Vehicle } from '@/components/dashboard/vehicle.types'

defineProps<{
  vehicles: Vehicle[]
}>()
</script>

<template>
  <div class="overflow-x-auto rounded-[5px] border border-green-gray">
    <Table>
      <!-- HEADER -->
      <TableHeader>
        <TableRow
          style="background-color: #01B990; height: 40px"
          
        >
          <TableHead class="px-3 text-white text-[18px] leading-normal not-italic font-normal">Kennzeichen</TableHead>
          <TableHead class="px-3 text-white text-[18px] leading-normal not-italic font-normal">Modell</TableHead>
          <TableHead class="px-3 text-white text-[18px] leading-normal not-italic font-normal">Leasingende</TableHead>
          <TableHead class="px-3 text-white text-[18px] leading-normal not-italic font-normal">Rückgabestart</TableHead>

          <!-- ✅ NEW COLUMN -->
          <TableHead class="px-3 text-white text-[18px] leading-normal not-italic font-normal">Status</TableHead>

          <TableHead class="px-3 text-white text-[18px] leading-normal not-italic font-normal">Fahrzeugnutzer</TableHead>
          <TableHead class="px-3 text-left text-white text-[18px] leading-normal not-italic font-normal">Optionen</TableHead>
        </TableRow>
      </TableHeader>

      <!-- BODY -->
      <TableBody>
        <B2BVehicleRow
          v-for="vehicle in vehicles"
          :key="vehicle.id"
          :vehicle="vehicle"
        />
      </TableBody>
    </Table>
  </div>
</template>