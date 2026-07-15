<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";

const props = withDefaults(
  defineProps<{
    open: boolean;
    /** Processing fee in euros charged if the process is not completed. */
    fee?: number;
    /** Set by the parent while the booking request is in flight. */
    loading?: boolean;
  }>(),
  {
    fee: 200,
    loading: false,
  },
);

const emit = defineEmits<{
  "update:open": [value: boolean];
  confirm: [];
}>();

// The single acknowledgement the user must give before proceeding.
const acknowledged = ref(false);

// Reset the checkbox every time the dialog is (re)opened so a prior
// acknowledgement is never silently reused for a new booking.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) acknowledged.value = false;
  },
);

const feeLabel = computed(() =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(props.fee),
);

const canConfirm = computed(() => acknowledged.value && !props.loading);

function cancel(): void {
  if (props.loading) return;
  emit("update:open", false);
}

function confirm(): void {
  if (!canConfirm.value) return;
  emit("confirm");
}
</script>

<template>
  <AlertDialog :open="open" @update:open="cancel">
    <AlertDialogContent class="max-w-md rounded-3xl p-0 overflow-hidden gap-0">
      <!-- Header with a soft warning badge -->
      <AlertDialogHeader class="items-center gap-3 px-6 pt-8 pb-2 text-center">
        <span
          class="flex h-14 w-14 items-center justify-center rounded-full"
          style="background: rgba(239, 132, 80, 0.12)"
        >
          <Icon icon="mdi:alert-outline" class="size-7" style="color: #ef8450" />
        </span>
        <AlertDialogTitle class="text-[18px] font-bold" style="color: #10393b">
          Vorgang starten
        </AlertDialogTitle>
        <AlertDialogDescription class="text-[13.5px] leading-relaxed text-[#5a6e6c]">
          Mit dem Buchen eines Termins starten Sie den Leasyback-Prozess.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div class="px-6 pt-2 pb-6">
        <!-- Fee callout -->
        <div
          class="flex items-start gap-3 rounded-2xl border p-4"
          style="border-color: rgba(239, 132, 80, 0.35); background: rgba(239, 132, 80, 0.06)"
        >
          <span
            class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style="background: rgba(239, 132, 80, 0.15)"
          >
            <Icon icon="mdi:cash-multiple" class="size-5" style="color: #c0622e" />
          </span>
          <p class="text-[13px] leading-relaxed text-[#3f4f4d]">
            Wenn Sie einen Termin buchen, den Leasyback-Prozess jedoch
            <span class="font-semibold">nicht vollständig abschließen</span>, berechnen wir Ihnen
            eine Bearbeitungsgebühr von
            <span class="font-bold" style="color: #c0622e">{{ feeLabel }}</span
            >.
          </p>
        </div>

        <!-- Acknowledgement checkbox -->
        <label
          class="mt-5 flex cursor-pointer select-none items-start gap-3 rounded-2xl border p-3.5 transition-colors"
          :style="
            acknowledged
              ? 'border-color:#01B990; background:rgba(1,185,144,0.06)'
              : 'border-color:#e5eae9; background:#fff'
          "
        >
          <!-- Visually styled checkbox backed by a real, accessible input -->
          <span class="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
            <input
              v-model="acknowledged"
              type="checkbox"
              class="peer absolute inset-0 cursor-pointer opacity-0"
              :disabled="loading"
            />
            <span
              class="flex h-5 w-5 items-center justify-center rounded-[6px] border-2 transition-colors"
              :style="
                acknowledged
                  ? 'border-color:#01B990; background:#01B990'
                  : 'border-color:#c3ccca; background:#fff'
              "
            >
              <Icon v-if="acknowledged" icon="mdi:check" class="size-3.5 text-white" />
            </span>
          </span>
          <span class="text-[13px] leading-relaxed text-[#3f4f4d]">
            Ich habe die Information gelesen und akzeptiere die Bearbeitungsgebühr von
            <span class="font-semibold">{{ feeLabel }}</span> bei Nichtabschluss des Prozesses.
          </span>
        </label>
      </div>

      <!-- Footer actions -->
      <AlertDialogFooter class="flex-row justify-end gap-3 border-t border-[#eef3f2] px-6 py-4">
        <button
          type="button"
          class="rounded-full border border-gray-300 px-6 py-2 text-sm font-semibold text-[#10393b] transition-colors hover:bg-gray-50 disabled:opacity-50"
          :disabled="loading"
          @click="cancel"
        >
          Abbrechen
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-full px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all disabled:cursor-not-allowed"
          :style="canConfirm ? 'background:#EF8450' : 'background:#D9D9D9'"
          :disabled="!canConfirm"
          @click="confirm"
        >
          <Icon v-if="loading" icon="mdi:loading" class="size-4 animate-spin" />
          {{ loading ? "Wird gebucht…" : "Vorgang starten" }}
        </button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
