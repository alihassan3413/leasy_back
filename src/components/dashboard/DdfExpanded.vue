<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue";
import { Icon } from "@iconify/vue";
import type { Vehicle, Offer, Order } from "./vehicle.types";
import AddVehicleModal from "./modals/AddVehicleModal.vue";
import UploadDocumentModal from "./modals/UploadDocumentModal.vue";
import { vehicleApi } from "@/api";
import { useVehicleStore } from "@/stores/vehicle.store";
import { useB2BVehicleStore } from "@/stores/b2bVehicle.store";
import { useAuthStore } from "@/stores/auth.store";

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

// Computed properties with fallback to mock data
const timelineData = computed(() => {
  // Generate timeline from orders
  if (props.vehicle.orders && props.vehicle.orders.length > 0) {
    const timeline: {
      datetime: string;
      label: string;
      sublabel?: string;
      completed: boolean;
    }[] = [];
    const firstOrder = props.vehicle.orders[0];

    // Define the steps
    const steps = [
      {
        label: "Auftrag erstellt",
        datetime:
          new Date(firstOrder.created_at).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }) +
          "\n" +
          new Date(firstOrder.created_at).toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
          }) +
          " Uhr",
        completed: true,
      },
      {
        label: firstOrder.leasyback_partner,
        sublabel: `${firstOrder.request_payload.besichtigungsort.strasse}, ${firstOrder.request_payload.besichtigungsort.plz} ${firstOrder.request_payload.besichtigungsort.ort}`,
        datetime:
          new Date(
            firstOrder.request_payload.besichtigungsort.termin,
          ).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }) +
          "\n" +
          new Date(
            firstOrder.request_payload.besichtigungsort.termin,
          ).toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
          }) +
          " Uhr",
        completed: firstOrder.order_status !== "order_placed",
      },
    ];

    // Add current status as first entry
    timeline.push({
      datetime: "",
      label: `STATUS: ${firstOrder.order_status.replace("_", " ").toUpperCase()}`,
      completed: false,
    });

    // Add the steps
    steps.forEach((step) => {
      timeline.push({
        datetime: step.datetime,
        label: step.label,
        sublabel: step.sublabel,
        completed: step.completed,
      });
    });

    return timeline;
  }
  // Fallback if no orders
  return [
    {
      datetime: "",
      label: "STATUS: KEINE AUFTRÄGE",
      sublabel: "",
      completed: false,
    },
  ];
});

const offersData = computed(() => {
  if (props.vehicle.offers && props.vehicle.offers.length > 0) {
    return props.vehicle.offers;
  }
  return mockOffers;
});

const acceptedOffer = computed(() => {
  return offersData.value.find((o) => o.accepted);
});

async function loadDocuments() {
  try {
    if (!props.vehicle?.vehicle_id) return;
    documents.value = await vehicleApi.getVehicleDocuments(
      props.vehicle.vehicle_id,
    );
  } catch (err) {
    console.error("Failed to load vehicle documents:", err);
    documents.value = [];
  }
}

async function deleteDocument(documentId: string) {
  try {
    if (!props.vehicle?.vehicle_id) return;
    await vehicleApi.deleteVehicleDocument(
      props.vehicle.vehicle_id,
      documentId,
    );
    await loadDocuments();

    // Refresh vehicle lists in stores
    try {
      const auth = useAuthStore();
      const vehicleStore = useVehicleStore();
      const b2bStore = useB2BVehicleStore();
      if (auth.user?.id) {
        void vehicleStore.fetchVehicles(auth.user.id);
        void b2bStore.fetchVehicles(auth.user.id);
      }
    } catch (err) {
      console.warn("Could not refresh vehicle stores after delete", err);
    }
  } catch (err) {
    console.error("Failed to delete vehicle document:", err);
  }
}

onMounted(() => {
  void loadDocuments();
});

watch(
  () => props.vehicle?.vehicle_id,
  () => {
    void loadDocuments();
  },
);
</script>

<template>
  <TableRow class="border-0 hover:bg-transparent">
    <TableCell colspan="12" class="max-w-0 p-0 overflow-x-auto">
      <!-- Main container with 3 columns -->
      <div class="flex gap-4 bg-[#EFEFEF] p-4" style="min-width: max-content">
        <!-- Column 1: Timeline + Vehicle Docs + Return Docs -->
        <div class="flex flex-col gap-4 2xl:flex-row w-[320px] 2xl:w-full">
          <!-- Timeline Card -->
          <div class="flex flex-col overflow-hidden rounded-3xl border bg-white min-w-[280px] max-w-[280px]"
            style="border-color: #ececec">
            <div class="px-6 py-5 flex items-center justify-between">
              <p class="text-[16px] font-bold text-[#000000] leading-tight uppercase">
                {{ timelineData[0]?.label || "STATUS: KEINE AUFTRÄGE" }}
              </p>
              <button class="text-[#01b990] hover:opacity-70">
                <Icon icon="mdi:dots-vertical" class="size-4.5" />
              </button>
            </div>

            <!-- Timeline rows -->
            <div class="flex-1 px-6 pb-5">
              <div v-for="(entry, i) in timelineData.slice(1)" :key="i" class="relative flex items-start pb-6">
                <!-- Vertical line -->
                <div v-if="i < timelineData.slice(1).length - 1" class="absolute left-2 top-5 w-0.5 h-full" :style="entry.completed
                  ? 'background:#01B990'
                  : 'background:#B7C2C2'
                  " />

                <!-- Dot -->
                <div class="relative z-10 w-4 h-4 shrink-0 rounded-full mt-1" :style="entry.completed
                  ? 'background:#01B990'
                  : 'background:#B7C2C2'
                  " />

                <!-- Content -->
                <div class="min-w-0 flex-1 pl-5">
                  <!-- Date/time -->
                  <p class="text-[14px] text-[#2e3e3f] font-medium mb-1">
                    {{ entry.datetime.replace("\n", " - ") }}
                  </p>

                  <!-- Label -->
                  <template v-if="entry.label === 'DEKRA' || entry.label === 'TUVSUD'">
                    <p class="text-[16px] font-bold mb-1" style="color: #01b990">
                      {{ entry.label }}
                    </p>
                    <p v-if="entry.sublabel" class="whitespace-pre-line text-[14px] text-[#2e3e3f] font-normal">
                      {{ entry.sublabel }}
                    </p>
                  </template>
                  <template v-else>
                    <p class="text-[14px] text-[#2e3e3f] font-normal">
                      {{ entry.label }}
                    </p>
                    <p v-if="entry.sublabel" class="whitespace-pre-line text-[14px] text-[#2e3e3f] font-normal">
                      {{ entry.sublabel }}
                    </p>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- Vehicle Docs Card -->
          <div class="flex flex-col gap-4 2xl:min-w-[350px] max-w-[350px]">
            <div class="relative flex flex-col rounded-[16px] border bg-white 2xl:h-full" style="border-color: #ececec">
              <button @click="uploadDocsOpen = true" class="absolute right-5 top-5 transition-opacity hover:opacity-60">
                <Icon icon="mdi:pencil" class="size-[18.5px] shrink-0" style="color: #01b990" />
              </button>
              <div class="p-6">
                <p class="text-[16px] font-semibold uppercase text-[#000000]">
                  Fahrzeugdokumente
                </p>
                <div class="h-px bg-gray-200 mt-2"></div>
              </div>

              <div class="flex flex-col gap-4 p-6 pt-0">
                <div v-for="(doc, i) in documents" :key="i" class="flex items-center justify-between gap-3">
                  <span class="text-[14px] font-normal text-[#475569] flex-1 truncate"
                    :title="doc.file_name || doc.document_type || 'Dokument'">
                    {{ doc.file_name || doc.document_type || "Dokument" }}
                  </span>
                  <div class="flex items-center gap-2">
                    <a v-if="doc.url" :href="doc.url" target="_blank"
                      class="text-[#01b990] hover:opacity-70 flex-shrink-0">
                      <Icon icon="material-symbols:download" class="size-[18.5px] shrink-0" />
                    </a>
                    <button @click="deleteDocument(doc.id)" class="text-[#EF4444] hover:opacity-70 flex-shrink-0">
                      <Icon icon="mdi:delete-outline" class="size-[18.5px] shrink-0" />
                    </button>
                  </div>
                </div>
                <div v-if="documents.length === 0" class="text-[14px] text-[#b7c2c2]">
                  Keine Dokumente gefunden
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Column 2: Angebote (Offers) -->
        <div class="flex flex-col gap-4" style="width: 400px">
          <div class="relative">
            <div class="flex flex-col rounded-[16px] border bg-white" style="border-color: #ececec; opacity: 0.5">
              <div class="px-6 py-6">
                <p class="text-[16px] font-bold" style="color: #2e3e3f">
                  Angebote
                </p>
              </div>

              <!-- Offer rows -->
              <div class="flex flex-col gap-5 px-6">
                <div v-for="offer in offersData" :key="offer.id"
                  class="flex items-center gap-4 rounded-[50px] border py-2 px-4" :style="offer.accepted
                    ? 'border-color: #EF8450; background: rgba(239, 132, 80, 0.08)'
                    : 'border-color: #ECECEC; background: white'
                    ">
                  <!-- Radio circle -->
                  <div class="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1" :style="offer.accepted
                    ? 'border-color: #EF8450; background: #EF8450'
                    : 'border-color: #B7C2C2; background: white'
                    ">
                    <div v-if="offer.accepted" class="w-4.5 h-4.5 rounded-full bg-white"></div>
                  </div>

                  <!-- Content -->
                  <div class="flex flex-col gap-1 flex-1 min-w-0 overflow-hidden">
                    <div class="flex justify-between items-start gap-3">
                      <p class="text-[14px] font-bold flex-1 min-w-0 truncate" :style="offer.accepted ? 'color: #2e3e3f' : 'color: #B7C2C2'
                        " :title="`${offer.id} - ${offer.name}`">
                        {{ offer.id }} - {{ offer.name }}
                      </p>
                      <p class="text-[16px] font-normal flex-shrink-0" :style="offer.accepted ? 'color: #2e3e3f' : 'color: #B7C2C2'
                        ">
                        {{ offer.cost.toLocaleString("de-DE") }} €
                      </p>
                    </div>
                    <div class="flex justify-between items-center gap-3">
                      <p class="text-[12px] flex-1 truncate" style="color: #b7c2c2">
                        {{ offer.distance || "227km Entfernung" }}
                      </p>
                      <p v-if="offer.saving > 0" class="text-[16px] font-normal flex-shrink-0" style="color: #ef8450">
                        Ersparnis: {{ offer.saving }} €
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Accept button -->
              <div class="mt-6 px-6">
                <button class="w-full rounded-[50px] py-4 text-[12px] font-normal uppercase"
                  style="background: #e0e0e0; color: #9e9e9e">
                  Accept offer (Payment required)
                </button>
              </div>

              <!-- Accepted offer box -->
              <div v-if="acceptedOffer" class="px-6 pb-6 pt-5">
                <div class="flex items-center justify-between rounded-[50px] px-7 py-2.5" style="background: #ef8450">
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
            <!-- Coming Soon Overlay -->
            <div class="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div class="bg-white/80 px-6 py-3 rounded-full shadow-lg">
                <p class="text-[18px] font-bold" style="color: #ef8450">
                  Coming Soon
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Column 3: Assigned To + Vehicle Specs -->
        <div class="flex flex-col 2xl:flex-row gap-4 w-[325px] 2xl:w-full">
          <!-- Assigned To Card -->
          <div class="relative flex flex-col rounded-[24px] border bg-white p-8 min-w-[325px]"
            style="border-color: #ececec">
            <button @click="uploadDocsOpen = true" class="absolute right-5 top-5 transition-opacity hover:opacity-60">
              <Icon icon="material-symbols-light:edit" class="size-6 shrink-0" style="color: #01b990" />
            </button>
            <div class="pb-6">
              <p class="text-[16px] font-normal uppercase" style="color: #2e3e3f">
                Zugewiesen an
              </p>
            </div>

            <!-- Avatar + Name row -->
            <div class="flex items-start gap-6 pb-6" v-if="vehicle.orders.length > 0">
              <Avatar class="size-[64px] shrink-0">
                <AvatarFallback class="text-xl font-bold" style="background-color: #d9d9d9; color: #2e3e3f">
                  {{
                    vehicle.orders[0].request_payload.ansprechpartner.name
                      ? vehicle.orders[0].request_payload.ansprechpartner
                        .name[0]
                      : "M"
                  }}
                </AvatarFallback>
              </Avatar>
              <div class="flex flex-col gap-2 pt-2">
                <p class="text-[16px] font-bold" style="color: #2e3e3f">
                  {{ vehicle.orders[0].request_payload.ansprechpartner.name }}
                </p>
                <p class="text-[12px] font-semibold" style="color: #01b990">
                  Primärer Fahrer
                </p>
              </div>
            </div>
            <div class="flex items-start gap-6 pb-6" v-else>
              <Avatar class="size-[64px] shrink-0">
                <AvatarFallback class="text-xl font-bold" style="background-color: #d9d9d9; color: #2e3e3f">
                  M
                </AvatarFallback>
              </Avatar>
              <div class="flex flex-col gap-2 pt-2">
                <p class="text-[16px] font-bold" style="color: #2e3e3f">
                  Marcus Dietrich
                </p>
                <p class="text-[12px] font-semibold" style="color: #01b990">
                  Primärer Fahrer
                </p>
              </div>
            </div>

            <!-- Last Activity -->
            <div class="pb-5">
              <p class="text-[10px] font-medium uppercase" style="color: #8f9ba7; letter-spacing: 0.5px">
                Letzte Aktivität
              </p>
              <div class="flex items-center justify-between pt-2" v-if="vehicle.orders.length > 0">
                <p class="text-[14px] font-normal" style="color: #2e3e3f">
                  {{
                    new Date(vehicle.orders[0].created_at).toLocaleDateString(
                      "de-DE",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      },
                    )
                  }}
                  · Order placed
                </p>
                <p class="text-[14px] font-bold" style="color: #2e3e3f">
                  {{ vehicle.orders[0].order_status.replace("_", " ") }}
                </p>
              </div>
              <div class="flex items-center justify-between pt-2" v-else>
                <p class="text-[14px] font-normal" style="color: #2e3e3f">
                  Keine Aktivität
                </p>
              </div>
            </div>

            <!-- Divider -->
            <div class="h-px bg-gray-200 mb-5"></div>

            <!-- Contact Fields -->
            <div class="flex flex-col gap-4" v-if="vehicle.orders.length > 0">
              <div class="flex items-center gap-4">
                <Icon icon="mdi:phone-outline" class="size-[18px] shrink-0" style="color: #5a6b7a" />
                <span class="text-[14px] font-normal" style="color: #2e3e3f">
                  {{
                    vehicle.orders[0].request_payload.ansprechpartner.telefon
                  }}
                </span>
              </div>
              <div class="flex items-center gap-4">
                <Icon icon="mdi:map-marker-outline" class="size-[18px] shrink-0" style="color: #5a6b7a" />
                <span class="text-[14px] font-normal" style="color: #2e3e3f">
                  {{
                    vehicle.orders[0].request_payload.besichtigungsort.strasse
                  }},
                  {{ vehicle.orders[0].request_payload.besichtigungsort.plz }}
                  {{ vehicle.orders[0].request_payload.besichtigungsort.ort }}
                </span>
              </div>
            </div>
            <div class="flex flex-col gap-4" v-else>
              <div class="flex items-center gap-4">
                <Icon icon="mdi:phone-outline" class="size-[18px] shrink-0" style="color: #5a6b7a" />
                <span class="text-[14px] font-normal" style="color: #2e3e3f">
                  17655874354
                </span>
              </div>
              <div class="flex items-center gap-4">
                <Icon icon="mdi:map-marker-outline" class="size-[18px] shrink-0" style="color: #5a6b7a" />
                <span class="text-[14px] font-normal" style="color: #2e3e3f">
                  Radestraße 12, 35037 Marburg
                </span>
              </div>
            </div>
          </div>

          <!-- Vehicle Specs Card -->
          <div class="relative flex flex-col overflow-hidden rounded-3xl border bg-white min-w-[325px]"
            style="border-color: #ececec">
            <button @click="editVehicleOpen = true" class="absolute right-6 top-6 transition-opacity hover:opacity-60">
              <Icon icon="mdi:pencil" class="size-5 shrink-0" style="color: #01b990" />
            </button>
            <div class="px-6 pt-6">
              <p class="text-[18px] font-bold" style="color: #000">
                VEHICLE SPECS
              </p>
            </div>

            <div class="flex flex-col gap-0 px-6 pt-4 pb-6">
              <div class="flex items-center justify-between py-4">
                <span class="text-[16px] font-normal" style="color: #64748b">
                  Kennzeichen
                </span>
                <span class="text-[16px] font-semibold" style="color: #000">
                  {{ vehicle.license_plate }}
                </span>
              </div>
              <div class="h-px bg-gray-200"></div>
              <div class="flex items-center justify-between py-4">
                <span class="text-[16px] font-normal" style="color: #64748b">
                  Model
                </span>
                <span class="text-[16px] font-semibold" style="color: #000">
                  {{ vehicle.make }} {{ vehicle.model }}
                </span>
              </div>
              <div class="h-px bg-gray-200"></div>
              <div class="flex items-center justify-between py-4">
                <span class="text-[16px] font-normal" style="color: #64748b">
                  Mileage
                </span>
                <span class="text-[16px] font-semibold" style="color: #000">
                  {{ vehicle.kilometerstand || "Nicht verfügbar" }}
                </span>
              </div>
              <div class="h-px bg-gray-200"></div>
              <div class="flex items-center justify-between py-4">
                <span class="text-[16px] font-normal" style="color: #64748b">
                  Lease Provider
                </span>
                <span class="text-[16px] font-semibold" style="color: #000">
                  {{ vehicle.leasinggeber || "Nicht verfügbar" }}
                </span>
              </div>
              <div class="h-px bg-gray-200"></div>
              <div class="flex items-center justify-between py-4">
                <span class="text-[16px] font-normal" style="color: #64748b">
                  Rückgabetermin
                </span>
                <span class="text-[16px] font-semibold" style="color: #000">
                  {{
                    new Date(vehicle.leasing_end_date).toLocaleDateString(
                      "de-DE",
                    )
                  }}
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
  <UploadDocumentModal v-model:open="uploadDocsOpen" :vehicleId="props.vehicle.vehicle_id" @uploaded="loadDocuments"
    @changed="loadDocuments" />
</template>
