import { get, post, patch } from "../client/request";
import type {
  B2BCreateComapnyPayload,
  B2BCreateResponse,
  B2BProfile,
  B2BProfileUpdatePayload,
} from "@/types";

export const b2bApi = {
  create(payload: B2BCreateComapnyPayload) {
    return post<B2BCreateResponse, B2BCreateComapnyPayload>(
      "/b2b/create",
      payload,
    );
  },

  getProfile(userId: string) {
    return get<B2BProfile>(`/b2b/user_id/${userId}`);
  },

  updateProfile(b2bId: string, payload: B2BProfileUpdatePayload) {
    return patch<string, B2BProfileUpdatePayload>(`/b2b/${b2bId}`, payload);
  },
};
