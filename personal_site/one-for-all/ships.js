// Ships and their routes. A ship's Route is an ordered list of Port pins (a port can come up
// more than once), and it may loop back to its first port. Read once after loading, so the
// panels can show a ship's route, the ships calling at a port, and what a captain commands.
import { pinsById } from "./state.js";
import { TYPE } from "./data.js";

export function collectShips() {
  for (const ship of pinsById.values()) {
    if (ship.pin.typeId !== TYPE.ship) continue;
    // Ports that aren't published (or are off the map) are skipped.
    ship.route = (ship.pin.route || []).map((id) => pinsById.get(id)).filter(Boolean);
    ship.route.forEach((port, i) => {
      port.shipsHere = port.shipsHere || [];
      let calling = port.shipsHere.find((call) => call.ship === ship);
      if (!calling) {
        calling = { ship, stops: [] };
        port.shipsHere.push(calling);
      }
      calling.stops.push(i + 1);
    });
    const captain = pinsById.get(ship.pin.captain);
    if (captain) {
      ship.captain = captain;
      captain.captainOf = captain.captainOf || [];
      captain.captainOf.push(ship);
    }
  }
}
