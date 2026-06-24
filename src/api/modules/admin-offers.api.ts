import { post, get } from "../client/request";
import type { OffersListResponse } from "@/types";

interface CreateOfferDraftPayload {
  repair_cost_net: string;
  repair_cost_gross: string;
  depreciation_value_net: string;
  depreciation_value_gross: string;
  workshop_repair_quote_net: string;
  workshop_repair_quote_gross: string;
  missing_parts_cost_net: string;
  missing_parts_cost_gross: string;
  additional_notes: string;
}

export const adminOffersApi = {
  createDraft(
    auftragsnummer: string,
    payload: CreateOfferDraftPayload,
  ): Promise<unknown> {
    return post(
      `/admin/offers/create/${encodeURIComponent(auftragsnummer)}`,
      payload,
    );
  },

  list(auftragsnummer: string): Promise<OffersListResponse> {
    return get<OffersListResponse>(
      `/admin/offers/list/${encodeURIComponent(auftragsnummer)}`,
    );
  },
};
