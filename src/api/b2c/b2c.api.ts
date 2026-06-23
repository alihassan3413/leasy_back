import { get, post, put } from "../client/request";
import type {
  B2CProfileCreatePayload,
  B2CProfileCreateResponse,
  B2CUserProfileResponse,
  B2CProfileUpdatePayload,
  B2CProfileUpdateResponse,
} from "@/types";

export const b2cApi = {
  getProfile(): Promise<B2CUserProfileResponse> {
    return get<B2CUserProfileResponse>("/userprofile/user-profile");
  },
  createProfile(
    payload: B2CProfileCreatePayload,
  ): Promise<B2CProfileCreateResponse> {
    return post<B2CProfileCreateResponse, B2CProfileCreatePayload>(
      "/userprofile/address-contact",
      payload,
    );
  },
  updateProfile(
    payload: B2CProfileUpdatePayload,
  ): Promise<B2CProfileUpdateResponse> {
    return put<B2CProfileUpdateResponse, B2CProfileUpdatePayload>(
      "/userprofile/address-contact",
      payload,
    );
  },
};
