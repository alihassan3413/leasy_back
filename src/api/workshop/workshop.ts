import { post, get, patch } from "../client/request";
import type {
  WorkshopCreatePayload,
  WorkshopCreateResponse,
  WorkshopResponse,
  WorkshopUpdatePayload,
} from "@/types";

export const workshopApi = {
  create(payload: WorkshopCreatePayload) {
    return post<WorkshopCreateResponse, WorkshopCreatePayload>(
      "/workshop/create",
      payload,
    );
  },
  getByUserId(userId: string) {
    return get<WorkshopResponse>(`/workshop/user_id/${userId}`);
  },
  update(workshopId: string, payload: WorkshopUpdatePayload) {
    return patch<string, WorkshopUpdatePayload>(
      `/workshop/${workshopId}`,
      payload,
    );
  },
};
