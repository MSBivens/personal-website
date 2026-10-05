// Must match the output of `npm run tiles` (see tools/make-tiles.js).
const MAP_IMAGE = { width: 8192, height: 5837, maxZoom: 5 };
const TILE_URL = "/one-for-all/tiles/{z}/{y}/{x}.webp";

// Pins are edited in Sanity Studio (see docs/adding-map-pins.md). The dataset is
// public, so published pins are read straight from Sanity's CDN without a token.
const SANITY = { projectId: "ohnkcmr7", dataset: "production", apiVersion: "2025-02-19" };
const PINS_QUERY = `*[_type == "pin"]{
  "id": _id, name, type, location, x, y, description,
  type == "member" => {
    status,
    "reportsTo": reportsTo._ref,
    "rank": rank->{ title, order, "icon": icon.asset->url }
  }
}`;
const PINS_URL =
  `https://${SANITY.projectId}.apicdn.sanity.io/v${SANITY.apiVersion}/data/query/${SANITY.dataset}` +
  `?query=${encodeURIComponent(PINS_QUERY)}`;

const ICON_BASE = "https://win98icons.alexmeub.com/icons/png/";
// Keys match the `type` values in studio/schemaTypes/pin.ts.
const PIN_TYPES = {
  member: { label: "Member", src: ICON_BASE + "msagent-2.png" },
  enemy: { label: "Enemy", src: ICON_BASE + "msg_warning-0.png" },
  resource: { label: "Resource", src: ICON_BASE + "briefcase-0.png" },
  safehouse: { label: "Safe House", src: ICON_BASE + "key_padlock-0.png" },
  landmark: { label: "Landmark", src: ICON_BASE + "world_star-0.png" },
};
const STATUS_LABELS = { active: "Active", compromised: "Compromised", dead: "Dead" };

const iconCache = new Map();
function pinIcon(src, className = "") {
  const key = `${src}|${className}`;
  if (!iconCache.has(key)) {
    iconCache.set(
      key,
      L.icon({
        iconUrl: src,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: `map-pin ${className}`.trim(),
      }),
    );
  }
  return iconCache.get(key);
}

// Sanity resizes uploads on the fly, so rank icons arrive small whatever was uploaded.
const rankIconUrl = (rank) => (rank && rank.icon ? `${rank.icon}?w=64&h=64&fit=max` : null);
const isActive = (pin) => !pin.status || pin.status === "active";

const map = L.map("map", {
  crs: L.CRS.Simple,
  zoomSnap: 0,
  zoomDelta: 0.5,
  attributionControl: false,
  maxBoundsViscosity: 1,
});

const toLatLng = (x, y) => map.unproject([x, y], MAP_IMAGE.maxZoom);
const toImagePoint = (latlng) => map.project(latlng, MAP_IMAGE.maxZoom);
// In locate mode, clicks place the locate mark instead of opening pins.
const isLocating = () => map.getContainer().classList.contains("is-locating");
const imageBounds = L.latLngBounds(
  toLatLng(0, MAP_IMAGE.height),
  toLatLng(MAP_IMAGE.width, 0),
);

// Leaflet picks the nearest tile level for in-between zooms, which can stretch
// lower-res tiles (blurry). Pick the next level up instead so tiles only ever shrink.
const CrispTileLayer = L.TileLayer.extend({
  _setView(center, zoom, noPrune, noUpdate) {
    L.TileLayer.prototype._setView.call(this, center, Math.ceil(zoom - 1e-6), noPrune, noUpdate);
    this._setZoomTransforms(center, zoom);
  },
});

new CrispTileLayer(TILE_URL, {
  bounds: imageBounds,
  maxNativeZoom: MAP_IMAGE.maxZoom,
  maxZoom: MAP_IMAGE.maxZoom + 1,
  noWrap: true,
}).addTo(map);

function fitWholeMap() {
  map.setMinZoom(map.getBoundsZoom(imageBounds));
}
map.setMaxZoom(MAP_IMAGE.maxZoom + 1);
map.setMaxBounds(imageBounds);
map.fitBounds(imageBounds);
fitWholeMap();
map.on("resize", fitWholeMap);

/* ---------- Pin pop-up ---------- */
const pinModal = document.getElementById("pin-modal");
let returnFocusTo = null;

// id → { pin, type, marker, iconSrc, reports: [entries that report to this pin] }
const pinsById = new Map();

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

function showPin(entry) {
  const { pin, type } = entry;
  returnFocusTo = (entry.marker && entry.marker.getElement()) || null;
  document.getElementById("pin-name").textContent = pin.name;
  const icon = document.getElementById("pin-icon");
  icon.src = entry.iconSrc || type.src;
  icon.classList.toggle("is-rank", Boolean(rankIconUrl(pin.rank)));
  document.getElementById("pin-type").textContent = type.label;

  const rows = [];
  if (pin.location) rows.push(detailRow("Location", pin.location));
  if (pin.rank) {
    const rankIcon = rankIconUrl(pin.rank);
    const img = rankIcon ? Object.assign(new Image(16, 16), { src: rankIcon, alt: "", className: "pin-rank-icon" }) : "";
    rows.push(detailRow("Rank", img, pin.rank.title || "Unnamed rank"));
  }
  if (pin.type === "member") rows.push(detailRow("Status", STATUS_LABELS[pin.status] || "Active"));
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

function closePin({ restoreFocus = true } = {}) {
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

document.querySelectorAll(".pin-close").forEach((b) => b.addEventListener("click", () => closePin()));
pinModal.addEventListener("click", (e) => {
  if (e.target === pinModal) closePin();
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (pinModal.style.display === "flex") closePin();
  else if (isLocating()) stopLocating();
});

function showError(message) {
  showPin({
    pin: { name: "Error", description: [message] },
    type: { label: "Map data could not be loaded", src: ICON_BASE + "msg_error-0.png" },
    reports: [],
  });
}

/* ---------- Pins ---------- */
const typeLayers = {};
for (const key of Object.keys(PIN_TYPES)) typeLayers[key] = L.layerGroup();

function addPin(pin) {
  const type = PIN_TYPES[pin.type];
  if (!type || !Number.isFinite(pin.x) || !Number.isFinite(pin.y)) {
    console.warn("Skipping pin with a bad type or coordinates:", pin);
    return;
  }
  const rankSrc = rankIconUrl(pin.rank);
  const classes = [rankSrc && "rank-pin", !isActive(pin) && `is-${pin.status}`].filter(Boolean).join(" ");
  const iconSrc = rankSrc || type.src;
  const marker = L.marker(toLatLng(pin.x, pin.y), {
    icon: pinIcon(iconSrc, classes),
    title: pin.name,
    alt: pin.name,
    riseOnHover: true,
  }).addTo(typeLayers[pin.type]);

  const entry = { pin, type, marker, iconSrc, reports: [] };
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

/* ---------- Network lines ---------- */
const networkLayer = L.layerGroup().addTo(map);
const networkLinks = []; // { line, from, to }

function connectNetwork() {
  for (const entry of pinsById.values()) {
    const { pin } = entry;
    if (!pin.reportsTo) continue;
    const superior = pinsById.get(pin.reportsTo);
    if (!superior) {
      console.warn(`${pin.name} reports to a pin that isn't published:`, pin.reportsTo);
      continue;
    }
    superior.reports.push(entry);
    const line = L.polyline([toLatLng(pin.x, pin.y), toLatLng(superior.pin.x, superior.pin.y)], {
      className: "network-line",
      color: "#000080",
      weight: 2,
      opacity: 0.8,
      dashArray: isActive(pin) ? null : "6 6",
    }).bindTooltip(`${pin.name} → ${superior.pin.name}`, { sticky: true });
    networkLinks.push({ line, from: entry, to: superior });
  }

  const rankOrder = (entry) => (entry.pin.rank && Number.isFinite(entry.pin.rank.order) ? entry.pin.rank.order : Infinity);
  for (const entry of pinsById.values()) {
    entry.reports.sort((a, b) => rankOrder(a) - rankOrder(b) || a.pin.name.localeCompare(b.pin.name));
  }
}

/* ---------- Legend ---------- */
const LEGEND_KEY = "one-for-all-legend";
const legendState = (() => {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(LEGEND_KEY)) || {};
  } catch {}
  return {
    hidden: new Set(Array.isArray(saved.hidden) ? saved.hidden : []),
    network: saved.network === true,
    collapsed: saved.collapsed === true,
  };
})();

function saveLegendState() {
  try {
    localStorage.setItem(
      LEGEND_KEY,
      JSON.stringify({ ...legendState, hidden: [...legendState.hidden] }),
    );
  } catch {}
}

function refreshMap() {
  for (const [key, layer] of Object.entries(typeLayers)) {
    if (legendState.hidden.has(key)) layer.remove();
    else layer.addTo(map);
  }
  networkLayer.clearLayers();
  if (!legendState.network) return;
  for (const { line, from, to } of networkLinks) {
    if (!legendState.hidden.has(from.pin.type) && !legendState.hidden.has(to.pin.type)) {
      networkLayer.addLayer(line);
    }
  }
}

function legendRow(labelContent, checked, onChange) {
  const label = document.createElement("label");
  label.className = "legend-row";
  const box = Object.assign(document.createElement("input"), { type: "checkbox", checked });
  box.addEventListener("change", () => {
    onChange(box.checked);
    saveLegendState();
    refreshMap();
  });
  label.append(box, ...labelContent);
  return label;
}

const Legend = L.Control.extend({
  options: { position: "bottomleft" },

  onAdd() {
    const container = L.DomUtil.create("div", "prop-window map-legend");
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);

    const body = document.createElement("div");
    body.className = "prop-body";
    body.id = "legend-body";
    body.hidden = legendState.collapsed;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.setAttribute("aria-controls", body.id);
    const syncToggle = () => {
      toggle.textContent = body.hidden ? "□" : "_";
      toggle.setAttribute("aria-label", body.hidden ? "Show legend" : "Hide legend");
      toggle.setAttribute("aria-expanded", String(!body.hidden));
    };
    syncToggle();
    toggle.addEventListener("click", () => {
      body.hidden = !body.hidden;
      legendState.collapsed = body.hidden;
      syncToggle();
      saveLegendState();
    });

    const titleBar = document.createElement("div");
    titleBar.className = "title-bar";
    const title = document.createElement("span");
    title.textContent = "Legend";
    const controls = document.createElement("div");
    controls.className = "title-controls";
    controls.append(toggle);
    titleBar.append(title, controls);

    const counts = {};
    for (const { pin } of pinsById.values()) counts[pin.type] = (counts[pin.type] || 0) + 1;

    for (const [key, type] of Object.entries(PIN_TYPES)) {
      const icon = Object.assign(new Image(16, 16), { src: type.src, alt: "" });
      const count = Object.assign(document.createElement("span"), {
        className: "legend-count",
        textContent: `(${counts[key] || 0})`,
      });
      body.append(
        legendRow([icon, type.label, count], !legendState.hidden.has(key), (checked) => {
          if (checked) legendState.hidden.delete(key);
          else legendState.hidden.add(key);
        }),
      );
    }
    const swatch = Object.assign(document.createElement("span"), { className: "legend-line" });
    body.append(
      document.createElement("hr"),
      legendRow([swatch, "Network lines"], legendState.network, (checked) => {
        legendState.network = checked;
      }),
    );

    container.append(titleBar, body);
    return container;
  },
});

fetch(PINS_URL)
  .then((res) => {
    if (!res.ok) throw new Error(`Sanity returned ${res.status} for the pin query.`);
    return res.json();
  })
  .then(({ result }) => {
    for (const pin of result) addPin(pin);
    connectNetwork();
    new Legend().addTo(map);
    refreshMap();
  })
  .catch((err) => showError(err.message));

/* ---------- Locate mode: click the map to get X/Y to send to whoever updates it ---------- */
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

function stopLocating() {
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
