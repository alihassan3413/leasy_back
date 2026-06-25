import { get } from "../client/request";
import type { AdminSummaryResponse } from "@/types";

export const adminDashboardApi = {
  getSummary(): Promise<AdminSummaryResponse> {
    return get<AdminSummaryResponse>("/admin/dashboard/summary");
  },
};
