import { defineStore } from "pinia";
import { ref } from "vue";
import { vehicleApi } from "@/api";
import { mapVehicleResponseToVehicle } from "@/api/mappers/vehicle.mapper";
import type { Vehicle } from "@/components/dashboard/vehicle.types";
import type { CreateVehiclePayload } from "@/types";
import { useAuthStore } from "./auth.store";

export const useB2BVehicleStore = defineStore("b2bVehicle", () => {
  const vehicles = ref<Vehicle[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchVehicles(_ownerId?: string) {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await vehicleApi.getB2BVehicleStatus();
      const mapped = response.map(mapVehicleResponseToVehicle);

      vehicles.value = mapped.filter((v) => !v.completed);
    } catch (err) {
      console.error("Failed to fetch B2B vehicles:", err);
      error.value = "Fehler beim Laden der Fahrzeuge";
    } finally {
      isLoading.value = false;
    }
  }

  async function addVehicle(payload: CreateVehiclePayload) {
    isLoading.value = true;
    error.value = null;
    try {
      await vehicleApi.createVehicle(payload);

      // Refresh list using owner ID (user ID) from auth store
      const authStore = useAuthStore();
      if (authStore.user?.id) {
        await fetchVehicles(authStore.user.id);
      }
    } catch (err) {
      console.error("Failed to add B2B vehicle:", err);
      error.value = "Fehler beim Hinzufügen des Fahrzeugs";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    vehicles,
    isLoading,
    error,
    fetchVehicles,
    addVehicle,
  };
});
