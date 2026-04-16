import { post } from "../client/request";

import type { B2BCreateComapnyPayload , B2BCreateResponse } from "@/types";


export const b2bApi = {
    create(payload: B2BCreateComapnyPayload) {
        return post<B2BCreateResponse, B2BCreateComapnyPayload>("/b2b/create", payload)
    }
}