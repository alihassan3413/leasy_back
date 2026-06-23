<script setup lang="ts">
import { ref } from "vue";
import { Icon } from "@iconify/vue";
import AdminVehicleExpanded from "./AdminVehicleExpanded.vue";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface VehicleData {
  id: number;
  company: string;
  licensePlate: string;
  model: string;
  date1: string;
  location: string;
  date2: string;
  person: string;
}

const mockVehicles = ref<VehicleData[]>([
  {
    id: 1,
    company: "Fujitsu",
    licensePlate: "D-HI 4404",
    model: "VW Polo",
    date1: "12.06.2025",
    location: "ATU Lüneburg",
    date2: "20.12.2025",
    person: "Marcus Dietrich",
  },
  {
    id: 2,
    company: "Fujitsu",
    licensePlate: "D-HI 4404",
    model: "VW Polo",
    date1: "12.06.2025",
    location: "ATU Lüneburg",
    date2: "20.12.2025",
    person: "Marcus Dietrich",
  },
  {
    id: 3,
    company: "Fujitsu",
    licensePlate: "D-HI 4404",
    model: "VW Polo",
    date1: "12.06.2025",
    location: "ATU Lüneburg",
    date2: "20.12.2025",
    person: "Marcus Dietrich",
  },
  {
    id: 4,
    company: "Fujitsu",
    licensePlate: "D-HI 4404",
    model: "VW Polo",
    date1: "12.06.2025",
    location: "ATU Lüneburg",
    date2: "20.12.2025",
    person: "Marcus Dietrich",
  },
]);

const expandedRows = ref<number[]>([]);

const toggleRow = (id: number) => {
  const index = expandedRows.value.indexOf(id);
  if (index > -1) {
    expandedRows.value.splice(index, 1);
  } else {
    expandedRows.value.push(id);
  }
};
</script>

<template>
  <div class="overflow-x-auto rounded-[5px] border border-[#D9E2E2]">
    <Table>
      <TableHeader>
        <TableRow
          class="bg-custom-green hover:bg-custom-green border-none h-10"
        >
          <TableHead class="text-white font-normal text-[14px] px-4">
            <div class="flex items-center gap-1">
              Firma / Logo
              <Icon icon="mdi:chevron-down" class="size-4" />
            </div>
          </TableHead>
          <TableHead class="text-white font-normal text-[14px] px-4">
            <div class="flex items-center gap-1">
              Kennzeichen
              <Icon icon="mdi:chevron-down" class="size-4" />
            </div>
          </TableHead>
          <TableHead class="text-white font-normal text-[14px] px-4"
            >Marke/Modell</TableHead
          >
          <TableHead class="text-white font-normal text-[14px] px-4"
            >Rückgabestart</TableHead
          >
          <TableHead class="text-white font-normal text-[14px] px-4"
            >Werkstatt</TableHead
          >
          <TableHead class="text-white font-normal text-[14px] px-4"
            >Dekra Datum</TableHead
          >
          <TableHead class="text-white font-normal text-[14px] px-4"
            >Zugewiesen/Nutzer</TableHead
          >
          <TableHead
            class="text-white font-normal text-[14px] px-4 text-right"
          ></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-for="vehicle in mockVehicles" :key="vehicle.id">
          <TableRow
            class="border-b border-[#D9E2E2] hover:bg-gray-50 bg-[#FAFAFA]"
          >
            <!-- Company with Dropdown -->
            <TableCell class="py-3 px-4">
              <div class="flex items-center gap-2">
                <span class="text-[14px] text-[#2E3E3F]">{{
                  vehicle.company
                }}</span>
                <Icon icon="mdi:chevron-down" class="size-4 text-[#2E3E3F]" />
              </div>
            </TableCell>

            <!-- License Plate with Dropdown -->
            <TableCell class="py-3 px-4">
              <div class="flex items-center gap-2">
                <span class="text-[14px] text-[#2E3E3F]">{{
                  vehicle.licensePlate
                }}</span>
                <Icon icon="mdi:chevron-down" class="size-4 text-[#2E3E3F]" />
              </div>
            </TableCell>

            <!-- Model -->
            <TableCell class="py-3 px-4">
              <span class="text-[14px] text-[#2E3E3F]">{{
                vehicle.model
              }}</span>
            </TableCell>

            <!-- Date 1 -->
            <TableCell class="py-3 px-4">
              <span class="text-[14px] text-[#2E3E3F]">{{
                vehicle.date1
              }}</span>
            </TableCell>

            <!-- Location -->
            <TableCell class="py-3 px-4">
              <span class="text-[14px] text-[#2E3E3F]">{{
                vehicle.location
              }}</span>
            </TableCell>

            <!-- Date 2 -->
            <TableCell class="py-3 px-4">
              <span class="text-[14px] text-[#2E3E3F]">{{
                vehicle.date2
              }}</span>
            </TableCell>

            <!-- Person -->
            <TableCell class="py-3 px-4">
              <span class="text-[14px] text-[#2E3E3F]">{{
                vehicle.person
              }}</span>
            </TableCell>

            <!-- Options -->
            <TableCell class="py-3 px-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button class="hover:opacity-70 transition-opacity">
                  <Icon icon="mdi:cog-outline" class="size-5 text-[#2E3E3F]" />
                </button>
                <button
                  @click="toggleRow(vehicle.id)"
                  class="hover:opacity-70 transition-opacity"
                  :class="{ 'rotate-180': expandedRows.includes(vehicle.id) }"
                >
                  <Icon icon="mdi:chevron-down" class="size-5 text-[#2E3E3F]" />
                </button>
              </div>
            </TableCell>
          </TableRow>

          <!-- Expanded Row -->
          <AdminVehicleExpanded
            v-if="expandedRows.includes(vehicle.id)"
            :vehicle="vehicle"
          />
        </template>
      </TableBody>
    </Table>
  </div>
</template>
