import { get, post } from "../client/request";
import type { OffersListResponse } from "@/types";

export const customerOffersApi = {
  // GET /vehicle/offers/customer/list/{auftragsnummer}
  // Lists the published (and selected) offers visible to the B2B/B2C customer.
  list(auftragsnummer: string): Promise<OffersListResponse> {
    return get<OffersListResponse>(
      `/vehicle/offers/customer/list/${encodeURIComponent(auftragsnummer)}`,
    );
  },

  // POST /vehicle/offers/customer/select/{offer_id}
  // Selects an offer. Only B2B/B2C customers select; admins only publish.
  select(offerId: string): Promise<unknown> {
    return post(`/vehicle/offers/customer/select/${encodeURIComponent(offerId)}`);
  },
};
