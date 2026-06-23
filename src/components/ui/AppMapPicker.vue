<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface Props {
  latitude: number | null;
  longitude: number | null;
  interactive?: boolean;
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

const mapContainer = ref<HTMLDivElement | null>(null);
let map: L.Map | null = null;
let marker: L.Marker | null = null;

// Fallback center: Cologne, Germany.
const DEFAULT_CENTER: [number, number] = [50.9375, 6.9603];

const reverseGeocode = async (
  lat: number,
  lng: number,
): Promise<ResolvedAddress> => {
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
  if (!map) return;
  if (marker) {
    marker.setLatLng([lat, lng]);
  } else {
    marker = L.marker([lat, lng], { draggable: props.interactive }).addTo(map);
    marker.on("dragend", async () => {
      const pos = marker!.getLatLng();
      emit("resolved", await reverseGeocode(pos.lat, pos.lng));
    });
  }
  marker.dragging?.[props.interactive ? "enable" : "disable"]();
};

onMounted(() => {
  if (!mapContainer.value) return;

  const center: [number, number] =
    props.latitude != null && props.longitude != null
      ? [props.latitude, props.longitude]
      : DEFAULT_CENTER;

  map = L.map(mapContainer.value, {
    center,
    zoom: 14,
    zoomControl: true,
    scrollWheelZoom: props.interactive,
    dragging: true,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }).addTo(map);

  if (props.latitude != null && props.longitude != null) {
    placeMarker(props.latitude, props.longitude);
  }

  map.on("click", async (e: L.LeafletMouseEvent) => {
    if (!props.interactive) return;
    const { lat, lng } = e.latlng;
    placeMarker(lat, lng);
    emit("resolved", await reverseGeocode(lat, lng));
  });
});

// Keep marker in sync when the parent updates coordinates (e.g. profile loads).
watch(
  () => [props.latitude, props.longitude] as const,
  ([lat, lng]) => {
    if (lat == null || lng == null || !map) return;
    placeMarker(lat, lng);
    map.setView([lat, lng], map.getZoom());
  },
);

// Toggle interactivity when edit mode changes.
watch(
  () => props.interactive,
  (interactive) => {
    if (!map) return;
    interactive ? map.scrollWheelZoom.enable() : map.scrollWheelZoom.disable();
    marker?.dragging?.[interactive ? "enable" : "disable"]();
  },
);

onBeforeUnmount(() => {
  map?.remove();
  map = null;
  marker = null;
});
</script>

<template>
  <div ref="mapContainer" class="size-full" />
</template>

<style scoped>
/* Leaflet needs a positioned container; size-full handles dimensions. */
:deep(.leaflet-container) {
  height: 100%;
  width: 100%;
  border-radius: inherit;
}
</style>