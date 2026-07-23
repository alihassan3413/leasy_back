<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { adminDashboardApi, adminUsersApi, adminVehiclesApi, adminOrdersApi } from "@/api";
import StatusBadge from "@/components/ui/StatusBadge.vue";
import Pagination from "@/components/ui/Pagination.vue";
import SegmentedToggle from "@/components/ui/SegmentedToggle.vue";
import { formatGermanDate } from "@/lib/formatting";
import { getOrderStatusLabel, getVehicleStatusLabel, getUserStatusLabel } from "@/lib/status";
import type { AdminSummaryResponse, AdminUser, AdminVehicle, AdminOrder } from "@/types";

const activeSection = ref<"users" | "vehicles" | "orders">("users");
const summary = ref<AdminSummaryResponse | null>(null);
const loadingSummary = ref(false);
const loadingList = ref(false);
const listError = ref("");
const users = ref<AdminUser[]>([]);
const vehicles = ref<AdminVehicle[]>([]);
const orders = ref<AdminOrder[]>([]);
const recentOrders = ref<AdminOrder[]>([]);
const page = ref(1);
const limit = ref(10);
const userType = ref<"B2C" | "B2B">("B2C");
const vehicleUserType = ref<"Firmenkunde" | "Privatkunde">("Firmenkunde");
const orderUserType = ref<"Firmenkunde" | "Privatkunde">("Firmenkunde");
const vehicleStatus = ref("");
const orderStatus = ref("");
const total = ref(0);
const totalActive = ref(0);
const totalInactive = ref(0);

const statusOptions = [
  { label: "Alle", value: "" },
  { label: "Angefragt", value: "order_placed" },
  { label: "Bestätigt", value: "confirmed" },
  { label: "Geprüft", value: "inspected" },
  { label: "Geliefert", value: "delivered" },
  { label: "Abgeschlossen", value: "completed" },
];

const sectionCards = computed(() => [
  {
    id: "users",
    label: "Kunden / Benutzer",
    value: summary.value
      ? summary.value.total_b2c_customers + summary.value.total_b2b_companies
      : 0,
    description: "Privat- und Firmenkunden",
  },
  {
    id: "vehicles",
    label: "Fahrzeuge",
    value: summary.value?.total_vehicles ?? 0,
    description: "Aktueller Fuhrpark",
  },
  {
    id: "orders",
    label: "Offene Aufträge",
    value: summary.value?.active_orders ?? 0,
    description: "Aktive Rückgaben",
  },
  {
    id: "completed",
    label: "Gelieferte Aufträge",
    value: summary.value?.completed_orders ?? 0,
    description: "Ausgelieferte Fahrzeuge",
  },
  {
    id: "inspections",
    label: "Ausstehende Prüfungen",
    value: summary.value?.pending_inspections ?? 0,
    description: "Prüfungen offen",
  },
]);

const isCardActive = (cardId: string) => {
  if (cardId === "completed" || cardId === "inspections") {
    return activeSection.value === "orders";
  }

  return activeSection.value === cardId;
};

const currentStatusFilter = computed({
  get: () => (activeSection.value === "vehicles" ? vehicleStatus.value : orderStatus.value),
  set: (value: string) => {
    if (activeSection.value === "vehicles") {
      vehicleStatus.value = value;
    } else {
      orderStatus.value = value;
    }
  },
});

const activeLabel = computed(() => {
  switch (activeSection.value) {
    case "users":
      return "Kunden / Benutzer";
    case "vehicles":
      return "Fahrzeuge";
    case "orders":
      return "Aufträge";
    default:
      return "";
  }
});

async function loadSummary() {
  loadingSummary.value = true;
  listError.value = "";
  try {
    summary.value = await adminDashboardApi.getSummary();
  } catch (err) {
    listError.value = "Zusammenfassung konnte nicht geladen werden.";
  } finally {
    loadingSummary.value = false;
  }
}

async function loadUsers() {
  loadingList.value = true;
  listError.value = "";

  try {
    const response =
      userType.value === "B2C"
        ? await adminUsersApi.getB2c(page.value, limit.value)
        : await adminUsersApi.getB2b(page.value, limit.value);

    users.value = response.data;
    total.value = response.total;
    totalActive.value = response.total_active;
    totalInactive.value = response.total_inactive;
  } catch (err) {
    listError.value = "Benutzerliste konnte nicht geladen werden.";
  } finally {
    loadingList.value = false;
  }
}

async function loadVehicles() {
  loadingList.value = true;
  listError.value = "";

  try {
    const response = await adminVehiclesApi.listByUserType(
      vehicleUserType.value,
      page.value,
      limit.value,
      vehicleStatus.value || undefined,
    );
    vehicles.value = response.data;
    total.value = response.total;
    totalActive.value = response.total_active;
    // Reused as the "Geliefert" count here (not inactive) — see the badge below.
    totalInactive.value = response.total_completed;
  } catch (err) {
    listError.value = "Fahrzeugliste konnte nicht geladen werden.";
  } finally {
    loadingList.value = false;
  }
}

async function loadOrders() {
  loadingList.value = true;
  listError.value = "";

  try {
    const response = await adminOrdersApi.listByUserType(
      orderUserType.value,
      page.value,
      limit.value,
      orderStatus.value || undefined,
    );
    orders.value = response.data;
    total.value = response.total;
    totalActive.value = response.total_active;
    // Reused as the "Geliefert" count here (not inactive) — see the badge below.
    totalInactive.value = response.total_completed;
  } catch (err) {
    listError.value = "Auftragsliste konnte nicht geladen werden.";
  } finally {
    loadingList.value = false;
  }
}

async function loadRecentOrders() {
  try {
    recentOrders.value = (await adminOrdersApi.listAll(1, 7)).data;
  } catch {
    recentOrders.value = [];
  }
}

function handleCardClick(id: "users" | "vehicles" | "orders" | "completed" | "inspections") {
  // "completed" is a KPI shortcut, not its own section — it lands on the
  // Orders tab pre-filtered to "Geliefert". The backend's completed-order
  // aggregate doesn't line up with any order_status="completed" records, so
  // the card (labelled "Gelieferte Aufträge") is treated as the delivered
  // count instead — that's the status whose filtered list actually matches.
  if (id === "completed") {
    activeSection.value = "orders";
    orderStatus.value = "delivered";
  } else if (id === "inspections") {
    activeSection.value = "orders";
    orderStatus.value = "";
  } else {
    activeSection.value = id;
  }
  page.value = 1;
}

watch(
  [activeSection, page, userType, vehicleUserType, orderUserType, vehicleStatus, orderStatus],
  () => {
    if (activeSection.value === "users") {
      loadUsers();
    } else if (activeSection.value === "vehicles") {
      loadVehicles();
    } else if (activeSection.value === "orders") {
      loadOrders();
    }
  },
);

watch(userType, () => {
  if (activeSection.value === "users") {
    page.value = 1;
  }
});

watch(vehicleUserType, () => {
  if (activeSection.value === "vehicles") {
    page.value = 1;
  }
});

watch(orderUserType, () => {
  if (activeSection.value === "orders") {
    page.value = 1;
  }
});

onMounted(async () => {
  await loadSummary();
  await loadRecentOrders();
  await loadUsers();
});
</script>

<template>
  <div class="space-y-6">
    <header
      class="flex flex-col gap-3 rounded-[24px] border border-[#e8f1ef] bg-white p-6 shadow-[0_8px_30px_rgba(16,57,59,0.08)]"
    >
      <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div class="text-[12px] font-bold uppercase tracking-[0.2em] text-[#01B990]">
            Admin Übersicht
          </div>
          <h1 class="mt-2 text-[32px] font-extrabold text-[#10393b]">
            Flotten- und Kundenübersicht
          </h1>
          <p class="mt-2 text-base text-[#5a6e6c]">
            Live-Daten für Kunden, Fahrzeuge und Aufträge. Klicken Sie eine KPI-Karte, um die Liste
            unten anzuzeigen.
          </p>
        </div>
      </div>
    </header>

    <section class="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
      <div class="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        <template v-for="card in sectionCards" :key="card.id">
          <button
            type="button"
            @click="
              handleCardClick(
                card.id as 'users' | 'vehicles' | 'orders' | 'completed' | 'inspections',
              )
            "
            class="group rounded-[24px] border p-6 text-left transition-all duration-200"
            :class="
              isCardActive(card.id)
                ? 'border-[#01B990] bg-[#f2fff8] shadow-[0_12px_24px_rgba(1,185,144,0.16)]'
                : 'border-[#eef3f2] bg-white hover:border-[#01B990]/70 hover:shadow-[0_10px_20px_rgba(16,57,59,0.08)]'
            "
          >
            <div class="flex items-center justify-between gap-3">
              <p class="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#5a6e6c]">
                {{ card.label }}
              </p>
              <span
                class="inline-flex h-10 min-w-[58px] items-center justify-center rounded-full bg-[#e8faf3] px-3 text-sm font-bold text-[#05603a]"
                >Live</span
              >
            </div>
            <div class="mt-6 flex items-end justify-between gap-4">
              <div>
                <div class="text-[42px] font-extrabold text-[#10393b]">{{ card.value }}</div>
                <p class="mt-2 text-sm text-[#6f8585]">{{ card.description }}</p>
              </div>
              <div
                class="h-14 w-14 rounded-[18px] bg-[#01B990]/10 text-[#01B990] flex items-center justify-center text-xl font-extrabold"
              >
                {{ card.label[0] }}
              </div>
            </div>
          </button>
        </template>
      </div>

      <div
        class="rounded-[24px] border border-[#eef3f2] bg-white p-6 shadow-[0_10px_28px_rgba(16,57,59,0.08)]"
      >
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#01B990]">
              Letzte Aufträge
            </p>
            <h2 class="mt-2 text-[20px] font-extrabold text-[#10393b]">Aktuelle Rückgaben</h2>
          </div>
          <span class="rounded-full bg-[#f3faf8] px-3 py-1 text-sm font-semibold text-[#05603a]"
            >7 Einträge</span
          >
        </div>

        <div class="mt-5 space-y-3">
          <template v-if="recentOrders.length">
            <div
              v-for="order in recentOrders"
              :key="order.id"
              class="rounded-[20px] border border-[#e8f1ef] bg-[#fdfdfd] p-4 hover:bg-[#f7fbfa] transition"
            >
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div class="min-w-0">
                  <p class="text-sm font-bold text-[#10393b]">{{ order.auftragsnummer }}</p>
                  <p class="text-sm text-[#5a6e6c]">
                    {{ order.make }} {{ order.model }} • {{ order.license_plate }}
                  </p>
                </div>
                <div class="flex items-center gap-2 flex-wrap">
                  <StatusBadge
                    :label="getOrderStatusLabel(order.order_status).label"
                    :colorClass="getOrderStatusLabel(order.order_status).colorClass"
                    :backgroundClass="getOrderStatusLabel(order.order_status).backgroundClass"
                  />
                  <span class="text-sm text-[#6f8585]">{{
                    formatGermanDate(order.created_at)
                  }}</span>
                </div>
              </div>
            </div>
          </template>
          <p v-else class="text-sm text-[#6f8585]">Keine aktuellen Aufträge verfügbar.</p>
        </div>
      </div>
    </section>

    <section
      class="rounded-[24px] border border-[#eef3f2] bg-white p-6 shadow-[0_10px_28px_rgba(16,57,59,0.08)]"
    >
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#01B990]">
            {{ activeLabel }}
          </p>
          <h2 class="mt-2 text-[24px] font-extrabold text-[#10393b]">Liste</h2>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SegmentedToggle
            v-if="activeSection === 'users'"
            v-model="userType"
            :options="[
              { label: 'Privatkunde', value: 'B2C' },
              { label: 'Firmenkunde', value: 'B2B' },
            ]"
          />

          <SegmentedToggle
            v-if="activeSection === 'vehicles'"
            v-model="vehicleUserType"
            :options="[
              { label: 'Privatkunde', value: 'Privatkunde' },
              { label: 'Firmenkunde', value: 'Firmenkunde' },
            ]"
          />

          <SegmentedToggle
            v-if="activeSection === 'orders'"
            v-model="orderUserType"
            :options="[
              { label: 'Privatkunde', value: 'Privatkunde' },
              { label: 'Firmenkunde', value: 'Firmenkunde' },
            ]"
          />
        </div>
      </div>

      <div class="mt-5 flex flex-wrap items-center gap-3">
        <span class="rounded-full bg-[#f3faf8] px-4 py-2 text-sm font-semibold text-[#05603a]"
          >{{ total }} Gesamt</span
        >
        <span class="rounded-full bg-[#eff6ff] px-4 py-2 text-sm font-semibold text-[#1e3a8a]"
          >{{ totalActive }} Aktiv</span
        >
        <span class="rounded-full bg-[#ffedde] px-4 py-2 text-sm font-semibold text-[#c2410c]"
          >{{ totalInactive }} {{ activeSection === "users" ? "Inaktiv" : "Geliefert" }}</span
        >

        <SegmentedToggle
          v-if="activeSection !== 'users'"
          v-model="currentStatusFilter"
          :options="statusOptions.map((option) => ({ label: option.label, value: option.value }))"
          fullWidth
        />
      </div>

      <div class="mt-6 overflow-x-auto">
        <table class="w-full min-w-[760px] divide-y divide-[#e8f1ef] text-left">
          <thead class="bg-[#f8faf9] rounded-[18px]">
            <tr>
              <th class="px-4 py-3 text-sm font-semibold text-[#5a6e6c]">Name / ID</th>
              <th class="px-4 py-3 text-sm font-semibold text-[#5a6e6c]">E-Mail / Typ</th>
              <th class="px-4 py-3 text-sm font-semibold text-[#5a6e6c]">Status</th>
              <th class="px-4 py-3 text-sm font-semibold text-[#5a6e6c]">Datum</th>
              <th class="px-4 py-3 text-sm font-semibold text-[#5a6e6c]">Info</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#eef3f2]">
            <template v-if="loadingList">
              <tr v-for="index in 5" :key="index" class="animate-pulse">
                <td colspan="5" class="py-6 px-4">
                  <div class="h-4 w-full rounded-full bg-[#e2e8f0]"></div>
                </td>
              </tr>
            </template>

            <template v-else-if="activeSection === 'users'">
              <tr v-if="!users.length">
                <td colspan="5" class="py-8 px-4 text-center text-sm text-[#6f8585]">
                  Keine Benutzer gefunden.
                </td>
              </tr>
              <tr v-for="user in users" :key="user.user_id" class="hover:bg-[#f7faf8] transition">
                <td class="px-4 py-4">
                  <div class="font-semibold text-[#10393b]">
                    {{ user.salutation }} {{ user.first_name }} {{ user.last_name }}
                  </div>
                  <div class="text-sm text-[#6f8585]">ID {{ user.user_id }}</div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm text-[#10393b]">{{ user.user_email }}</div>
                  <div class="text-sm text-[#6f8585]">{{ user.user_type }}</div>
                </td>
                <td class="px-4 py-4">
                  <StatusBadge
                    :label="getUserStatusLabel(user.is_active).label"
                    :colorClass="getUserStatusLabel(user.is_active).colorClass"
                    :backgroundClass="getUserStatusLabel(user.is_active).backgroundClass"
                  />
                </td>
                <td class="px-4 py-4 text-sm text-[#6f8585]">
                  {{ formatGermanDate(user.created_at) }}
                </td>
                <td class="px-4 py-4 text-sm text-[#6f8585]">
                  {{ user.city }}, {{ user.country }}
                </td>
              </tr>
            </template>

            <template v-else-if="activeSection === 'vehicles'">
              <tr v-if="!vehicles.length">
                <td colspan="5" class="py-8 px-4 text-center text-sm text-[#6f8585]">
                  Keine Fahrzeuge gefunden.
                </td>
              </tr>
              <tr
                v-for="vehicle in vehicles"
                :key="vehicle.vehicle_id"
                class="hover:bg-[#f7faf8] transition"
              >
                <td class="px-4 py-4">
                  <div class="font-semibold text-[#10393b]">{{ vehicle.license_plate }}</div>
                  <div class="text-sm text-[#6f8585]">VIN {{ vehicle.vin }}</div>
                </td>
                <td class="px-4 py-4 text-sm text-[#10393b]">
                  {{ vehicle.make }} {{ vehicle.model }}
                </td>
                <td class="px-4 py-4">
                  <StatusBadge
                    :label="
                      getVehicleStatusLabel(vehicle.current_order_status || 'completed').label
                    "
                    :colorClass="
                      getVehicleStatusLabel(vehicle.current_order_status || 'completed').colorClass
                    "
                    :backgroundClass="
                      getVehicleStatusLabel(vehicle.current_order_status || 'completed')
                        .backgroundClass
                    "
                  />
                </td>
                <td class="px-4 py-4 text-sm text-[#6f8585]">
                  {{ formatGermanDate(vehicle.leasing_end_date) }}
                </td>
                <td class="px-4 py-4 text-sm text-[#6f8585]">
                  {{ vehicle.user_type }} / {{ vehicle.company_name ?? userType }}
                </td>
              </tr>
            </template>

            <template v-else>
              <tr v-if="!orders.length">
                <td colspan="5" class="py-8 px-4 text-center text-sm text-[#6f8585]">
                  Keine Aufträge gefunden.
                </td>
              </tr>
              <tr v-for="order in orders" :key="order.id" class="hover:bg-[#f7faf8] transition">
                <td class="px-4 py-4">
                  <div class="font-semibold text-[#10393b]">{{ order.auftragsnummer }}</div>
                  <div class="text-sm text-[#6f8585]">{{ order.license_plate }}</div>
                </td>
                <td class="px-4 py-4 text-sm text-[#10393b]">{{ order.make }} {{ order.model }}</td>
                <td class="px-4 py-4">
                  <StatusBadge
                    :label="getOrderStatusLabel(order.order_status).label"
                    :colorClass="getOrderStatusLabel(order.order_status).colorClass"
                    :backgroundClass="getOrderStatusLabel(order.order_status).backgroundClass"
                  />
                </td>
                <td class="px-4 py-4 text-sm text-[#6f8585]">
                  {{ formatGermanDate(order.created_at) }}
                </td>
                <td class="px-4 py-4 text-sm text-[#6f8585]">
                  {{ order.company_name || order.user_email }}
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div class="mt-6">
        <Pagination :page="page" :limit="limit" :total="total" @update:page="page = $event" />
      </div>

      <div
        v-if="listError"
        class="mt-4 rounded-[18px] border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      >
        {{ listError }}
      </div>
    </section>
  </div>
</template>
