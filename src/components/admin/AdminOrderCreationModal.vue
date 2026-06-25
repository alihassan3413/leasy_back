<script setup lang="ts">
import { ref, watch, computed } from "vue";
import axios from "axios";
import { Icon } from "@iconify/vue";
import { toast } from "vue-sonner";
import { vehicleApi } from "@/api";
import type { Station } from "@/types";
import type { AdminVehicle } from "@/types";
import AppMapPicker from "@/components/ui/AppMapPicker.vue";
import { useForm } from "vee-validate";
import CalendarDateField from "@/components/ui/form/CalendarDateField.vue";
import TimePicker from "@/components/ui/form/TimePicker.vue";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AdminCreateStationModal from "./AdminCreateStationModal.vue";

const { values } = useForm();

const props = defineProps<{
  open: boolean;
  vehicle: AdminVehicle | null;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  success: [];
}>();
const selectedService = ref<"tuvsud" | "dekra">("tuvsud");

//  Stations
const stations = ref<Station[]>([]);
const stationsLoading = ref(false);
const stationOpen = ref(false);
const selectedStation = ref<Station | null>(null);
const createStationModalOpen = ref(false);

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
  } catch {}
}

function selectStation(station: Station) {
  selectedStation.value = station;
  stationOpen.value = false;
  geocodeStation(station);
}

// Termin
const terminDate = ref("");
const terminTime = ref("");

const terminIso = computed(() => {
  const raw = values.terminDate as string;
  if (!raw || !terminTime.value) return "";
  return `${raw}T${terminTime.value}:00+02:00`;
});

// Remarks
const remarks = ref("");

//  Submit
const isSubmitting = ref(false);

const canSubmit = computed(
  () => !!selectedStation.value && !!terminIso.value && !isSubmitting.value,
);

async function handleSubmit() {
  if (!canSubmit.value || !props.vehicle) return;

  const payload = {
    remarks: remarks.value,
    station_id: selectedStation.value!.station_id,
    termin: terminIso.value,
  };

  console.log("Creating order with:", {
    provider: selectedService.value,
    vehicleId: props.vehicle.vehicle_id,
    payload,
  });

  isSubmitting.value = true;
  try {
    await vehicleApi.createOrder(
      selectedService.value,
      props.vehicle.vehicle_id,
      payload,
      props.vehicle.user_id,
    );
    toast.success("Auftrag erfolgreich erstellt.");
    emit("success");
    close();
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error("Order creation error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        config: err.config,
      });
    } else {
      console.error("Order creation error:", err);
    }
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

function handleStationCreated(station: Station) {
  // Add the new station to the list
  stations.value.push(station);
  // Select the new station
  selectStation(station);
}

function close() {
  emit("update:open", false);
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      class="p-0 gap-0 overflow-visible bg-transparent border-none shadow-none rounded-none"
      style="width: 720px; max-width: 720px"
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
          <div class="px-3 pt-2 mb-2">
            <h2 class="text-[20px] font-bold leading-normal text-black">
              Auftrag erstellen
            </h2>
            <p
              class="mt-1 pb-3 text-sm font-light leading-normal not-italic text-[#00000080]"
            >
              Bitte füllen Sie alle Details im unten stehenden Formular aus.
            </p>
          </div>

          <div
            class="grid grid-cols-2 gap-x-4 gap-y-3 px-4 max-h-[70vh] overflow-y-auto pr-1"
          >
            <!-- Service switches -->
            <div class="flex flex-col gap-1 col-span-2">
              <label class="text-sm font-semibold text-black">
                Service wählen
              </label>
              <div class="flex flex-col gap-2">
                <!-- TÜV SÜD -->
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="tuvsud"
                    v-model="selectedService"
                    class="accent-primary size-4"
                    @change="fetchStations"
                  />
                  <span class="text-base text-gray-800">TÜV SÜD</span>
                </label>
                <!-- DEKRA -->
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="dekra"
                    v-model="selectedService"
                    class="accent-primary size-4"
                    @change="fetchStations"
                  />
                  <span class="text-base text-gray-800">DEKRA</span>
                </label>
              </div>
            </div>

            <!-- Station dropdown -->
            <div class="relative flex flex-col gap-1 col-span-2">
              <div class="flex items-center justify-between">
                <label class="text-sm font-semibold text-black">
                  Station
                </label>
                <button
                  class="text-sm font-semibold px-2 py-1 rounded-full transition-colors hover:bg-gray-100"
                  style="color: #ef8450"
                  @click.stop="createStationModalOpen = true"
                >
                  + Station erstellen
                </button>
              </div>
              <div
                class="flex h-9 cursor-pointer items-center justify-between rounded-full border border-gray-300 px-4 outline-none focus:border-emerald-500"
                tabindex="0"
                @click="stationOpen = !stationOpen"
              >
                <span
                  class="text-sm"
                  :class="selectedStation ? 'text-gray-800' : 'text-gray-400'"
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
                  icon="mdi:chevron-down"
                  class="text-gray-500 text-[24px] transition-transform duration-200"
                  :class="stationOpen ? 'rotate-180' : 'rotate-0'"
                />
              </div>

              <div
                v-if="stationOpen"
                class="absolute top-full z-[10000] mt-1 max-h-48 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-lg"
              >
                <div
                  v-if="stationsLoading"
                  class="px-4 py-2 text-sm text-gray-400"
                >
                  Laden...
                </div>
                <div
                  v-else-if="!stations.length"
                  class="px-4 py-2 text-sm text-gray-400"
                >
                  Keine Stationen gefunden
                </div>
                <div
                  v-for="station in stations"
                  :key="station.station_id"
                  class="flex cursor-pointer flex-col px-4 py-2 hover:bg-gray-50"
                  @click="selectStation(station)"
                >
                  <span class="text-sm font-medium text-gray-800">
                    {{ station.name }}
                  </span>
                  <span class="text-xs text-gray-400">
                    {{ station.strasse }}, {{ station.plz }} {{ station.ort }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Map -->
            <div
              class="h-[140px] shrink-0 w-full overflow-hidden rounded-2xl border border-gray-300 col-span-2"
            >
              <AppMapPicker
                :latitude="mapLat"
                :longitude="mapLng"
                :interactive="false"
              />
            </div>

            <!-- Termin row -->
            <div class="flex flex-col gap-1 col-span-2">
              <div class="grid grid-cols-2 gap-x-4">
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-semibold text-black">
                    Datum
                  </label>
                  <CalendarDateField
                    name="terminDate"
                    :minDaysAhead="3"
                    :blockWeekends="true"
                    inputRounded="rounded-2xl"
                    inputClass="any-extra-class"
                  />
                </div>
                <TimePicker
                  v-model="terminTime"
                  label="Uhrzeit"
                  placeholder="Uhrzeit wählen"
                  input-height="h-9"
                  input-rounded="rounded-full"
                />
              </div>
            </div>

            <!-- Remarks -->
            <div class="flex flex-col gap-1 col-span-2">
              <label class="text-sm font-semibold text-black">
                Bemerkungen
                <span class="text-xs font-normal text-gray-400 ml-1"
                  >(optional)</span
                >
              </label>
              <div
                class="relative flex items-start rounded-4xl border border-gray-300 px-4 py-2 focus-within:border-emerald-500"
              >
                <textarea
                  v-model="remarks"
                  rows="2"
                  class="w-full bg-transparent text-sm outline-none resize-none"
                  placeholder="Bemerkungen hinzufügen..."
                />
              </div>
            </div>

            <!-- Submit -->
            <div class="mt-2 flex justify-center col-span-2">
              <button
                class="h-9 px-6 rounded-full text-sm font-semibold text-white transition-all duration-200 shadow-lg"
                :style="
                  canSubmit ? 'background: #EF8450;' : 'background: #D9D9D9;'
                "
                :disabled="!canSubmit || isSubmitting"
                @click="handleSubmit"
              >
                {{ isSubmitting ? "Lädt..." : "Bestätigen" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
  <AdminCreateStationModal
    :open="createStationModalOpen"
    :default-provider="selectedService"
    @update:open="createStationModalOpen = $event"
    @success="handleStationCreated"
  />
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
  --_m: /calc(2 * var(--r)) calc(2 * var(--r))
    radial-gradient(#000 70%, #0000 0%);
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

.inverted-corner-top-left {
  --_m: /calc(2 * var(--r)) calc(2 * var(--r))
    radial-gradient(#000 70%, #0000 72%);
  --_g: conic-gradient(at var(--r) var(--r), #000 75%, #0000 0);
  --_d: (var(--s) + var(--r));

  mask:
    calc(var(--_d) + var(--x)) 0 var(--_m),
    0 calc(var(--_d) + var(--y)) var(--_m),
    radial-gradient(var(--s) at 0 0, #0000 99%, #000 calc(100% + 1px))
      calc(var(--r) + var(--x)) calc(var(--r) + var(--y)),
    var(--_g) calc(var(--_d) + var(--x)) 0,
    var(--_g) 0 calc(var(--_d) + var(--y));
  mask-repeat: no-repeat;
}

.inverted-corner-bottom-right {
  --_m: /calc(2 * var(--r)) calc(2 * var(--r))
    radial-gradient(#000 70%, #0000 72%);
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

.inverted-corner-bottom-left {
  --_m: /calc(2 * var(--r)) calc(2 * var(--r))
    radial-gradient(#000 70%, #0000 72%);
  --_g: conic-gradient(
    from 180deg at var(--r) calc(100% - var(--r)),
    #0000 25%,
    #000 0
  );
  --_d: (var(--s) + var(--r));

  mask:
    calc(var(--_d) + var(--x)) 100% var(--_m),
    0 calc(100% - var(--_d) - var(--y)) var(--_m),
    radial-gradient(var(--s) at 0 100%, #0000 99%, #000 calc(100% + 1px))
      calc(var(--r) + var(--x)) calc(-1 * var(--r) - var(--y)),
    var(--_g) calc(var(--_d) + var(--x)) 0,
    var(--_g) 0 calc(-1 * var(--_d) - var(--y));
  mask-repeat: no-repeat;
}
</style>
