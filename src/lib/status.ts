export interface StatusLabel {
  label: string;
  colorClass: string;
  backgroundClass: string;
}

const userStatusMap: Record<string, StatusLabel> = {
  active: {
    label: "Aktiv",
    colorClass: "text-[#05603a]",
    backgroundClass: "bg-[#d1fae5]",
  },
  inactive: {
    label: "Inaktiv",
    colorClass: "text-[#7c2d12]",
    backgroundClass: "bg-[#fee2e2]",
  },
};

const orderStatusMap: Record<string, StatusLabel> = {
  order_requested: {
    label: "Anfrage gesendet",
    colorClass: "text-[#1e40af]",
    backgroundClass: "bg-[#dbeafe]",
  },
  order_placed: {
    label: "Angefragt",
    colorClass: "text-[#9a3412]",
    backgroundClass: "bg-[#fed7aa]",
  },
  confirmed: {
    label: "Bestätigt",
    colorClass: "text-[#92400e]",
    backgroundClass: "bg-[#fde68a]",
  },
  inspected: {
    label: "Geprüft",
    colorClass: "text-[#064e3b]",
    backgroundClass: "bg-[#bbf7d0]",
  },
  workshop: {
    label: "In Werkstatt",
    colorClass: "text-[#b45309]",
    backgroundClass: "bg-[#fef3c7]",
  },
  reinspection: {
    label: "Nachprüfung",
    colorClass: "text-[#6d28d9]",
    backgroundClass: "bg-[#ede9fe]",
  },
  reworkshop: {
    label: "Erneut in Werkstatt",
    colorClass: "text-[#c2410c]",
    backgroundClass: "bg-[#ffedd5]",
  },
  delivered: {
    label: "Geliefert",
    colorClass: "text-[#0f766e]",
    backgroundClass: "bg-[#ccfbf1]",
  },
  completed: {
    label: "Abgeschlossen",
    colorClass: "text-[#14532d]",
    backgroundClass: "bg-[#dcfce7]",
  },
  discarded: {
    label: "Verworfen",
    colorClass: "text-[#374151]",
    backgroundClass: "bg-[#e5e7eb]",
  },
  cancelled: {
    label: "Storniert",
    colorClass: "text-[#991b1b]",
    backgroundClass: "bg-[#fee2e2]",
  },
};

/**
 * Canonical German label for every `order_status` value we may receive,
 * including legacy/non-settable ones (`order_requested`, `order_placed`,
 * `completed`). Used wherever a status needs to be *displayed*.
 * The English value is always what travels to/from the backend.
 */
export const orderStatusLabels: Record<string, string> = Object.fromEntries(
  Object.entries(orderStatusMap).map(([value, { label }]) => [value, label]),
);

/**
 * The backend-settable `order_status` values — must match the API's allowed
 * set exactly. These are the options offered in the "Neuer Status" dropdown
 * (English `value` sent to the backend, German `label` shown in the UI).
 */
const settableOrderStatuses = [
  "confirmed",
  "inspected",
  "workshop",
  "reinspection",
  "reworkshop",
  "delivered",
  "completed",
  "discarded",
  "cancelled",
] as const;

/** Options for the status-change dropdown (settable statuses only). */
export const orderStatusOptions: { value: string; label: string }[] = settableOrderStatuses.map(
  (value) => ({
    value,
    label: orderStatusLabels[value] ?? value,
  }),
);

/**
 * Options for status *filter* dropdowns — every status that can appear on an
 * order, including legacy ones, so existing orders remain filterable.
 */
export const orderStatusFilterOptions: { value: string; label: string }[] = Object.entries(
  orderStatusLabels,
).map(([value, label]) => ({ value, label }));

const vehicleStatusMap: Record<string, StatusLabel> = {
  order_placed: orderStatusMap.order_placed,
  confirmed: orderStatusMap.confirmed,
  inspected: orderStatusMap.inspected,
  delivered: orderStatusMap.delivered,
  completed: orderStatusMap.completed,
};

export function getUserStatusLabel(isActive: boolean): StatusLabel {
  return isActive ? userStatusMap.active : userStatusMap.inactive;
}

export function getOrderStatusLabel(status: string): StatusLabel {
  return (
    orderStatusMap[status] ?? {
      label: status ? status.replace(/_/g, " ") : "Unbekannt",
      colorClass: "text-[#334155]",
      backgroundClass: "bg-[#f8fafc]",
    }
  );
}

export function getVehicleStatusLabel(status: string): StatusLabel {
  return vehicleStatusMap[status] ?? getOrderStatusLabel(status);
}

/**
 * Canonical label for a possibly-missing/unknown `order_status`, falling back
 * to the raw value or an em dash. Centralizes the `orderStatusLabels[x] ?? x
 * ?? "—"` expression previously duplicated across several admin modals.
 */
export function getOrderStatusLabelOrDash(status: string | null | undefined): string {
  return orderStatusLabels[status ?? ""] ?? status ?? "—";
}

// ─────────────────────────────────────────────
// Page-specific order-status pill styles (admin views)
// ─────────────────────────────────────────────
// Several admin views each kept their own local color map plus a `getStatus()`
// lookup helper. Those palettes differ from one another (and from the badge
// colors above) and are preserved exactly as they were — only the duplicated
// map + lookup-function pairs were moved out of the components and into this
// single file. Do not merge these into one shared palette; that would change
// each view's existing colors.

export interface StatusPillStyle {
  label: string;
  background: string;
  color: string;
}

const adminDashboardStatusStyles: Record<string, StatusPillStyle> = {
  order_placed: { label: "Angefragt", background: "rgba(239, 132, 80, 0.12)", color: "#c0622e" },
  confirmed: { label: "Bestätigt", background: "rgba(99, 102, 241, 0.12)", color: "#4f46e5" },
  inspected: { label: "Geprüft", background: "rgba(1, 185, 144, 0.12)", color: "#00856a" },
  workshop: { label: "In Werkstatt", background: "rgba(245, 158, 11, 0.12)", color: "#b45309" },
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
  delivered: { label: "Geliefert", background: "rgba(16, 57, 59, 0.09)", color: "#10393b" },
  completed: { label: "Abgeschlossen", background: "rgba(1, 185, 144, 0.12)", color: "#00856a" },
  discarded: { label: "Verworfen", background: "rgba(107, 114, 128, 0.12)", color: "#374151" },
  cancelled: { label: "Storniert", background: "rgba(220, 38, 38, 0.10)", color: "#991b1b" },
};

/**
 * Status pill for the admin overview dashboard (`AdminPanel.vue`). Mirrors
 * that page's original local `getStatus()` exactly: a missing status renders
 * "Kein Status", while a present-but-unmapped value (e.g. `order_requested`,
 * which this palette intentionally omits, as before) falls back to the raw
 * value as its label.
 */
export function getAdminDashboardStatus(status: string | null | undefined): StatusPillStyle {
  if (!status) {
    return { label: "Kein Status", background: "rgba(0, 0, 0, 0.05)", color: "#6f8585" };
  }

  return (
    adminDashboardStatusStyles[status] ?? {
      label: status,
      background: "rgba(0, 0, 0, 0.05)",
      color: "#6f8585",
    }
  );
}

export interface StatusBadgeStyle {
  label: string;
  bg: string;
  fg: string;
}

const ordersViewStatusStyles: Record<string, StatusBadgeStyle> = {
  order_requested: { label: "Anfrage gesendet", bg: "rgba(59,130,246,0.1)", fg: "#3b82f6" },
  order_placed: { label: "Angefragt", bg: "rgba(239,132,80,0.1)", fg: "#c0622e" },
  confirmed: { label: "Bestätigt", bg: "rgba(99,102,241,0.1)", fg: "#4f46e5" },
  inspected: { label: "Geprüft", bg: "rgba(1,185,144,0.1)", fg: "#00856a" },
  workshop: { label: "In Werkstatt", bg: "rgba(245,158,11,0.12)", fg: "#b45309" },
  reinspection: { label: "Nachprüfung", bg: "rgba(124,58,237,0.1)", fg: "#6d28d9" },
  reworkshop: { label: "Erneut in Werkstatt", bg: "rgba(234,88,12,0.1)", fg: "#c2410c" },
  delivered: { label: "Geliefert", bg: "rgba(6,182,212,0.1)", fg: "#0e7490" },
  completed: { label: "Abgeschlossen", bg: "rgba(16,57,59,0.08)", fg: "#10393b" },
  discarded: { label: "Verworfen", bg: "rgba(107,114,128,0.12)", fg: "#374151" },
  cancelled: { label: "Storniert", bg: "rgba(220,38,38,0.1)", fg: "#991b1b" },
};

/** Status badge for the admin orders list (`OrdersView.vue`). */
export function getOrdersViewStatus(status: string | null | undefined): StatusBadgeStyle {
  return (
    ordersViewStatusStyles[status ?? ""] ?? {
      label: status ?? "—",
      bg: "rgba(0,0,0,0.05)",
      fg: "#6b7280",
    }
  );
}

const vehiclesViewStatusColors: Record<string, { bg: string; fg: string }> = {
  order_requested: { bg: "rgba(59,130,246,0.1)", fg: "#3b82f6" },
  order_placed: { bg: "rgba(239,132,80,0.1)", fg: "#c0622e" },
  confirmed: { bg: "rgba(99,102,241,0.1)", fg: "#4f46e5" },
  inspected: { bg: "rgba(1,185,144,0.1)", fg: "#00856a" },
  workshop: { bg: "rgba(245,158,11,0.12)", fg: "#b45309" },
  reinspection: { bg: "rgba(124,58,237,0.1)", fg: "#6d28d9" },
  reworkshop: { bg: "rgba(234,88,12,0.1)", fg: "#c2410c" },
  delivered: { bg: "rgba(16,57,59,0.08)", fg: "#10393b" },
  completed: { bg: "rgba(16,57,59,0.08)", fg: "#10393b" },
  discarded: { bg: "rgba(107,114,128,0.12)", fg: "#374151" },
  cancelled: { bg: "rgba(220,38,38,0.1)", fg: "#991b1b" },
};

/**
 * Status badge for the admin vehicles list (`VehiclesView.vue`). Colors are
 * local to this view; the label reuses the canonical `orderStatusLabels`
 * (this view already sourced its label that way before the refactor).
 */
export function getVehiclesViewStatus(status: string | null | undefined): StatusBadgeStyle {
  const key = status ?? "";
  const style = vehiclesViewStatusColors[key] ?? { bg: "rgba(0,0,0,0.05)", fg: "#6b7280" };
  return { ...style, label: orderStatusLabels[key] ?? status ?? "—" };
}

const userDetailStatusStyles: Record<string, StatusBadgeStyle> = {
  order_placed: { label: "Angefragt", bg: "rgba(239,132,80,0.1)", fg: "#c0622e" },
  confirmed: { label: "Bestätigt", bg: "rgba(99,102,241,0.1)", fg: "#4f46e5" },
  inspected: { label: "Geprüft", bg: "rgba(1,185,144,0.1)", fg: "#00856a" },
  delivered: { label: "Geliefert", bg: "rgba(16,57,59,0.08)", fg: "#10393b" },
  completed: { label: "Abgeschlossen", bg: "rgba(16,57,59,0.08)", fg: "#10393b" },
};

/**
 * Status badge for the admin user-detail modal (`UserDetail.vue`). This
 * palette only ever covered 5 of the 11 statuses — unmapped values (including
 * some real ones like `workshop`/`cancelled`) fall back to the raw value, same
 * as before the refactor.
 */
export function getUserDetailStatus(status: string | null | undefined): StatusBadgeStyle {
  return (
    userDetailStatusStyles[status ?? ""] ?? {
      label: status ?? "—",
      bg: "rgba(0,0,0,0.05)",
      fg: "#6b7280",
    }
  );
}
