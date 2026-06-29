<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Icon } from "@iconify/vue";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { AdminVehicle } from "@/types";
import { adminOffersApi } from "@/api";

const props = defineProps<{
  open: boolean;
  vehicle: AdminVehicle | null;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  success: [];
}>();

const isLoading = ref(false);

type AmountField = { net: string; gross: string };

// Define state for each field's net and gross
const repairCosts = ref<AmountField>({ net: "", gross: "" });
const depreciationValue = ref<AmountField>({ net: "", gross: "" });
const workshopQuote = ref<AmountField>({ net: "", gross: "" });
const missingPartsCost = ref<AmountField>({ net: "", gross: "" });
const notes = ref("");

// Parse a (possibly comma-decimal) string into a number
const toNumber = (str: string): number => {
  return parseFloat(str.replace(",", "."));
};

// Auto-calculate gross from net (assuming 19% VAT as standard in DE)
const calculateGross = (netStr: string): string => {
  const net = toNumber(netStr);
  if (isNaN(net)) return "";
  return (net * 1.19).toFixed(2);
};

// Auto-calculate net from gross
const calculateNet = (grossStr: string): string => {
  const gross = toNumber(grossStr);
  if (isNaN(gross)) return "";
  return (gross / 1.19).toFixed(2);
};

// Validate and format pasted content for amount inputs
const onAmountPaste = (event: ClipboardEvent) => {
  event.preventDefault();
  const target = event.target as HTMLInputElement;
  const currentValue = target.value;
  const selectionStart = target.selectionStart || 0;
  const selectionEnd = target.selectionEnd || 0;

  // Get pasted text
  let pastedText = event.clipboardData?.getData("text/plain") || "";

  // Remove invalid characters
  pastedText = pastedText.replace(/[^\d.,]/g, "");

  // Check if we're adding a decimal separator and already have one
  const existingSeparatorIndex = currentValue.search(/[.,]/);
  const pastedHasSeparator = pastedText.search(/[.,]/) !== -1;

  if (existingSeparatorIndex !== -1 && pastedHasSeparator) {
    // If pasting into selection that includes existing separator, remove from pasted
    if (selectionStart <= existingSeparatorIndex && selectionEnd > existingSeparatorIndex) {
      // Keep only first separator in pasted text
      const firstSepIndex = pastedText.search(/[.,]/);
      pastedText =
        pastedText.slice(0, firstSepIndex) +
        pastedText.slice(firstSepIndex + 1).replace(/[.,]/g, "");
    } else {
      // Remove all separators from pasted text
      pastedText = pastedText.replace(/[.,]/g, "");
    }
  }

  // Determine separator for the final value
  let separator = "";
  if (existingSeparatorIndex !== -1) {
    separator = currentValue[existingSeparatorIndex];
  } else if (pastedHasSeparator) {
    const firstSepIndex = pastedText.search(/[.,]/);
    separator = pastedText[firstSepIndex];
  }

  // Split into integer and decimal parts
  let integerPart = "";
  let decimalPart = "";

  if (separator) {
    const sepIndex = pastedText.search(/[.,]/);
    if (sepIndex !== -1) {
      integerPart = pastedText.slice(0, sepIndex);
      decimalPart = pastedText.slice(sepIndex + 1).slice(0, 2); // Limit to 2 decimals
    } else {
      integerPart = pastedText;
    }
  } else {
    integerPart = pastedText;
  }

  // Build the new value
  let newValue = integerPart;
  if (separator && (decimalPart || existingSeparatorIndex !== -1)) {
    newValue += separator + decimalPart;
  }

  // Insert into the input
  const beforeSelection = currentValue.slice(0, selectionStart);
  const afterSelection = currentValue.slice(selectionEnd);

  const finalValue = beforeSelection + newValue + afterSelection;

  // Now clean up finalValue to ensure validity
  let finalClean = "";
  let sepPos = -1;

  for (let i = 0; i < finalValue.length; i++) {
    const char = finalValue[i];
    if (/[.,]/.test(char)) {
      if (sepPos === -1) {
        sepPos = finalClean.length;
        finalClean += char;
      }
    } else if (/\d/.test(char)) {
      if (sepPos === -1 || finalClean.length - sepPos <= 2) {
        finalClean += char;
      }
    }
  }

  // Update the input value and trigger input event
  target.value = finalClean;
  target.dispatchEvent(new Event("input", { bubbles: true }));
};

// Prevent invalid keystrokes for amount inputs
const onAmountKeyDown = (event: KeyboardEvent) => {
  const target = event.target as HTMLInputElement;
  const currentValue = target.value;
  const selectionStart = target.selectionStart || 0;
  const selectionEnd = target.selectionEnd || 0;
  const selectedText = currentValue.slice(selectionStart, selectionEnd);

  // Allow: backspace, delete, tab, escape, enter
  if (
    ["Backspace", "Delete", "Tab", "Escape", "Enter"].includes(event.key) ||
    // Allow: Ctrl+A, Ctrl+C, Ctrl+X (we handle Ctrl+V in paste handler)
    (event.ctrlKey === true && ["a", "c", "x"].includes(event.key)) ||
    // Allow: home, end, left, right
    ["Home", "End", "ArrowLeft", "ArrowRight"].includes(event.key)
  ) {
    // Let it happen
    return;
  }

  // Prevent anything that's not a number, comma, or dot
  if (!/[\d.,]/.test(event.key)) {
    event.preventDefault();
    return;
  }

  // If it's a decimal separator (comma or dot)
  if ([",", "."].includes(event.key)) {
    // Check if there's already a decimal separator
    const existingSeparatorIndex = currentValue.search(/[.,]/);
    if (existingSeparatorIndex !== -1) {
      // Only allow if we're replacing the existing separator
      if (!(selectionStart <= existingSeparatorIndex && selectionEnd > existingSeparatorIndex)) {
        event.preventDefault();
        return;
      }
    }
  }

  // Check decimal places if we're adding a digit after decimal
  const decimalIndex = currentValue.search(/[.,]/);
  if (decimalIndex !== -1 && /\d/.test(event.key)) {
    // Check if cursor is after decimal and already 2 decimals
    if (selectionStart > decimalIndex) {
      // Count existing decimals after decimal point
      const decimalsBefore = currentValue.slice(decimalIndex + 1).length;
      const selectedDecimals = selectedText.replace(/[^\d]/g, "").length;
      if (decimalsBefore - selectedDecimals >= 2) {
        event.preventDefault();
        return;
      }
    }
  }
};

// Update handlers — only the *paired* field is recalculated, never the one the
// user is typing in. This avoids the circular net<->gross watcher feedback loop
// that was reformatting input mid-typing and made the fields feel broken.
const onNetInput = (field: AmountField, value: string) => {
  field.net = value;
  field.gross = calculateGross(value);
};
const onGrossInput = (field: AmountField, value: string) => {
  field.gross = value;
  field.net = calculateNet(value);
};

// Auto-calculate final total
const finalTotal = computed(() => {
  const repairNet = toNumber(repairCosts.value.net) || 0;
  const depNet = toNumber(depreciationValue.value.net) || 0;
  const workshopNet = toNumber(workshopQuote.value.net) || 0;
  const partsNet = toNumber(missingPartsCost.value.net) || 0;

  const totalNet = repairNet + depNet + workshopNet + partsNet;
  const totalGross = totalNet * 1.19;

  return {
    net: totalNet.toFixed(2),
    gross: totalGross.toFixed(2),
  };
});

// Reset form when closing
watch(
  () => props.open,
  (opened) => {
    if (!opened) {
      repairCosts.value = { net: "", gross: "" };
      depreciationValue.value = { net: "", gross: "" };
      workshopQuote.value = { net: "", gross: "" };
      missingPartsCost.value = { net: "", gross: "" };
      notes.value = "";
    }
  },
);

function close() {
  emit("update:open", false);
}

async function handleSubmit() {
  if (!props.vehicle?.current_auftragsnummer) {
    console.error("No auftragsnummer available");
    return;
  }

  try {
    isLoading.value = true;
    await adminOffersApi.createDraft(props.vehicle.current_auftragsnummer, {
      repair_cost_net: repairCosts.value.net,
      repair_cost_gross: repairCosts.value.gross,
      depreciation_value_net: depreciationValue.value.net,
      depreciation_value_gross: depreciationValue.value.gross,
      workshop_repair_quote_net: workshopQuote.value.net,
      workshop_repair_quote_gross: workshopQuote.value.gross,
      missing_parts_cost_net: missingPartsCost.value.net,
      missing_parts_cost_gross: missingPartsCost.value.gross,
      additional_notes: notes.value,
    });
    emit("success");
    close();
  } catch (err) {
    console.error("Error submitting offer:", err);
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      class="p-0 gap-0 overflow-visible bg-transparent border-none shadow-none rounded-none"
      style="width: 720px; max-width: calc(100vw - 2rem)"
      :show-close-button="false"
    >
      <div class="relative">
        <button
          @click="close"
          class="absolute -right-1 -top-1 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md transition-colors hover:bg-emerald-600"
        >
          <Icon icon="mdi:close" class="size-8" />
        </button>

        <div
          class="bg-white border border-[#C6C6CD] p-6 inverted-corner inverted-corner-top-right"
          style="filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.15))"
        >
          <div class="px-6 pt-6 mb-6">
            <h2 class="text-[20px] font-bold leading-normal text-black">Angebot erstellen</h2>
            <p class="mt-1 mx-2 pb-3 text-sm font-light leading-normal not-italic text-[#00000080]">
              Bitte füllen Sie die Details für das Angebot aus.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 px-4 max-h-[70vh] overflow-y-auto pr-1">
            <!-- Repair Costs -->
            <div class="col-span-2 flex flex-col gap-2">
              <label class="text-sm font-semibold text-black"> Reparaturkosten Gesamt </label>
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-gray-500"> Netto (€) </label>
                  <div
                    class="relative flex h-9 items-center rounded-full border border-gray-300 px-4 focus-within:border-emerald-500"
                  >
                    <input
                      :value="repairCosts.net"
                      @keydown="onAmountKeyDown"
                      @paste="onAmountPaste"
                      @input="onNetInput(repairCosts, ($event.target as HTMLInputElement).value)"
                      type="text"
                      inputmode="decimal"
                      class="h-full w-full bg-transparent text-sm outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-gray-500"> Brutto (€) </label>
                  <div
                    class="relative flex h-9 items-center rounded-full border border-gray-300 px-4 focus-within:border-emerald-500"
                  >
                    <input
                      :value="repairCosts.gross"
                      @keydown="onAmountKeyDown"
                      @paste="onAmountPaste"
                      @input="onGrossInput(repairCosts, ($event.target as HTMLInputElement).value)"
                      type="text"
                      inputmode="decimal"
                      class="h-full w-full bg-transparent text-sm outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Depreciation Value -->
            <div class="col-span-2 flex flex-col gap-2">
              <label class="text-sm font-semibold text-black"> Wertminderung Gesamt </label>
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-gray-500"> Netto (€) </label>
                  <div
                    class="relative flex h-9 items-center rounded-full border border-gray-300 px-4 focus-within:border-emerald-500"
                  >
                    <input
                      :value="depreciationValue.net"
                      @keydown="onAmountKeyDown"
                      @paste="onAmountPaste"
                      @input="
                        onNetInput(depreciationValue, ($event.target as HTMLInputElement).value)
                      "
                      type="text"
                      inputmode="decimal"
                      class="h-full w-full bg-transparent text-sm outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-gray-500"> Brutto (€) </label>
                  <div
                    class="relative flex h-9 items-center rounded-full border border-gray-300 px-4 focus-within:border-emerald-500"
                  >
                    <input
                      :value="depreciationValue.gross"
                      @keydown="onAmountKeyDown"
                      @paste="onAmountPaste"
                      @input="
                        onGrossInput(depreciationValue, ($event.target as HTMLInputElement).value)
                      "
                      type="text"
                      inputmode="decimal"
                      class="h-full w-full bg-transparent text-sm outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Workshop Repair Quote -->
            <div class="col-span-2 flex flex-col gap-2">
              <label class="text-sm font-semibold text-black"> Werkstattreparaturangebot </label>
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-gray-500"> Netto (€) </label>
                  <div
                    class="relative flex h-9 items-center rounded-full border border-gray-300 px-4 focus-within:border-emerald-500"
                  >
                    <input
                      :value="workshopQuote.net"
                      @keydown="onAmountKeyDown"
                      @paste="onAmountPaste"
                      @input="onNetInput(workshopQuote, ($event.target as HTMLInputElement).value)"
                      type="text"
                      inputmode="decimal"
                      class="h-full w-full bg-transparent text-sm outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-gray-500"> Brutto (€) </label>
                  <div
                    class="relative flex h-9 items-center rounded-full border border-gray-300 px-4 focus-within:border-emerald-500"
                  >
                    <input
                      :value="workshopQuote.gross"
                      @keydown="onAmountKeyDown"
                      @paste="onAmountPaste"
                      @input="
                        onGrossInput(workshopQuote, ($event.target as HTMLInputElement).value)
                      "
                      type="text"
                      inputmode="decimal"
                      class="h-full w-full bg-transparent text-sm outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Missing Parts Cost -->
            <div class="col-span-2 flex flex-col gap-2">
              <label class="text-sm font-semibold text-black"> Fehlende Teile Kosten </label>
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-gray-500"> Netto (€) </label>
                  <div
                    class="relative flex h-9 items-center rounded-full border border-gray-300 px-4 focus-within:border-emerald-500"
                  >
                    <input
                      :value="missingPartsCost.net"
                      @keydown="onAmountKeyDown"
                      @paste="onAmountPaste"
                      @input="
                        onNetInput(missingPartsCost, ($event.target as HTMLInputElement).value)
                      "
                      type="text"
                      inputmode="decimal"
                      class="h-full w-full bg-transparent text-sm outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-gray-500"> Brutto (€) </label>
                  <div
                    class="relative flex h-9 items-center rounded-full border border-gray-300 px-4 focus-within:border-emerald-500"
                  >
                    <input
                      :value="missingPartsCost.gross"
                      @keydown="onAmountKeyDown"
                      @paste="onAmountPaste"
                      @input="
                        onGrossInput(missingPartsCost, ($event.target as HTMLInputElement).value)
                      "
                      type="text"
                      inputmode="decimal"
                      class="h-full w-full bg-transparent text-sm outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Final Total -->
            <div class="col-span-2 flex flex-col gap-2 bg-gray-50 rounded-xl p-4">
              <label class="text-sm font-semibold text-black"> Endsumme (auto-berechnet) </label>
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-gray-500"> Netto (€) </label>
                  <div
                    class="relative flex h-9 items-center rounded-full border border-gray-300 bg-white px-4"
                  >
                    <span class="text-sm font-medium text-gray-700">{{ finalTotal.net }}</span>
                  </div>
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-gray-500"> Brutto (€) </label>
                  <div
                    class="relative flex h-9 items-center rounded-full border border-gray-300 bg-white px-4"
                  >
                    <span class="text-sm font-medium text-gray-700">{{ finalTotal.gross }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Additional Notes -->
            <div class="flex flex-col gap-1 col-span-2">
              <label class="text-sm font-semibold text-black">
                Zusätzliche Informationen / Hinweise
              </label>
              <div
                class="relative flex items-start rounded-full border border-gray-300 px-4 py-2 focus-within:border-emerald-500"
              >
                <textarea
                  v-model="notes"
                  rows="3"
                  class="w-full bg-transparent text-sm outline-none resize-none"
                  placeholder="Hinweise hinzufügen..."
                />
              </div>
            </div>

            <!-- Submit -->
            <div class="mt-2 flex justify-center col-span-2">
              <button
                class="h-9 px-6 rounded-full text-sm font-semibold text-white transition-all duration-200 shadow-lg"
                style="background: #ef8450"
                :disabled="isLoading"
                @click="handleSubmit"
              >
                {{ isLoading ? "Lädt..." : "Angebot erstellen" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.inverted-corner {
  --r: 38px;
  --s: 32px;
  --x: 0px;
  --y: 0px;
  border-radius: var(--r);
}

.inverted-corner-top-right {
  --_m: /calc(2 * var(--r)) calc(2 * var(--r)) radial-gradient(#000 70%, #0000 0%);
  --_g: conic-gradient(at calc(100% - var(--r)) var(--r), #0000 25%, #000 0);
  --_d: (var(--s) + var(--r));

  mask:
    calc(100% - var(--_d) - var(--x)) 0 var(--_m),
    100% calc(var(--_d) + var(--y)) var(--_m),
    radial-gradient(var(--s) at 100% 0, #0000 99%, #000 calc(100% + 0.5px))
      calc(-1 * var(--r) - var(--x)) calc(var(--r) + var(--y)),
    var(--_g) calc(-1 * var(--_d) - var(--x)) 0,
    var(--_g) 0 calc(var(--_d) + var(--y));
  mask-repeat: no-repeat;
}
</style>
