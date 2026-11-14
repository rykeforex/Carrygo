import { loadGoogleMaps } from "./loadGoogleMaps";

export class GeoError extends Error {
  constructor(code) { super(code); this.code = code; }
}

export function getCurrentPosition(options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new GeoError("unsupported"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      (e) => reject(new GeoError(e.code === 1 ? "denied" : e.code === 3 ? "timeout" : "unavailable")),
      options
    );
  });
}

export function geoErrorMessage(code) {
  switch (code) {
    case "denied": return "Location access was blocked. Allow it in your browser settings, or enter your address and drop a pin on the map.";
    case "timeout": return "Finding your location took too long. Try again, or drop a pin on the map.";
    case "unsupported": return "This browser can't share your location. Enter your address and drop a pin on the map.";
    default: return "We couldn't determine your location. Try again, or drop a pin on the map.";
  }
}

export async function geocodeAddress(text) {
  const maps = await loadGoogleMaps();
  const res = await new maps.Geocoder().geocode({ address: text, componentRestrictions: { country: "GH" } });
  const r = res.results?.[0];
  if (!r) throw new Error("no_result");
  return { lat: r.geometry.location.lat(), lng: r.geometry.location.lng(), label: r.formatted_address };
}

export async function reverseGeocode(lat, lng) {
  const maps = await loadGoogleMaps();
  const res = await new maps.Geocoder().geocode({ location: { lat, lng } });
  return res.results?.[0]?.formatted_address || null;
}

// Soft sanity check only — service area is a business decision that hasn't been made.
export const inGhana = (lat, lng) => lat >= 4.5 && lat <= 11.3 && lng >= -3.4 && lng <= 1.3;
