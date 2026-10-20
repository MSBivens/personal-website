// The party's trail: a dotted line through the stops in Campaign Settings (oldest first) to
// the party pin, with a dot at each stop. A stop sits at its own X/Y, or at its Location's.
import { map, plainText, toLatLng } from "./view.js";
import { campaign, pinsById, placesById } from "./state.js";
import { legendState } from "./filters.js";

export const TRAIL_COLOR = "#8b1a1a";
const trailLayer = L.layerGroup().addTo(map);

function resolveStop(stop) {
  const place = placesById.get(stop.locationId) || null;
  const own = Number.isFinite(stop.x) && Number.isFinite(stop.y);
  const point = own ? { x: stop.x, y: stop.y } : place && place.point;
  if (!point) return null;
  return { ...stop, place, latlng: toLatLng(point.x, point.y) };
}

/** The stops that have somewhere to go, in order. */
export const trailStops = () => campaign.trail.map(resolveStop).filter(Boolean);

export function drawTrail() {
  trailLayer.clearLayers();
  if (!legendState.trail) return;
  const stops = trailStops();
  const party = pinsById.get(campaign.partyId);
  const points = stops.map((stop) => stop.latlng);
  if (party && party.marker) points.push(party.marker.getLatLng());
  if (points.length > 1) {
    // Zero-length dashes with round caps are dots.
    trailLayer.addLayer(
      L.polyline(points, { color: TRAIL_COLOR, weight: 4, dashArray: "0 9", lineCap: "round", opacity: 0.9, interactive: false }),
    );
  }
  stops.forEach((stop, i) => {
    const label = [stop.date || `Stop ${i + 1}`, stop.place && stop.place.location.name, stop.note].filter(Boolean).join(" · ");
    trailLayer.addLayer(
      L.circleMarker(stop.latlng, { radius: 5, color: TRAIL_COLOR, weight: 2, fillColor: "#fff", fillOpacity: 1 }).bindTooltip(plainText(label)),
    );
  });
}
