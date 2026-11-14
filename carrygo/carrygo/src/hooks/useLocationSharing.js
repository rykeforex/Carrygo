import { useEffect, useState } from "react";
import { updateLocation } from "../lib/api";

const HEARTBEAT_MS = 15000;

// Collector side. Shares GPS ONLY while `enabled` (the caller enables it only during en_route/arrived and
// with consent). Everything is torn down the moment `enabled` turns false or the component unmounts.
// states: off | unsupported | starting | waiting | live | reconnecting | denied | unavailable
export function useLocationSharing({ jobId, enabled, intervalMs = 5000 }) {
  const [state, setState] = useState("off");
  const [lastSentAt, setLastSentAt] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled || !jobId) { setState("off"); return undefined; }
    if (typeof navigator === "undefined" || !navigator.geolocation) { setState("unsupported"); return undefined; }

    let stopped = false;
    let latest = null;
    let lastKey = null;
    let lastSent = 0;
    let failures = 0;
    let wake = null;
    setState("starting");

    const send = async () => {
      if (stopped || !latest) return;
      const key = `${latest.lat.toFixed(5)},${latest.lng.toFixed(5)}`;
      if (key === lastKey && Date.now() - lastSent < HEARTBEAT_MS) return; // unchanged: only heartbeat
      const snap = latest;
      try {
        const sent = await updateLocation(jobId, snap.lat, snap.lng, snap.heading, snap.accuracy);
        if (stopped) return;
        failures = 0; lastKey = key; lastSent = Date.now();
        if (sent !== false) setLastSentAt(Date.now());
        setState("live");
      } catch (e) {
        if (stopped) return;
        if (/not_sharing_allowed|not_approved_collector/.test(e?.message || "")) { stopped = true; setState("off"); return; }
        failures += 1;
        if (failures >= 2) setState("reconnecting");
      }
    };

    const onPos = (p) => {
      const c = p.coords;
      latest = { lat: c.latitude, lng: c.longitude, heading: Number.isFinite(c.heading) ? c.heading : null, accuracy: Number.isFinite(c.accuracy) ? c.accuracy : null };
      if (lastSent === 0) send();
    };
    const onErr = (e) => {
      if (stopped) return;
      if (e?.code === 1) setState("denied");
      else if (e?.code === 2) setState("unavailable");
      else setState((s) => (s === "live" || s === "reconnecting" ? s : "waiting"));
    };

    const watchId = navigator.geolocation.watchPosition(onPos, onErr, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
    const timer = setInterval(send, intervalMs);

    const getWake = () => {
      if (!navigator.wakeLock?.request) return;
      navigator.wakeLock.request("screen").then((l) => { if (stopped) l.release?.(); else wake = l; }).catch(() => {});
    };
    getWake();
    const onVis = () => { if (document.visibilityState === "visible" && !wake) getWake(); };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stopped = true;
      navigator.geolocation.clearWatch(watchId);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
      wake?.release?.();
    };
  }, [enabled, jobId, intervalMs, attempt]);

  return { state, lastSentAt, retry: () => setAttempt((a) => a + 1) };
}
