<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { adminVehiclesApi, adminOrdersApi } from "@/api";
import { formatGermanDate } from "@/lib/formatting";
import type { AdminUser, AdminVehicle, AdminOrder } from "@/types";

// ── Props / Emits ────────────────────────────────────────────────
const props = defineProps<{ user: AdminUser | null; open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

// ── Tab state ────────────────────────────────────────────────────
const activeTab = ref<"vehicles" | "orders">("vehicles");

// ── Vehicles state ───────────────────────────────────────────────
const vehicles = ref<AdminVehicle[]>([]);
const vehiclePage = ref(1);
const vehicleLimit = ref(5);
const vehicleTotal = ref(0);
const vehicleLoading = ref(false);
const vehicleError = ref("");

// ── Orders state ─────────────────────────────────────────────────
const orders = ref<AdminOrder[]>([]);
const orderPage = ref(1);
const orderLimit = ref(5);
const orderTotal = ref(0);
const orderLoading = ref(false);
const orderError = ref("");

// ── Pagination ───────────────────────────────────────────────────
const vehicleTotalPages = computed(() => Math.ceil(vehicleTotal.value / vehicleLimit.value) || 1);
const orderTotalPages = computed(() => Math.ceil(orderTotal.value / orderLimit.value) || 1);

function pageRange(current: number, last: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  for (let i = 1; i <= last; i++) {
    if (i === 1 || i === last || Math.abs(i - current) <= 1) {
      out.push(i);
    } else if (out[out.length - 1] !== "…") {
      out.push("…");
    }
  }
  return out;
}

// ── Status map ───────────────────────────────────────────────────
const statusMap: Record<string, { label: string; bg: string; fg: string }> = {
  order_placed: { label: "Angefragt", bg: "rgba(239,132,80,0.1)", fg: "#c0622e" },
  confirmed: { label: "Bestätigt", bg: "rgba(99,102,241,0.1)", fg: "#4f46e5" },
  inspected: { label: "Geprüft", bg: "rgba(1,185,144,0.1)", fg: "#00856a" },
  delivered: { label: "Geliefert", bg: "rgba(16,57,59,0.08)", fg: "#10393b" },
  completed: { label: "Abgeschlossen", bg: "rgba(16,57,59,0.08)", fg: "#10393b" },
};

function getStatus(s: string | null | undefined) {
  return statusMap[s ?? ""] ?? { label: s ?? "—", bg: "rgba(0,0,0,0.05)", fg: "#6b7280" };
}

// ── User helpers ─────────────────────────────────────────────────
function initials(u: AdminUser) {
  return ((u.first_name?.[0] ?? "") + (u.last_name?.[0] ?? "")).toUpperCase() || "?";
}

// ── Fetch functions (independent, no shared loading flag) ─────────
async function fetchVehicles() {
  if (!props.user) return;
  vehicleLoading.value = true;
  vehicleError.value = "";
  try {
    const res = await adminVehiclesApi.listByUser(
      props.user.user_id,
      vehiclePage.value,
      vehicleLimit.value,
    );
    vehicles.value = res.data;
    vehicleTotal.value = res.total;
  } catch (e: any) {
    vehicleError.value = e?.message ?? "Fahrzeuge konnten nicht geladen werden.";
  } finally {
    vehicleLoading.value = false;
  }
}

async function fetchOrders() {
  if (!props.user) return;
  orderLoading.value = true;
  orderError.value = "";
  try {
    const res = await adminOrdersApi.listByUser(
      props.user.user_id,
      orderPage.value,
      orderLimit.value,
    );
    orders.value = res.data;
    orderTotal.value = res.total;
  } catch (e: any) {
    orderError.value = e?.message ?? "Aufträge konnten nicht geladen werden.";
  } finally {
    orderLoading.value = false;
  }
}

// ── Reset + load when modal opens / user changes ─────────────────
watch(
  () => [props.open, props.user] as const,
  ([open, user]) => {
    if (!open || !user) return;
    activeTab.value = "vehicles";
    vehiclePage.value = 1;
    orderPage.value = 1;
    vehicles.value = [];
    orders.value = [];
    vehicleTotal.value = 0;
    orderTotal.value = 0;
    // fire BOTH independently — no race condition
    void fetchVehicles();
    void fetchOrders();
  },
  { immediate: true },
);

// Re-fetch when pages change
watch(vehiclePage, () => void fetchVehicles());
watch(orderPage, () => void fetchOrders());

// ── Close helpers ────────────────────────────────────────────────
function close() {
  emit("close");
}
function onBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) close();
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") close();
}
</script>

<template>
  <!-- Teleport to body so it ALWAYS escapes any overflow:hidden parent -->
  <Teleport to="body">
    <Transition name="lb-modal">
      <div
        v-if="open && user"
        class="fixed inset-0 z-[9999] flex items-center justify-center"
        style="
          background: rgba(16, 57, 59, 0.5);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        "
        @click="onBackdropClick"
        @keydown="onKeydown"
      >
        <!--
          The modal box itself.
          max-h-[90vh] + flex flex-col + overflow-y-auto on the body
          ensures it never overflows the viewport.
        -->
        <div
          class="relative flex flex-col w-full max-w-[820px] mx-4 rounded-[28px] bg-white overflow-hidden"
          style="
            max-height: 90vh;
            box-shadow:
              0 32px 80px rgba(16, 57, 59, 0.25),
              0 0 0 1px rgba(16, 57, 59, 0.06);
          "
          @click.stop
        >
          <!-- ━━━ MODAL HEADER (dark teal gradient) ━━━ -->
          <div
            class="flex items-center gap-4 px-7 py-5 shrink-0"
            style="background: linear-gradient(145deg, #10393b 0%, #17494b 55%, #1a5052 100%)"
          >
            <!-- Avatar -->
            <div
              class="w-[52px] h-[52px] rounded-[15px] flex items-center justify-center text-[18px] font-extrabold text-[#10393b] shrink-0"
              style="
                background: linear-gradient(150deg, #01b990, #5fe6c2);
                box-shadow: 0 4px 14px rgba(1, 185, 144, 0.4);
              "
            >
              {{ initials(user) }}
            </div>

            <div class="flex-1 min-w-0">
              <p class="text-[10.5px] font-bold text-[#01B990] uppercase tracking-[0.14em] mb-1">
                Kundenprofil
              </p>
              <h2
                class="text-[21px] font-extrabold text-white tracking-[-0.4px] leading-tight truncate"
              >
                {{ user.salutation }} {{ user.first_name }} {{ user.last_name }}
              </h2>
              <p class="text-[12.5px] text-white/50 mt-0.5 truncate">{{ user.user_email }}</p>
            </div>

            <!-- Status badge -->
            <span
              class="inline-flex items-center gap-1.5 text-[11.5px] font-bold px-3 py-1.5 rounded-full shrink-0"
              :style="
                user.is_active
                  ? 'background:rgba(1,185,144,0.2); color:#5fe6c2'
                  : 'background:rgba(239,132,80,0.2); color:#f59b6c'
              "
            >
              <span class="w-[5px] h-[5px] rounded-full bg-current"></span>
              {{ user.is_active ? "Aktiv" : "Inaktiv" }}
            </span>

            <!-- Close button -->
            <button
              @click="close"
              class="w-9 h-9 flex items-center justify-center rounded-[11px] shrink-0 ml-1 text-white/50 hover:text-white transition-all"
              style="background: rgba(255, 255, 255, 0.1)"
              title="Schließen"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- ━━━ INFO STRIP ━━━ -->
          <div class="grid grid-cols-1 sm:grid-cols-3 shrink-0" style="border-bottom: 1px solid #eef3f2">
            <!-- Address -->
            <div class="px-6 py-4" style="border-right: 1px solid #eef3f2">
              <p class="text-[10px] font-bold text-[#9bb0af] uppercase tracking-[0.12em] mb-1.5">
                Adresse
              </p>
              <p class="text-[13px] font-semibold text-[#10393b] leading-snug">
                {{ user.street || "—" }} {{ user.number }}
              </p>
              <p class="text-[12px] text-[#6f8585]">{{ user.zip_code }} {{ user.city }}</p>
            </div>
            <!-- Country -->
            <div class="px-6 py-4" style="border-right: 1px solid #eef3f2">
              <p class="text-[10px] font-bold text-[#9bb0af] uppercase tracking-[0.12em] mb-1.5">
                Land
              </p>
              <p class="text-[13px] font-semibold text-[#10393b]">{{ user.country || "—" }}</p>
              <p class="text-[12px] text-[#6f8585]">{{ user.additional_address || "—" }}</p>
            </div>
            <!-- Meta -->
            <div class="px-6 py-4">
              <p class="text-[10px] font-bold text-[#9bb0af] uppercase tracking-[0.12em] mb-1.5">
                Beigetreten
              </p>
              <p class="text-[13px] font-semibold text-[#10393b]">
                {{ formatGermanDate(user.created_at) }}
              </p>
              <p class="text-[12px] text-[#6f8585]">Profil-ID {{ user.profile_id }}</p>
            </div>
          </div>

          <!-- ━━━ TABS ━━━ -->
          <div class="flex items-center gap-2 px-7 pt-5 pb-3 shrink-0">
            <button
              v-for="tab in [
                { id: 'vehicles', label: 'Fahrzeuge', count: vehicleTotal },
                { id: 'orders', label: 'Aufträge', count: orderTotal },
              ]"
              :key="tab.id"
              @click="activeTab = tab.id as 'vehicles' | 'orders'"
              class="flex items-center gap-2 px-4 py-2 rounded-[11px] text-[13px] font-bold transition-all duration-150 font-[Manrope,sans-serif]"
              :style="
                activeTab === tab.id
                  ? 'background:#10393b; color:#fff; box-shadow:0 4px 14px rgba(16,57,59,0.18)'
                  : 'color:#6f8585'
              "
            >
              {{ tab.label }}
              <span
                class="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full transition-all"
                :style="
                  activeTab === tab.id
                    ? 'background:rgba(255,255,255,0.2); color:#fff'
                    : 'background:#f4f7f6; color:#9bb0af'
                "
                >{{ tab.count }}</span
              >
            </button>
          </div>

          <!-- ━━━ TAB CONTENT (scrollable) ━━━ -->
          <div class="flex-1 overflow-y-auto px-7 pb-7 min-h-0">
            <!-- ── VEHICLES ── -->
            <div v-show="activeTab === 'vehicles'">
              <!-- loading -->
              <div v-if="vehicleLoading" class="flex flex-col gap-3 pt-1">
                <div
                  v-for="i in 4"
                  :key="i"
                  class="h-[66px] rounded-[16px] animate-pulse"
                  style="background: #f4f7f6"
                ></div>
              </div>

              <!-- error -->
              <div
                v-else-if="vehicleError"
                class="py-8 text-center text-[13px]"
                style="color: #ef4444"
              >
                {{ vehicleError }}
              </div>

              <!-- empty -->
              <div v-else-if="vehicles.length === 0" class="py-14 text-center">
                <div
                  class="w-14 h-14 rounded-[18px] mx-auto mb-4 flex items-center justify-center"
                  style="background: rgba(16, 57, 59, 0.07); color: #10393b"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                  >
                    <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-1" />
                    <circle cx="9" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                </div>
                <p class="text-[13px] font-semibold" style="color: #9bb0af">
                  Keine Fahrzeuge gefunden
                </p>
              </div>

              <!-- list -->
              <div v-else class="flex flex-col gap-2.5">
                <div
                  v-for="v in vehicles"
                  :key="v.vehicle_id"
                  class="flex items-center gap-4 p-4 rounded-[16px] transition-all"
                  style="border: 1px solid #eef3f2"
                  @mouseenter="($event.currentTarget as HTMLElement).style.background = '#f6f9f8'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background = ''"
                >
                  <div
                    class="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0"
                    style="background: rgba(16, 57, 59, 0.07); color: #10393b"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.8"
                    >
                      <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-1" />
                      <circle cx="9" cy="17" r="2" />
                      <circle cx="17" cy="17" r="2" />
                    </svg>
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span class="text-[14px] font-bold" style="color: #10393b"
                        >{{ v.make }} {{ v.model }}</span
                      >
                      <span class="text-[11px] font-semibold" style="color: #9bb0af">{{
                        v.license_plate
                      }}</span>
                    </div>
                    <div
                      class="flex items-center gap-3 flex-wrap"
                      style="font-size: 12px; color: #6f8585"
                    >
                      <span
                        >VIN: <span class="font-mono">{{ v.vin }}</span></span
                      >
                      <span style="color: #d1d9d9">·</span>
                      <span>Leasingende: {{ formatGermanDate(v.leasing_end_date) }}</span>
                    </div>
                  </div>

                  <span
                    v-if="v.current_order_status"
                    class="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
                    :style="`background:${getStatus(v.current_order_status).bg}; color:${getStatus(v.current_order_status).fg}`"
                  >
                    <span class="w-[5px] h-[5px] rounded-full bg-current"></span>
                    {{ getStatus(v.current_order_status).label }}
                  </span>
                </div>
              </div>

              <!-- vehicle pagination -->
              <div
                v-if="vehicleTotalPages > 1 && !vehicleLoading"
                class="flex items-center justify-between mt-5"
              >
                <span class="text-[12px] font-medium" style="color: #9bb0af">
                  Seite {{ vehiclePage }} von {{ vehicleTotalPages }}
                </span>
                <div class="flex gap-1">
                  <button @click="vehiclePage--" :disabled="vehiclePage <= 1" class="pg-btn">
                    ←
                  </button>
                  <button
                    v-for="p in pageRange(vehiclePage, vehicleTotalPages)"
                    :key="String(p)"
                    @click="typeof p === 'number' && (vehiclePage = p)"
                    class="pg-btn"
                    :class="{ 'pg-active': p === vehiclePage, 'pg-ellipsis': p === '…' }"
                  >
                    {{ p }}
                  </button>
                  <button
                    @click="vehiclePage++"
                    :disabled="vehiclePage >= vehicleTotalPages"
                    class="pg-btn"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>

            <!-- ── ORDERS ── -->
            <div v-show="activeTab === 'orders'">
              <!-- loading -->
              <div v-if="orderLoading" class="flex flex-col gap-3 pt-1">
                <div
                  v-for="i in 4"
                  :key="i"
                  class="h-[66px] rounded-[16px] animate-pulse"
                  style="background: #f4f7f6"
                ></div>
              </div>

              <!-- error -->
              <div
                v-else-if="orderError"
                class="py-8 text-center text-[13px]"
                style="color: #ef4444"
              >
                {{ orderError }}
              </div>

              <!-- empty -->
              <div v-else-if="orders.length === 0" class="py-14 text-center">
                <div
                  class="w-14 h-14 rounded-[18px] mx-auto mb-4 flex items-center justify-center"
                  style="background: rgba(99, 102, 241, 0.1); color: #6366f1"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <path d="M14 2v6h6M16 13H8M16 17H8" />
                  </svg>
                </div>
                <p class="text-[13px] font-semibold" style="color: #9bb0af">
                  Keine Aufträge gefunden
                </p>
              </div>

              <!-- list -->
              <div v-else class="flex flex-col gap-2.5">
                <div
                  v-for="o in orders"
                  :key="o.id"
                  class="flex items-center gap-4 p-4 rounded-[16px] transition-all"
                  style="border: 1px solid #eef3f2"
                  @mouseenter="($event.currentTarget as HTMLElement).style.background = '#f6f9f8'"
                  @mouseleave="($event.currentTarget as HTMLElement).style.background = ''"
                >
                  <div
                    class="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0"
                    style="background: rgba(99, 102, 241, 0.1); color: #6366f1"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.8"
                    >
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <path d="M14 2v6h6M16 13H8M16 17H8" />
                    </svg>
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span class="text-[14px] font-bold font-mono" style="color: #10393b">{{
                        o.auftragsnummer
                      }}</span>
                      <span class="text-[12px]" style="color: #9bb0af"
                        >{{ o.make }} {{ o.model }}</span
                      >
                    </div>
                    <div
                      class="flex items-center gap-3 flex-wrap"
                      style="font-size: 12px; color: #6f8585"
                    >
                      <span>{{ o.leasyback_partner }}</span>
                      <span style="color: #d1d9d9">·</span>
                      <span>{{ o.license_plate }}</span>
                      <span style="color: #d1d9d9">·</span>
                      <span>{{ formatGermanDate(o.created_at) }}</span>
                    </div>
                  </div>

                  <span
                    class="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
                    :style="`background:${getStatus(o.order_status).bg}; color:${getStatus(o.order_status).fg}`"
                  >
                    <span class="w-[5px] h-[5px] rounded-full bg-current"></span>
                    {{ getStatus(o.order_status).label }}
                  </span>
                </div>
              </div>

              <!-- order pagination -->
              <div
                v-if="orderTotalPages > 1 && !orderLoading"
                class="flex items-center justify-between mt-5"
              >
                <span class="text-[12px] font-medium" style="color: #9bb0af">
                  Seite {{ orderPage }} von {{ orderTotalPages }}
                </span>
                <div class="flex gap-1">
                  <button @click="orderPage--" :disabled="orderPage <= 1" class="pg-btn">←</button>
                  <button
                    v-for="p in pageRange(orderPage, orderTotalPages)"
                    :key="String(p)"
                    @click="typeof p === 'number' && (orderPage = p)"
                    class="pg-btn"
                    :class="{ 'pg-active': p === orderPage, 'pg-ellipsis': p === '…' }"
                  >
                    {{ p }}
                  </button>
                  <button
                    @click="orderPage++"
                    :disabled="orderPage >= orderTotalPages"
                    class="pg-btn"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </div>
          <!-- end scrollable body -->
        </div>
        <!-- end modal box -->
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Modal transition */
.lb-modal-enter-active {
  transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}
.lb-modal-leave-active {
  transition: all 0.18s ease;
}
.lb-modal-enter-from,
.lb-modal-leave-to {
  opacity: 0;
}
.lb-modal-enter-from .relative,
.lb-modal-leave-to .relative {
  transform: scale(0.95) translateY(12px);
}

/* Pagination buttons */
.pg-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid #eef3f2;
  font-size: 12.5px;
  font-weight: 700;
  color: #6f8585;
  background: white;
  cursor: pointer;
  transition: all 0.15s;
  font-family: Manrope, sans-serif;
}
.pg-btn:hover:not(:disabled):not(.pg-ellipsis) {
  border-color: #10393b;
  color: #10393b;
}
.pg-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.pg-btn.pg-active {
  background: #10393b;
  border-color: #10393b;
  color: white;
}
.pg-btn.pg-ellipsis {
  border-color: transparent;
  cursor: default;
  color: #9bb0af;
}
</style>
