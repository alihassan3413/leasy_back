<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useAdminStore } from "@/stores/admin.store";
// import { useAuthStore } from "@/stores/auth.store"; // hidden per QA with the floating header
import { adminOrdersApi, adminUsersApi, adminVehiclesApi } from "@/api";
import { formatGermanDate } from "@/lib/formatting";
import UserDetailModal from "@/components/admin/UserDetail.vue";
import type { AdminOrder, AdminUser, AdminVehicle } from "@/types";

type PanelType = "orders" | "users" | "vehicles";

const adminStore = useAdminStore();
// const auth = useAuthStore(); // hidden per QA with the floating header

// ─────────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────────

const today = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date());

// Hidden per QA together with the floating header in the template (identity is
// already shown in the sidebar footer).
// const headerUserName = computed(() => {
//   const user = auth.user as any;
//
//   if (!user) return "Administrator";
//
//   if (user.first_name && user.last_name) {
//     return `${user.first_name} ${user.last_name}`;
//   }
//
//   return user.name ?? user.email ?? user.user_email ?? "Administrator";
// });
//
// const headerInitials = computed(() => {
//   const parts = headerUserName.value.trim().split(/\s+/);
//
//   if (parts.length >= 2) {
//     return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
//   }
//
//   return headerUserName.value.slice(0, 2).toUpperCase();
// });

// ─────────────────────────────────────────────────────────────────
// Active dashboard panel
// ─────────────────────────────────────────────────────────────────

const activePanel = ref<PanelType>("orders");
const search = ref("");

const totalCustomers = computed(() => {
  return adminStore.totalB2B + adminStore.totalB2C;
});

function activatePanel(type: PanelType) {
  search.value = "";
  activePanel.value = type;

  if (type === "orders") {
    panelOrdersPage.value = 1;
    void loadPanelOrders();
  }

  if (type === "users") {
    panelUsersPage.value = 1;
    void loadPanelUsers();
  }

  if (type === "vehicles") {
    panelVehiclesPage.value = 1;
    void loadPanelVehicles();
  }
}

// ─────────────────────────────────────────────────────────────────
// Status helpers
// ─────────────────────────────────────────────────────────────────

const statusStyles: Record<
  string,
  {
    label: string;
    background: string;
    color: string;
  }
> = {
  order_placed: {
    label: "Bestellt",
    background: "rgba(239, 132, 80, 0.12)",
    color: "#c0622e",
  },
  confirmed: {
    label: "Bestätigt",
    background: "rgba(99, 102, 241, 0.12)",
    color: "#4f46e5",
  },
  inspected: {
    label: "Geprüft",
    background: "rgba(1, 185, 144, 0.12)",
    color: "#00856a",
  },
  workshop: {
    label: "In Werkstatt",
    background: "rgba(245, 158, 11, 0.12)",
    color: "#b45309",
  },
  reinspection: {
    label: "Nachprüfung",
    background: "rgba(124, 58, 237, 0.12)",
    color: "#6d28d9",
  },
  reworkshop: {
    label: "Erneut in Werkstatt",
    background: "rgba(234, 88, 12, 0.12)",
    color: "#c2410c",
  },
  delivered: {
    label: "Geliefert",
    background: "rgba(16, 57, 59, 0.09)",
    color: "#10393b",
  },
  completed: {
    label: "Abgeschlossen",
    background: "rgba(1, 185, 144, 0.12)",
    color: "#00856a",
  },
  discarded: {
    label: "Verworfen",
    background: "rgba(107, 114, 128, 0.12)",
    color: "#374151",
  },
  cancelled: {
    label: "Storniert",
    background: "rgba(220, 38, 38, 0.10)",
    color: "#991b1b",
  },
};

function getStatus(status: string | null | undefined) {
  if (!status) {
    return {
      label: "Kein Status",
      background: "rgba(0, 0, 0, 0.05)",
      color: "#6f8585",
    };
  }

  return (
    statusStyles[status] ?? {
      label: status,
      background: "rgba(0, 0, 0, 0.05)",
      color: "#6f8585",
    }
  );
}

// ─────────────────────────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────────────────────────

const panelUsers = ref<AdminUser[]>([]);
const panelUsersPage = ref(1);
const panelUsersTotal = ref(0);
const panelUsersLoading = ref(false);
const panelUsersType = ref<"B2C" | "B2B">("B2C");

const panelUsersLimit = 10;

const panelUsersTotalPages = computed(() => {
  return Math.max(1, Math.ceil(panelUsersTotal.value / panelUsersLimit));
});

async function loadPanelUsers() {
  panelUsersLoading.value = true;

  try {
    const response =
      panelUsersType.value === "B2C"
        ? await adminUsersApi.getB2c(panelUsersPage.value, panelUsersLimit)
        : await adminUsersApi.getB2b(panelUsersPage.value, panelUsersLimit);

    panelUsers.value = response.data;
    panelUsersTotal.value = response.total;
  } catch (error) {
    console.error("Kunden konnten nicht geladen werden:", error);

    panelUsers.value = [];
    panelUsersTotal.value = 0;
  } finally {
    panelUsersLoading.value = false;
  }
}

watch(panelUsersType, () => {
  panelUsersPage.value = 1;

  if (activePanel.value === "users") {
    void loadPanelUsers();
  }
});

watch(panelUsersPage, () => {
  if (activePanel.value === "users") {
    void loadPanelUsers();
  }
});

// ─────────────────────────────────────────────────────────────────
// Vehicles
// ─────────────────────────────────────────────────────────────────

const panelVehicles = ref<AdminVehicle[]>([]);
const panelVehiclesPage = ref(1);
const panelVehiclesTotal = ref(0);
const panelVehiclesLoading = ref(false);

const panelVehiclesLimit = 10;

const panelVehiclesTotalPages = computed(() => {
  return Math.max(1, Math.ceil(panelVehiclesTotal.value / panelVehiclesLimit));
});

async function loadPanelVehicles() {
  panelVehiclesLoading.value = true;

  try {
    const response = await adminVehiclesApi.listAll(panelVehiclesPage.value, panelVehiclesLimit);

    panelVehicles.value = response.data;
    panelVehiclesTotal.value = response.total;
  } catch (error) {
    console.error("Fahrzeuge konnten nicht geladen werden:", error);

    panelVehicles.value = [];
    panelVehiclesTotal.value = 0;
  } finally {
    panelVehiclesLoading.value = false;
  }
}

watch(panelVehiclesPage, () => {
  if (activePanel.value === "vehicles") {
    void loadPanelVehicles();
  }
});

// ─────────────────────────────────────────────────────────────────
// Orders
// ─────────────────────────────────────────────────────────────────

const panelOrders = ref<AdminOrder[]>([]);
const panelOrdersPage = ref(1);
const panelOrdersTotal = ref(0);
const panelOrdersLoading = ref(false);
const panelOrdersFilter = ref<"Alle" | "Offen" | "Abgeschlossen">("Alle");

const panelOrdersFilters: Array<"Alle" | "Offen" | "Abgeschlossen"> = [
  "Alle",
  "Offen",
  "Abgeschlossen",
];

const panelOrdersLimit = 10;

const panelOrdersTotalPages = computed(() => {
  return Math.max(1, Math.ceil(panelOrdersTotal.value / panelOrdersLimit));
});

async function loadPanelOrders() {
  panelOrdersLoading.value = true;

  try {
    const response = await adminOrdersApi.listAll(panelOrdersPage.value, panelOrdersLimit);

    panelOrders.value = response.data;
    panelOrdersTotal.value = response.total;
  } catch (error) {
    console.error("Aufträge konnten nicht geladen werden:", error);

    panelOrders.value = [];
    panelOrdersTotal.value = 0;
  } finally {
    panelOrdersLoading.value = false;
  }
}

watch(panelOrdersPage, () => {
  if (activePanel.value === "orders") {
    void loadPanelOrders();
  }
});

// ─────────────────────────────────────────────────────────────────
// Local search and filtering
// ─────────────────────────────────────────────────────────────────

const normalizedSearch = computed(() => {
  return search.value.trim().toLowerCase();
});

const filteredPanelUsers = computed(() => {
  if (!normalizedSearch.value) {
    return panelUsers.value;
  }

  return panelUsers.value.filter((user) => {
    const searchableText = [
      user.salutation,
      user.first_name,
      user.last_name,
      user.user_email,
      user.city,
      user.country,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearch.value);
  });
});

const filteredPanelVehicles = computed(() => {
  if (!normalizedSearch.value) {
    return panelVehicles.value;
  }

  return panelVehicles.value.filter((vehicle) => {
    const searchableText = [
      vehicle.make,
      vehicle.model,
      vehicle.license_plate,
      vehicle.vin,
      vehicle.user_email,
      vehicle.company_name,
      vehicle.current_auftragsnummer,
      getStatus(vehicle.current_order_status).label,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearch.value);
  });
});

const filteredPanelOrders = computed(() => {
  let orders = panelOrders.value;

  if (panelOrdersFilter.value === "Offen") {
    orders = orders.filter((order) => {
      return order.order_status !== "completed";
    });
  }

  if (panelOrdersFilter.value === "Abgeschlossen") {
    orders = orders.filter((order) => {
      return order.order_status === "completed";
    });
  }

  if (!normalizedSearch.value) {
    return orders;
  }

  return orders.filter((order) => {
    const searchableText = [
      order.auftragsnummer,
      order.make,
      order.model,
      order.license_plate,
      order.company_name,
      order.user_email,
      order.leasyback_partner,
      getStatus(order.order_status).label,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearch.value);
  });
});

// ─────────────────────────────────────────────────────────────────
// User detail modal
// ─────────────────────────────────────────────────────────────────

const selectedUser = ref<AdminUser | null>(null);
const modalOpen = ref(false);

function openUserModal(user: AdminUser) {
  selectedUser.value = user;
  modalOpen.value = true;
}

function closeUserModal() {
  modalOpen.value = false;
  selectedUser.value = null;
}

// ─────────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────────

function pageRange(currentPage: number, totalPages: number): Array<number | "…"> {
  const pages: Array<number | "…"> = [];

  for (let page = 1; page <= totalPages; page += 1) {
    const shouldDisplay = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;

    if (shouldDisplay) {
      pages.push(page);
      continue;
    }

    if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return pages;
}

function userInitials(user: AdminUser) {
  const first = user.first_name?.charAt(0) ?? "";
  const last = user.last_name?.charAt(0) ?? "";

  return `${first}${last}`.toUpperCase() || "?";
}

// ─────────────────────────────────────────────────────────────────
// Donut chart
// ─────────────────────────────────────────────────────────────────

const donutDistribution = computed(() => [
  {
    label: "Aktiv",
    count: adminStore.activeOrders,
    color: "#01B990",
  },
  {
    label: "Abgeschlossen",
    count: adminStore.completedOrders,
    color: "#10393b",
  },
  {
    label: "Ausstehend",
    count: adminStore.pendingInspections,
    color: "#ef8450",
  },
]);

const donutTotal = computed(() => {
  return donutDistribution.value.reduce((total, item) => total + item.count, 0);
});

const donutSegments = computed(() => {
  const circumference = 2 * Math.PI * 48;
  let accumulatedLength = 0;

  return donutDistribution.value.map((item) => {
    const segmentLength =
      donutTotal.value > 0 ? (item.count / donutTotal.value) * circumference : 0;

    const segment = {
      label: item.label,
      color: item.color,
      dash: `${Math.max(segmentLength - 4, 0)} ${circumference}`,
      offset: -accumulatedLength,
    };

    accumulatedLength += segmentLength;

    return segment;
  });
});

const services = [
  {
    name: "API-Gateway",
    status: "ok",
    label: "Aktiv",
  },
  {
    name: "Datenbank",
    status: "ok",
    label: "Aktiv",
  },
  {
    name: "E-Mail-Dienst",
    status: "ok",
    label: "Aktiv",
  },
  {
    name: "Hintergrundjobs",
    status: "warning",
    label: "Verzögert",
  },
];

// ─────────────────────────────────────────────────────────────────
// Mount
// ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  await adminStore.fetchSummary();

  activePanel.value = "orders";
  await loadPanelOrders();
});
</script>

<template>
  <div class="flex h-full flex-col gap-5">
    <!-- Floating header — hidden per QA: the bell had no notifications feature behind it,
         and the profile chip duplicates the identity shown in the sidebar footer
    <header
      class="flex h-[60px] shrink-0 items-center gap-4 rounded-[18px] border border-[#eaf0ef] bg-white/70 px-4 backdrop-blur"
      style="box-shadow: 0 4px 18px rgba(16, 57, 59, 0.04)"
    >
      <div class="ml-auto flex items-center gap-2.5">
        <button
          type="button"
          class="relative flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#f4f7f6] text-[#6f8585] transition-all hover:bg-[#eaf0ef] hover:text-[#10393b]"
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
              d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9
                 M13.73 21a2 2 0 01-3.46 0"
            />
          </svg>

          <span
            class="absolute right-2.5 top-2.5 h-[7px] w-[7px] rounded-full border-2 border-white bg-[#ef8450]"
          ></span>
        </button>

        <div class="flex items-center gap-2.5 rounded-[12px] bg-[#f4f7f6] py-1 pl-1 pr-3">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-[9px] text-[11px] font-extrabold text-white"
            style="background: linear-gradient(150deg, #01b990, #10393b)"
          >
            {{ headerInitials }}
          </div>

          <div class="flex flex-col leading-tight">
            <span class="text-[12.5px] font-bold text-[#10393b]">
              {{ headerUserName }}
            </span>

            <span class="text-[10.5px] text-[#9bb0af]"> Administrator </span>
          </div>
        </div>
      </div>
    </header>
    -->

    <!-- Scrollable content -->
    <main class="flex flex-1 flex-col gap-5 overflow-y-auto pb-4 pr-1">
      <!-- Page title -->
      <div class="flex items-end justify-between gap-5 max-[760px]:items-start">
        <div>
          <p class="mb-1.5 text-[12px] font-bold capitalize text-[#01B990]">
            {{ today }}
          </p>

          <h1 class="text-[34px] font-extrabold leading-none tracking-[-1.2px] text-[#10393b]">
            Übersicht
          </h1>

          <p class="mt-2 text-[13.5px] font-medium text-[#6f8585]">
            Willkommen zurück — der aktuelle Stand Ihrer Flotte.
          </p>
        </div>

        <div class="flex gap-2.5 max-[760px]:flex-col">
          <!-- Hidden per QA: buttons are not wired to any action yet
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-[13px] border border-[#e9efee] bg-white px-[18px] py-2.5 font-[Manrope,sans-serif] text-[13px] font-bold text-[#10393b] transition-all hover:border-[#d6dddd] hover:shadow-sm"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>

            Export
          </button>

          <button
            type="button"
            class="flex items-center gap-1.5 rounded-[13px] px-[18px] py-2.5 font-[Manrope,sans-serif] text-[13px] font-bold text-white transition-all hover:-translate-y-px"
            style="
              background: linear-gradient(135deg, #10393b, #1a5052);
              box-shadow: 0 8px 20px rgba(16, 57, 59, 0.2);
            "
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>

            Neuer Auftrag
          </button>
          -->
        </div>
      </div>

      <!-- Three equal clickable cards -->
      <section class="grid grid-cols-3 gap-4 max-[1100px]:grid-cols-1">
        <!-- Summary and orders -->
        <button
          type="button"
          class="dashboard-card"
          :class="{
            'dashboard-card-active': activePanel === 'orders',
          }"
          @click="activatePanel('orders')"
        >
          <div
            v-if="activePanel === 'orders'"
            class="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/15 blur-2xl"
          ></div>

          <div class="relative z-10 flex h-full flex-col">
            <div class="flex items-start justify-between gap-4">
              <div
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-[17px] border"
                :class="
                  activePanel === 'orders'
                    ? 'border-white/25 bg-white/20 text-white'
                    : 'border-[#d9ece7] bg-[#01B990]/10 text-[#00856a]'
                "
              >
                <svg
                  width="23"
                  height="23"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <path
                    d="M14 2H6a2 2 0 00-2 2v16a2 2 0
                       002 2h12a2 2 0 002-2V8z"
                  />
                  <path d="M14 2v6h6M16 13H8M16 17H8" />
                </svg>
              </div>

              <span
                class="rounded-full px-3 py-1.5 text-[11px] font-extrabold"
                :class="
                  activePanel === 'orders'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#01B990]/10 text-[#00856a]'
                "
              >
                {{ activePanel === "orders" ? "Aktiv" : "Anzeigen" }}
              </span>
            </div>

            <div class="mt-6">
              <p
                class="text-[12px] font-bold uppercase tracking-[0.08em]"
                :class="activePanel === 'orders' ? 'text-white/65' : 'text-[#9bb0af]'"
              >
                Gesamtübersicht
              </p>

              <div
                v-if="adminStore.summaryLoading"
                class="mt-2 h-12 w-24 animate-pulse rounded-xl"
                :class="activePanel === 'orders' ? 'bg-white/15' : 'bg-[#f1f5f4]'"
              ></div>

              <p v-else class="mt-2 text-[48px] font-extrabold leading-none tracking-[-2px]">
                {{ adminStore.totalOrders.toLocaleString("de-DE") }}
              </p>

              <p
                class="mt-2 text-[14px] font-bold"
                :class="activePanel === 'orders' ? 'text-white/85' : 'text-[#6f8585]'"
              >
                Aufträge gesamt
              </p>
            </div>

            <div
              class="mt-auto grid grid-cols-2 gap-2 border-t pt-5"
              :class="activePanel === 'orders' ? 'border-white/20' : 'border-[#edf2f1]'"
            >
              <div
                class="rounded-[13px] px-3 py-2.5"
                :class="activePanel === 'orders' ? 'bg-white/10' : 'bg-[#f4f7f6]'"
              >
                <p
                  class="text-[10px] font-bold uppercase tracking-[0.05em]"
                  :class="activePanel === 'orders' ? 'text-white/55' : 'text-[#9bb0af]'"
                >
                  Offen
                </p>

                <p class="mt-1 text-[17px] font-extrabold">
                  {{ adminStore.activeOrders }}
                </p>
              </div>

              <div
                class="rounded-[13px] px-3 py-2.5"
                :class="activePanel === 'orders' ? 'bg-white/10' : 'bg-[#f4f7f6]'"
              >
                <p
                  class="text-[10px] font-bold uppercase tracking-[0.05em]"
                  :class="activePanel === 'orders' ? 'text-white/55' : 'text-[#9bb0af]'"
                >
                  Abgeschlossen
                </p>

                <p class="mt-1 text-[17px] font-extrabold">
                  {{ adminStore.completedOrders }}
                </p>
              </div>

              <div
                class="rounded-[13px] px-3 py-2.5"
                :class="activePanel === 'orders' ? 'bg-white/10' : 'bg-[#f4f7f6]'"
              >
                <p
                  class="text-[10px] font-bold uppercase tracking-[0.05em]"
                  :class="activePanel === 'orders' ? 'text-white/55' : 'text-[#9bb0af]'"
                >
                  Inspektionen
                </p>

                <p class="mt-1 text-[17px] font-extrabold">
                  {{ adminStore.pendingInspections }}
                </p>
              </div>

              <div
                class="rounded-[13px] px-3 py-2.5"
                :class="activePanel === 'orders' ? 'bg-white/10' : 'bg-[#f4f7f6]'"
              >
                <p
                  class="text-[10px] font-bold uppercase tracking-[0.05em]"
                  :class="activePanel === 'orders' ? 'text-white/55' : 'text-[#9bb0af]'"
                >
                  Kunden
                </p>

                <p class="mt-1 text-[17px] font-extrabold">
                  {{ totalCustomers }}
                </p>
              </div>
            </div>
          </div>
        </button>

        <!-- Customers -->
        <button
          type="button"
          class="dashboard-card"
          :class="{
            'dashboard-card-active': activePanel === 'users',
          }"
          @click="activatePanel('users')"
        >
          <div
            v-if="activePanel === 'users'"
            class="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/15 blur-2xl"
          ></div>

          <div class="relative z-10 flex h-full flex-col">
            <div class="flex items-start justify-between gap-4">
              <div
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-[17px] border"
                :class="
                  activePanel === 'users'
                    ? 'border-white/25 bg-white/20 text-white'
                    : 'border-[#e1e7e6] bg-[#10393b]/[0.06] text-[#10393b]'
                "
              >
                <svg
                  width="23"
                  height="23"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>

              <span
                class="rounded-full px-3 py-1.5 text-[11px] font-extrabold"
                :class="
                  activePanel === 'users'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#10393b]/[0.06] text-[#6f8585]'
                "
              >
                B2B: {{ adminStore.totalB2B }} · B2C: {{ adminStore.totalB2C }}
              </span>
            </div>

            <div class="mt-6">
              <p
                class="text-[12px] font-bold uppercase tracking-[0.08em]"
                :class="activePanel === 'users' ? 'text-white/65' : 'text-[#9bb0af]'"
              >
                Kunden
              </p>

              <div
                v-if="adminStore.summaryLoading"
                class="mt-2 h-12 w-28 animate-pulse rounded-xl"
                :class="activePanel === 'users' ? 'bg-white/15' : 'bg-[#f1f5f4]'"
              ></div>

              <p v-else class="mt-2 text-[48px] font-extrabold leading-none tracking-[-2px]">
                {{ totalCustomers.toLocaleString("de-DE") }}
              </p>

              <p
                class="mt-2 text-[14px] font-bold"
                :class="activePanel === 'users' ? 'text-white/85' : 'text-[#6f8585]'"
              >
                Kunden gesamt
              </p>
            </div>

            <div
              class="mt-auto grid grid-cols-2 gap-2 border-t pt-5"
              :class="activePanel === 'users' ? 'border-white/20' : 'border-[#edf2f1]'"
            >
              <div
                class="rounded-[13px] px-3 py-2.5"
                :class="activePanel === 'users' ? 'bg-white/10' : 'bg-[#f4f7f6]'"
              >
                <p
                  class="text-[10px] font-bold uppercase tracking-[0.05em]"
                  :class="activePanel === 'users' ? 'text-white/55' : 'text-[#9bb0af]'"
                >
                  Firmenkunden
                </p>

                <p class="mt-1 text-[17px] font-extrabold">
                  {{ adminStore.totalB2B }}
                </p>
              </div>

              <div
                class="rounded-[13px] px-3 py-2.5"
                :class="activePanel === 'users' ? 'bg-white/10' : 'bg-[#f4f7f6]'"
              >
                <p
                  class="text-[10px] font-bold uppercase tracking-[0.05em]"
                  :class="activePanel === 'users' ? 'text-white/55' : 'text-[#9bb0af]'"
                >
                  Privatkunden
                </p>

                <p class="mt-1 text-[17px] font-extrabold">
                  {{ adminStore.totalB2C }}
                </p>
              </div>
            </div>
          </div>
        </button>

        <!-- Vehicles -->
        <button
          type="button"
          class="dashboard-card"
          :class="{
            'dashboard-card-active': activePanel === 'vehicles',
          }"
          @click="activatePanel('vehicles')"
        >
          <div
            v-if="activePanel === 'vehicles'"
            class="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/15 blur-2xl"
          ></div>

          <div class="relative z-10 flex h-full flex-col">
            <div class="flex items-start justify-between gap-4">
              <div
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-[17px] border"
                :class="
                  activePanel === 'vehicles'
                    ? 'border-white/25 bg-white/20 text-white'
                    : 'border-[#f4dfd5] bg-[#ef8450]/10 text-[#ef8450]'
                "
              >
                <svg
                  width="23"
                  height="23"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <path
                    d="M5 17H3a2 2 0 01-2-2V5a2 2 0
                       012-2h11l5 5v9a2 2 0 01-2 2h-1"
                  />
                  <circle cx="9" cy="17" r="2" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
              </div>

              <span
                class="rounded-full px-3 py-1.5 text-[11px] font-extrabold"
                :class="
                  activePanel === 'vehicles'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#ef8450]/10 text-[#c0622e]'
                "
              >
                Im Fuhrpark
              </span>
            </div>

            <div class="mt-6">
              <p
                class="text-[12px] font-bold uppercase tracking-[0.08em]"
                :class="activePanel === 'vehicles' ? 'text-white/65' : 'text-[#9bb0af]'"
              >
                Fahrzeuge
              </p>

              <div
                v-if="adminStore.summaryLoading"
                class="mt-2 h-12 w-28 animate-pulse rounded-xl"
                :class="activePanel === 'vehicles' ? 'bg-white/15' : 'bg-[#f1f5f4]'"
              ></div>

              <p v-else class="mt-2 text-[48px] font-extrabold leading-none tracking-[-2px]">
                {{ adminStore.totalVehicles.toLocaleString("de-DE") }}
              </p>

              <p
                class="mt-2 text-[14px] font-bold"
                :class="activePanel === 'vehicles' ? 'text-white/85' : 'text-[#6f8585]'"
              >
                Fahrzeuge gesamt
              </p>
            </div>

            <div
              class="mt-auto border-t pt-5"
              :class="activePanel === 'vehicles' ? 'border-white/20' : 'border-[#edf2f1]'"
            >
              <div
                class="flex items-center justify-between rounded-[13px] px-3 py-3"
                :class="activePanel === 'vehicles' ? 'bg-white/10' : 'bg-[#f4f7f6]'"
              >
                <span
                  class="text-[11px] font-bold"
                  :class="activePanel === 'vehicles' ? 'text-white/65' : 'text-[#9bb0af]'"
                >
                  Fahrzeugliste öffnen
                </span>

                <!-- Hidden per QA: arrow suggests a separate action but is decorative
                <span class="text-[15px] font-extrabold"> → </span>
                -->
              </div>
            </div>
          </div>
        </button>
      </section>

      <!-- Dynamic list and sidebar -->
      <section class="grid grid-cols-[1.65fr_1fr] items-start gap-4 max-[1180px]:grid-cols-1">
        <Transition name="panel" mode="out-in">
          <!-- Users panel -->
          <section v-if="activePanel === 'users'" key="users" class="content-card">
            <div
              class="mb-4 flex items-center justify-between gap-4 max-[720px]:items-start max-[720px]:flex-col"
            >
              <div>
                <h2 class="text-[18px] font-extrabold tracking-[-0.3px] text-[#10393b]">Kunden</h2>

                <p class="mt-0.5 text-[12px] font-medium text-[#9bb0af]">
                  {{ panelUsersTotal }} Kunden insgesamt
                </p>
              </div>

              <div class="flex gap-0.5 rounded-[12px] bg-[#f4f7f6] p-[3px]">
                <button
                  type="button"
                  class="segment-button"
                  :class="{
                    'segment-button-active': panelUsersType === 'B2C',
                  }"
                  @click="panelUsersType = 'B2C'"
                >
                  Privatkunden
                </button>

                <button
                  type="button"
                  class="segment-button"
                  :class="{
                    'segment-button-active': panelUsersType === 'B2B',
                  }"
                  @click="panelUsersType = 'B2B'"
                >
                  Firmenkunden
                </button>
              </div>
            </div>

            <div class="panel-search">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>

              <input
                v-model="search"
                type="text"
                placeholder="Kunden durchsuchen…"
                class="panel-search-input"
              />

              <button v-if="search" type="button" class="search-clear" @click="search = ''">
                ×
              </button>
            </div>

            <div v-if="panelUsersLoading" class="flex flex-col gap-2">
              <div
                v-for="item in 6"
                :key="item"
                class="h-[58px] animate-pulse rounded-[15px] bg-[#f4f7f6]"
              ></div>
            </div>

            <div v-else class="flex flex-col gap-1">
              <div
                v-if="filteredPanelUsers.length === 0"
                class="py-12 text-center text-[13px] text-[#9bb0af]"
              >
                Keine Kunden gefunden.
              </div>

              <button
                v-for="user in filteredPanelUsers"
                :key="user.user_id"
                type="button"
                class="group flex w-full items-center gap-3 rounded-[13px] px-3 py-2.5 text-left transition-colors hover:bg-[#f6f9f8]"
                @click="openUserModal(user)"
              >
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] text-[11px] font-extrabold text-white"
                  style="background: linear-gradient(150deg, #01b990, #10393b)"
                >
                  {{ userInitials(user) }}
                </div>

                <div class="min-w-0 flex-1">
                  <p class="truncate text-[13px] font-bold text-[#10393b]">
                    {{ user.salutation }}
                    {{ user.first_name }}
                    {{ user.last_name }}
                  </p>

                  <p class="truncate text-[11.5px] text-[#6f8585]">
                    {{ user.user_email }}
                  </p>
                </div>

                <div class="flex shrink-0 items-center gap-2">
                  <span
                    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                    :class="
                      user.is_active
                        ? 'bg-[#01B990]/10 text-[#00856a]'
                        : 'bg-[#ef8450]/10 text-[#c0622e]'
                    "
                  >
                    <span class="h-[4px] w-[4px] rounded-full bg-current"></span>

                    {{ user.is_active ? "Aktiv" : "Inaktiv" }}
                  </span>

                  <span
                    class="flex h-7 w-7 items-center justify-center rounded-[8px] text-[#bcccca] transition-all group-hover:bg-[#10393b] group-hover:text-white"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M7 17L17 7M17 7H8M17 7v9" />
                    </svg>
                  </span>
                </div>
              </button>
            </div>

            <div class="pagination-row">
              <span>
                Seite {{ panelUsersPage }} von
                {{ panelUsersTotalPages }}
              </span>

              <div class="flex gap-1">
                <button
                  type="button"
                  class="lb-pg"
                  :disabled="panelUsersPage <= 1"
                  @click="panelUsersPage -= 1"
                >
                  ←
                </button>

                <button
                  v-for="page in pageRange(panelUsersPage, panelUsersTotalPages)"
                  :key="String(page)"
                  type="button"
                  class="lb-pg"
                  :class="{
                    'lb-pg-active': page === panelUsersPage,
                    'lb-pg-dot': page === '…',
                  }"
                  @click="typeof page === 'number' && (panelUsersPage = page)"
                >
                  {{ page }}
                </button>

                <button
                  type="button"
                  class="lb-pg"
                  :disabled="panelUsersPage >= panelUsersTotalPages"
                  @click="panelUsersPage += 1"
                >
                  →
                </button>
              </div>
            </div>
          </section>

          <!-- Vehicles panel -->
          <section v-else-if="activePanel === 'vehicles'" key="vehicles" class="content-card">
            <div class="mb-4">
              <h2 class="text-[18px] font-extrabold tracking-[-0.3px] text-[#10393b]">Fahrzeuge</h2>

              <p class="mt-0.5 text-[12px] font-medium text-[#9bb0af]">
                {{ panelVehiclesTotal }} Fahrzeuge insgesamt
              </p>
            </div>

            <div class="panel-search">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>

              <input
                v-model="search"
                type="text"
                placeholder="Fahrzeuge durchsuchen…"
                class="panel-search-input"
              />

              <button v-if="search" type="button" class="search-clear" @click="search = ''">
                ×
              </button>
            </div>

            <div v-if="panelVehiclesLoading" class="flex flex-col gap-2">
              <div
                v-for="item in 6"
                :key="item"
                class="h-[58px] animate-pulse rounded-[15px] bg-[#f4f7f6]"
              ></div>
            </div>

            <div v-else class="flex flex-col gap-1">
              <div
                v-if="filteredPanelVehicles.length === 0"
                class="py-12 text-center text-[13px] text-[#9bb0af]"
              >
                Keine Fahrzeuge gefunden.
              </div>

              <div
                v-for="vehicle in filteredPanelVehicles"
                :key="vehicle.vehicle_id"
                class="flex items-center gap-3 rounded-[13px] px-3 py-2.5 transition-colors hover:bg-[#f6f9f8]"
              >
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[#ef8450]/10 text-[#ef8450]"
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                  >
                    <path
                      d="M5 17H3a2 2 0 01-2-2V5a2 2 0
                         012-2h11l5 5v9a2 2 0 01-2 2h-1"
                    />
                    <circle cx="9" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                </div>

                <div class="min-w-0 flex-1">
                  <p class="truncate text-[13px] font-bold text-[#10393b]">
                    {{ vehicle.make }} {{ vehicle.model }}
                  </p>

                  <p class="truncate font-mono text-[11.5px] text-[#6f8585]">
                    {{ vehicle.license_plate }} · {{ vehicle.vin }}
                  </p>
                </div>

                <span
                  v-if="vehicle.current_order_status"
                  class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                  :style="{
                    background: getStatus(vehicle.current_order_status).background,
                    color: getStatus(vehicle.current_order_status).color,
                  }"
                >
                  <span class="h-[4px] w-[4px] rounded-full bg-current"></span>

                  {{ getStatus(vehicle.current_order_status).label }}
                </span>
              </div>
            </div>

            <div class="pagination-row">
              <span>
                Seite {{ panelVehiclesPage }} von
                {{ panelVehiclesTotalPages }}
              </span>

              <div class="flex gap-1">
                <button
                  type="button"
                  class="lb-pg"
                  :disabled="panelVehiclesPage <= 1"
                  @click="panelVehiclesPage -= 1"
                >
                  ←
                </button>

                <button
                  v-for="page in pageRange(panelVehiclesPage, panelVehiclesTotalPages)"
                  :key="String(page)"
                  type="button"
                  class="lb-pg"
                  :class="{
                    'lb-pg-active': page === panelVehiclesPage,
                    'lb-pg-dot': page === '…',
                  }"
                  @click="typeof page === 'number' && (panelVehiclesPage = page)"
                >
                  {{ page }}
                </button>

                <button
                  type="button"
                  class="lb-pg"
                  :disabled="panelVehiclesPage >= panelVehiclesTotalPages"
                  @click="panelVehiclesPage += 1"
                >
                  →
                </button>
              </div>
            </div>
          </section>

          <!-- Orders panel -->
          <section v-else key="orders" class="content-card">
            <div
              class="mb-4 flex items-center justify-between gap-4 max-[720px]:items-start max-[720px]:flex-col"
            >
              <div>
                <h2 class="text-[18px] font-extrabold tracking-[-0.3px] text-[#10393b]">
                  Letzte Aufträge
                </h2>

                <p class="mt-0.5 text-[12px] font-medium text-[#9bb0af]">
                  {{ panelOrdersTotal }} Aufträge insgesamt
                </p>
              </div>

              <div class="flex gap-0.5 rounded-[12px] bg-[#f4f7f6] p-[3px]">
                <button
                  v-for="filter in panelOrdersFilters"
                  :key="filter"
                  type="button"
                  class="segment-button"
                  :class="{
                    'segment-button-active': panelOrdersFilter === filter,
                  }"
                  @click="panelOrdersFilter = filter"
                >
                  {{ filter }}
                </button>
              </div>
            </div>

            <div class="panel-search">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>

              <input
                v-model="search"
                type="text"
                placeholder="Aufträge durchsuchen…"
                class="panel-search-input"
              />

              <button v-if="search" type="button" class="search-clear" @click="search = ''">
                ×
              </button>
            </div>

            <div v-if="panelOrdersLoading" class="flex flex-col gap-2">
              <div
                v-for="item in 6"
                :key="item"
                class="h-[58px] animate-pulse rounded-[15px] bg-[#f4f7f6]"
              ></div>
            </div>

            <div v-else class="flex flex-col gap-1">
              <div
                v-if="filteredPanelOrders.length === 0"
                class="py-12 text-center text-[13px] text-[#9bb0af]"
              >
                Keine Aufträge gefunden.
              </div>

              <div
                v-for="order in filteredPanelOrders"
                :key="order.id"
                class="flex items-center gap-3 rounded-[13px] px-3 py-2.5 transition-colors hover:bg-[#f6f9f8]"
              >
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[#6366f1]/10 text-[#6366f1]"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                  >
                    <path
                      d="M14 2H6a2 2 0 00-2 2v16a2 2 0
                         002 2h12a2 2 0 002-2V8z"
                    />
                    <path d="M14 2v6h6M16 13H8M16 17H8" />
                  </svg>
                </div>

                <div class="min-w-0 flex-1">
                  <div class="mb-0.5 flex flex-wrap items-center gap-2">
                    <span class="font-mono text-[13px] font-bold text-[#10393b]">
                      {{ order.auftragsnummer }}
                    </span>

                    <span class="text-[11.5px] text-[#9bb0af]">
                      {{ order.make }} {{ order.model }}
                    </span>
                  </div>

                  <p class="truncate text-[11.5px] text-[#6f8585]">
                    {{ order.company_name ?? order.user_email }}
                  </p>
                </div>

                <div class="flex shrink-0 items-center gap-2">
                  <span
                    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                    :style="{
                      background: getStatus(order.order_status).background,
                      color: getStatus(order.order_status).color,
                    }"
                  >
                    <span class="h-[4px] w-[4px] rounded-full bg-current"></span>

                    {{ getStatus(order.order_status).label }}
                  </span>

                  <span class="hidden text-[11px] tabular-nums text-[#9bb0af] lg:block">
                    {{ formatGermanDate(order.created_at) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="pagination-row">
              <span>
                Seite {{ panelOrdersPage }} von
                {{ panelOrdersTotalPages }}
              </span>

              <div class="flex gap-1">
                <button
                  type="button"
                  class="lb-pg"
                  :disabled="panelOrdersPage <= 1"
                  @click="panelOrdersPage -= 1"
                >
                  ←
                </button>

                <button
                  v-for="page in pageRange(panelOrdersPage, panelOrdersTotalPages)"
                  :key="String(page)"
                  type="button"
                  class="lb-pg"
                  :class="{
                    'lb-pg-active': page === panelOrdersPage,
                    'lb-pg-dot': page === '…',
                  }"
                  @click="typeof page === 'number' && (panelOrdersPage = page)"
                >
                  {{ page }}
                </button>

                <button
                  type="button"
                  class="lb-pg"
                  :disabled="panelOrdersPage >= panelOrdersTotalPages"
                  @click="panelOrdersPage += 1"
                >
                  →
                </button>
              </div>
            </div>
          </section>
        </Transition>

        <!-- Right column -->
        <aside class="flex flex-col gap-4">
          <section
            v-if="adminStore.pendingInspections > 0"
            class="flex items-center gap-3 rounded-[20px] border border-[#ef8450]/20 p-4"
            style="
              background: linear-gradient(
                135deg,
                rgba(239, 132, 80, 0.11),
                rgba(239, 132, 80, 0.03)
              );
            "
          >
            <div
              class="lb-pulse flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] text-white"
              style="background: linear-gradient(140deg, #f59b6c, #ef8450)"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
              >
                <path
                  d="M18 8A6 6 0 006 8c0 7-3 9-3
                     9h18s-3-2-3-9M13.73 21a2 2 0
                     01-3.46 0"
                />
              </svg>
            </div>

            <div class="min-w-0 flex-1">
              <strong class="block text-[13px] font-extrabold text-[#10393b]">
                {{ adminStore.pendingInspections }}
                ausstehende Inspektion{{ adminStore.pendingInspections === 1 ? "" : "en" }}
              </strong>

              <span class="text-[11.5px] font-semibold text-[#b06c44]">
                Warten auf Bearbeitung
              </span>
            </div>

            <!-- Hidden per QA: orders panel is already the default, so the button has no visible effect
            <button
              type="button"
              class="flex shrink-0 items-center gap-1 rounded-[10px] px-3 py-2 text-[12px] font-bold text-white transition-transform hover:translate-x-px"
              style="background: linear-gradient(140deg, #f59b6c, #ef8450)"
              @click="activatePanel('orders')"
            >
              Anzeigen
              <span>→</span>
            </button>
            -->
          </section>

          <section class="content-card">
            <h2 class="mb-5 text-[17px] font-extrabold tracking-[-0.3px] text-[#10393b]">
              Auftragsstatus
            </h2>

            <div v-if="adminStore.summaryLoading" class="flex items-center gap-5">
              <div
                class="h-[120px] w-[120px] shrink-0 animate-pulse rounded-full bg-[#f4f7f6]"
              ></div>

              <div class="flex flex-1 flex-col gap-3">
                <div
                  v-for="item in 3"
                  :key="item"
                  class="h-5 animate-pulse rounded-lg bg-[#f4f7f6]"
                ></div>
              </div>
            </div>

            <div v-else class="flex items-center gap-4">
              <svg class="h-[120px] w-[120px] shrink-0" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="48" fill="none" stroke="#f0f4f3" stroke-width="14" />

                <circle
                  v-for="segment in donutSegments"
                  :key="segment.label"
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  :stroke="segment.color"
                  stroke-width="14"
                  :stroke-dasharray="segment.dash"
                  :stroke-dashoffset="segment.offset"
                  stroke-linecap="round"
                  transform="rotate(-90 60 60)"
                />

                <text x="60" y="55" text-anchor="middle" class="donut-total">
                  {{ donutTotal }}
                </text>

                <text x="60" y="72" text-anchor="middle" class="donut-label">AUFTRÄGE</text>
              </svg>

              <div class="flex flex-1 flex-col gap-3">
                <div
                  v-for="item in donutDistribution"
                  :key="item.label"
                  class="flex items-center gap-2"
                >
                  <span
                    class="h-[8px] w-[8px] shrink-0 rounded-[3px]"
                    :style="{ background: item.color }"
                  ></span>

                  <span class="flex-1 text-[12px] font-semibold text-[#6f8585]">
                    {{ item.label }}
                  </span>

                  <span class="text-[13px] font-extrabold tabular-nums text-[#10393b]">
                    {{ item.count }}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section class="content-card">
            <div class="mb-5 flex items-center justify-between">
              <h2 class="text-[17px] font-extrabold tracking-[-0.3px] text-[#10393b]">
                Systemstatus
              </h2>

              <span
                class="rounded-full bg-[#01B990]/10 px-2.5 py-1 text-[11px] font-bold text-[#00856a]"
              >
                3 / 4 aktiv
              </span>
            </div>

            <div class="flex flex-col gap-3">
              <div
                v-for="service in services"
                :key="service.name"
                class="flex items-center gap-2.5"
              >
                <span
                  class="h-2 w-2 shrink-0 rounded-full"
                  :class="
                    service.status === 'ok'
                      ? 'bg-[#01B990] shadow-[0_0_0_3px_rgba(1,185,144,0.15)]'
                      : 'bg-[#ef8450] shadow-[0_0_0_3px_rgba(239,132,80,0.15)]'
                  "
                ></span>

                <span class="flex-1 text-[13px] font-semibold text-[#1a2e2f]">
                  {{ service.name }}
                </span>

                <span
                  class="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                  :class="
                    service.status === 'ok'
                      ? 'bg-[#01B990]/10 text-[#00856a]'
                      : 'bg-[#ef8450]/10 text-[#c0622e]'
                  "
                >
                  {{ service.label }}
                </span>
              </div>
            </div>
          </section>
        </aside>
      </section>
    </main>
  </div>

  <UserDetailModal :user="selectedUser" :open="modalOpen" @close="closeUserModal" />
</template>

<style scoped>
.dashboard-card {
  position: relative;
  min-height: 320px;
  overflow: hidden;
  border: 1px solid #e8efee;
  border-radius: 26px;
  background: #ffffff;
  padding: 28px;
  color: #10393b;
  text-align: left;
  box-shadow: 0 8px 28px rgba(16, 57, 59, 0.06);
  transition:
    transform 200ms ease,
    box-shadow 200ms ease,
    border-color 200ms ease,
    background 200ms ease;
}

.dashboard-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 38px rgba(16, 57, 59, 0.1);
}

.dashboard-card-active {
  border-color: #01b990;
  background: linear-gradient(145deg, #55bd99 0%, #0a8d70 100%);
  color: #ffffff;
  box-shadow: 0 20px 45px rgba(1, 185, 144, 0.24);
}

.content-card {
  border: 1px solid #eef3f2;
  border-radius: 24px;
  background: #ffffff;
  padding: 24px;
  box-shadow: 0 6px 22px rgba(16, 57, 59, 0.04);
}

.panel-search {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  border: 1px solid #e9efee;
  border-radius: 13px;
  background: #f4f7f6;
  padding: 10px 14px;
  color: #6f8585;
}

.panel-search-input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: #1a2e2f;
  font-family: Manrope, sans-serif;
  font-size: 13px;
}

.panel-search-input::placeholder {
  color: #9bb0af;
}

.search-clear {
  display: flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: #9bb0af;
  transition:
    background 150ms ease,
    color 150ms ease;
}

.search-clear:hover {
  background: #ffffff;
  color: #10393b;
}

.segment-button {
  border-radius: 9px;
  padding: 6px 14px;
  color: #6f8585;
  font-family: Manrope, sans-serif;
  font-size: 12px;
  font-weight: 700;
  transition:
    background 150ms ease,
    color 150ms ease,
    box-shadow 150ms ease;
}

.segment-button:hover {
  color: #10393b;
}

.segment-button-active {
  background: #ffffff;
  color: #10393b;
  box-shadow: 0 1px 5px rgba(16, 57, 59, 0.1);
}

.pagination-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  border-top: 1px solid #eef3f2;
  padding-top: 12px;
  color: #9bb0af;
  font-size: 11.5px;
}

.lb-pg {
  display: flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border: 1px solid #eef3f2;
  border-radius: 8px;
  color: #6f8585;
  font-family: Manrope, sans-serif;
  font-size: 12.5px;
  font-weight: 700;
  transition:
    border-color 150ms ease,
    background 150ms ease,
    color 150ms ease;
}

.lb-pg:hover:not(:disabled) {
  border-color: #10393b;
  color: #10393b;
}

.lb-pg:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.lb-pg-active {
  border-color: #10393b;
  background: #10393b;
  color: #ffffff;
}

.lb-pg-active:hover:not(:disabled) {
  color: #ffffff;
}

.lb-pg-dot {
  cursor: default;
  border-color: transparent;
  color: #9bb0af;
}

.panel-enter-active {
  transition: all 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.panel-leave-active {
  transition: all 160ms ease;
}

.panel-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.panel-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.lb-pulse {
  animation: lb-pulse 2.2s infinite;
  box-shadow: 0 0 0 0 rgba(239, 132, 80, 0.5);
}

.donut-total {
  fill: #10393b;
  font-family: Manrope, sans-serif;
  font-size: 24px;
  font-weight: 800;
}

.donut-label {
  fill: #9bb0af;
  font-family: Manrope, sans-serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

@keyframes lb-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(239, 132, 80, 0.4);
  }

  70% {
    box-shadow: 0 0 0 12px rgba(239, 132, 80, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(239, 132, 80, 0);
  }
}

@media (max-width: 720px) {
  .dashboard-card {
    min-height: 300px;
    padding: 22px;
  }

  .content-card {
    padding: 18px;
  }

  .pagination-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }
}
</style>
