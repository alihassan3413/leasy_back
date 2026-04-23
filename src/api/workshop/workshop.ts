import { post } from "../client/request";
import type { WorkshopCreatePayload, WorkshopCreateResponse } from "@/types";

export const workshopApi = {
    create(payload: WorkshopCreatePayload) {
        return post<WorkshopCreateResponse, WorkshopCreatePayload>("/workshop/create", payload)
    }
}
