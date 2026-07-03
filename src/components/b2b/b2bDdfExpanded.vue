<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue";
import { Icon } from "@iconify/vue";
import type { Vehicle, Offer } from "../dashboard/vehicle.types";
import AddVehicleModal from "../dashboard/modals/AddVehicleModal.vue";
import UploadDocumentModal from "../dashboard/modals/UploadDocumentModal.vue";
import { vehicleApi, customerOffersApi } from "@/api";
import { getOrderStatusLabel } from "@/lib/status";

const props = defineProps<{ vehicle: Vehicle }>();

const editVehicleOpen = ref(false);
const uploadDocsOpen = ref(false);
const documents = ref<any[]>([]);

// Human-readable German titles for known document types.
const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  leasingvertrag: "Leasingvertrag",
  vorschaden: "Vorschaden",
  gutachten: "Gutachten",
  nachgutachten: "Nachgutachten",
  rechnung: "Rechnung",
  tuv: "TÜV",
};

function documentTypeLabel(type?: string): string {
  const key = (type ?? "").trim();
  if (!key) return "Sonstige Dokumente";
  const mapped = DOCUMENT_TYPE_LABELS[key.toLowerCase()];
  if (mapped) return mapped;
  // Fallback: capitalize the raw backend value so it still reads cleanly.
  return key.charAt(0).toUpperCase() + key.slice(1);
}

// Group documents by their document_type so each type renders under its own
// heading. Order of groups follows first appearance in the documents list.
const groupedDocuments = computed(() => {
  const groups: { key: string; title: string; items: any[] }[] = [];
  const indexByKey = new Map<string, number>();

  for (const doc of documents.value) {
    const key = (doc?.document_type ?? "").trim().toLowerCase() || "__other__";
    let idx = indexByKey.get(key);
    if (idx === undefined) {
      idx = groups.length;
      indexByKey.set(key, idx);
      groups.push({
        key,
        title: documentTypeLabel(doc?.document_type),
        items: [],
      });
    }
    groups[idx].items.push(doc);
  }

  return groups;
});

// Mock offers for B2B in case there are no published offers
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

// Published offers fetched from the customer offers endpoint
const realOffers = ref<Offer[]>([]);
const selectingOfferId = ref<string | null>(null);
const hasRealOffers = computed(() => realOffers.value.length > 0);

async function loadOffers() {
  const auftragsnummer = props.vehicle.orders?.[0]?.auftragsnummer;
  if (!auftragsnummer) {
    realOffers.value = [];
    return;
  }
  try {
    const res = await customerOffersApi.list(auftragsnummer);
    realOffers.value = (res.offers || [])
      .filter((offer) => offer.offer_status !== "cancelled")
      .map((offer) => ({
        id: offer.offer_sequence.toString().padStart(2, "0"),
        name: `Angebot ${offer.offer_sequence}`,
        cost: parseFloat(offer.final_total_gross),
        saving: 0,
        address: "",
        distance: "",
        recommended: false,
        accepted: offer.offer_status === "selected",
        offer_id: offer.offer_id,
        status: offer.offer_status,
      }));
  } catch (err) {
    console.error("Failed to load customer offers:", err);
    realOffers.value = [];
  }
}

// Offer pending confirmation (opens the "are you sure" dialog)
const pendingOfferId = ref<string | null>(null);

function requestSelect(offerId?: string) {
  if (!offerId) return;
  // An offer was already selected — selection is final, do nothing.
  if (acceptedOffer.value) return;
  pendingOfferId.value = offerId;
}

function cancelSelect() {
  pendingOfferId.value = null;
}

async function confirmSelect() {
  const offerId = pendingOfferId.value;
  if (!offerId) return;
  try {
    selectingOfferId.value = offerId;
    await customerOffersApi.select(offerId);
    await loadOffers();
  } catch (err) {
    console.error("Failed to select offer:", err);
  } finally {
    selectingOfferId.value = null;
    pendingOfferId.value = null;
  }
}

// Only real published offers are shown; no placeholder offers.
const offersData = computed(() => realOffers.value);

const acceptedOffer = computed(() => {
  return offersData.value.find((o) => o.accepted);
});

const latestOrder = computed(() => {
  if (!props.vehicle.orders || props.vehicle.orders.length === 0) return null;
  const lastOrder = props.vehicle.orders[0];
  console.log("b2bDdfExpanded latestOrder:", lastOrder);
  return lastOrder;
});

// Inspection location (Besichtigungsort) comes from the latest order's request payload.
const besichtigungsort = computed(() => latestOrder.value?.request_payload?.besichtigungsort ?? null);

const terminFormatted = computed(() => {
  const termin = besichtigungsort.value?.termin;
  if (!termin) return "";
  const d = new Date(termin);
  return (
    d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) +
    " Uhr"
  );
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

async function deleteDocument(documentId: string) {
  try {
    if (!props.vehicle?.id) return;
    await vehicleApi.deleteVehicleDocument(props.vehicle.id, documentId);
    await loadDocuments();
  } catch (err) {
    console.error("Failed to delete vehicle document:", err);
  }
}

onMounted(() => {
  void loadDocuments();
  void loadOffers();
});

watch(
  () => props.vehicle?.id,
  () => {
    void loadDocuments();
    void loadOffers();
  },
);
</script>

<template>
  <!-- Desktop: table-row layout -->
  <TableRow class="border-0 hover:bg-transparent hidden md:table-row">
    <TableCell colspan="8" class="max-w-0 p-0 overflow-x-auto">
      <!-- Main container with 3 columns -->
      <div class="flex gap-4 bg-[#EFEFEF] p-4" style="min-width: max-content">
        <!-- Column 1: Timeline + Vehicle Docs + Return Docs -->
        <div class="flex flex-col gap-4 2xl:flex-row w-[320px] 2xl:w-full">
          <!-- Timeline Card -->
          <div
            class="flex flex-col overflow-hidden rounded-3xl border bg-white min-w-[280px] max-w-[280px]"
            style="border-color: #ececec"
          >
            <div class="px-6 py-5 flex flex-col gap-3">
              <div class="flex items-center justify-between w-full">
                <p class="text-[16px] font-bold text-[#000000] leading-tight uppercase">
                  Status:
                  {{
                    latestOrder
                      ? getOrderStatusLabel(latestOrder.order_status).label
                      : "Kein Auftrag"
                  }}
                </p>
                <button class="text-[#01b990] hover:opacity-70">
                  <Icon icon="mdi:dots-vertical" class="size-4.5" />
                </button>
              </div>
              <div
                v-if="latestOrder && latestOrder.order_status === 'order_requested'"
                class="w-full rounded-[50px] bg-red-100 px-4 py-2"
                @click="console.log('Red box clicked, order status:', latestOrder.order_status)"
              >
                <p class="text-[12px] font-bold text-red-700">Auftrag ist nicht bestätigt</p>
              </div>
            </div>

            <!-- Timeline rows -->
            <div class="flex-1 px-6 pb-5">
              <div
                v-for="(entry, i) in vehicle.timeline || []"
                :key="i"
                class="relative flex items-start pb-6"
              >
                <!-- Vertical line -->
                <div
                  v-if="i < (vehicle.timeline || []).length - 1"
                  class="absolute left-2 top-5 w-0.5 h-full"
                  :style="
                    i >= (vehicle.timeline || []).length - 1
                      ? 'background:#01B990'
                      : 'background:#B7C2C2'
                  "
                />

                <!-- Dot -->
                <div
                  class="relative z-10 w-4 h-4 shrink-0 rounded-full mt-1"
                  :style="
                    i >= (vehicle.timeline || []).length - 1
                      ? 'background:#01B990'
                      : 'background:#B7C2C2'
                  "
                />

                <!-- Content -->
                <div class="min-w-0 flex-1 pl-5">
                  <!-- Date/time -->
                  <p class="text-[14px] text-[#2e3e3f] font-medium mb-1">
                    {{ entry.datetime }}
                  </p>

                  <!-- Label -->
                  <template v-if="entry.label === 'DEKRA'">
                    <p class="text-[16px] font-bold mb-1" style="color: #01b990">
                      {{ entry.label }}
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
                    <p
                      v-if="entry.sublabel"
                      class="whitespace-pre-line text-[14px] text-[#2e3e3f] font-normal"
                    >
                      {{ entry.sublabel }}
                    </p>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- Vehicle Docs Card -->
          <div class="flex flex-col gap-4 2xl:min-w-[350px] max-w-[350px]">
            <div
              class="relative flex flex-col rounded-[16px] border bg-white 2xl:h-full"
              style="border-color: #ececec"
            >
              <button
                @click="uploadDocsOpen = true"
                class="absolute right-5 top-5 transition-opacity hover:opacity-60"
              >
                <Icon icon="mdi:pencil" class="size-[18.5px] shrink-0" style="color: #01b990" />
              </button>
              <div class="px-6 pt-6">
                <p class="text-[16px] font-semibold uppercase text-[#000000]">Fahrzeug Dokumente</p>
                <div class="h-px bg-gray-200 mt-2"></div>
              </div>

              <div class="flex flex-col gap-4 px-6 pt-4 pb-4">
                <div v-for="group in groupedDocuments" :key="group.key" class="flex flex-col gap-3">
                  <div v-if="group.key !== 'gutachten'">
                    <p class="text-[16px] font-semibold uppercase text-[#000000]">
                      {{ group.title }}
                    </p>
                    <div class="h-px bg-gray-200 mt-2"></div>
                  </div>
                  <div
                    v-for="(doc, i) in group.items"
                    :key="doc.id || i"
                    class="flex items-center justify-between gap-3"
                  >
                    <span
                      class="text-[14px] font-normal text-[#475569] flex-1 truncate"
                      :title="doc.file_name || doc.document_type || 'Dokument'"
                    >
                      {{ doc.file_name || doc.document_type || "Dokument" }}
                    </span>
                    <div class="flex items-center gap-2">
                      <a
                        v-if="doc.url"
                        :href="doc.url"
                        target="_blank"
                        class="text-[#01b990] hover:opacity-70 flex-shrink-0"
                      >
                        <Icon icon="material-symbols:download" class="size-[18.5px] shrink-0" />
                      </a>
                      <button
                        @click="deleteDocument(doc.id)"
                        class="text-[#EF4444] hover:opacity-70 flex-shrink-0"
                      >
                        <Icon icon="mdi:delete-outline" class="size-[18.5px] shrink-0" />
                      </button>
                    </div>
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
        <div class="flex flex-col gap-4 shrink-0" style="width: 400px">
          <div class="relative">
            <div
              class="flex flex-col rounded-[16px] border bg-white"
              :style="
                hasRealOffers ? 'border-color: #ececec' : 'border-color: #ececec; opacity: 0.5'
              "
            >
              <div class="px-6 py-6">
                <p class="text-[16px] font-bold" style="color: #2e3e3f">Angebote</p>
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
                  <!-- Radio circle / select offer -->
                  <button
                    type="button"
                    @click.stop="hasRealOffers && requestSelect(offer.offer_id)"
                    :disabled="
                      !hasRealOffers || !!acceptedOffer || selectingOfferId === offer.offer_id
                    "
                    class="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 disabled:cursor-default"
                    :style="
                      offer.accepted
                        ? 'border-color: #EF8450; background: #EF8450'
                        : 'border-color: #B7C2C2; background: white'
                    "
                    title="Angebot auswählen"
                  >
                    <div v-if="offer.accepted" class="w-4.5 h-4.5 rounded-full bg-white"></div>
                  </button>

                  <!-- Content -->
                  <div class="flex flex-col gap-1 flex-1 min-w-0 overflow-hidden">
                    <div class="flex justify-between items-start gap-3">
                      <p
                        class="text-[14px] font-bold flex-1 min-w-0 truncate"
                        :style="offer.accepted ? 'color: #2e3e3f' : 'color: #B7C2C2'"
                        :title="`${offer.id} - ${offer.name}`"
                      >
                        {{ offer.id }} - {{ offer.name }}
                      </p>
                      <p
                        class="text-[16px] font-normal flex-shrink-0"
                        :style="offer.accepted ? 'color: #2e3e3f' : 'color: #B7C2C2'"
                      >
                        {{ offer.cost.toLocaleString("de-DE") }} €
                      </p>
                    </div>
                    <div class="flex justify-between items-center gap-3">
                      <p class="text-[12px] flex-1 truncate" style="color: #b7c2c2">
                        {{ offer.address || offer.distance || "227km distance" }}
                      </p>
                      <p
                        v-if="offer.saving > 0"
                        class="text-[16px] font-normal flex-shrink-0"
                        style="color: #ef8450"
                      >
                        Ersparnis: {{ offer.saving }} €
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Accept button -->
              <div class="mt-6 px-6 pb-6">
                <button
                  class="w-full rounded-[50px] py-4 text-[12px] font-normal uppercase"
                  style="background: #e0e0e0; color: #9e9e9e"
                >
                  Kostenpflichtig Annehmen
                </button>
              </div>

              <!-- Accepted offer box -->
              <div v-if="acceptedOffer" class="px-6 pb-6 pt-5">
                <div
                  class="flex items-center justify-between rounded-[50px] px-7 py-2.5"
                  style="background: #ef8450"
                >
                  <span class="text-[14px] font-normal text-white">
                    Angenommenes Angebot: {{ acceptedOffer.id }}
                    {{ acceptedOffer.name }}
                  </span>
                  <span class="text-[16px] font-normal text-white">
                    {{ acceptedOffer.cost.toLocaleString("de-DE") }} €
                  </span>
                </div>
              </div>
            </div>
            <!-- Overlay: shown only when there are no published offers -->
            <div
              v-if="!hasRealOffers"
              class="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
            >
              <div class="bg-white/80 px-6 py-3 rounded-full shadow-lg">
                <p class="text-[18px] font-bold" style="color: #ef8450">Keine Angebote</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Column 3: Besichtigungsort + Fahrzeug Daten -->
        <div class="flex flex-col 2xl:flex-row gap-4 w-[325px] 2xl:w-full">
          <!-- Besichtigungsort Card -->
          <div
            class="relative flex flex-col rounded-[24px] border bg-white p-8 min-w-[325px]"
            style="border-color: #ececec"
          >
            <div class="pb-6">
              <p class="text-[16px] font-normal uppercase" style="color: #2e3e3f">
                Besichtigungsort
              </p>
            </div>

            <template v-if="besichtigungsort">
              <!-- Name row -->
              <div class="flex items-center gap-5 pb-6">
                <div
                  class="flex size-[56px] shrink-0 items-center justify-center rounded-full"
                  style="background-color: rgba(1, 185, 144, 0.1)"
                >
                  <Icon icon="mdi:office-building-outline" class="size-7" style="color: #01b990" />
                </div>
                <p class="text-[18px] font-bold" style="color: #2e3e3f">
                  {{ besichtigungsort.name }}
                </p>
              </div>

              <!-- Termin -->
              <div class="pb-5">
                <p
                  class="text-[10px] font-medium uppercase"
                  style="color: #8f9ba7; letter-spacing: 0.5px"
                >
                  Termin
                </p>
                <div class="flex items-center gap-3 pt-2">
                  <Icon
                    icon="mdi:calendar-clock-outline"
                    class="size-[18px] shrink-0"
                    style="color: #5a6b7a"
                  />
                  <p class="text-[14px] font-bold" style="color: #2e3e3f">
                    {{ terminFormatted || "Kein Termin" }}
                  </p>
                </div>
              </div>

              <!-- Divider -->
              <div class="h-px bg-gray-200 mb-5"></div>

              <!-- Address -->
              <div class="flex items-start gap-4">
                <Icon
                  icon="mdi:map-marker-outline"
                  class="size-[18px] shrink-0 mt-0.5"
                  style="color: #5a6b7a"
                />
                <span class="text-[14px] font-normal leading-relaxed" style="color: #2e3e3f">
                  {{ besichtigungsort.strasse }}<br />
                  {{ besichtigungsort.plz }} {{ besichtigungsort.ort }}
                  <template v-if="besichtigungsort.land">
                    ({{ besichtigungsort.land.toUpperCase() }})
                  </template>
                </span>
              </div>
            </template>
            <div v-else class="text-[14px] font-normal" style="color: #b7c2c2">
              Kein Besichtigungsort verfügbar
            </div>
          </div>

          <!-- Fahrzeug Daten Card -->
          <div
            class="relative flex flex-col overflow-hidden rounded-3xl border bg-white min-w-[325px]"
            style="border-color: #ececec"
          >
            <button
              @click="editVehicleOpen = true"
              class="absolute right-6 top-6 transition-opacity hover:opacity-60"
            >
              <Icon icon="mdi:pencil" class="size-5 shrink-0" style="color: #01b990" />
            </button>
            <div class="px-6 pt-6">
              <p class="text-[18px] font-bold" style="color: #000">FAHRZEUG DATEN</p>
            </div>

            <div class="flex flex-col gap-0 px-6 pt-4 pb-6">
              <div class="flex items-center justify-between py-4">
                <span class="text-[16px] font-normal" style="color: #64748b"> Kennzeichen </span>
                <span class="text-[16px] font-semibold" style="color: #000">
                  {{ vehicle.licensePlate }}
                </span>
              </div>
              <div class="h-px bg-gray-200"></div>
              <div class="flex items-center justify-between py-4">
                <span class="text-[16px] font-normal" style="color: #64748b"> Modell </span>
                <span class="text-[16px] font-semibold" style="color: #000">
                  {{ vehicle.brand }} {{ vehicle.model }}
                </span>
              </div>
              <div class="h-px bg-gray-200"></div>
              <div class="flex items-center justify-between py-4">
                <span class="text-[16px] font-normal" style="color: #64748b"> Kilometerstand </span>
                <span class="text-[16px] font-semibold" style="color: #000">
                  {{ vehicle.kilometerstand || "N/A" }}
                </span>
              </div>
              <div class="h-px bg-gray-200"></div>
              <div class="flex items-center justify-between py-4">
                <span class="text-[16px] font-normal" style="color: #64748b"> Leasinggeber </span>
                <span class="text-[16px] font-semibold" style="color: #000">
                  {{ vehicle.leasinggeber || "N/A" }}
                </span>
              </div>
              <div class="h-px bg-gray-200"></div>
              <div class="flex items-center justify-between py-4">
                <span class="text-[16px] font-normal" style="color: #64748b">
                  Leasing Abgabetermin
                </span>
                <span class="text-[16px] font-semibold" style="color: #000">
                  {{ vehicle.leasingAbgabetermin || vehicle.leaseEnd }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TableCell>
  </TableRow>

  <!-- Mobile: stacked layout -->
  <div class="md:hidden flex flex-col gap-4 bg-[#EFEFEF] p-4">
    <!-- Timeline Card -->
    <div
      class="flex flex-col overflow-hidden rounded-3xl border bg-white w-full"
      style="border-color: #ececec"
    >
      <div class="px-6 py-5 flex flex-col gap-3">
        <div class="flex items-center justify-between w-full">
          <p class="text-[16px] font-bold text-[#000000] leading-tight uppercase">
            Status:
            {{ latestOrder ? getOrderStatusLabel(latestOrder.order_status).label : "Kein Auftrag" }}
          </p>
          <button class="text-[#01b990] hover:opacity-70">
            <Icon icon="mdi:dots-vertical" class="size-4.5" />
          </button>
        </div>
        <div
          v-if="latestOrder && latestOrder.order_status === 'order_requested'"
          class="w-full rounded-[50px] bg-red-100 px-4 py-2"
        >
          <p class="text-[12px] font-bold text-red-700">Auftrag ist nicht bestätigt</p>
        </div>
      </div>

      <!-- Timeline rows -->
      <div class="flex-1 px-6 pb-5">
        <div
          v-for="(entry, i) in vehicle.timeline || []"
          :key="i"
          class="relative flex items-start pb-6"
        >
          <div
            v-if="i < (vehicle.timeline || []).length - 1"
            class="absolute left-2 top-5 w-0.5 h-full"
            :style="
              i >= (vehicle.timeline || []).length - 1 ? 'background:#01B990' : 'background:#B7C2C2'
            "
          />
          <div
            class="relative z-10 w-4 h-4 shrink-0 rounded-full mt-1"
            :style="
              i >= (vehicle.timeline || []).length - 1 ? 'background:#01B990' : 'background:#B7C2C2'
            "
          />
          <div class="min-w-0 flex-1 pl-5">
            <p class="text-[14px] text-[#2e3e3f] font-medium mb-1">
              {{ entry.datetime }}
            </p>
            <template v-if="entry.label === 'DEKRA'">
              <p class="text-[16px] font-bold mb-1" style="color: #01b990">
                {{ entry.label }}
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
              <p
                v-if="entry.sublabel"
                class="whitespace-pre-line text-[14px] text-[#2e3e3f] font-normal"
              >
                {{ entry.sublabel }}
              </p>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Vehicle Docs Card -->
    <div
      class="relative flex flex-col rounded-[16px] border bg-white w-full"
      style="border-color: #ececec"
    >
      <button
        @click="uploadDocsOpen = true"
        class="absolute right-5 top-5 transition-opacity hover:opacity-60"
      >
        <Icon icon="mdi:pencil" class="size-[18.5px] shrink-0" style="color: #01b990" />
      </button>
      <div class="px-6 pt-6">
        <p class="text-[16px] font-semibold uppercase text-[#000000]">Fahrzeug Dokumente</p>
        <div class="h-px bg-gray-200 mt-2"></div>
      </div>
      <div class="flex flex-col gap-4 px-6 pt-4 pb-4">
        <div v-for="group in groupedDocuments" :key="group.key" class="flex flex-col gap-3">
          <div v-if="group.key !== 'gutachten'">
            <p class="text-[16px] font-semibold uppercase text-[#000000]">
              {{ group.title }}
            </p>
            <div class="h-px bg-gray-200 mt-2"></div>
          </div>
          <div
            v-for="(doc, i) in group.items"
            :key="doc.id || i"
            class="flex items-center justify-between gap-3"
          >
            <span
              class="text-[14px] font-normal text-[#475569] flex-1 truncate"
              :title="doc.file_name || doc.document_type || 'Dokument'"
            >
              {{ doc.file_name || doc.document_type || "Dokument" }}
            </span>
            <div class="flex items-center gap-2">
              <a
                v-if="doc.url"
                :href="doc.url"
                target="_blank"
                class="text-[#01b990] hover:opacity-70 flex-shrink-0"
              >
                <Icon icon="material-symbols:download" class="size-[18.5px] shrink-0" />
              </a>
              <button
                @click="deleteDocument(doc.id)"
                class="text-[#EF4444] hover:opacity-70 flex-shrink-0"
              >
                <Icon icon="mdi:delete-outline" class="size-[18.5px] shrink-0" />
              </button>
            </div>
          </div>
        </div>
        <div v-if="documents.length === 0" class="text-[14px] text-[#b7c2c2]">
          Keine Dokumente gefunden
        </div>
      </div>
    </div>

    <!-- Angebote (Offers) -->
    <div class="relative w-full">
      <div
        class="flex flex-col rounded-[16px] border bg-white"
        :style="hasRealOffers ? 'border-color: #ececec' : 'border-color: #ececec; opacity: 0.5'"
      >
        <div class="px-6 py-6">
          <p class="text-[16px] font-bold" style="color: #2e3e3f">Angebote</p>
        </div>
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
            <button
              type="button"
              @click.stop="hasRealOffers && requestSelect(offer.offer_id)"
              :disabled="!hasRealOffers || !!acceptedOffer || selectingOfferId === offer.offer_id"
              class="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 disabled:cursor-default"
              :style="
                offer.accepted
                  ? 'border-color: #EF8450; background: #EF8450'
                  : 'border-color: #B7C2C2; background: white'
              "
              title="Angebot auswählen"
            >
              <div v-if="offer.accepted" class="w-4.5 h-4.5 rounded-full bg-white"></div>
            </button>
            <div class="flex flex-col gap-1 flex-1 min-w-0 overflow-hidden">
              <div class="flex justify-between items-start gap-3">
                <p
                  class="text-[14px] font-bold flex-1 min-w-0 truncate"
                  :style="offer.accepted ? 'color: #2e3e3f' : 'color: #B7C2C2'"
                  :title="`${offer.id} - ${offer.name}`"
                >
                  {{ offer.id }} - {{ offer.name }}
                </p>
                <p
                  class="text-[16px] font-normal flex-shrink-0"
                  :style="offer.accepted ? 'color: #2e3e3f' : 'color: #B7C2C2'"
                >
                  {{ offer.cost.toLocaleString("de-DE") }} €
                </p>
              </div>
              <div class="flex justify-between items-center gap-3">
                <p class="text-[12px] flex-1 truncate" style="color: #b7c2c2">
                  {{ offer.address || offer.distance || "227km distance" }}
                </p>
                <p
                  v-if="offer.saving > 0"
                  class="text-[16px] font-normal flex-shrink-0"
                  style="color: #ef8450"
                >
                  Ersparnis: {{ offer.saving }} €
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-6 px-6 pb-6">
          <button
            class="w-full rounded-[50px] py-4 text-[12px] font-normal uppercase"
            style="background: #e0e0e0; color: #9e9e9e"
          >
            Kostenpflichtig Annehmen
          </button>
        </div>
        <div v-if="acceptedOffer" class="px-6 pb-6 pt-5">
          <div
            class="flex items-center justify-between rounded-[50px] px-7 py-2.5"
            style="background: #ef8450"
          >
            <span class="text-[14px] font-normal text-white">
              Angenommenes Angebot: {{ acceptedOffer.id }} {{ acceptedOffer.name }}
            </span>
            <span class="text-[16px] font-normal text-white">
              {{ acceptedOffer.cost.toLocaleString("de-DE") }} €
            </span>
          </div>
        </div>
      </div>
      <div
        v-if="!hasRealOffers"
        class="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
      >
        <div class="bg-white/80 px-6 py-3 rounded-full shadow-lg">
          <p class="text-[18px] font-bold" style="color: #ef8450">Keine Angebote</p>
        </div>
      </div>
    </div>

    <!-- Besichtigungsort Card -->
    <div
      class="relative flex flex-col rounded-[24px] border bg-white p-8 w-full"
      style="border-color: #ececec"
    >
      <div class="pb-6">
        <p class="text-[16px] font-normal uppercase" style="color: #2e3e3f">Besichtigungsort</p>
      </div>

      <template v-if="besichtigungsort">
        <!-- Name row -->
        <div class="flex items-center gap-5 pb-6">
          <div
            class="flex size-[56px] shrink-0 items-center justify-center rounded-full"
            style="background-color: rgba(1, 185, 144, 0.1)"
          >
            <Icon icon="mdi:office-building-outline" class="size-7" style="color: #01b990" />
          </div>
          <p class="text-[18px] font-bold" style="color: #2e3e3f">
            {{ besichtigungsort.name }}
          </p>
        </div>

        <!-- Termin -->
        <div class="pb-5">
          <p
            class="text-[10px] font-medium uppercase"
            style="color: #8f9ba7; letter-spacing: 0.5px"
          >
            Termin
          </p>
          <div class="flex items-center gap-3 pt-2">
            <Icon
              icon="mdi:calendar-clock-outline"
              class="size-[18px] shrink-0"
              style="color: #5a6b7a"
            />
            <p class="text-[14px] font-bold" style="color: #2e3e3f">
              {{ terminFormatted || "Kein Termin" }}
            </p>
          </div>
        </div>

        <!-- Divider -->
        <div class="h-px bg-gray-200 mb-5"></div>

        <!-- Address -->
        <div class="flex items-start gap-4">
          <Icon
            icon="mdi:map-marker-outline"
            class="size-[18px] shrink-0 mt-0.5"
            style="color: #5a6b7a"
          />
          <span class="text-[14px] font-normal leading-relaxed" style="color: #2e3e3f">
            {{ besichtigungsort.strasse }}<br />
            {{ besichtigungsort.plz }} {{ besichtigungsort.ort }}
            <template v-if="besichtigungsort.land">
              ({{ besichtigungsort.land.toUpperCase() }})
            </template>
          </span>
        </div>
      </template>
      <div v-else class="text-[14px] font-normal" style="color: #b7c2c2">
        Kein Besichtigungsort verfügbar
      </div>
    </div>

    <!-- Fahrzeug Daten Card -->
    <div
      class="relative flex flex-col overflow-hidden rounded-3xl border bg-white w-full"
      style="border-color: #ececec"
    >
      <button
        @click="editVehicleOpen = true"
        class="absolute right-6 top-6 transition-opacity hover:opacity-60"
      >
        <Icon icon="mdi:pencil" class="size-5 shrink-0" style="color: #01b990" />
      </button>
      <div class="px-6 pt-6">
        <p class="text-[18px] font-bold" style="color: #000">FAHRZEUG DATEN</p>
      </div>
      <div class="flex flex-col gap-0 px-6 pt-4 pb-6">
        <div class="flex items-center justify-between py-4">
          <span class="text-[16px] font-normal" style="color: #64748b">Kennzeichen</span>
          <span class="text-[16px] font-semibold" style="color: #000">
            {{ vehicle.licensePlate }}
          </span>
        </div>
        <div class="h-px bg-gray-200"></div>
        <div class="flex items-center justify-between py-4">
          <span class="text-[16px] font-normal" style="color: #64748b">Modell</span>
          <span class="text-[16px] font-semibold" style="color: #000">
            {{ vehicle.brand }} {{ vehicle.model }}
          </span>
        </div>
        <div class="h-px bg-gray-200"></div>
        <div class="flex items-center justify-between py-4">
          <span class="text-[16px] font-normal" style="color: #64748b">Kilometerstand</span>
          <span class="text-[16px] font-semibold" style="color: #000">
            {{ vehicle.kilometerstand || "N/A" }}
          </span>
        </div>
        <div class="h-px bg-gray-200"></div>
        <div class="flex items-center justify-between py-4">
          <span class="text-[16px] font-normal" style="color: #64748b">Leasinggeber</span>
          <span class="text-[16px] font-semibold" style="color: #000">
            {{ vehicle.leasinggeber || "N/A" }}
          </span>
        </div>
        <div class="h-px bg-gray-200"></div>
        <div class="flex items-center justify-between py-4">
          <span class="text-[16px] font-normal" style="color: #64748b">Leasing Abgabetermin</span>
          <span class="text-[16px] font-semibold" style="color: #000">
            {{ vehicle.leasingAbgabetermin || vehicle.leaseEnd }}
          </span>
        </div>
      </div>
    </div>
  </div>

  <!-- Modals -->
  <AddVehicleModal v-model:open="editVehicleOpen" :vehicle="props.vehicle" />
  <UploadDocumentModal
    v-model:open="uploadDocsOpen"
    :vehicleId="props.vehicle.id"
    @uploaded="loadDocuments"
    @changed="loadDocuments"
  />

  <!-- Select offer confirmation -->
  <div
    v-if="pendingOfferId"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/5 p-4"
    @click="cancelSelect"
  >
    <div class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" @click.stop>
      <h3 class="text-[18px] font-bold text-[#2e3e3f]">Angebot auswählen</h3>
      <p class="mt-3 text-[14px] text-[#5a6b7a] leading-relaxed">
        Sind Sie sicher, dass Sie dieses Angebot auswählen möchten? Sie können die Auswahl danach
        nicht mehr ändern.
      </p>
      <div class="mt-6 flex justify-end gap-3">
        <button
          @click="cancelSelect"
          :disabled="selectingOfferId !== null"
          class="px-5 py-2.5 rounded-full text-[14px] font-medium text-[#2e3e3f] border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          Abbrechen
        </button>
        <button
          @click="confirmSelect"
          :disabled="selectingOfferId !== null"
          class="px-5 py-2.5 rounded-full text-[14px] font-semibold text-white disabled:opacity-50"
          style="background: #ef8450"
        >
          {{ selectingOfferId !== null ? "Wird ausgewählt..." : "Bestätigen" }}
        </button>
      </div>
    </div>
  </div>
</template>
