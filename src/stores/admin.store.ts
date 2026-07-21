import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { adminDashboardApi } from "@/api/modules/admin-dashboard.api";
import { adminUsersApi } from "@/api/modules/admin-users.api";
import { adminVehiclesApi } from "@/api/modules/admin-vehicles.api";
import { adminOrdersApi } from "@/api/modules/admin-orders.api";
import type {
  AdminSummaryResponse,
  AdminUserListResponse,
  AdminVehicleListResponse,
  AdminOrderListResponse,
} from "@/types";

export const useAdminStore = defineStore("admin", () => {
  // ── Summary ────────────────────────────────────────────────────
  const summary = ref<AdminSummaryResponse | null>(null);
  const summaryLoading = ref(false);
  const summaryError = ref<string | null>(null);

  async function fetchSummary() {
    summaryLoading.value = true;
    summaryError.value = null;
    try {
      summary.value = await adminDashboardApi.getSummary();
    } catch (e: any) {
      summaryError.value = e?.message ?? "Fehler beim Laden der Zusammenfassung";
    } finally {
      summaryLoading.value = false;
    }
  }

  // ── Computed KPI values from summary ───────────────────────────
  const totalCustomers = computed(
    () => (summary.value?.total_b2c_customers ?? 0) + (summary.value?.total_b2b_companies ?? 0),
  );
  const totalB2C = computed(() => summary.value?.total_b2c_customers ?? 0);
  const totalB2B = computed(() => summary.value?.total_b2b_companies ?? 0);
  const totalVehicles = computed(() => summary.value?.total_vehicles ?? 0);
  const totalOrders = computed(() => summary.value?.total_orders ?? 0);
  const activeOrders = computed(() => summary.value?.active_orders ?? 0);
  const completedOrders = computed(() => summary.value?.completed_orders ?? 0);
  const pendingInspections = computed(() => summary.value?.pending_inspections ?? 0);

  // ── Users ──────────────────────────────────────────────────────
  const users = ref<AdminUserListResponse | null>(null);
  const usersLoading = ref(false);
  const usersError = ref<string | null>(null);
  const usersPage = ref(1);
  const usersLimit = ref(10);
  const usersType = ref<"b2c" | "b2b">("b2c");

  async function fetchUsers(type?: "b2c" | "b2b", page?: number) {
    if (type !== undefined) usersType.value = type;
    if (page !== undefined) usersPage.value = page;
    usersLoading.value = true;
    usersError.value = null;
    try {
      users.value =
        usersType.value === "b2b"
          ? await adminUsersApi.getB2b(usersPage.value, usersLimit.value)
          : await adminUsersApi.getB2c(usersPage.value, usersLimit.value);
    } catch (e: any) {
      usersError.value = e?.message ?? "Fehler beim Laden der Benutzer";
    } finally {
      usersLoading.value = false;
    }
  }

  // ── Vehicles ───────────────────────────────────────────────────
  const vehicles = ref<AdminVehicleListResponse | null>(null);
  const vehiclesLoading = ref(false);
  const vehiclesError = ref<string | null>(null);
  const vehiclesPage = ref(1);
  const vehiclesLimit = ref(20);
  const vehiclesUserType = ref<"Firmenkunde" | "Privatkunde" | "all">("all");
  const vehiclesStatus = ref<string | undefined>(undefined);

  async function fetchVehicles(opts?: {
    userType?: "Firmenkunde" | "Privatkunde" | "all";
    page?: number;
    status?: string;
  }) {
    if (opts?.userType !== undefined) vehiclesUserType.value = opts.userType;
    if (opts?.page !== undefined) vehiclesPage.value = opts.page;
    if (opts?.status !== undefined) vehiclesStatus.value = opts.status;
    vehiclesLoading.value = true;
    vehiclesError.value = null;
    try {
      vehicles.value =
        vehiclesUserType.value === "all"
          ? await adminVehiclesApi.listAll(vehiclesPage.value, vehiclesLimit.value)
          : await adminVehiclesApi.listByUserType(
              vehiclesUserType.value,
              vehiclesPage.value,
              vehiclesLimit.value,
              vehiclesStatus.value,
            );
    } catch (e: any) {
      vehiclesError.value = e?.message ?? "Fehler beim Laden der Fahrzeuge";
    } finally {
      vehiclesLoading.value = false;
    }
  }

  async function fetchVehiclesByUser(userId: string, page = 1, status?: string) {
    vehiclesLoading.value = true;
    vehiclesError.value = null;
    try {
      vehicles.value = await adminVehiclesApi.listByUser(userId, page, vehiclesLimit.value, status);
    } catch (e: any) {
      vehiclesError.value = e?.message ?? "Fehler beim Laden der Fahrzeuge";
    } finally {
      vehiclesLoading.value = false;
    }
  }

  // ── Orders ─────────────────────────────────────────────────────
  const orders = ref<AdminOrderListResponse | null>(null);
  const ordersLoading = ref(false);
  const ordersError = ref<string | null>(null);
  const ordersPage = ref(1);
  const ordersLimit = ref(10);
  const ordersUserType = ref<"Firmenkunde" | "Privatkunde" | "all">("all");

  async function fetchOrders(opts?: {
    userType?: "Firmenkunde" | "Privatkunde" | "all";
    page?: number;
    limit?: number;
  }) {
    if (opts?.userType !== undefined) ordersUserType.value = opts.userType;
    if (opts?.page !== undefined) ordersPage.value = opts.page;
    if (opts?.limit !== undefined) ordersLimit.value = opts.limit;
    ordersLoading.value = true;
    ordersError.value = null;
    try {
      orders.value =
        ordersUserType.value === "all"
          ? await adminOrdersApi.listAll(ordersPage.value, ordersLimit.value)
          : await adminOrdersApi.listByUserType(
              ordersUserType.value,
              ordersPage.value,
              ordersLimit.value,
            );
    } catch (e: any) {
      ordersError.value = e?.message ?? "Fehler beim Laden der Aufträge";
    } finally {
      ordersLoading.value = false;
    }
  }

  async function fetchOrdersByUser(userId: string, page = 1) {
    ordersLoading.value = true;
    ordersError.value = null;
    try {
      orders.value = await adminOrdersApi.listByUser(userId, page, ordersLimit.value);
    } catch (e: any) {
      ordersError.value = e?.message ?? "Fehler beim Laden der Aufträge";
    } finally {
      ordersLoading.value = false;
    }
  }

  // ── Reset ──────────────────────────────────────────────────────
  function $reset() {
    summary.value = null;
    users.value = null;
    vehicles.value = null;
    orders.value = null;
  }

  return {
    // summary
    summary,
    summaryLoading,
    summaryError,
    fetchSummary,
    totalCustomers,
    totalB2C,
    totalB2B,
    totalVehicles,
    totalOrders,
    activeOrders,
    completedOrders,
    pendingInspections,

    // users
    users,
    usersLoading,
    usersError,
    usersPage,
    usersLimit,
    usersType,
    fetchUsers,

    // vehicles
    vehicles,
    vehiclesLoading,
    vehiclesError,
    vehiclesPage,
    vehiclesLimit,
    vehiclesUserType,
    vehiclesStatus,
    fetchVehicles,
    fetchVehiclesByUser,

    // orders
    orders,
    ordersLoading,
    ordersError,
    ordersPage,
    ordersLimit,
    ordersUserType,
    fetchOrders,
    fetchOrdersByUser,

    $reset,
  };
});
