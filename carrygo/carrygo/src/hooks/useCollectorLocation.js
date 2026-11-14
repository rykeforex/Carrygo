import { useEffect, useState } from "react";
import { getCollectorLocation, subscribeToCollectorLocation } from "../lib/api";
import { locationFreshness } from "../lib/tracking";

const toLoc = (r) => ({ lat: Number(r.lat), lng: Number(r.lng), heading: r.heading, accuracy: r.accuracy_m, recordedAt: r.recorded_at });

// Customer side: the collector's latest position (realtime + 10s polling fallback).
export function useCollectorLocation(pickupId, enabled) {
  const [loc, setLoc] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) { setLoc(null); return undefined; }
    let cancelled = false;
    const load = async () => {
      try { const row = await getCollectorLocation(pickupId); if (!cancelled) setLoc(row ? toLoc(row) : null); } catch { /* keep last known */ }
    };
    load();
    const off = subscribeToCollectorLocation(pickupId, (payload) => {
      if (cancelled) return;
      if (payload.eventType === "DELETE") setLoc(null);
      else if (payload.new) setLoc(toLoc(payload.new));
    });
    const poll = setInterval(load, 10000);
    const tick = setInterval(() => setNow(Date.now()), 5000);
    return () => { cancelled = true; off(); clearInterval(poll); clearInterval(tick); };
  }, [pickupId, enabled]);

  return { loc, now, freshness: loc ? locationFreshness(loc.recordedAt, now) : "none" };
}
