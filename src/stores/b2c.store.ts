import { defineStore } from "pinia";
import { ref } from "vue";
import { b2cApi } from "@/api";
import { normalizeApiError } from "@/api/client/error";
import type { B2CUserProfileResponse, B2CProfileUpdatePayload } from "@/types";

type Status = "idle" | "loading" | "success" | "error";

export const useB2CStore = defineStore("b2c", () => {
  const status = ref<Status>("idle");
  const error = ref("");
  const profile = ref<B2CUserProfileResponse | null>(null);

  async function fetchProfile() {
    status.value = "loading";
    error.value = "";

    try {
      const res = await b2cApi.getProfile();

      const responseData = (res as any)?.data ?? res;

      profile.value = responseData?.data ?? responseData;

      status.value = "success";
      return profile.value;
    } catch (err: any) {
      // If it's a 404, that means the profile doesn't exist yet - that's okay
      if (err.status === 404 || (err.response && err.response.status === 404)) {
        profile.value = null;
        status.value = "idle"; // Or "success" with null profile
        return null;
      }
      const apiError = normalizeApiError(err);
      error.value = apiError.message;
      status.value = "error";
      // Don't rethrow 404 errors, only other errors
      if (
        !(err.status === 404 || (err.response && err.response.status === 404))
      ) {
        throw err;
      }
    }
  }

  async function updateProfile(payload: B2CProfileUpdatePayload) {
    status.value = "loading";
    error.value = "";

    try {
      const res = await b2cApi.updateProfile(payload);
      // Refresh profile after update
      await fetchProfile();
      status.value = "success";
      return res;
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
    fetchProfile,
    updateProfile,
  };
});
