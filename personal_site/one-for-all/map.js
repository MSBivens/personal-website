// Must match the output of `npm run tiles` (see tools/make-tiles.js).
const MAP_IMAGE = { width: 8192, height: 5837, maxZoom: 5 };
const TILE_URL = "/one-for-all/tiles/{z}/{y}/{x}.webp";
const PINS_URL = "/one-for-all/pins.json";

const ICON_BASE = "https://win98icons.alexmeub.com/icons/png/";
const PIN_TYPES = {
  person: { label: "Person", src: ICON_BASE + "msagent-2.png" },
  place: { label: "Place", src: ICON_BASE + "world_star-0.png" },
  thing: { label: "Thing", src: ICON_BASE + "keys-3.png" },
};
for (const type of Object.values(PIN_TYPES)) {
  type.icon = L.icon({
    iconUrl: type.src,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    className: "map-pin",
  });
}

const map = L.map("map", {
  crs: L.CRS.Simple,
  zoomSnap: 0,
  zoomDelta: 0.5,
  attributionControl: false,
  maxBoundsViscosity: 1,
});

const toLatLng = (x, y) => map.unproject([x, y], MAP_IMAGE.maxZoom);
const toImagePoint = (latlng) => map.project(latlng, MAP_IMAGE.maxZoom);
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

function showPin(pin, type, marker) {
  returnFocusTo = marker ? marker.getElement() : null;
  document.getElementById("pin-name").textContent = pin.name;
  document.getElementById("pin-icon").src = type.src;
  document.getElementById("pin-type").textContent = type.label;

  const description = document.getElementById("pin-description");
  description.replaceChildren(
    ...[].concat(pin.description || []).map((text) => {
      const p = document.createElement("p");
      p.textContent = text;
      return p;
    }),
  );

  openModal("pin-modal");
  document.getElementById("pin-ok").focus();
}

function closePin() {
  if (pinModal.style.display !== "flex") return;
  closeModal("pin-modal");
  if (returnFocusTo) returnFocusTo.focus();
}

document.querySelectorAll(".pin-close").forEach((b) => b.addEventListener("click", closePin));
pinModal.addEventListener("click", (e) => {
  if (e.target === pinModal) closePin();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closePin();
});

function showError(message) {
  showPin(
    { name: "Error", description: [message] },
    { label: "pins.json could not be loaded", src: ICON_BASE + "msg_error-0.png" },
  );
}

/* ---------- Pins ---------- */
fetch(PINS_URL)
  .then((res) => {
    if (!res.ok) throw new Error(`${PINS_URL} returned ${res.status}`);
    return res.json();
  })
  .then((pins) => {
    for (const pin of pins) {
      const type = PIN_TYPES[String(pin.type).toLowerCase()];
      if (!type || !Number.isFinite(pin.x) || !Number.isFinite(pin.y)) {
        console.warn("Skipping pin with a bad type or coordinates:", pin);
        continue;
      }
      const marker = L.marker(toLatLng(pin.x, pin.y), {
        icon: type.icon,
        title: pin.name,
        alt: pin.name,
        riseOnHover: true,
      }).addTo(map);
      marker.on("click", () => showPin(pin, type, marker));
      // Leaflet 1.9 makes markers focusable but doesn't treat Enter/Space as a click.
      marker.getElement().addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          showPin(pin, type, marker);
        }
      });
    }
  })
  .catch((err) => showError(err.message));

/* ---------- Placement mode (/one-for-all?place) ---------- */
if (new URLSearchParams(location.search).has("place")) {
  const panel = document.getElementById("place-panel");
  const snippet = document.getElementById("place-snippet");
  const copyButton = document.getElementById("place-copy");
  const hint = document.getElementById("place-hint");
  let placeMarker = null;
  panel.hidden = false;

  map.on("click", (e) => {
    const p = toImagePoint(e.latlng);
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    if (x < 0 || y < 0 || x > MAP_IMAGE.width || y > MAP_IMAGE.height) return;

    if (placeMarker) placeMarker.setLatLng(toLatLng(x, y));
    else placeMarker = L.marker(toLatLng(x, y), { icon: PIN_TYPES.place.icon, keyboard: false }).addTo(map);

    hint.textContent = `x: ${x}, y: ${y}`;
    snippet.value = JSON.stringify(
      { name: "New pin", type: "place", x, y, description: ["Write your notes here."] },
      null,
      2,
    ) + ",";
    copyButton.disabled = false;
    copyButton.textContent = "Copy";
  });

  copyButton.addEventListener("click", () => {
    snippet.select();
    navigator.clipboard
      .writeText(snippet.value)
      .then(() => (copyButton.textContent = "Copied!"))
      .catch(() => (copyButton.textContent = "Press Ctrl+C"));
  });
}
