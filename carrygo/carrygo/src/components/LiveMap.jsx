import React, { useEffect, useRef, useState } from "react";
import { KeyRound } from "lucide-react";
import { loadGoogleMaps } from "../lib/loadGoogleMaps";
import { LIGHT_MAP_STYLE, DARK_MAP_STYLE } from "../lib/mapStyle";

const GHANA_CENTER = { lat: 5.6037, lng: -0.187 }; // map centre only — never used as a booking coordinate

function svgIcon(maps, svg, size) {
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new maps.Size(size, size),
    anchor: new maps.Point(size / 2, size / 2),
  };
}
const pinIcon = (maps, color) =>
  svgIcon(maps, `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34"><circle cx="17" cy="17" r="16" fill="${color}" stroke="white" stroke-width="2.5"/><circle cx="17" cy="17" r="5.5" fill="white"/></svg>`, 34);
const truckIcon = (maps, color) =>
  svgIcon(maps, `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="17" fill="${color}" stroke="white" stroke-width="2.5"/><path d="M9 22V14a1 1 0 0 1 1-1h9v9H10a1 1 0 0 1-1-1Z" fill="white"/><path d="M19 17h4.2a1 1 0 0 1 .8.4l2 2.6a1 1 0 0 1 .2.6V22a1 1 0 0 1-1 1H19v-6Z" fill="white"/><circle cx="14" cy="24" r="1.8" fill="${color}"/><circle cx="23.5" cy="24" r="1.8" fill="${color}"/></svg>`, 36);

export default function LiveMap({ theme = "light", pickup, collector, height = 280, zoom = 14, className = "", editable = false, onPick, onStatus, routePath }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const mapsRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const collectorMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const onPickRef = useRef(onPick);
  const editableRef = useRef(editable);
  const onStatusRef = useRef(onStatus);
  const [status, setStatus] = useState("loading"); // loading | ready | no-key | error
  onPickRef.current = onPick;
  editableRef.current = editable;
  onStatusRef.current = onStatus;

  const plat = pickup?.lat;
  const plng = pickup?.lng;
  const clat = collector?.lat;
  const clng = collector?.lng;
  const pathKey = routePath && routePath.length > 1 ? `${routePath.length}:${routePath[0].lat},${routePath[routePath.length - 1].lat}` : "";

  useEffect(() => { onStatusRef.current?.(status); }, [status]);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        mapsRef.current = maps;
        const map = new maps.Map(containerRef.current, {
          center: plat != null ? { lat: plat, lng: plng } : GHANA_CENTER,
          zoom: plat != null ? zoom : 11,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          styles: theme === "dark" ? DARK_MAP_STYLE : LIGHT_MAP_STYLE,
        });
        map.addListener("click", (e) => {
          if (editableRef.current && onPickRef.current) onPickRef.current({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        });
        mapRef.current = map;
        setStatus("ready");
      })
      .catch((err) => { if (!cancelled) setStatus(err?.message === "missing-api-key" ? "no-key" : "error"); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status === "ready") mapRef.current.setOptions({ styles: theme === "dark" ? DARK_MAP_STYLE : LIGHT_MAP_STYLE });
  }, [theme, status]);

  useEffect(() => {
    if (status !== "ready") return;
    const maps = mapsRef.current;
    if (plat == null) {
      pickupMarkerRef.current?.setMap(null);
      pickupMarkerRef.current = null;
      return;
    }
    const pos = { lat: plat, lng: plng };
    if (!pickupMarkerRef.current) {
      const m = new maps.Marker({ position: pos, map: mapRef.current, icon: pinIcon(maps, "#d33d42"), title: "Pickup location", draggable: editableRef.current });
      m.addListener("dragend", (e) => {
        if (editableRef.current && onPickRef.current) onPickRef.current({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      });
      pickupMarkerRef.current = m;
    } else {
      pickupMarkerRef.current.setPosition(pos);
    }
    pickupMarkerRef.current.setDraggable(editable);
    mapRef.current.panTo(pos);
  }, [status, plat, plng, editable]);

  useEffect(() => {
    if (status !== "ready") return;
    const maps = mapsRef.current;
    if (clat == null) {
      collectorMarkerRef.current?.setMap(null); collectorMarkerRef.current = null;
      polylineRef.current?.setMap(null); polylineRef.current = null;
      return;
    }
    const pos = { lat: clat, lng: clng };
    if (!collectorMarkerRef.current) {
      collectorMarkerRef.current = new maps.Marker({ position: pos, map: mapRef.current, icon: truckIcon(maps, "#2f65c9"), title: "Your collector", zIndex: 999 });
    } else collectorMarkerRef.current.setPosition(pos);
    // Only draw a line when Google gave us a real route. A straight line would imply a path that doesn't exist.
    if (routePath && routePath.length > 1) {
      if (!polylineRef.current) polylineRef.current = new maps.Polyline({ path: routePath, map: mapRef.current, strokeColor: "#2f65c9", strokeOpacity: 0.75, strokeWeight: 4 });
      else polylineRef.current.setPath(routePath);
    } else if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }
    if (plat != null) {
      const b = mapRef.current.getBounds();
      if (!b || !b.contains(pos)) {
        const nb = new maps.LatLngBounds();
        nb.extend(pos); nb.extend({ lat: plat, lng: plng });
        mapRef.current.fitBounds(nb, 60);
      }
    }
  }, [status, clat, clng, plat, plng, pathKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`cg-map-frame ${className}`} style={{ height }}>
      <div ref={containerRef} className="cg-map-canvas" />
      {status !== "ready" && (
        <div className="cg-map-fallback">
          <svg className="cg-map-art" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustrative map">
            <circle cx="70" cy="64" r="48" className="cg-map-art-park" />
            <circle cx="338" cy="196" r="64" className="cg-map-art-water" />
            <path d="M-10 210 C 80 190 130 140 205 150 S 330 120 410 86" className="cg-map-art-road" />
            <path d="M-10 62 C 90 84 150 40 236 56 S 344 30 410 52" className="cg-map-art-road cg-map-art-road-2" />
            <path d="M118 -10 C 130 70 170 130 150 270" className="cg-map-art-road cg-map-art-road-2" />
            <path d="M112 196 C 164 176 196 112 256 92" className="cg-map-art-route" />
            <circle cx="112" cy="196" r="9" className="cg-map-art-pin-a" />
            <circle cx="256" cy="92" r="9" className="cg-map-art-pin-b" />
          </svg>
          <div className="cg-map-caption">
            <KeyRound size={12} />
            {status === "loading" ? "Loading map…" : "Illustration — add a Google Maps key to enable the live map"}
          </div>
        </div>
      )}
    </div>
  );
}
