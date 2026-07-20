// Derive the inspection provider label (tuvsud / dekra) for an order.
//
// The backend's `leasyback_partner` isn't reliable — DEKRA orders can still come
// back labelled "tuvsud". The station the user actually picked is stored in the
// order (`request_payload.besichtigungsort.name`), and its name always reflects
// the real provider: DEKRA stations are named "DEKRA ...", TÜV SÜD stations
// "TÜV SÜD ...". We derive the provider from that name and only fall back to
// `leasyback_partner` when the station name is missing/ambiguous.
export function orderProviderLabel(order: any): string {
  const name = (order?.request_payload?.besichtigungsort?.name ?? "").toLowerCase();
  if (name.includes("dekra")) return "dekra";
  if (name.includes("tüv") || name.includes("tuv")) return "tuvsud";
  return (order?.leasyback_partner ?? "").toString().trim().toLowerCase();
}
