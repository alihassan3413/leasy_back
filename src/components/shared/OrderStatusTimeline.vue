<script setup lang="ts">
import { timelineDotStyle, timelineLineStyle, providerDisplayLabel } from "@/lib/timeline";
import StatusHelpTooltip from "@/components/shared/StatusHelpTooltip.vue";

/**
 * Display-ready shape for a single order-status timeline row. Callers
 * (B2C/B2B/admin) resolve their own order/status-history/upcoming-step data
 * into this shape — including any date formatting, since B2C/Admin and B2B
 * format `datetime` differently today and this component intentionally
 * renders it verbatim rather than re-formatting it.
 */
export interface OrderTimelineEntry {
  /** Pre-formatted date/time string, or "" when the step has no date yet. */
  datetime: string;
  /** Raw label — e.g. "dekra"/"tuvsud" for provider rows, otherwise the status/step text. */
  label: string;
  sublabel?: string;
  completed?: boolean;
  isFuture?: boolean;
  isNext?: boolean;
  /** The resolved current customer-flow stage. Only B2C/B2B set this. */
  isCurrent?: boolean;
  /** The cancelled terminal state — styled red instead of the usual green. Only B2C/B2B set this. */
  isCancelled?: boolean;
  /** A rejected appointment (stage 2) — styled red like `isCancelled` but with its own badge text. Only B2C/B2B set this. */
  isRejected?: boolean;
  /** Report-upload row (Gutachten/Nachgutachten). Enables the `actions` slot. */
  isReport?: boolean;
  docUrl?: string;
  /** Invoice (Rechnung) view/download action — only B2C/B2B customer timelines set this. */
  invoiceUrl?: string;
  /** Whether this row has a (currently hidden/disabled) payment action slot — only B2C/B2B set this. */
  showPaymentAction?: boolean;
  /**
   * Opaque source document for report rows (only the admin timeline uses
   * this, to power its publish/delete actions). Left untyped here since the
   * shape is page-specific — callers narrow it themselves in their `actions`
   * slot content.
   */
  doc?: unknown;
  /**
   * German help text for a `StatusHelpTooltip` shown next to `label`. Only
   * the customer (B2C/B2B) timelines set this today, for their mapped
   * current-stage label — leave unset (as the admin timeline does) to render
   * no tooltip.
   */
  tooltipDescription?: string;
}

const props = withDefaults(
  defineProps<{
    /** Rows to render, in order. Empty array renders no rows. */
    entries: OrderTimelineEntry[];
    /**
     * Card title text (e.g. "STATUS: BESTÄTIGT"). Omit to render no header —
     * B2B builds its own header (with extra controls) outside this component.
     */
    headerLabel?: string;
    /** German help text for a `StatusHelpTooltip` shown next to `headerLabel`. */
    headerTooltipDescription?: string;
    headerClass?: string;
    bodyClass?: string;
    /**
     * Whether provider rows ("dekra"/"tuvsud") display the capitalized name
     * (Dekra/TÜV SÜD) or the raw label. Defaults to true; the B2C mobile
     * layout passes false to preserve its existing (unstyled) behavior.
     */
    transformProviderLabel?: boolean;
  }>(),
  {
    headerLabel: undefined,
    headerTooltipDescription: undefined,
    headerClass: "px-6 pt-6 pb-5 flex items-center justify-between",
    bodyClass: "flex-1 px-6 pb-5",
    transformProviderLabel: true,
  },
);

function isProviderEntry(entry: OrderTimelineEntry): boolean {
  const key = entry.label.toLowerCase();
  return key === "dekra" || key === "tuvsud";
}

function providerLabel(entry: OrderTimelineEntry): string {
  return props.transformProviderLabel ? providerDisplayLabel(entry.label) : entry.label;
}
</script>

<template>
  <div v-if="headerLabel" :class="headerClass">
    <p
      class="flex items-center gap-1.5 text-[16px] font-bold text-[#000000] leading-tight uppercase"
    >
      {{ headerLabel }}
      <StatusHelpTooltip v-if="headerTooltipDescription" :text="headerTooltipDescription" />
    </p>
  </div>

  <div :class="bodyClass">
    <div v-for="(entry, i) in entries" :key="i" class="relative flex items-start pb-6">
      <!-- Vertical line -->
      <div
        v-if="i < entries.length - 1"
        class="absolute left-2 top-5 w-0.5 h-full"
        :style="timelineLineStyle(entry)"
      />

      <!-- Dot -->
      <div
        class="relative z-10 w-4 h-4 shrink-0 rounded-full mt-1 border-2"
        :style="timelineDotStyle(entry)"
      />

      <!-- Content -->
      <div class="min-w-0 flex-1 pl-5">
        <!-- Date/time -->
        <p v-if="entry.datetime" class="text-[14px] text-[#2e3e3f] font-medium mb-1">
          {{ entry.datetime }}
        </p>

        <!-- Provider row (Dekra / TÜV SÜD) -->
        <template v-if="isProviderEntry(entry)">
          <p class="text-[16px] font-bold mb-1" style="color: #01b990">
            {{ providerLabel(entry) }}
          </p>
          <p
            v-if="entry.sublabel"
            class="whitespace-pre-line text-[14px] text-[#2e3e3f] font-normal"
          >
            {{ entry.sublabel }}
          </p>
        </template>

        <!-- Normal status/step row -->
        <template v-else>
          <div class="flex items-center justify-between">
            <div>
              <p
                class="flex items-center gap-1.5 text-[14px] font-normal"
                :class="
                  entry.isCancelled || entry.isRejected
                    ? 'text-[#dc2626]'
                    : entry.isFuture
                      ? 'text-[#8f9ba7]'
                      : 'text-[#2e3e3f]'
                "
              >
                {{ entry.label }}
                <StatusHelpTooltip
                  v-if="entry.tooltipDescription"
                  :text="entry.tooltipDescription"
                />
              </p>
              <span
                v-if="entry.isCancelled"
                class="mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style="background: rgba(220, 38, 38, 0.1); color: #dc2626"
              >
                Storniert
              </span>
              <span
                v-else-if="entry.isRejected"
                class="mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style="background: rgba(220, 38, 38, 0.1); color: #dc2626"
              >
                Abgelehnt
              </span>
              <span
                v-else-if="entry.isCurrent"
                class="mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style="background: rgba(1, 185, 144, 0.15); color: #01b990"
              >
                Aktueller Status
              </span>
              <span
                v-else-if="entry.isNext"
                class="mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style="background: rgba(1, 185, 144, 0.1); color: #01b990"
              >
                Nächster Schritt
              </span>
              <p
                v-if="entry.sublabel"
                class="whitespace-pre-line text-[14px] text-[#2e3e3f] font-normal"
              >
                {{ entry.sublabel }}
              </p>
            </div>
            <div
              v-if="entry.isReport && (entry.docUrl || entry.invoiceUrl || entry.showPaymentAction)"
              class="flex items-center gap-2"
            >
              <slot name="actions" :entry="entry" />
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
