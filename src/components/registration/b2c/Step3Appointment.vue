<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Icon } from "@iconify/vue";
import { useField, useForm } from "vee-validate";
import { toast } from "vue-sonner";

import Button from "@/components/ui/Button.vue";
import AppModal from "@/components/ui/AppModal.vue";
import CalendarDateField from "@/components/ui/form/CalendarDateField.vue";
import AppMapPicker from "@/components/ui/AppMapPicker.vue";
import FormSelectField from "@/components/ui/form/B2CSelectField.vue";

import { appointmentSchema } from "@/validations/b2c/appointment.schema";
import { useB2CRegistrationStore } from "@/stores/b2cRegistration.store";
import { useAuthStore } from "@/stores/auth.store";
import { vehicleApi } from "@/api";
import type { AppointmentData } from "@/stores/b2cRegistration.store";
import type { Station } from "@/types";

const emit = defineEmits<{
  next: [];
  back: [];
}>();

const store = useB2CRegistrationStore();
const authStore = useAuthStore();
const showConflictDialog = ref(false);
const isSubmitting = ref(false);

const uhrzeitOptions = [
  { value: "10:30", label: "10:30 Uhr" },
  { value: "11:00", label: "11:00 Uhr" },
  { value: "13:30", label: "13:30 Uhr" },
  { value: "15:00", label: "15:00 Uhr" },
];

const { handleSubmit, values, errors } = useForm<AppointmentData>({
  validationSchema: appointmentSchema,
  initialValues: { ...store.appointmentData, service: "tuvsud" },
});

const { value: uhrzeit } = useField<string>("uhrzeit");
const { value: service } = useField<"tuvsud" | "dekra">("service");

// Stations
const stations = ref<Station[]>([]);
const stationsLoading = ref(false);
const stationOpen = ref(false);
const selectedStation = ref<Station | null>(null);

// Bundesland / Ort filters
const selectedBundesland = ref("");
const selectedOrt = ref("");
const bundeslandOpen = ref(false);
const ortOpen = ref(false);

const bundeslandOptions = computed(() =>
  [...new Set(stations.value.map((s) => s.bundesland).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "de"),
  ),
);

const ortOptions = computed(() =>
  [
    ...new Set(
      stations.value
        .filter((s) => !selectedBundesland.value || s.bundesland === selectedBundesland.value)
        .map((s) => s.ort)
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, "de")),
);

const filteredStations = computed(() =>
  stations.value.filter(
    (s) =>
      (!selectedBundesland.value || s.bundesland === selectedBundesland.value) &&
      (!selectedOrt.value || s.ort === selectedOrt.value),
  ),
);

function selectBundesland(bundesland: string) {
  selectedBundesland.value = bundesland;
  selectedOrt.value = "";
  selectedStation.value = null;
  mapLat.value = null;
  mapLng.value = null;
  bundeslandOpen.value = false;
}

function selectOrt(ort: string) {
  selectedOrt.value = ort;
  selectedStation.value = null;
  mapLat.value = null;
  mapLng.value = null;
  ortOpen.value = false;
}

// Map
const mapLat = ref<number | null>(null);
const mapLng = ref<number | null>(null);

async function fetchStations() {
  stationsLoading.value = true;
  selectedStation.value = null;
  selectedBundesland.value = "";
  selectedOrt.value = "";
  mapLat.value = null;
  mapLng.value = null;
  try {
    stations.value = await vehicleApi.getStations(service.value || "tuvsud");
  } catch {
    toast.error("Stationen konnten nicht geladen werden.");
  } finally {
    stationsLoading.value = false;
  }
}

async function geocodeStation(station: Station) {
  const q = `${station.strasse}, ${station.plz} ${station.ort}, Germany`;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
      { headers: { Accept: "application/json" } },
    );
    const data = await res.json();
    if (data[0]) {
      mapLat.value = parseFloat(data[0].lat);
      mapLng.value = parseFloat(data[0].lon);
    }
  } catch {}
}

function selectStation(station: Station) {
  selectedStation.value = station;
  stationOpen.value = false;
  geocodeStation(station);
}

// Watch service change to fetch stations
watch(
  () => service.value,
  () => {
    fetchStations();
  },
  { immediate: true },
);

function closeConflictDialog(): void {
  showConflictDialog.value = false;
}

// Termin ISO
const terminIso = computed(() => {
  const raw = values.datum as string;
  if (!raw || !uhrzeit.value) return "";
  return `${raw}T${uhrzeit.value}:00+02:00`;
});

const onSubmit = handleSubmit(async (values) => {
  console.log("=== Step3Appointment Submit ===");
  console.log("values:", values);
  console.log("form errors:", errors.value);
  console.log("selectedStation.value:", selectedStation.value);
  console.log("terminIso.value:", terminIso.value);
  console.log("store.vehicleId:", store.vehicleId);
  console.log("authStore.user?.id:", authStore.user?.id);

  if (!selectedStation.value) {
    toast.error("Bitte wählen Sie eine Station aus.");
    return;
  }
  if (!terminIso.value) {
    toast.error("Bitte wählen Sie Datum und Uhrzeit aus.");
    return;
  }
  if (!store.vehicleId) {
    toast.error("Fahrzeug-ID fehlt. Bitte gehen Sie zurück und erstellen Sie das Fahrzeug erneut.");
    return;
  }
  if (!authStore.user?.id) {
    toast.error("Benutzer nicht angemeldet.");
    return;
  }

  Object.assign(store.appointmentData, values);

  const hasConflict = false;

  if (hasConflict) {
    showConflictDialog.value = true;
    return;
  }

  isSubmitting.value = true;
  try {
    await vehicleApi.createOrder(
      service.value || "tuvsud",
      store.vehicleId,
      {
        remarks: "",
        station_id: selectedStation.value.station_id,
        termin: terminIso.value,
      },
      authStore.user.id,
    );
    toast.success("Auftrag erfolgreich erstellt.");
    emit("next");
  } catch {
    toast.error("Auftrag konnte nicht erstellt werden.");
  } finally {
    isSubmitting.value = false;
  }
});
</script>

<template>
  <div class="space-y-6">
    <div
      class="w-full rounded-[10px] bg-white px-6 py-5 shadow-[0_4px_4px_rgba(0,0,0,0.25)] md:px-8 md:py-6"
    >
      <h2 class="text-[20px] font-bold text-primary">Suchen Sie Ihre Filiale aus</h2>

      <div class="mt-2 mb-4 h-px w-full bg-green-gray" />

      <div class="space-y-4">
        <!-- Service selection -->
        <div class="flex flex-col gap-3">
          <p class="text-[16px] font-bold" style="color: #10393b">Service wählen</p>
          <div class="flex flex-col gap-2">
            <!-- TÜV SÜD -->
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="tuvsud" v-model="service" class="accent-primary size-4" />
              <span class="text-base text-custom-black">TÜV SÜD</span>
            </label>
            <!-- DEKRA -->
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="dekra" v-model="service" class="accent-primary size-4" />
              <span class="text-base text-custom-black">DEKRA</span>
            </label>
          </div>
        </div>

        <!-- Bundesland / Ort filters -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="relative flex flex-col gap-1">
            <label class="text-[16px] font-bold" style="color: #10393b"> Bundesland </label>
            <div
              class="flex h-[37px] cursor-pointer items-center justify-between rounded-[5px] border px-2"
              style="border-color: #b7c2c2"
              @click="
                bundeslandOpen = !bundeslandOpen;
                ortOpen = false;
                stationOpen = false;
              "
            >
              <span
                class="truncate text-[14px]"
                :style="selectedBundesland ? 'color:#000' : 'color:#B7C2C2'"
              >
                {{ selectedBundesland || (stationsLoading ? "Laden..." : "Bundesland wählen") }}
              </span>
              <Icon
                icon="ic:round-arrow-drop-down"
                class="text-[40px] text-primary shrink-0 transition-transform duration-200"
                :class="bundeslandOpen ? 'rotate-180' : 'rotate-0'"
              />
            </div>

            <div
              v-if="bundeslandOpen"
              class="absolute top-full mt-1 max-h-[180px] w-full overflow-y-auto rounded-[5px] border bg-white shadow-md"
              style="border-color: #b7c2c2; z-index: 9999"
            >
              <div v-if="stationsLoading" class="px-3 py-2 text-[14px]" style="color: #b7c2c2">
                Laden...
              </div>
              <template v-else>
                <div
                  class="cursor-pointer px-3 py-2 text-[14px] hover:bg-gray-50"
                  style="color: #000"
                  @click="selectBundesland('')"
                >
                  Alle Bundesländer
                </div>
                <div
                  v-for="bundesland in bundeslandOptions"
                  :key="bundesland"
                  class="cursor-pointer px-3 py-2 text-[14px] hover:bg-gray-50"
                  style="color: #000"
                  @click="selectBundesland(bundesland)"
                >
                  {{ bundesland }}
                </div>
              </template>
            </div>
          </div>

          <div class="relative flex flex-col gap-1">
            <label class="text-[16px] font-bold" style="color: #10393b"> Ort </label>
            <div
              class="flex h-[37px] cursor-pointer items-center justify-between rounded-[5px] border px-2"
              style="border-color: #b7c2c2"
              @click="
                ortOpen = !ortOpen;
                bundeslandOpen = false;
                stationOpen = false;
              "
            >
              <span
                class="truncate text-[14px]"
                :style="selectedOrt ? 'color:#000' : 'color:#B7C2C2'"
              >
                {{ selectedOrt || (stationsLoading ? "Laden..." : "Ort wählen") }}
              </span>
              <Icon
                icon="ic:round-arrow-drop-down"
                class="text-[40px] text-primary shrink-0 transition-transform duration-200"
                :class="ortOpen ? 'rotate-180' : 'rotate-0'"
              />
            </div>

            <div
              v-if="ortOpen"
              class="absolute top-full mt-1 max-h-[180px] w-full overflow-y-auto rounded-[5px] border bg-white shadow-md"
              style="border-color: #b7c2c2; z-index: 9999"
            >
              <div v-if="stationsLoading" class="px-3 py-2 text-[14px]" style="color: #b7c2c2">
                Laden...
              </div>
              <template v-else>
                <div
                  class="cursor-pointer px-3 py-2 text-[14px] hover:bg-gray-50"
                  style="color: #000"
                  @click="selectOrt('')"
                >
                  Alle Orte
                </div>
                <div
                  v-for="ort in ortOptions"
                  :key="ort"
                  class="cursor-pointer px-3 py-2 text-[14px] hover:bg-gray-50"
                  style="color: #000"
                  @click="selectOrt(ort)"
                >
                  {{ ort }}
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Station dropdown -->
        <div class="relative flex flex-col gap-1">
          <label class="text-[16px] font-bold" style="color: #10393b"> Station </label>
          <div
            class="flex h-[37px] cursor-pointer items-center justify-between rounded-[5px] border px-2"
            style="border-color: #b7c2c2"
            @click="
              stationOpen = !stationOpen;
              bundeslandOpen = false;
              ortOpen = false;
            "
          >
            <span
              class="truncate text-[14px]"
              :style="selectedStation ? 'color:#000' : 'color:#B7C2C2'"
            >
              {{
                selectedStation
                  ? `${selectedStation.name} — ${selectedStation.ort}`
                  : stationsLoading
                    ? "Laden..."
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
            <div v-if="stationsLoading" class="px-3 py-2 text-[14px]" style="color: #b7c2c2">
              Laden...
            </div>
            <div
              v-else-if="!filteredStations.length"
              class="px-3 py-2 text-[14px]"
              style="color: #b7c2c2"
            >
              Keine Stationen gefunden
            </div>
            <div
              v-for="station in filteredStations"
              :key="station.station_id"
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
          <AppMapPicker :latitude="mapLat" :longitude="mapLng" :interactive="false" />
        </div>
      </div>
    </div>

    <div
      class="w-full rounded-[10px] bg-white px-6 py-5 shadow-[0_4px_4px_rgba(0,0,0,0.25)] md:px-8 md:py-6"
    >
      <h2 class="text-[20px] font-bold text-primary">Hier können Sie Termine buchen</h2>

      <div class="mt-2 mb-4 h-px w-full bg-green-gray" />

      <form novalidate class="space-y-3" @submit.prevent="onSubmit">
        <div class="max-w-85 space-y-3">
          <CalendarDateField name="datum" label="Datum" :minDaysAhead="3" />

          <FormSelectField name="uhrzeit" label="Uhrzeit" :options="uhrzeitOptions" />
        </div>

        <p class="pt-2 text-xs text-custom-black">Frühester Termin am 26.02.2025 um 11:00 Uhr.</p>

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
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? "Lädt..." : "Weiter" }}
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
