<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Icon } from "@iconify/vue";
import type { Vehicle } from "../vehicle.types";
import { useVehicleStore } from "@/stores/vehicle.store";
import { useAuthStore } from "@/stores/auth.store";

const props = defineProps<{
  open: boolean;
  vehicle?: Vehicle; // if provided → edit mode
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  submit: [data: Partial<Vehicle>];
}>();

const vehicleStore = useVehicleStore();
const authStore = useAuthStore();

// ── Form state ──────────────────────────────────────────────────────────────
const city    = ref('')
const district = ref('')
const number  = ref('')
const marke   = ref('')
const modell  = ref('')
const leasingende = ref('')
const fin     = ref('')
const rueckgabestart = ref('')
const status  = ref('')
const fahrzeugnutzer = ref('')

// Dropdown open states
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
];
const nutzerOptions = ["Christin Mechtild", "Thorsten Jung", "Marcus Dietrich"];

// ── Edit vs Add mode ─────────────────────────────────────────────────────────
const isEditMode = computed(() => !!props.vehicle);

const markeIconClasses = computed(() => [
  "text-[40px] text-primary transition-transform duration-200",
  markeOpen.value ? "rotate-180" : "rotate-0",
]);
const nutzerIconClasses = computed(() => [
  "text-[40px] text-primary transition-transform duration-200",
  nutzerOpen.value ? "rotate-180" : "rotate-0",
]);

// When modal opens, populate fields from vehicle (edit) or clear (add)
watch(
  () => props.open,
  (opened) => {
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
  },
);

// ── Dirty tracking (edit mode button activation) ─────────────────────────────
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

const isFormValid = computed(() => {
  return (
    city.value.trim() !== "" &&
    number.value.trim() !== "" &&
    marke.value.trim() !== "" &&
    modell.value.trim() !== "" &&
    leasingende.value !== "" &&
    rueckgabestart.value !== "" &&
    fin.value.trim() !== ""
  );
});

const buttonActive = computed(() => {
  if (isEditMode.value) return isDirty.value && isFormValid.value;
  return isFormValid.value;
});

function close() {
  emit("update:open", false);
}

async function handleSubmit() {
  const payload = {
    license_plate: `${city.value} ${district.value} ${number.value}`
      .trim()
      .toUpperCase(),
    make: marke.value,
    model: modell.value,
    leasing_end_date: leasingende.value,
    vin: fin.value.trim().toUpperCase(),
    first_registration_date: rueckgabestart.value, // Mapping Rückgabestart to first_registration_date
  };

  console.log("Submitting Vehicle Payload:", payload);

  try {
    if (!isEditMode.value) {
      await vehicleStore.addVehicle(payload);
      // If we have a user ID, refresh the list
      if (authStore.user?.id) {
        await vehicleStore.fetchVehicles(authStore.user.id);
      }
    } else {
      // Handle edit mode if needed (API not provided yet)
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
  <Dialog :open="open" @update:open="emit('update:open', $event)">
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
      <!-- Header -->
      <div
        class="flex h-[50px] items-center justify-between px-9 max-w-[700px]"
        style="background-color: #fafafa; border-bottom: 1px solid #b7c2c2"
      >
        <span class="text-[20px] font-bold" style="color: #10393b">{{
          isEditMode ? "Fahrzeug bearbeiten" : "Neues Fahrzeug"
        }}</span>
        <button @click="close" class="transition-opacity hover:opacity-60">
          <Icon icon="mdi:close" class="size-5" style="color: #b7c2c2" />
        </button>
      </div>

      <!-- Description -->
      <p class="px-9 pt-5 text-[16px]" style="color: #000">
        {{
          isEditMode
            ? "Bearbeiten Sie die Fahrzeugdaten im Formular unten."
            : "Legen Sie ganz einfach ein neues Fahrzeug an – bitte füllen Sie dafür alle Angaben im Formular unten aus"
        }}
      </p>

      <!-- Form — 2 columns -->
      <div class="flex gap-8 px-8 pb-6 pt-4">
        <!-- Left column -->
        <div class="flex w-[308px] flex-col gap-4">
          <!-- Kennzeichen -->
          <div class="flex flex-col gap-1">
            <label class="text-[16px] font-bold text-black"
              >Kennzeichen
              <span class="text-[10px] font-bold ml-3 text-custom-black"
                >*(Format: ABC DE 1234)</span
              >
            </label>
            <!-- German plate widget -->
            <div
              class="flex h-[36px] items-center rounded-[5px] border"
              style="background: #ececec; border-color: #b7c2c2"
            >
              <!-- EU blue strip -->
              <div
                class="flex h-full w-[22px] shrink-0 flex-col items-center justify-center rounded-l-[4px]"
                style="background: #00339b"
              >
                <span class="text-[8px] font-bold text-white leading-none mb-1"
                  >★</span
                >
                <span class="text-[14px] font-bold text-white leading-none"
                  >D</span
                >
              </div>
              <!-- City -->
              <div
                class="flex flex-1 h-full items-center border-x"
                style="border-color: #b7c2c2; background: #fafafa"
              >
                <input
                  v-model="city"
                  class="h-full w-full bg-transparent px-1 text-center text-[16px] font-extrabold uppercase outline-none"
                  style="color: #b7c2c2"
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
              <!-- District -->
              <div
                class="flex flex-1 h-full items-center border-r"
                style="border-color: #b7c2c2; background: #fafafa"
              >
                <input
                  v-model="district"
                  class="h-full w-full bg-transparent px-1 text-center text-[16px] font-extrabold uppercase outline-none"
                  style="color: #b7c2c2"
                  placeholder="DE"
                  maxlength="2"
                />
              </div>
              <!-- Number -->
              <div
                class="flex h-full flex-1 items-center"
                style="background: #fafafa"
              >
                <input
                  v-model="number"
                  class="h-full w-full bg-transparent px-1 text-center text-[16px] font-extrabold uppercase outline-none"
                  style="color: #b7c2c2"
                  placeholder="1234"
                  maxlength="5"
                />
              </div>
            </div>
          </div>

          <!-- Marke (dropdown) -->
          <div class="relative flex flex-col gap-1">
            <label class="text-[16px] font-bold" style="color: #000"
              >Marke</label
            >
            <div
              class="flex h-[37px] cursor-pointer items-center justify-between rounded-[5px] border px-2"
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
              class="absolute top-full z-50 mt-1 max-h-[150px] w-full overflow-y-auto rounded-[5px] border bg-white shadow-md"
              style="border-color: #b7c2c2"
            >
              <div
                v-for="opt in markeOptions"
                :key="opt"
                class="flex h-[30px] cursor-pointer items-center px-2 text-[14px] hover:bg-gray-50"
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

          <!-- Modell -->
          <div class="flex flex-col gap-1">
            <label class="text-[16px] font-bold" style="color: #000"
              >Modell</label
            >
            <input
              v-model="modell"
              class="h-[37px] rounded-[5px] border px-2 text-[14px] outline-none"
              style="border-color: #b7c2c2; color: #000"
            />
          </div>

          <!-- Leasingende -->
          <div class="flex flex-col gap-1">
            <label class="text-[16px] font-bold" style="color: #000"
              >Leasingende</label
            >
            <div
              class="relative flex h-[37px] items-center rounded-[5px] border"
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

        <!-- Right column -->
        <div class="flex w-[308px] flex-col gap-4">
          <!-- FIN -->
          <div class="flex flex-col gap-1">
            <label class="text-[16px] font-bold text-black"
              >FIN
              <span class="text-[10px] font-bold ml-3 text-custom-black"
                >*(seh. Fahrzeugschein Mitte oben)</span
              >
            </label>
            <input
              v-model="fin"
              class="h-[37px] rounded-[5px] border px-2 text-[14px] outline-none"
              style="border-color: #b7c2c2; color: #000"
            />
          </div>

          <!-- Rückgabestart -->
          <div class="flex flex-col gap-1">
            <label class="text-[16px] font-bold" style="color: #000"
              >Rückgabestart</label
            >
            <input
              v-model="rueckgabestart"
              type="date"
              class="h-[37px] rounded-[5px] border px-2 text-[14px] outline-none"
              style="border-color: #b7c2c2; color: #000"
            />
          </div>

          <!-- Status -->
          <div class="flex flex-col gap-1">
            <label class="text-[16px] font-bold" style="color: #000"
              >Status</label
            >
            <input
              v-model="status"
              class="h-[37px] rounded-[5px] border px-2 text-[14px] outline-none"
              style="border-color: #b7c2c2; color: #000"
              placeholder="Status"
            />
          </div>

          <!-- Fahrzeugnutzer (dropdown) -->
          <div class="relative flex flex-col gap-1">
            <label class="text-[16px] font-bold" style="color: #000"
              >Fahrzeugnutzer</label
            >
            <div
              class="flex h-[37px] cursor-pointer items-center justify-between rounded-[5px] border px-2"
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
                class="flex h-[30px] cursor-pointer items-center px-2 text-[14px] hover:bg-gray-50"
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

          <!-- Bestätigen button — right-aligned, bottom -->
          <div class="mt-auto flex justify-end pt-4">
            <button
              class="h-[30px] w-[150px] rounded-[5px] text-[14px] font-bold text-white transition-opacity"
              :style="
                buttonActive ? 'background:#EF8450' : 'background:#B7C2C2'
              "
              :disabled="!buttonActive || vehicleStore.isLoading"
              @click="handleSubmit"
            >
              {{ vehicleStore.isLoading ? "Lädt..." : "Bestätigen" }}
            </button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
