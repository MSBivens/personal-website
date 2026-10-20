// Network lines: one from each member to whoever they report to, drawn from whatever
// currently stands for each end (its own marker, its Location's marker, or a cluster).
import { map, plainText } from "./view.js";
import { pinsById } from "./state.js";
import { entryAnchor, isDimmed, sameSpot } from "./markers.js";
import { pairKey } from "./lines.js";
import { legendState } from "./filters.js";

export const networkLayer = L.layerGroup().addTo(map);
const reportLinks = []; // { from, to }: entries

// Reads every "Reports to" once. Two members at the same Location's spot are listed in its
// panel instead of drawn.
export function collectNetwork() {
  for (const entry of pinsById.values()) {
    const { pin } = entry;
    if (!pin.reportsTo) continue;
    const superior = pinsById.get(pin.reportsTo);
    if (!superior) {
      console.warn(`${pin.name} reports to a pin that isn't on the map (unpublished or off the map):`, pin.reportsTo);
      continue;
    }
    superior.reports.push(entry);
    if (entry.grouped && superior.grouped && entry.place === superior.place) {
      entry.place.innerReports.push({ from: entry, to: superior });
    } else {
      reportLinks.push({ from: entry, to: superior });
    }
  }

  const rankOrder = (entry) => (entry.pin.rank && Number.isFinite(entry.pin.rank.order) ? entry.pin.rank.order : Infinity);
  for (const entry of pinsById.values()) {
    entry.reports.sort((a, b) => rankOrder(a) - rankOrder(b) || a.pin.name.localeCompare(b.pin.name));
  }
}

// Draws the network lines if they're ticked. Returns the point pairs they use, so
// relationship lines between the same two points bow around them (see lines.js).
export function drawNetwork() {
  networkLayer.clearLayers();
  const pairs = new Set();
  if (!legendState.network) return pairs;
  for (const { from, to } of reportLinks) {
    const a = entryAnchor(from);
    const b = entryAnchor(to);
    if (!a || !b || sameSpot(a, b)) continue; // an end is filtered out, or both are in one cluster
    const line = L.polyline([a.latlng, b.latlng], {
      className: "network-line",
      color: "#000080",
      weight: 2,
      opacity: 0.8,
      dashArray: isDimmed(from.pin) ? "6 6" : null,
    }).bindTooltip(plainText(`${from.pin.name} → ${to.pin.name}`), { sticky: true });
    networkLayer.addLayer(line);
    pairs.add(pairKey(a, b)[0]);
  }
  return pairs;
}
