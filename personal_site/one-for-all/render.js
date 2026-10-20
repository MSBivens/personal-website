// Redraws the map for the current Legend choices. Lines are also redrawn after every zoom,
// because clusters merge and split and the lines follow them.
import { map } from "./view.js";
import { renderMarkers } from "./markers.js";
import { drawNetwork } from "./network.js";
import { drawRelations } from "./lines.js";

export function drawLines() {
  drawRelations(drawNetwork());
}

export function render() {
  renderMarkers();
  drawLines();
}

map.on("zoomend", drawLines);
