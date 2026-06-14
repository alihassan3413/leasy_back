<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Icon } from "@iconify/vue";
import { toast } from "vue-sonner";
import { vehicleApi } from "@/api";
import type { Station } from "@/types";
import type { Vehicle } from "../vehicle.types";
import AppMapPicker from "@/components/ui/AppMapPicker.vue";
import { useForm } from "vee-validate";
import CalendarDateField from "@/components/ui/form/CalendarDateField.vue";
import { useAuthStore } from "@/stores/auth.store";

const { values } = useForm();

const authStore = useAuthStore();

const props = defineProps<{
  open: boolean;
  vehicle: Vehicle | null;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  success: [];
}>();
const selectedService = ref<"tuvsud" | "dekra">("tuvsud");

//  Service selection
// const tuvsudActive = ref(true);

//  Stations
const stations = ref<Station[]>([]);
const stationsLoading = ref(false);
const stationOpen = ref(false);
const selectedStation = ref<Station | null>(null);

async function fetchStations() {
  stationsLoading.value = true;
  selectedStation.value = null;
  mapLat.value = null;
  mapLng.value = null;
  try {
    stations.value = await vehicleApi.getStations(selectedService.value);
  } catch {
    toast.error("Stationen konnten nicht geladen werden.");
  } finally {
    stationsLoading.value = false;
  }
}

// Map
const mapLat = ref<number | null>(null);
const mapLng = ref<number | null>(null);

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
  } catch { }
}

function selectStation(station: Station) {
  selectedStation.value = station;
  stationOpen.value = false;
  geocodeStation(station);
}

// Termin
const terminDate = ref("");
const terminTime = ref("");

// Replace terminIso with:
const terminIso = computed(() => {
  const raw = values.terminDate as string;
  if (!raw || !terminTime.value) return "";
  return `${raw}T${terminTime.value}:00+02:00`;
});

// Remarks
const remarks = ref("");

//  Submit
const isSubmitting = ref(false);
const successDialogOpen = ref(false);

const canSubmit = computed(
  () => !!selectedStation.value && !!terminIso.value && !isSubmitting.value,
);

async function handleSubmit() {
  if (!canSubmit.value || !props.vehicle) return;

  isSubmitting.value = true;
  try {
    // Get the user ID from auth store
    const userId = authStore.user?.id;

    await vehicleApi.createOrder(
      selectedService.value,
      props.vehicle.id || props.vehicle.vehicle_id,
      {
        remarks: remarks.value,
        station_id: selectedStation.value!.station_id,
        termin: terminIso.value,
      },
      userId,
    );
    // Only show the success dialog for B2B users
    if (authStore.userRole === "B2B") {
      successDialogOpen.value = true;
    } else {
      // For B2C users, close the modal immediately
      toast.success("Auftrag erfolgreich erstellt.");
      emit("success");
      close();
    }
  } catch {
    toast.error("Auftrag konnte nicht erstellt werden.");
  } finally {
    isSubmitting.value = false;
  }
}

//  Lifecycle
watch(
  () => props.open,
  (opened) => {
    if (!opened) return;
    selectedService.value = "tuvsud";
    terminDate.value = "";
    terminTime.value = "";
    remarks.value = "";
    stationOpen.value = false;
    fetchStations();
  },
);

function close() {
  emit("update:open", false);
}

function closeSuccessDialog() {
  successDialogOpen.value = false;
  emit("success");
  close();
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="p-0 gap-0 flex flex-col max-h-[90vh] overflow-hidden" style="
        width: 680px;
        max-width: 680px;
        border-radius: 5px;
        border: 1px solid #ececec;
      " :show-close-button="false">
      <!-- Header -->
      <div class="flex h-[50px] items-center justify-between px-9"
        style="background-color: #fafafa; border-bottom: 1px solid #b7c2c2">
        <span class="text-[20px] font-bold" style="color: #10393b">
          Auftrag erstellen
        </span>
        <button @click="close" class="transition-opacity hover:opacity-60">
          <Icon icon="mdi:close" class="size-5" style="color: #b7c2c2" />
        </button>
      </div>

      <div class="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-9 py-6">
        <!-- Service switches -->
        <div class="flex flex-col gap-3">
          <p class="text-[16px] font-bold" style="color: #10393b">
            Service wählen
          </p>
          <div class="flex flex-col gap-2">
            <!-- TÜV SÜD -->
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="tuvsud" v-model="selectedService" class="accent-primary size-4"
                @change="fetchStations" />
              <span class="text-base text-custom-black">TÜV SÜD</span>
            </label>
            <!-- DEKRA — selectable but shows empty dropdown -->
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="dekra" v-model="selectedService" class="accent-primary size-4"
                @change="fetchStations" />
              <span class="text-base text-custom-black">DEKRA</span>
            </label>
          </div>
        </div>

        <!-- Station dropdown -->
        <div class="relative flex flex-col gap-1">
          <label class="text-[16px] font-bold" style="color: #10393b">
            Station
          </label>
          <div class="flex h-[37px] cursor-pointer items-center justify-between rounded-[5px] border px-2"
            style="border-color: #b7c2c2" @click="stationOpen = !stationOpen">
            <span class="truncate text-[14px]" :style="selectedStation ? 'color:#000' : 'color:#B7C2C2'">
              {{
                selectedStation
                  ? `${selectedStation.name} — ${selectedStation.ort}`
                  : stationsLoading
                    ? "Laden..."
                    : "Station wählen"
              }}
            </span>
            <Icon icon="ic:round-arrow-drop-down"
              class="text-[40px] text-primary shrink-0 transition-transform duration-200"
              :class="stationOpen ? 'rotate-180' : 'rotate-0'" />
          </div>

          <div v-if="stationOpen"
            class="absolute top-full mt-1 max-h-[180px] w-full overflow-y-auto rounded-[5px] border bg-white shadow-md"
            style="border-color: #b7c2c2; z-index: 9999">
            <div v-if="stationsLoading" class="px-3 py-2 text-[14px]" style="color: #b7c2c2">
              Laden...
            </div>
            <div v-else-if="!stations.length" class="px-3 py-2 text-[14px]" style="color: #b7c2c2">
              Keine Stationen gefunden
            </div>
            <div v-for="station in stations" :key="station.station_id"
              class="flex cursor-pointer flex-col px-3 py-2 hover:bg-gray-50" @click="selectStation(station)">
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
        <div class="h-[220px] shrink-0 w-full overflow-hidden rounded-[5px] border" style="border-color: #b7c2c2">
          <AppMapPicker :latitude="mapLat" :longitude="mapLng" :interactive="false" />
        </div>

        <!-- Termin row -->
        <div class="flex gap-4">
          <CalendarDateField name="terminDate" label="Datum" :minDaysAhead="3" class="flex-1" />
          <div class="flex flex-1 flex-col gap-1">
            <label class="text-[16px] font-bold" style="color: #10393b">
              Uhrzeit
            </label>
            <input v-model="terminTime" type="time" class="h-[37px] rounded-[5px] border px-2 text-[14px] outline-none"
              style="border-color: #b7c2c2; color: #000" />
          </div>
        </div>

        <!-- Remarks -->
        <div class="flex flex-col gap-1">
          <label class="text-[16px] font-bold" style="color: #10393b">
            Bemerkungen
            <span class="text-[12px] font-normal ml-1" style="color: #b7c2c2">(optional)</span>
          </label>
          <textarea v-model="remarks" rows="2"
            class="rounded-[5px] border px-2 py-1.5 text-[14px] outline-none resize-none"
            style="border-color: #b7c2c2; color: #000" />
        </div>

        <!-- Submit -->
        <div class="flex justify-end">
          <button class="h-[36px] w-[160px] rounded-[5px] text-[14px] font-bold text-white transition-opacity"
            :style="canSubmit ? 'background:#EF8450' : 'background:#B7C2C2'" :disabled="!canSubmit"
            @click="handleSubmit">
            {{ isSubmitting ? "Lädt..." : "Bestätigen" }}
          </button>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <AlertDialog :open="successDialogOpen" @update:open="successDialogOpen = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Auftrag erfolgreich erstellt!</AlertDialogTitle>
        <AlertDialogDescription>
          Ihre Auftragsanfrage wurde an den Administrator gesendet. Bitte warten Sie auf die Bestätigung.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogAction @click="closeSuccessDialog">Verstanden</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
