<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { Icon } from "@iconify/vue";
import { TableRow, TableCell } from "@/components/ui/table";
import type { AdminVehicle, Offer, OffersListResponse, VehicleStatusResponse } from "@/types";
import AddVehicleModal from "@/components/dashboard/modals/AddVehicleModal.vue";
import UploadDocumentModal from "@/components/dashboard/modals/UploadDocumentModal.vue";
import { vehicleApi, adminVehiclesApi, adminOffersApi, adminOrdersApi } from "@/api";
import { getOrderStatusLabel } from "@/lib/status";
import { orderProviderLabel } from "@/lib/provider";
import { getUpcomingSteps, timelineDotStyle, timelineLineStyle } from "@/lib/timeline";

const props = defineProps<{
  vehicle: AdminVehicle;
  expandedVehicleDetails: Record<string, any>;
  documents: Record<string, any[]>;
}>();

const emit = defineEmits(["refreshDocs"]);

// The admin vehicle list rows don't include the full nested `orders` (with
// report_documents, status_updates and request_payload), so we fetch the same
// detailed vehicle status the B2B/B2C dashboards build their timeline from.
// `GET /vehicle/list/report/status` returns every vehicle's full orders; as of
// 2026-07-08 the backend serves it to admins too, so the admin timeline can
// render the identical entries B2C shows. We pick this vehicle out of the list.
const detailedVehicle = ref<VehicleStatusResponse | null>(null);

async function fetchVehicleDetail() {
  if (!props.vehicle.vehicle_id) return;
  try {
    const list = await vehicleApi.getVehicleStatus();
    detailedVehicle.value =
      (list || []).find((v) => v.vehicle_id === props.vehicle.vehicle_id) ?? null;
  } catch (err) {
    console.error("Failed to fetch vehicle detail for timeline:", err);
    detailedVehicle.value = null;
  }
}

onMounted(async () => {
  // Await the detailed status first: it carries the full order (incl.
  // response_body) that the vehicle-list row may omit.
  await fetchVehicleDetail();
  // Fetch offers after component is mounted
  if (firstOrder.value?.auftragsnummer) {
    fetchOffers(firstOrder.value.auftragsnummer);
  }
  // Opening the expanded view triggers the TÜV SÜD appraisal sync (if eligible).
  maybeSyncAppraisal();
});

// Refetch when the parent reloads the list (e.g. after an admin status change,
// which yields a new vehicle object with the same id) so the timeline reflects
// the update immediately, not only after collapse/re-expand.
watch(
  () => props.vehicle,
  async () => {
    await fetchVehicleDetail();
    maybeSyncAppraisal();
  },
);

const editVehicleOpen = ref(false);
const uploadDocsOpen = ref(false);

// State for real offers
const realOffers = ref<Offer[]>([]);
const offersLoading = ref(false);
const openOfferMenu = ref<string | null>(null);
const selectingOfferId = ref<string | null>(null);
const pendingOfferId = ref<string | null>(null);

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

// Offer pending confirmation (opens the "are you sure" dialog)
function requestSelect(offerId?: string) {
  console.log("requestSelect called with offerId:", offerId);
  if (!offerId) return;

  // Find the offer to check if it's published
  const offer = offersData.value.find((o) => o.originalOffer?.offer_id === offerId);
  console.log("Found offer:", offer);

  if (!offer || !offer.published) {
    console.log("Offer is not published, cannot select");
    return;
  }

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
    await adminOffersApi.selectOffer(offerId);
    if (firstOrder.value?.auftragsnummer) {
      await fetchOffers(firstOrder.value.auftragsnummer);
    }
  } catch (err) {
    console.error("Failed to select offer:", err);
  } finally {
    selectingOfferId.value = null;
    pendingOfferId.value = null;
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

// --- TÜV SÜD appraisal (Gutachten) sync ------------------------------------
// When an order has reached inspection (or a later stage), opening this admin
// expanded view triggers a one-off sync that pulls the latest appraisal
// document status from the third-party service (TÜV SÜD). The appraisal number
// is the order's `response_body`, provided by the order listing API.
const APPRAISAL_SYNC_STATUSES = new Set([
  "inspected",
  "workshop",
  "reinspection",
  "reworkshop",
]);

// Remember the last order/appraisal we synced so re-renders don't re-fire it.
let lastAppraisalSyncKey = "";

// The appraisal number (`response_body`) may live on the vehicle-list order OR
// only on the detailed status order (the `current_*` pseudo-order has none), so
// prefer whichever order actually carries a response_body.
function appraisalCandidateOrder(): any {
  const withNumber =
    props.vehicle.orders?.find((o) => o?.response_body != null) ??
    detailedVehicle.value?.orders?.find((o) => o?.response_body != null);
  return (
    withNumber ??
    props.vehicle.orders?.[0] ??
    detailedVehicle.value?.orders?.[0] ??
    firstOrder.value ??
    null
  );
}

async function maybeSyncAppraisal() {
  const order = appraisalCandidateOrder();
  if (!order) return;

  const provider = orderProviderLabel(order);
  const status = order.order_status ?? "";
  const appraisalNumber = order.response_body;

  // Appraisal XML sync is TÜV SÜD-only, needs an inspected-or-later status and
  // a response_body (the appraisal number). Log when a condition blocks it.
  if (
    provider !== "tuvsud" ||
    !APPRAISAL_SYNC_STATUSES.has(status) ||
    appraisalNumber === undefined ||
    appraisalNumber === null ||
    appraisalNumber === ""
  ) {
    console.debug("[appraisal-sync] skipped:", { provider, status, appraisalNumber });
    return;
  }

  // Once the appraisal has already produced assessment documents, don't keep
  // hitting the third-party sync endpoint automatically on every view — an
  // admin can force a re-sync manually from the vehicle list's 3-dot menu.
  const alreadyHasAssessmentDocs = Array.isArray(order.assessment_documents)
    && order.assessment_documents.length > 0;

  if (!alreadyHasAssessmentDocs) {
    const key = `${order.auftragsnummer || order.id}:${appraisalNumber}`;
    if (key !== lastAppraisalSyncKey) {
      lastAppraisalSyncKey = key;
      try {
        await adminOrdersApi.syncAppraisalXml(appraisalNumber);
        // Reflect any freshly synced appraisal document/status in the UI.
        await fetchVehicleDetail();
        emit("refreshDocs");
      } catch (err) {
        console.error("Failed to sync TÜV SÜD appraisal XML:", err);
        lastAppraisalSyncKey = ""; // allow a retry next time the view opens
        return;
      }
    }
  }

  // Transfer any assessment documents (freshly synced or already present)
  // into the vehicle's regular report documents.
  await maybeTransferAssessmentDocuments(order.auftragsnummer);
}

// --- TÜV SÜD assessment document transfer -----------------------------------
// `assessment_documents` on the order are raw TÜV SÜD documents pulled in by
// the appraisal sync above. They only become "real" vehicle report documents
// (downloadable/publishable like any other) once transferred via
// POST /admin/vehicle/report/transfer. We do this automatically, once per
// document, right after a sync that produced any.
const transferredAssessmentDocIds = ref<Set<string>>(new Set());
const transferringAssessmentDocIds = ref<Set<string>>(new Set());

async function maybeTransferAssessmentDocuments(auftragsnummer: string) {
  const orders = detailedVehicle.value?.orders ?? props.vehicle.orders ?? [];
  const order: any = orders.find((o: any) => o.auftragsnummer === auftragsnummer);
  const assessmentDocs: any[] = order?.assessment_documents ?? [];
  if (!assessmentDocs.length) return;

  const vehicleId = props.vehicle.vehicle_id;
  let transferredAny = false;

  for (const doc of assessmentDocs) {
    const docId = doc?.id ?? doc?.source_assessment_document_id;
    const sourceUrl = doc?.s3_url ?? doc?.source_s3_url ?? doc?.url;
    if (docId == null) continue;

    const key = `${auftragsnummer}:${docId}`;
    if (transferredAssessmentDocIds.value.has(key)) continue;
    if (!sourceUrl) {
      console.warn("[assessment-transfer] skipped, no source URL:", doc);
      continue;
    }

    transferringAssessmentDocIds.value.add(key);
    try {
      await adminOrdersApi.transferAssessmentDocument({
        auftragsnummer,
        vehicle_id: vehicleId,
        document_type: doc.document_type,
        document_title: doc.document_title,
        source_s3_url: sourceUrl,
        // Always transfer as unpublished — the admin publishes it explicitly
        // afterwards via the same "Publish" action used for other documents.
        published: false,
        source_assessment_document_id: docId,
      });
      transferredAssessmentDocIds.value.add(key);
      transferredAny = true;
    } catch (err) {
      console.error("Failed to transfer TÜV SÜD assessment document:", doc, err);
    } finally {
      transferringAssessmentDocIds.value.delete(key);
    }
  }

  if (transferredAny) {
    await fetchVehicleDetail();
    emit("refreshDocs");
  }
}

// TÜV SÜD assessment documents for the current (tuvsud) order — rendered in
// their own "TÜV SÜD Dokumente" section, separate from Fahrzeugdokumente.
const assessmentDocuments = computed(() => {
  const orders = detailedVehicle.value?.orders ?? props.vehicle.orders ?? [];
  const order: any =
    orders.find((o: any) => Array.isArray(o?.assessment_documents) && o.assessment_documents.length) ??
    orders.find((o: any) => orderProviderLabel(o) === "tuvsud");
  return (order?.assessment_documents ?? []) as any[];
});

function assessmentDocKey(auftragsnummer: string | undefined, doc: any): string {
  const docId = doc?.id ?? doc?.source_assessment_document_id;
  return `${auftragsnummer ?? ""}:${docId}`;
}

// Computed properties with fallback to mock data
const timelineData = computed(() => {
  // The full vehicle-status detail (same source as the B2B/B2C views) provides
  // the order status + status_updates for the timeline. Report rows come from
  // currentDocuments; see below.
  const detailedOrders = detailedVehicle.value?.orders;
  const detailOrder = detailedOrders && detailedOrders.length ? detailedOrders[0] : null;
  // Prefer the fresh order that ships inline with the admin vehicle list — it
  // reflects the latest action (e.g. a newly created DEKRA order) immediately.
  // The detailed status fetch is only a fallback and can be stale, which caused
  // the partner label (e.g. "tuvsud") to lag behind the actual provider.
  const inlineOrder = props.vehicle.orders?.length ? props.vehicle.orders[0] : null;
  const baseOrder = inlineOrder ?? detailOrder ?? firstOrder.value;

  if (baseOrder) {
    // Same date/time formatting used across all timeline entries.
    const fmtDateTime = (dateStr: string) => {
      const d = new Date(dateStr);
      return (
        d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) +
        "\n" +
        d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) +
        " Uhr"
      );
    };

    // Status stays as a separate first entry (no date).
    const statusEntry = {
      datetime: "",
      label: `STATUS: ${baseOrder.order_status ? getOrderStatusLabel(baseOrder.order_status).label.toUpperCase() : "KEINE AUFTRÄGE"}`,
      completed: false,
    };

    // Collect all timeline items with real Date objects so we can sort them.
    // Mirrors the B2C/B2B dashboard timeline: order creation, inspection
    // appointment, report uploads and status-change rows.
    const itemsWithDates: Array<{
      date: Date;
      datetime: string;
      label: string;
      sublabel?: string;
      completed: boolean;
      docUrl?: string;
      isReport?: boolean;
      doc?: any;
    }> = [];

    // Auftrag erstellt — guarded because the pseudo-order built from the
    // current_* fields can carry an empty created_at.
    if (baseOrder.created_at) {
      itemsWithDates.push({
        date: new Date(baseOrder.created_at),
        datetime: fmtDateTime(baseOrder.created_at),
        label: "Auftrag erstellt",
        completed: true,
      });
    }

    // Inspection appointment (partner + Besichtigungsort).
    const besichtigungsort = baseOrder.request_payload?.besichtigungsort;
    if (besichtigungsort?.termin) {
      itemsWithDates.push({
        date: new Date(besichtigungsort.termin),
        datetime: fmtDateTime(besichtigungsort.termin),
        label: orderProviderLabel(baseOrder),
        sublabel: `${besichtigungsort.strasse || ""}, ${besichtigungsort.plz || ""} ${besichtigungsort.ort || ""}`,
        completed: baseOrder.order_status !== "order_placed",
      });
    }

    // Orders merged from the detailed status fetch (+ any inline orders), deduped
    // by id. Used only for `status_updates` below.
    const timelineOrders: any[] = [...(props.vehicle.orders ?? []), ...(detailedOrders ?? [])];
    const uniqueOrders = Array.from(new Map(timelineOrders.map((o) => [o.id, o])).values());

    // Reports only — Gutachten / Nachgutachten. `currentDocuments`
    // (props.documents) mixes the vehicle's uploaded documents
    // (Leasingvertrag/Vorschaden/Sonstiges) with the admin-uploaded reports AND
    // invoices; both reports and invoices carry `is_report`, so that flag alone
    // keeps out general documents but NOT invoices. We additionally require the
    // report kind (in the title) to be a Gutachten, which excludes Rechnung
    // (invoices) while still matching Nachgutachten.
    currentDocuments.value.forEach((doc: any) => {
      const kind =
        `${doc?.file_name ?? ""} ${doc?.document_title ?? ""} ${doc?.title ?? ""}`.toLowerCase();
      const isReport = doc.is_report === true && kind.includes("gutachten");
      const dateToUse = doc.created_at || doc.updated_at;

      if (isReport && dateToUse) {
        // Get doc URL - check doc.url first, then try to build from s3_url if available
        let docUrl = doc.url || "";
        if (!docUrl && doc.s3_url) {
          const cleanS3Url = doc.s3_url?.trim().replace(/^`|`$/g, "");
          docUrl = cleanS3Url
            ? cleanS3Url.replace(/^s3:\/\/([^/]+)\//, "https://$1.s3.amazonaws.com/")
            : doc.s3_bucket && doc.s3_key
              ? `https://${doc.s3_bucket}.s3.amazonaws.com/${doc.s3_key}`
              : "";
        }

        itemsWithDates.push({
          date: new Date(dateToUse),
          datetime: fmtDateTime(dateToUse),
          label: "Report hochgeladen",
          sublabel: documentTypeLabel(doc.document_type),
          completed: true,
          docUrl,
          isReport: true,
          doc: doc,
        });
      }
    });

    // Order status updates (e.g. when an admin changes an order's status).
    uniqueOrders[0]?.status_updates?.forEach((update: any) => {
      const newLabel = getOrderStatusLabel(update.new_status).label;
      itemsWithDates.push({
        date: new Date(update.created_at),
        datetime: fmtDateTime(update.created_at),
        label: "Status aktualisiert",
        sublabel: update.old_status
          ? `${getOrderStatusLabel(update.old_status).label} → ${newLabel}`
          : newLabel,
        completed: true,
      });
    });

    // Sort chronologically (oldest first) and build the final timeline.
    itemsWithDates.sort((a, b) => a.date.getTime() - b.date.getTime());

    const timeline: Array<Record<string, any>> = [statusEntry];
    itemsWithDates.forEach((item) => {
      const { date, ...timelineItem } = item;
      timeline.push(timelineItem);
    });

    // Append the remaining planned steps (Bestätigt → … → Abgeschlossen) so the
    // admin sees what's still coming. These have no date yet; the first one is
    // flagged as the immediate "Nächster Schritt".
    getUpcomingSteps(baseOrder.order_status).forEach((step, idx) => {
      timeline.push({
        datetime: "",
        label: step.label,
        completed: false,
        isFuture: true,
        isNext: idx === 0,
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
      published: offer.offer_status === "published" || offer.offer_status === "selected",
      // Workshop distance data is not available yet; surface the offer note
      // (backend field `additional_notes`) instead when present.
      note: offer.additional_notes ?? "",
      originalOffer: offer,
    }));
  }
  return [];
});

const hasOffers = computed(() => offersData.value.length > 0);

const acceptedOffer = computed(() => {
  return offersData.value.find((o) => o.accepted);
});

const fullVehicleDetails = computed(() => {
  return props.expandedVehicleDetails[props.vehicle.vehicle_id] || props.vehicle;
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

// The provider label from orderProviderLabel() is a lowercase key ("dekra" /
// "tuvsud"). Render it as a proper, capitalized name in the timeline — mirrors
// the B2C dashboard so admin and client show identical provider names.
function providerDisplayLabel(label: string): string {
  const key = label.toLowerCase();
  if (key === "dekra") return "Dekra";
  if (key === "tuvsud") return "TÜV SÜD";
  return label;
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

// Gutachten / Nachgutachten (appraisal reports) live in the order timeline, not
// in the "Fahrzeugdokumente" card, so they are filtered out of the grouping.
function isGutachten(doc: any): boolean {
  const type = (doc?.document_type ?? "").trim().toLowerCase();
  if (type === "gutachten" || type === "nachgutachten" || type === "report") return true;
  const title =
    `${doc?.document_title ?? ""} ${doc?.file_name ?? ""} ${doc?.title ?? ""}`.toLowerCase();
  return title.includes("gutachten") || title.includes("nachgutachten");
}

// Group documents by their document_type so each type renders under its own
// heading. Order of groups follows first appearance in the documents list.
// Gutachten documents are excluded here — they live in the timeline.
const groupedDocuments = computed(() => {
  const groups: { key: string; title: string; items: any[] }[] = [];
  const indexByKey = new Map<string, number>();

  for (const doc of currentDocuments.value) {
    if (isGutachten(doc)) continue;
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

async function deleteDocument(doc: any) {
  try {
    if (!props.vehicle?.vehicle_id) return;
    console.log("DEBUG deleteDocument - doc:", doc);
    const docTitle = (doc?.document_title || doc?.title || "").toLowerCase();
    console.log("DEBUG deleteDocument - docTitle:", docTitle);
    // Check document title or is_report flag
    if (docTitle.includes("gutachten") || docTitle.includes("rechnung") || doc.is_report) {
      console.log("DEBUG deleteDocument - Using report API");
      await adminVehiclesApi.deleteReport(doc.id);
    } else {
      console.log("DEBUG deleteDocument - Using regular document API");
      // For other documents use regular document API
      await vehicleApi.deleteVehicleDocument(props.vehicle.vehicle_id, doc.id);
    }
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
      <!-- Main container: responsive masonry — cards pack into columns and fill vertical gaps -->
      <div
        class="columns-1 md:columns-2 xl:columns-3 gap-4 bg-[#EFEFEF] p-4 *:mb-4 *:break-inside-avoid"
      >
        <!-- Timeline Card -->
        <div
          class="flex flex-col overflow-hidden rounded-3xl border bg-white w-full"
          style="border-color: #ececec"
        >
            <div class="px-6 py-5">
              <p class="text-[16px] font-bold text-[#000000] leading-tight uppercase">
                {{ timelineData[0]?.label || "STATUS: KEINE AUFTRÄGE" }}
              </p>
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
                  :style="timelineLineStyle(entry)"
                />

                <!-- Dot -->
                <div
                  class="relative z-10 w-4 h-4 shrink-0 rounded-full mt-1 border-2"
                  :style="timelineDotStyle(entry)"
                />

                <!-- Content -->
                <div class="min-w-0 flex-1 pl-5">
                  <!-- Date/time -->
                  <p v-if="entry.datetime" class="text-[14px] text-[#2e3e3f] font-medium mb-1">
                    {{ entry.datetime.replace("\n", " - ") }}
                  </p>

                  <!-- Label -->
                  <template
                    v-if="
                      entry.label.toLowerCase() === 'dekra' ||
                      entry.label.toLowerCase() === 'tuvsud'
                    "
                  >
                    <p class="text-[16px] font-bold mb-1" style="color: #01b990">
                      {{ providerDisplayLabel(entry.label) }}
                    </p>
                    <p
                      v-if="entry.sublabel"
                      class="whitespace-pre-line text-[14px] text-[#2e3e3f] font-normal"
                    >
                      {{ entry.sublabel }}
                    </p>
                  </template>
                  <template v-else>
                    <div class="flex items-center justify-between">
                      <div>
                        <p
                          class="text-[14px] font-normal"
                          :class="entry.isFuture ? 'text-[#8f9ba7]' : 'text-[#2e3e3f]'"
                        >
                          {{ entry.label }}
                        </p>
                        <span
                          v-if="entry.isNext"
                          class="mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
                          style="background: rgba(1, 185, 144, 0.1); color: #01b990"
                        >
                          Nächster Schritt
                        </span>
                        <p
                          v-if="entry.sublabel"
                          class="whitespace-pre-line text-[14px] text-[#2e3e3f] font-normal"
                        >
                          {{ entry.sublabel }}
                        </p>
                      </div>
                      <div v-if="entry.isReport && entry.docUrl" class="flex items-center gap-2">
                        <a
                          :href="entry.docUrl"
                          target="_blank"
                          rel="noopener"
                          class="text-[#01b990] hover:opacity-70"
                          title="Download"
                        >
                          <Icon icon="material-symbols:download" class="size-[18.5px] shrink-0" />
                        </a>
                        <a
                          :href="entry.docUrl"
                          target="_blank"
                          rel="noopener"
                          class="text-[#01b990] hover:opacity-70"
                          title="Open"
                        >
                          <Icon icon="mdi:open-in-new" class="size-[18.5px] shrink-0" />
                        </a>
                        <button
                          v-if="entry.doc?.is_report && !entry.doc?.published"
                          @click="entry.doc && publishDocument(entry.doc.id)"
                          class="text-[#01b990] hover:opacity-70 flex-shrink-0"
                          title="Publish"
                        >
                          <Icon icon="mdi:eye-outline" class="size-[18.5px] shrink-0" />
                        </button>
                        <button
                          @click="entry.doc && deleteDocument(entry.doc)"
                          class="text-[#EF4444] hover:opacity-70 flex-shrink-0"
                        >
                          <Icon icon="mdi:delete-outline" class="size-[18.5px] shrink-0" />
                        </button>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- Fahrzeugdokumente Card -->
          <div class="flex flex-col gap-4 w-full">
            <div
              class="relative flex flex-col rounded-[16px] border bg-white"
              style="border-color: #ececec"
            >
              <button
                @click="uploadDocsOpen = true"
                class="absolute right-5 top-5 transition-opacity hover:opacity-60"
              >
                <Icon icon="mdi:pencil" class="size-[18.5px] shrink-0" style="color: #01b990" />
              </button>
              <div class="p-6">
                <p class="text-[16px] font-semibold uppercase text-[#000000]">Fahrzeugdokumente</p>
                <div class="h-px bg-gray-200 mt-2"></div>
              </div>

              <div class="flex flex-col gap-4 p-6 pt-0">
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
                        <Icon icon="material-symbols:download" class="size-[18.5px] shrink-0" />
                      </a>
                      <button
                        v-if="doc.is_report && !doc.published"
                        @click="publishDocument(doc.id)"
                        class="text-[#01b990] hover:opacity-70 flex-shrink-0"
                        title="Publish"
                      >
                        <Icon icon="mdi:eye-outline" class="size-[18.5px] shrink-0" />
                      </button>
                      <button
                        @click="deleteDocument(doc)"
                        class="text-[#EF4444] hover:opacity-70 flex-shrink-0"
                      >
                        <Icon icon="mdi:delete-outline" class="size-[18.5px] shrink-0" />
                      </button>
                    </div>
                  </div>
                </div>
                <div v-if="groupedDocuments.length === 0" class="text-[14px] text-[#b7c2c2]">
                  Keine Dokumente gefunden
                </div>
              </div>
            </div>
          </div>

          <!-- TÜV SÜD Dokumente Card -->
          <div v-if="assessmentDocuments.length" class="flex flex-col gap-4 w-full">
            <div
              class="relative flex flex-col rounded-[16px] border bg-white"
              style="border-color: #ececec"
            >
              <div class="p-6">
                <p class="text-[16px] font-semibold uppercase text-[#000000]">TÜV SÜD Dokumente</p>
                <div class="h-px bg-gray-200 mt-2"></div>
              </div>

              <div class="flex flex-col gap-3 p-6 pt-0">
                <div
                  v-for="doc in assessmentDocuments"
                  :key="assessmentDocKey(firstOrder?.auftragsnummer, doc)"
                  class="flex items-center justify-between gap-3"
                >
                  <div class="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      class="text-[14px] font-normal text-[#475569] truncate"
                      :title="doc.document_title || documentTypeLabel(doc.document_type)"
                    >
                      {{ doc.document_title || documentTypeLabel(doc.document_type) }}
                    </span>
                    <span
                      v-if="transferredAssessmentDocIds.has(assessmentDocKey(firstOrder?.auftragsnummer, doc))"
                      class="text-[10px] font-bold text-[#01b990] uppercase"
                    >
                      Übertragen
                    </span>
                    <span
                      v-else-if="transferringAssessmentDocIds.has(assessmentDocKey(firstOrder?.auftragsnummer, doc))"
                      class="text-[10px] font-bold text-[#b7c2c2] uppercase"
                    >
                      Wird übertragen…
                    </span>
                  </div>
                  <a
                    v-if="doc.s3_url"
                    :href="doc.s3_url"
                    target="_blank"
                    rel="noopener"
                    class="text-[#01b990] hover:opacity-70 flex-shrink-0"
                    title="Download"
                  >
                    <Icon icon="material-symbols:download" class="size-[18.5px] shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        <!-- Angebote (Offers) -->
        <div class="relative w-full">
            <div
              class="flex flex-col rounded-[16px] border bg-white overflow-visible"
              style="border-color: #ececec"
            >
              <div class="px-6 py-6">
                <p class="text-[16px] font-bold" style="color: #2e3e3f">Angebote</p>
              </div>

              <!-- Empty state -->
              <div
                v-if="!hasOffers"
                class="flex flex-col items-center justify-center gap-2 px-6 py-8 text-center"
              >
                <Icon icon="mdi:file-document-outline" class="size-8" style="color: #cbd5e1" />
                <p class="text-[14px] font-semibold" style="color: #2e3e3f">Keine Angebote</p>
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
                  <!-- Publish toggle (minimal button in front of each offer) - only show if no offer is accepted and this offer is not cancelled -->
                  <button
                    v-if="offer.originalOffer && !acceptedOffer && offer.status !== 'cancelled'"
                    @click.stop="!offer.published && publishOffer(offer.originalOffer.offer_id)"
                    :disabled="offer.published || publishingId === offer.originalOffer.offer_id"
                    class="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full transition-colors disabled:cursor-default"
                    :style="
                      offer.published
                        ? 'background:#01B990;color:#fff'
                        : 'background:#F0F4F4;color:#01B990'
                    "
                    :title="offer.published ? 'Veröffentlicht' : 'Angebot veröffentlichen'"
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
                        'animate-spin': publishingId === offer.originalOffer.offer_id,
                      }"
                    />
                  </button>

                  <!-- Radio circle / select offer -->
                  <button
                    type="button"
                    @click.stop="offer.published && requestSelect(offer.originalOffer?.offer_id)"
                    :disabled="
                      !!acceptedOffer ||
                      !offer.published ||
                      selectingOfferId === offer.originalOffer?.offer_id
                    "
                    class="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 disabled:cursor-default"
                    :style="
                      offer.accepted
                        ? 'border-color: #EF8450; background: #EF8450'
                        : 'border-color: #B7C2C2; background: white'
                    "
                    :title="offer.published ? 'Angebot auswählen' : 'Zuerst veröffentlichen'"
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
                    <!-- Workshop distance is not available yet — show the offer
                         note when present, otherwise a clean German fallback. -->
                    <p
                      class="text-[12px] leading-snug line-clamp-2 whitespace-normal break-words"
                      :class="{ 'cursor-help': offer.note && offer.note.trim() }"
                      :title="offer.note && offer.note.trim() ? offer.note.trim() : undefined"
                      style="color: #8f9ba7"
                    >
                      {{ (offer.note && offer.note.trim()) || "Weitere Informationen zum Angebot folgen." }}
                    </p>
                  </div>

                  <!-- 3-dot menu - only show if no offer is selected OR this is the selected offer -->
                  <div class="relative" v-if="!acceptedOffer || offer.accepted">
                    <button
                      @click.stop="openOfferMenu = openOfferMenu === offer.id ? null : offer.id"
                      class="text-[#B7C2C2] hover:text-[#2e3e3f] transition-colors"
                    >
                      <Icon icon="mdi:dots-vertical" class="size-5" />
                    </button>
                    <div
                      v-if="openOfferMenu === offer.id"
                      class="absolute right-0 top-full mt-1 z-50 bg-white rounded-[12px] border border-[#ececec] shadow-lg min-w-[180px] py-2"
                    >
                      <!-- Publish - only show if no offer is accepted, offer is not published, and offer is not cancelled -->
                      <button
                        v-if="
                          offer.originalOffer &&
                          !acceptedOffer &&
                          !offer.published &&
                          offer.status !== 'cancelled'
                        "
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
                      <div v-if="!acceptedOffer" class="h-px bg-[#ececec] my-1"></div>
                      <button
                        v-if="
                          !acceptedOffer &&
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
                        v-if="!acceptedOffer && offer.status === 'cancelled'"
                        class="px-4 py-2 text-sm text-[#B7C2C2] flex items-center gap-2"
                      >
                        <Icon icon="mdi:cancel" class="size-4" />
                        Cancelled
                      </div>
                      <!-- Selected - show only if this offer is selected -->
                      <div
                        v-if="offer.accepted"
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
          </div>
        <!-- Vehicle Specs Card (Besichtigungsort is not returned to the admin list endpoint) -->
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
              <p class="text-[18px] font-bold" style="color: #000">FAHRZEUGDATEN</p>
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
                  {{ fullVehicleDetails.leasinggeber || vehicle.leasinggeber || "N/A" }}
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
    <div class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" @click.stop>
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
