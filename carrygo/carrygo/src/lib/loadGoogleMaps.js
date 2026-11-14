// Loads the Google Maps JavaScript API once and caches the promise.
// Requires VITE_GOOGLE_MAPS_API_KEY to be set in .env — see README.md.
let loadPromise = null;

export function loadGoogleMaps() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!key) {
    return Promise.reject(new Error("missing-api-key"));
  }

  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-carrygo-gmaps]");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google.maps));
      existing.addEventListener("error", () => reject(new Error("failed-to-load")));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      key
    )}&libraries=places,geometry&v=weekly`;
    script.async = true;
    script.defer = true;
    script.dataset.carrygoGmaps = "true";
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error("failed-to-load"));
    document.head.appendChild(script);
  });

  return loadPromise;
}
