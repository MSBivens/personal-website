// Entry point for /one-for-all: loads the records from Sanity and builds the map.
// The pieces live in the other modules in this folder.
import { loadMapData } from "./data.js";
import { FALLBACK_ICON, LEGACY_TYPES, sanityIcon } from "./icons.js";
import { typesById } from "./state.js";
import { addPin } from "./markers.js";
import { addHubMarkers, addPlace } from "./hubs.js";
import { connectNetwork } from "./network.js";
import { addLegend } from "./legend.js";
import { showError } from "./popup.js";
import "./locate.js";

loadMapData()
  .then(({ types, locations = [], pins }) => {
    for (const [id, type] of Object.entries(LEGACY_TYPES)) typesById.set(id, { id, ...type });
    for (const type of types) {
      typesById.set(type.id, { ...type, icon: sanityIcon(type.icon) || FALLBACK_ICON });
    }
    for (const location of locations) addPlace(location);
    for (const pin of pins) addPin(pin);
    addHubMarkers();
    connectNetwork();
    addLegend();
  })
  .catch((err) => showError(err.message));
