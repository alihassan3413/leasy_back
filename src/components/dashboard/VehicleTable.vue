<script setup lang="ts">
import VehicleRow from "./VehicleRow.vue";
import type { Vehicle } from "./vehicle.types";
import { ref, watch } from "vue";

const props = defineProps<{
  vehicles: Vehicle[];
  completedVehicles: Vehicle[];
}>();

const emit = defineEmits<{
  select: [vehicle: Vehicle | null];
}>();

const expandedId = ref<string | null>(null);

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
</script>

<template>
  <div class="rounded-[12px] overflow-hidden border border-gray-100 shadow-sm">
    <Table>
      <TableHeader>
        <TableRow style="background-color: #01b990; height: 44px">
          <TableHead class="px-4 text-[13px] font-medium text-white"
            >Kennzeichen</TableHead
          >
          <TableHead class="px-4 text-[13px] font-medium text-white"
            >Modell</TableHead
          >
          <TableHead class="px-4 text-[13px] font-medium text-white"
            >Leasingende</TableHead
          >
          <TableHead class="px-4 text-[13px] font-medium text-white"
            >Rückgabestart</TableHead
          >
          <TableHead class="px-4 text-[13px] font-medium text-white"
            >Status</TableHead
          >
          <TableHead class="px-4 text-[13px] font-medium text-white"
            >Fahrzeugnutzer</TableHead
          >
          <TableHead class="px-4 text-[13px] font-medium text-white text-right"
            >Optionen</TableHead
          >
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
          <TableCell
            colspan="7"
            class="h-[44px] px-4 text-[13px] font-bold text-white"
          >
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
</template>
