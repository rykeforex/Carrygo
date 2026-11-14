import { loadGoogleMaps } from "./loadGoogleMaps";

// Real driving route + duration from Google. Throws if Maps/Directions is unavailable — callers must
// then show NO ETA rather than guess one.
export async function getRoute(from, to) {
  const maps = await loadGoogleMaps();
  const res = await new maps.DirectionsService().route({ origin: from, destination: to, travelMode: maps.TravelMode.DRIVING });
  const route = res.routes?.[0];
  const leg = route?.legs?.[0];
  if (!leg) throw new Error("no_route");
  return {
    durationSec: leg.duration.value,
    distanceM: leg.distance.value,
    path: route.overview_path.map((p) => ({ lat: p.lat(), lng: p.lng() })),
  };
}
