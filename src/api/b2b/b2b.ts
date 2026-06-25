import { get, post, patch, del } from "../client/request";
import type {
  B2BCreateComapnyPayload,
  B2BCreateResponse,
  B2BLogoUploadResponse,
  B2BProfile,
  B2BProfileUpdatePayload,
} from "@/types";

export const b2bApi = {
  create(payload: B2BCreateComapnyPayload) {
    return post<B2BCreateResponse, B2BCreateComapnyPayload>("/b2b/create", payload);
  },

  uploadLogo(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return post<B2BLogoUploadResponse, FormData>("/image/logos/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  getLogoSignedUrl(logokey: string) {
    return get<B2BLogoUploadResponse>(`/image/logos/${logokey}/signed-url`);
  },

  getProfile(userId: string) {
    return get<B2BProfile>(`/b2b/user_id/${userId}`);
  },

  deleteLogo(logokey: string) {
    return del<string>(`/image/logos/${logokey}`);
  },
  updateProfile(b2bId: string, payload: B2BProfileUpdatePayload) {
    return patch<string, B2BProfileUpdatePayload>(`/b2b/${b2bId}`, payload);
  },
};
