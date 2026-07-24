<script setup lang="ts">
import { ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Test appraisal numbers (Gutachtennummern) provided for exercising the
// TÜV SÜD sync + transfer flow without needing a real completed order.
const MOCK_APPRAISAL_NUMBERS = ["43686588", "43719554"];

const props = defineProps<{
  open: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  confirm: [mockAppraisalNumber: string | null];
}>();

const mockMode = ref(false);
const selectedMockNumber = ref(MOCK_APPRAISAL_NUMBERS[0]);

// Reset to a clean state each time the modal is reopened.
watch(
  () => props.open,
  (opened) => {
    if (opened) {
      mockMode.value = false;
      selectedMockNumber.value = MOCK_APPRAISAL_NUMBERS[0];
    }
  },
);

function close() {
  if (props.loading) return;
  emit("update:open", false);
}

function confirm() {
  emit("confirm", mockMode.value ? selectedMockNumber.value : null);
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      class="p-0 gap-0 overflow-visible bg-transparent border-none shadow-none rounded-none"
      style="width: 560px; max-width: calc(100vw - 2rem)"
      :show-close-button="false"
    >
      <div class="relative px-3 md:px-0">
        <button
          @click="close"
          class="absolute right-2 top-2 md:-right-1 md:-top-1 z-10 flex h-11 w-11 md:h-14 md:w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md transition-colors hover:bg-emerald-600 disabled:opacity-60"
          :disabled="loading"
        >
          <Icon icon="mdi:close" class="size-6 md:size-8" />
        </button>

        <div
          class="bg-white border border-[#C6C6CD] p-4 md:p-6 inverted-corner inverted-corner-top-right"
          style="filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.15))"
        >
          <div class="pl-2 pr-14 md:pr-2 pt-2 mb-2">
            <h2 class="text-[16px] md:text-[24px] font-bold leading-normal text-black">
              Dokumente abrufen
            </h2>
            <p class="mt-1 pb-4 text-xs md:text-base font-light leading-normal not-italic text-[#00000080]">
              Rufen Sie die TÜV SÜD Dokumente für diesen Auftrag ab und übertragen Sie sie in die
              Fahrzeugdokumente.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-y-4">
            <!-- Mock mode toggle -->
            <div class="flex items-center justify-between gap-4 rounded-2xl bg-gray-50 p-4">
              <div>
                <p class="text-sm font-semibold text-black">Testmodus (Mock)</p>
                <p class="mt-0.5 text-xs text-gray-500">
                  Ruft Beispieldokumente über eine Test-Gutachtennummer ab, anstatt die echte
                  TÜV SÜD Anfrage für diesen Auftrag zu senden.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                :aria-checked="mockMode"
                class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
                :style="mockMode ? 'background: #01B990;' : 'background: #D9D9D9;'"
                :disabled="loading"
                @click="mockMode = !mockMode"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="mockMode ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </div>

            <!-- Mock appraisal number selection -->
            <div v-if="mockMode" class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-black">Test-Gutachtennummer</label>
              <div class="flex flex-col gap-2">
                <button
                  v-for="number in MOCK_APPRAISAL_NUMBERS"
                  :key="number"
                  type="button"
                  class="flex h-10 items-center justify-between rounded-full border px-4 text-sm transition-colors"
                  :class="
                    selectedMockNumber === number
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  "
                  :disabled="loading"
                  @click="selectedMockNumber = number"
                >
                  {{ number }}
                  <Icon
                    v-if="selectedMockNumber === number"
                    icon="mdi:check-circle"
                    class="size-5"
                  />
                </button>
              </div>
            </div>
          </div>

          <div class="mt-6 md:mt-8 flex justify-center pb-2 md:pb-0">
            <button
              class="h-10 px-8 rounded-full text-sm font-semibold text-white transition-all duration-200 shadow-lg disabled:opacity-60 disabled:cursor-wait"
              style="background: #ef8450"
              :disabled="loading"
              @click="confirm"
            >
              {{ loading ? "Wird abgerufen…" : "Dokumente abrufen" }}
            </button>
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
  --_m: /calc(2 * var(--r)) calc(2 * var(--r)) radial-gradient(#000 70%, #0000 72%);
  --_g: conic-gradient(at calc(100% - var(--r)) var(--r), #0000 25%, #000 0);
  --_d: (var(--s) + var(--r));

  mask:
    calc(100% - var(--_d) - var(--x)) 0 var(--_m),
    100% calc(var(--_d) + var(--y)) var(--_m),
    radial-gradient(var(--s) at 100% 0, #0000 99%, #000 calc(100% + 1px))
      calc(-1 * var(--r) - var(--x)) calc(var(--r) + var(--y)),
    var(--_g) calc(-1 * var(--_d) - var(--x)) 0,
    var(--_g) 0 calc(var(--_d) + var(--y));
  mask-repeat: no-repeat;
}
</style>
