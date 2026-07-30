/**
 * Customer-facing (B2C / B2B) timeline stage mapper — 8-stage flow per the
 * confirmed spec. Scope: produces the customer-facing German wording +
 * completed/current/future state for a confirmed subset of order/offer
 * states. Backend status values, Admin filters/dropdowns/badges/APIs, and
 * status-update logic are untouched — see `./status.ts` for those.
 */

/** The 8 stages of the customer-facing flow, in display order. */
export type CustomerOrderStage =
  | "requested"
  | "appointment_confirmed"
  | "inspection_completed"
  | "offers_published"
  | "offer_approved"
  | "in_repair"
  | "followup_completed"
  | "vehicle_ready";

export const CUSTOMER_ORDER_STAGE_SEQUENCE: readonly CustomerOrderStage[] = [
  "requested",
  "appointment_confirmed",
  "inspection_completed",
  "offers_published",
  "offer_approved",
  "in_repair",
  "followup_completed",
  "vehicle_ready",
];

/**
 * `vehicle_ready` (stage 8) requires a confirmed successful payment, which
 * has no backend signal today (no Stripe/payment integration exists in this
 * codebase). It may therefore only ever render as a future step — never
 * `completed` or `isCurrent` — regardless of `order_status`.
 */
const PAYMENT_GATED_STAGE: CustomerOrderStage = "vehicle_ready";

/**
 * Whether the payment action inside stage 7 ("Nachgutachten abgeschlossen")
 * should be clickable. Flip this to `true` once Stripe/payment confirmation
 * is wired up on the backend — the step already carries `showPaymentAction`
 * so the UI is prepared, just gated off until then.
 */
export const CUSTOMER_PAYMENT_FEATURE_ENABLED = false;

export interface CustomerOrderFlowStep {
  stage: CustomerOrderStage;
  /** Full row text — may include an inline appointment date/time (stage 1/2). */
  label: string;
  /** Short label with no embedded date, for use as a page/card headline. */
  shortLabel: string;
  /** Fixed/derived helper sentence(s) shown under the label; "\n"-joined when multi-line. */
  subtitle: string;
  /** German help text for the `StatusHelpTooltip` next to the label. */
  tooltipDescription: string;
  /** ISO date string from a real event, or "" if none exists (never invented). */
  datetime: string;
  completed: boolean;
  isCurrent: boolean;
  isNext: boolean;
  isCancelled: boolean;
  isRejected: boolean;
  /** Existing report (Gutachten/Nachgutachten) download/open action, when the document exists. */
  reportDocUrl?: string;
  /** Existing invoice (Rechnung) view/download action, when the document exists. */
  invoiceDocUrl?: string;
  /** Whether this row has a (currently hidden/disabled) payment action slot. */
  showPaymentAction?: boolean;
}

// ─────────────────────────────────────────────
// Input shapes — deliberately narrow/duck-typed so both the B2C (`vehicle.
// orders`) and B2B (`latestOrder`) call sites can pass their existing data
// without reshaping it.
// ─────────────────────────────────────────────

export interface CustomerOrderStatusHistoryEntry {
  new_status: string;
  old_status?: string | null;
  created_at: string;
}

export interface CustomerOrderBesichtigungsort {
  name?: string;
  strasse?: string;
  plz?: string;
  ort?: string;
  land?: string;
  termin?: string;
}

export interface CustomerOrderReportDocument {
  document_type?: string;
  document_title?: string;
  created_at?: string;
  s3_url?: string;
  s3_bucket?: string;
  s3_key?: string;
}

export interface CustomerOrderOffer {
  offer_status: string;
  published_at?: string | null;
  selected_at?: string | null;
  offer_sequence?: number;
  additional_notes?: string | null;
}

export interface CustomerOrderFlowInput {
  orderStatus: string | null | undefined;
  orderCreatedAt: string | null | undefined;
  statusHistory: ReadonlyArray<CustomerOrderStatusHistoryEntry>;
  besichtigungsort?: CustomerOrderBesichtigungsort | null;
  reportDocuments?: ReadonlyArray<CustomerOrderReportDocument>;
  offers?: ReadonlyArray<CustomerOrderOffer>;
}

// ─────────────────────────────────────────────
// Date / doc helpers
// ─────────────────────────────────────────────

/** "DD.MM.YYYY · HH:mm Uhr", matching the format already used elsewhere in these views. */
export function formatGermanDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return (
    d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) +
    " Uhr"
  );
}

function findHistoryDate(
  history: ReadonlyArray<CustomerOrderStatusHistoryEntry>,
  statuses: ReadonlySet<string>,
  preferredStatus?: string,
): string {
  if (preferredStatus) {
    const preferred = history.find((e) => e.new_status === preferredStatus);
    if (preferred) return preferred.created_at;
  }
  return history.find((e) => statuses.has(e.new_status))?.created_at ?? "";
}

/** Backend sends an s3:// URI for report/invoice docs — convert it to an https URL. */
function resolveDocUrl(doc: CustomerOrderReportDocument): string {
  const cleanS3Url = doc.s3_url?.trim().replace(/^`|`$/g, "");
  if (cleanS3Url) return cleanS3Url.replace(/^s3:\/\/([^/]+)\//, "https://$1.s3.amazonaws.com/");
  if (doc.s3_bucket && doc.s3_key) return `https://${doc.s3_bucket}.s3.amazonaws.com/${doc.s3_key}`;
  return "";
}

function normalizeDocKind(doc: CustomerOrderReportDocument): string {
  const type = (doc.document_type ?? "").trim().toLowerCase();
  if (type) return type;
  const title = (doc.document_title ?? "").toLowerCase();
  if (title.includes("nachgutachten")) return "nachgutachten";
  if (title.includes("gutachten")) return "gutachten";
  if (title.includes("rechnung")) return "rechnung";
  return "";
}

/** Most recent document of the given kind ("gutachten" / "nachgutachten" / "rechnung"), or `null`. */
function findLatestDoc(
  docs: ReadonlyArray<CustomerOrderReportDocument>,
  kind: string,
): CustomerOrderReportDocument | null {
  const matches = docs.filter((d) => normalizeDocKind(d) === kind && d.created_at);
  if (matches.length === 0) return null;
  return matches.reduce((latest, d) =>
    new Date(d.created_at!).getTime() > new Date(latest.created_at!).getTime() ? d : latest,
  );
}

/** Selected offer outranks a merely published one; among ties, the most recent wins. */
function pickRelevantOffer(offers: ReadonlyArray<CustomerOrderOffer>): CustomerOrderOffer | null {
  const byDateDesc = (a: CustomerOrderOffer, b: CustomerOrderOffer, key: "selected_at" | "published_at") =>
    new Date(b[key] ?? 0).getTime() - new Date(a[key] ?? 0).getTime();

  const selected = offers.filter((o) => o.offer_status === "selected");
  if (selected.length > 0) return [...selected].sort((a, b) => byDateDesc(a, b, "selected_at"))[0];

  const published = offers.filter((o) => o.offer_status === "published");
  if (published.length > 0) return [...published].sort((a, b) => byDateDesc(a, b, "published_at"))[0];

  return null;
}

// ─────────────────────────────────────────────
// Stage content (label / subtitle / tooltip)
// ─────────────────────────────────────────────

function appointmentDateLabel(prefix: string, termin: string | undefined): string {
  const datePart = termin ? formatGermanDateTime(termin) : "";
  return datePart ? `${prefix} ${datePart}` : prefix;
}

function appointmentDetailsSubtitle(b: CustomerOrderBesichtigungsort | null | undefined): string {
  if (!b) return "";
  const address = [b.strasse, `${b.plz ?? ""} ${b.ort ?? ""}`.trim()].filter(Boolean).join(", ");
  return [b.name, address].filter(Boolean).join("\n");
}

function offerApprovedSubtitle(offer: CustomerOrderOffer | null): string {
  if (!offer) return "Ihr ausgewähltes Angebot wird nun vorbereitet.";
  const ref = offer.offer_sequence
    ? `Angebot ${String(offer.offer_sequence).padStart(2, "0")}`
    : "Ihr Angebot";
  const note = offer.additional_notes?.trim();
  return note ? `${ref} – ${note}` : `${ref} wurde ausgewählt.`;
}

const STAGE_SHORT_LABEL: Record<CustomerOrderStage, string> = {
  requested: "Wunschtermin angefragt",
  appointment_confirmed: "Wunschtermin bestätigt",
  inspection_completed: "Erstbegutachtung abgeschlossen",
  offers_published: "Reparaturangebote zur Freigabe",
  offer_approved: "Angebotsfreigabe erteilt",
  in_repair: "In Reparaturphase",
  followup_completed: "Nachgutachten abgeschlossen",
  vehicle_ready: "Fahrzeug abholbereit",
};

const STAGE_TOOLTIP: Record<CustomerOrderStage, string> = {
  requested:
    "Sie haben einen Wunschtermin zur Erstbegutachtung Ihres Fahrzeugs angefragt.",
  appointment_confirmed:
    "Der Termin zur Erstbegutachtung wurde von der Partnerwerkstatt/dem Gutachter bestätigt.",
  inspection_completed:
    "Die Erstbegutachtung wurde durchgeführt und das Gutachten steht zum Einsehen bereit.",
  offers_published:
    "Ein oder mehrere Reparaturangebote liegen vor und können von Ihnen freigegeben werden.",
  offer_approved:
    "Sie haben ein Reparaturangebot freigegeben. Die Reparatur wird nun vorbereitet.",
  in_repair:
    "Ihr Fahrzeug befindet sich aktuell in der Reparatur bei der Partnerwerkstatt.",
  followup_completed:
    "Die Nachbegutachtung nach der Reparatur wurde abgeschlossen. Gutachten und Rechnung stehen bereit.",
  vehicle_ready:
    "Ihr Fahrzeug ist zur Abholung bereit, sobald die Zahlung bestätigt wurde.",
};

// ─────────────────────────────────────────────
// Progress resolution
// ─────────────────────────────────────────────

const KNOWN_EARLY_STATUSES = new Set(["order_requested", "order_placed"]);
const REPAIR_PHASE_STATUSES = new Set(["workshop", "reinspection", "reworkshop"]);
// `discarded` is intentionally NOT here: there is no backend confirmation
// that it specifically means "appointment rejected" (or anything else customer-
// facing) — it falls through to `null` below and uses the legacy fallback
// display until a dedicated signal exists.
const TERMINAL_STATUSES = new Set(["cancelled"]);

/**
 * Resolves the 0-based index (within `CUSTOMER_ORDER_STAGE_SEQUENCE`, stages
 * 1-7 only — `vehicle_ready` is never resolved as "current", see
 * `PAYMENT_GATED_STAGE`) implied by a given order/offer/report-document
 * state. Returns `null` for anything not explicitly listed below — including
 * a blank/unknown `order_status`, and `delivered`/`completed` when no real
 * follow-up-report document exists — callers must treat `null` as "unmapped",
 * falling back to the legacy display rather than fabricating progress.
 */
function resolveProgressIndex(
  status: string,
  relevantOffer: CustomerOrderOffer | null,
  hasFollowupReport: boolean,
): number | null {
  // Stage 7 requires a real Nachgutachten document (or another explicit,
  // reliable backend event) — `delivered`/`completed` alone must never imply
  // the follow-up inspection happened; that's fabrication when no such
  // document exists. Orders that reach delivered/completed without one keep
  // falling through to `null` (legacy fallback) below.
  if (hasFollowupReport) return 6;
  if (REPAIR_PHASE_STATUSES.has(status)) return 5;
  if (relevantOffer?.offer_status === "selected") return 4;
  if (relevantOffer?.offer_status === "published") return 3;
  if (status === "inspected") return 2;
  if (status === "confirmed") return 1;
  // Stage 1 only resolves from an explicit, reliable request signal —
  // never as a generic "anything else" fallback.
  if (KNOWN_EARLY_STATUSES.has(status)) return 0;
  return null;
}

function getStageDate(
  stage: CustomerOrderStage,
  ctx: CustomerOrderFlowInput,
  relevantOffer: CustomerOrderOffer | null,
  gutachtenDoc: CustomerOrderReportDocument | null,
  nachgutachtenDoc: CustomerOrderReportDocument | null,
): string {
  const status = (ctx.orderStatus ?? "").trim();
  switch (stage) {
    case "requested":
      return ctx.orderCreatedAt ?? "";
    case "appointment_confirmed":
      return findHistoryDate(ctx.statusHistory, new Set(["confirmed"]));
    case "inspection_completed":
      return gutachtenDoc?.created_at ?? findHistoryDate(ctx.statusHistory, new Set(["inspected"]));
    case "offers_published":
      return relevantOffer?.published_at ?? "";
    case "offer_approved":
      return relevantOffer?.selected_at ?? "";
    case "in_repair":
      return findHistoryDate(ctx.statusHistory, REPAIR_PHASE_STATUSES, status);
    case "followup_completed":
      return (
        nachgutachtenDoc?.created_at ??
        findHistoryDate(ctx.statusHistory, new Set(["delivered", "completed"]), status)
      );
    case "vehicle_ready":
      return "";
  }
}

function buildStep(
  stage: CustomerOrderStage,
  ctx: CustomerOrderFlowInput,
  relevantOffer: CustomerOrderOffer | null,
  gutachtenDoc: CustomerOrderReportDocument | null,
  nachgutachtenDoc: CustomerOrderReportDocument | null,
  rechnungDoc: CustomerOrderReportDocument | null,
  state: {
    datetime: string;
    completed: boolean;
    isCurrent: boolean;
    isNext: boolean;
    isCancelled: boolean;
    isRejected: boolean;
  },
): CustomerOrderFlowStep {
  const termin = ctx.besichtigungsort?.termin;
  let label = STAGE_SHORT_LABEL[stage];
  let subtitle = "";

  switch (stage) {
    case "requested":
      label = appointmentDateLabel("Wunschtermin", termin) + " angefragt";
      subtitle = "Ihr Termin zur Erstbegutachtung wird innerhalb von 72 Stunden bestätigt";
      break;
    case "appointment_confirmed":
      if (state.isRejected) {
        label = appointmentDateLabel("Wunschtermin", termin) + " abgelehnt";
      } else {
        label = appointmentDateLabel("Wunschtermin", termin) + " bestätigt";
        subtitle = appointmentDetailsSubtitle(ctx.besichtigungsort);
      }
      break;
    case "inspection_completed":
      subtitle = "Hier können Sie Ihr Gutachten einsehen";
      break;
    case "offers_published":
      subtitle = "Bitte geben Sie ein Angebot Ihrer Wahl innerhalb von 72 Stunden frei";
      break;
    case "offer_approved":
      subtitle = offerApprovedSubtitle(relevantOffer);
      break;
    case "in_repair":
      subtitle = "Nach der Reparatur erfolgt automatisch eine Nachbegutachtung durch den Gutachter";
      break;
    case "followup_completed":
      subtitle = "Hier können Sie Ihr Gutachten einsehen\nRechnung einsehen und bezahlen";
      break;
    case "vehicle_ready":
      subtitle = "Ihr Fahrzeug kann nun abgeholt werden.\nHier können Sie Ihre Rechnung einsehen";
      break;
  }

  const step: CustomerOrderFlowStep = {
    stage,
    label,
    shortLabel: state.isRejected ? "Wunschtermin abgelehnt" : STAGE_SHORT_LABEL[stage],
    subtitle,
    tooltipDescription: STAGE_TOOLTIP[stage],
    datetime: state.datetime,
    completed: state.completed,
    isCurrent: state.isCurrent,
    isNext: state.isNext,
    isCancelled: state.isCancelled,
    isRejected: state.isRejected,
  };

  if (stage === "inspection_completed" && gutachtenDoc) {
    step.reportDocUrl = resolveDocUrl(gutachtenDoc);
  }
  if (stage === "followup_completed") {
    if (nachgutachtenDoc) step.reportDocUrl = resolveDocUrl(nachgutachtenDoc);
    if (rechnungDoc) step.invoiceDocUrl = resolveDocUrl(rechnungDoc);
    step.showPaymentAction = true;
  }
  if (stage === "vehicle_ready" && rechnungDoc) {
    step.invoiceDocUrl = resolveDocUrl(rechnungDoc);
  }

  return step;
}

/**
 * Builds the 8-step customer flow for rendering, or `null` when there's no
 * order / the `order_status` is entirely unrecognized — callers must fall
 * back to their existing legacy display in that case, not fabricate
 * progress.
 *
 * On `cancelled`, the stage the order had actually reached (derived from the
 * real `old_status` on the terminal status-history entry — never guessed) is
 * marked red instead of green, subsequent stages stay future, and nothing
 * beyond that point is presented as completed.
 *
 * `discarded` is deliberately NOT treated as a terminal/rejected state here —
 * there is no backend confirmation it specifically means "appointment
 * rejected" (see `TERMINAL_STATUSES`), so it falls through to the `null` /
 * legacy-fallback path below instead.
 */
export function getCustomerOrderFlowSteps(
  ctx: CustomerOrderFlowInput,
): CustomerOrderFlowStep[] | null {
  if (!ctx.orderCreatedAt) return null;

  const status = (ctx.orderStatus ?? "").trim();
  const offers = ctx.offers ?? [];
  const reportDocuments = ctx.reportDocuments ?? [];
  const relevantOffer = pickRelevantOffer(offers);
  const gutachtenDoc = findLatestDoc(reportDocuments, "gutachten");
  const nachgutachtenDoc = findLatestDoc(reportDocuments, "nachgutachten");
  const rechnungDoc = findLatestDoc(reportDocuments, "rechnung");

  if (TERMINAL_STATUSES.has(status)) {
    const terminalEntry = ctx.statusHistory.find((e) => e.new_status === status);
    const priorStatus = (terminalEntry?.old_status ?? "").trim();
    const priorIndex = Math.min(
      resolveProgressIndex(priorStatus, relevantOffer, !!nachgutachtenDoc) ?? 0,
      CUSTOMER_ORDER_STAGE_SEQUENCE.length - 1,
    );
    const terminalDate = terminalEntry?.created_at ?? "";
    // Dates for stages reached *before* the interruption must be resolved
    // against the real prior status, not "cancelled" itself — otherwise
    // e.g. the in-repair date would incorrectly look for a "cancelled"
    // status-history entry instead of the actual "workshop" one.
    const priorCtx: CustomerOrderFlowInput = { ...ctx, orderStatus: priorStatus };

    return CUSTOMER_ORDER_STAGE_SEQUENCE.map((stage, index) => {
      const isTerminalHere = index === priorIndex;
      const completed = index < priorIndex;
      const datetime = completed
        ? getStageDate(stage, priorCtx, relevantOffer, gutachtenDoc, nachgutachtenDoc)
        : isTerminalHere
          ? terminalDate
          : "";

      return buildStep(stage, ctx, relevantOffer, gutachtenDoc, nachgutachtenDoc, rechnungDoc, {
        datetime,
        completed,
        isCurrent: false,
        isNext: false,
        isCancelled: isTerminalHere,
        isRejected: false,
      });
    });
  }

  const progressIndex = resolveProgressIndex(status, relevantOffer, !!nachgutachtenDoc);
  if (progressIndex === null) return null;

  let nextAssigned = false;
  return CUSTOMER_ORDER_STAGE_SEQUENCE.map((stage, index) => {
    const forcedFuture = stage === PAYMENT_GATED_STAGE;
    const completed = !forcedFuture && index < progressIndex;
    const isCurrent = !forcedFuture && index === progressIndex;
    const isUpcoming = forcedFuture || index > progressIndex;
    const isNext = isUpcoming && !nextAssigned;
    if (isNext) nextAssigned = true;

    const datetime =
      completed || isCurrent
        ? getStageDate(stage, ctx, relevantOffer, gutachtenDoc, nachgutachtenDoc)
        : "";

    return buildStep(stage, ctx, relevantOffer, gutachtenDoc, nachgutachtenDoc, rechnungDoc, {
      datetime,
      completed,
      isCurrent,
      isNext,
      isCancelled: false,
      isRejected: false,
    });
  });
}

/** The single "headline" step (current / rejected / cancelled marker) for a page's status heading, or `null`. */
export function getCustomerOrderHeadline(
  steps: ReadonlyArray<CustomerOrderFlowStep> | null,
): { label: string; tooltipDescription: string } | null {
  if (!steps) return null;
  const headline = steps.find((s) => s.isCurrent || s.isCancelled || s.isRejected);
  if (!headline) return null;
  return { label: headline.shortLabel, tooltipDescription: headline.tooltipDescription };
}
