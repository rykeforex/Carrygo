export const STALE_AFTER_MS = 45000;

// "none" = no reading, "live" = recent, "stale" = we have a reading but it is old.
export function locationFreshness(recordedAt, now = Date.now(), staleMs = STALE_AFTER_MS) {
  const t = new Date(recordedAt).getTime();
  if (!Number.isFinite(t)) return "none";
  return now - t > staleMs ? "stale" : "live";
}

export function formatAge(recordedAt, now = Date.now()) {
  const t = new Date(recordedAt).getTime();
  if (!Number.isFinite(t)) return "";
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s} s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  return `${Math.floor(m / 60)} h ago`;
}

export function haversineKm(a, b) {
  const R = 6371, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistance(km) {
  if (!Number.isFinite(km)) return null;
  return km < 1 ? `${Math.round((km * 1000) / 10) * 10} m` : `${km.toFixed(1)} km`;
}

export function formatEta(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  const m = Math.round(seconds / 60);
  if (m < 1) return "less than a minute";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}
