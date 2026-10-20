// Pin markers, and which marker stands for what at the moment.
// A pin sits at its own X/Y, or at its Location's position if it has none. Pins sharing a
// Location's spot are drawn as one Location marker (places.js); a lone one is drawn as itself.
// Nearby markers then merge into numbered clusters when zoomed out (Leaflet.markercluster).
import { map, plainText, toLatLng, toImagePoint, isLocating } from "./view.js";
import { FALLBACK_ICON, pinIcon, sanityIcon } from "./icons.js";
import { campaign, pinsById, placesById, typesById, waypointsById } from "./state.js";
import { showPin } from "./popup.js";
import { setPlaceIcon } from "./places.js";
import { PLACES, isHidden } from "./filters.js";
import { TYPE } from "./data.js";

// Statuses styled Dimmed or Faded grey the pin out (and dash a member's network line).
export const isDimmed = (pin) => Boolean(pin.status && pin.status.style && pin.status.style !== "normal");

// markercluster 1.5.3 floors the map's min zoom everywhere except these three methods. Our
// min zoom is fractional (the whole map just fits the window), so without the floor they skip
// markers that are never clustered and those never appear. Run them with the floored value.
for (const name of ["_recursivelyAnimateChildrenIn", "_recursivelyBecomeVisible", "_recursivelyAddChildrenToMap"]) {
  const original = L.MarkerCluster.prototype[name];
  L.MarkerCluster.prototype[name] = function (...args) {
    const map = this._group._map;
    const minZoom = map.getMinZoom();
    map.getMinZoom = () => Math.floor(minZoom);
    try {
      return original.apply(this, args);
    } finally {
      delete map.getMinZoom; // back to Leaflet's own
    }
  };
}

// A Location marker stands for several records, so clusters count records, not markers.
const recordsIn = (cluster) => cluster.getAllChildMarkers().reduce((n, m) => n + (m.records || 1), 0);

export const clusterGroup = L.markerClusterGroup({
  maxClusterRadius: 36,
  showCoverageOnHover: false,
  spiderfyDistanceMultiplier: 1.6,
  iconCreateFunction(cluster) {
    const n = recordsIn(cluster);
    return L.divIcon({
      html: `<span class="cluster-count" aria-hidden="true">${n}</span><span class="sr-only">${n} records here. Zoom in to see them.</span>`,
      className: "map-cluster",
      iconSize: [34, 34],
    });
  },
}).addTo(map);

// Clusters are focusable but, like markers, don't treat Enter/Space as a click.
map.getContainer().addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("map-cluster") && !isLocating()) {
    e.preventDefault();
    e.target.click();
  }
});

// The party pin sits outside the clusters, always on top.
export const partyLayer = L.layerGroup().addTo(map);

function partyIcon(icon) {
  const ring = Object.assign(document.createElement("span"), { className: "party-ring" });
  ring.append(Object.assign(new Image(32, 32), { src: icon.src, alt: "", className: icon.pixelated ? "" : "smooth" }));
  return L.divIcon({ html: ring, className: "map-pin party-pin", iconSize: [44, 44], iconAnchor: [22, 22] });
}

// Names under the markers once you're zoomed in far enough for them to fit.
const LABEL_ZOOM = 3.5;
export const nameLabel = (marker, name, gap = 14) =>
  marker.bindTooltip(plainText(name), { permanent: true, direction: "bottom", offset: [0, gap], className: "map-label" });
const syncLabels = () => map.getContainer().classList.toggle("show-labels", map.getZoom() >= LABEL_ZOOM);
map.on("zoomend", syncLabels);
syncLabels();

/** Where a pin sits: its own X/Y, else its Location's. Null if neither has one. */
export function positionOf(pin, place) {
  if (Number.isFinite(pin.x) && Number.isFinite(pin.y)) return { x: pin.x, y: pin.y, own: true };
  if (place && place.point) return { ...place.point, own: false };
  return null;
}

export function addPin(pin) {
  const type = typesById.get(pin.typeId);
  const place = placesById.get(pin.locationId) || null;
  const at = positionOf(pin, place);
  if (!type) {
    console.warn("Skipping pin with an unknown type:", pin);
    return;
  }
  // Post Offices are only waypoints for communication lines; they never get a marker.
  if (pin.typeId === TYPE.postOffice) {
    if (at) waypointsById.set(pin.id, { ...pin, x: at.x, y: at.y });
    return;
  }

  const icon = sanityIcon(pin.icon) || sanityIcon(pin.rank && pin.rank.icon) || type.icon || FALLBACK_ICON;
  const party = pin.id === campaign.partyId;
  // grouped: sits at its Location's spot, so it can be shown as part of the Location marker.
  const grouped = Boolean(at && !at.own && !party);
  const entry = { pin, type, icon, place, grouped, party, marker: null, rep: null, reports: [], links: [] };
  pinsById.set(pin.id, entry);
  if (place) {
    place.entries.push(entry);
    if (entry.grouped) place.grouped.push(entry);
  }
  if (!at) {
    // Still listed in its Location's panel and in links, just not drawn.
    console.warn(`${pin.name} has no position: give it an X/Y, or give ${place ? place.location.name : "it a Location"} one.`);
    return;
  }

  const marker = L.marker(toLatLng(at.x, at.y), {
    icon: party ? partyIcon(icon) : pinIcon(icon, isDimmed(pin) ? `is-${pin.status.style}` : ""),
    title: pin.name,
    alt: pin.name,
    riseOnHover: true,
    zIndexOffset: party ? 2000 : 0,
  });
  entry.marker = marker;
  nameLabel(marker, pin.name, party ? 20 : 14);
  marker.on("click", () => {
    if (!isLocating()) showPin(entry);
  });
  // Leaflet 1.9 makes markers focusable but doesn't treat Enter/Space as a click.
  // The element is recreated whenever the marker is re-added, so listen on each add.
  marker.on("add", () => {
    marker.getElement().addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && !isLocating()) {
        e.preventDefault();
        showPin(entry);
      }
    });
  });
}

// Decides which markers are on the map for the current Legend choices, and records on each
// pin and Location the marker that stands for it (`rep`, null when it isn't shown).
export function renderMarkers() {
  const layers = [];
  for (const entry of pinsById.values()) entry.rep = null;
  for (const place of placesById.values()) {
    place.rep = null;
    if (!place.marker) continue;
    const shown = place.grouped.filter((entry) => entry.marker && !isHidden(entry.pin.typeId));
    if (shown.length > 1) {
      setPlaceIcon(place, shown.length);
      place.rep = place.marker;
      for (const entry of shown) entry.rep = place.marker;
      layers.push(place.marker);
    } else if (shown.length === 1) {
      place.rep = shown[0].marker; // added with the other pins below
    } else if (!place.grouped.length && place.readable && !isHidden(PLACES)) {
      // Nothing here yet, but something to read: a plain Location marker.
      setPlaceIcon(place, 0);
      place.rep = place.marker;
      layers.push(place.marker);
    }
  }
  partyLayer.clearLayers();
  for (const entry of pinsById.values()) {
    if (!entry.marker || entry.rep || isHidden(entry.pin.typeId)) continue;
    entry.rep = entry.marker;
    if (entry.party) partyLayer.addLayer(entry.marker);
    else layers.push(entry.marker);
  }
  clusterGroup.clearLayers();
  clusterGroup.addLayers(layers);
}

// The marker or cluster `layer` is drawn as at the current zoom. Walks markercluster's
// cluster tree (`__parent`/`_zoom`, as of 1.5.3) instead of using getVisibleParent, which
// only knows about markers in view, so lines to off-screen pins would vanish.
function shownAs(layer) {
  if (!clusterGroup.hasLayer(layer)) return map.hasLayer(layer) ? layer : null; // the party pin
  const zoom = Math.round(map.getZoom());
  let shown = layer;
  while (shown.__parent && shown.__parent._zoom >= zoom) shown = shown.__parent;
  return shown;
}

/** Where lines to a layer should end right now: { x, y (image pixels), latlng, layer }. */
export function anchorOfLayer(layer) {
  const shown = layer && shownAs(layer);
  if (!shown) return null;
  const latlng = shown.getLatLng();
  const { x, y } = toImagePoint(latlng);
  return { x, y, latlng, layer: shown };
}

export const entryAnchor = (entry) => anchorOfLayer(entry.rep);

/** Two line ends drawn at the same marker, cluster or spot (a line would have no length). */
export const sameSpot = (a, b) => (a.layer && a.layer === b.layer) || (a.x === b.x && a.y === b.y);

// Close enough to read the place names on the map.
export const READABLE_ZOOM = 4;

/** Zooms in until `layer` is out of any cluster, then calls `done`. */
export function reveal(layer, done) {
  if (!layer || (!map.hasLayer(layer) && !clusterGroup.hasLayer(layer))) return done();
  const clustered = clusterGroup.hasLayer(layer);
  map.once("moveend", () => (clustered ? clusterGroup.zoomToShowLayer(layer, done) : done()));
  map.flyTo(layer.getLatLng(), Math.max(map.getZoom(), READABLE_ZOOM));
}
