// The Legend box. "Pins" shows or hides each Pin Type and the Hubs; "Lines" shows or hides
// the network lines and each Relationship Type. Both sections fold away and have All/None.
// The choices only affect the map: pop-ups and Hub panels always list everything.
import { map } from "./view.js";
import { pinsById, placesById, relTypesById, typesById } from "./state.js";
import { typeLayers } from "./markers.js";
import { networkLayer, networkLinks } from "./network.js";
import { HUB_ICON, hubLayer } from "./hubs.js";
import { connectionLinks, lineSample, relationLayer, relSample } from "./lines.js";

// Legend key for the Hubs row (Pin Type ids never look like this).
const HUBS = "hubs";

// v2: types are keyed by their Pin Type id now, so older saved choices don't apply.
const LEGEND_KEY = "one-for-all-legend-v2";
const legendState = (() => {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(LEGEND_KEY)) || {};
  } catch {}
  const obj = (value) => (value && typeof value === "object" && !Array.isArray(value) ? value : {});
  return {
    hidden: new Set(Array.isArray(saved.hidden) ? saved.hidden : []),
    network: saved.network === true,
    lines: obj(saved.lines), // Relationship Type id → shown? (unset: the type's "Shown by default")
    // On a phone the open legend covers most of the map, so it starts minimised there.
    collapsed: typeof saved.collapsed === "boolean" ? saved.collapsed : matchMedia("(max-width: 600px)").matches,
    folded: new Set(Array.isArray(saved.folded) ? saved.folded : []),
  };
})();

function saveLegendState() {
  try {
    localStorage.setItem(
      LEGEND_KEY,
      JSON.stringify({ ...legendState, hidden: [...legendState.hidden], folded: [...legendState.folded] }),
    );
  } catch {}
}

const lineShown = (rel) => legendState.lines[rel.id] ?? rel.shownByDefault !== false;

function refreshMap() {
  const { hidden } = legendState;
  for (const [typeId, layer] of typeLayers) {
    if (hidden.has(typeId)) layer.remove();
    else layer.addTo(map);
  }
  if (hidden.has(HUBS)) hubLayer.remove();
  else hubLayer.addTo(map);

  // A line shows when both ends are shown: a pin's type must be ticked, and Hubs too if
  // that end sits in one. Location ends only depend on Hubs.
  const showing = (entry, hub) => !(entry && hidden.has(entry.pin.typeId)) && !(hub && hidden.has(HUBS));
  networkLayer.clearLayers();
  if (legendState.network) {
    for (const { line, from, to, fromHub, toHub } of networkLinks) {
      if (showing(from, fromHub) && showing(to, toHub)) networkLayer.addLayer(line);
    }
  }
  relationLayer.clearLayers();
  for (const { conn, group, a, b } of connectionLinks) {
    if (lineShown(conn.rel) && showing(conn.from.entry, a.hub) && showing(conn.to.entry, b.hub)) {
      relationLayer.addLayer(group);
    }
  }
}

function legendRow(labelContent, checked, onChange) {
  const label = document.createElement("label");
  label.className = "legend-row";
  const box = Object.assign(document.createElement("input"), { type: "checkbox", checked });
  box.addEventListener("change", () => {
    onChange(box.checked);
    saveLegendState();
    refreshMap();
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
  // Only types that have pins (on the map or inside Hubs), in each type's legend order.
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
  const hubCount = [...placesById.values()].filter((place) => place.isHub).length;
  if (hubCount) {
    const icon = Object.assign(new Image(16, 16), { src: HUB_ICON.src, alt: "" });
    rows.push(legendRow([icon, "Hubs", count(hubCount)], !legendState.hidden.has(HUBS), toggle(HUBS)));
  }
  return rows;
}

function lineRows() {
  const rows = [
    legendRow([lineSample({ color: "#000080", width: 2 }), "Network lines"], legendState.network, (checked) => {
      legendState.network = checked;
    }),
  ];
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
  refreshMap();
}
