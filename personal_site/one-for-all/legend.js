// The Legend box. "Pins" shows or hides each Pin Type (and Locations with nothing at them
// yet); "Lines" shows or hides the party's trail, the network lines and each Relationship Type. Both sections
// fold away and have All/None. The choices only affect the map: pop-ups and Location panels
// always list everything. Location markers and clusters count only what's ticked.
import { map } from "./view.js";
import { campaign, pinsById, placesById, relTypesById, typesById } from "./state.js";
import { PLACE_ICON } from "./places.js";
import { lineSample, relSample } from "./lines.js";
import { PLACES, legendState, lineShown, saveLegendState } from "./filters.js";
import { render } from "./render.js";
import { TRAIL_COLOR } from "./trail.js";

function legendRow(labelContent, checked, onChange) {
  const label = document.createElement("label");
  label.className = "legend-row";
  const box = Object.assign(document.createElement("input"), { type: "checkbox", checked });
  box.addEventListener("change", () => {
    onChange(box.checked);
    saveLegendState();
    render();
  });
  label.append(box, ...labelContent);
  return label;
}

const count = (n) => Object.assign(document.createElement("span"), { className: "legend-count", textContent: `(${n})` });

// A foldable section with All/None buttons that tick or untick every row in it.
function section(key, title, rows) {
  const box = document.createElement("div");
  box.className = "legend-section";
  const list = document.createElement("div");
  list.className = "legend-rows";
  list.id = `legend-${key}`;
  list.hidden = legendState.folded.has(key);
  list.append(...rows);

  const fold = Object.assign(document.createElement("button"), { type: "button", className: "legend-fold" });
  fold.setAttribute("aria-controls", list.id);
  const syncFold = () => {
    fold.textContent = `${list.hidden ? "▸" : "▾"} ${title}`;
    fold.setAttribute("aria-expanded", String(!list.hidden));
  };
  syncFold();
  fold.addEventListener("click", () => {
    list.hidden = !list.hidden;
    if (list.hidden) legendState.folded.add(key);
    else legendState.folded.delete(key);
    syncFold();
    saveLegendState();
  });

  const setAll = (checked) => {
    for (const input of list.querySelectorAll("input")) {
      if (input.checked !== checked) {
        input.checked = checked;
        input.dispatchEvent(new Event("change"));
      }
    }
  };
  const mini = (text, checked) => {
    const button = Object.assign(document.createElement("button"), { type: "button", className: "win-btn legend-mini", textContent: text });
    button.setAttribute("aria-label", `${text === "All" ? "Show" : "Hide"} all ${title.toLowerCase()}`);
    button.addEventListener("click", () => setAll(checked));
    return button;
  };
  const heading = document.createElement("div");
  heading.className = "legend-heading";
  heading.append(fold, mini("All", true), mini("None", false));
  box.append(heading, list);
  return box;
}

function pinRows() {
  // Only types that have pins, in each type's legend order.
  const counts = new Map();
  for (const { pin } of pinsById.values()) counts.set(pin.typeId, (counts.get(pin.typeId) || 0) + 1);
  const types = [...typesById.values()]
    .filter((type) => counts.has(type.id))
    .sort((a, b) => (a.legendOrder ?? 0) - (b.legendOrder ?? 0));
  const toggle = (key) => (checked) => {
    if (checked) legendState.hidden.delete(key);
    else legendState.hidden.add(key);
  };

  const rows = types.map((type) => {
    const icon = Object.assign(new Image(16, 16), { src: type.icon.src, alt: "", className: type.icon.pixelated ? "" : "smooth" });
    return legendRow([icon, type.title, count(counts.get(type.id))], !legendState.hidden.has(type.id), toggle(type.id));
  });
  // Locations with nothing at them yet but something to read get a marker of their own.
  const placeCount = [...placesById.values()].filter((place) => place.marker && !place.grouped.length && place.readable).length;
  if (placeCount) {
    const icon = Object.assign(new Image(16, 16), { src: PLACE_ICON.src, alt: "" });
    rows.push(legendRow([icon, "Other places", count(placeCount)], !legendState.hidden.has(PLACES), toggle(PLACES)));
  }
  return rows;
}

function lineRows() {
  const rows = [];
  if (campaign.trail.length) {
    const sample = lineSample({ color: TRAIL_COLOR, width: 3, dash: [0, 6] });
    rows.push(
      legendRow([sample, "Party trail"], legendState.trail, (checked) => {
        legendState.trail = checked;
      }),
    );
  }
  rows.push(
    legendRow([lineSample({ color: "#000080", width: 2 }), "Network lines"], legendState.network, (checked) => {
      legendState.network = checked;
    }),
  );
  // Relationship Types that are used at least once, in legend order.
  const rels = [...relTypesById.values()].filter((rel) => rel.count).sort((a, b) => (a.legendOrder ?? 0) - (b.legendOrder ?? 0));
  for (const rel of rels) {
    rows.push(
      legendRow([relSample(rel), rel.title, count(rel.count)], lineShown(rel), (checked) => {
        legendState.lines[rel.id] = checked;
      }),
    );
  }
  return rows;
}

const Legend = L.Control.extend({
  options: { position: "bottomleft" },

  onAdd() {
    const container = L.DomUtil.create("div", "prop-window map-legend");
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);

    const body = document.createElement("div");
    body.className = "prop-body";
    body.id = "legend-body";
    body.hidden = legendState.collapsed;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.setAttribute("aria-controls", body.id);
    const syncToggle = () => {
      toggle.textContent = body.hidden ? "□" : "_";
      toggle.setAttribute("aria-label", body.hidden ? "Show legend" : "Hide legend");
      toggle.setAttribute("aria-expanded", String(!body.hidden));
    };
    syncToggle();
    toggle.addEventListener("click", () => {
      body.hidden = !body.hidden;
      legendState.collapsed = body.hidden;
      syncToggle();
      saveLegendState();
    });

    const titleBar = document.createElement("div");
    titleBar.className = "title-bar";
    const title = document.createElement("span");
    title.textContent = "Legend";
    const controls = document.createElement("div");
    controls.className = "title-controls";
    controls.append(toggle);
    titleBar.append(title, controls);

    body.append(section("pins", "Pins", pinRows()), section("lines", "Lines", lineRows()));
    container.append(titleBar, body);
    return container;
  },
});

export function addLegend() {
  new Legend().addTo(map);
}
