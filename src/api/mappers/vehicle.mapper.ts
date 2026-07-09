import type { VehicleStatusResponse } from "@/types";
import type { Vehicle } from "@/components/dashboard/vehicle.types";
import { getOrderStatusLabel } from "@/lib/status";
import { orderProviderLabel } from "@/lib/provider";

export const mapVehicleResponseToVehicle = (response: VehicleStatusResponse): Vehicle => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const d = date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const t = date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${d}\n${t} Uhr`;
  };

  // Get data from the latest order if available
  const latestOrder = response.orders && response.orders.length > 0 ? response.orders[0] : null;
  const workshopName = latestOrder?.request_payload?.besichtigungsort?.name || "";

  // Create timeline from status updates and inspection
  const timeline: any[] = [];

  if (latestOrder) {
    // Add inspection appointment if exists
    if (latestOrder.request_payload.besichtigungsort) {
      const b = latestOrder.request_payload.besichtigungsort;
      timeline.push({
        datetime: formatDateTime(b.termin),
        label: orderProviderLabel(latestOrder) || "Partner",
        sublabel: `${b.strasse}, ${b.plz} ${b.ort}`,
      });
    }

    // Add status updates (e.g. when an admin changes an order's status)
    if (latestOrder.status_updates) {
      latestOrder.status_updates.forEach((update) => {
        const newLabel = getOrderStatusLabel(update.new_status).label;
        timeline.push({
          datetime: formatDateTime(update.created_at),
          label: "Status aktualisiert",
          sublabel: update.old_status
            ? `${getOrderStatusLabel(update.old_status).label} → ${newLabel}`
            : newLabel,
        });
      });
    }
  }

  // Extract documents if available
  const leasingDocuments: string[] = [];
  const returnDocuments: string[] = [];

  if (latestOrder?.request_payload?.benachrichtigung) {
    const b = latestOrder.request_payload.benachrichtigung;
    if (b.gutachten && Array.isArray(b.gutachten)) {
      b.gutachten.forEach((doc: any) =>
        returnDocuments.push(typeof doc === "string" ? doc : "Gutachten"),
      );
    }
    if (b.terminbestätigung && Array.isArray(b.terminbestätigung)) {
      b.terminbestätigung.forEach((doc: any) =>
        leasingDocuments.push(typeof doc === "string" ? doc : "Terminbestätigung"),
      );
    }
  }

  return {
    // Original API fields
    vehicle_id: response.vehicle_id,
    license_plate: response.license_plate,
    first_registration_date: response.first_registration_date,
    leasing_end_date: response.leasing_end_date,
    vin: response.vin,
    make: response.make,
    model: response.model,
    vehicle_belongs: response.vehicle_belongs,
    b2b_id: response.b2b_id || null,
    b2c_user_id: response.b2c_user_id || null,
    created_at: response.created_at,
    updated_at: response.updated_at,
    orders: (response.orders || []).map((order) => ({
      ...order,
      report_documents: order.report_documents || [],
    })),
    // Mapped fields for backwards compatibility
    id: response.vehicle_id,
    licensePlate: response.license_plate,
    brand: response.make,
    leaseEnd: formatDate(response.leasing_end_date),
    returnStart: formatDate(response.first_registration_date),
    driver: latestOrder?.request_payload?.ansprechpartner?.name || "",
    driverFirstName: latestOrder?.request_payload?.ansprechpartner?.name?.split(" ")[0] || "",
    driverLastName:
      latestOrder?.request_payload?.ansprechpartner?.name?.split(" ").slice(1).join(" ") || "",
    driverPhone: latestOrder?.request_payload?.ansprechpartner?.telefon || "",
    usageAddress: latestOrder?.request_payload?.besichtigungsort
      ? `${latestOrder.request_payload.besichtigungsort.strasse}, ${latestOrder.request_payload.besichtigungsort.plz} ${latestOrder.request_payload.besichtigungsort.ort}`
      : "",
    lastActivity: timeline.length > 0 ? timeline[timeline.length - 1].label : "Neu angelegt",
    fin: response.vin,
    kilometerstand: "N/A",
    leasinggeber: response.leasinggeber || "N/A",
    leasingAbgabetermin: formatDate(response.leasing_end_date),
    status: response.vehicle_belongs === "B2C" ? "Privat" : "Gewerblich",
    workshopName: workshopName,
    leasingDocuments,
    returnDocuments,
    offers: [],
    timeline: timeline,
    notifications: 0,
    completed: false,
  };
};
