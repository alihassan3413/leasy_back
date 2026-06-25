<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useGooglePlaces, isValidDeCoord } from "@/composables/useGooglePlaces";
import { loadGoogleMaps } from "@/composables/useGoogleMapsLoader";

interface Props {
  latitude: number | null;
  longitude: number | null;
  interactive?: boolean;
  /**
   * Full address line ("Straße Nr, PLZ Ort, Deutschland"). Used to position
   * the marker by geocoding when latitude/longitude are missing or invalid
   * (e.g. the backend dropped or corrupted them on save).
   */
  address?: string;
}

interface ResolvedAddress {
  street?: string;
  number?: string;
  zip_code?: string;
  city?: string;
  latitude: number;
  longitude: number;
}

const props = withDefaults(defineProps<Props>(), {
  interactive: false,
});

const emit = defineEmits<{
  resolved: [address: ResolvedAddress];
}>();

const { geocodeAddress } = useGooglePlaces();

const mapContainer = ref<HTMLDivElement | null>(null);
const loadFailed = ref(false);

// `any` — we don't ship @types/google.maps; the surface used is small.
let gmaps: any = null;
let map: any = null;
let marker: any = null;

// Fallback center: Cologne, Germany.
const DEFAULT_CENTER = { lat: 50.9375, lng: 6.9603 };

const reverseGeocode = async (lat: number, lng: number): Promise<ResolvedAddress> => {
  // Nominatim usage policy requires a meaningful User-Agent / Referer,
  // which the browser sends automatically. Keep request rate < 1/sec.
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
    `&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=de`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    const data = await res.json();
    const a = data.address ?? {};
    return {
      street: a.road ?? a.pedestrian ?? a.footway,
      number: a.house_number,
      zip_code: a.postcode,
      city: a.city ?? a.town ?? a.village ?? a.municipality,
      latitude: lat,
      longitude: lng,
    };
  } catch (err) {
    console.error("Reverse geocoding failed:", err);
    return { latitude: lat, longitude: lng };
  }
};

const placeMarker = (lat: number, lng: number) => {
  if (!map || !gmaps) return;
  const position = { lat, lng };
  if (marker) {
    marker.setPosition(position);
  } else {
    marker = new gmaps.Marker({
      position,
      map,
      draggable: props.interactive,
    });
    marker.addListener("dragend", async (e: any) => {
      emit("resolved", await reverseGeocode(e.latLng.lat(), e.latLng.lng()));
    });
  }
  marker.setDraggable(props.interactive);
};

// Resolve the position to display: trust valid stored coordinates, otherwise
// geocode the address text (which is reliably persisted) as a fallback.
let resolveSeq = 0;
const resolvePosition = async (): Promise<[number, number] | null> => {
  // Edit mode honours coordinates set by live interaction (map click/drag or an
  // autocomplete selection) so the marker stays exactly where the user put it.
  if (props.interactive && isValidDeCoord(props.latitude, props.longitude)) {
    return [props.latitude as number, props.longitude as number];
  }
  // Otherwise the address text is the source of truth: stored coordinates are
  // unreliable (the backend round-trips them as 0,0) and can be stale, so a
  // complete address must win. The parent passes an empty string when the
  // address is too incomplete to geocode unambiguously (a lone street name
  // resolves to a famous default, e.g. "Leopoldstraße" → München).
  if (props.address?.trim()) {
    const geo = await geocodeAddress(props.address);
    if (geo) return [geo.latitude, geo.longitude];
  }
  // Last resort: any valid coordinates we were handed.
  if (isValidDeCoord(props.latitude, props.longitude)) {
    return [props.latitude as number, props.longitude as number];
  }
  return null;
};

const renderPosition = async () => {
  const seq = ++resolveSeq;
  const pos = await resolvePosition();
  // Bail if a newer call superseded this one, or the map was torn down.
  if (seq !== resolveSeq || !map) return;
  if (pos) {
    placeMarker(pos[0], pos[1]);
    map.setCenter({ lat: pos[0], lng: pos[1] });
  }
};

// Debounce position updates triggered by prop changes (e.g. typing) so we
// don't fire a geocode request on every keystroke.
let renderTimer: ReturnType<typeof setTimeout> | null = null;
const scheduleRender = () => {
  if (renderTimer) clearTimeout(renderTimer);
  renderTimer = setTimeout(renderPosition, 400);
};

onMounted(async () => {
  try {
    gmaps = await loadGoogleMaps();
  } catch (err) {
    console.error("Google Maps failed to load:", err);
    loadFailed.value = true;
    return;
  }
  if (!mapContainer.value) return;

  // Only seed from coordinates we will actually keep (edit-mode live coords);
  // otherwise start at the default and let renderPosition geocode the address,
  // so a stale stored coordinate never flashes before the correct one resolves.
  const center =
    props.interactive && isValidDeCoord(props.latitude, props.longitude)
      ? { lat: props.latitude as number, lng: props.longitude as number }
      : DEFAULT_CENTER;

  map = new gmaps.Map(mapContainer.value, {
    center,
    zoom: 14,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    gestureHandling: "cooperative",
    scrollwheel: props.interactive,
    keyboardShortcuts: false,
  });

  map.addListener("click", async (e: any) => {
    if (!props.interactive) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    placeMarker(lat, lng);
    emit("resolved", await reverseGeocode(lat, lng));
  });

  renderPosition();
});

// Keep marker in sync when the parent updates coordinates or address.
watch(
  () => [props.latitude, props.longitude, props.address] as const,
  () => scheduleRender(),
);

// Toggle interactivity when edit mode changes.
watch(
  () => props.interactive,
  (interactive) => {
    if (!map) return;
    map.setOptions({ scrollwheel: interactive });
    marker?.setDraggable(interactive);
  },
);

onBeforeUnmount(() => {
  if (renderTimer) clearTimeout(renderTimer);
  if (marker) {
    gmaps?.event.clearInstanceListeners(marker);
    marker.setMap(null);
    marker = null;
  }
  if (map) {
    gmaps?.event.clearInstanceListeners(map);
    map = null;
  }
});
</script>

<template>
  <div ref="mapContainer" class="size-full">
    <div
      v-if="loadFailed"
      class="flex size-full items-center justify-center bg-[#F1F5F5] text-xs text-[#7A9699]"
    >
      Karte konnte nicht geladen werden.
    </div>
  </div>
</template>
