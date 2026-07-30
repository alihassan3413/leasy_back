import { getOrderStatusLabel } from "./status";

/**
 * The core "happy path" a self-buyback order moves through, in order. The
 * optional loops (`reinspection` / `reworkshop`) and the terminal states
 * (`discarded` / `cancelled`) are deliberately excluded here — they only ever
 * surface in the timeline as *history*, once they actually occur, never as an
 * anticipated "next step".
 */
const CORE_PATH = ["confirmed", "inspected", "workshop", "delivered", "completed"] as const;

/**
 * How far along `CORE_PATH` a given `order_status` implies we have already
 * reached. Statuses that aren't on the core path — the early request states and
 * the reinspection/reworkshop loops — are mapped to the nearest core position
 * so the list of upcoming steps stays sensible.
 */
const STATUS_CORE_INDEX: Record<string, number> = {
  order_requested: -1,
  order_placed: -1,
  confirmed: 0,
  inspected: 1,
  workshop: 2,
  reinspection: 2,
  reworkshop: 2,
  delivered: 3,
  completed: 4,
};

// Once an order reaches one of these it has no further planned steps.
const TERMINAL_STATUSES = new Set(["completed", "discarded", "cancelled"]);

export interface UpcomingStep {
  status: string;
  label: string;
}

/**
 * The remaining core-path steps *after* the order's current status, in order.
 * Empty once the order is completed or ended (discarded / cancelled), or when
 * there is no order yet.
 */
export function getUpcomingSteps(currentStatus?: string | null): UpcomingStep[] {
  const status = (currentStatus ?? "").trim();
  if (!status || TERMINAL_STATUSES.has(status)) return [];
  const idx = STATUS_CORE_INDEX[status] ?? -1;
  return CORE_PATH.slice(idx + 1).map((s) => ({
    status: s,
    label: getOrderStatusLabel(s).label,
  }));
}

/** Shape shared by every timeline entry the marker styling cares about. */
interface TimelineMarker {
  completed?: boolean;
  isNext?: boolean;
  /** Cancelled terminal state — only the customer (B2C/B2B) timelines set this. */
  isCancelled?: boolean;
  /** Rejected appointment (stage 2) terminal state — only the customer (B2C/B2B) timelines set this. */
  isRejected?: boolean;
}

/**
 * Inline style for a timeline dot, shared by the B2C / B2B / admin timelines:
 * a cancelled/rejected step is solid red; completed (past) steps are solid
 * green; the immediate next step is a hollow green ring; later upcoming
 * steps are a hollow grey ring. Pair with a `border-2` class on the dot so
 * the ring is visible.
 */
export function timelineDotStyle(entry: TimelineMarker): string {
  if (entry.isCancelled || entry.isRejected) return "background:#dc2626;border-color:#dc2626";
  if (entry.completed) return "background:#01B990;border-color:#01B990";
  if (entry.isNext) return "background:#fff;border-color:#01B990";
  return "background:#fff;border-color:#B7C2C2";
}

/** Inline style for the vertical connector line between two dots. */
export function timelineLineStyle(entry: TimelineMarker): string {
  if (entry.isCancelled || entry.isRejected) return "background:#dc2626";
  return entry.completed ? "background:#01B990" : "background:#B7C2C2";
}

/**
 * Display name for a timeline "provider" row. The raw label from the mapper
 * is a lowercase key ("dekra" / "tuvsud"); render it as a proper capitalized
 * name. Previously duplicated identically across the B2C, B2B and admin
 * timeline components.
 */
export function providerDisplayLabel(label: string): string {
  const key = label.toLowerCase();
  if (key === "dekra") return "Dekra";
  if (key === "tuvsud") return "TÜV SÜD";
  return label;
}
