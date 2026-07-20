import { get, post } from "../client/request";
import type { AdminOrderListResponse } from "@/types";

// Fields the backend accepts for `sort_by`. Add more here as the API grows.
export type AdminOrderSortBy = "license_plate";
export type SortOrder = "asc" | "desc";

// Body for `POST /admin/vehicle/report/transfer` — copies a TÜV SÜD document
// already synced into AWS (an `assessment_documents` entry from the order)
// into the vehicle's regular report document repository.
export interface TransferAssessmentDocumentPayload {
  auftragsnummer: string;
  vehicle_id: string;
  document_type?: string;
  document_title?: string;
  source_s3_url: string;
  published?: boolean;
  source_assessment_document_id?: number;
}

// Builds the optional `&sort_by=…&sort_order=…` suffix. Sorting is handled by
// the backend; omitting both params falls back to the API's default order.
function sortParams(sort_by?: AdminOrderSortBy, sort_order?: SortOrder): string {
  if (!sort_by) return "";
  const order = sort_order === "desc" ? "desc" : "asc";
  return `&sort_by=${encodeURIComponent(sort_by)}&sort_order=${order}`;
}

export const adminOrdersApi = {
  listAll(
    page = 1,
    limit = 50,
    order_status?: string,
    sort_by?: AdminOrderSortBy,
    sort_order?: SortOrder,
  ): Promise<AdminOrderListResponse> {
    const statusParam = order_status ? `&order_status=${encodeURIComponent(order_status)}` : "";
    return get<AdminOrderListResponse>(
      `/admin/list/orders?page=${page}&limit=${limit}${statusParam}${sortParams(sort_by, sort_order)}`,
    );
  },

  listByUserType(
    user_type: "Firmenkunde" | "Privatkunde",
    page = 1,
    limit = 50,
    order_status?: string,
    sort_by?: AdminOrderSortBy,
    sort_order?: SortOrder,
  ): Promise<AdminOrderListResponse> {
    const statusParam = order_status ? `&order_status=${encodeURIComponent(order_status)}` : "";
    return get<AdminOrderListResponse>(
      `/admin/list/orders/by-user-type?user_type=${encodeURIComponent(user_type)}&page=${page}&limit=${limit}${statusParam}${sortParams(sort_by, sort_order)}`,
    );
  },

  listByUser(userId: string, page = 1, limit = 10): Promise<AdminOrderListResponse> {
    return get<AdminOrderListResponse>(
      `/admin/list/orders/user/${encodeURIComponent(userId)}?page=${page}&limit=${limit}`,
    );
  },

  approveOrder(provider: "tuvsud" | "dekra", orderId: string): Promise<unknown> {
    return post(`/order/${provider}/order/approve/${orderId}`);
  },

  // Single status endpoint for BOTH TÜV SÜD and DEKRA orders — the backend
  // routes on the auftragsnummer, so the provider segment is always "tuvsud".
  updateOrderStatus(auftragsnummer: string, orderStatus: string): Promise<unknown> {
    return get(
      `/order/tuvsud/status?auftragsnummer=${encodeURIComponent(auftragsnummer)}&order_status=${encodeURIComponent(orderStatus)}`,
    );
  },

  confirmOrder(auftragsnummer: string): Promise<unknown> {
    return post(
      `/order/others/confirm?auftragsnummer=${encodeURIComponent(auftragsnummer)}`,
      undefined,
      {
        headers: {
          "x-api-key": "tuvsud_confirmation",
        },
      },
    );
  },

  // Sync the TÜV SÜD appraisal (Gutachten) XML for an order and return the
  // latest third-party document status. `appraisalNumber` is the order's
  // `response_body` value from the order listing. Admin-only.
  syncAppraisalXml(appraisalNumber: number | string): Promise<unknown> {
    return post(`/tim/appraisal/xml/sync/${encodeURIComponent(String(appraisalNumber))}`);
  },

  // Copies a TÜV SÜD document (an `assessment_documents` entry produced by
  // syncAppraisalXml) into the vehicle's regular report document repository.
  transferAssessmentDocument(payload: TransferAssessmentDocumentPayload): Promise<unknown> {
    return post(`/admin/vehicle/report/transfer`, payload);
  },
};
