<script setup lang="ts">
import { ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useField, useForm } from "vee-validate";

import Button from "@/components/ui/Button.vue";
import AppModal from "@/components/ui/AppModal.vue";
import CalendarDateField from "@/components/ui/form/CalendarDateField.vue";
import AppMapPicker from "@/components/ui/AppMapPicker.vue";
import FormSelectField from "@/components/ui/form/B2CSelectField.vue";

import { appointmentSchema } from "@/validations/b2c/appointment.schema";
import { useB2CRegistrationStore } from "@/stores/b2cRegistration.store";
import { useBranches } from "@/composables/useBranches";
import type { AppointmentData } from "@/stores/b2cRegistration.store";

const emit = defineEmits<{
  next: [];
  back: [];
}>();

const store = useB2CRegistrationStore();
const showConflictDialog = ref(false);

const uhrzeitOptions = [
  { value: "10:30", label: "10:30 Uhr" },
  { value: "11:00", label: "11:00 Uhr" },
  { value: "13:30", label: "13:30 Uhr" },
  { value: "15:00", label: "15:00 Uhr" },
];

const { handleSubmit } = useForm<AppointmentData>({
  validationSchema: appointmentSchema,
  initialValues: store.appointmentData,
});

const { value: stadt } = useField<string>("stadt");
const { value: uhrzeit } = useField<string>("uhrzeit");
const { value: service } = useField<"tuvsud" | "dekra">("service");

const { stadtOptions, allBranches, selectedBranch, geocodeBranch } =
  useBranches(stadt, service);

const stationOpen = ref(false);
const selectedStation =
  ref<ReturnType<typeof useBranches>["selectedBranch"]["value"]>(null);
const mapLat = ref<number | null>(null);
const mapLng = ref<number | null>(null);

function selectStation(station: typeof selectedStation.value) {
  if (station) {
    selectedStation.value = station;
    stadt.value = station.id;
    stationOpen.value = false;
    geocodeSelectedStation(station);
  }
}

async function geocodeSelectedStation(station: typeof selectedStation.value) {
  if (station) {
    const coords = await geocodeBranch(station);
    if (coords) {
      mapLat.value = coords.lat;
      mapLng.value = coords.lng;
    }
  }
}

watch(
  () => stadt.value,
  (newCity) => {
    if (newCity && selectedBranch.value) {
      selectedStation.value = selectedBranch.value;
      geocodeSelectedStation(selectedBranch.value);
    }
  },
  { immediate: true },
);

watch(
  () => service.value,
  () => {
    selectedStation.value = null;
    mapLat.value = null;
    mapLng.value = null;
  },
);

function closeConflictDialog(): void {
  showConflictDialog.value = false;
}

const onSubmit = handleSubmit((values) => {
  Object.assign(store.appointmentData, values);

  const hasConflict = false;

  if (hasConflict) {
    showConflictDialog.value = true;
    return;
  }

  emit("next");
});
</script>

<template>
  <div class="space-y-6">
    <div
      class="w-full rounded-[10px] bg-white px-6 py-5 shadow-[0_4px_4px_rgba(0,0,0,0.25)] md:px-8 md:py-6"
    >
      <h2 class="text-[20px] font-bold text-primary">
        Suchen Sie Ihre Filiale aus
      </h2>

      <div class="mt-2 mb-4 h-px w-full bg-green-gray" />

      <div class="space-y-4">
        <!-- Service selection -->
        <div class="flex flex-col gap-3">
          <p class="text-[16px] font-bold" style="color: #10393b">
            Service wählen
          </p>
          <div class="flex flex-col gap-2">
            <!-- TÜV SÜD -->
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="tuvsud"
                v-model="service"
                class="accent-primary size-4"
              />
              <span class="text-base text-custom-black">TÜV SÜD</span>
            </label>
            <!-- DEKRA -->
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="dekra"
                v-model="service"
                class="accent-primary size-4"
              />
              <span class="text-base text-custom-black">DEKRA</span>
            </label>
          </div>
        </div>

        <!-- Station dropdown -->
        <div class="relative flex flex-col gap-1">
          <label class="text-[16px] font-bold" style="color: #10393b">
            Station
          </label>
          <div
            class="flex h-[37px] cursor-pointer items-center justify-between rounded-[5px] border px-2"
            style="border-color: #b7c2c2"
            @click="stationOpen = !stationOpen"
          >
            <span
              class="truncate text-[14px]"
              :style="selectedStation ? 'color:#000' : 'color:#B7C2C2'"
            >
              {{
                selectedStation
                  ? `${selectedStation.name} — ${selectedStation.ort}`
                  : "Station wählen"
              }}
            </span>
            <Icon
              icon="ic:round-arrow-drop-down"
              class="text-[40px] text-primary shrink-0 transition-transform duration-200"
              :class="stationOpen ? 'rotate-180' : 'rotate-0'"
            />
          </div>

          <div
            v-if="stationOpen"
            class="absolute top-full mt-1 max-h-[180px] w-full overflow-y-auto rounded-[5px] border bg-white shadow-md"
            style="border-color: #b7c2c2; z-index: 9999"
          >
            <div
              v-if="!allBranches.length"
              class="px-3 py-2 text-[14px]"
              style="color: #b7c2c2"
            >
              Keine Stationen gefunden
            </div>
            <div
              v-for="station in allBranches"
              :key="station.id"
              class="flex cursor-pointer flex-col px-3 py-2 hover:bg-gray-50"
              @click="selectStation(station)"
            >
              <span class="text-[14px] font-medium" style="color: #000">
                {{ station.name }}
              </span>
              <span class="text-[12px]" style="color: #b7c2c2">
                {{ station.strasse }}, {{ station.plz }} {{ station.ort }}
              </span>
            </div>
          </div>
        </div>

        <!-- Map -->
        <div
          class="h-[220px] shrink-0 w-full overflow-hidden rounded-[5px] border"
          style="border-color: #b7c2c2"
        >
          <AppMapPicker
            :latitude="mapLat"
            :longitude="mapLng"
            :interactive="false"
          />
        </div>

        <!-- Selected branch details -->
        <div
          v-if="selectedStation"
          class="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <div
            class="flex h-35 items-center justify-center rounded-[5px] bg-[#b7c2c2]/30"
          >
            <Icon
              icon="material-symbols-light:location-on"
              class="text-5xl text-custom-green"
            />
          </div>

          <div
            class="flex flex-col justify-center rounded-[5px] border border-custom-green bg-white p-3 text-xs"
          >
            <p class="font-bold text-primary">
              {{ selectedStation.name }}
            </p>

            <p class="mt-2 text-custom-black">
              {{ selectedStation.address }}
            </p>

            <p class="text-custom-black">
              {{ selectedStation.phone }}
            </p>

            <p class="text-custom-black">
              {{ selectedStation.email }}
            </p>

            <p class="mt-2 text-custom-black">
              {{ selectedStation.distance }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div
      class="w-full rounded-[10px] bg-white px-6 py-5 shadow-[0_4px_4px_rgba(0,0,0,0.25)] md:px-8 md:py-6"
    >
      <h2 class="text-[20px] font-bold text-primary">
        Hier können Sie Termine buchen
      </h2>

      <div class="mt-2 mb-4 h-px w-full bg-green-gray" />

      <form novalidate class="space-y-3" @submit.prevent="onSubmit">
        <div class="max-w-85 space-y-3">
          <CalendarDateField name="datum" label="Datum" :minDaysAhead="3" />

          <FormSelectField
            name="uhrzeit"
            label="Uhrzeit"
            :options="uhrzeitOptions"
          />
        </div>

        <p class="pt-2 text-xs text-custom-black">
          Frühester Termin am 26.02.2025 um 11:00 Uhr.
        </p>

        <div class="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            button-classes="rounded-[5px] py-2 px-10 text-sm font-bold !bg-custom-orange text-white hover:opacity-90"
            @click="emit('back')"
          >
            Abbrechen
          </Button>

          <Button
            type="submit"
            button-classes="rounded-[5px] py-2 px-10 text-sm font-bold !bg-custom-green text-white hover:opacity-90"
          >
            Weiter
          </Button>
        </div>
      </form>
    </div>
  </div>

  <AppModal
    :open="showConflictDialog"
    title="Ihr Wunschtermin ist leider vergeben."
    message="Frühester freier Termin ist am 26.02.2025 um 11 Uhr."
    confirm-text="OK"
    @confirm="closeConflictDialog"
    @close="closeConflictDialog"
  />
</template>
