<<<<<<< HEAD
import { defineStore } from "pinia";
import { ref } from "vue";
import { normalizeApiError } from "@/api/client/error";
import { b2bApi } from "@/api/b2b/b2b";
import { useAuthStore } from "@/stores/auth.store";
import type {
  B2BCreateComapnyPayload,
  B2BCreateResponse,
  B2BProfile,
  B2BProfileUpdatePayload,
} from "@/types";
=======
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { normalizeApiError } from '@/api/client/error'
import type { B2BCreateComapnyPayload, B2BCreateResponse } from '@/types'
import { b2bApi } from '@/api/b2b/b2b'
>>>>>>> 48f52ed9f72f5e70ba9370c80a85f526e2accf41

type Status = "idle" | "loading" | "success" | "error";

export const useB2BStore = defineStore("b2b", () => {
  const status = ref<Status>("idle");
  const error = ref("");
  const profile = ref<B2BProfile | null>(null);
  const createResult = ref<B2BCreateResponse | null>(null);

  async function create(payload: B2BCreateComapnyPayload) {
    status.value = "loading";
    error.value = "";
    try {
      const res = await b2bApi.create(payload);
      createResult.value = res;
      status.value = "success";
      return res;
    } catch (err) {
      const apiError = normalizeApiError(err);
      error.value = apiError.message;
      status.value = "error";
      throw err;
    }
  }

  async function fetchProfile() {
    const auth = useAuthStore();
    const userId = auth.user?.id;
    if (!userId) return;

    status.value = "loading";
    error.value = "";
    try {
      const res = await b2bApi.getProfile(userId);
      profile.value = res;
      status.value = "success";
      return res;
    } catch (err) {
      const apiError = normalizeApiError(err);
      error.value = apiError.message;
      status.value = "error";
      throw err;
    }
  }

  async function updateProfile(b2bId: string, payload: B2BProfileUpdatePayload) {
    status.value = "loading";
    error.value = "";
    try {
      await b2bApi.updateProfile(b2bId, payload);
      // PATCH returns a plain string, not the updated profile — re-fetch.
      await fetchProfile();
    } catch (err) {
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
    createResult,
    create,
    fetchProfile,
    updateProfile,
  };
});
