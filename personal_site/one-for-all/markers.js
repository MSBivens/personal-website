// One marker per Map Pin, grouped by Pin Type so the legend can show or hide a whole type.
// Pins attached to a Hub get no marker of their own; they're listed in the Hub's panel.
import { toLatLng, isLocating } from "./view.js";
import { FALLBACK_ICON, pinIcon, sanityIcon } from "./icons.js";
import { pinsById, placesById, typesById } from "./state.js";
import { showPin } from "./popup.js";
import { TYPE } from "./data.js";

// Pin Type id → L.layerGroup of that type's markers.
export const typeLayers = new Map();

// Statuses styled Dimmed or Faded grey the pin out (and dash a member's network line).
export const isDimmed = (pin) => Boolean(pin.status && pin.status.style && pin.status.style !== "normal");

// Where a pin sits for drawing lines: its own spot, or its Hub's spot if it's attached
// (`hub` is then that place). Null when it isn't on the map at all.
export function anchorOf(entry) {
  if (entry.pin.visibility !== "attached") return { latlng: toLatLng(entry.pin.x, entry.pin.y), hub: null };
  const { place } = entry;
  return place && place.isHub ? { latlng: toLatLng(place.location.x, place.location.y), hub: place } : null;
}

export function addPin(pin) {
  const type = typesById.get(pin.typeId);
  const attached = pin.visibility === "attached";
  if (!type || (!attached && (!Number.isFinite(pin.x) || !Number.isFinite(pin.y)))) {
    console.warn("Skipping pin with an unknown type or bad coordinates:", pin);
    return;
  }
  // Post Offices are only waypoints for communication lines; they never get a marker.
  if (pin.typeId === TYPE.postOffice) return;

  const place = placesById.get(pin.locationId) || null;
  if (attached && !(place && place.isHub)) {
    console.warn(`${pin.name} is attached to a Location that isn't a Hub, so it only shows in that Location's panel.`);
  }
  const icon = sanityIcon(pin.icon) || sanityIcon(pin.rank && pin.rank.icon) || type.icon || FALLBACK_ICON;
  const entry = { pin, type, marker: null, icon, place, reports: [] };
  pinsById.set(pin.id, entry);
  if (place) place.entries.push(entry);
  if (attached) return;

  if (!typeLayers.has(pin.typeId)) typeLayers.set(pin.typeId, L.layerGroup());
  const marker = L.marker(toLatLng(pin.x, pin.y), {
    icon: pinIcon(icon, isDimmed(pin) ? `is-${pin.status.style}` : ""),
    title: pin.name,
    alt: pin.name,
    riseOnHover: true,
  }).addTo(typeLayers.get(pin.typeId));
  entry.marker = marker;

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
