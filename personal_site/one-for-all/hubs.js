// Hubs and Location panels. A Hub is a Location with "Show as Hub" on: one marker standing
// in for a crowded spot, opening a panel that lists every pin there. Any Location's panel
// can also be opened from the Location link in a pin's pop-up.
import { toLatLng, isLocating } from "./view.js";
import { sanityIcon } from "./icons.js";
import { placesById } from "./state.js";
import { isDimmed } from "./markers.js";
import { closePin, connectionSection, paragraphs, pinButton, showPin } from "./popup.js";
import { relSample } from "./lines.js";

export const HUB_ICON = { src: "/one-for-all/icons/hub.png", pixelated: true };
export const hubLayer = L.layerGroup();

const placeModal = document.getElementById("place-modal");
let returnFocusTo = null;

export function addPlace(location) {
  placesById.set(location.id, {
    location,
    icon: sanityIcon(location.icon) || HUB_ICON,
    isHub: Boolean(location.isHub && Number.isFinite(location.x) && Number.isFinite(location.y)),
    marker: null,
    entries: [],
    links: [],
    innerReports: [],
    innerLinks: [],
  });
}

// Run once every pin has been placed, so each badge can count what's in its Hub.
export function addHubMarkers() {
  for (const place of placesById.values()) {
    if (!place.isHub) continue;
    const count = place.entries.length;
    const content = document.createElement("span");
    content.className = "hub-icon";
    content.append(
      Object.assign(new Image(32, 32), { src: place.icon.src, alt: "" }),
      Object.assign(document.createElement("span"), { className: "hub-count", textContent: count }),
    );
    const marker = L.marker(toLatLng(place.location.x, place.location.y), {
      icon: L.divIcon({
        html: content,
        className: `map-pin hub-pin${place.icon.pixelated ? "" : " smooth"}`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
      title: `${place.location.name} (${count})`,
      riseOnHover: true,
      // A Hub stands in for its whole spot, so it sits above any Map Pin right next to it.
      zIndexOffset: 1000,
    }).addTo(hubLayer);
    place.marker = marker;

    marker.on("click", () => {
      if (!isLocating()) showPlace(place);
    });
    marker.on("add", () => {
      const el = marker.getElement();
      el.setAttribute("aria-label", `${place.location.name} hub, ${count} ${count === 1 ? "record" : "records"}`);
      el.addEventListener("keydown", (e) => {
        if ((e.key === "Enter" || e.key === " ") && !isLocating()) {
          e.preventDefault();
          showPlace(place);
        }
      });
    });
  }
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
      if (entry.marker) item.append(tag("on map"));
      list.append(item);
    }
    box.append(heading, list);
  }
  return box;
}

// Lines between two pins in the same Hub would have no length, so they're listed here:
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
  returnFocusTo = returnFocus !== undefined ? returnFocus : (place.marker && place.marker.getElement()) || null;
  const { location, entries } = place;
  document.getElementById("place-name").textContent = location.name;
  const icon = document.getElementById("place-icon");
  icon.src = place.icon.src;
  icon.classList.toggle("smooth", !place.icon.pixelated);
  document.getElementById("place-kind").textContent =
    `${place.isHub ? "Hub" : "Location"} · ${entries.length} ${entries.length === 1 ? "record" : "records"}`;
  document.getElementById("place-description").replaceChildren(...paragraphs(location.description));
  const connections = connectionSection(place.links, panelLinkFor(place)).map((block) => {
    const box = Object.assign(document.createElement("div"), { className: "place-records" });
    box.append(block);
    return box;
  });
  document.getElementById("place-contents").replaceChildren(recordList(place), ...connections, ...innerLineList(place));

  openModal("place-modal");
  (placeModal.querySelector(".place-item") || document.getElementById("place-ok")).focus();
}

export const isPlaceOpen = () => placeModal.style.display === "flex";

export function closePlace({ restoreFocus = true } = {}) {
  if (!isPlaceOpen()) return;
  closeModal("place-modal");
  if (restoreFocus && returnFocusTo) returnFocusTo.focus();
}

document.querySelectorAll(".place-close").forEach((b) => b.addEventListener("click", () => closePlace()));
placeModal.addEventListener("click", (e) => {
  if (e.target === placeModal) closePlace();
});
