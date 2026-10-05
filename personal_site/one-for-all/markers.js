// One marker per pin, grouped by Pin Type so the legend can show or hide a whole type.
import { toLatLng, isLocating } from "./view.js";
import { FALLBACK_ICON, pinIcon, sanityIcon } from "./icons.js";
import { pinsById, typesById } from "./state.js";
import { showPin } from "./popup.js";
import { TYPE } from "./data.js";

// Pin Type id → L.layerGroup of that type's markers.
export const typeLayers = new Map();

// Statuses styled Dimmed or Faded grey the pin out (and dash a member's network line).
export const isDimmed = (pin) => Boolean(pin.status && pin.status.style && pin.status.style !== "normal");

export function addPin(pin) {
  const type = typesById.get(pin.typeId);
  if (!type || !Number.isFinite(pin.x) || !Number.isFinite(pin.y)) {
    console.warn("Skipping pin with an unknown type or bad coordinates:", pin);
    return;
  }
  // Post Offices are only waypoints for communication lines; they never get a marker.
  if (pin.typeId === TYPE.postOffice) return;

  const icon = sanityIcon(pin.icon) || sanityIcon(pin.rank && pin.rank.icon) || type.icon || FALLBACK_ICON;
  if (!typeLayers.has(pin.typeId)) typeLayers.set(pin.typeId, L.layerGroup());
  const marker = L.marker(toLatLng(pin.x, pin.y), {
    icon: pinIcon(icon, isDimmed(pin) ? `is-${pin.status.style}` : ""),
    title: pin.name,
    alt: pin.name,
    riseOnHover: true,
  }).addTo(typeLayers.get(pin.typeId));

  const entry = { pin, type, marker, icon, reports: [] };
  pinsById.set(pin.id, entry);
  marker.on("click", () => {
    if (!isLocating()) showPin(entry);
  });
  // Leaflet 1.9 makes markers focusable but doesn't treat Enter/Space as a click.
  // The element is recreated whenever a legend filter re-adds the marker, so listen on each add.
  marker.on("add", () => {
    marker.getElement().addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && !isLocating()) {
        e.preventDefault();
        showPin(entry);
      }
    });
  });
}
