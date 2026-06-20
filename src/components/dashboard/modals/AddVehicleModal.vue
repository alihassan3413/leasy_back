<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Icon } from "@iconify/vue";
import { useRouter } from "vue-router";
import type { Vehicle } from "../vehicle.types";
import { useVehicleStore } from "@/stores/vehicle.store";
import { useB2BVehicleStore } from "@/stores/b2bVehicle.store";
import { useB2BStore } from "@/stores/b2b.store";
import { useAuthStore } from "@/stores/auth.store";
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
  vehicle?: Vehicle;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  submit: [data: Partial<Vehicle>];
}>();

const vehicleStore = useVehicleStore();
const b2bVehicleStore = useB2BVehicleStore();
const b2bStore = useB2BStore();
const authStore = useAuthStore();
const router = useRouter();

const showProfileDialog = ref(false);

const city = ref("");
const district = ref("");
const number = ref("");
const marke = ref("");
const modell = ref("");
const leasingende = ref("");
const fin = ref("");
const rueckgabestart = ref("");
const status = ref("");
const fahrzeugnutzer = ref("");

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

const isEditMode = computed(() => !!props.vehicle);

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
  async (opened) => {
    if (!opened) return;
    if (props.vehicle) {
      const parts = props.vehicle.licensePlate?.split(" ") ?? [];
      city.value = parts[0] ?? "";
      district.value = parts[1] ?? "";
      number.value = parts[2] ?? "";
      marke.value = props.vehicle.brand ?? "";
      modell.value = props.vehicle.model ?? "";
      leasingende.value = props.vehicle.leaseEnd ?? "";
      fin.value = props.vehicle.fin ?? "";
      rueckgabestart.value = props.vehicle.returnStart ?? "";
      status.value = props.vehicle.status ?? "";
      fahrzeugnutzer.value = props.vehicle.driver ?? "";
    } else {
      city.value = district.value = number.value = "";
      marke.value = modell.value = leasingende.value = "";
      fin.value =
        rueckgabestart.value =
        status.value =
        fahrzeugnutzer.value =
        "";
    }
    isDirty.value = false;

    if (!isEditMode.value && authStore.user?.role === "B2B") {
      if (!b2bStore.profile) {
        await b2bStore.fetchProfile();
      }
      if (!b2bStore.profile) {
        showProfileDialog.value = true;
      }
    }
  },
);

const isDirty = ref(false);
watch(
  [
    city,
    district,
    number,
    marke,
    modell,
    leasingende,
    fin,
    rueckgabestart,
    status,
    fahrzeugnutzer,
  ],
  () => {
    if (props.open && isEditMode.value) isDirty.value = true;
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
    plateError.value === "" &&
    finError.value === ""
  );
});

const buttonActive = computed(() => {
  if (isEditMode.value) return isDirty.value && isFormValid.value;
  return isFormValid.value;
});

function close() {
  emit("update:open", false);
}

function goToAccount() {
  showProfileDialog.value = false;
  close();
  router.push({ name: "b2b-account" });
}

async function handleSubmit() {
  if (!isEditMode.value && authStore.user?.role === "B2B") {
    if (!b2bStore.profile) {
      showProfileDialog.value = true;
      return;
    }
  }

  const payload = {
    license_plate: `${city.value} ${district.value} ${number.value}`
      .trim()
      .toUpperCase(),
    make: marke.value,
    model: modell.value,
    leasing_end_date: leasingende.value,
    vin: fin.value.trim().toUpperCase(),
    first_registration_date: rueckgabestart.value,
  };

  console.log("Submitting Vehicle Payload:", payload);

  try {
    if (!isEditMode.value) {
      if (authStore.user?.role === "B2B") {
        await b2bVehicleStore.addVehicle(payload);
      } else {
        await vehicleStore.addVehicle(payload);
        if (authStore.user?.id) {
          await vehicleStore.fetchVehicles(authStore.user.id);
        }
      }
    } else {
      emit("submit", {
        licensePlate: payload.license_plate,
        brand: marke.value,
        model: modell.value,
        leaseEnd: leasingende.value,
        vin: fin.value,
        returnStart: rueckgabestart.value,
        status: status.value,
        driver: fahrzeugnutzer.value,
      });
    }
    close();
  } catch (error) {
    console.error("Error submitting vehicle:", error);
  }
}
</script>

<template>
  <Dialog :open="showProfileDialog" @update:open="showProfileDialog = $event">
    <DialogContent class="p-0 gap-0 rounded-2xl">
      <DialogHeader class="px-6 py-4 border-b border-gray-100">
        <DialogTitle class="text-xl font-bold text-[#10393B]">
          Kontodaten fehlen
        </DialogTitle>
        <DialogDescription class="text-[15px] text-gray-600">
          Um ein Fahrzeug anzulegen, müssen Sie zuerst Ihre Kontodaten
          (Firmeninformationen und Ansprechpartner) vervollständigen.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter class="px-6 py-4 flex gap-3 justify-end">
        <Button type="button" variant="secondary" @click="showProfileDialog = false">
          Abbrechen
        </Button>
        <Button type="button" @click="goToAccount">
          Zur Kontoeinstellungen
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Dialog :open="open && !showProfileDialog" @update:open="emit('update:open', $event)">
    <DialogContent class="p-0 gap-0 overflow-visible bg-transparent border-none shadow-none rounded-none"
      style="width: 100%; max-width: 720px" :show-close-button="false">
      <div class="relative px-3 md:px-0">
        <button @click="close"
          class="absolute -right-1 -top-1 md:-right-1 md:-top-1 z-10 flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md transition-colors hover:bg-emerald-600">
          <Icon icon="mdi:close" class="size-6 md:size-8" />
        </button>

        <div class="bg-white border border-[#C6C6CD] p-3 md:p-5 inverted-corner inverted-corner-top-right"
          style="filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.15))">
          <div class="px-2 pt-1 mb-3">
            <h2 class="text-[18px] md:text-[22px] font-bold leading-normal text-black pr-8 md:pr-0">
              {{ isEditMode ? "Fahrzeug bearbeiten" : "Neues Fahrzeug" }}
            </h2>
            <p class="mt-1 pb-3 text-xs md:text-sm font-light leading-normal not-italic text-[#00000080]">
              {{
                isEditMode
                  ? "Bearbeiten Sie die Fahrzeugdaten im Formular unten."
                  : "Please fill in all the details in the form below."
              }}
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-black">
                Kennzeichen
                <span class="text-[10px] font-medium text-gray-500 ml-2">
                  *(Format: ABC DE 1234)
                </span>
              </label>
              <div class="flex h-9 items-center overflow-hidden rounded-full border border-gray-300 bg-gray-100">
                <div
                  class="ml-1 flex h-6 w-4 shrink-0 flex-col items-center justify-center rounded-[50px] bg-[#00339b]">
                  <Icon icon="tabler:circle-dotted" class="size-2.5 text-[#FECD00]" />
                  <span class="text-[9px] font-bold text-white leading-none">D</span>
                </div>
                <div class="flex flex-1 h-full py-0.5 items-center px-1.5">
                  <input v-model="city"
                    class="h-full w-full bg-white text-gray-800 rounded-full border border-gray-300 text-center text-sm font-bold uppercase outline-none placeholder:text-gray-400"
                    placeholder="ABC" maxlength="3" />
                </div>
                <div class="flex flex-col items-center gap-0.5 px-1 text-gray-300">
                  <Icon icon="cib:circle" class="w-1.5 h-1.5" />
                  <Icon icon="mdi:badge-outline" class="w-2 h-2" />
                </div>
                <div class="flex flex-1 h-full py-0.5 items-center px-1.5">
                  <input v-model="district"
                    class="h-full w-full bg-white text-gray-800 rounded-full border border-gray-300 text-center text-sm font-bold uppercase outline-none placeholder:text-gray-400"
                    placeholder="DE" maxlength="2" />
                </div>
                <div class="flex flex-[1.4] h-full py-0.5 items-center px-1.5">
                  <input v-model="number"
                    class="h-full w-full bg-white text-gray-800 rounded-full border border-gray-300 text-center text-sm font-bold uppercase outline-none placeholder:text-gray-400"
                    placeholder="12H" maxlength="3" />
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
              <input v-model="fin"
                class="h-9 rounded-full border border-gray-300 px-4 text-sm outline-none focus:border-emerald-500"
                placeholder="FIN eingeben" maxlength="17" />
              <p v-if="finError" class="text-xs text-red-500">
                {{ finError }}
              </p>
            </div>

            <div class="relative flex flex-col gap-1">
              <label class="text-sm font-semibold text-black"> Marke </label>
              <div
                class="flex h-9 cursor-pointer items-center justify-between rounded-full border border-gray-300 px-4 outline-none focus:border-emerald-500"
                tabindex="0" @click="
                  markeOpen = !markeOpen;
                nutzerOpen = false;
                ">
                <span class="text-sm" :class="marke ? 'text-gray-800' : 'text-gray-400'">{{ marke || "Marke wählen"
                }}</span>
                <Icon icon="mdi:chevron-down" :class="markeIconClasses" />
              </div>
              <div v-if="markeOpen"
                class="absolute top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-lg">
                <div v-for="opt in markeOptions" :key="opt"
                  class="flex h-9 cursor-pointer items-center px-4 text-sm text-gray-700 hover:bg-gray-50" @click="
                    marke = opt;
                  markeOpen = false;
                  ">
                  {{ opt }}
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-black"> Modell </label>
              <input v-model="modell"
                class="h-9 rounded-full border border-gray-300 px-4 text-sm outline-none focus:border-emerald-500"
                placeholder="Modell eingeben" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-black">
                Leasingende
              </label>
              <div
                class="relative flex h-9 items-center rounded-full border border-gray-300 px-4 focus-within:border-emerald-500">
                <input v-model="leasingende" type="date"
                  class="h-full w-full bg-transparent text-sm outline-none [&::-webkit-calendar-picker-indicator]:opacity-60" />
                <Icon icon="mdi:calendar-outline" class="absolute right-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div class="relative flex flex-col gap-1">
              <label class="text-sm font-semibold text-black">
                Fahrzeugnutzer
              </label>
              <div
                class="flex h-9 cursor-pointer items-center justify-between rounded-full border border-gray-300 px-4 outline-none focus:border-emerald-500"
                tabindex="0" @click="
                  nutzerOpen = !nutzerOpen;
                markeOpen = false;
                ">
                <span class="text-sm" :class="fahrzeugnutzer ? 'text-gray-800' : 'text-gray-400'">{{ fahrzeugnutzer ||
                  "Fahrzeugnutzer wählen" }}</span>
                <Icon icon="mdi:chevron-down" :class="nutzerIconClasses" />
              </div>
              <div v-if="nutzerOpen"
                class="absolute top-full z-50 mt-1 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-lg">
                <span class="block px-4 py-2 text-sm text-gray-400">— Unbekannt —</span>
                <div v-for="opt in nutzerOptions" :key="opt"
                  class="flex h-9 cursor-pointer items-center px-4 text-sm text-gray-700 hover:bg-gray-50" @click="
                    fahrzeugnutzer = opt;
                  nutzerOpen = false;
                  ">
                  {{ opt }}
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-black">
                Rückgabestart
              </label>
              <div
                class="relative flex h-9 items-center rounded-full border border-gray-300 px-4 focus-within:border-emerald-500">
                <input v-model="rueckgabestart" type="date"
                  class="h-full w-full bg-transparent text-sm outline-none [&::-webkit-calendar-picker-indicator]:opacity-60" />
                <Icon icon="mdi:calendar-outline" class="absolute right-4 text-gray-400" />
              </div>
            </div>

            <div class="relative flex flex-col gap-1">
              <label class="text-sm font-semibold text-black"> Status </label>
              <div
                class="flex h-9 cursor-pointer items-center justify-between rounded-full border border-gray-300 px-4 outline-none focus:border-emerald-500">
                <span class="text-sm" :class="status ? 'text-gray-800' : 'text-gray-400'">{{ status || "Status wählen"
                }}</span>
                <Icon icon="mdi:chevron-down" class="text-gray-400" />
              </div>
            </div>
          </div>

          <div class="mt-8 flex justify-center">
            <button
              class="h-9 w-full md:w-auto px-6 rounded-full text-base font-semibold text-white transition-all duration-200 shadow-lg"
              :style="buttonActive ? 'background: #EF8450;' : 'background: #D9D9D9;'
                " :disabled="!buttonActive ||
                  vehicleStore.isLoading ||
                  b2bVehicleStore.isLoading
                  " @click="handleSubmit">
              {{
                vehicleStore.isLoading || b2bVehicleStore.isLoading
                  ? "Wird gespeichert..."
                  : "Bestätigen"
              }}
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
  --_m: /calc(2 * var(--r)) calc(2 * var(--r)) radial-gradient(#000 70%, #0000 0%);
  --_g: conic-gradient(at calc(100% - var(--r)) var(--r), #0000 25%, #000 0);
  --_d: (var(--s) + var(--r));

  mask:
    calc(100% - var(--_d) - var(--x)) 0 var(--_m),
    100% calc(var(--_d) + var(--y)) var(--_m),
    radial-gradient(var(--s) at 100% 0, #0000 99%, #000 calc(100% + 0.5px)) calc(-1 * var(--r) - var(--x)) calc(var(--r) + var(--y)),
    var(--_g) calc(-1 * var(--_d) - var(--x)) 0,
    var(--_g) 0 calc(var(--_d) + var(--y));
  mask-repeat: no-repeat;
}

.inverted-corner-top-left {
  --_m: /calc(2 * var(--r)) calc(2 * var(--r)) radial-gradient(#000 70%, #0000 72%);
  --_g: conic-gradient(at var(--r) var(--r), #000 75%, #0000 0);
  --_d: (var(--s) + var(--r));

  mask:
    calc(var(--_d) + var(--x)) 0 var(--_m),
    0 calc(var(--_d) + var(--y)) var(--_m),
    radial-gradient(var(--s) at 0 0, #0000 99%, #000 calc(100% + 1px)) calc(var(--r) + var(--x)) calc(var(--r) + var(--y)),
    var(--_g) calc(var(--_d) + var(--x)) 0,
    var(--_g) 0 calc(var(--_d) + var(--y));
  mask-repeat: no-repeat;
}

.inverted-corner-bottom-right {
  --_m: /calc(2 * var(--r)) calc(2 * var(--r)) radial-gradient(#000 70%, #0000 72%);
  --_g: conic-gradient(from 90deg at calc(100% - var(--r)) calc(100% - var(--r)),
      #0000 25%,
      #000 0);
  --_d: (var(--s) + var(--r));

  mask:
    calc(100% - var(--_d) - var(--x)) 100% var(--_m),
    100% calc(100% - var(--_d) - var(--y)) var(--_m),
    radial-gradient(var(--s) at 100% 100%, #0000 99%, #000 calc(100% + 1px)) calc(-1 * var(--r) - var(--x)) calc(-1 * var(--r) - var(--y)),
    var(--_g) calc(-1 * var(--_d) - var(--x)) 0,
    var(--_g) 0 calc(-1 * var(--_d) - var(--y));
  mask-repeat: no-repeat;
}

.inverted-corner-bottom-left {
  --_m: /calc(2 * var(--r)) calc(2 * var(--r)) radial-gradient(#000 70%, #0000 72%);
  --_g: conic-gradient(from 180deg at var(--r) calc(100% - var(--r)),
      #0000 25%,
      #000 0);
  --_d: (var(--s) + var(--r));

  mask:
    calc(var(--_d) + var(--x)) 100% var(--_m),
    0 calc(100% - var(--_d) - var(--y)) var(--_m),
    radial-gradient(var(--s) at 0 100%, #0000 99%, #000 calc(100% + 1px)) calc(var(--r) + var(--x)) calc(-1 * var(--r) - var(--y)),
    var(--_g) calc(var(--_d) + var(--x)) 0,
    var(--_g) 0 calc(-1 * var(--_d) - var(--y));
  mask-repeat: no-repeat;
}
</style>
