import { defineStore } from "pinia";
import { ref } from "vue";
import { vehicleApi } from "@/api";
import { mapVehicleResponseToVehicle } from "@/api/mappers/vehicle.mapper";
import type { Vehicle } from "@/components/dashboard/vehicle.types";
import type { CreateVehiclePayload } from "@/types";

export const useVehicleStore = defineStore("vehicle", () => {
  const vehicles = ref<Vehicle[]>([]);
  const completedVehicles = ref<Vehicle[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchVehicles(ownerId: string) {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await vehicleApi.getVehicleStatus(ownerId);
      const mapped = response.map(mapVehicleResponseToVehicle);

      vehicles.value = mapped.filter((v) => !v.completed);
      completedVehicles.value = mapped.filter((v) => v.completed);
    } catch (err) {
      console.error("Failed to fetch vehicles:", err);
      error.value = "Fehler beim Laden der Fahrzeuge";
    } finally {
      isLoading.value = false;
    }
  }

  async function addVehicle(payload: CreateVehiclePayload) {
    isLoading.value = true;
    error.value = null;
    try {
     const response =  await vehicleApi.createVehicle(payload);
     console.log("response",response);
    } catch (err) {
      console.error("Failed to add vehicle:", err);
      error.value = "Fehler beim Hinzufügen des Fahrzeugs";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    vehicles,
    completedVehicles,
    isLoading,
    error,
    fetchVehicles,
    addVehicle,
  };
});
