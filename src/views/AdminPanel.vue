<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAdminStore } from '@/stores/admin.store'
import { useAuthStore }  from '@/stores/auth.store'
import { adminUsersApi, adminVehiclesApi, adminOrdersApi } from '@/api'
import { formatGermanDate } from '@/lib/formatting'
import UserDetailModal from '@/components/admin/UserDetail.vue'
import type { AdminUser, AdminVehicle, AdminOrder } from '@/types'

const adminStore = useAdminStore()
const auth       = useAuthStore()

// ── Header ────────────────────────────────────────────────────────
const search = ref('')
const today  = new Intl.DateTimeFormat('de-DE', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
}).format(new Date())

const headerUserName = computed(() => {
  const u = auth.user as any
  if (!u) return 'Administrator'
  if (u.first_name && u.last_name) return `${u.first_name} ${u.last_name}`
  return u.name ?? u.email ?? 'Administrator'
})
const headerInitials = computed(() => {
  const parts = headerUserName.value.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : headerUserName.value.slice(0, 2).toUpperCase()
})

// ── Active KPI panel ──────────────────────────────────────────────
// null = show default recent-orders view
// 'users' | 'vehicles' | 'orders' = show inline panel
type PanelType = null | 'users' | 'vehicles' | 'orders'
const activePanel      = ref<PanelType>(null)
const userClickedPanel = ref(false)  // true only when user explicitly clicks a KPI card

// ── Status helpers (shared) ───────────────────────────────────────
const statusStyle: Record<string, { bg: string; fg: string; label: string }> = {
  order_placed: { label: 'Bestellt',      bg: 'rgba(239,132,80,0.1)',  fg: '#c0622e' },
  confirmed:    { label: 'Bestätigt',     bg: 'rgba(99,102,241,0.1)',  fg: '#4f46e5' },
  inspected:    { label: 'Geprüft',       bg: 'rgba(1,185,144,0.1)',   fg: '#00856a' },
  delivered:    { label: 'Geliefert',     bg: 'rgba(16,57,59,0.08)',   fg: '#10393b' },
  completed:    { label: 'Abgeschlossen', bg: 'rgba(16,57,59,0.08)',   fg: '#10393b' },
}
function getStatus(s: string | null | undefined) {
  return statusStyle[s ?? ''] ?? { label: s ?? '—', bg: 'rgba(0,0,0,0.05)', fg: '#6b7280' }
}

// ── INLINE USERS ──────────────────────────────────────────────────
const panelUsers        = ref<AdminUser[]>([])
const panelUsersPage    = ref(1)
const panelUsersTotal   = ref(0)
const panelUsersLoading = ref(false)
const panelUsersType    = ref<'B2C' | 'B2B'>('B2C')
const panelUsersLimit   = 10

const panelUsersTotalPages = computed(() =>
  Math.ceil(panelUsersTotal.value / panelUsersLimit) || 1
)

async function loadPanelUsers() {
  panelUsersLoading.value = true
  try {
    const res = panelUsersType.value === 'B2C'
      ? await adminUsersApi.getB2c(panelUsersPage.value, panelUsersLimit)
      : await adminUsersApi.getB2b(panelUsersPage.value, panelUsersLimit)
    panelUsers.value      = res.data
    panelUsersTotal.value = res.total
  } finally {
    panelUsersLoading.value = false
  }
}

watch(panelUsersType, () => { panelUsersPage.value = 1; void loadPanelUsers() })
watch(panelUsersPage, () => void loadPanelUsers())

// ── INLINE VEHICLES ───────────────────────────────────────────────
const panelVehicles        = ref<AdminVehicle[]>([])
const panelVehiclesPage    = ref(1)
const panelVehiclesTotal   = ref(0)
const panelVehiclesLoading = ref(false)
const panelVehiclesLimit   = 10

const panelVehiclesTotalPages = computed(() =>
  Math.ceil(panelVehiclesTotal.value / panelVehiclesLimit) || 1
)

async function loadPanelVehicles() {
  panelVehiclesLoading.value = true
  try {
    const res = await adminVehiclesApi.listAll(panelVehiclesPage.value, panelVehiclesLimit)
    panelVehicles.value      = res.data
    panelVehiclesTotal.value = res.total
  } finally {
    panelVehiclesLoading.value = false
  }
}

watch(panelVehiclesPage, () => void loadPanelVehicles())

// ── INLINE ORDERS ─────────────────────────────────────────────────
const panelOrders        = ref<AdminOrder[]>([])
const panelOrdersPage    = ref(1)
const panelOrdersTotal   = ref(0)
const panelOrdersLoading = ref(false)
const panelOrdersLimit   = 10
const panelOrdersFilter  = ref('Alle')
const panelOrdersFilters = ['Alle', 'Offen', 'Abgeschlossen']

const panelOrdersTotalPages = computed(() =>
  Math.ceil(panelOrdersTotal.value / panelOrdersLimit) || 1
)

const filteredPanelOrders = computed(() => {
  if (panelOrdersFilter.value === 'Offen')        return panelOrders.value.filter(o => o.order_status !== 'completed')
  if (panelOrdersFilter.value === 'Abgeschlossen') return panelOrders.value.filter(o => o.order_status === 'completed')
  return panelOrders.value
})

async function loadPanelOrders() {
  panelOrdersLoading.value = true
  try {
    const res = await adminOrdersApi.listAll(panelOrdersPage.value, panelOrdersLimit)
    panelOrders.value      = res.data
    panelOrdersTotal.value = res.total
  } finally {
    panelOrdersLoading.value = false
  }
}

watch(panelOrdersPage, () => void loadPanelOrders())

// ── KPI card click → activate panel ──────────────────────────────
function activatePanel(type: PanelType) {
  userClickedPanel.value = true
  if (activePanel.value === type) { activePanel.value = null; userClickedPanel.value = false; return }
  activePanel.value = type
  if (type === 'users')    { panelUsersPage.value = 1;    void loadPanelUsers() }
  if (type === 'vehicles') { panelVehiclesPage.value = 1; void loadPanelVehicles() }
  if (type === 'orders')   { panelOrdersPage.value = 1;   void loadPanelOrders() }
}

// ── User detail modal ─────────────────────────────────────────────
const selectedUser = ref<AdminUser | null>(null)
const modalOpen    = ref(false)
function openModal(u: AdminUser) { selectedUser.value = u; modalOpen.value = true }
function closeModal() { modalOpen.value = false; selectedUser.value = null }

// ── Summary KPI data ──────────────────────────────────────────────
const kpis = computed(() => [
  {
    id: 'users', panel: 'users' as PanelType,
    label: 'Kunden gesamt',
    value: adminStore.totalCustomers.toLocaleString('de-DE'),
    sub: `B2B: ${adminStore.totalB2B} · B2C: ${adminStore.totalB2C}`,
    foot: `${adminStore.totalB2B} Firmen`,
    bars: [40,55,45,70,60,85,75],
    color: '#10393b', tint: 'rgba(16,57,59,0.08)',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`,
  },
  {
    id: 'vehicles', panel: 'vehicles' as PanelType,
    label: 'Fahrzeuge',
    value: adminStore.totalVehicles.toLocaleString('de-DE'),
    sub: 'Im Fuhrpark', foot: 'Alle Fahrzeuge',
    bars: [55,60,50,65,70,68,80],
    color: '#ef8450', tint: 'rgba(239,132,80,0.1)',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-1"/><circle cx="9" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`,
  },
  {
    id: 'orders', panel: 'orders' as PanelType,
    label: 'Aufträge gesamt',
    value: adminStore.totalOrders.toLocaleString('de-DE'),
    sub: `${adminStore.completedOrders} abgeschlossen`,
    foot: `${adminStore.pendingInspections} ausstehend`,
    bars: [50,45,60,55,65,60,70],
    color: '#6366f1', tint: 'rgba(99,102,241,0.1)',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/></svg>`,
  },
])

// ── Donut ─────────────────────────────────────────────────────────
const donutDist = computed(() => [
  { label: 'Aktiv',         count: adminStore.activeOrders,       color: '#01B990' },
  { label: 'Abgeschlossen', count: adminStore.completedOrders,    color: '#10393b' },
  { label: 'Ausstehend',    count: adminStore.pendingInspections, color: '#ef8450' },
])
const donutTotal = computed(() => donutDist.value.reduce((s, d) => s + d.count, 0))
const donutSegments = computed(() => {
  const C = 2 * Math.PI * 48; let acc = 0
  return donutDist.value.map(s => {
    const len = donutTotal.value > 0 ? (s.count / donutTotal.value) * C : 0
    const seg = { color: s.color, label: s.label, dash: `${Math.max(len - 4, 0)} ${C}`, offset: -acc }
    acc += len; return seg
  })
})

// ── Pagination helper ─────────────────────────────────────────────
function pageRange(current: number, last: number): (number | '…')[] {
  const out: (number | '…')[] = []
  for (let i = 1; i <= last; i++) {
    if (i === 1 || i === last || Math.abs(i - current) <= 1) out.push(i)
    else if (out[out.length - 1] !== '…') out.push('…')
  }
  return out
}

function userInitials(u: AdminUser) {
  return ((u.first_name?.[0] ?? '') + (u.last_name?.[0] ?? '')).toUpperCase() || '?'
}

const services = [
  { name: 'API-Gateway',     status: 'ok',   label: 'Aktiv' },
  { name: 'Datenbank',       status: 'ok',   label: 'Aktiv' },
  { name: 'E-Mail-Dienst',   status: 'ok',   label: 'Aktiv' },
  { name: 'Hintergrundjobs', status: 'warn', label: 'Verzögert' },
]

onMounted(async () => {
  await adminStore.fetchSummary()
  // Show recent orders in the panel by default (same as old behaviour)
  activePanel.value = 'orders'
  await loadPanelOrders()
})
</script>

<template>
  <div class="flex flex-col gap-5 h-full">

    <!-- ── FLOATING HEADER ── -->
    <header
      class="flex items-center gap-4 h-[60px] bg-white/70 backdrop-blur border border-[#eaf0ef] rounded-[18px] px-4 shrink-0"
      style="box-shadow:0 4px 18px rgba(16,57,59,0.04)"
    >
      <div class="w-[300px] flex items-center gap-2.5 bg-[#f4f7f6] rounded-[12px] px-3.5 py-2.5 text-[#6f8585]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input v-model="search" type="text" placeholder="Suchen…"
          class="flex-1 min-w-0 bg-transparent border-none outline-none text-[13.5px] text-[#1a2e2f] placeholder:text-[#9bb0af] font-[Manrope,sans-serif]" />
        <kbd class="text-[10px] font-bold text-[#9bb0af] bg-white border border-[#e9efee] px-1.5 py-0.5 rounded">⌘K</kbd>
      </div>
      <div class="flex items-center gap-2.5 ml-auto">
        <button class="relative w-10 h-10 rounded-[12px] bg-[#f4f7f6] text-[#6f8585] flex items-center justify-center hover:bg-[#eaf0ef] hover:text-[#10393b] transition-all">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
          <span class="absolute top-2.5 right-2.5 w-[7px] h-[7px] bg-[#ef8450] rounded-full border-2 border-white"></span>
        </button>
        <div class="flex items-center gap-2.5 pl-1 pr-3 py-1 bg-[#f4f7f6] rounded-[12px] cursor-pointer hover:bg-[#eaf0ef] transition-all">
          <div class="w-8 h-8 rounded-[9px] text-white text-[11px] font-extrabold flex items-center justify-center" style="background:linear-gradient(150deg,#01B990,#10393b)">
            {{ headerInitials }}
          </div>
          <div class="flex flex-col leading-tight">
            <span class="text-[12.5px] font-bold text-[#10393b]">{{ headerUserName }}</span>
            <span class="text-[10.5px] text-[#9bb0af]">Administrator</span>
          </div>
        </div>
      </div>
    </header>

    <!-- ── SCROLLABLE CONTENT ── -->
    <div class="flex-1 flex flex-col gap-5 overflow-y-auto pr-1 pb-4">

      <!-- Title row -->
      <div class="flex items-end justify-between">
        <div>
          <p class="text-[12px] font-bold text-[#01B990] capitalize mb-1.5">{{ today }}</p>
          <h1 class="text-[34px] font-extrabold text-[#10393b] tracking-[-1.2px] leading-none">Übersicht</h1>
          <p class="text-[13.5px] text-[#6f8585] mt-2 font-medium">Willkommen zurück — der aktuelle Stand Ihrer Flotte.</p>
        </div>
        <div class="flex gap-2.5">
          <button class="flex items-center gap-1.5 text-[13px] font-bold text-[#10393b] bg-white border border-[#e9efee] px-[18px] py-2.5 rounded-[13px] hover:border-[#d6dddd] hover:shadow-sm transition-all font-[Manrope,sans-serif]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
          <button class="flex items-center gap-1.5 text-[13px] font-bold text-white px-[18px] py-2.5 rounded-[13px] hover:-translate-y-px transition-all font-[Manrope,sans-serif]" style="background:linear-gradient(135deg,#10393b,#1a5052);box-shadow:0 8px 20px rgba(16,57,59,0.2)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Neuer Auftrag
          </button>
        </div>
      </div>

      <!-- ═══ KPI GRID ═══ -->
      <div class="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 max-[1180px]:grid-cols-2">

        <!-- Hero KPI — active orders — always clickable to orders panel -->
        <div
          class="relative overflow-hidden rounded-[24px] p-6 min-h-[210px] flex flex-col text-white max-[1180px]:col-span-2 hover:-translate-y-0.5 transition-transform duration-200 cursor-pointer"
          :style="`background:linear-gradient(150deg,#10393b 0%,#17494b 58%,#1a5052 100%);
            box-shadow:0 18px 44px rgba(16,57,59,0.2);
            ${activePanel === 'orders' ? 'ring:3px solid #01B990' : ''}`"
          :class="activePanel === 'orders' ? 'ring-2 ring-[#01B990] ring-offset-2' : ''"
          @click="activatePanel('orders')"
        >
          <div class="absolute w-60 h-60 rounded-full -top-24 -right-20 blur-[14px]" style="background:radial-gradient(circle,rgba(1,185,144,0.4),transparent 70%)"></div>
          <div class="relative z-10 flex items-center justify-between">
            <div class="w-12 h-12 rounded-[15px] bg-[#01B990]/[0.18] border border-[#01B990]/25 text-[#01B990] flex items-center justify-center">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/></svg>
            </div>
            <span class="inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full bg-[#01B990]/20 text-[#5fe6c2]">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M9 18l6-6-6-6"/>
              </svg>
              {{ activePanel === 'orders' && userClickedPanel ? 'Aktiv' : 'Anzeigen' }}
            </span>
          </div>
          <div class="relative z-10 mt-auto pt-6">
            <p class="text-[13px] font-semibold text-white/60">Offene Aufträge</p>
            <div v-if="adminStore.summaryLoading" class="w-16 h-14 rounded-xl bg-white/10 animate-pulse my-1"></div>
            <div v-else class="text-[54px] font-extrabold tracking-[-2px] leading-none my-1">{{ adminStore.activeOrders }}</div>
            <p class="text-[12.5px] text-white/55 font-medium">{{ adminStore.pendingInspections }} Inspektionen ausstehend</p>
          </div>
          <svg class="absolute bottom-0 left-0 w-full h-12" viewBox="0 0 200 48" preserveAspectRatio="none">
            <defs><linearGradient id="sf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#01B990" stop-opacity="0.35"/><stop offset="100%" stop-color="#01B990" stop-opacity="0"/></linearGradient></defs>
            <path d="M0 38 L25 30 L50 34 L75 22 L100 26 L125 14 L150 20 L175 8 L200 12 L200 48 L0 48 Z" fill="url(#sf)"/>
            <path d="M0 38 L25 30 L50 34 L75 22 L100 26 L125 14 L150 20 L175 8 L200 12" fill="none" stroke="#01B990" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <!-- Standard KPI cards -->
        <div
          v-for="k in kpis" :key="k.id"
          class="bg-white border border-[#eef3f2] rounded-[22px] p-5 flex flex-col
                 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(16,57,59,0.07)]
                 transition-all duration-200 cursor-pointer"
          :class="activePanel === k.panel ? 'ring-2 ring-[#01B990] ring-offset-1 shadow-[0_14px_30px_rgba(16,57,59,0.07)]' : ''"
          style="box-shadow:0 4px 16px rgba(16,57,59,0.03)"
          @click="activatePanel(k.panel)"
        >
          <div class="flex items-center justify-between">
            <div class="w-11 h-11 rounded-[14px] flex items-center justify-center" :style="{ background: k.tint, color: k.color }">
              <span v-html="k.icon"></span>
            </div>
            <span class="text-[11px] font-semibold text-[#9bb0af] text-right max-w-[110px] leading-tight">{{ k.sub }}</span>
          </div>
          <div class="mt-auto pt-5">
            <div v-if="adminStore.summaryLoading" class="w-20 h-9 rounded-lg bg-[#f4f7f6] animate-pulse mb-1.5"></div>
            <div v-else class="text-[34px] font-extrabold text-[#10393b] tracking-[-1.2px] leading-none tabular-nums">{{ k.value }}</div>
            <p class="text-[12.5px] text-[#6f8585] font-semibold mt-1.5">{{ k.label }}</p>
          </div>
          <div class="flex items-end justify-between mt-4">
            <div class="flex items-end gap-[3px] h-[26px]">
              <span v-for="(b,i) in k.bars" :key="i" class="w-[5px] rounded-sm block"
                :style="{ height: b + '%', background: k.color, opacity: 0.22 + (i/k.bars.length)*0.78 }"></span>
            </div>
            <span class="text-[11px] font-bold px-2 py-0.5 rounded-full transition-all"
              :style="activePanel === k.panel ? `background:${k.tint}; color:${k.color}` : 'color:#9bb0af'">
              {{ activePanel === k.panel && userClickedPanel ? '← Schließen' : k.foot }}
            </span>
          </div>
        </div>
      </div>

      <!-- ═══ BOTTOM GRID — left panel changes, right column always visible ═══ -->
      <div class="grid grid-cols-[1.6fr_1fr] gap-4 items-start max-[1180px]:grid-cols-1">

        <!-- ── LEFT: dynamic panel ── -->
        <Transition name="panel" mode="out-in">

          <!-- USERS PANEL -->
          <section v-if="activePanel === 'users'" key="users"
            class="bg-white border border-[#eef3f2] rounded-[24px] p-6"
            style="box-shadow:0 6px 22px rgba(16,57,59,0.04)"
          >
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-[17px] font-extrabold text-[#10393b] tracking-[-0.3px]">Kunden</h2>
                <p class="text-[12px] text-[#9bb0af] mt-0.5 font-medium">{{ panelUsersTotal }} gesamt</p>
              </div>
              <div class="flex items-center gap-3">
                <div class="flex gap-0.5 bg-[#f4f7f6] p-[3px] rounded-[12px]">
                  <button v-for="opt in [{ label: 'Privatkunden', val: 'B2C' }, { label: 'Firmenkunden', val: 'B2B' }]" :key="opt.val"
                    @click="panelUsersType = opt.val as 'B2C' | 'B2B'"
                    class="text-[12px] font-bold px-3.5 py-1.5 rounded-[9px] transition-all font-[Manrope,sans-serif]"
                    :class="panelUsersType === opt.val ? 'bg-white text-[#10393b] shadow-[0_1px_5px_rgba(16,57,59,0.1)]' : 'text-[#6f8585] hover:text-[#10393b]'"
                  >{{ opt.label }}</button>
                </div>
              </div>
            </div>
            <div v-if="panelUsersLoading" class="flex flex-col gap-2">
              <div v-for="i in 6" :key="i" class="h-[54px] rounded-[15px] bg-[#f4f7f6] animate-pulse"></div>
            </div>
            <div v-else class="flex flex-col gap-1">
              <div v-if="!panelUsers.length" class="py-10 text-center text-[13px] text-[#9bb0af]">Keine Kunden gefunden.</div>
              <div v-for="u in panelUsers" :key="u.user_id"
                class="group flex items-center gap-3 py-2.5 px-3 rounded-[13px] hover:bg-[#f6f9f8] transition-colors cursor-pointer"
                @click="openModal(u)"
              >
                <div class="w-9 h-9 rounded-[10px] flex items-center justify-center text-[11px] font-extrabold text-white shrink-0"
                  style="background:linear-gradient(150deg,#01B990,#10393b)">{{ userInitials(u) }}</div>
                <div class="flex-1 min-w-0">
                  <div class="text-[13px] font-bold text-[#10393b] truncate">{{ u.salutation }} {{ u.first_name }} {{ u.last_name }}</div>
                  <div class="text-[11.5px] text-[#6f8585] truncate">{{ u.user_email }}</div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full"
                    :class="u.is_active ? 'bg-[#01B990]/10 text-[#00856a]' : 'bg-[#ef8450]/10 text-[#c0622e]'">
                    <span class="w-[4px] h-[4px] rounded-full bg-current"></span>
                    {{ u.is_active ? 'Aktiv' : 'Inaktiv' }}
                  </span>
                  <span class="w-7 h-7 flex items-center justify-center rounded-[8px] text-[#bcccca] group-hover:bg-[#10393b] group-hover:text-white transition-all">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H8M17 7v9"/></svg>
                  </span>
                </div>
              </div>
            </div>
            <div class="flex items-center justify-between mt-4 pt-3 border-t border-[#eef3f2]">
              <span class="text-[11.5px] text-[#9bb0af]">{{ panelUsersPage }} / {{ panelUsersTotalPages }}</span>
              <div class="flex gap-1">
                <button @click="panelUsersPage--" :disabled="panelUsersPage <= 1" class="lb-pg">←</button>
                <button v-for="p in pageRange(panelUsersPage, panelUsersTotalPages)" :key="String(p)"
                  @click="typeof p === 'number' && (panelUsersPage = p)"
                  class="lb-pg" :class="{ 'lb-pg-active': p === panelUsersPage, 'lb-pg-dot': p === '…' }">{{ p }}</button>
                <button @click="panelUsersPage++" :disabled="panelUsersPage >= panelUsersTotalPages" class="lb-pg">→</button>
              </div>
            </div>
          </section>

          <!-- VEHICLES PANEL -->
          <section v-else-if="activePanel === 'vehicles'" key="vehicles"
            class="bg-white border border-[#eef3f2] rounded-[24px] p-6"
            style="box-shadow:0 6px 22px rgba(16,57,59,0.04)"
          >
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-[17px] font-extrabold text-[#10393b] tracking-[-0.3px]">Fahrzeuge</h2>
                <p class="text-[12px] text-[#9bb0af] mt-0.5 font-medium">{{ panelVehiclesTotal }} gesamt</p>
              </div>
            </div>
            <div v-if="panelVehiclesLoading" class="flex flex-col gap-2">
              <div v-for="i in 6" :key="i" class="h-[54px] rounded-[15px] bg-[#f4f7f6] animate-pulse"></div>
            </div>
            <div v-else class="flex flex-col gap-1">
              <div v-if="!panelVehicles.length" class="py-10 text-center text-[13px] text-[#9bb0af]">Keine Fahrzeuge gefunden.</div>
              <div v-for="v in panelVehicles" :key="v.vehicle_id"
                class="flex items-center gap-3 py-2.5 px-3 rounded-[13px] hover:bg-[#f6f9f8] transition-colors"
              >
                <div class="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                  style="background:rgba(239,132,80,0.1); color:#ef8450">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-1"/><circle cx="9" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-[13px] font-bold text-[#10393b]">{{ v.make }} {{ v.model }}</div>
                  <div class="text-[11.5px] text-[#6f8585] font-mono truncate">{{ v.license_plate }} · {{ v.vin }}</div>
                </div>
                <span v-if="v.current_order_status"
                  class="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  :style="`background:${getStatus(v.current_order_status).bg}; color:${getStatus(v.current_order_status).fg}`">
                  <span class="w-[4px] h-[4px] rounded-full bg-current"></span>
                  {{ getStatus(v.current_order_status).label }}
                </span>
              </div>
            </div>
            <div class="flex items-center justify-between mt-4 pt-3 border-t border-[#eef3f2]">
              <span class="text-[11.5px] text-[#9bb0af]">{{ panelVehiclesPage }} / {{ panelVehiclesTotalPages }}</span>
              <div class="flex gap-1">
                <button @click="panelVehiclesPage--" :disabled="panelVehiclesPage <= 1" class="lb-pg">←</button>
                <button v-for="p in pageRange(panelVehiclesPage, panelVehiclesTotalPages)" :key="String(p)"
                  @click="typeof p === 'number' && (panelVehiclesPage = p)"
                  class="lb-pg" :class="{ 'lb-pg-active': p === panelVehiclesPage, 'lb-pg-dot': p === '…' }">{{ p }}</button>
                <button @click="panelVehiclesPage++" :disabled="panelVehiclesPage >= panelVehiclesTotalPages" class="lb-pg">→</button>
              </div>
            </div>
          </section>

          <!-- ORDERS PANEL (default) -->
          <section v-else key="orders"
            class="bg-white border border-[#eef3f2] rounded-[24px] p-6"
            style="box-shadow:0 6px 22px rgba(16,57,59,0.04)"
          >
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-[17px] font-extrabold text-[#10393b] tracking-[-0.3px]">Letzte Aufträge</h2>
                <p class="text-[12px] text-[#9bb0af] mt-0.5 font-medium">{{ panelOrdersTotal }} gesamt</p>
              </div>
              <div class="flex gap-0.5 bg-[#f4f7f6] p-[3px] rounded-[12px]">
                <button v-for="f in panelOrdersFilters" :key="f"
                  @click="panelOrdersFilter = f"
                  class="text-[12px] font-bold px-3.5 py-1.5 rounded-[9px] transition-all font-[Manrope,sans-serif]"
                  :class="panelOrdersFilter === f ? 'bg-white text-[#10393b] shadow-[0_1px_5px_rgba(16,57,59,0.1)]' : 'text-[#6f8585] hover:text-[#10393b]'"
                >{{ f }}</button>
              </div>
            </div>
            <div v-if="panelOrdersLoading" class="flex flex-col gap-2">
              <div v-for="i in 6" :key="i" class="h-[54px] rounded-[15px] bg-[#f4f7f6] animate-pulse"></div>
            </div>
            <div v-else class="flex flex-col gap-1">
              <div v-if="!filteredPanelOrders.length" class="py-10 text-center text-[13px] text-[#9bb0af]">Keine Aufträge gefunden.</div>
              <div v-for="o in filteredPanelOrders" :key="o.id"
                class="flex items-center gap-3 py-2.5 px-3 rounded-[13px] hover:bg-[#f6f9f8] transition-colors"
              >
                <div class="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                  style="background:rgba(99,102,241,0.1); color:#6366f1">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/></svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span class="text-[13px] font-bold text-[#10393b] font-mono">{{ o.auftragsnummer }}</span>
                    <span class="text-[11.5px] text-[#9bb0af]">{{ o.make }} {{ o.model }}</span>
                  </div>
                  <div class="text-[11.5px] text-[#6f8585] truncate">{{ o.company_name ?? o.user_email }}</div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full"
                    :style="`background:${getStatus(o.order_status).bg}; color:${getStatus(o.order_status).fg}`">
                    <span class="w-[4px] h-[4px] rounded-full bg-current"></span>
                    {{ getStatus(o.order_status).label }}
                  </span>
                  <span class="text-[11px] text-[#9bb0af] tabular-nums hidden lg:block">{{ formatGermanDate(o.created_at) }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center justify-between mt-4 pt-3 border-t border-[#eef3f2]">
              <span class="text-[11.5px] text-[#9bb0af]">{{ panelOrdersPage }} / {{ panelOrdersTotalPages }}</span>
              <div class="flex gap-1">
                <button @click="panelOrdersPage--" :disabled="panelOrdersPage <= 1" class="lb-pg">←</button>
                <button v-for="p in pageRange(panelOrdersPage, panelOrdersTotalPages)" :key="String(p)"
                  @click="typeof p === 'number' && (panelOrdersPage = p)"
                  class="lb-pg" :class="{ 'lb-pg-active': p === panelOrdersPage, 'lb-pg-dot': p === '…' }">{{ p }}</button>
                <button @click="panelOrdersPage++" :disabled="panelOrdersPage >= panelOrdersTotalPages" class="lb-pg">→</button>
              </div>
            </div>
          </section>

        </Transition>

        <!-- ── RIGHT: always visible stats ── -->
        <div class="flex flex-col gap-4">

          <!-- Alert banner -->
          <section v-if="adminStore.pendingInspections > 0"
            class="flex items-center gap-3 rounded-[20px] p-4 border border-[#ef8450]/[0.2]"
            style="background:linear-gradient(135deg,rgba(239,132,80,0.11),rgba(239,132,80,0.03))"
          >
            <div class="w-[40px] h-[40px] rounded-[13px] text-white flex items-center justify-center shrink-0 lb-pulse"
              style="background:linear-gradient(140deg,#f59b6c,#ef8450)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
            </div>
            <div class="flex-1 flex flex-col leading-tight min-w-0">
              <strong class="text-[13px] font-extrabold text-[#10393b]">
                {{ adminStore.pendingInspections }} ausstehende Inspektion{{ adminStore.pendingInspections > 1 ? 'en' : '' }}
              </strong>
              <span class="text-[11.5px] text-[#b06c44] font-semibold">Warten auf Bearbeitung</span>
            </div>
            <button class="flex items-center gap-1 text-[12px] font-bold text-white px-3 py-2 rounded-[10px] hover:translate-x-px transition-all shrink-0 font-[Manrope,sans-serif]"
              style="background:linear-gradient(140deg,#f59b6c,#ef8450)"
              @click="activatePanel('orders')">
              Anzeigen
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </section>

          <!-- Donut -->
          <section class="bg-white border border-[#eef3f2] rounded-[24px] p-6" style="box-shadow:0 6px 22px rgba(16,57,59,0.04)">
            <h2 class="text-[17px] font-extrabold text-[#10393b] tracking-[-0.3px] mb-5">Auftragsstatus</h2>
            <div v-if="adminStore.summaryLoading" class="flex items-center gap-5">
              <div class="w-[120px] h-[120px] rounded-full bg-[#f4f7f6] animate-pulse shrink-0"></div>
              <div class="flex-1 flex flex-col gap-3"><div v-for="i in 3" :key="i" class="h-5 rounded-lg bg-[#f4f7f6] animate-pulse"></div></div>
            </div>
            <div v-else class="flex items-center gap-4">
              <svg class="w-[120px] h-[120px] shrink-0" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="48" fill="none" stroke="#f0f4f3" stroke-width="14"/>
                <circle v-for="seg in donutSegments" :key="seg.label" cx="60" cy="60" r="48" fill="none"
                  :stroke="seg.color" stroke-width="14" :stroke-dasharray="seg.dash" :stroke-dashoffset="seg.offset"
                  stroke-linecap="round" transform="rotate(-90 60 60)"/>
                <text x="60" y="55" text-anchor="middle" style="font-size:24px;font-weight:800;fill:#10393b;font-family:Manrope">{{ donutTotal }}</text>
                <text x="60" y="72" text-anchor="middle" style="font-size:9px;font-weight:600;fill:#9bb0af;text-transform:uppercase;letter-spacing:0.08em;font-family:Manrope">Aufträge</text>
              </svg>
              <div class="flex-1 flex flex-col gap-3">
                <div v-for="s in donutDist" :key="s.label" class="flex items-center gap-2">
                  <span class="w-[8px] h-[8px] rounded-[3px] shrink-0" :style="{ background: s.color }"></span>
                  <span class="flex-1 text-[12px] text-[#6f8585] font-semibold">{{ s.label }}</span>
                  <span class="text-[13px] font-extrabold text-[#10393b] tabular-nums">{{ s.count }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- System status -->
          <section class="bg-white border border-[#eef3f2] rounded-[24px] p-6" style="box-shadow:0 6px 22px rgba(16,57,59,0.04)">
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-[17px] font-extrabold text-[#10393b] tracking-[-0.3px]">Systemstatus</h2>
              <span class="text-[11px] font-bold text-[#00856a] bg-[#01B990]/10 px-2.5 py-1 rounded-full">3 / 4 aktiv</span>
            </div>
            <div class="flex flex-col gap-3">
              <div v-for="svc in services" :key="svc.name" class="flex items-center gap-2.5">
                <span class="w-2 h-2 rounded-full shrink-0"
                  :class="svc.status === 'ok' ? 'bg-[#01B990] shadow-[0_0_0_3px_rgba(1,185,144,0.15)]' : 'bg-[#ef8450] shadow-[0_0_0_3px_rgba(239,132,80,0.15)]'"></span>
                <span class="flex-1 text-[13px] font-semibold text-[#1a2e2f]">{{ svc.name }}</span>
                <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                  :class="svc.status === 'ok' ? 'bg-[#01B990]/10 text-[#00856a]' : 'bg-[#ef8450]/10 text-[#c0622e]'">{{ svc.label }}</span>
              </div>
            </div>
          </section>

        </div><!-- end right column -->
      </div><!-- end bottom grid -->



    </div><!-- end scrollable content -->
  </div>

  <!-- User detail modal -->
  <UserDetailModal :user="selectedUser" :open="modalOpen" @close="closeModal" />
</template>

<style scoped>
/* Panel transition */
.panel-enter-active { transition: all 0.22s cubic-bezier(0.16,1,0.3,1); }
.panel-leave-active { transition: all 0.16s ease; }
.panel-enter-from   { opacity: 0; transform: translateY(10px); }
.panel-leave-to     { opacity: 0; transform: translateY(-4px); }

/* Pagination buttons */
.lb-pg {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid #eef3f2;
  color: #6f8585;
  font-family: Manrope, sans-serif;
  font-size: 12.5px;
  font-weight: 700;
  transition: all 150ms;
}

.lb-pg:hover:not(:disabled) {
  border-color: #10393b;
  color: #10393b;
}

.lb-pg:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.lb-pg-active {
  background: #10393b;
  border-color: #10393b;
  color: white;
}

.lb-pg-dot {
  border-color: transparent;
  color: #9bb0af;
  cursor: default;
}
/* Alert pulse */
.lb-pulse {
  box-shadow: 0 0 0 0 rgba(239,132,80,0.5);
  animation: lbpulse 2.2s infinite;
}
@keyframes lbpulse {
  0%   { box-shadow: 0 0 0 0    rgba(239,132,80,0.4); }
  70%  { box-shadow: 0 0 0 12px rgba(239,132,80,0);   }
  100% { box-shadow: 0 0 0 0    rgba(239,132,80,0);   }
}
</style>