/**
 * Loads the Google Maps JavaScript API exactly once and resolves with
 * `google.maps`. Subsequent callers share the same promise, so multiple
 * AppMapPicker instances never inject the script twice.
 *
 * Requires the **Maps JavaScript API** enabled on the key
 * (`VITE_GOOGLE_PLACES_API_KEY`) — separate from the Places API.
 */

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY as string | undefined;
const CALLBACK = "__leasybackInitGoogleMaps__";

// `any` because we don't ship the @types/google.maps package; the surface we
// use (Map, Marker, event) is small and guarded.
let loadPromise: Promise<any> | null = null;

export function loadGoogleMaps(): Promise<any> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const w = window as any;
    if (w.google?.maps) {
      resolve(w.google.maps);
      return;
    }
    if (!API_KEY) {
      reject(new Error("Google Maps API key missing"));
      return;
    }

    w[CALLBACK] = () => {
      resolve(w.google.maps);
      delete w[CALLBACK];
    };

    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${API_KEY}` +
      `&v=weekly&loading=async&language=de&region=DE&callback=${CALLBACK}`;
    script.async = true;
    script.onerror = () => {
      loadPromise = null; // allow a retry on a later mount
      reject(new Error("Failed to load Google Maps JS"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
