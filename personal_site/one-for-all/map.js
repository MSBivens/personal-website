// Entry point for /one-for-all: loads the records from Sanity and builds the map.
// The pieces live in the other modules in this folder.
import { TEST_DATA, loadMapData } from "./data.js";
import { FALLBACK_ICON, sanityIcon } from "./icons.js";
import { map } from "./view.js";
import { campaign, pinsById, relTypesById, typesById } from "./state.js";
import { READABLE_ZOOM, addPin } from "./markers.js";
import { addPlace } from "./places.js";
import { collectNetwork } from "./network.js";
import { collectConnections } from "./lines.js";
import { addLegend } from "./legend.js";
import { render } from "./render.js";
import { goTo, showError } from "./popup.js";
import { assignSlugs, recordFromAddress } from "./links.js";
import { buildSearchIndex } from "./search.js";
import { buildRecords } from "./records.js";
import "./locate.js";

if (TEST_DATA) {
  document.title += " (test data)";
  document.getElementById("map-title").append(" (test data)");
}

// The Party button flies back to the party pin.
function setUpPartyButton(party) {
  const button = document.getElementById("party-button");
  const icon = document.getElementById("party-button-icon");
  icon.src = party.icon.src;
  icon.classList.toggle("smooth", !party.icon.pixelated);
  button.hidden = false;
  button.addEventListener("click", () => {
    const latlng = party.marker.getLatLng();
    map.once("moveend", () => party.marker.getElement() && party.marker.getElement().focus());
    map.flyTo(latlng, Math.max(map.getZoom(), READABLE_ZOOM));
  });
}

loadMapData()
  .then(({ campaign: settings, types, relationshipTypes = [], locations = [], pins }) => {
    campaign.partyId = (settings && settings.partyId) || null;
    campaign.trail = (settings && settings.trail) || [];
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
    assignSlugs();
    buildSearchIndex();
    buildRecords();

    // A link to a record (#slug) opens it. Otherwise open on the party, close enough to
    // read place names; without a party, the whole map shows.
    const party = pinsById.get(campaign.partyId);
    if (party && party.marker) setUpPartyButton(party);
    const linked = recordFromAddress();
    const start = (linked && linked.rep) || (party && party.marker);
    if (start) map.setView(start.getLatLng(), READABLE_ZOOM, { animate: false });
    if (linked) goTo(linked);
    // A link pasted into this tab's address bar.
    window.addEventListener("hashchange", () => {
      const record = recordFromAddress();
      if (record) goTo(record);
    });
  })
  .catch((err) => showError(err.message));
