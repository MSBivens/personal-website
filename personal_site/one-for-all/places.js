// Locations and their map marker. When two or more pins sit at a Location's spot (no
// position of their own), one Location marker with a count stands in for them all; it also
// marks a Location with nothing at it yet but something to read. Its panel is in panel.js.
import { toLatLng, isLocating } from "./view.js";
import { sanityIcon } from "./icons.js";
import { placesById } from "./state.js";
import { nameLabel, selectedLayer } from "./markers.js";
import { showPlace } from "./panel.js";

export const PLACE_ICON = { src: "/one-for-all/icons/hub.png", pixelated: true };

export function addPlace(location) {
  const { x, y } = location;
  const place = {
    location,
    icon: sanityIcon(location.icon) || PLACE_ICON,
    point: Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null,
    // Worth a marker of its own even with no pins here.
    readable: Boolean(
      (location.description || "").trim() || (location.details || []).length || (location.connections || []).length,
    ),
    marker: null,
    rep: null,
    entries: [],
    grouped: [],
    links: [],
    innerReports: [],
    innerLinks: [],
  };
  if (place.point) place.marker = placeMarker(place);
  placesById.set(location.id, place);
}

function placeMarker(place) {
  const marker = L.marker(toLatLng(place.point.x, place.point.y), {
    riseOnHover: true,
    // Stands in for its whole spot, so it sits above any pin right next to it.
    zIndexOffset: 1000,
  });
  nameLabel(marker, place.location.name);
  marker.on("click", () => {
    if (!isLocating()) showPlace(place);
  });
  marker.on("add", () => {
    const el = marker.getElement();
    el.setAttribute("aria-label", marker.label);
    el.classList.toggle("is-selected", marker === selectedLayer());
    el.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && !isLocating()) {
        e.preventDefault();
        showPlace(place);
      }
    });
  });
  return marker;
}

// `count`: the records the marker stands for right now (0 for a Location with nothing here).
export function setPlaceIcon(place, count) {
  const { marker, location } = place;
  const content = document.createElement("span");
  content.className = "place-icon";
  content.append(Object.assign(new Image(32, 32), { src: place.icon.src, alt: "" }));
  if (count) {
    content.append(Object.assign(document.createElement("span"), { className: "place-count", textContent: count }));
  }
  marker.records = Math.max(count, 1);
  marker.label = count ? `${location.name}, ${count} records` : location.name;
  marker.options.title = count ? `${location.name} (${count})` : location.name;
  marker.setIcon(
    L.divIcon({
      html: content,
      className: `map-pin place-pin${place.icon.pixelated ? "" : " smooth"}`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    }),
  );
}
