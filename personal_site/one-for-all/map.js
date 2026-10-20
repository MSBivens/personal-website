// Entry point for /one-for-all: loads the records from Sanity and builds the map.
// The pieces live in the other modules in this folder.
import { TEST_DATA, loadMapData } from "./data.js";
import { FALLBACK_ICON, sanityIcon } from "./icons.js";
import { relTypesById, typesById } from "./state.js";
import { addPin } from "./markers.js";
import { addPlace } from "./places.js";
import { collectNetwork } from "./network.js";
import { collectConnections } from "./lines.js";
import { addLegend } from "./legend.js";
import { render } from "./render.js";
import { showError } from "./popup.js";
import "./locate.js";

if (TEST_DATA) {
  document.title += " (test data)";
  document.getElementById("map-title").append(" (test data)");
}

loadMapData()
  .then(({ types, relationshipTypes = [], locations = [], pins }) => {
    for (const type of types) {
      typesById.set(type.id, { ...type, icon: sanityIcon(type.icon) || FALLBACK_ICON });
    }
    for (const rel of relationshipTypes) relTypesById.set(rel.id, { ...rel, count: 0 });
    for (const location of locations) addPlace(location);
    for (const pin of pins) addPin(pin);
    collectNetwork();
    collectConnections();
    addLegend();
    render();
  })
  .catch((err) => showError(err.message));
