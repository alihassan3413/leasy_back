import { get, post } from "../client/request";
import type {
  B2CProfileCreatePayload,
  B2CProfileCreateResponse,
  B2CUserProfileResponse,
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
};
