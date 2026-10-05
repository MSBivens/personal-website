// Network lines: one from each member to whoever they report to.
import { map, toLatLng } from "./view.js";
import { pinsById } from "./state.js";
import { isDimmed } from "./markers.js";

export const networkLayer = L.layerGroup().addTo(map);
export const networkLinks = []; // { line, from, to }

export function connectNetwork() {
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
      dashArray: isDimmed(pin) ? "6 6" : null,
    }).bindTooltip(`${pin.name} → ${superior.pin.name}`, { sticky: true });
    networkLinks.push({ line, from: entry, to: superior });
  }

  const rankOrder = (entry) => (entry.pin.rank && Number.isFinite(entry.pin.rank.order) ? entry.pin.rank.order : Infinity);
  for (const entry of pinsById.values()) {
    entry.reports.sort((a, b) => rankOrder(a) - rankOrder(b) || a.pin.name.localeCompare(b.pin.name));
  }
}
