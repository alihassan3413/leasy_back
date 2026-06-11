<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { adminVehiclesApi } from '@/api'
import { formatGermanDate } from '@/lib/formatting'
import type { AdminVehicle } from '@/types'

// ── List state ────────────────────────────────────────────────────
const userType = ref<'Firmenkunde' | 'Privatkunde' | 'all'>('all')
const statusFilter = ref<string>('')
const page = ref(1)
const limit = ref(10)
const total = ref(0)
const totalActive = ref(0)
const totalCompleted = ref(0)
const totalConfirmed = ref(0)
const totalInspected = ref(0)
const totalDelivered = ref(0)
const vehicles = ref<AdminVehicle[]>([])
const loading = ref(false)
const error = ref('')

// ── Expanded vehicle (order history accordion) ────────────────────
const expandedId = ref<string | null>(null)
function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

// ── Status config ─────────────────────────────────────────────────
const statusOptions: { label: string; value: string }[] = [
  { label: 'Alle', value: '' },
  { label: 'Bestellt', value: 'order_placed' },
  { label: 'Bestätigt', value: 'confirmed' },
  { label: 'Geprüft', value: 'inspected' },
  { label: 'Geliefert', value: 'delivered' },
  { label: 'Abgeschlossen', value: 'completed' },
]

const statusStyle: Record<string, { bg: string; fg: string }> = {
  order_placed: { bg: 'rgba(239,132,80,0.1)', fg: '#c0622e' },
  confirmed: { bg: 'rgba(99,102,241,0.1)', fg: '#4f46e5' },
  inspected: { bg: 'rgba(1,185,144,0.1)', fg: '#00856a' },
  delivered: { bg: 'rgba(16,57,59,0.08)', fg: '#10393b' },
  completed: { bg: 'rgba(16,57,59,0.08)', fg: '#10393b' },
}

function getStatus(s: string | null | undefined) {
  const key = s ?? '';
  const style = statusStyle[key] ?? { bg: 'rgba(0,0,0,0.05)', fg: '#6b7280' };
  const opt = statusOptions.find(o => o.value === key);
  return { ...style, label: opt?.label ?? s ?? '—' };
}

function getTimelineData(vehicle: AdminVehicle) {
  const timeline: {
    datetime: string;
    label: string;
    sublabel?: string;
    completed: boolean;
  }[] = [];

  // Check if we have any orders
  const allOrders = [];
  if (vehicle.current_auftragsnummer) {
    allOrders.push({
      id: 'current',
      auftragsnummer: vehicle.current_auftragsnummer,
      leasyback_partner: '',
      order_status: vehicle.current_order_status,
      created_at: vehicle.current_order_created_at
    });
  }
  if (vehicle.order_history?.length) {
    allOrders.push(...vehicle.order_history);
  }

  // Flatten
  if (allOrders.length > 0) {
    // Add status as first entry
    const firstOrder = vehicle.current_auftragsnummer ? {
      auftragsnummer: vehicle.current_auftragsnummer,
      order_status: vehicle.current_order_status,
      created_at: vehicle.current_order_created_at
    } : vehicle.order_history[0];
    timeline.push({
      datetime: '',
      label: `STATUS: ${firstOrder.order_status ? firstOrder.order_status.replace("_", " ").toUpperCase() : 'KEINE AUFTRÄGE'}`,
      completed: false,
    });

    // Add all orders to timeline - set all to true for testing!
    allOrders.reverse().forEach((order, idx) => {
      timeline.push({
        datetime: order.created_at ?
          new Date(order.created_at).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }) + '\n' + new Date(order.created_at).toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
          }) + ' Uhr' : '',
        label: order.auftragsnummer || '',
        sublabel: order.leasyback_partner || '',
        completed: true, // Force true for testing
      });
    });
  } else {
    // Fallback
    timeline.push({
      datetime: '',
      label: 'STATUS: KEINE AUFTRÄGE',
      sublabel: '',
      completed: false
    });
  }

  return timeline;
}

// ── Pagination ────────────────────────────────────────────────────
const totalPages = computed(() => Math.ceil(total.value / limit.value) || 1)

function pageRange(current: number, last: number): (number | '…')[] {
  const out: (number | '…')[] = []
  for (let i = 1; i <= last; i++) {
    if (i === 1 || i === last || Math.abs(i - current) <= 1) out.push(i)
    else if (out[out.length - 1] !== '…') out.push('…')
  }
  return out
}

// ── Fetch ─────────────────────────────────────────────────────────
async function loadVehicles() {
  loading.value = true
  error.value = ''
  try {
    const res = userType.value === 'all'
      ? await adminVehiclesApi.listAll(page.value, limit.value)
      : await adminVehiclesApi.listByUserType(
        userType.value, page.value, limit.value,
        statusFilter.value || undefined,
      )
    vehicles.value = res.data
    total.value = res.total
    totalActive.value = res.total_active ?? 0
    totalCompleted.value = res.total_completed ?? 0
    totalConfirmed.value = res.total_confirmed ?? 0
    totalInspected.value = res.total_inspected ?? 0
    totalDelivered.value = res.total_delivered ?? 0
  } catch {
    error.value = 'Fahrzeuge konnten nicht geladen werden.'
  } finally {
    loading.value = false
  }
}

// ── Watchers ──────────────────────────────────────────────────────
watch(userType, () => { page.value = 1; statusFilter.value = '' })
watch(statusFilter, () => { page.value = 1 })
watch([userType, statusFilter, page], () => void loadVehicles())
onMounted(() => void loadVehicles())
</script>

<template>
  <div class="flex flex-col gap-5 h-full">

    <!-- ── FLOATING HEADER ── -->
    <header
      class="flex items-center gap-4 h-[60px] bg-white/70 backdrop-blur border border-[#eaf0ef] rounded-[18px] px-5 shrink-0"
      style="box-shadow:0 4px 18px rgba(16,57,59,0.04)">
      <div class="flex-1">
        <h1 class="text-[18px] font-extrabold text-[#10393b] tracking-[-0.4px]">Fahrzeugverwaltung</h1>
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
            : 'text-[#6f8585] hover:text-[#10393b]'">{{ opt.label }}</button>
      </div>
    </header>

    <!-- ── MAIN CARD ── -->
    <section class="flex-1 flex flex-col bg-white border border-[#eef3f2] rounded-[24px] p-6 min-h-0"
      style="box-shadow:0 6px 22px rgba(16,57,59,0.04)">
      <!-- Card header -->
      <div class="flex items-start justify-between mb-4 shrink-0 gap-4 flex-wrap">
        <div>
          <h2 class="text-[20px] font-extrabold text-[#10393b] tracking-[-0.4px]">
            {{ userType === 'all' ? 'Alle Fahrzeuge' : userType === 'Firmenkunde' ? 'Firmenkunden Fahrzeuge' :
              'Privatkunden Fahrzeuge' }}
          </h2>
          <p class="text-[12px] text-[#9bb0af] mt-0.5 font-medium">{{ total }} Fahrzeuge gesamt</p>
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
            : 'bg-[#f4f7f6] text-[#6f8585] hover:bg-[#eaf0ef] hover:text-[#10393b]'">{{ opt.label }}</button>
      </div>

      <!-- Error -->
      <div v-if="error"
        class="mb-4 px-4 py-3 rounded-[13px] bg-red-50 border border-red-200 text-[13px] text-red-700 shrink-0">{{ error
        }}</div>

      <!-- Table -->
      <div class="flex-1 overflow-auto rounded-[18px] border border-[#eef3f2] min-h-0">
        <table class="min-w-full border-collapse">
          <thead class="sticky top-0 z-10">
            <tr class="bg-[#f8faf9]">
              <th
                class="text-left text-[11px] font-bold text-[#9bb0af] uppercase tracking-[0.1em] px-5 py-3.5 border-b border-[#eef3f2]">
                Fahrzeug</th>
              <th
                class="text-left text-[11px] font-bold text-[#9bb0af] uppercase tracking-[0.1em] px-5 py-3.5 border-b border-[#eef3f2]">
                Kennzeichen / VIN</th>
              <th
                class="text-left text-[11px] font-bold text-[#9bb0af] uppercase tracking-[0.1em] px-5 py-3.5 border-b border-[#eef3f2]">
                Kunde</th>
              <th
                class="text-left text-[11px] font-bold text-[#9bb0af] uppercase tracking-[0.1em] px-5 py-3.5 border-b border-[#eef3f2]">
                Auftragsstatus</th>
              <th
                class="text-left text-[11px] font-bold text-[#9bb0af] uppercase tracking-[0.1em] px-5 py-3.5 border-b border-[#eef3f2]">
                Leasingende</th>
              <th class="border-b border-[#eef3f2] w-12"></th>
            </tr>
          </thead>
          <tbody>
            <!-- Skeleton -->
            <template v-if="loading">
              <tr v-for="i in 8" :key="i">
                <td colspan="6" class="px-5 py-4">
                  <div class="h-4 rounded-full bg-[#f4f7f6] animate-pulse" :style="{ width: (55 + (i % 5) * 9) + '%' }">
                  </div>
                </td>
              </tr>
            </template>

            <!-- Empty -->
            <tr v-else-if="!vehicles.length">
              <td colspan="6" class="py-16 text-center text-[13px] text-[#9bb0af]">
                Keine Fahrzeuge gefunden.
              </td>
            </tr>

            <!-- Rows — each row + optional accordion for order history -->
            <template v-else v-for="v in vehicles" :key="v.vehicle_id">
              <tr class="group cursor-pointer border-b border-[#eef3f2] hover:bg-[#f6f9f8] transition-colors"
                :class="expandedId === v.vehicle_id ? 'bg-[#f6f9f8]' : ''" @click="toggleExpand(v.vehicle_id)">
                <!-- Make + Model -->
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                      style="background:rgba(16,57,59,0.07); color:#10393b">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="1.8">
                        <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-1" />
                        <circle cx="9" cy="17" r="2" />
                        <circle cx="17" cy="17" r="2" />
                      </svg>
                    </div>
                    <div>
                      <div class="text-[13.5px] font-bold text-[#10393b]">{{ v.make }} {{ v.model }}</div>
                      <div class="text-[11px] text-[#9bb0af] mt-0.5">{{ v.vehicle_belongs }}</div>
                    </div>
                  </div>
                </td>

                <!-- Plate + VIN -->
                <td class="px-5 py-3.5">
                  <div class="text-[13px] font-semibold text-[#10393b]">{{ v.license_plate }}</div>
                  <div class="text-[11px] font-mono text-[#9bb0af] mt-0.5">{{ v.vin }}</div>
                </td>

                <!-- Customer -->
                <td class="px-5 py-3.5">
                  <div class="text-[13px] text-[#5a6e6c]">
                    {{ v.company_name ?? v.user_email ?? '—' }}
                  </div>
                  <div class="text-[11px] text-[#9bb0af] mt-0.5">{{ v.user_type }}</div>
                </td>

                <!-- Order status -->
                <td class="px-5 py-3.5">
                  <span v-if="v.current_order_status"
                    class="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                    :style="`background:${getStatus(v.current_order_status).bg}; color:${getStatus(v.current_order_status).fg}`">
                    <span class="w-[5px] h-[5px] rounded-full bg-current"></span>
                    {{ getStatus(v.current_order_status).label }}
                  </span>
                  <span v-else class="text-[12px] text-[#9bb0af]">—</span>
                </td>

                <!-- Leasing end -->
                <td class="px-5 py-3.5 text-[12.5px] text-[#9bb0af] tabular-nums">
                  {{ formatGermanDate(v.leasing_end_date) }}
                </td>

                <!-- Expand toggle -->
                <td class="px-3 py-3.5">
                  <span class="w-8 h-8 flex items-center justify-center rounded-[9px]
                           text-[#bcccca] group-hover:bg-[#10393b] group-hover:text-white transition-all">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
                      class="transition-transform duration-200"
                      :class="expandedId === v.vehicle_id ? 'rotate-180' : ''">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </td>
              </tr>

              <!-- Order history accordion -->
              <Transition name="accordion">
                <tr v-if="expandedId === v.vehicle_id">
                  <td colspan="6" class="px-5 pb-4 pt-0 bg-[#f8faf9]">
                    <div class="flex flex-col overflow-hidden rounded-3xl border bg-white"
                      style="border-color: #ececec">
                      <div class="px-6 py-5 flex items-center justify-between">
                        <p class="text-[16px] font-bold text-[#000000] leading-tight uppercase">
                          {{ getTimelineData(v)[0]?.label || "STATUS: KEINE AUFTRÄGE" }}
                        </p>
                      </div>

                      <!-- Timeline rows -->
                      <div class="flex-1 px-6 pb-5">
                        <div v-for="(entry, i) in getTimelineData(v).slice(1)" :key="i"
                          class="relative flex items-start pb-6">
                          <!-- Vertical line -->
                          <div v-if="i < getTimelineData(v).slice(1).length - 1"
                            class="absolute left-2 top-5 w-0.5 h-full" :style="entry.completed
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
                              <p v-if="entry.sublabel"
                                class="whitespace-pre-line text-[14px] text-[#2e3e3f] font-normal">
                                {{ entry.sublabel }}
                              </p>
                            </template>
                            <template v-else>
                              <p class="text-[14px] text-[#2e3e3f] font-normal">
                                {{ entry.label }}
                              </p>
                              <p v-if="entry.sublabel"
                                class="whitespace-pre-line text-[14px] text-[#2e3e3f] font-normal">
                                {{ entry.sublabel }}
                              </p>
                            </template>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </Transition>
            </template>

          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-4 shrink-0">
        <span class="text-[12px] text-[#9bb0af] font-medium">Seite {{ page }} von {{ totalPages }}</span>
        <div class="flex gap-1">
          <button @click="page--" :disabled="page <= 1" class="w-8 h-8 flex items-center justify-center rounded-[8px] border border-[#eef3f2]
                   text-[#6f8585] hover:border-[#10393b] hover:text-[#10393b]
                   disabled:opacity-35 disabled:cursor-not-allowed transition-all">←</button>
          <button v-for="p in pageRange(page, totalPages)" :key="String(p)" @click="typeof p === 'number' && (page = p)"
            class="w-8 h-8 flex items-center justify-center rounded-[8px] border
                   text-[12.5px] font-bold transition-all font-[Manrope,sans-serif]" :class="p === page
                    ? 'bg-[#10393b] border-[#10393b] text-white'
                    : p === '…'
                      ? 'border-transparent text-[#9bb0af] cursor-default'
                      : 'border-[#eef3f2] text-[#6f8585] hover:border-[#10393b] hover:text-[#10393b]'">{{ p }}</button>
          <button @click="page++" :disabled="page >= totalPages" class="w-8 h-8 flex items-center justify-center rounded-[8px] border border-[#eef3f2]
                   text-[#6f8585] hover:border-[#10393b] hover:text-[#10393b]
                   disabled:opacity-35 disabled:cursor-not-allowed transition-all">→</button>
        </div>
      </div>
    </section>
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