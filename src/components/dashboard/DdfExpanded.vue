<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue";
import { Icon } from "@iconify/vue";
import type { Vehicle, Offer } from "./vehicle.types";
import AddVehicleModal from "./modals/AddVehicleModal.vue";
import UploadDocumentModal from "./modals/UploadDocumentModal.vue";
import { vehicleApi } from "@/api";

const props = defineProps<{ vehicle: Vehicle }>();

const editVehicleOpen = ref(false);
const uploadDocsOpen = ref(false);
const documents = ref<any[]>([]);

// Mock data for offers if backend doesn't provide any
const mockOffers: Offer[] = [
  {
    id: "01",
    name: "Göhler Werkstatt",
    cost: 1866,
    saving: 36,
    address: "Musterstraße 123, 12345 Berlin",
    distance: "227km distance",
    recommended: false,
    accepted: false,
  },
  {
    id: "02",
    name: "HanseMerkur",
    cost: 2555,
    saving: 85,
    address: "Beispielstraße 456, 67890 Hamburg",
    distance: "406km distance",
    recommended: false,
    accepted: false,
  },
  {
    id: "03",
    name: "ATU Lüneburg",
    cost: 1755,
    saving: 59,
    address: "Teststraße 789, 21073 Lüneburg",
    distance: "405km distance",
    recommended: true,
    accepted: true,
  },
];

// Mock data for timeline if backend doesn't provide any
const mockTimeline = [
  {
    datetime: "",
    label: "STATUS: ATU LÜNEBURG",
    sublabel: "",
  },
  {
    datetime: "29.02.2025\n10:30 Uhr",
    label: "DEKRA",
    sublabel: "Hugo-Eckener-Straße 26, 50829\nKöln",
  },
  {
    datetime: "29.02.2025\n10:30 Uhr",
    label: "DEKRA",
    sublabel: "Hugo-Eckener-Straße 26, 50829\nKöln",
  },
  {
    datetime: "16.03.2025\n11:30 Uhr",
    label: "Dekra-Bericht",
    sublabel: "",
  },
  {
    datetime: "21.03.2025\n13:00 Uhr",
    label: "Schätzung angenommen",
    sublabel: "",
  },
  {
    datetime: "21.03.2025\n13:00 Uhr",
    label: "Schätzung angenommen",
    sublabel: "",
  },
];

// Mock data for documents
const mockLeasingDocuments = [
  "Leasing Vertrag",
  "TÜV Certifikat",
  "Damage Log",
];

const mockReturnDocuments = ["Leasing Vertrag", "TÜV Certifikat", "Damage Log"];

// Computed properties with fallback to mock data
const timelineData = computed(() => {
  if (props.vehicle.timeline && props.vehicle.timeline.length > 0) {
    return props.vehicle.timeline;
  }
  return mockTimeline;
});

const offersData = computed(() => {
  if (props.vehicle.offers && props.vehicle.offers.length > 0) {
    return props.vehicle.offers;
  }
  return mockOffers;
});

const leasingDocumentsData = computed(() => {
  if (
    props.vehicle.leasingDocuments &&
    props.vehicle.leasingDocuments.length > 0
  ) {
    return props.vehicle.leasingDocuments;
  }
  return mockLeasingDocuments;
});

const returnDocumentsData = computed(() => {
  if (
    props.vehicle.returnDocuments &&
    props.vehicle.returnDocuments.length > 0
  ) {
    return props.vehicle.returnDocuments;
  }
  return mockReturnDocuments;
});

const acceptedOffer = computed(() => {
  return offersData.value.find((o) => o.accepted);
});

async function loadDocuments() {
  try {
    if (!props.vehicle?.id) return;
    documents.value = await vehicleApi.getVehicleDocuments(props.vehicle.id);
  } catch (err) {
    console.error("Failed to load vehicle documents:", err);
    documents.value = [];
  }
}

onMounted(() => {
  void loadDocuments();
});

watch(
  () => props.vehicle?.id,
  () => {
    void loadDocuments();
  },
);
</script>

<template>
  <TableRow class="border-0 hover:bg-transparent">
    <TableCell colspan="6" class="max-w-0 p-0 overflow-x-auto">
      <!-- Main container with 3 columns -->
      <div class="flex gap-4 bg-[#EFEFEF] p-4" style="min-width: max-content">
        <!-- Column 1: Timeline + Vehicle Docs + Return Docs -->
        <div class="flex flex-col gap-4" style="width: 320px">
          <!-- Timeline Card -->
          <div
            class="flex flex-col overflow-hidden rounded-[16px] border bg-white"
            style="border-color: #ececec"
          >
            <div class="px-6 py-5 flex items-center justify-between">
              <p
                class="text-[20px] font-bold text-[#2e3e3f] leading-tight uppercase"
              >
                {{ timelineData[0]?.label || "STATUS: ATU LÜNEBURG" }}
              </p>
              <button class="text-[#01b990] hover:opacity-70">
                <Icon icon="mdi:dots-vertical" class="size-7" />
              </button>
            </div>

            <!-- Timeline rows -->
            <div class="flex-1 px-6 pb-5">
              <div
                v-for="(entry, i) in timelineData.slice(1)"
                :key="i"
                class="relative flex items-start pb-6"
              >
                <!-- Vertical line -->
                <div
                  v-if="i < timelineData.slice(1).length - 1"
                  class="absolute left-[8px] top-5 w-0.5 h-full"
                  :style="i <= 1 ? 'background:#01B990' : 'background:#B7C2C2'"
                />

                <!-- Dot -->
                <div
                  class="relative z-10 w-4 h-4 shrink-0 rounded-full mt-1"
                  :style="i <= 1 ? 'background:#01B990' : 'background:#B7C2C2'"
                />

                <!-- Content -->
                <div class="min-w-0 flex-1 pl-5">
                  <!-- Date/time -->
                  <p class="text-[14px] text-[#2e3e3f] font-medium mb-1">
                    {{ entry.datetime.replace("\n", " - ") }}
                  </p>

                  <!-- Label -->
                  <template v-if="entry.label === 'DEKRA'">
                    <p
                      class="text-[16px] font-bold mb-1"
                      style="color: #01b990"
                    >
                      DEKRA
                    </p>
                    <p
                      v-if="entry.sublabel"
                      class="whitespace-pre-line text-[14px] text-[#2e3e3f] font-normal"
                    >
                      {{ entry.sublabel }}
                    </p>
                  </template>
                  <template v-else>
                    <p class="text-[14px] text-[#2e3e3f] font-normal">
                      {{ entry.label }}
                    </p>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- Vehicle Docs Card -->
          <div
            class="relative flex flex-col rounded-[16px] border bg-white"
            style="border-color: #ececec"
          >
            <button
              @click="uploadDocsOpen = true"
              class="absolute right-4 top-4 transition-opacity hover:opacity-60"
            >
              <Icon
                icon="mdi:download-outline"
                class="size-5 shrink-0"
                style="color: #01b990"
              />
            </button>
            <div class="px-6 py-5">
              <p class="text-[18px] font-bold" style="color: #2e3e3f">
                Vehicle Docs
              </p>
            </div>

            <div class="flex flex-col gap-2 px-6 pb-5">
              <div
                v-for="(doc, i) in leasingDocumentsData"
                :key="i"
                class="flex items-center justify-between"
              >
                <span class="text-[13px]" style="color: #2e3e3f">
                  {{ doc }}
                </span>
                <Icon
                  icon="mdi:download-outline"
                  class="size-5 shrink-0"
                  style="color: #01b990"
                />
              </div>
            </div>
          </div>

          <!-- Return Docs Card -->
          <div
            class="relative flex flex-col rounded-[16px] border bg-white"
            style="border-color: #ececec"
          >
            <button
              class="absolute right-4 top-4 transition-opacity hover:opacity-60"
            >
              <Icon
                icon="mdi:download-outline"
                class="size-5 shrink-0"
                style="color: #01b990"
              />
            </button>
            <div class="px-6 py-5">
              <p class="text-[18px] font-bold" style="color: #2e3e3f">
                Return Docs
              </p>
            </div>

            <div class="flex flex-col gap-2 px-6 pb-5">
              <div
                v-for="(doc, i) in returnDocumentsData"
                :key="i"
                class="flex items-center justify-between"
              >
                <span class="text-[13px]" style="color: #2e3e3f">
                  {{ doc }}
                </span>
                <Icon
                  icon="mdi:download-outline"
                  class="size-5 shrink-0"
                  style="color: #01b990"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Column 2: Angebote (Offers) -->
        <div class="flex flex-col gap-4" style="width: 400px">
          <div
            class="flex flex-col rounded-[16px] border bg-white"
            style="border-color: #ececec"
          >
            <div class="px-6 py-6">
              <p class="text-[16px] font-bold" style="color: #2e3e3f">
                Angebote
              </p>
            </div>

            <!-- Offer rows -->
            <div class="flex flex-col gap-5 px-6">
              <div
                v-for="offer in offersData"
                :key="offer.id"
                class="flex items-center gap-4 rounded-[50px] border py-2 px-4"
                :style="
                  offer.accepted
                    ? 'border-color: #EF8450; background: rgba(239, 132, 80, 0.08)'
                    : 'border-color: #ECECEC; background: white'
                "
              >
                <!-- Radio circle -->
                <div
                  class="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1"
                  :style="
                    offer.accepted
                      ? 'border-color: #EF8450; background: #EF8450'
                      : 'border-color: #B7C2C2; background: white'
                  "
                >
                  <div
                    v-if="offer.accepted"
                    class="w-4.5 h-4.5 rounded-full bg-white"
                  ></div>
                </div>

                <!-- Content -->
                <div class="flex flex-col gap-1 flex-1 min-w-0">
                  <div class="flex justify-between items-start gap-3">
                    <p
                      class="text-[14px] font-bold flex-1 min-w-0 break-words"
                      :style="
                        offer.accepted ? 'color: #2e3e3f' : 'color: #B7C2C2'
                      "
                    >
                      {{ offer.id }} - {{ offer.name }}
                    </p>
                    <p
                      class="text-[16px] font-normal flex-shrink-0"
                      :style="
                        offer.accepted ? 'color: #2e3e3f' : 'color: #B7C2C2'
                      "
                    >
                      {{ offer.cost.toLocaleString("de-DE") }} €
                    </p>
                  </div>
                  <div class="flex justify-between items-center gap-3">
                    <p class="text-[12px] flex-1" style="color: #b7c2c2">
                      {{ offer.distance || "227km distance" }}
                    </p>
                    <p
                      v-if="offer.saving > 0"
                      class="text-[16px] font-normal flex-shrink-0"
                      style="color: #ef8450"
                    >
                      Savings: {{ offer.saving }} €
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Accept button -->
            <div class="mt-6 px-6">
              <button
                class="w-full rounded-[50px] py-4 text-[12px] font-normal uppercase"
                style="background: #e0e0e0; color: #9e9e9e"
              >
                Accept offer (Payment required)
              </button>
            </div>

            <!-- Accepted offer box -->
            <div v-if="acceptedOffer" class="px-6 pb-6 pt-5">
              <div
                class="flex items-center justify-between rounded-[50px] px-7 py-2.5"
                style="background: #ef8450"
              >
                <span class="text-[14px] font-normal text-white">
                  Accepted Offer: {{ acceptedOffer.id }}
                  {{ acceptedOffer.name }}
                </span>
                <span class="text-[16px] font-normal text-white">
                  {{ acceptedOffer.cost.toLocaleString("de-DE") }} €
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Column 3: Assigned To + Vehicle Specs -->
        <div class="flex flex-col gap-4" style="width: 325px">
          <!-- Assigned To Card -->
          <div
            class="relative flex flex-col rounded-[24px] border bg-white p-8"
            style="border-color: #ececec"
          >
            <button
              @click="editVehicleOpen = true"
              class="absolute right-5 top-5 transition-opacity hover:opacity-60"
            >
              <Icon
                icon="mdi:pencil-outline"
                class="size-[18px] shrink-0"
                style="color: #01b990"
              />
            </button>
            <div class="pb-6">
              <p class="text-[16px] font-normal uppercase" style="color: #2e3e3f">
                Assigned To
              </p>
            </div>

            <!-- Avatar + Name row -->
            <div class="flex items-start gap-6 pb-6">
              <Avatar class="size-[64px] shrink-0">
                <AvatarFallback
                  class="text-xl font-bold"
                  style="background-color: #d9d9d9; color: #2e3e3f"
                >
                  {{
                    vehicle.driverFirstName ? vehicle.driverFirstName[0] : "M"
                  }}
                </AvatarFallback>
              </Avatar>
              <div class="flex flex-col gap-2 pt-2">
                <p class="text-[16px] font-bold" style="color: #2e3e3f">
                  Marcus Dietrich
                </p>
                <p class="text-[12px] font-semibold" style="color: #01b990">
                  Primary Driver
                </p>
              </div>
            </div>

            <!-- Last Activity -->
            <div class="pb-5">
              <p
                class="text-[10px] font-medium uppercase"
                style="color: #8f9ba7; letter-spacing: 0.5px"
              >
                Last Activity
              </p>
              <div class="flex items-center justify-between pt-2">
                <p class="text-[14px] font-normal" style="color: #2e3e3f">
                  12.03.2025 · Refuel
                </p>
                <p class="text-[14px] font-bold" style="color: #2e3e3f">
                  Getankt
                </p>
              </div>
            </div>

            <!-- Divider -->
            <div class="h-px bg-gray-200 mb-5"></div>

            <!-- Contact Fields -->
            <div class="flex flex-col gap-4">
              <div class="flex items-center gap-4">
                <Icon
                  icon="mdi:phone-outline"
                  class="size-[18px] shrink-0"
                  style="color: #5a6b7a"
                />
                <span class="text-[14px] font-normal" style="color: #2e3e3f">
                  17655874354
                </span>
              </div>
              <div class="flex items-center gap-4">
                <Icon
                  icon="mdi:map-marker-outline"
                  class="size-[18px] shrink-0"
                  style="color: #5a6b7a"
                />
                <span class="text-[14px] font-normal" style="color: #2e3e3f">
                  Radestraße 12, 35037 Marburg
                </span>
              </div>
            </div>
          </div>

          <!-- Vehicle Specs Card -->
          <div
            class="relative flex flex-col overflow-hidden rounded-[16px] border bg-white"
            style="border-color: #ececec"
          >
            <button
              @click="editVehicleOpen = true"
              class="absolute right-4 top-4 transition-opacity hover:opacity-60"
            >
              <Icon
                icon="mdi:pencil-outline"
                class="size-5 shrink-0"
                style="color: #01b990"
              />
            </button>
            <div class="px-6 py-5">
              <p class="text-[18px] font-bold" style="color: #2e3e3f">
                Vehicle Specs
              </p>
            </div>

            <div class="flex flex-col gap-3 px-6 pb-5">
              <div class="flex items-center justify-between">
                <span class="text-[13px] text-custom-black">
                  License Plate
                </span>
                <span class="text-[13px] font-medium" style="color: #2e3e3f">
                  {{ vehicle.licensePlate }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[13px] text-custom-black"> Modell </span>
                <span class="text-[13px] font-medium" style="color: #2e3e3f">
                  {{ vehicle.brand }} {{ vehicle.model }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[13px] text-custom-black"> Mileage </span>
                <span class="text-[13px] font-medium" style="color: #2e3e3f">
                  {{
                    vehicle.kilometerstand !== "N/A"
                      ? vehicle.kilometerstand
                      : "15.416 km"
                  }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[13px] text-custom-black">
                  Leasing Provider
                </span>
                <span class="text-[13px] font-medium" style="color: #2e3e3f">
                  {{
                    vehicle.leasinggeber !== "N/A"
                      ? vehicle.leasinggeber
                      : "VW Leasing"
                  }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[13px] text-custom-black">
                  Return Deadline
                </span>
                <span class="text-[13px] font-medium" style="color: #2e3e3f">
                  {{ vehicle.leasingAbgabetermin || "25.05.2025" }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </TableCell>
  </TableRow>

  <!-- Modals -->
  <AddVehicleModal v-model:open="editVehicleOpen" :vehicle="props.vehicle" />
  <UploadDocumentModal
    v-model:open="uploadDocsOpen"
    :vehicleId="props.vehicle.id"
    @uploaded="loadDocuments"
    @changed="loadDocuments"
  />
</template>
