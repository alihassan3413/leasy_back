<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue";
import { Icon } from "@iconify/vue";
import type { Vehicle, Offer, Order } from "./vehicle.types";
import AddVehicleModal from "./modals/AddVehicleModal.vue";
import UploadDocumentModal from "./modals/UploadDocumentModal.vue";
import { vehicleApi, customerOffersApi } from "@/api";
import { useVehicleStore } from "@/stores/vehicle.store";
import { useB2BVehicleStore } from "@/stores/b2bVehicle.store";
import { useAuthStore } from "@/stores/auth.store";
import { getOrderStatusLabel } from "@/lib/status";
import { getUpcomingSteps } from "@/lib/timeline";
import {
  getCustomerOrderFlowSteps,
  getCustomerOrderHeadline,
  formatGermanDateTime,
  CUSTOMER_PAYMENT_FEATURE_ENABLED,
  type CustomerOrderOffer,
} from "@/lib/customerOrderFlow";
import OrderStatusTimeline from "@/components/shared/OrderStatusTimeline.vue";

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

// Helper to get the actual document type key for grouping (checks title first)
function getDocumentTypeKey(doc: any): string {
  const docTitle =
    `${doc?.document_title ?? ""} ${doc?.file_name ?? ""} ${doc?.title ?? ""}`.toLowerCase();

  // Check all document types from DOCUMENT_TYPE_LABELS
  for (const [type] of Object.entries(DOCUMENT_TYPE_LABELS)) {
    if (
      docTitle.includes(type) ||
      docTitle.includes(
        DOCUMENT_TYPE_LABELS[type as keyof typeof DOCUMENT_TYPE_LABELS].toLowerCase(),
      )
    ) {
      return type;
    }
  }

  return (doc?.document_type ?? "").trim().toLowerCase() || "__other__";
}

// Report documents (Gutachten/Nachgutachten) are surfaced in the order
// timeline, not in the "Fahrzeugdokumente" card. This helper identifies them
// so they can be filtered out of the documents card. Invoices (Rechnung) and
// other document types stay in the card.
function isReportLike(doc: any): boolean {
  const type = (doc?.document_type ?? "").trim().toLowerCase();
  if (type === "gutachten" || type === "nachgutachten" || type === "report") return true;
  const title =
    `${doc?.file_name ?? ""} ${doc?.document_title ?? ""} ${doc?.title ?? ""}`.toLowerCase();
  return title.includes("gutachten") || title.includes("nachgutachten") || title.includes("report");
}

// Group documents by their document_type so each type renders under its own
// heading. Order of groups follows first appearance in the documents list.
// Report/Gutachten documents are excluded here — they live in the timeline.
const groupedDocuments = computed(() => {
  const groups: { key: string; title: string; items: any[] }[] = [];
  const indexByKey = new Map<string, number>();

  for (const doc of documents.value) {
    if (isReportLike(doc)) continue;
    const key = getDocumentTypeKey(doc);
    let idx = indexByKey.get(key);
    if (idx === undefined) {
      idx = groups.length;
      indexByKey.set(key, idx);
      groups.push({
        key,
        title: documentTypeLabel(key),
        items: [],
      });
    }
    groups[idx].items.push(doc);
  }

  return groups;
});

// Documents whose type is a report (Gutachten/Nachgutachten) or invoice
// (Rechnung) are uploaded by admins and must NOT be deletable by B2B/B2C users.
// Only the vehicle documents the user uploads themselves can be deleted.
const NON_DELETABLE_DOCUMENT_TYPES = new Set([
  "gutachten",
  "nachgutachten",
  "rechnung",
  "report",
  "invoice",
]);

function canDeleteDocument(doc: any): boolean {
  // Admin-uploaded reports/invoices carry the is_report flag.
  if (doc?.is_report) return false;
  // Match by canonical document_type ...
  const type = (doc?.document_type ?? "").trim().toLowerCase();
  if (NON_DELETABLE_DOCUMENT_TYPES.has(type)) return false;
  // ... and, as a fallback, by the document title/file name (mirrors the admin
  // logic), since report/invoice docs don't always carry a canonical type.
  const title =
    `${doc?.file_name ?? ""} ${doc?.document_title ?? ""} ${doc?.title ?? ""}`.toLowerCase();
  return !(
    title.includes("gutachten") ||
    title.includes("nachgutachten") ||
    title.includes("rechnung") ||
    title.includes("report") ||
    title.includes("invoice")
  );
}

function getDocumentDisplayText(doc: any): string {
  // Run the raw type through the label map so German nouns render capitalized
  // (e.g. "rechnung" → "Rechnung").
  if (doc.document_type) return documentTypeLabel(doc.document_type);
  return "Dokument";
}

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

// The first order is the current/active one this card reports on.
const firstOrder = computed(() => props.vehicle.orders?.[0] ?? null);

// Published offers fetched from the customer offers endpoint — kept in their
// raw API shape (status/published_at/selected_at) so the flow below can
// resolve stages 4/5 with real dates, alongside a display-mapped copy for
// the "Angebote" card.
const rawOffers = ref<CustomerOrderOffer[]>([]);
const realOffers = ref<Offer[]>([]);
const selectingOfferId = ref<string | null>(null);

const auftragsnummer = computed(() => firstOrder.value?.auftragsnummer || "");

// Inspection location (Besichtigungsort) comes from the first order's request payload.
const besichtigungsort = computed(() => firstOrder.value?.request_payload?.besichtigungsort ?? null);

const terminFormatted = computed(() => {
  const termin = besichtigungsort.value?.termin;
  if (!termin) return "";
  return formatGermanDateTime(termin);
});

const hasRealOffers = computed(() => realOffers.value.length > 0);

// Report documents live on every order the vehicle has ever had (mirrors the
// previous behavior of scanning all orders, not just the current one).
const allReportDocuments = computed(() =>
  (props.vehicle.orders ?? []).flatMap((order) => order.report_documents ?? []),
);

// The 8-step customer flow (completed/current/future), or `null` when there's
// no order / the order_status is entirely unrecognized — in which case the
// legacy display below is used unchanged.
const customerFlowSteps = computed(() => {
  const order = firstOrder.value;
  if (!order) return null;
  return getCustomerOrderFlowSteps({
    orderStatus: order.order_status,
    orderCreatedAt: order.created_at,
    statusHistory: order.status_updates ?? [],
    besichtigungsort: order.request_payload?.besichtigungsort,
    reportDocuments: allReportDocuments.value,
    offers: rawOffers.value,
  });
});

const customerHeadline = computed(() => getCustomerOrderHeadline(customerFlowSteps.value));

// Card title (the timeline's first entry) and the remaining rows, formatted
// for the shared <OrderStatusTimeline> component.
const timelineHeaderLabel = computed(() => {
  if (!firstOrder.value) return "STATUS: KEINE AUFTRÄGE";
  const headline = customerHeadline.value;
  return `STATUS: ${(headline?.label ?? getOrderStatusLabel(firstOrder.value.order_status).label).toUpperCase()}`;
});
const timelineHeaderTooltipDescription = computed(() => customerHeadline.value?.tooltipDescription);

const timelineEntries = computed(() => {
  if (!firstOrder.value) {
    return [{ datetime: "", label: "Keine Aufträge vorhanden", completed: false }];
  }

  if (customerFlowSteps.value) {
    return customerFlowSteps.value.map((step) => ({
      datetime: step.datetime ? formatGermanDateTime(step.datetime) : "",
      label: step.label,
      sublabel: step.subtitle || undefined,
      tooltipDescription: step.tooltipDescription,
      completed: step.completed || step.isCurrent,
      isFuture: !(step.completed || step.isCurrent) && !step.isCancelled && !step.isRejected,
      isNext: step.isNext,
      isCurrent: step.isCurrent,
      isCancelled: step.isCancelled,
      isRejected: step.isRejected,
      isReport: !!(step.reportDocUrl || step.invoiceDocUrl || step.showPaymentAction),
      docUrl: step.reportDocUrl,
      invoiceUrl: step.invoiceDocUrl,
      showPaymentAction: step.showPaymentAction,
    }));
  }

  // Legacy fallback for order_status values the new mapper can't resolve.
  return getUpcomingSteps(firstOrder.value.order_status).map((step, idx) => ({
    datetime: "",
    label: step.label,
    completed: false,
    isFuture: true,
    isNext: idx === 0,
  }));
});

async function loadOffers() {
  if (!auftragsnummer.value) {
    realOffers.value = [];
    rawOffers.value = [];
    return;
  }
  try {
    const res = await customerOffersApi.list(auftragsnummer.value);
    const nonCancelled = (res.offers || []).filter((offer) => offer.offer_status !== "cancelled");
    rawOffers.value = nonCancelled;
    realOffers.value = nonCancelled.map((offer) => ({
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
      // Workshop distance data is not available yet; surface the offer note
      // (backend field `additional_notes`) instead when present.
      note: offer.additional_notes ?? "",
    }));
  } catch (err) {
    console.error("Failed to load customer offers:", err);
    realOffers.value = [];
    rawOffers.value = [];
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

async function loadDocuments() {
  try {
    const allDocuments: any[] = [];

    // First add documents from API
    if (props.vehicle?.vehicle_id) {
      try {
        const apiDocs = await vehicleApi.getVehicleDocuments(props.vehicle.vehicle_id);
        allDocuments.push(...apiDocs);
      } catch (err) {
        console.error("Failed to load API documents:", err);
      }
    }

    // Then add report documents from orders
    if (props.vehicle?.orders) {
      props.vehicle.orders.forEach((order) => {
        if (order.report_documents) {
          order.report_documents.forEach((doc) => {
            const cleanS3Url = doc.s3_url?.trim().replace(/^`|`$/g, "");
            allDocuments.push({
              id: doc.id,
              document_type: doc.document_type,
              file_name: doc.document_title,
              created_at: doc.created_at,
              // Order report documents are admin-uploaded (reports/invoices);
              // flag them so users cannot delete them.
              is_report: true,
              url:
                cleanS3Url ||
                (doc.s3_bucket && doc.s3_key
                  ? `https://${doc.s3_bucket}.s3.amazonaws.com/${doc.s3_key}`
                  : ""),
            });
          });
        }
      });
    }

    documents.value = allDocuments;
  } catch (err) {
    console.error("Failed to load vehicle documents:", err);
    documents.value = [];
  }
}

async function deleteDocument(documentId: string) {
  try {
    if (!props.vehicle?.vehicle_id) return;
    await vehicleApi.deleteVehicleDocument(props.vehicle.vehicle_id, documentId);
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
  void loadOffers();
});

watch(
  () => props.vehicle?.vehicle_id,
  () => {
    void loadDocuments();
    void loadOffers();
  },
);
</script>

<template>
  <!-- Desktop: Table layout -->
  <TableRow class="border-0 hover:bg-transparent hidden md:table-row">
    <TableCell colspan="12" class="max-w-0 p-0 overflow-x-auto whitespace-normal">
      <!-- Main container: responsive masonry — cards pack into columns and fill vertical gaps -->
      <div
        class="columns-1 md:columns-2 2xl:columns-3 gap-4 bg-[#EFEFEF] p-4 *:mb-4 *:break-inside-avoid"
      >
        <!-- Timeline Card -->
        <div
          class="flex flex-col overflow-hidden rounded-3xl border bg-white w-full"
          style="border-color: #ececec"
        >
          <OrderStatusTimeline
            :entries="timelineEntries"
            :header-label="timelineHeaderLabel"
            :header-tooltip-description="timelineHeaderTooltipDescription"
          >
            <template #actions="{ entry }">
              <template v-if="entry.docUrl">
                <a
                  :href="entry.docUrl"
                  target="_blank"
                  rel="noopener"
                  class="text-[#01b990] hover:opacity-70"
                  title="Gutachten herunterladen"
                >
                  <Icon icon="material-symbols:download" class="size-[18.5px] shrink-0" />
                </a>
                <a
                  :href="entry.docUrl"
                  target="_blank"
                  rel="noopener"
                  class="text-[#01b990] hover:opacity-70"
                  title="Gutachten öffnen"
                >
                  <Icon icon="mdi:open-in-new" class="size-[18.5px] shrink-0" />
                </a>
              </template>
              <a
                v-if="entry.invoiceUrl"
                :href="entry.invoiceUrl"
                target="_blank"
                rel="noopener"
                class="text-[#01b990] hover:opacity-70"
                title="Rechnung ansehen"
              >
                <Icon icon="mdi:receipt-text-outline" class="size-[18.5px] shrink-0" />
              </a>
              <button
                v-if="entry.showPaymentAction"
                type="button"
                :disabled="!CUSTOMER_PAYMENT_FEATURE_ENABLED"
                class="text-[#01b990] hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Bezahlen (bald verfügbar)"
              >
                <Icon icon="mdi:credit-card-outline" class="size-[18.5px] shrink-0" />
              </button>
            </template>
          </OrderStatusTimeline>
        </div>

        <!-- Vehicle Docs Card -->
        <div class="flex flex-col gap-4 w-full">
          <div
            class="relative flex flex-col rounded-[16px] border bg-white"
            style="border-color: #ececec"
          >
            <button
              @click="uploadDocsOpen = true"
              class="absolute right-5 top-5 transition-opacity hover:opacity-60"
            >
              <Icon
                icon="mdi:file-upload-outline"
                class="size-[18.5px] shrink-0"
                style="color: #01b990"
              />
            </button>
            <div class="p-6">
              <p class="text-[16px] font-bold uppercase" style="color: #2e3e3f">
                Fahrzeugdokumente
              </p>
              <div class="h-px bg-gray-200 mt-2"></div>
            </div>

            <div class="flex flex-col gap-5 p-6 pt-0">
              <div v-for="group in groupedDocuments" :key="group.key" class="flex flex-col gap-3">
                <div>
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
                    :title="getDocumentDisplayText(doc)"
                  >
                    {{ getDocumentDisplayText(doc) }}
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
                      v-if="canDeleteDocument(doc)"
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
        <!-- Angebote (Offers) -->
        <div class="relative w-full">
          <div
            class="flex flex-col rounded-[16px] border bg-white"
            :style="hasRealOffers ? 'border-color: #ececec' : 'border-color: #ececec; opacity: 0.5'"
          >
            <div class="px-6 py-6">
              <p class="text-[16px] font-bold uppercase" style="color: #2e3e3f">Angebote</p>
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
                <div class="flex flex-col gap-1 flex-1 min-w-0 overflow-hidden py-1">
                  <div class="flex justify-between items-center gap-3">
                    <p
                      class="text-[14px] font-bold flex-1 min-w-0 truncate"
                      :style="offer.accepted ? 'color: #2e3e3f' : 'color: #2e3e3f'"
                      :title="`${offer.id} - ${offer.name}`"
                    >
                      {{ offer.id }} - {{ offer.name }}
                    </p>
                    <p
                      class="text-[16px] font-semibold flex-shrink-0"
                      :style="offer.accepted ? 'color: #EF8450' : 'color: #2e3e3f'"
                    >
                      {{ offer.cost.toLocaleString("de-DE") }} €
                    </p>
                  </div>
                  <!-- Workshop distance is not available yet — show the offer
                         note when present, otherwise a clean German fallback. -->
                  <p
                    class="text-[12px] leading-snug line-clamp-2"
                    :class="{ 'cursor-help': offer.note && offer.note.trim() }"
                    :title="offer.note && offer.note.trim() ? offer.note.trim() : undefined"
                    style="color: #8f9ba7"
                  >
                    {{
                      (offer.note && offer.note.trim()) ||
                      "Weitere Informationen zum Angebot folgen."
                    }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Accept button -->
            <div class="mt-6 px-6 pb-6">
              <button
                class="w-full rounded-[50px] py-4 text-[12px] font-semibold uppercase tracking-wide"
                style="background: #e0e0e0; color: #9e9e9e"
              >
                Angebot annehmen
              </button>
            </div>

            <!-- Accepted offer box -->
            <div v-if="acceptedOffer" class="px-6 pb-6 pt-5">
              <div
                class="flex items-center justify-between gap-3 rounded-[50px] px-7 py-2.5"
                style="background: #ef8450"
              >
                <span class="min-w-0 flex-1 text-[13px] font-normal leading-snug text-white">
                  Angenommenes Angebot: {{ acceptedOffer.id }} {{ acceptedOffer.name }}
                </span>
                <span class="shrink-0 whitespace-nowrap text-[15px] font-normal text-white">
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
        <!-- Besichtigungsort Card -->
        <div
          class="relative flex flex-col rounded-[24px] border bg-white p-6 w-full"
          style="border-color: #ececec"
        >
          <div class="pb-6">
            <p class="text-[16px] font-bold uppercase" style="color: #2e3e3f">Besichtigungsort</p>
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
              <p
                class="text-[18px] font-bold min-w-0 flex-1 wrap-break-word"
                style="color: #2e3e3f"
              >
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

        <!-- Vehicle Specs Card -->
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
            <p class="text-[16px] font-bold uppercase" style="color: #000">FAHRZEUGDATEN</p>
          </div>

          <div class="flex flex-col gap-0 px-6 pt-4 pb-6">
            <div class="flex items-center justify-between py-4">
              <span class="text-[16px] font-normal" style="color: #64748b"> Kennzeichen </span>
              <span class="text-[16px] font-semibold" style="color: #000">
                {{ vehicle.license_plate }}
              </span>
            </div>
            <div class="h-px bg-gray-200"></div>
            <div class="flex items-center justify-between py-4">
              <span class="text-[16px] font-normal" style="color: #64748b"> Modell </span>
              <span class="text-[16px] font-semibold" style="color: #000">
                {{ vehicle.make }} {{ vehicle.model }}
              </span>
            </div>
            <div class="h-px bg-gray-200"></div>
            <div class="flex items-center justify-between py-4">
              <span class="text-[16px] font-normal" style="color: #64748b"> Leasinggeber </span>
              <span class="text-[16px] font-semibold" style="color: #000">
                {{ vehicle.leasinggeber || "Nicht verfügbar" }}
              </span>
            </div>
            <div class="h-px bg-gray-200"></div>
            <div class="flex items-center justify-between py-4">
              <span class="text-[16px] font-normal" style="color: #64748b"> Rückgabetermin </span>
              <span class="text-[16px] font-semibold" style="color: #000">
                {{ new Date(vehicle.leasing_end_date).toLocaleDateString("de-DE") }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </TableCell>
  </TableRow>

  <!-- Mobile: Stacked layout -->
  <div class="md:hidden bg-[#EFEFEF] p-4 flex flex-col gap-4">
    <!-- Timeline Card -->
    <div
      class="flex flex-col overflow-hidden rounded-3xl border bg-white"
      style="border-color: #ececec"
    >
      <OrderStatusTimeline
        :entries="timelineEntries"
        :header-label="timelineHeaderLabel"
        :header-tooltip-description="timelineHeaderTooltipDescription"
        header-class="px-4 py-4 flex items-center justify-between"
        body-class="flex-1 px-4 pb-4"
        :transform-provider-label="false"
      >
        <template #actions="{ entry }">
          <template v-if="entry.docUrl">
            <a
              :href="entry.docUrl"
              target="_blank"
              rel="noopener"
              class="text-[#01b990] hover:opacity-70"
              title="Gutachten herunterladen"
            >
              <Icon icon="material-symbols:download" class="size-[18.5px] shrink-0" />
            </a>
            <a
              :href="entry.docUrl"
              target="_blank"
              rel="noopener"
              class="text-[#01b990] hover:opacity-70"
              title="Gutachten öffnen"
            >
              <Icon icon="mdi:open-in-new" class="size-[18.5px] shrink-0" />
            </a>
          </template>
          <a
            v-if="entry.invoiceUrl"
            :href="entry.invoiceUrl"
            target="_blank"
            rel="noopener"
            class="text-[#01b990] hover:opacity-70"
            title="Rechnung ansehen"
          >
            <Icon icon="mdi:receipt-text-outline" class="size-[18.5px] shrink-0" />
          </a>
          <button
            v-if="entry.showPaymentAction"
            type="button"
            :disabled="!CUSTOMER_PAYMENT_FEATURE_ENABLED"
            class="text-[#01b990] hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Bezahlen (bald verfügbar)"
          >
            <Icon icon="mdi:credit-card-outline" class="size-[18.5px] shrink-0" />
          </button>
        </template>
      </OrderStatusTimeline>
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
          icon="mdi:file-upload-outline"
          class="size-[18.5px] shrink-0"
          style="color: #01b990"
        />
      </button>
      <div class="p-4">
        <p class="text-[16px] font-bold uppercase" style="color: #2e3e3f">Fahrzeugdokumente</p>
        <div class="h-px bg-gray-200 mt-2"></div>
      </div>

      <div class="flex flex-col gap-4 p-4 pt-0">
        <div v-for="group in groupedDocuments" :key="group.key" class="flex flex-col gap-3">
          <div>
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
              :title="getDocumentDisplayText(doc)"
            >
              {{ getDocumentDisplayText(doc) }}
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
                v-if="canDeleteDocument(doc)"
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
    <div class="relative">
      <div
        class="flex flex-col rounded-[16px] border bg-white"
        :style="hasRealOffers ? 'border-color: #ececec' : 'border-color: #ececec; opacity: 0.5'"
      >
        <div class="px-4 py-4">
          <p class="text-[16px] font-bold uppercase" style="color: #2e3e3f">Angebote</p>
        </div>

        <!-- Offer rows -->
        <div class="flex flex-col gap-3 px-4">
          <div
            v-for="offer in offersData"
            :key="offer.id"
            class="flex items-center gap-3 rounded-[20px] border py-3 px-3"
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
              :disabled="!hasRealOffers || !!acceptedOffer || selectingOfferId === offer.offer_id"
              class="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 disabled:cursor-default"
              :style="
                offer.accepted
                  ? 'border-color: #EF8450; background: #EF8450'
                  : 'border-color: #B7C2C2; background: white'
              "
              title="Angebot auswählen"
            >
              <div v-if="offer.accepted" class="w-3.5 h-3.5 rounded-full bg-white"></div>
            </button>

            <!-- Content -->
            <div class="flex flex-col gap-1 flex-1 min-w-0 overflow-hidden">
              <div class="flex justify-between items-center gap-2">
                <p
                  class="text-[13px] font-bold flex-1 min-w-0 truncate"
                  style="color: #2e3e3f"
                  :title="`${offer.id} - ${offer.name}`"
                >
                  {{ offer.id }} - {{ offer.name }}
                </p>
                <p
                  class="text-[14px] font-semibold flex-shrink-0"
                  :style="offer.accepted ? 'color: #EF8450' : 'color: #2e3e3f'"
                >
                  {{ offer.cost.toLocaleString("de-DE") }} €
                </p>
              </div>
              <!-- Workshop distance is not available yet — show the offer note
                   when present, otherwise a clean German fallback. -->
              <p
                class="text-[11px] leading-snug line-clamp-2"
                :class="{ 'cursor-help': offer.note && offer.note.trim() }"
                :title="offer.note && offer.note.trim() ? offer.note.trim() : undefined"
                style="color: #8f9ba7"
              >
                {{
                  (offer.note && offer.note.trim()) || "Weitere Informationen zum Angebot folgen."
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- Accepted offer box -->
        <div v-if="acceptedOffer" class="px-4 pb-4 pt-4">
          <div
            class="flex items-center justify-between rounded-[20px] px-4 py-3"
            style="background: #ef8450"
          >
            <span class="min-w-0 flex-1 text-[12px] font-normal leading-snug text-white">
              Angenommenes Angebot: {{ acceptedOffer.id }} {{ acceptedOffer.name }}
            </span>
            <span class="text-[14px] font-normal text-white flex-shrink-0 whitespace-nowrap">
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
        <div class="bg-white/80 px-4 py-2 rounded-full shadow-lg">
          <p class="text-[16px] font-bold" style="color: #ef8450">Keine Angebote</p>
        </div>
      </div>
    </div>

    <!-- Besichtigungsort Card -->
    <div
      class="relative flex flex-col rounded-[24px] border bg-white p-6"
      style="border-color: #ececec"
    >
      <div class="pb-4">
        <p class="text-[16px] font-bold uppercase" style="color: #2e3e3f">Besichtigungsort</p>
      </div>

      <template v-if="besichtigungsort">
        <!-- Name row -->
        <div class="flex items-center gap-4 pb-4">
          <div
            class="flex size-[48px] shrink-0 items-center justify-center rounded-full"
            style="background-color: rgba(1, 185, 144, 0.1)"
          >
            <Icon icon="mdi:office-building-outline" class="size-6" style="color: #01b990" />
          </div>
          <p class="text-[16px] font-bold min-w-0 flex-1 wrap-break-word" style="color: #2e3e3f">
            {{ besichtigungsort.name }}
          </p>
        </div>

        <!-- Termin -->
        <div class="pb-4">
          <p
            class="text-[10px] font-medium uppercase"
            style="color: #8f9ba7; letter-spacing: 0.5px"
          >
            Termin
          </p>
          <div class="flex items-center gap-3 pt-2">
            <Icon
              icon="mdi:calendar-clock-outline"
              class="size-[16px] shrink-0"
              style="color: #5a6b7a"
            />
            <p class="text-[13px] font-bold" style="color: #2e3e3f">
              {{ terminFormatted || "Kein Termin" }}
            </p>
          </div>
        </div>

        <!-- Divider -->
        <div class="h-px bg-gray-200 mb-4"></div>

        <!-- Address -->
        <div class="flex items-start gap-3">
          <Icon
            icon="mdi:map-marker-outline"
            class="size-[16px] shrink-0 mt-0.5"
            style="color: #5a6b7a"
          />
          <span class="text-[13px] font-normal leading-relaxed" style="color: #2e3e3f">
            {{ besichtigungsort.strasse }}<br />
            {{ besichtigungsort.plz }} {{ besichtigungsort.ort }}
            <template v-if="besichtigungsort.land">
              ({{ besichtigungsort.land.toUpperCase() }})
            </template>
          </span>
        </div>
      </template>
      <div v-else class="text-[13px] font-normal" style="color: #b7c2c2">
        Kein Besichtigungsort verfügbar
      </div>
    </div>

    <!-- Vehicle Specs Card -->
    <div
      class="relative flex flex-col overflow-hidden rounded-3xl border bg-white"
      style="border-color: #ececec"
    >
      <button
        @click="editVehicleOpen = true"
        class="absolute right-4 top-4 transition-opacity hover:opacity-60"
      >
        <Icon icon="mdi:pencil" class="size-4 shrink-0" style="color: #01b990" />
      </button>
      <div class="px-4 pt-4">
        <p class="text-[16px] font-bold uppercase" style="color: #000">FAHRZEUGDATEN</p>
      </div>

      <div class="flex flex-col gap-0 px-4 pt-3 pb-4">
        <div class="flex items-center justify-between py-3">
          <span class="text-[14px] font-normal" style="color: #64748b"> Kennzeichen </span>
          <span class="text-[14px] font-semibold" style="color: #000">
            {{ vehicle.license_plate }}
          </span>
        </div>
        <div class="h-px bg-gray-200"></div>
        <div class="flex items-center justify-between py-3">
          <span class="text-[14px] font-normal" style="color: #64748b"> Modell </span>
          <span class="text-[14px] font-semibold" style="color: #000">
            {{ vehicle.make }} {{ vehicle.model }}
          </span>
        </div>
        <div class="h-px bg-gray-200"></div>
        <div class="flex items-center justify-between py-3">
          <span class="text-[14px] font-normal" style="color: #64748b"> Leasinggeber </span>
          <span class="text-[14px] font-semibold" style="color: #000">
            {{ vehicle.leasinggeber || "Nicht verfügbar" }}
          </span>
        </div>
        <div class="h-px bg-gray-200"></div>
        <div class="flex items-center justify-between py-3">
          <span class="text-[14px] font-normal" style="color: #64748b"> Rückgabetermin </span>
          <span class="text-[14px] font-semibold" style="color: #000">
            {{ new Date(vehicle.leasing_end_date).toLocaleDateString("de-DE") }}
          </span>
        </div>
      </div>
    </div>
  </div>

  <!-- Modals -->
  <AddVehicleModal v-model:open="editVehicleOpen" :vehicle="props.vehicle" />
  <UploadDocumentModal
    v-model:open="uploadDocsOpen"
    :vehicleId="props.vehicle.vehicle_id"
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

<style scoped>
/* All interactive buttons should show the pointer cursor. */
button:not(:disabled) {
  cursor: pointer;
}
</style>
