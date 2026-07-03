<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
import { toast } from "vue-sonner";
import { vehicleApi } from "@/api";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const props = defineProps<{
  open: boolean;
  defaultProvider: "tuvsud" | "dekra";
}>();

const selectedProvider = ref<"tuvsud" | "dekra">(props.defaultProvider);

watch(
  () => props.open,
  (opened) => {
    if (opened) {
      selectedProvider.value = props.defaultProvider;
    }
  },
);

const emit = defineEmits<{
  "update:open": [value: boolean];
  success: [station: any];
}>();

const name = ref("");
const strasse = ref("");
const plz = ref("");
const ort = ref("");
const bundesland = ref("");
const isSubmitting = ref(false);

const canSubmit = computed(
  () =>
    !!name.value.trim() &&
    !!strasse.value.trim() &&
    !!plz.value.trim() &&
    !!ort.value.trim() &&
    !!bundesland.value.trim() &&
    !isSubmitting.value,
);

async function handleSubmit() {
  if (!canSubmit.value) return;

  isSubmitting.value = true;
  try {
    const station = await vehicleApi.createStation({
      provider: selectedProvider.value,
      name: name.value.trim(),
      strasse: strasse.value.trim(),
      plz: plz.value.trim(),
      ort: ort.value.trim(),
      bundesland: bundesland.value.trim(),
    });
    toast.success("Station erfolgreich erstellt.");
    emit("success", station);
    close();
  } catch (err) {
    console.error("Station creation error:", err);
    toast.error("Station konnte nicht erstellt werden.");
  } finally {
    isSubmitting.value = false;
  }
}

function close() {
  name.value = "";
  strasse.value = "";
  plz.value = "";
  ort.value = "";
  bundesland.value = "";
  emit("update:open", false);
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      class="p-0 gap-0 overflow-visible bg-transparent border-none shadow-none rounded-none"
      style="width: 500px; max-width: calc(100vw - 2rem)"
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
          class="bg-white border border-[#C6C6CD] p-4 inverted-corner inverted-corner-top-right"
          style="filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.15))"
        >
          <div class="px-4 pt-4 mb-4">
            <h2 class="text-[20px] font-bold leading-normal text-black">Station erstellen</h2>
          </div>

          <div class="grid grid-cols-1 gap-y-3 px-4 max-h-[70vh] overflow-y-auto pr-1">
            <!-- Service switches -->
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-black">Service wählen</label>
              <div class="flex flex-col gap-2">
                <!-- TÜV SÜD -->
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="tuvsud"
                    v-model="selectedProvider"
                    class="accent-primary size-4"
                  />
                  <span class="text-base text-gray-800">TÜV SÜD</span>
                </label>
                <!-- DEKRA -->
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="dekra"
                    v-model="selectedProvider"
                    class="accent-primary size-4"
                  />
                  <span class="text-base text-gray-800">DEKRA</span>
                </label>
              </div>
            </div>
            <!-- Name -->
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-black">Name</label>
              <div
                class="relative flex h-9 items-center rounded-full border border-gray-300 px-4 focus-within:border-emerald-500"
              >
                <input
                  v-model="name"
                  type="text"
                  class="h-full w-full bg-transparent text-sm outline-none"
                  placeholder="Name der Station"
                />
              </div>
            </div>

            <!-- Straße -->
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-black">Straße</label>
              <div
                class="relative flex h-9 items-center rounded-full border border-gray-300 px-4 focus-within:border-emerald-500"
              >
                <input
                  v-model="strasse"
                  type="text"
                  class="h-full w-full bg-transparent text-sm outline-none"
                  placeholder="Straße und Hausnummer"
                />
              </div>
            </div>

            <!-- PLZ & Ort -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <div class="flex flex-col gap-1">
                <label class="text-sm font-semibold text-black">PLZ</label>
                <div
                  class="relative flex h-9 items-center rounded-full border border-gray-300 px-4 focus-within:border-emerald-500"
                >
                  <input
                    v-model="plz"
                    type="text"
                    class="h-full w-full bg-transparent text-sm outline-none"
                    placeholder="Postleitzahl"
                  />
                </div>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm font-semibold text-black">Ort</label>
                <div
                  class="relative flex h-9 items-center rounded-full border border-gray-300 px-4 focus-within:border-emerald-500"
                >
                  <input
                    v-model="ort"
                    type="text"
                    class="h-full w-full bg-transparent text-sm outline-none"
                    placeholder="Ort"
                  />
                </div>
              </div>
            </div>

            <!-- Bundesland -->
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-black">Bundesland</label>
              <div
                class="relative flex h-9 items-center rounded-full border border-gray-300 px-4 focus-within:border-emerald-500"
              >
                <input
                  v-model="bundesland"
                  type="text"
                  class="h-full w-full bg-transparent text-sm outline-none"
                  placeholder="Bundesland"
                />
              </div>
            </div>

            <!-- Submit -->
            <div class="mt-2 flex justify-center">
              <button
                class="h-9 px-6 rounded-full text-sm font-semibold text-white transition-all duration-200 shadow-lg"
                :style="canSubmit ? 'background: #EF8450;' : 'background: #D9D9D9;'"
                :disabled="!canSubmit || isSubmitting"
                @click="handleSubmit"
              >
                {{ isSubmitting ? "Lädt..." : "Erstellen" }}
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
