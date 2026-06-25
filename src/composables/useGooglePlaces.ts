import { ref } from "vue";

/**
 * Thin client for the Google **Places API (New)** REST endpoints.
 *
 * We use the REST API (not the Maps JS SDK) on purpose: it supports browser
 * CORS, so we avoid loading any external script and keep the existing Leaflet
 * map. The flow is the Google-recommended "session token" pattern:
 *   1. autocomplete(input)  → list of predictions   (billed per session)
 *   2. getPlaceDetails(id)  → coordinates + address  (closes the session)
 *
 * Docs: https://developers.google.com/maps/documentation/places/web-service/op-overview
 */

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY as string | undefined;

const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const DETAILS_URL = "https://places.googleapis.com/v1/places";
const SEARCH_TEXT_URL = "https://places.googleapis.com/v1/places:searchText";

/**
 * Germany bounding box. This app is DE-only (autocomplete is scoped to `de`),
 * so any genuine address coordinate must fall inside it. Used to reject bad
 * round-tripped coordinates — (0,0) Null Island, swapped lat/lng, or junk —
 * before they reach the map.
 */
const DE_BOUNDS = { latMin: 47, latMax: 56, lngMin: 5, lngMax: 16 };

export const isValidDeCoord = (lat: unknown, lng: unknown): lat is number =>
  typeof lat === "number" &&
  typeof lng === "number" &&
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= DE_BOUNDS.latMin &&
  lat <= DE_BOUNDS.latMax &&
  lng >= DE_BOUNDS.lngMin &&
  lng <= DE_BOUNDS.lngMax;

export interface PlaceSuggestion {
  /** Opaque place id passed back to getPlaceDetails(). */
  placeId: string;
  /** Bold primary line, e.g. the street + number. */
  mainText: string;
  /** Secondary line, e.g. "50667 Köln, Deutschland". */
  secondaryText: string;
}

/** Parsed address in the shape AppMapPicker / AccountDetail already consume. */
export interface ResolvedPlaceAddress {
  street?: string;
  number?: string;
  zip_code?: string;
  city?: string;
  latitude: number;
  longitude: number;
}

interface GoogleAddressComponent {
  longText: string;
  shortText: string;
  types: string[];
}

const findComponent = (
  components: GoogleAddressComponent[],
  ...types: string[]
): string | undefined => {
  for (const type of types) {
    const match = components.find((c) => c.types.includes(type));
    if (match) return match.longText;
  }
  return undefined;
};

export function useGooglePlaces() {
  const isConfigured = ref<boolean>(Boolean(API_KEY));
  const error = ref<string | null>(null);

  // A session token groups one autocomplete session with its final details
  // call so Google bills them together. Reset after each completed selection.
  let sessionToken = crypto.randomUUID();

  const newSession = () => {
    sessionToken = crypto.randomUUID();
  };

  /** Fetch address predictions for the user's partial input. */
  const autocomplete = async (input: string): Promise<PlaceSuggestion[]> => {
    error.value = null;
    if (!API_KEY) {
      error.value = "Google Places API-Schlüssel fehlt.";
      return [];
    }
    const trimmed = input.trim();
    if (trimmed.length < 3) return [];

    try {
      const res = await fetch(AUTOCOMPLETE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY,
        },
        body: JSON.stringify({
          input: trimmed,
          languageCode: "de",
          includedRegionCodes: ["de"],
          sessionToken,
        }),
      });
      if (!res.ok) throw new Error(`Places autocomplete ${res.status}`);
      const data = await res.json();
      const suggestions: any[] = data.suggestions ?? [];
      return suggestions
        .filter((s) => s.placePrediction)
        .map((s) => {
          const p = s.placePrediction;
          return {
            placeId: p.placeId as string,
            mainText: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
            secondaryText: p.structuredFormat?.secondaryText?.text ?? "",
          } satisfies PlaceSuggestion;
        });
    } catch (err) {
      console.error("Places autocomplete failed:", err);
      error.value = "Adresssuche fehlgeschlagen.";
      return [];
    }
  };

  /** Resolve a chosen prediction into coordinates + structured address. */
  const getPlaceDetails = async (placeId: string): Promise<ResolvedPlaceAddress | null> => {
    error.value = null;
    if (!API_KEY) return null;

    try {
      // The session token must be a query param here — the details endpoint's
      // CORS policy only allows the api-key and field-mask headers, so sending
      // it as a header fails browser preflight.
      const url =
        `${DETAILS_URL}/${placeId}` +
        `?sessionToken=${encodeURIComponent(sessionToken)}&languageCode=de`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask": "addressComponents,location",
        },
      });
      if (!res.ok) throw new Error(`Place details ${res.status}`);
      const data = await res.json();
      const components: GoogleAddressComponent[] = data.addressComponents ?? [];

      const resolved: ResolvedPlaceAddress = {
        street: findComponent(components, "route"),
        number: findComponent(components, "street_number"),
        zip_code: findComponent(components, "postal_code"),
        city: findComponent(components, "locality", "postal_town", "administrative_area_level_2"),
        latitude: data.location?.latitude,
        longitude: data.location?.longitude,
      };
      // Selection is complete — start a fresh billing session for next time.
      newSession();
      return resolved;
    } catch (err) {
      console.error("Place details failed:", err);
      error.value = "Adressdetails konnten nicht geladen werden.";
      return null;
    }
  };

  /**
   * Forward-geocode a free-text address into coordinates. Used as a reliable
   * fallback for displaying a saved address whose stored coordinates are
   * missing or corrupted on the backend round-trip.
   */
  const geocodeAddress = async (
    query: string,
  ): Promise<{ latitude: number; longitude: number } | null> => {
    if (!API_KEY) return null;
    const text = query.trim();
    if (!text) return null;

    try {
      const res = await fetch(SEARCH_TEXT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask": "places.location",
        },
        body: JSON.stringify({
          textQuery: text,
          languageCode: "de",
          regionCode: "DE",
        }),
      });
      if (!res.ok) throw new Error(`Text search ${res.status}`);
      const data = await res.json();
      const loc = data.places?.[0]?.location;
      if (isValidDeCoord(loc?.latitude, loc?.longitude)) {
        return { latitude: loc.latitude, longitude: loc.longitude };
      }
      return null;
    } catch (err) {
      console.error("Geocode failed:", err);
      return null;
    }
  };

  return {
    isConfigured,
    error,
    autocomplete,
    getPlaceDetails,
    geocodeAddress,
    newSession,
  };
}
