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

type Status = "idle" | "loading" | "success" | "error";

export const useB2BStore = defineStore("b2b", () => {
  const status = ref<Status>("idle");
  const error = ref("");
  const profile = ref<B2BProfile | null>(null);
  const createResult = ref<B2BCreateResponse | null>(null);

  const logoUrl = ref("");
  const logoKey = ref("");
  let logoRefreshTimer: ReturnType<typeof setTimeout> | null = null

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

  function scheduleLogoRefresh(expiresInSeconds = 10800) {
  if (logoRefreshTimer) {
    clearTimeout(logoRefreshTimer);
  }

  const refreshBeforeExpiry = Math.max((expiresInSeconds - 300) * 1000, 1000);

  logoRefreshTimer = setTimeout(() => {
    refreshLogoSignedUrl();
  }, refreshBeforeExpiry);
}

async function refreshLogoSignedUrl() {
  if (!logoKey.value) return;

  try {
    const res = await b2bApi.getLogoSignedUrl(logoKey.value);

    logoUrl.value = res.signed_url;

    scheduleLogoRefresh(res.expires_in_seconds);
  } catch (err) {
    const apiError = normalizeApiError(err);
    error.value = apiError.message;
  }
}

  async function uploadLogo(file: File) {
    status.value = "loading";
    error.value = "";
    try {
      const res = await b2bApi.uploadLogo(file);

      // const uploadedLogoUrl = res.signed_url;
      logoKey.value = res.key;

      logoUrl.value = res.signed_url;

      scheduleLogoRefresh(res.expires_in_seconds);

      // return uploadedLogoUrl;
      status.value = "success";
      return res.key;
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
      if (res.logo_url){
        logoKey.value = res.logo_url;
        await refreshLogoSignedUrl();
      }
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
    uploadLogo,
    logoUrl,
    logoKey,
    refreshLogoSignedUrl,
  };
});
