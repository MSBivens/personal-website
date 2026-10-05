// Network lines: one from each member to whoever they report to. Pins attached to a Hub
// are drawn from the Hub's spot.
import { map } from "./view.js";
import { pinsById } from "./state.js";
import { anchorOf, isDimmed } from "./markers.js";
import { pairKey } from "./lines.js";

export const networkLayer = L.layerGroup().addTo(map);
export const networkLinks = []; // { line, from, to, fromHub, toHub }

// Returns the point pairs the network lines use, so relationship lines between the same
// two points bow around them (see lines.js).
export function connectNetwork() {
  const pairs = new Set();
  for (const entry of pinsById.values()) {
    const { pin } = entry;
    if (!pin.reportsTo) continue;
    const superior = pinsById.get(pin.reportsTo);
    if (!superior) {
      console.warn(`${pin.name} reports to a pin that isn't on the map (unpublished or Hidden):`, pin.reportsTo);
      continue;
    }
    superior.reports.push(entry);

    const from = anchorOf(entry);
    const to = anchorOf(superior);
    if (!from || !to) continue; // one end is attached to a Location that isn't a Hub
    if (from.hub && from.hub === to.hub) {
      from.hub.innerReports.push({ from: entry, to: superior });
      continue;
    }
    const line = L.polyline([from.latlng, to.latlng], {
      className: "network-line",
      color: "#000080",
      weight: 2,
      opacity: 0.8,
      dashArray: isDimmed(pin) ? "6 6" : null,
    }).bindTooltip(`${pin.name} → ${superior.pin.name}`, { sticky: true });
    networkLinks.push({ line, from: entry, to: superior, fromHub: from.hub, toHub: to.hub });
    pairs.add(pairKey(from, to)[0]);
  }

  const rankOrder = (entry) => (entry.pin.rank && Number.isFinite(entry.pin.rank.order) ? entry.pin.rank.order : Infinity);
  for (const entry of pinsById.values()) {
    entry.reports.sort((a, b) => rankOrder(a) - rankOrder(b) || a.pin.name.localeCompare(b.pin.name));
  }
  return pairs;
}
