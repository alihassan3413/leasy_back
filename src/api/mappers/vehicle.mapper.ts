import type { VehicleStatusResponse } from "@/types";
import type { Vehicle } from "@/components/dashboard/vehicle.types";

export const mapVehicleResponseToVehicle = (
  response: VehicleStatusResponse,
): Vehicle => {
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

  return {
    id: response.vehicle_id,
    licensePlate: response.license_plate,
    brand: response.make,
    model: response.model,
    leaseEnd: formatDate(response.leasing_end_date),
    returnStart: formatDate(response.first_registration_date),
    driver: "",
    driverFirstName: "",
    driverLastName: "",
    driverPhone: "",
    usageAddress: "",
    lastActivity: "",
    fin: response.vin,
    kilometerstand: "",
    leasinggeber: "",
    leasingAbgabetermin: formatDate(response.leasing_end_date),
    status: response.vehicle_belongs,
    workshopName: "",
    leasingDocuments: [],
    returnDocuments: [],
    offers: [],
    timeline: [],
    notifications: 0,
    completed: false,
  };
};
