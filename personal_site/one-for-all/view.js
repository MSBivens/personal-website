// The Leaflet map itself, plus conversions between map positions and image pixels (X/Y).

// Must match the output of `npm run tiles` (see tools/make-tiles.js).
export const MAP_IMAGE = { width: 8192, height: 5837, maxZoom: 5 };
const TILE_URL = "/one-for-all/tiles/{z}/{y}/{x}.webp";

export const map = L.map("map", {
  crs: L.CRS.Simple,
  zoomSnap: 0,
  zoomDelta: 0.5,
  attributionControl: false,
  maxBoundsViscosity: 1,
});

export const toLatLng = (x, y) => map.unproject([x, y], MAP_IMAGE.maxZoom);
export const toImagePoint = (latlng) => map.project(latlng, MAP_IMAGE.maxZoom);
// In locate mode, clicks place the locate mark instead of opening pins.
export const isLocating = () => map.getContainer().classList.contains("is-locating");

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
