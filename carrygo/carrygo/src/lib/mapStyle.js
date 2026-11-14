// Muted, low-noise map styling so the map reads as part of the product
// rather than a raw embedded widget. Roads and water are toned down,
// points-of-interest icons are hidden, and labels are quieted.

export const LIGHT_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#eef3ef" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#5b6e64" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { weight: 3 }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e1e8e3" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#fbfdfc" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dfe9e3" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#cfe3da" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#e6ede8" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#c7d2cb" }] },
];

export const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0f2019" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ea698" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b1911" }, { weight: 3 }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#16291f" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0f2019" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#1c3226" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0c231d" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#122820" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#26392f" }] },
];
