import { useEffect, useRef, useState } from "react";
import { getRoute } from "../lib/route";
import { haversineKm } from "../lib/tracking";

// Fetches a real driving route/ETA, throttled to keep Directions API usage (and cost) low.
// status: idle | ok | unavailable. `route` is null unless Google actually returned one.
export function useRoute(from, to, enabled) {
  const [state, setState] = useState({ route: null, status: "idle" });
  const last = useRef({ at: 0, lat: null, lng: null });
  const inFlight = useRef(false);
  const lat = from?.lat, lng = from?.lng, tlat = to?.lat, tlng = to?.lng;

  useEffect(() => {
    if (!enabled || lat == null || tlat == null) { setState({ route: null, status: "idle" }); last.current = { at: 0, lat: null, lng: null }; return; }
    const age = Date.now() - last.current.at;
    const moved = last.current.lat == null ? Infinity : haversineKm({ lat, lng }, { lat: last.current.lat, lng: last.current.lng }) * 1000;
    if (inFlight.current || age < 10000 || (age < 30000 && moved < 150)) return;
    inFlight.current = true;
    last.current = { at: Date.now(), lat, lng };
    getRoute({ lat, lng }, { lat: tlat, lng: tlng })
      .then((route) => setState({ route, status: "ok" }))
      .catch(() => setState({ route: null, status: "unavailable" }))
      .finally(() => { inFlight.current = false; });
  }, [enabled, lat, lng, tlat, tlng]);

  return state;
}
