<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { Icon } from "@iconify/vue";
import { TableRow, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { AdminVehicle, Offer, OffersListResponse } from "@/types";
import AddVehicleModal from "@/components/dashboard/modals/AddVehicleModal.vue";
import UploadDocumentModal from "@/components/dashboard/modals/UploadDocumentModal.vue";
import { vehicleApi, adminVehiclesApi, adminOffersApi } from "@/api";

const props = defineProps<{
  vehicle: AdminVehicle;
  expandedVehicleDetails: Record<string, any>;
  documents: Record<string, any[]>;
}>();

const emit = defineEmits(["refreshDocs"]);

// Debug logs to see what order data we have
onMounted(() => {
  console.log("===== ADMIN VEHICLE ORDER HISTORY PROPS =====");
  console.log("Full vehicle object:", props.vehicle);
  console.log("vehicle.orders:", props.vehicle.orders);
  console.log("vehicle.order_history:", props.vehicle.order_history);
  console.log(
    "vehicle.current_request_payload:",
    props.vehicle.current_request_payload,
  );
  console.log(
    "expandedVehicleDetails:",
    props.expandedVehicleDetails[props.vehicle.vehicle_id],
  );

  // Fetch offers after component is mounted
  if (firstOrder.value?.auftragsnummer) {
    fetchOffers(firstOrder.value.auftragsnummer);
  }
});

const editVehicleOpen = ref(false);
const uploadDocsOpen = ref(false);

// State for real offers
const realOffers = ref<Offer[]>([]);
const offersLoading = ref(false);
const openOfferMenu = ref<string | null>(null);

// Fetch offers when we have an order with auftragsnummer
async function fetchOffers(auftragsnummer: string) {
  if (!auftragsnummer) return;
  try {
    offersLoading.value = true;
    const response = await adminOffersApi.list(auftragsnummer);
    realOffers.value = response.offers || [];
  } catch (err) {
    console.error("Failed to fetch offers:", err);
    realOffers.value = [];
  } finally {
    offersLoading.value = false;
  }
}

const publishingId = ref<string | null>(null);

async function publishOffer(offerId: string) {
  try {
    publishingId.value = offerId;
    await adminOffersApi.publishOffer(offerId, true);
    if (firstOrder.value?.auftragsnummer) {
      await fetchOffers(firstOrder.value.auftragsnummer);
    }
  } catch (err) {
    console.error("Failed to publish offer:", err);
  } finally {
    publishingId.value = null;
  }
}

// Offer pending cancellation (opens the reason dialog)
const cancelOfferId = ref<string | null>(null);
const cancelReason = ref("");
const cancelling = ref(false);

function requestCancel(offerId: string) {
  cancelOfferId.value = offerId;
  cancelReason.value = "";
}

function closeCancel() {
  cancelOfferId.value = null;
  cancelReason.value = "";
}

async function confirmCancel() {
  const offerId = cancelOfferId.value;
  if (!offerId || !cancelReason.value.trim()) return;
  try {
    cancelling.value = true;
    await adminOffersApi.cancelOffer(offerId, cancelReason.value.trim());
    if (firstOrder.value?.auftragsnummer) {
      await fetchOffers(firstOrder.value.auftragsnummer);
    }
    closeCancel();
  } catch (err) {
    console.error("Failed to cancel offer:", err);
  } finally {
    cancelling.value = false;
  }
}

// TODO: Add updateOffer function when we know the API

// Get the first order (prioritize vehicle.orders > use current_* fields)
const firstOrder = computed(() => {
  if (props.vehicle.orders?.length > 0) {
    return props.vehicle.orders[0];
  }
  // If no orders array, create a pseudo-order from current_* fields
  if (props.vehicle.current_order_id) {
    return {
      id: props.vehicle.current_order_id,
      auftragsnummer: props.vehicle.current_auftragsnummer || "",
      created_at: props.vehicle.current_order_created_at || "",
      leasyback_partner: "",
      order_status: props.vehicle.current_order_status || "",
      request_payload: props.vehicle.current_request_payload,
    };
  }
  return null;
});

// Get the order payload
const orderPayload = computed(() => {
  const order = firstOrder.value;
  if (order?.request_payload) {
    return order.request_payload;
  }
  return props.vehicle.current_request_payload;
});

// Check if we have any order data (for conditional rendering)
const hasOrderData = computed(() => {
  return !!firstOrder.value;
});

// Computed properties with fallback to mock data
const timelineData = computed(() => {
  console.log("Generating timeline with firstOrder:", firstOrder.value);
  // Generate timeline from orders
  if (firstOrder.value) {
    const timeline: {
      datetime: string;
      label: string;
      sublabel?: string;
      completed: boolean;
    }[] = [];
    const order = firstOrder.value;
    const payload = orderPayload.value;

    // Define the steps
    const steps = [
      {
        label: "Auftrag erstellt",
        datetime: order.created_at
          ? new Date(order.created_at).toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }) +
            "\n" +
            new Date(order.created_at).toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
            }) +
            " Uhr"
          : "",
        completed: true,
      },
      {
        label: order.leasyback_partner || "",
        sublabel: payload?.besichtigungsort
          ? `${payload.besichtigungsort.strasse}, ${payload.besichtigungsort.plz} ${payload.besichtigungsort.ort}`
          : "",
        datetime: payload?.besichtigungsort?.termin
          ? new Date(payload.besichtigungsort.termin).toLocaleDateString(
              "de-DE",
              {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              },
            ) +
            "\n" +
            new Date(payload.besichtigungsort.termin).toLocaleTimeString(
              "de-DE",
              {
                hour: "2-digit",
                minute: "2-digit",
              },
            ) +
            " Uhr"
          : "",
        completed: order.order_status !== "order_placed",
      },
    ];

    // Add current status as first entry
    timeline.push({
      datetime: "",
      label: `STATUS: ${(order.order_status || "KEINE AUFTRÄGE").replace("_", " ").toUpperCase()}`,
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

    console.log("Generated timeline:", timeline);
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
  if (realOffers.value.length > 0) {
    return realOffers.value.map((offer) => ({
      id: offer.offer_sequence.toString().padStart(2, "0"),
      name: `Angebot ${offer.offer_sequence}`,
      cost: parseFloat(offer.final_total_gross),
      saving: 0,
      address: "",
      distance: "",
      recommended: false,
      accepted: offer.offer_status === "selected",
      status: offer.offer_status,
      published:
        offer.offer_status === "published" ||
        offer.offer_status === "selected",
      originalOffer: offer,
    }));
  }
  return [];
});

const hasOffers = computed(() => offersData.value.length > 0);

const acceptedOffer = computed(() => {
  return offersData.value.find((o) => o.accepted);
});

const primaryDriverName = computed(() => {
  if (orderPayload.value?.ansprechpartner?.name) {
    return orderPayload.value.ansprechpartner.name;
  }
  return (
    props.vehicle.company_name || props.vehicle.user_name || "Marcus Dietrich"
  );
});

const primaryDriverInitial = computed(() => {
  return primaryDriverName.value[0].toUpperCase();
});

const primaryDriverPhone = computed(() => {
  if (orderPayload.value?.ansprechpartner?.telefon) {
    return orderPayload.value.ansprechpartner.telefon;
  }
  return "17655874354";
});

const primaryDriverAddress = computed(() => {
  if (orderPayload.value?.besichtigungsort) {
    return `${orderPayload.value.besichtigungsort.strasse}, ${orderPayload.value.besichtigungsort.plz} ${orderPayload.value.besichtigungsort.ort}`;
  }
  return "Radestraße 12, 35037 Marburg";
});

const lastActivityDate = computed(() => {
  if (firstOrder.value?.created_at) {
    return new Date(firstOrder.value.created_at).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
  return null;
});

const lastActivityStatus = computed(() => {
  if (firstOrder.value?.order_status) {
    return firstOrder.value.order_status.replace("_", " ");
  }
  return null;
});

const fullVehicleDetails = computed(() => {
  return (
    props.expandedVehicleDetails[props.vehicle.vehicle_id] || props.vehicle
  );
});

// Get current documents for this vehicle
const currentDocuments = computed(() => {
  return props.documents[props.vehicle.vehicle_id] || [];
});

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

  for (const doc of currentDocuments.value) {
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

async function deleteDocument(documentId: string) {
  try {
    if (!props.vehicle?.vehicle_id) return;
    await vehicleApi.deleteVehicleDocument(
      props.vehicle.vehicle_id,
      documentId,
    );
    emit("refreshDocs");
  } catch (err) {
    console.error("Failed to delete vehicle document:", err);
  }
}

async function publishDocument(documentId: string) {
  try {
    await adminVehiclesApi.publishReport(documentId, true);
    emit("refreshDocs");
  } catch (err) {
    console.error("Failed to publish document:", err);
  }
}
</script>

<template>
  <TableRow class="border-0 hover:bg-transparent">
    <TableCell colspan="8" class="max-w-0 p-0 overflow-visible">
      <!-- Main container with 3 columns -->
      <div class="flex gap-4 bg-[#EFEFEF] p-4" style="min-width: max-content">
        <!-- Column 1: Timeline + Vehicle Docs + Return Docs -->
        <div class="flex flex-col gap-4" style="width: 320px">
          <!-- Timeline Card -->
          <div
            class="flex flex-col overflow-hidden rounded-3xl border bg-white"
            style="border-color: #ececec"
          >
            <div class="px-6 py-5 flex items-center justify-between">
              <p
                class="text-[16px] font-bold text-[#000000] leading-tight uppercase"
              >
                {{ timelineData[0]?.label || "STATUS: KEINE AUFTRÄGE" }}
              </p>
              <button class="text-[#01b990] hover:opacity-70">
                <Icon icon="mdi:dots-vertical" class="size-4.5" />
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
                  class="absolute left-2 top-5 w-0.5 h-full"
                  :style="
                    entry.completed
                      ? 'background:#01B990'
                      : 'background:#B7C2C2'
                  "
                />

                <!-- Dot -->
                <div
                  class="relative z-10 w-4 h-4 shrink-0 rounded-full mt-1"
                  :style="
                    entry.completed
                      ? 'background:#01B990'
                      : 'background:#B7C2C2'
                  "
                />

                <!-- Content -->
                <div class="min-w-0 flex-1 pl-5">
                  <!-- Date/time -->
                  <p class="text-[14px] text-[#2e3e3f] font-medium mb-1">
                    {{ entry.datetime.replace("\n", " - ") }}
                  </p>

                  <!-- Label -->
                  <template
                    v-if="entry.label === 'DEKRA' || entry.label === 'TUVSUD'"
                  >
                    <p
                      class="text-[16px] font-bold mb-1"
                      style="color: #01b990"
                    >
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
          <div class="flex flex-col gap-4">
            <div
              class="relative flex flex-col rounded-[16px] border bg-white"
              style="border-color: #ececec"
            >
              <button
                @click="uploadDocsOpen = true"
                class="absolute right-5 top-5 transition-opacity hover:opacity-60"
              >
                <Icon
                  icon="mdi:pencil"
                  class="size-[18.5px] shrink-0"
                  style="color: #01b990"
                />
              </button>
              <div class="p-6">
                <p class="text-[16px] font-semibold uppercase text-[#000000]">
                  Vehicle Docs
                </p>
                <div class="h-px bg-gray-200 mt-2"></div>
              </div>

              <div class="flex flex-col gap-4 p-6 pt-0">
                <div
                  v-for="group in groupedDocuments"
                  :key="group.key"
                  class="flex flex-col gap-3"
                >
                  <div v-if="group.key !== 'gutachten'">
                    <p
                      class="text-[16px] font-semibold uppercase text-[#000000]"
                    >
                      {{ group.title }}
                    </p>
                    <div class="h-px bg-gray-200 mt-2"></div>
                  </div>
                  <div
                    v-for="(doc, i) in group.items"
                    :key="doc.id || i"
                    class="flex items-center justify-between gap-3"
                  >
                    <div class="flex items-center gap-2 flex-1 min-w-0">
                      <span
                        class="text-[14px] font-normal text-[#475569] truncate"
                        :title="doc.file_name || doc.document_type || 'Dokument'"
                      >
                        {{ doc.file_name || doc.document_type || "Dokument" }}
                      </span>
                      <span
                        v-if="doc.is_report && doc.published"
                        class="text-[10px] font-bold text-[#01b990] uppercase"
                      >
                        Published
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <a
                        v-if="doc.url"
                        :href="doc.url"
                        target="_blank"
                        class="text-[#01b990] hover:opacity-70 flex-shrink-0"
                      >
                        <Icon
                          icon="material-symbols:download"
                          class="size-[18.5px] shrink-0"
                        />
                      </a>
                      <button
                        v-if="doc.is_report && !doc.published"
                        @click="publishDocument(doc.id)"
                        class="text-[#01b990] hover:opacity-70 flex-shrink-0"
                        title="Publish"
                      >
                        <Icon
                          icon="mdi:eye-outline"
                          class="size-[18.5px] shrink-0"
                        />
                      </button>
                      <button
                        @click="deleteDocument(doc.id)"
                        class="text-[#EF4444] hover:opacity-70 flex-shrink-0"
                      >
                        <Icon
                          icon="mdi:delete-outline"
                          class="size-[18.5px] shrink-0"
                        />
                      </button>
                    </div>
                  </div>
                </div>
                <div
                  v-if="currentDocuments.length === 0"
                  class="text-[14px] text-[#b7c2c2]"
                >
                  Keine Dokumente gefunden
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Column 2: Angebote (Offers) -->
        <div class="flex flex-col gap-4" style="width: 400px">
          <div class="relative">
            <div
              class="flex flex-col rounded-[16px] border bg-white overflow-visible"
              style="border-color: #ececec"
            >
              <div class="px-6 py-6">
                <p class="text-[16px] font-bold" style="color: #2e3e3f">
                  Angebote
                </p>
              </div>

              <!-- Empty state -->
              <div
                v-if="!hasOffers"
                class="flex flex-col items-center justify-center gap-2 px-6 py-8 text-center"
              >
                <Icon
                  icon="mdi:file-document-outline"
                  class="size-8"
                  style="color: #cbd5e1"
                />
                <p class="text-[14px] font-semibold" style="color: #2e3e3f">
                  Keine Angebote
                </p>
                <p class="text-[12px]" style="color: #b7c2c2">
                  Bitte zuerst ein Angebot erstellen.
                </p>
              </div>

              <!-- Offer rows -->
              <div v-else class="flex flex-col gap-5 px-6 overflow-visible">
                <div
                  v-for="offer in offersData"
                  :key="offer.id"
                  class="flex items-center gap-4 rounded-[50px] border py-2 px-4 relative"
                  :style="
                    offer.accepted
                      ? 'border-color: #EF8450; background: rgba(239, 132, 80, 0.08)'
                      : 'border-color: #ECECEC; background: white'
                  "
                >
                  <!-- Publish toggle (minimal button in front of each offer) -->
                  <button
                    v-if="offer.originalOffer"
                    @click.stop="
                      !offer.published &&
                        publishOffer(offer.originalOffer.offer_id)
                    "
                    :disabled="
                      offer.published ||
                      publishingId === offer.originalOffer.offer_id
                    "
                    class="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full transition-colors disabled:cursor-default"
                    :style="
                      offer.published
                        ? 'background:#01B990;color:#fff'
                        : 'background:#F0F4F4;color:#01B990'
                    "
                    :title="
                      offer.published
                        ? 'Veröffentlicht'
                        : 'Angebot veröffentlichen'
                    "
                  >
                    <Icon
                      :icon="
                        publishingId === offer.originalOffer.offer_id
                          ? 'mdi:loading'
                          : offer.published
                            ? 'mdi:check'
                            : 'mdi:eye-outline'
                      "
                      class="size-4"
                      :class="{
                        'animate-spin':
                          publishingId === offer.originalOffer.offer_id,
                      }"
                    />
                  </button>

                  <!-- Selection indicator (read-only for admin; only the
                       B2B/B2C customer can select an offer) -->
                  <div
                    class="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1"
                    :style="
                      offer.accepted
                        ? 'border-color: #EF8450; background: #EF8450'
                        : 'border-color: #B7C2C2; background: white'
                    "
                    :title="offer.accepted ? 'Vom Kunden ausgewählt' : ''"
                  >
                    <div
                      v-if="offer.accepted"
                      class="w-4.5 h-4.5 rounded-full bg-white"
                    ></div>
                  </div>

                  <!-- Content -->
                  <div
                    class="flex flex-col gap-1 flex-1 min-w-0 overflow-hidden"
                  >
                    <div class="flex justify-between items-start gap-3">
                      <p
                        class="text-[14px] font-bold flex-1 min-w-0 truncate"
                        :style="
                          offer.accepted ? 'color: #2e3e3f' : 'color: #B7C2C2'
                        "
                        :title="`${offer.id} - ${offer.name}`"
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
                      <p
                        class="text-[12px] flex-1 truncate"
                        style="color: #b7c2c2"
                      >
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

                  <!-- 3-dot menu -->
                  <div class="relative">
                    <button
                      @click.stop="
                        openOfferMenu =
                          openOfferMenu === offer.id ? null : offer.id
                      "
                      class="text-[#B7C2C2] hover:text-[#2e3e3f] transition-colors"
                    >
                      <Icon icon="mdi:dots-vertical" class="size-5" />
                    </button>
                    <div
                      v-if="openOfferMenu === offer.id"
                      class="absolute right-0 top-full mt-1 z-50 bg-white rounded-[12px] border border-[#ececec] shadow-lg min-w-[180px] py-2"
                    >
                      <!-- Publish -->
                      <button
                        v-if="offer.originalOffer"
                        @click.stop="
                          publishOffer(offer.originalOffer.offer_id);
                          openOfferMenu = null;
                        "
                        class="w-full text-left px-4 py-2 text-sm text-[#01b990] hover:bg-[#f6f9f8] transition-colors"
                      >
                        <span class="flex items-center gap-2">
                          <Icon icon="mdi:eye-outline" class="size-4" />
                          Publish
                        </span>
                      </button>
                      <!-- Update -->
                      <!-- <button
                        class="w-full text-left px-4 py-2 text-sm text-[#2e3e3f] hover:bg-[#f6f9f8] transition-colors"
                        @click.stop="openOfferMenu = null"
                      >
                        <span class="flex items-center gap-2">
                          <Icon icon="mdi:pencil" class="size-4" />
                          Update
                        </span>
                      </button> -->
                      <!-- Cancel (not available for selected or already cancelled offers) -->
                      <div class="h-px bg-[#ececec] my-1"></div>
                      <button
                        v-if="
                          offer.originalOffer &&
                          offer.status !== 'cancelled' &&
                          offer.status !== 'selected'
                        "
                        @click.stop="
                          requestCancel(offer.originalOffer.offer_id);
                          openOfferMenu = null;
                        "
                        class="w-full text-left px-4 py-2 text-sm text-[#EF4444] hover:bg-[#f6f9f8] transition-colors"
                      >
                        <span class="flex items-center gap-2">
                          <Icon icon="mdi:cancel" class="size-4" />
                          Cancel
                        </span>
                      </button>
                      <div
                        v-else-if="offer.status === 'cancelled'"
                        class="px-4 py-2 text-sm text-[#B7C2C2] flex items-center gap-2"
                      >
                        <Icon icon="mdi:cancel" class="size-4" />
                        Cancelled
                      </div>
                      <div
                        v-else-if="offer.status === 'selected'"
                        class="px-4 py-2 text-sm text-[#01b990] flex items-center gap-2"
                      >
                        <Icon icon="mdi:check-circle-outline" class="size-4" />
                        Selected
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Accept button -->
              <div v-if="hasOffers" class="mt-6 px-6 pb-6">
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
        </div>

        <!-- Column 3: Assigned To + Vehicle Specs -->
        <div class="flex flex-col 2xl:flex-row gap-4 w-[325px] 2xl:w-full">
          <!-- Assigned To Card -->
          <div
            class="relative flex flex-col rounded-[24px] border bg-white p-8 min-w-[325px]"
            style="border-color: #ececec"
          >
            <button
              @click="uploadDocsOpen = true"
              class="absolute right-5 top-5 transition-opacity hover:opacity-60"
            >
              <Icon
                icon="material-symbols-light:edit"
                class="size-6 shrink-0"
                style="color: #01b990"
              />
            </button>
            <div class="pb-6">
              <p
                class="text-[16px] font-normal uppercase"
                style="color: #2e3e3f"
              >
                Assigned To
              </p>
            </div>

            <!-- Avatar + Name row -->
            <div class="flex items-start gap-6 pb-6" v-if="hasOrderData">
              <Avatar class="size-[64px] shrink-0">
                <AvatarFallback
                  class="text-xl font-bold"
                  style="background-color: #d9d9d9; color: #2e3e3f"
                >
                  {{ primaryDriverInitial }}
                </AvatarFallback>
              </Avatar>
              <div class="flex flex-col gap-2 pt-2">
                <p class="text-[16px] font-bold" style="color: #2e3e3f">
                  {{ primaryDriverName }}
                </p>
                <p class="text-[12px] font-semibold" style="color: #01b990">
                  Primary Driver
                </p>
              </div>
            </div>
            <div class="flex items-start gap-6 pb-6" v-else>
              <Avatar class="size-[64px] shrink-0">
                <AvatarFallback
                  class="text-xl font-bold"
                  style="background-color: #d9d9d9; color: #2e3e3f"
                >
                  M
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
              <div
                class="flex items-center justify-between pt-2"
                v-if="lastActivityDate"
              >
                <p class="text-[14px] font-normal" style="color: #2e3e3f">
                  {{ lastActivityDate }}
                  · Order placed
                </p>
                <p class="text-[14px] font-bold" style="color: #2e3e3f">
                  {{ lastActivityStatus }}
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
            <div class="flex flex-col gap-4" v-if="hasOrderData">
              <div class="flex items-center gap-4">
                <Icon
                  icon="mdi:phone-outline"
                  class="size-[18px] shrink-0"
                  style="color: #5a6b7a"
                />
                <span class="text-[14px] font-normal" style="color: #2e3e3f">
                  {{ primaryDriverPhone }}
                </span>
              </div>
              <div class="flex items-center gap-4">
                <Icon
                  icon="mdi:map-marker-outline"
                  class="size-[18px] shrink-0"
                  style="color: #5a6b7a"
                />
                <span class="text-[14px] font-normal" style="color: #2e3e3f">
                  {{ primaryDriverAddress }}
                </span>
              </div>
            </div>
            <div class="flex flex-col gap-4" v-else>
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
            class="relative flex flex-col overflow-hidden rounded-3xl border bg-white min-w-[325px]"
            style="border-color: #ececec"
          >
            <button
              @click="editVehicleOpen = true"
              class="absolute right-6 top-6 transition-opacity hover:opacity-60"
            >
              <Icon
                icon="mdi:pencil"
                class="size-5 shrink-0"
                style="color: #01b990"
              />
            </button>
            <div class="px-6 pt-6">
              <p class="text-[18px] font-bold" style="color: #000">
                VEHICLE SPECS
              </p>
            </div>

            <div class="flex flex-col gap-0 px-6 pt-4 pb-6">
              <div class="flex items-center justify-between py-4">
                <span class="text-[16px] font-normal" style="color: #64748b">
                  License Plate
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
                  Kilometerstand
                </span>
                <span class="text-[16px] font-semibold" style="color: #000">
                  {{
                    fullVehicleDetails.kilometerstand ||
                    vehicle.kilometerstand ||
                    "N/A"
                  }}
                </span>
              </div>
              <div class="h-px bg-gray-200"></div>
              <div class="flex items-center justify-between py-4">
                <span class="text-[16px] font-normal" style="color: #64748b">
                  Leasinggeber
                </span>
                <span class="text-[16px] font-semibold" style="color: #000">
                  {{
                    fullVehicleDetails.leasinggeber ||
                    vehicle.leasinggeber ||
                    "N/A"
                  }}
                </span>
              </div>
              <div class="h-px bg-gray-200"></div>
              <div class="flex items-center justify-between py-4">
                <span class="text-[16px] font-normal" style="color: #64748b">
                  Return Deadline
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
  <AddVehicleModal v-model:open="editVehicleOpen" :vehicle="vehicle as any" />
  <UploadDocumentModal
    v-model:open="uploadDocsOpen"
    :vehicleId="vehicle.vehicle_id"
    @uploaded="emit('refreshDocs')"
    @changed="emit('refreshDocs')"
  />

  <!-- Cancel offer reason dialog -->
  <div
    v-if="cancelOfferId"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/5 p-4"
    @click="closeCancel"
  >
    <div
      class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
      @click.stop
    >
      <h3 class="text-[18px] font-bold text-[#2e3e3f]">Angebot stornieren</h3>
      <p class="mt-2 text-[14px] text-[#5a6b7a]">
        Bitte geben Sie einen Grund für die Stornierung an.
      </p>
      <textarea
        v-model="cancelReason"
        rows="3"
        placeholder="Stornierungsgrund..."
        class="mt-4 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none resize-none focus:border-emerald-500"
      ></textarea>
      <div class="mt-5 flex justify-end gap-3">
        <button
          @click="closeCancel"
          :disabled="cancelling"
          class="px-5 py-2.5 rounded-full text-[14px] font-medium text-[#2e3e3f] border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          Abbrechen
        </button>
        <button
          @click="confirmCancel"
          :disabled="cancelling || !cancelReason.trim()"
          class="px-5 py-2.5 rounded-full text-[14px] font-semibold text-white disabled:opacity-50"
          style="background: #ef4444"
        >
          {{ cancelling ? "Wird storniert..." : "Stornieren" }}
        </button>
      </div>
    </div>
  </div>
</template>
