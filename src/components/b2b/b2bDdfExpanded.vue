<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import type { Vehicle } from '../dashboard/vehicle.types';
import AddVehicleModal from '../dashboard/modals/AddVehicleModal.vue';
import UploadDocumentModal from '../dashboard/modals/UploadDocumentModal.vue';


const props = defineProps<{ vehicle: Vehicle }>()

const editVehicleOpen = ref(false)
const uploadDocsOpen = ref(false)
console.log(props.vehicle);

</script>

<template>
  <TableRow class="border-0 hover:bg-transparent">
    <TableCell colspan="7" class="p-0 max-w-0 overflow-x-auto">
      <!-- 5 panels side by side, each a separate card with gap -->
      <div class="flex gap-2.5 border-t border-green-gray bg-white p-2" style="min-width: max-content">


        <div class="flex max-w-[350px]  shrink-0 flex-col overflow-hidden rounded-[5px] border bg-white"
          style="border-color:#ECECEC">
          <!-- Header -->
          <div class="px-6 py-5">
            <p class="text-[16px] font-bold  text-custom-black leading-tight">
              Status bei: {{ vehicle.workshopName }}
            </p>
          </div>

          <!-- Timeline rows -->
          <div class="flex-1 px-0">
            <div v-for="(entry, i) in vehicle.timeline" :key="i" class="flex items-start">
              <!-- Date column -->
              <div class="w-[100px]  shrink-0 px-3 py-1 text-right">
                <span class="whitespace-pre-line  text-[14px] text-custom-black leading-tight">{{ entry.datetime
                  }}</span>
              </div>

              <!-- Status bar column: dot + line -->
              <div class="relative flex w-[20px] shrink-0 flex-col items-center">
                <!-- Line above dot (not on first) -->
                <div v-if="i > 0" class="w-[2px] flex-1"
                  :style="i >= vehicle.timeline.length - 1 ? 'background:#01B990; min-height:8px' : 'background:#B7C2C2; min-height:8px'" />
                <!-- Dot -->
                <div class="size-[8px] shrink-0 rounded-full"
                  :style="i >= vehicle.timeline.length - 1 ? 'background:#01B990' : 'background:#B7C2C2'" />
                <!-- Line below dot (not on last) -->
                <div v-if="i < vehicle.timeline.length - 1" class="w-[2px] flex-1"
                  style="background:#B7C2C2; min-height:8px" />
              </div>

              <!-- Label column -->
              <div class="min-w-0 flex-1 px-3 py-1">
                <!-- DEKRA entry: show green DEKRA text + address -->
                <template v-if="entry.label === 'DEKRA'">
                  <span class="text-[13px] font-bold" style="color:#01B990">DEKRA</span>
                  <p v-if="entry.sublabel" class="text-[14px] text-wrap font-normal leading-tight"
                    style="color:#2E3E3F">{{ entry.sublabel }}</p>
                </template>
                <!-- Normal entry -->
                <template v-else>
                  <span class="block break-words font-normal text-[14px]" style="color:#2E3E3F">{{ entry.label }}</span>
                </template>
              </div>
            </div>
          </div>

          <div class="h-4" />
        </div>

       
        <!-- Panel 2: Angebote   -->

        <div class="flex w-[360px] shrink-0 flex-col rounded-[5px] border bg-white" style="border-color:#ECECEC">
          <div class="px-6 py-5">
            <p class="text-[16px] font-bold" style="color:#2E3E3F">Angebote</p>
          </div>

          <!-- Offer rows -->
          <div class="flex flex-col gap-3 px-6">
            <div v-for="offer in vehicle.offers" :key="offer.id" class="flex flex-col">
              <!-- Row 1: name + price + radio -->
              <div class="flex items-center justify-between">
                <span class="text-[14px] font-bold" :style="offer.accepted ? 'color:#2E3E3F' : 'color:#B7C2C2'">{{
                  offer.id }} -
                  {{ offer.name }}</span>
                <div class="flex items-center gap-2">
                  <span class="text-[14px]" :style="offer.accepted ? 'color:#2E3E3F' : 'color:#B7C2C2'">{{ offer.cost }}
                    €</span>
                 
                  <div class="flex size-[15px] shrink-0 items-center justify-center rounded-full border"
                    :style="offer.accepted ? 'border-color:#EF8450' : 'border-color:#B7C2C2'">
                    <div v-if="offer.accepted" class="size-[9px] rounded-full" style="background:#EF8450" />
                  </div>
                </div>
              </div>
              <!-- Row 2: address + distance + saving -->
              <div class="flex items-center justify-between">
                <span class="text-[12px]" style="color:#B7C2C2">{{ offer.address }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[12px]" style="color:#B7C2C2">Entferung: {{ offer.distance }}</span>
                <span class="text-[12px]" style="color:#B7C2C2">Ersparnis: {{ offer.saving }}€</span>
              </div>
            </div>
          </div>

          <!-- Accept button -->
          <div class="mt-4 px-6">
            <button class="w-full rounded-[5px] py-2 text-[14px] font-bold" :style="vehicle.offers.some(o => o.accepted)
              ? 'background:#B7C2C2; color:#FAFAFA'
              : 'background:#EF8450; color:#FAFAFA'">
              Kostenpflichtig Annehmen
            </button>
          </div>

          <!-- Accepted offer box -->
          <div class="px-6 pb-5 pt-3">
            <p class="mb-2 text-[14px] font-bold" style="color:#2E3E3F">Angenommenes Angebot</p>
            <div class="flex items-center justify-between rounded-[5px] px-4 py-1.5" style="border: 1px solid #01B990">
              <span class="text-[14px] font-bold" style="color:#2E3E3F">
                {{vehicle.offers.find(o => o.accepted)?.id}} {{vehicle.offers.find(o => o.accepted)?.name}}
              </span>
              <span class="text-[14px] font-bold" style="color:#2E3E3F">
                {{vehicle.offers.find(o => o.accepted)?.cost}} €
              </span>
            </div>
          </div>
        </div>

       
        <!-- Panel 3: Fahrzeug Dokumente   -->

        <div class="relative flex w-[240px] shrink-0 flex-col rounded-[5px] border bg-white"
          style="border-color:#ECECEC">
          <button @click="uploadDocsOpen = true" class="absolute right-3 top-3 transition-opacity hover:opacity-60">
            <Icon icon="mdi:pencil-outline" class="size-5 shrink-0 text-custom-green" />
          </button>
          <div class="px-6 py-8">
            <p class="text-[16px] font-bold text-custom-black">Fahrzeug Dokumente</p>
          </div>

          <div class="flex flex-col gap-3 px-6">
            <div v-for="doc in vehicle.leasingDocuments" :key="doc" class="flex items-center justify-between">
              <span class="text-[14px]" style="color:#2E3E3F">{{ doc }}</span>
              <Icon icon="mdi:file-download-outline" class="size-4 shrink-0" style="color:#01B990" />
            </div>
          </div>

          <div class="px-6 pb-2 pt-10">
            <p class="text-[14px] font-bold" style="color:#2E3E3F">Rückgabe Dokumente</p>
          </div>

          <div class="flex flex-col gap-3 px-6 pb-5">
            <div v-for="doc in vehicle.returnDocuments" :key="doc" class="flex items-center justify-between">
              <span class="text-[14px]" style="color:#2E3E3F">{{ doc }}</span>
              <Icon icon="mdi:file-download-outline" class="size-4 shrink-0" style="color:#01B990" />
            </div>
          </div>
        </div>

        <!-- Panel 4: Fahrzeug Daten  -->
          
        <div class="relative flex w-[190px] shrink-0 flex-col overflow-hidden rounded-[5px] border bg-white"
          style="border-color:#ECECEC">
          <button @click="editVehicleOpen = true" class="absolute right-3 top-3 transition-opacity hover:opacity-60">
            <Icon icon="mdi:pencil-outline" class="size-5 shrink-0" style="color:#01B990" />
          </button>
          <div class="px-5 py-8">
            <p class="text-[16px] font-bold" style="color:#2E3E3F">Fahrzeug Daten</p>
          </div>

          <div class="flex flex-col gap-4 px-5 pb-5">
            <div class="flex flex-col">
              <span class="text-[14px] text-custom-black">Kennzeichen:</span>
              <span class="text-[14px] font-medium" style="color:#2E3E3F">{{ vehicle.licensePlate }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[14px] text-custom-black ">Modell:</span>
              <span class="text-[14px] font-medium" style="color:#2E3E3F">{{ vehicle.brand }} {{ vehicle.model }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[14px] text-custom-black">Kilometerstand:</span>
              <span class="text-[14px] font-medium" style="color:#2E3E3F">{{ vehicle.kilometerstand }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[14px] text-custom-black">Leasinggeber:</span>
              <span class="text-[14px] font-medium" style="color:#2E3E3F">{{ vehicle.leasinggeber }}</span>
            </div>
            <div class="flex min-w-0 flex-col">
              <span class="break-words text-[14px] text-custom-black">Leasing Abgabetermin:</span>
              <span class="text-[14px] font-medium" style="color:#2E3E3F">{{ vehicle.leasingAbgabetermin }}</span>
            </div>
          </div>
        </div>
        <!-- Panel 5: Zugewiesen an  (200px, flex-1) -->

        <div class="relative flex min-w-[200px] flex-1 flex-col rounded-[5px] border bg-white"
          style="border-color:#ECECEC">
          <button @click="editVehicleOpen = true" class="absolute right-3 top-3 transition-opacity hover:opacity-60">
            <Icon icon="mdi:pencil-outline" class="size-5 shrink-0" style="color:#01B990" />
          </button>
          <div class="px-6 py-5">
            <p class="text-[16px] font-bold" style="color:#2E3E3F">Zugewiesen an</p>
          </div>

          <!-- Centered avatar -->
          <div class="flex justify-center pb-4">
            <Avatar class="size-[80px]">
              <AvatarFallback class="text-2xl font-bold" style="background-color:#D9D9D9; color:#2E3E3F">
                {{ vehicle.driverFirstName[0] }}
              </AvatarFallback>
            </Avatar>
          </div>

          <!-- Fields -->
          <div class="flex flex-col gap-3 px-6 pb-5">
            <div>
              <span class="text-[14px] font-bold" style="color:#2E3E3F">Vorname: </span>
              <span class="text-[14px]" style="color:#2E3E3F">{{ vehicle.driverFirstName }}</span>
            </div>
            <div>
              <span class="text-[14px] font-bold" style="color:#2E3E3F">Nachname: </span>
              <span class="text-[14px]" style="color:#2E3E3F">{{ vehicle.driverLastName }}</span>
            </div>
            <div>
              <span class="text-[14px] font-bold" style="color:#2E3E3F">Tel.: </span>
              <span class="text-[14px]" style="color:#2E3E3F">{{ vehicle.driverPhone }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[14px] font-bold" style="color:#2E3E3F">Nutzungsadresse:</span>
              <span class="text-[14px]" style="color:#2E3E3F">{{ vehicle.usageAddress }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[14px] font-bold" style="color:#2E3E3F">Aktivitäten:</span>
              <span class="text-[14px]" style="color:#2E3E3F">{{ vehicle.lastActivity }}</span>
            </div>
          </div>
        </div>

      </div>
    </TableCell>
  </TableRow>

  <!-- Modals -->
  <AddVehicleModal v-model:open="editVehicleOpen" :vehicle="props.vehicle" />
  <UploadDocumentModal v-model:open="uploadDocsOpen" />
</template>
