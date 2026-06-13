<script setup lang="ts">
import { computed, ref, watch, onMounted } from "vue";
import { adminOrdersApi, vehicleApi } from "@/api";
import { formatGermanDate } from "@/lib/formatting";
import type { AdminOrder } from "@/types";
import { toast } from "vue-sonner";

// ── List state ────────────────────────────────────────────────────
const userType = ref<"Firmenkunde" | "Privatkunde" | "all">("all");
const statusFilter = ref("");
const page = ref(1);
const limit = ref(10);
const total = ref(0);
const totalActive = ref(0);
const totalCompleted = ref(0);
const totalConfirmed = ref(0);
const totalInspected = ref(0);
const totalDelivered = ref(0);
const orders = ref<AdminOrder[]>([]);
const loading = ref(false);
const error = ref("");
const dialogOpen = ref(false);
const approvingOrder = ref<AdminOrder | null>(null);
const approving = ref(false);

// ── Status config ─────────────────────────────────────────────────
const statusOptions = [
  { label: "Alle", value: "" },
  { label: "Anfrage gesendet", value: "order_requested" },
  { label: "Bestellt", value: "order_placed" },
  { label: "Bestätigt", value: "confirmed" },
  { label: "Geprüft", value: "inspected" },
  { label: "Geliefert", value: "delivered" },
  { label: "Abgeschlossen", value: "completed" },
];

const statusStyle: Record<string, { bg: string; fg: string; label: string }> = {
  order_requested: {
    label: "Anfrage gesendet",
    bg: "rgba(59,130,246,0.1)",
    fg: "#3b82f6",
  },
  order_placed: {
    label: "Bestellt",
    bg: "rgba(239,132,80,0.1)",
    fg: "#c0622e",
  },
  confirmed: { label: "Bestätigt", bg: "rgba(99,102,241,0.1)", fg: "#4f46e5" },
  inspected: { label: "Geprüft", bg: "rgba(1,185,144,0.1)", fg: "#00856a" },
  delivered: { label: "Geliefert", bg: "rgba(16,57,59,0.08)", fg: "#10393b" },
  completed: {
    label: "Abgeschlossen",
    bg: "rgba(16,57,59,0.08)",
    fg: "#10393b",
  },
};

function getStatus(s: string | null | undefined) {
  return (
    statusStyle[s ?? ""] ?? {
      label: s ?? "—",
      bg: "rgba(0,0,0,0.05)",
      fg: "#6b7280",
    }
  );
}

// ── Response status helper ────────────────────────────────────────
function responseStatusStyle(code: number | null) {
  if (!code) return { bg: "rgba(0,0,0,0.05)", fg: "#6b7280" };
  if (code >= 200 && code < 300)
    return { bg: "rgba(1,185,144,0.1)", fg: "#00856a" };
  if (code >= 400) return { bg: "rgba(239,132,80,0.1)", fg: "#c0622e" };
  return { bg: "rgba(99,102,241,0.1)", fg: "#4f46e5" };
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
async function loadOrders() {
  loading.value = true;
  error.value = "";
  try {
    const res =
      userType.value === "all"
        ? await adminOrdersApi.listAll(page.value, limit.value, statusFilter.value)
        : await adminOrdersApi.listByUserType(
          userType.value,
          page.value,
          limit.value,
          statusFilter.value,
        );

    orders.value = res.data;
    console.log(
      "API response orders:",
      res.data.map((o) => ({ id: o.id, order_status: o.order_status })),
    );
    total.value = res.total;
    totalActive.value = res.total_active ?? 0;
    totalCompleted.value = res.total_completed ?? 0;
    totalConfirmed.value = res.total_confirmed ?? 0;
    totalInspected.value = res.total_inspected ?? 0;
    totalDelivered.value = res.total_delivered ?? 0;
  } catch {
    error.value = "Aufträge konnten nicht geladen werden.";
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
watch([userType, statusFilter, page], () => void loadOrders());
onMounted(() => void loadOrders());

async function handleApproveOrder(order: AdminOrder) {
  approvingOrder.value = order;
  dialogOpen.value = true;
}

async function confirmApproveOrder() {
  if (!approvingOrder.value) return;
  approving.value = true;
  try {
    await adminOrdersApi.approveOrder(
      approvingOrder.value.leasyback_partner.toLowerCase() as "tuvsud" | "dekra",
      approvingOrder.value.id,
    );
    toast.success("Auftrag erfolgreich genehmigt!");
    dialogOpen.value = false;
    await loadOrders();
  } catch (err) {
    console.error("Error approving order:", err);
    toast.error("Auftrag konnte nicht genehmigt werden!");
  } finally {
    approving.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-5 h-full">
    <!-- ── FLOATING HEADER ── -->
    <header
      class="flex items-center gap-4 h-[60px] bg-white/70 backdrop-blur border border-[#eaf0ef] rounded-[18px] px-5 shrink-0"
      style="box-shadow: 0 4px 18px rgba(16, 57, 59, 0.04)">
      <div class="flex-1">
        <h1 class="text-[18px] font-extrabold text-[#10393b] tracking-[-0.4px]">
          Auftragsverwaltung
        </h1>
      </div>

      <!-- User type toggle -->
      <div class="flex gap-0.5 bg-[#f4f7f6] p-[3px] rounded-[12px]">
        <button v-for="opt in [
          { label: 'Alle', val: 'all' },
          { label: 'Privatkunden', val: 'Privatkunde' },
          { label: 'Firmenkunden', val: 'Firmenkunde' },
        ]" :key="opt.val" @click="userType = opt.val as typeof userType"
          class="text-[12.5px] font-bold px-4 py-1.5 rounded-[9px] transition-all font-[Manrope,sans-serif]" :class="userType === opt.val
            ? 'bg-white text-[#10393b] shadow-[0_1px_5px_rgba(16,57,59,0.1)]'
            : 'text-[#6f8585] hover:text-[#10393b]'
            ">
          {{ opt.label }}
        </button>
      </div>
    </header>

    <!-- ── MAIN CARD ── -->
    <section class="flex-1 flex flex-col bg-white border border-[#eef3f2] rounded-[24px] p-6 min-h-0"
      style="box-shadow: 0 6px 22px rgba(16, 57, 59, 0.04)">
      <!-- Card header -->
      <div class="flex items-start justify-between mb-4 shrink-0 gap-4 flex-wrap">
        <div>
          <h2 class="text-[20px] font-extrabold text-[#10393b] tracking-[-0.4px]">
            {{
              userType === "all"
                ? "Alle Aufträge"
                : userType === "Firmenkunde"
                  ? "Firmenkunden Aufträge"
                  : "Privatkunden Aufträge"
            }}
          </h2>
          <p class="text-[12px] text-[#9bb0af] mt-0.5 font-medium">
            {{ total }} Aufträge gesamt
          </p>
        </div>

        <!-- Summary chips -->
        <div class="flex flex-wrap gap-2">
          <span class="text-[11.5px] font-bold px-3 py-1.5 rounded-full bg-[#01B990]/10 text-[#00856a]">
            {{ totalActive }} Aktiv
          </span>
          <span class="text-[11.5px] font-bold px-3 py-1.5 rounded-full bg-[#6366f1]/10 text-[#4f46e5]">
            {{ totalConfirmed }} Bestätigt
          </span>
          <span class="text-[11.5px] font-bold px-3 py-1.5 rounded-full bg-[#ef8450]/10 text-[#c0622e]">
            {{ totalInspected }} Geprüft
          </span>
          <span class="text-[11.5px] font-bold px-3 py-1.5 rounded-full bg-[#10393b]/[0.08] text-[#10393b]">
            {{ totalCompleted }} Abgeschlossen
          </span>
        </div>
      </div>

      <!-- Status filter pills -->
      <div class="flex flex-wrap gap-1.5 mb-4 shrink-0">
        <button v-for="opt in statusOptions" :key="opt.value" @click="statusFilter = opt.value"
          class="text-[12px] font-bold px-3.5 py-1.5 rounded-full transition-all font-[Manrope,sans-serif]" :class="statusFilter === opt.value
            ? 'bg-[#10393b] text-white shadow-[0_3px_10px_rgba(16,57,59,0.18)]'
            : 'bg-[#f4f7f6] text-[#6f8585] hover:bg-[#eaf0ef] hover:text-[#10393b]'
            ">
          {{ opt.label }}
        </button>
      </div>

      <!-- Error -->
      <div v-if="error"
        class="mb-4 px-4 py-3 rounded-[13px] bg-red-50 border border-red-200 text-[13px] text-red-700 shrink-0">
        {{ error }}
      </div>

      <!-- Table -->
      <div class="flex-1 overflow-auto rounded-[18px] border border-[#eef3f2] min-h-0">
        <table class="min-w-full border-collapse">
          <thead class="sticky top-0 z-10">
            <tr class="bg-[#f8faf9]">
              <th
                class="text-left text-[11px] font-bold text-[#9bb0af] uppercase tracking-[0.1em] px-5 py-3.5 border-b border-[#eef3f2]">
                Auftrag
              </th>
              <th
                class="text-left text-[11px] font-bold text-[#9bb0af] uppercase tracking-[0.1em] px-5 py-3.5 border-b border-[#eef3f2]">
                Fahrzeug
              </th>
              <th
                class="text-left text-[11px] font-bold text-[#9bb0af] uppercase tracking-[0.1em] px-5 py-3.5 border-b border-[#eef3f2]">
                Kunde
              </th>
              <th
                class="text-left text-[11px] font-bold text-[#9bb0af] uppercase tracking-[0.1em] px-5 py-3.5 border-b border-[#eef3f2]">
                Partner
              </th>
              <th
                class="text-left text-[11px] font-bold text-[#9bb0af] uppercase tracking-[0.1em] px-5 py-3.5 border-b border-[#eef3f2]">
                Status
              </th>
              <th
                class="text-left text-[11px] font-bold text-[#9bb0af] uppercase tracking-[0.1em] px-5 py-3.5 border-b border-[#eef3f2]">
                API
              </th>
              <th
                class="text-left text-[11px] font-bold text-[#9bb0af] uppercase tracking-[0.1em] px-5 py-3.5 border-b border-[#eef3f2]">
                Erstellt
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- Skeleton -->
            <template v-if="loading">
              <tr v-for="i in 8" :key="i">
                <td colspan="7" class="px-5 py-4">
                  <div class="h-4 rounded-full bg-[#f4f7f6] animate-pulse" :style="{ width: 50 + (i % 5) * 10 + '%' }">
                  </div>
                </td>
              </tr>
            </template>

            <!-- Empty -->
            <tr v-else-if="!orders.length">
              <td colspan="7" class="py-16 text-center text-[13px] text-[#9bb0af]">
                Keine Aufträge gefunden.
              </td>
            </tr>

            <!-- Rows -->
            <tr v-else v-for="o in orders" :key="o.id"
              class="group border-b border-[#eef3f2] hover:bg-[#f6f9f8] transition-colors">
              <!-- Auftrag -->
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                    style="background: rgba(99, 102, 241, 0.1); color: #6366f1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="1.8">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <path d="M14 2v6h6M16 13H8M16 17H8" />
                    </svg>
                  </div>
                  <div>
                    <div class="text-[13px] font-extrabold text-[#10393b] font-mono tracking-tight">
                      {{ o.auftragsnummer }}
                    </div>
                    <div class="text-[10.5px] text-[#9bb0af] mt-0.5 font-mono">
                      {{ o.id.slice(0, 8) }}…
                    </div>
                  </div>
                </div>
              </td>

              <!-- Fahrzeug -->
              <td class="px-5 py-3.5">
                <div class="text-[13px] font-semibold text-[#10393b]">
                  {{ o.make }} {{ o.model }}
                </div>
                <div class="text-[11px] text-[#9bb0af] mt-0.5 font-mono">
                  {{ o.license_plate }}
                </div>
              </td>

              <!-- Kunde -->
              <td class="px-5 py-3.5">
                <div class="text-[13px] text-[#5a6e6c]">
                  {{ o.company_name ?? o.user_email ?? "—" }}
                </div>
                <div class="text-[11px] text-[#9bb0af] mt-0.5">
                  {{ o.user_type }}
                </div>
              </td>

              <!-- Partner -->
              <td class="px-5 py-3.5">
                <span class="inline-flex items-center text-[11.5px] font-bold px-2.5 py-1 rounded-[8px]"
                  style="background: rgba(16, 57, 59, 0.06); color: #10393b">{{ o.leasyback_partner }}</span>
              </td>

              <!-- Order status -->
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-2">
                  <span class="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                    :style="`background:${getStatus(o.order_status).bg}; color:${getStatus(o.order_status).fg}`">
                    <span class="w-[5px] h-[5px] rounded-full bg-current"></span>
                    {{ getStatus(o.order_status).label }}
                  </span>
                  <button v-if="o.order_status === 'order_requested'" @click="handleApproveOrder(o)"
                    class="p-1 hover:bg-green-100 rounded-full transition-colors" title="Auftrag genehmigen">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#01B990" stroke-width="2"
                      stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22,4 12,14.01 9,11.01" />
                    </svg>
                  </button>
                </div>
              </td>

              <!-- Response status (HTTP code from leasyback partner) -->
              <td class="px-5 py-3.5">
                <span class="inline-flex items-center text-[11.5px] font-bold px-2 py-0.5 rounded-[6px] tabular-nums"
                  :style="`background:${responseStatusStyle(o.response_status).bg}; color:${responseStatusStyle(o.response_status).fg}`">{{
                    o.response_status ?? "—" }}</span>
              </td>

              <!-- Erstellt -->
              <td class="px-5 py-3.5 text-[12.5px] text-[#9bb0af] tabular-nums">
                {{ formatGermanDate(o.created_at) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-4 shrink-0">
        <span class="text-[12px] text-[#9bb0af] font-medium">
          Seite {{ page }} von {{ totalPages }}
        </span>
        <div class="flex gap-1">
          <button @click="page--" :disabled="page <= 1"
            class="w-8 h-8 flex items-center justify-center rounded-[8px] border border-[#eef3f2] text-[#6f8585] hover:border-[#10393b] hover:text-[#10393b] disabled:opacity-35 disabled:cursor-not-allowed transition-all">
            ←
          </button>
          <button v-for="p in pageRange(page, totalPages)" :key="String(p)" @click="typeof p === 'number' && (page = p)"
            class="w-8 h-8 flex items-center justify-center rounded-[8px] border text-[12.5px] font-bold transition-all font-[Manrope,sans-serif]"
            :class="p === page
              ? 'bg-[#10393b] border-[#10393b] text-white'
              : p === '…'
                ? 'border-transparent text-[#9bb0af] cursor-default'
                : 'border-[#eef3f2] text-[#6f8585] hover:border-[#10393b] hover:text-[#10393b]'
              ">
            {{ p }}
          </button>
          <button @click="page++" :disabled="page >= totalPages"
            class="w-8 h-8 flex items-center justify-center rounded-[8px] border border-[#eef3f2] text-[#6f8585] hover:border-[#10393b] hover:text-[#10393b] disabled:opacity-35 disabled:cursor-not-allowed transition-all">
            →
          </button>
        </div>
      </div>
    </section>

    <AlertDialog :open="dialogOpen" @update:open="dialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Auftrag genehmigen?</AlertDialogTitle>
          <AlertDialogDescription>
            Möchten Sie den Auftrag {{ approvingOrder?.auftragsnummer }} wirklich genehmigen?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction :disabled="approving" @click="confirmApproveOrder">
            {{ approving ? 'Lädt...' : 'Genehmigen' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
