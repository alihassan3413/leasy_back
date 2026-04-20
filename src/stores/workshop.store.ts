import { defineStore } from 'pinia'
import { normalizeApiError } from '@/api/client/error'
import type {WorkshopCreatePayload,WorkshopCreateResponse, WorkshopResponse,WorkshopUpdatePayload} from '@/types'
import { workshopApi } from '@/api/workshop/workshop'
import { ref } from 'vue'

type Status = 'idle' | 'loading' | 'success' | 'error'

export const useWorkshopStore = defineStore('workshop', () => {
  const status = ref<Status>('idle')
  const error = ref('')
  const profile = ref<WorkshopCreateResponse | null>(null)

  async function create(payload: WorkshopCreatePayload) {
    status.value = 'loading'
    error.value = ''

    try {
      const res = await workshopApi.create(payload);
      // Note: We might want to fetch the full profile after creation
      status.value = "success";
      return res;
    } catch (err) {
      const apiError = normalizeApiError(err);
      error.value = apiError.message;
      status.value = "error";
      throw err;
    }
  }

  async function fetchWorkshop(userId: string) {
    status.value = "loading";
    error.value = "";

    try {
      console.log("Store: Fetching workshop for userId:", userId);
      const res = await workshopApi.getByUserId(userId);
      console.log("Store: API Response received:", res);

      // Check if response is wrapped in { ok, data, message }
      if (res && (res as any).ok && (res as any).data) {
        console.log("Store: Detected wrapped response, extracting data");
        profile.value = (res as any).data;
      } else {
        profile.value = res;
      }

      console.log("Store: Profile updated to:", profile.value);
      status.value = "success";
      return res;
    } catch (err) {
      console.error("Store: Error fetching workshop:", err);
      const apiError = normalizeApiError(err);
      error.value = apiError.message;
      status.value = "error";
      throw err;
    }
  }

  async function updateWorkshop(
    workshopId: string,
    payload: WorkshopUpdatePayload,
  ) {
    status.value = "loading";
    error.value = "";

    try {
      console.log("Store: Updating workshop:", workshopId, payload);
      const res = await workshopApi.update(workshopId, payload);
      console.log("Store: Update response:", res);

      // Optionally re-fetch to ensure local state is in sync
      if (profile.value?.workshop_id === workshopId) {
        // If we updated the currently loaded profile, maybe just update it locally or re-fetch
        // For simplicity, let's assume we might need a refresh later or the component handles it.
        // Or we can merge it:
        // profile.value = { ...profile.value, ...res_data_if_any }
      }

      status.value = "success";
      return res;
    } catch (err) {
      console.error("Store: Error updating workshop:", err);
      const apiError = normalizeApiError(err);
      error.value = apiError.message;
      status.value = "error";
      throw err;
    }
  }

  return {
    status,
    error,
    profile,
    create,
    fetchWorkshop,
    updateWorkshop,
  };
});
