import { get, post } from "../client/request";

export const customerOffersApi = {
  list(auftragsnummer: string): Promise<unknown> {
    return get(`/vehicle/customer/list/${encodeURIComponent(auftragsnummer)}`);
  },

  select(offerId: string): Promise<unknown> {
    return post(`/vehicle/customer/list/${encodeURIComponent(offerId)}`);
  },
};
