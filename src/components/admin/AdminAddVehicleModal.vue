<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Icon } from "@iconify/vue";
import type { AdminUser } from "@/types";
import { vehicleApi } from "@/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const props = defineProps<{
  open: boolean;
  targetUser?: AdminUser;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  vehicleCreated: [];
}>();

const isLoading = ref(false);

const city = ref("");
const district = ref("");
const number = ref("");
const marke = ref("");
const modell = ref("");
const leasingende = ref("");
const fin = ref("");
const rueckgabestart = ref("");
// const status = ref(""); // hidden per QA together with the Status field in the template
const fahrzeugnutzer = ref("");
const leasinggeber = ref("");

const markeOpen = ref(false);
const nutzerOpen = ref(false);

const markeOptions = [
  "VW",
  "BMW",
  "Mercedes",
  "Audi",
  "Renault",
  "Toyota",
  "Peugeot",
  "Skoda",
  "Ford",
  "Opel",
  "Sonstige",
];
const nutzerOptions = ["Christin Mechtild", "Thorsten Jung", "Marcus Dietrich"];

const markeIconClasses = computed(() => [
  "text-[24px] text-gray-500 transition-transform duration-200",
  markeOpen.value ? "rotate-180" : "rotate-0",
]);
const nutzerIconClasses = computed(() => [
  "text-[24px] text-gray-500 transition-transform duration-200",
  nutzerOpen.value ? "rotate-180" : "rotate-0",
]);

watch(
  () => props.open,
  (opened) => {
    if (!opened) {
      city.value = district.value = number.value = "";
      marke.value = modell.value = leasingende.value = "";
      fin.value = rueckgabestart.value = fahrzeugnutzer.value = "";
      leasinggeber.value = "";
    }
  },
);

const plateText = computed(() =>
  `${city.value}${district.value}${number.value}`.replace(/\s+/g, ""),
);

const plateError = computed(() => {
  if (!city.value && !district.value && !number.value) return "";
  if (plateText.value.length > 8) {
    return "Kennzeichen darf höchstens 8 Zeichen lang sein";
  }
  return "";
});

const finError = computed(() => {
  if (!fin.value.trim()) return "";
  if (fin.value.trim().length !== 17) {
    return "FIN muss genau 17 Zeichen lang sein";
  }
  return "";
});

const isFormValid = computed(() => {
  return (
    city.value.trim() !== "" &&
    number.value.trim() !== "" &&
    marke.value.trim() !== "" &&
    modell.value.trim() !== "" &&
    leasingende.value !== "" &&
    rueckgabestart.value !== "" &&
    fin.value.trim() !== "" &&
    leasinggeber.value.trim() !== "" &&
    plateError.value === "" &&
    finError.value === ""
  );
});

const buttonActive = computed(() => {
  return isFormValid.value;
});

function close() {
  emit("update:open", false);
}

async function handleSubmit() {
  const payload: any = {
    license_plate: `${city.value} ${district.value} ${number.value}`.trim().toUpperCase(),
    make: marke.value,
    model: modell.value,
    leasing_end_date: leasingende.value,
    vin: fin.value.trim().toUpperCase(),
    first_registration_date: rueckgabestart.value,
    leasinggeber: leasinggeber.value,
  };

  if (props.targetUser) {
    payload.vehicle_belongs = props.targetUser.user_type === "Firmenkunde" ? "B2B" : "B2C";
    if (payload.vehicle_belongs === "B2B") {
      payload.b2b_id = props.targetUser.b2b_id;
    } else {
      payload.b2c_user_id = props.targetUser.user_id;
    }
  }

  console.log("Submitting Vehicle Payload:", payload);

  try {
    isLoading.value = true;
    await vehicleApi.createVehicle(payload);
    emit("vehicleCreated");
    close();
  } catch (error) {
    console.error("Error submitting vehicle:", error);
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
          class="relative p-6 inverted-corner inverted-corner-top-right"
          style="filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.15))"
        >
          <div class="px-2 pt-2 mb-2">
            <h2 class="text-[24px] font-bold leading-normal text-black">Neues Fahrzeug</h2>
            <p class="mt-1 pb-4 text-base font-light leading-normal not-italic text-[#00000080]">
              Legen Sie ganz einfach ein neues Fahrzeug an – bitte füllen Sie dafür alle Angaben im
              Formular unten aus
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-black">
                Kennzeichen
                <span class="text-[10px] font-medium text-gray-500 ml-2">
                  *(Format: ABC DE 12H)
                </span>
              </label>
              <div
                class="flex h-10 items-center overflow-hidden rounded-full border border-gray-300 bg-gray-100"
              >
                <div
                  class="ml-1 flex h-7 w-4 shrink-0 flex-col items-center justify-center rounded-[50px] bg-[#00339b]"
                >
                  <Icon icon="tabler:circle-dotted" class="size-3 text-[#FECD00]" />
                  <span class="text-[10px] font-bold text-white leading-none">D</span>
                </div>
                <div class="flex flex-1 h-full py-0.5 items-center px-1.5">
                  <input
                    v-model="city"
                    class="h-full w-full bg-white text-gray-800 rounded-full border border-gray-300 text-center text-sm font-bold uppercase outline-none placeholder:text-gray-400"
                    placeholder="ABC"
                    maxlength="3"
                  />
                </div>
                <div class="flex flex-col items-center gap-0.5 px-1 text-gray-300">
                  <Icon icon="cib:circle" class="w-2 h-2" />
                  <Icon icon="mdi:badge-outline" class="w-2.5 h-2.5" />
                </div>
                <div class="flex flex-1 h-full py-0.5 items-center px-1.5">
                  <input
                    v-model="district"
                    class="h-full w-full bg-white text-gray-800 rounded-full border border-gray-300 text-center text-sm font-bold uppercase outline-none placeholder:text-gray-400"
                    placeholder="DE"
                    maxlength="2"
                  />
                </div>
                <div class="flex flex-[1.4] h-full py-0.5 items-center px-1.5">
                  <input
                    v-model="number"
                    class="h-full w-full bg-white text-gray-800 rounded-full border border-gray-300 text-center text-sm font-bold uppercase outline-none placeholder:text-gray-400"
                    placeholder="12H"
                    maxlength="3"
                  />
                </div>
              </div>
              <p v-if="plateError" class="text-xs text-red-500">
                {{ plateError }}
              </p>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-black">
                FIN
                <span class="text-[10px] font-medium text-gray-500 ml-2">
                  *(seh. Fahrzeugschein Mitte oben)
                </span>
              </label>
              <input
                v-model="fin"
                class="h-10 rounded-full border border-gray-300 px-4 text-sm outline-none focus:border-emerald-500"
                placeholder="FIN eingeben"
                maxlength="17"
              />
              <p v-if="finError" class="text-xs text-red-500">
                {{ finError }}
              </p>
            </div>

            <div class="relative flex flex-col gap-1">
              <label class="text-sm font-semibold text-black"> Marke </label>
              <div
                class="flex h-10 cursor-pointer items-center justify-between rounded-full border border-gray-300 px-4 outline-none focus:border-emerald-500"
                tabindex="0"
                @click="
                  markeOpen = !markeOpen;
                  nutzerOpen = false;
                "
              >
                <span class="text-sm" :class="marke ? 'text-gray-800' : 'text-gray-400'">{{
                  marke || "Marke wählen"
                }}</span>
                <Icon icon="mdi:chevron-down" :class="markeIconClasses" />
              </div>
              <div
                v-if="markeOpen"
                class="absolute top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-lg"
              >
                <div
                  v-for="opt in markeOptions"
                  :key="opt"
                  class="flex h-9 cursor-pointer items-center px-4 text-sm text-gray-700 hover:bg-gray-50"
                  @click="
                    marke = opt;
                    markeOpen = false;
                  "
                >
                  {{ opt }}
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-black"> Modell </label>
              <input
                v-model="modell"
                class="h-10 rounded-full border border-gray-300 px-4 text-sm outline-none focus:border-emerald-500"
                placeholder="Modell eingeben"
              />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-black"> Leasingende </label>
              <div
                class="relative flex h-10 items-center rounded-full border border-gray-300 px-4 focus-within:border-emerald-500"
              >
                <input
                  v-model="leasingende"
                  type="date"
                  class="h-full w-full bg-transparent text-sm outline-none [&::-webkit-calendar-picker-indicator]:opacity-60"
                />
                <Icon
                  icon="mdi:calendar-outline"
                  class="absolute right-4 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-black">
                Leasinggeber
                <span class="text-[10px] font-medium text-gray-500 ml-2">*</span>
              </label>
              <input
                v-model="leasinggeber"
                class="h-10 rounded-full border border-gray-300 px-4 text-sm outline-none focus:border-emerald-500"
                placeholder="Leasinggeber eingeben"
              />
            </div>

            <div class="relative flex flex-col gap-1">
              <label class="text-sm font-semibold text-black"> Fahrzeugnutzer </label>
              <div
                class="flex h-10 cursor-pointer items-center justify-between rounded-full border border-gray-300 px-4 outline-none focus:border-emerald-500"
                tabindex="0"
                @click="
                  nutzerOpen = !nutzerOpen;
                  markeOpen = false;
                "
              >
                <span class="text-sm" :class="fahrzeugnutzer ? 'text-gray-800' : 'text-gray-400'">{{
                  fahrzeugnutzer || "Fahrzeugnutzer wählen"
                }}</span>
                <Icon icon="mdi:chevron-down" :class="nutzerIconClasses" />
              </div>
              <div
                v-if="nutzerOpen"
                class="absolute top-full z-50 mt-1 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-lg"
              >
                <span class="block px-4 py-2 text-sm text-gray-400">— Unbekannt —</span>
                <div
                  v-for="opt in nutzerOptions"
                  :key="opt"
                  class="flex h-9 cursor-pointer items-center px-4 text-sm text-gray-700 hover:bg-gray-50"
                  @click="
                    fahrzeugnutzer = opt;
                    nutzerOpen = false;
                  "
                >
                  {{ opt }}
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-black"> Rückgabestart </label>
              <div
                class="relative flex h-10 items-center rounded-full border border-gray-300 px-4 focus-within:border-emerald-500"
              >
                <input
                  v-model="rueckgabestart"
                  type="date"
                  class="h-full w-full bg-transparent text-sm outline-none [&::-webkit-calendar-picker-indicator]:opacity-60"
                />
                <Icon
                  icon="mdi:calendar-outline"
                  class="absolute right-4 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            <!-- Hidden per QA: dropdown was never functional and status is not part of the create payload
            <div class="relative flex flex-col gap-1">
              <label class="text-sm font-semibold text-black"> Status </label>
              <div
                class="flex h-10 cursor-pointer items-center justify-between rounded-full border border-gray-300 px-4 outline-none focus:border-emerald-500"
              >
                <span class="text-sm" :class="status ? 'text-gray-800' : 'text-gray-400'">{{
                  status || "Status wählen"
                }}</span>
                <Icon icon="mdi:chevron-down" class="text-gray-400" />
              </div>
            </div>
            -->
          </div>

          <div class="mt-8 flex justify-center">
            <button
              class="h-10 px-6 rounded-full text-base font-semibold text-white transition-all duration-200 shadow-lg"
              :style="buttonActive ? 'background: #EF8450;' : 'background: #D9D9D9;'"
              :disabled="!buttonActive || isLoading"
              @click="handleSubmit"
            >
              {{ isLoading ? "Wird gespeichert..." : "Bestätigen" }}
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
}

/* Background, border and notch mask live on a ::before backdrop: a mask on
   the card element itself clips all descendants, hiding overlays (e.g. the
   Marke dropdown) where they overflow the card. */
.inverted-corner::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: #fff;
  border: 1px solid #c6c6cd;
  border-radius: var(--r);
}

.inverted-corner-top-right::before {
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

.inverted-corner-top-left::before {
  --_m: /calc(2 * var(--r)) calc(2 * var(--r)) radial-gradient(#000 70%, #0000 72%);
  --_g: conic-gradient(at var(--r) var(--r), #000 75%, #0000 0);
  --_d: (var(--s) + var(--r));

  mask:
    calc(var(--_d) + var(--x)) 0 var(--_m),
    0 calc(var(--_d) + var(--y)) var(--_m),
    radial-gradient(var(--s) at 0 0, #0000 99%, #000 calc(100% + 1px)) calc(var(--r) + var(--x))
      calc(var(--r) + var(--y)),
    var(--_g) calc(var(--_d) + var(--x)) 0,
    var(--_g) 0 calc(var(--_d) + var(--y));
  mask-repeat: no-repeat;
}

.inverted-corner-bottom-right::before {
  --_m: /calc(2 * var(--r)) calc(2 * var(--r)) radial-gradient(#000 70%, #0000 72%);
  --_g: conic-gradient(
    from 90deg at calc(100% - var(--r)) calc(100% - var(--r)),
    #0000 25%,
    #000 0
  );
  --_d: (var(--s) + var(--r));

  mask:
    calc(100% - var(--_d) - var(--x)) 100% var(--_m),
    100% calc(100% - var(--_d) - var(--y)) var(--_m),
    radial-gradient(var(--s) at 100% 100%, #0000 99%, #000 calc(100% + 1px))
      calc(-1 * var(--r) - var(--x)) calc(-1 * var(--r) - var(--y)),
    var(--_g) calc(-1 * var(--_d) - var(--x)) 0,
    var(--_g) 0 calc(-1 * var(--_d) - var(--y));
  mask-repeat: no-repeat;
}

.inverted-corner-bottom-left::before {
  --_m: /calc(2 * var(--r)) calc(2 * var(--r)) radial-gradient(#000 70%, #0000 72%);
  --_g: conic-gradient(from 180deg at var(--r) calc(100% - var(--r)), #0000 25%, #000 0);
  --_d: (var(--s) + var(--r));

  mask:
    calc(var(--_d) + var(--x)) 100% var(--_m),
    0 calc(100% - var(--_d) - var(--y)) var(--_m),
    radial-gradient(var(--s) at 0 100%, #0000 99%, #000 calc(100% + 1px)) calc(var(--r) + var(--x))
      calc(-1 * var(--r) - var(--y)),
    var(--_g) calc(var(--_d) + var(--x)) 0,
    var(--_g) 0 calc(-1 * var(--_d) - var(--y));
  mask-repeat: no-repeat;
}
</style>
