<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";
import { Icon } from "@iconify/vue";
import { TableRow, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { adminVehiclesApi, vehicleApi, adminOrdersApi } from "@/api";
import { formatGermanDate } from "@/lib/formatting";
import type { AdminVehicle, AdminOrder } from "@/types";
import AdminOrderCreationModal from "@/components/admin/AdminOrderCreationModal.vue";
import AdminVehicleOrderHistory from "@/components/admin/AdminVehicleOrderHistory.vue";
import AdminChangeOrderStatusModal from "@/components/admin/AdminChangeOrderStatusModal.vue";
import UploadDocumentModal from "@/components/dashboard/modals/UploadDocumentModal.vue";

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
const expandedVehicleDetails = ref<Record<string, any>>({});

async function toggleExpand(id: string) {
  console.log("Toggle expand called for ID:", id);
  if (expandedId.value === id) {
    expandedId.value = null;
  } else {
    expandedId.value = id;
    // Find the vehicle in the list
    const vehicle = vehicles.value.find((v) => v.vehicle_id === id);
    console.log("Vehicle from list:", vehicle);
    // Store the vehicle data itself as expanded details since API is failing
    if (!expandedVehicleDetails.value[id]) {
      expandedVehicleDetails.value[id] = vehicle;
    }
  }
}

// Order creation modal
const orderModalOpen = ref(false);
const selectedVehicle = ref<AdminVehicle | null>(null);
// 3-dot menu state
const openMenuId = ref<string | null>(null);
// Status update modal
const statusModalOpen = ref(false);
const selectedOrderForStatus = ref<AdminOrder | null>(null);
const modalStatusOptions = [
  { label: "Anfrage gesendet", value: "order_requested" },
  { label: "Bestellt", value: "order_placed" },
  { label: "Bestätigt", value: "confirmed" },
  { label: "Geprüft", value: "inspected" },
  { label: "Geliefert", value: "delivered" },
  { label: "Abgeschlossen", value: "completed" },
];
// Upload document modals
const uploadReportOpen = ref(false);
const uploadInvoiceOpen = ref(false);

function openCreateOrder(vehicle: AdminVehicle) {
  selectedVehicle.value = vehicle;
  orderModalOpen.value = true;
  openMenuId.value = null;
}

function openStatusUpdate(vehicle: AdminVehicle) {
  // Try to get current order from various places
  let currentOrder: AdminOrder | null = null;

  // First check orders array for a more complete order object
  if (vehicle.orders && vehicle.orders.length > 0) {
    const order = vehicle.orders[0];
    currentOrder = {
      id: order.id,
      vehicle_id: vehicle.vehicle_id,
      auftragsnummer: order.auftragsnummer,
      leasyback_partner: order.leasyback_partner,
      order_status: order.order_status,
      sent_at: order.sent_at || "",
      created_at: order.created_at,
      response_status: order.response_status || 0,
      license_plate: vehicle.license_plate,
      vin: vehicle.vin,
      make: vehicle.make,
      model: vehicle.model,
      user_id: vehicle.user_id,
      user_email: vehicle.user_email,
      user_type: vehicle.user_type,
      b2b_id: vehicle.b2b_id,
      company_name: vehicle.company_name,
      confirmation_date: null,
    };
  }
  // Then check order_history
  else if (vehicle.order_history && vehicle.order_history.length > 0) {
    const historyItem = vehicle.order_history[0];
    currentOrder = {
      id: historyItem.id,
      vehicle_id: vehicle.vehicle_id,
      auftragsnummer: historyItem.auftragsnummer,
      leasyback_partner: historyItem.leasyback_partner,
      order_status: historyItem.order_status,
      sent_at: historyItem.sent_at,
      created_at: historyItem.created_at,
      response_status: historyItem.response_status,
      license_plate: vehicle.license_plate,
      vin: vehicle.vin,
      make: vehicle.make,
      model: vehicle.model,
      user_id: vehicle.user_id,
      user_email: vehicle.user_email,
      user_type: vehicle.user_type,
      b2b_id: vehicle.b2b_id,
      company_name: vehicle.company_name,
      confirmation_date: historyItem.confirmation_date,
    };
  }

  if (currentOrder) {
    selectedOrderForStatus.value = currentOrder;
    statusModalOpen.value = true;
    openMenuId.value = null;
  }
}

function onOrderStatusUpdated() {
  loadVehicles();
}

function openUploadReport(vehicle: AdminVehicle) {
  selectedVehicle.value = vehicle;
  uploadReportOpen.value = true;
  openMenuId.value = null;
}

function openUploadInvoice(vehicle: AdminVehicle) {
  selectedVehicle.value = vehicle;
  uploadInvoiceOpen.value = true;
  openMenuId.value = null;
}

function onOrderSuccess() {
  loadVehicles();
}

async function refreshDocuments(vehicleId: string) {
  await loadDocuments(vehicleId);
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

function handleClickOutside(event: MouseEvent) {
  if (openMenuId.value) {
    openMenuId.value = null;
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  void loadVehicles();
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
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
                    <!-- 3-dot menu -->
                    <div class="relative">
                      <button
                        class="w-8 h-8 flex items-center justify-center rounded-[9px] text-[#bcccca] hover:bg-[#10393b]/10 hover:text-[#10393b] transition-all"
                        @click.stop="
                          openMenuId =
                            openMenuId === v.vehicle_id ? null : v.vehicle_id
                        "
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <circle cx="12" cy="6" r="1.5"></circle>
                          <circle cx="12" cy="12" r="1.5"></circle>
                          <circle cx="12" cy="18" r="1.5"></circle>
                        </svg>
                      </button>

                      <!-- Dropdown menu -->
                      <div
                        v-if="openMenuId === v.vehicle_id"
                        class="absolute right-0 top-full mt-1 z-[100] bg-white rounded-[16px] border border-[#eef3f2] shadow-[0_4px_12px_rgba(16,57,59,0.08)] py-2 min-w-[240px]"
                      >
                        <button
                          v-if="
                            (v.orders && v.orders.length > 0) ||
                            (v.order_history && v.order_history.length > 0)
                          "
                          class="w-full text-left px-4 py-2 text-sm text-[#10393b] hover:bg-[#f6f9f8] transition-colors"
                          @click.stop="openStatusUpdate(v)"
                        >
                          <span class="flex items-center gap-2">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <path
                                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                              />
                              <path
                                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                              />
                            </svg>
                            Status aktualisieren
                          </span>
                        </button>
                        <button
                          v-else
                          class="w-full text-left px-4 py-2 text-sm text-[#9bb0af] cursor-not-allowed"
                        >
                          <span class="flex items-center gap-2">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <path
                                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                              />
                              <path
                                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                              />
                            </svg>
                            Kein Auftrag vorhanden
                          </span>
                        </button>
                        <button
                          class="w-full text-left px-4 py-2 text-sm text-[#10393b] hover:bg-[#f6f9f8] transition-colors"
                          @click.stop="openUploadReport(v)"
                        >
                          <span class="flex items-center gap-2">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <path
                                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                              />
                              <polyline points="14 2 14 8 20 8" />
                              <path d="M16 13H8" />
                              <path d="M16 17H8" />
                            </svg>
                            Bericht hochladen
                          </span>
                        </button>
                        <button
                          class="w-full text-left px-4 py-2 text-sm text-[#10393b] hover:bg-[#f6f9f8] transition-colors"
                          @click.stop="openUploadInvoice(v)"
                        >
                          <span class="flex items-center gap-2">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <rect x="2" y="4" width="20" height="16" rx="2" />
                              <path d="M6 8h12" />
                              <path d="M6 12h6" />
                              <path d="M6 16h12" />
                            </svg>
                            Rechnung hochladen
                          </span>
                        </button>
                        <button
                          class="w-full text-left px-4 py-2 text-sm text-[#10393b] hover:bg-[#f6f9f8] transition-colors"
                        >
                          <span class="flex items-center gap-2">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                            Angebot erstellen
                          </span>
                        </button>
                        <div class="h-px bg-[#eef3f2] my-1"></div>
                        <button
                          class="w-full text-left px-4 py-2 text-sm text-[#10393b] hover:bg-[#f6f9f8] transition-colors"
                          @click.stop="openCreateOrder(v)"
                        >
                          <span class="flex items-center gap-2">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <path d="M9 11l3 3L22 4" />
                              <path
                                d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
                              />
                            </svg>
                            Auftrag erstellen
                          </span>
                        </button>
                        <button
                          class="w-full text-left px-4 py-2 text-sm text-[#10393b] hover:bg-[#f6f9f8] transition-colors"
                          @click.stop="toggleExpand(v.vehicle_id)"
                        >
                          <span class="flex items-center gap-2">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <path
                                d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                              ></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            Details anzeigen
                          </span>
                        </button>
                      </div>
                    </div>

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

              <!-- Expanded content -->
              <Transition name="accordion">
                <AdminVehicleOrderHistory
                  v-if="expandedId === v.vehicle_id"
                  :vehicle="v"
                  :expandedVehicleDetails="expandedVehicleDetails"
                  :documents="documents"
                  @refreshDocs="refreshDocuments(v.vehicle_id)"
                />
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

    <AdminChangeOrderStatusModal
      :open="statusModalOpen"
      :order="selectedOrderForStatus"
      :status-options="modalStatusOptions"
      @update:open="statusModalOpen = $event"
      @order-status-updated="onOrderStatusUpdated"
    />

    <UploadDocumentModal
      :open="uploadReportOpen"
      :vehicle-id="selectedVehicle?.vehicle_id"
      @update:open="uploadReportOpen = $event"
    />

    <UploadDocumentModal
      :open="uploadInvoiceOpen"
      :vehicle-id="selectedVehicle?.vehicle_id"
      @update:open="uploadInvoiceOpen = $event"
    />
  </div>
</template>

<style scoped>
.accordion-enter-active,
.accordion-leave-active {
  transition: all 200ms ease;
  overflow: hidden;
  max-height: 2000px;
  opacity: 1;
}
.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
