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
    // #region agent log
    fetch('http://127.0.0.1:7789/ingest/20fcbaf2-2fcc-4c7e-9f59-1c2f1ddbfb14',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9aab7e'},body:JSON.stringify({sessionId:'9aab7e',location:'b2b.store.ts:fetchProfile-entry',message:'fetchProfile called',data:{userId,userRole:auth.user?.role,companyId:auth.user?.companyId,hasUser:!!auth.user,fullUser:auth.user},timestamp:Date.now(),hypothesisId:'H-A,H-C'})}).catch(()=>{});
    // #endregion
    if (!userId) {
      // #region agent log
      fetch('http://127.0.0.1:7789/ingest/20fcbaf2-2fcc-4c7e-9f59-1c2f1ddbfb14',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9aab7e'},body:JSON.stringify({sessionId:'9aab7e',location:'b2b.store.ts:fetchProfile-bail',message:'fetchProfile bailed: no userId',data:{auth:auth.user},timestamp:Date.now(),hypothesisId:'H-A'})}).catch(()=>{});
      // #endregion
      return;
    }

    status.value = "loading";
    error.value = "";
    try {
      // #region agent log
      fetch('http://127.0.0.1:7789/ingest/20fcbaf2-2fcc-4c7e-9f59-1c2f1ddbfb14',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9aab7e'},body:JSON.stringify({sessionId:'9aab7e',location:'b2b.store.ts:fetchProfile-calling-api',message:'Calling b2bApi.getProfile',data:{url:`/b2b/user_id/${userId}`,userId},timestamp:Date.now(),hypothesisId:'H-B,H-C'})}).catch(()=>{});
      // #endregion
      const res = await b2bApi.getProfile(userId);
      // #region agent log
      fetch('http://127.0.0.1:7789/ingest/20fcbaf2-2fcc-4c7e-9f59-1c2f1ddbfb14',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9aab7e'},body:JSON.stringify({sessionId:'9aab7e',location:'b2b.store.ts:fetchProfile-success',message:'getProfile succeeded',data:{b2bId:(res as any)?.b2b,company_name:(res as any)?.company_name,contact_email:(res as any)?.contact_email},timestamp:Date.now(),hypothesisId:'H-B,H-D'})}).catch(()=>{});
      // #endregion
      profile.value = res;
      if (res.logo_url){
        logoKey.value = res.logo_url;
        await refreshLogoSignedUrl();
      }
      status.value = "success";
      return res;
    } catch (err) {
      const apiError = normalizeApiError(err);
      // #region agent log
      fetch('http://127.0.0.1:7789/ingest/20fcbaf2-2fcc-4c7e-9f59-1c2f1ddbfb14',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9aab7e'},body:JSON.stringify({sessionId:'9aab7e',location:'b2b.store.ts:fetchProfile-error',message:'getProfile failed',data:{status:(apiError as any)?.status,message:apiError.message,userId,url:`/b2b/user_id/${userId}`,runId:'post-fix'},timestamp:Date.now(),hypothesisId:'H-B,H-C,H-D'})}).catch(()=>{});
      // #endregion
      if ((apiError as any).status === 404) {
        // No company profile exists yet for this user — not a fatal error,
        // just an unregistered B2B account. Show the page in empty state.
        profile.value = null;
        status.value = "success";
        return null;
      }
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

  async function deleteLogo(logoKeyToDelete?: string) {
  const key = logoKeyToDelete || logoKey.value || profile.value?.logo_url;

  if (!key) return;

  status.value = "loading";
  error.value = "";

  try {
    await b2bApi.deleteLogo(key);

    logoUrl.value = "";
    logoKey.value = "";

    if (profile.value) {
      profile.value.logo_url = "";
    }

    status.value = "success";
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
    deleteLogo,
    logoUrl,
    logoKey,
    refreshLogoSignedUrl,
  };
});
