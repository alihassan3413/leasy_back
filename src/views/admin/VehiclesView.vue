<script setup lang="ts">
import { computed, ref, watch, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import { TableRow, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { adminVehiclesApi, vehicleApi } from "@/api";
import { formatGermanDate } from "@/lib/formatting";
import type { AdminVehicle } from "@/types";
import AdminOrderCreationModal from "@/components/admin/AdminOrderCreationModal.vue";

// Mock data for offers if backend doesn't provide any
const mockOffers: any[] = [
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

// Helper to get timeline data for a vehicle
function getTimelineData(vehicle: AdminVehicle) {
  // Get the first order
  let firstOrder: any = null;

  if (vehicle.current_auftragsnummer) {
    firstOrder = {
      id: "current",
      auftragsnummer: vehicle.current_auftragsnummer,
      leasyback_partner: vehicle.current_leasing_partner || "",
      order_status: vehicle.current_order_status,
      created_at: vehicle.current_order_created_at,
      request_payload: vehicle.current_request_payload,
    };
  } else if (vehicle.order_history?.length) {
    firstOrder = vehicle.order_history[0];
  }

  if (firstOrder) {
    const timeline: {
      datetime: string;
      label: string;
      sublabel?: string;
      completed: boolean;
    }[] = [];

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
    ];

    // Add partner step if available
    if (
      firstOrder.leasyback_partner ||
      firstOrder.request_payload?.besichtigungsort
    ) {
      const sublabel = firstOrder.request_payload?.besichtigungsort
        ? `${firstOrder.request_payload.besichtigungsort.strasse || ""}, ${firstOrder.request_payload.besichtigungsort.plz || ""} ${firstOrder.request_payload.besichtigungsort.ort || ""}`
        : firstOrder.leasyback_partner || "";

      steps.push({
        label: firstOrder.leasyback_partner || "Partner",
        sublabel: sublabel,
        datetime: firstOrder.request_payload?.besichtigungsort?.termin
          ? new Date(
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
            " Uhr"
          : "",
        completed: firstOrder.order_status !== "order_placed",
      });
    }

    // Add current status as first entry
    timeline.push({
      datetime: "",
      label: `STATUS: ${
        firstOrder.order_status
          ? firstOrder.order_status.replace("_", " ").toUpperCase()
          : "KEINE AUFTRÄGE"
      }`,
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
}

// Helper to get offers data for a vehicle
function getOffersData(vehicle: AdminVehicle) {
  // In future, if admin vehicles have offers, use that - for now use mock
  return mockOffers;
}

// Helper to get accepted offer
function getAcceptedOffer(vehicle: AdminVehicle) {
  const offers = getOffersData(vehicle);
  return offers.find((o: any) => o.accepted);
}
// ── List state ────────────────────────────────────────────────────
const userType = ref<"Firmenkunde" | "Privatkunde" | "all">("all");
const statusFilter = ref<string>("");
const page = ref(1);
const limit = ref(10);
const total = ref(0);
const totalActive = ref(0);
const totalCompleted = ref(0);
const totalConfirmed = ref(0);
const totalInspected = ref(0);
const totalDelivered = ref(0);
const vehicles = ref<AdminVehicle[]>([]);
const loading = ref(false);
const error = ref("");

// ── Expanded vehicle (order history accordion) ────────────────────
const expandedId = ref<string | null>(null);
function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id;
}

// ── Order creation modal ──────────────────────────────────────────
const orderModalOpen = ref(false);
const selectedVehicle = ref<AdminVehicle | null>(null);

function openCreateOrder(vehicle: AdminVehicle) {
  selectedVehicle.value = vehicle;
  orderModalOpen.value = true;
}

function onOrderSuccess() {
  loadVehicles();
}

// ── Documents state for expanded vehicles ─────────────────────────
const documents = ref<Record<string, any[]>>({});

async function loadDocuments(vehicleId: string) {
  try {
    documents.value[vehicleId] =
      await vehicleApi.getVehicleDocuments(vehicleId);
  } catch (err) {
    console.error("Failed to load vehicle documents:", err);
    documents.value[vehicleId] = [];
  }
}

// ── Status config ─────────────────────────────────────────────────
const statusOptions: { label: string; value: string }[] = [
  { label: "Alle", value: "" },
  { label: "Bestellt", value: "order_placed" },
  { label: "Bestätigt", value: "confirmed" },
  { label: "Geprüft", value: "inspected" },
  { label: "Geliefert", value: "delivered" },
  { label: "Abgeschlossen", value: "completed" },
];

const statusStyle: Record<string, { bg: string; fg: string }> = {
  order_placed: { bg: "rgba(239,132,80,0.1)", fg: "#c0622e" },
  confirmed: { bg: "rgba(99,102,241,0.1)", fg: "#4f46e5" },
  inspected: { bg: "rgba(1,185,144,0.1)", fg: "#00856a" },
  delivered: { bg: "rgba(16,57,59,0.08)", fg: "#10393b" },
  completed: { bg: "rgba(16,57,59,0.08)", fg: "#10393b" },
};

function getStatus(s: string | null | undefined) {
  const key = s ?? "";
  const style = statusStyle[key] ?? { bg: "rgba(0,0,0,0.05)", fg: "#6b7280" };
  const opt = statusOptions.find((o) => o.value === key);
  return { ...style, label: opt?.label ?? s ?? "—" };
}

// ── Pagination ────────────────────────────────────────────────────
const totalPages = computed(() => Math.ceil(total.value / limit.value) || 1);

function pageRange(current: number, last: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  for (let i = 1; i <= last; i++) {
    if (i === 1 || i === last || Math.abs(i - current) <= 1) out.push(i);
    else if (out[out.length - 1] !== "…") out.push("…");
  }
  return out;
}

// ── Fetch ─────────────────────────────────────────────────────────
async function loadVehicles() {
  loading.value = true;
  error.value = "";
  try {
    const res =
      userType.value === "all"
        ? await adminVehiclesApi.listAll(page.value, limit.value)
        : await adminVehiclesApi.listByUserType(
            userType.value,
            page.value,
            limit.value,
            statusFilter.value || undefined,
          );
    vehicles.value = res.data;
    total.value = res.total;
    totalActive.value = res.total_active ?? 0;
    totalCompleted.value = res.total_completed ?? 0;
    totalConfirmed.value = res.total_confirmed ?? 0;
    totalInspected.value = res.total_inspected ?? 0;
    totalDelivered.value = res.total_delivered ?? 0;
  } catch {
    error.value = "Fahrzeuge konnten nicht geladen werden.";
  } finally {
    loading.value = false;
  }
}

// ── Watchers ──────────────────────────────────────────────────────
watch(userType, () => {
  page.value = 1;
  statusFilter.value = "";
});
watch(statusFilter, () => {
  page.value = 1;
});
watch([userType, statusFilter, page], () => void loadVehicles());
watch(expandedId, (newId) => {
  if (newId && !documents.value[newId]) {
    loadDocuments(newId);
  }
});
onMounted(() => void loadVehicles());
</script>

<template>
  <div class="flex flex-col gap-5 h-full">
    <!-- ── FLOATING HEADER ── -->
    <header
      class="flex items-center gap-4 h-[60px] bg-white/70 backdrop-blur border border-[#eaf0ef] rounded-[18px] px-5 shrink-0"
      style="box-shadow: 0 4px 18px rgba(16, 57, 59, 0.04)"
    >
      <div class="flex-1">
        <h1 class="text-[18px] font-extrabold text-[#10393b] tracking-[-0.4px]">
          Fahrzeugverwaltung
        </h1>
      </div>

      <!-- User type toggle -->
      <div class="flex gap-0.5 bg-[#f4f7f6] p-[3px] rounded-[12px]">
        <button
          v-for="opt in [
            { label: 'Alle', val: 'all' },
            { label: 'Privatkunden', val: 'Privatkunde' },
            { label: 'Firmenkunden', val: 'Firmenkunde' },
          ]"
          :key="opt.val"
          @click="userType = opt.val as typeof userType"
          class="text-[12.5px] font-bold px-4 py-1.5 rounded-[9px] transition-all font-[Manrope,sans-serif]"
          :class="
            userType === opt.val
              ? 'bg-white text-[#10393b] shadow-[0_1px_5px rgba(16,57,59,0.1)]'
              : 'text-[#6f8585] hover:text-[#10393b]'
          "
        >
          {{ opt.label }}
        </button>
      </div>
    </header>

    <!-- ── MAIN CARD ── -->
    <section
      class="flex-1 flex flex-col bg-white border border-[#eef3f2] rounded-[24px] p-6 min-h-0"
      style="box-shadow: 0 6px 22px rgba(16, 57, 59, 0.04)"
    >
      <!-- Card header -->
      <div
        class="flex items-start justify-between mb-4 shrink-0 gap-4 flex-wrap"
      >
        <div>
          <h2
            class="text-[20px] font-extrabold text-[#10393b] tracking-[-0.4px]"
          >
            {{
              userType === "all"
                ? "Alle Fahrzeuge"
                : userType === "Firmenkunde"
                  ? "Firmenkunden Fahrzeuge"
                  : "Privatkunden Fahrzeuge"
            }}
          </h2>
          <p class="text-[12px] text-[#9bb0af] mt-0.5 font-medium">
            {{ total }} Fahrzeuge gesamt
          </p>
        </div>

        <!-- Summary chips -->
        <div class="flex flex-wrap gap-2">
          <span
            class="text-[11.5px] font-bold px-3 py-1.5 rounded-full bg-[#01B990]/10 text-[#00856a]"
          >
            {{ totalActive }} Aktiv
          </span>
          <span
            class="text-[11.5px] font-bold px-3 py-1.5 rounded-full bg-[#6366f1]/10 text-[#4f46e5]"
          >
            {{ totalConfirmed }} Bestätigt
          </span>
          <span
            class="text-[11.5px] font-bold px-3 py-1.5 rounded-full bg-[#ef8450]/10 text-[#c0622e]"
          >
            {{ totalInspected }} Geprüft
          </span>
          <span
            class="text-[11.5px] font-bold px-3 py-1.5 rounded-full bg-[#10393b]/[0.08] text-[#10393b]"
          >
            {{ totalCompleted }} Abgeschlossen
          </span>
        </div>
      </div>

      <!-- Status filter pills -->
      <div class="flex flex-wrap gap-1.5 mb-4 shrink-0">
        <button
          v-for="opt in statusOptions"
          :key="opt.value"
          @click="statusFilter = opt.value"
          class="text-[12px] font-bold px-3.5 py-1.5 rounded-full transition-all font-[Manrope,sans-serif]"
          :class="
            statusFilter === opt.value
              ? 'bg-[#10393b] text-white shadow-[0_3px_10px rgba(16,57,59,0.18)]'
              : 'bg-[#f4f7f6] text-[#6f8585] hover:bg-[#eaf0ef] hover:text-[#10393b]'
          "
        >
          {{ opt.label }}
        </button>
      </div>

      <!-- Error -->
      <div
        v-if="error"
        class="mb-4 px-4 py-3 rounded-[13px] bg-red-50 border border-red-200 text-[13px] text-red-700 shrink-0"
      >
        {{ error }}
      </div>

      <!-- Table -->
      <div
        class="flex-1 overflow-auto rounded-[18px] border border-[#eef3f2] min-h-0"
      >
        <table class="min-w-full border-collapse">
          <thead class="sticky top-0 z-10">
            <tr class="bg-[#f8faf9]">
              <th
                class="text-left text-[11px] font-bold text-[#9bb0af] uppercase tracking-[0.1em] px-5 py-3.5 border-b border-[#eef3f2]"
              >
                Fahrzeug
              </th>
              <th
                class="text-left text-[11px] font-bold text-[#9bb0af] uppercase tracking-[0.1em] px-5 py-3.5 border-b border-[#eef3f2]"
              >
                Kennzeichen / VIN
              </th>
              <th
                class="text-left text-[11px] font-bold text-[#9bb0af] uppercase tracking-[0.1em] px-5 py-3.5 border-b border-[#eef3f2]"
              >
                Kunde
              </th>
              <th
                class="text-left text-[11px] font-bold text-[#9bb0af] uppercase tracking-[0.1em] px-5 py-3.5 border-b border-[#eef3f2]"
              >
                Auftragsstatus
              </th>
              <th
                class="text-left text-[11px] font-bold text-[#9bb0af] uppercase tracking-[0.1em] px-5 py-3.5 border-b border-[#eef3f2]"
              >
                Leasingende
              </th>
              <th class="border-b border-[#eef3f2] w-12"></th>
            </tr>
          </thead>
          <tbody>
            <!-- Skeleton -->
            <template v-if="loading">
              <tr v-for="i in 8" :key="i">
                <td colspan="6" class="px-5 py-4">
                  <div
                    class="h-4 rounded-full bg-[#f4f7f6] animate-pulse"
                    :style="{ width: 55 + (i % 5) * 9 + '%' }"
                  ></div>
                </td>
              </tr>
            </template>

            <!-- Empty -->
            <tr v-else-if="!vehicles.length">
              <td
                colspan="6"
                class="py-16 text-center text-[13px] text-[#9bb0af]"
              >
                Keine Fahrzeuge gefunden.
              </td>
            </tr>

            <!-- Rows — each row + optional accordion for order history -->
            <template v-else v-for="v in vehicles" :key="v.vehicle_id">
              <tr
                class="group cursor-pointer border-b border-[#eef3f2] hover:bg-[#f6f9f8] transition-colors"
                :class="expandedId === v.vehicle_id ? 'bg-[#f6f9f8]' : ''"
                @click="toggleExpand(v.vehicle_id)"
              >
                <!-- Make + Model -->
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                      style="background: rgba(16, 57, 59, 0.07); color: #10393b"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                      >
                        <path
                          d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-1"
                        ></path>
                        <circle cx="9" cy="17" r="2"></circle>
                        <circle cx="17" cy="17" r="2"></circle>
                      </svg>
                    </div>
                    <div>
                      <div class="text-[13.5px] font-bold text-[#10393b]">
                        {{ v.make }} {{ v.model }}
                      </div>
                      <div class="text-[11px] text-[#9bb0af] mt-0.5">
                        {{ v.vehicle_belongs }}
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Plate + VIN -->
                <td class="px-5 py-3.5">
                  <div class="text-[13px] font-semibold text-[#10393b]">
                    {{ v.license_plate }}
                  </div>
                  <div class="text-[11px] font-mono text-[#9bb0af] mt-0.5">
                    {{ v.vin }}
                  </div>
                </td>

                <!-- Customer -->
                <td class="px-5 py-3.5">
                  <div class="text-[13px] text-[#5a6e6c]">
                    {{ v.company_name ?? v.user_email ?? "—" }}
                  </div>
                  <div class="text-[11px] text-[#9bb0af] mt-0.5">
                    {{ v.user_type }}
                  </div>
                </td>

                <!-- Order status -->
                <td class="px-5 py-3.5">
                  <span
                    v-if="v.current_order_status"
                    class="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                    :style="`background: ${getStatus(v.current_order_status).bg}; color: ${getStatus(v.current_order_status).fg}`"
                  >
                    <span
                      class="w-[5px] h-[5px] rounded-full bg-current"
                    ></span>
                    {{ getStatus(v.current_order_status).label }}
                  </span>
                  <span v-else class="text-[12px] text-[#9bb0af]">—</span>
                </td>

                <!-- Leasing end -->
                <td
                  class="px-5 py-3.5 text-[12.5px] text-[#9bb0af] tabular-nums"
                >
                  {{ formatGermanDate(v.leasing_end_date) }}
                </td>

                <!-- Expand toggle -->
                <td class="px-3 py-3.5">
                  <div class="flex items-center gap-2">
                    <span
                      v-if="
                        !v.current_auftragsnummer &&
                        (!v.order_history || v.order_history.length === 0)
                      "
                      class="w-8 h-8 flex items-center justify-center rounded-[9px] text-[#bcccca] hover:bg-[#01B990] hover:text-white transition-all cursor-pointer"
                      @click.stop="openCreateOrder(v)"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.2"
                      >
                        <path d="M12 5v14M5 12h14"></path>
                      </svg>
                    </span>
                    <span
                      class="w-8 h-8 flex items-center justify-center rounded-[9px] text-[#bcccca] group-hover:bg-[#10393b] group-hover:text-white transition-all"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.2"
                        class="transition-transform duration-200"
                        :class="expandedId === v.vehicle_id ? 'rotate-180' : ''"
                      >
                        <path d="M6 9l6 6 6-6"></path>
                      </svg>
                    </span>
                  </div>
                </td>
              </tr>

              <!-- Expanded content EXACTLY like DdfExpanded.vue -->
              <Transition name="accordion">
                <TableRow
                  v-if="expandedId === v.vehicle_id"
                  class="border-0 hover:bg-transparent"
                >
                  <TableCell colspan="6" class="max-w-0 p-0 overflow-x-auto">
                    <!-- Main container with 3 columns -->
                    <div
                      class="flex gap-4 bg-[#EFEFEF] p-4"
                      style="min-width: max-content"
                    >
                      <!-- Column 1: Timeline + Vehicle Docs + Return Docs -->
                      <div class="flex flex-col gap-4" style="width: 320px">
                        <!-- Timeline Card -->
                        <div
                          class="flex flex-col overflow-hidden rounded-3xl border bg-white"
                          style="border-color: #ececec"
                        >
                          <div
                            class="px-6 py-5 flex items-center justify-between"
                          >
                            <p
                              class="text-[16px] font-bold text-[#000000] leading-tight uppercase"
                            >
                              {{
                                getTimelineData(v)[0]?.label ||
                                "STATUS: KEINE AUFTRÄGE"
                              }}
                            </p>
                            <button class="text-[#01b990] hover:opacity-70">
                              <Icon icon="mdi:dots-vertical" class="size-4.5" />
                            </button>
                          </div>

                          <!-- Timeline rows -->
                          <div class="flex-1 px-6 pb-5">
                            <div
                              v-for="(entry, i) in getTimelineData(v).slice(1)"
                              :key="i"
                              class="relative flex items-start pb-6"
                            >
                              <!-- Vertical line -->
                              <div
                                v-if="
                                  i < getTimelineData(v).slice(1).length - 1
                                "
                                class="absolute left-2 top-5 w-0.5 h-full"
                                :style="
                                  entry.completed
                                    ? 'background: #01B990'
                                    : 'background: #B7C2C2'
                                "
                              ></div>

                              <!-- Dot -->
                              <div
                                class="relative z-10 w-4 h-4 shrink-0 rounded-full mt-1"
                                :style="
                                  entry.completed
                                    ? 'background: #01B990'
                                    : 'background: #B7C2C2'
                                "
                              ></div>

                              <!-- Content -->
                              <div class="min-w-0 flex-1 pl-5">
                                <!-- Date/time -->
                                <p
                                  class="text-[14px] text-[#2e3e3f] font-medium mb-1"
                                >
                                  {{ entry.datetime.replace("\n", " - ") }}
                                </p>

                                <!-- Label -->
                                <template
                                  v-if="
                                    entry.label === 'DEKRA' ||
                                    entry.label === 'TUVSUD'
                                  "
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
                                  <p
                                    class="text-[14px] text-[#2e3e3f] font-normal"
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
                            <div class="p-6">
                              <p
                                class="text-[16px] font-semibold uppercase text-[#000000]"
                              >
                                Vehicle Docs
                              </p>
                              <div class="h-px bg-gray-200 mt-2"></div>
                            </div>

                            <div class="flex flex-col gap-4 p-6 pt-0">
                              <div
                                v-if="
                                  documents[v.vehicle_id] &&
                                  documents[v.vehicle_id].length > 0
                                "
                                v-for="(doc, i) in documents[v.vehicle_id]"
                                :key="i"
                                class="flex items-center justify-between gap-3"
                              >
                                <span
                                  class="text-[14px] font-normal text-[#475569] flex-1 truncate"
                                  :title="
                                    doc.file_name ||
                                    doc.document_type ||
                                    'Dokument'
                                  "
                                >
                                  {{
                                    doc.file_name ||
                                    doc.document_type ||
                                    "Dokument"
                                  }}
                                </span>
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
                                </div>
                              </div>
                              <div v-else class="text-[14px] text-[#b7c2c2]">
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
                            class="flex flex-col rounded-[16px] border bg-white"
                            style="border-color: #ececec; opacity: 0.5"
                          >
                            <div class="px-6 py-6">
                              <p
                                class="text-[16px] font-bold"
                                style="color: #2e3e3f"
                              >
                                Angebote
                              </p>
                            </div>

                            <!-- Offer rows -->
                            <div class="flex flex-col gap-5 px-6">
                              <div
                                v-for="offer in mockOffers"
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
                                <div
                                  class="flex flex-col gap-1 flex-1 min-w-0 overflow-hidden"
                                >
                                  <div
                                    class="flex justify-between items-start gap-3"
                                  >
                                    <p
                                      class="text-[14px] font-bold flex-1 min-w-0 truncate"
                                      :style="
                                        offer.accepted
                                          ? 'color: #2e3e3f'
                                          : 'color: #B7C2C2'
                                      "
                                      :title="`${offer.id} - ${offer.name}`"
                                    >
                                      {{ offer.id }} - {{ offer.name }}
                                    </p>
                                    <p
                                      class="text-[16px] font-normal flex-shrink-0"
                                      :style="
                                        offer.accepted
                                          ? 'color: #2e3e3f'
                                          : 'color: #B7C2C2'
                                      "
                                    >
                                      {{ offer.cost.toLocaleString("de-DE") }}
                                      €
                                    </p>
                                  </div>
                                  <div
                                    class="flex justify-between items-center gap-3"
                                  >
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
                            <div
                              v-if="mockOffers.find((o) => o.accepted)"
                              class="px-6 pb-6 pt-5"
                            >
                              <div
                                class="flex items-center justify-between rounded-[50px] px-7 py-2.5"
                                style="background: #ef8450"
                              >
                                <span
                                  class="text-[14px] font-normal text-white"
                                >
                                  Accepted Offer:
                                  {{ mockOffers.find((o) => o.accepted)?.id }}
                                  {{ mockOffers.find((o) => o.accepted)?.name }}
                                </span>
                                <span
                                  class="text-[16px] font-normal text-white"
                                >
                                  {{
                                    mockOffers
                                      .find((o) => o.accepted)
                                      ?.cost.toLocaleString("de-DE")
                                  }}
                                  €
                                </span>
                              </div>
                            </div>
                          </div>
                          <!-- Coming Soon Overlay -->
                          <div
                            class="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                          >
                            <div
                              class="bg-white/80 px-6 py-3 rounded-full shadow-lg"
                            >
                              <p
                                class="text-[18px] font-bold"
                                style="color: #ef8450"
                              >
                                Coming Soon
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Column 3: Assigned To + Vehicle Specs -->
                      <div
                        class="flex flex-col 2xl:flex-row gap-4 w-[325px] 2xl:w-full"
                      >
                        <!-- Assigned To Card -->
                        <div
                          class="relative flex flex-col rounded-[24px] border bg-white p-8 min-w-[325px]"
                          style="border-color: #ececec"
                        >
                          <div class="pb-6">
                            <p
                              class="text-[16px] font-normal uppercase"
                              style="color: #2e3e3f"
                            >
                              Assigned To
                            </p>
                          </div>

                          <!-- Avatar + Name row -->
                          <div class="flex items-start gap-6 pb-6">
                            <Avatar class="size-[64px] shrink-0">
                              <AvatarFallback
                                class="text-xl font-bold"
                                style="
                                  background-color: #d9d9d9;
                                  color: #2e3e3f;
                                "
                              >
                                {{
                                  (v.company_name ||
                                    v.user_email ||
                                    "N")[0].toUpperCase()
                                }}
                              </AvatarFallback>
                            </Avatar>
                            <div class="flex flex-col gap-2 pt-2">
                              <p
                                class="text-[16px] font-bold"
                                style="color: #2e3e3f"
                              >
                                {{ v.company_name || v.user_name || "N/A" }}
                              </p>
                              <p
                                class="text-[12px] font-semibold"
                                style="color: #01b990"
                              >
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
                              v-if="v.current_order_created_at"
                            >
                              <p
                                class="text-[14px] font-normal"
                                style="color: #2e3e3f"
                              >
                                {{
                                  new Date(
                                    v.current_order_created_at,
                                  ).toLocaleDateString("de-DE")
                                }}
                                · Order placed
                              </p>
                              <p
                                class="text-[14px] font-bold"
                                style="color: #2e3e3f"
                              >
                                {{
                                  v.current_order_status
                                    ? v.current_order_status.replace("_", " ")
                                    : "—"
                                }}
                              </p>
                            </div>
                            <div
                              v-else
                              class="flex items-center justify-between pt-2"
                            >
                              <p
                                class="text-[14px] font-normal"
                                style="color: #2e3e3f"
                              >
                                Keine Aktivität
                              </p>
                            </div>
                          </div>

                          <!-- Divider -->
                          <div class="h-px bg-gray-200 mb-5"></div>

                          <!-- Contact Fields -->
                          <div class="flex flex-col gap-4">
                            <div
                              v-if="v.user_email"
                              class="flex items-center gap-4"
                            >
                              <Icon
                                icon="mdi:email-outline"
                                class="size-[18px] shrink-0"
                                style="color: #5a6b7a"
                              />
                              <span
                                class="text-[14px] font-normal"
                                style="color: #2e3e3f"
                              >
                                {{ v.user_email }}
                              </span>
                            </div>
                            <div
                              v-if="v.current_request_payload?.besichtigungsort"
                              class="flex items-center gap-4"
                            >
                              <Icon
                                icon="mdi:map-marker-outline"
                                class="size-[18px] shrink-0"
                                style="color: #5a6b7a"
                              />
                              <span
                                class="text-[14px] font-normal"
                                style="color: #2e3e3f"
                              >
                                {{
                                  v.current_request_payload.besichtigungsort
                                    .strasse || ""
                                }},
                                {{
                                  v.current_request_payload.besichtigungsort
                                    .plz || ""
                                }}
                                {{
                                  v.current_request_payload.besichtigungsort
                                    .ort || ""
                                }}
                              </span>
                            </div>
                          </div>
                        </div>

                        <!-- Vehicle Specs Card -->
                        <div
                          class="relative flex flex-col overflow-hidden rounded-3xl border bg-white min-w-[325px]"
                          style="border-color: #ececec"
                        >
                          <div class="px-6 pt-6">
                            <p
                              class="text-[18px] font-bold"
                              style="color: #000"
                            >
                              VEHICLE SPECS
                            </p>
                          </div>

                          <div class="flex flex-col gap-0 px-6 pt-4 pb-6">
                            <div class="flex items-center justify-between py-4">
                              <span
                                class="text-[16px] font-normal"
                                style="color: #64748b"
                              >
                                License Plate
                              </span>
                              <span
                                class="text-[16px] font-semibold"
                                style="color: #000"
                              >
                                {{ v.license_plate }}
                              </span>
                            </div>
                            <div class="h-px bg-gray-200"></div>
                            <div class="flex items-center justify-between py-4">
                              <span
                                class="text-[16px] font-normal"
                                style="color: #64748b"
                              >
                                Model
                              </span>
                              <span
                                class="text-[16px] font-semibold"
                                style="color: #000"
                              >
                                {{ v.make }} {{ v.model }}
                              </span>
                            </div>
                            <div class="h-px bg-gray-200"></div>
                            <div class="flex items-center justify-between py-4">
                              <span
                                class="text-[16px] font-normal"
                                style="color: #64748b"
                              >
                                Mileage
                              </span>
                              <span
                                class="text-[16px] font-semibold"
                                style="color: #000"
                              >
                                {{ v.kilometerstand || "N/A" }}
                              </span>
                            </div>
                            <div class="h-px bg-gray-200"></div>
                            <div class="flex items-center justify-between py-4">
                              <span
                                class="text-[16px] font-normal"
                                style="color: #64748b"
                              >
                                Lease Provider
                              </span>
                              <span
                                class="text-[16px] font-semibold"
                                style="color: #000"
                              >
                                {{ v.leasinggeber || "N/A" }}
                              </span>
                            </div>
                            <div class="h-px bg-gray-200"></div>
                            <div class="flex items-center justify-between py-4">
                              <span
                                class="text-[16px] font-normal"
                                style="color: #64748b"
                              >
                                Return Deadline
                              </span>
                              <span
                                class="text-[16px] font-semibold"
                                style="color: #000"
                              >
                                {{ formatGermanDate(v.leasing_end_date) }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              </Transition>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-4 shrink-0">
        <span class="text-[12px] text-[#9bb0af] font-medium">
          Seite {{ page }} von {{ totalPages }}
        </span>
        <div class="flex gap-1">
          <button
            @click="page--"
            :disabled="page <= 1"
            class="w-8 h-8 flex items-center justify-center rounded-[8px] border border-[#eef3f2] text-[#6f8585] hover:border-[#10393b] hover:text-[#10393b] disabled:opacity-35 disabled:cursor-not-allowed transition-all"
          >
            ←
          </button>
          <button
            v-for="p in pageRange(page, totalPages)"
            :key="String(p)"
            @click="typeof p === 'number' && (page = p)"
            class="w-8 h-8 flex items-center justify-center rounded-[8px] border text-[12.5px] font-bold transition-all font-[Manrope,sans-serif]"
            :class="
              p === page
                ? 'bg-[#10393b] border-[#10393b] text-white'
                : p === '…'
                  ? 'border-transparent text-[#9bb0af] cursor-default'
                  : 'border-[#eef3f2] text-[#6f8585] hover:border-[#10393b] hover:text-[#10393b]'
            "
          >
            {{ p }}
          </button>
          <button
            @click="page++"
            :disabled="page >= totalPages"
            class="w-8 h-8 flex items-center justify-center rounded-[8px] border border-[#eef3f2] text-[#6f8585] hover:border-[#10393b] hover:text-[#10393b] disabled:opacity-35 disabled:cursor-not-allowed transition-all"
          >
            →
          </button>
        </div>
      </div>
    </section>

    <AdminOrderCreationModal
      v-model:open="orderModalOpen"
      :vehicle="selectedVehicle"
      @success="onOrderSuccess"
    />
  </div>
</template>

<style scoped>
.accordion-enter-active {
  transition: all 0.22s ease;
}

.accordion-leave-active {
  transition: all 0.18s ease;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
