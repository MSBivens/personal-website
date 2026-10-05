// The pin pop-up (a Win95 dialog), and the links in it that jump between pins.
import { map, toLatLng, isLocating } from "./view.js";
import { ICON_BASE, sanityIcon } from "./icons.js";
import { pinsById } from "./state.js";
import { stopLocating } from "./locate.js";

const pinModal = document.getElementById("pin-modal");
let returnFocusTo = null;

function detailRow(label, ...content) {
  const row = document.createElement("div");
  row.className = "prop-row";
  const name = document.createElement("span");
  name.className = "prop-label";
  name.textContent = `${label}:`;
  const value = document.createElement("span");
  value.className = "prop-value";
  value.append(...content);
  row.append(name, value);
  return row;
}

function pinLink(entry) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "pin-link";
  button.textContent = entry.pin.name;
  button.addEventListener("click", () => goToPin(entry));
  return button;
}

// Studio descriptions are plain text; a blank line starts a new paragraph.
function paragraphs(description) {
  const parts = Array.isArray(description)
    ? description
    : String(description || "").trim().split(/\n\s*\n/);
  return parts
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text) => {
      const p = document.createElement("p");
      p.textContent = text;
      return p;
    });
}

export function showPin(entry) {
  const { pin, type, icon } = entry;
  returnFocusTo = (entry.marker && entry.marker.getElement()) || null;
  document.getElementById("pin-name").textContent = pin.name;
  const header = document.getElementById("pin-icon");
  header.src = icon.src;
  header.classList.toggle("smooth", !icon.pixelated);
  document.getElementById("pin-type").textContent = type.title;

  const rows = [];
  if (pin.location) rows.push(detailRow("Location", pin.location));
  if (pin.rank) {
    const rankIcon = sanityIcon(pin.rank.icon);
    const img = rankIcon
      ? Object.assign(new Image(16, 16), {
          src: rankIcon.src,
          alt: "",
          className: rankIcon.pixelated ? "pin-rank-icon" : "pin-rank-icon smooth",
        })
      : "";
    rows.push(detailRow("Rank", img, pin.rank.title || "Unnamed rank"));
  }
  if (pin.status && pin.status.title) rows.push(detailRow("Status", pin.status.title));
  const superior = pinsById.get(pin.reportsTo);
  if (superior) rows.push(detailRow("Reports to", pinLink(superior)));
  if (entry.reports.length) {
    const links = entry.reports.flatMap((report, i) => (i ? [", ", pinLink(report)] : [pinLink(report)]));
    rows.push(detailRow("Direct reports", ...links));
  }
  document.getElementById("pin-details").replaceChildren(...rows);
  document.getElementById("pin-description").replaceChildren(...paragraphs(pin.description));

  openModal("pin-modal");
  document.getElementById("pin-ok").focus();
}

export function closePin({ restoreFocus = true } = {}) {
  if (pinModal.style.display !== "flex") return;
  closeModal("pin-modal");
  if (restoreFocus && returnFocusTo) returnFocusTo.focus();
}

// Used by the Reports to / Direct reports links: fly to the other pin, then open it.
function goToPin(entry) {
  closePin({ restoreFocus: false });
  map.once("moveend", () => showPin(entry));
  map.flyTo(toLatLng(entry.pin.x, entry.pin.y), Math.max(map.getZoom(), 4));
}

export function showError(message) {
  showPin({
    pin: { name: "Error", description: [message] },
    type: { title: "Map data could not be loaded" },
    icon: { src: ICON_BASE + "msg_error-0.png", pixelated: true },
    reports: [],
  });
}

document.querySelectorAll(".pin-close").forEach((b) => b.addEventListener("click", () => closePin()));
pinModal.addEventListener("click", (e) => {
  if (e.target === pinModal) closePin();
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (pinModal.style.display === "flex") closePin();
  else if (isLocating()) stopLocating();
});
