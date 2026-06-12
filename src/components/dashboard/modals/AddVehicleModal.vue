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
  "text-[40px] text-primary transition-transform duration-200",
  markeOpen.value ? "rotate-180" : "rotate-0",
]);
const nutzerIconClasses = computed(() => [
  "text-[40px] text-primary transition-transform duration-200",
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
    <DialogContent class="p-0 gap-0">
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
        <Button
          type="button"
          variant="secondary"
          @click="showProfileDialog = false"
        >
          Abbrechen
        </Button>
        <Button type="button" @click="goToAccount">
          Zur Kontoeinstellungen
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Dialog
    :open="open && !showProfileDialog"
    @update:open="emit('update:open', $event)"
  >
    <DialogContent
      class="p-0 gap-0 overflow-visible"
      style="
        width: 700px;
        max-width: 700px;
        border-radius: 5px;
        border: 1px solid #ececec;
      "
      :show-close-button="false"
    >
      <div
        class="flex h-12.5 items-center justify-between px-9 max-w-175"
        style="background-color: #fafafa; border-bottom: 1px solid #b7c2c2"
      >
        <span class="text-[20px] font-bold" style="color: #10393b">{{
          isEditMode ? "Fahrzeug bearbeiten" : "Neues Fahrzeug"
        }}</span>
        <button @click="close" class="transition-opacity hover:opacity-60">
          <Icon icon="mdi:close" class="size-5" style="color: #b7c2c2" />
        </button>
      </div>

      <p class="px-9 pt-5 text-[16px]" style="color: #000">
        {{
          isEditMode
            ? "Bearbeiten Sie die Fahrzeugdaten im Formular unten."
            : "Legen Sie ganz einfach ein neues Fahrzeug an – bitte füllen Sie dafür alle Angaben im Formular unten aus"
        }}
      </p>

      <div class="flex gap-8 px-8 pb-6 pt-4">
        <div class="flex w-77 flex-col gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-[16px] font-bold text-black">
              Kennzeichen
              <span class="text-[10px] font-bold ml-3 text-custom-black">
                *(Format: ABC DE 1234)
              </span>
            </label>
            <div
              class="flex h-9 items-center rounded-[5px] border"
              style="background: #ececec; border-color: #b7c2c2"
            >
              <div
                class="flex h-full w-5.5 shrink-0 flex-col items-center justify-center rounded-l-[4px]"
                style="background: #00339b"
              >
                <Icon
                  icon="tabler:circle-dotted"
                  class="size-6 text-[#FECD00]"
                />
                <span class="text-[14px] font-bold text-white leading-none"
                  >D</span
                >
              </div>
              <div
                class="flex flex-1 h-full items-center border-x"
                style="border-color: #b7c2c2; background: #fafafa"
              >
                <input
                  v-model="city"
                  class="h-full w-full bg-transparent px-1 text-center text-[16px] font-extrabold uppercase outline-none"
                  style="color: #1f2937"
                  placeholder="ABC"
                  maxlength="3"
                />
              </div>
              <div class="p-1 flex flex-col gap-1">
                <Icon icon="cib:circle" class="w-3 h-3 text-custom-black" />
                <Icon
                  icon="mdi:badge-outline"
                  class="w-3.5 h-3.5 text-custom-black"
                />
              </div>
              <div
                class="flex flex-1 h-full items-center border-r"
                style="border-color: #b7c2c2; background: #fafafa"
              >
                <input
                  v-model="district"
                  class="h-full w-full bg-transparent px-1 text-center text-[16px] font-extrabold uppercase outline-none"
                  style="color: #1f2937"
                  placeholder="DE"
                  maxlength="2"
                />
              </div>
              <div
                class="flex h-full flex-1 items-center"
                style="background: #fafafa"
              >
                <input
                  v-model="number"
                  class="h-full w-full bg-transparent px-1 text-center text-[16px] font-extrabold uppercase outline-none"
                  style="color: #1f2937"
                  placeholder="1234"
                  maxlength="3"
                />
              </div>
            </div>

            <p v-if="plateError" class="mt-1 text-xs text-red-500">
              {{ plateError }}
            </p>
          </div>

          <div class="relative flex flex-col gap-1">
            <label class="text-[16px] font-bold" style="color: #000">
              Marke
            </label>
            <div
              class="flex h-9.25 cursor-pointer items-center justify-between rounded-[5px] border px-2"
              style="border-color: #b7c2c2"
              @click="
                markeOpen = !markeOpen;
                nutzerOpen = false;
              "
            >
              <span
                class="text-[14px]"
                :style="marke ? 'color:#000' : 'color:#B7C2C2'"
                >{{ marke || "Marke wählen" }}</span
              >
              <Icon icon="ic:round-arrow-drop-down" :class="markeIconClasses" />
            </div>
            <div
              v-if="markeOpen"
              class="absolute top-full z-50 mt-1 max-h-37.5 w-full overflow-y-auto rounded-[5px] border bg-white shadow-md"
              style="border-color: #b7c2c2"
            >
              <div
                v-for="opt in markeOptions"
                :key="opt"
                class="flex h-7.5 cursor-pointer items-center px-2 text-[14px] hover:bg-gray-50"
                style="color: #000"
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
            <label class="text-[16px] font-bold" style="color: #000">
              Modell
            </label>
            <input
              v-model="modell"
              class="h-9.25 rounded-[5px] border px-2 text-[14px] outline-none"
              style="border-color: #b7c2c2; color: #000"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-[16px] font-bold" style="color: #000">
              Leasingende
            </label>
            <div
              class="relative flex h-9.25 items-center rounded-[5px] border"
              style="border-color: #b7c2c2"
            >
              <input
                v-model="leasingende"
                type="date"
                class="h-full w-full rounded-[5px] bg-transparent px-2 text-[14px] outline-none"
                style="color: #000"
              />
            </div>
          </div>
        </div>

        <div class="flex w-77 flex-col gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-[16px] font-bold text-black">
              FIN
              <span class="text-[10px] font-bold ml-3 text-custom-black">
                *(seh. Fahrzeugschein Mitte oben)
              </span>
            </label>
            <input
              v-model="fin"
              class="h-9.25 rounded-[5px] border px-2 text-[14px] outline-none"
              style="border-color: #b7c2c2; color: #000"
              maxlength="17"
            />
            <p v-if="finError" class="mt-1 text-xs text-red-500">
              {{ finError }}
            </p>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-[16px] font-bold" style="color: #000">
              Rückgabestart
            </label>
            <input
              v-model="rueckgabestart"
              type="date"
              class="h-9.25 rounded-[5px] border px-2 text-[14px] outline-none"
              style="border-color: #b7c2c2; color: #000"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-[16px] font-bold" style="color: #000">
              Status
            </label>
            <input
              v-model="status"
              class="h-9.25 rounded-[5px] border px-2 text-[14px] outline-none"
              style="border-color: #b7c2c2; color: #000"
              placeholder="Status"
            />
          </div>

          <div class="relative flex flex-col gap-1">
            <label class="text-[16px] font-bold" style="color: #000">
              Fahrzeugnutzer
            </label>
            <div
              class="flex h-9.25 cursor-pointer items-center justify-between rounded-[5px] border px-2"
              style="border-color: #b7c2c2"
              @click="
                nutzerOpen = !nutzerOpen;
                markeOpen = false;
              "
            >
              <span
                class="text-[14px]"
                :style="fahrzeugnutzer ? 'color:#000' : 'color:#B7C2C2'"
                >{{ fahrzeugnutzer || "Nutzer wählen" }}</span
              >
              <Icon
                icon="ic:round-arrow-drop-down"
                :class="nutzerIconClasses"
              />
            </div>
            <div
              v-if="nutzerOpen"
              class="absolute top-full z-50 mt-1 w-full rounded-[5px] border overflow-y-auto bg-white shadow-md"
              style="border-color: #b7c2c2"
            >
              <span class="px-2 text-[14px]">— Unbekannt —</span>
              <div
                v-for="opt in nutzerOptions"
                :key="opt"
                class="flex h-7.5 cursor-pointer items-center px-2 text-[14px] hover:bg-gray-50"
                style="color: #000"
                @click="
                  fahrzeugnutzer = opt;
                  nutzerOpen = false;
                "
              >
                {{ opt }}
              </div>
            </div>
          </div>

          <div class="mt-auto flex justify-end pt-4">
            <button
              class="h-7.5 w-37.5 rounded-[5px] text-[14px] font-bold text-white transition-opacity"
              :style="
                buttonActive ? 'background:#EF8450' : 'background:#B7C2C2'
              "
              :disabled="
                !buttonActive ||
                vehicleStore.isLoading ||
                b2bVehicleStore.isLoading
              "
              @click="handleSubmit"
            >
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
