// Locate mode: click the map to get X/Y to send to whoever updates it.
import { MAP_IMAGE, map, toLatLng, toImagePoint, isLocating } from "./view.js";

const locateToggle = document.getElementById("locate-toggle");
const locatePanel = document.getElementById("locate-panel");
const locateHint = document.getElementById("locate-hint");
const locateNote = document.getElementById("locate-note");
const locateOutput = document.getElementById("locate-output");
const locateCopy = document.getElementById("locate-copy");
const LOCATE_HINT = locateHint.textContent;
const locateIcon = L.divIcon({ className: "locate-marker", iconSize: [24, 24], iconAnchor: [12, 12] });
let locateMarker = null;
let locatePoint = null;

function updateLocateOutput() {
  if (!locatePoint) return;
  const coords = `X: ${locatePoint.x}, Y: ${locatePoint.y}`;
  const note = locateNote.value.trim();
  locateOutput.value = note ? `${note}: ${coords}` : coords;
  locateCopy.textContent = "Copy";
}

function onLocateClick(e) {
  const p = toImagePoint(e.latlng);
  const x = Math.round(p.x);
  const y = Math.round(p.y);
  if (x < 0 || y < 0 || x > MAP_IMAGE.width || y > MAP_IMAGE.height) return;

  locatePoint = { x, y };
  if (locateMarker) locateMarker.setLatLng(toLatLng(x, y));
  else locateMarker = L.marker(toLatLng(x, y), { icon: locateIcon, interactive: false, keyboard: false }).addTo(map);
  locateHint.textContent = "Click again to move the mark. Copy the text and send it to whoever updates the map.";
  locateCopy.disabled = false;
  updateLocateOutput();
}

function startLocating() {
  locatePanel.hidden = false;
  locateToggle.setAttribute("aria-pressed", "true");
  map.getContainer().classList.add("is-locating");
  map.on("click", onLocateClick);
}

export function stopLocating() {
  if (locatePanel.contains(document.activeElement)) locateToggle.focus();
  locatePanel.hidden = true;
  locateToggle.setAttribute("aria-pressed", "false");
  map.getContainer().classList.remove("is-locating");
  map.off("click", onLocateClick);
  if (locateMarker) locateMarker.remove();
  locateMarker = null;
  locatePoint = null;
  locateHint.textContent = LOCATE_HINT;
  locateNote.value = "";
  locateOutput.value = "";
  locateCopy.disabled = true;
  locateCopy.textContent = "Copy";
}

locateToggle.addEventListener("click", () => (isLocating() ? stopLocating() : startLocating()));
document.getElementById("locate-close").addEventListener("click", stopLocating);
locateNote.addEventListener("input", updateLocateOutput);
locateCopy.addEventListener("click", () => {
  locateOutput.select();
  navigator.clipboard
    .writeText(locateOutput.value)
    .then(() => (locateCopy.textContent = "Copied!"))
    .catch(() => (locateCopy.textContent = "Press Ctrl+C"));
});

// Old /one-for-all?place links open straight into locate mode.
if (new URLSearchParams(location.search).has("place")) startLocating();
