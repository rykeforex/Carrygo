import React from "react";
import { Radio } from "lucide-react";
import { formatAge, formatDistance, formatEta, haversineKm } from "../lib/tracking";

// Presentational. It only ever displays numbers that were actually measured or returned by Google.
export default function TrackingPanel({ status, loc, freshness, now = Date.now(), pickup, routeState }) {
  let body = null;
  if (status === "requested") body = "Live tracking starts once a collector is on the way.";
  else if (status === "assigned") body = "A collector has accepted your pickup. They'll share their location once they're on the way.";
  else if (status === "arrived") body = "Your collector has arrived.";
  else if (status === "en_route") {
    if (!loc) {
      body = "Your collector is on the way but isn't sharing their location right now.";
    } else {
      const straight = pickup ? formatDistance(haversineKm(loc, pickup)) : null;
      const route = routeState?.status === "ok" ? routeState.route : null;
      body = (
        <>
          <strong className={`cg-track-state cg-track-${freshness}`}>
            <Radio size={13} /> {freshness === "live" ? `Live · updated ${formatAge(loc.recordedAt, now)}` : `Last seen ${formatAge(loc.recordedAt, now)} — they may have a weak signal`}
          </strong>
          {freshness === "live" && route && (
            <span>Arriving in about {formatEta(route.durationSec)} · {formatDistance(route.distanceM / 1000)} by road (Google driving estimate)</span>
          )}
          {freshness === "live" && !route && straight && (
            <span>About {straight} away in a straight line. A driving time estimate isn't available right now.</span>
          )}
          {freshness === "stale" && straight && <span>Their last known position is about {straight} away in a straight line.</span>}
        </>
      );
    }
  } else return null;
  return <div className="cg-track" role="status" aria-live="polite">{body}</div>;
}
