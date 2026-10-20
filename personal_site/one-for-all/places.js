// Locations: their map marker and their panel. When two or more pins sit at a Location's
// spot (no position of their own), one Location marker with a count stands in for them all;
// it also marks a Location with nothing at it yet but something to read. Any Location's panel
// can be opened from that marker or from the Location link in a pin's pop-up.
import { toLatLng, isLocating } from "./view.js";
import { sanityIcon } from "./icons.js";
import { placesById } from "./state.js";
import { isDimmed, nameLabel } from "./markers.js";
import { closePin, connectionSection, detailRow, paragraphs, pinButton, setCopyLink } from "./popup.js";
import { showInAddress } from "./links.js";
import { relSample } from "./lines.js";

export const PLACE_ICON = { src: "/one-for-all/icons/hub.png", pixelated: true };

const placeModal = document.getElementById("place-modal");
let returnFocusTo = null;

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

const tag = (text) => Object.assign(document.createElement("span"), { className: "place-tag", textContent: text });

// Every pin at the place, grouped by type in legend order. Clicking one opens its pop-up,
// which then offers a way back here.
function recordList(place) {
  const box = document.createElement("div");
  box.className = "place-records";
  if (!place.entries.length) {
    box.textContent = "Nothing here yet.";
    return box;
  }
  const groups = new Map();
  for (const entry of place.entries) {
    if (!groups.has(entry.type)) groups.set(entry.type, []);
    groups.get(entry.type).push(entry);
  }
  const ordered = [...groups].sort(([a], [b]) => (a.legendOrder ?? 0) - (b.legendOrder ?? 0));
  for (const [type, entries] of ordered) {
    const heading = Object.assign(document.createElement("div"), {
      className: "place-group",
      textContent: `${entries.length === 1 ? type.title : type.plural || type.title} (${entries.length})`,
    });
    const list = Object.assign(document.createElement("ul"), { className: "place-list" });
    for (const entry of entries.sort((a, b) => a.pin.name.localeCompare(b.pin.name))) {
      const item = document.createElement("li");
      const button = pinButton(entry, place);
      button.className = "place-item";
      const icon = Object.assign(new Image(16, 16), { src: entry.icon.src, alt: "" });
      if (!entry.icon.pixelated) icon.classList.add("smooth");
      if (isDimmed(entry.pin)) icon.classList.add(`is-${entry.pin.status.style}`);
      button.prepend(icon);
      item.append(button);
      if (isDimmed(entry.pin)) item.append(tag(entry.pin.status.title));
      list.append(item);
    }
    box.append(heading, list);
  }
  return box;
}

// Lines between two pins at the same Location's spot would have no length, so they're listed here:
// network lines ("reports to") and Connections.
function innerLineList(place) {
  if (!place.innerReports.length && !place.innerLinks.length) return [];
  const heading = Object.assign(document.createElement("div"), {
    className: "place-group",
    textContent: "Lines here",
  });
  const list = Object.assign(document.createElement("ul"), { className: "place-list place-lines" });
  for (const { from, to } of place.innerReports) {
    const item = document.createElement("li");
    item.append(pinButton(from, place), " reports to ", pinButton(to, place));
    list.append(item);
  }
  const linkFor = panelLinkFor(place);
  for (const conn of place.innerLinks) {
    const item = document.createElement("li");
    const arrow = conn.rel.direction === "none" ? " — " : " → ";
    item.append(relSample(conn.rel), linkFor(conn.from), arrow, linkFor(conn.to), tag(conn.rel.title));
    list.append(item);
  }
  const box = Object.assign(document.createElement("div"), { className: "place-records" });
  box.append(heading, list);
  return [box];
}

// In a panel, pins open straight away (with a way back here) and Locations open their own panel.
const panelLinkFor = (place) => (end) => {
  if (end.entry) return pinButton(end.entry, place);
  if (end.place === place) return end.name; // this panel's own Location
  const button = Object.assign(document.createElement("button"), {
    type: "button",
    className: "pin-link",
    textContent: end.name,
  });
  button.addEventListener("click", () => showPlace(end.place));
  return button;
};

export function showPlace(place, { returnFocus } = {}) {
  closePin({ restoreFocus: false });
  returnFocusTo = returnFocus !== undefined ? returnFocus : (place.rep && place.rep.getElement()) || null;
  const { location, entries } = place;
  document.getElementById("place-name").textContent = location.name;
  const icon = document.getElementById("place-icon");
  icon.src = place.icon.src;
  icon.classList.toggle("smooth", !place.icon.pixelated);
  document.getElementById("place-kind").textContent =
    `Location · ${entries.length} ${entries.length === 1 ? "record" : "records"}`;
  document.getElementById("place-description").replaceChildren(...paragraphs(location.description));
  const details = (location.details || [])
    .filter(({ label, value }) => label && value && value.trim())
    .map(({ label, value }) => detailRow(label, value.trim()));
  const connections = connectionSection(place.links, panelLinkFor(place)).map((block) => {
    const box = Object.assign(document.createElement("div"), { className: "place-records" });
    box.append(block);
    return box;
  });
  const detailBox = details.length ? [Object.assign(document.createElement("div"), { className: "pin-details" })] : [];
  if (detailBox.length) detailBox[0].append(...details);
  document
    .getElementById("place-contents")
    .replaceChildren(...detailBox, recordList(place), ...connections, ...innerLineList(place));

  openModal("place-modal");
  setCopyLink(document.getElementById("place-copy-link"), place);
  showInAddress(place);
  (placeModal.querySelector(".place-item") || document.getElementById("place-ok")).focus();
}

export const isPlaceOpen = () => placeModal.style.display === "flex";

export function closePlace({ restoreFocus = true } = {}) {
  if (!isPlaceOpen()) return;
  closeModal("place-modal");
  showInAddress(null);
  if (restoreFocus && returnFocusTo) returnFocusTo.focus();
}

document.querySelectorAll(".place-close").forEach((b) => b.addEventListener("click", () => closePlace()));
placeModal.addEventListener("click", (e) => {
  if (e.target === placeModal) closePlace();
});
