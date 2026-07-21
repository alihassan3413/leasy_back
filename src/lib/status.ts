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
