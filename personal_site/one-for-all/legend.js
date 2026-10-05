// The Legend box: show or hide each Pin Type, and toggle the network lines.
import { map } from "./view.js";
import { pinsById, typesById } from "./state.js";
import { typeLayers } from "./markers.js";
import { networkLayer, networkLinks } from "./network.js";

// v2: types are keyed by their Pin Type id now, so older saved choices don't apply.
const LEGEND_KEY = "one-for-all-legend-v2";
const legendState = (() => {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(LEGEND_KEY)) || {};
  } catch {}
  return {
    hidden: new Set(Array.isArray(saved.hidden) ? saved.hidden : []),
    network: saved.network === true,
    collapsed: saved.collapsed === true,
  };
})();

function saveLegendState() {
  try {
    localStorage.setItem(
      LEGEND_KEY,
      JSON.stringify({ ...legendState, hidden: [...legendState.hidden] }),
    );
  } catch {}
}

function refreshMap() {
  for (const [typeId, layer] of typeLayers) {
    if (legendState.hidden.has(typeId)) layer.remove();
    else layer.addTo(map);
  }
  networkLayer.clearLayers();
  if (!legendState.network) return;
  for (const { line, from, to } of networkLinks) {
    if (!legendState.hidden.has(from.pin.typeId) && !legendState.hidden.has(to.pin.typeId)) {
      networkLayer.addLayer(line);
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

    // Only types that have pins on the map, in each type's legend order.
    const counts = new Map();
    for (const { pin } of pinsById.values()) counts.set(pin.typeId, (counts.get(pin.typeId) || 0) + 1);
    const types = [...typesById.values()]
      .filter((type) => counts.has(type.id))
      .sort((a, b) => (a.legendOrder ?? 0) - (b.legendOrder ?? 0));

    for (const type of types) {
      const icon = Object.assign(new Image(16, 16), {
        src: type.icon.src,
        alt: "",
        className: type.icon.pixelated ? "" : "smooth",
      });
      const count = Object.assign(document.createElement("span"), {
        className: "legend-count",
        textContent: `(${counts.get(type.id)})`,
      });
      body.append(
        legendRow([icon, type.title, count], !legendState.hidden.has(type.id), (checked) => {
          if (checked) legendState.hidden.delete(type.id);
          else legendState.hidden.add(type.id);
        }),
      );
    }
    const swatch = Object.assign(document.createElement("span"), { className: "legend-line" });
    body.append(
      document.createElement("hr"),
      legendRow([swatch, "Network lines"], legendState.network, (checked) => {
        legendState.network = checked;
      }),
    );

    container.append(titleBar, body);
    return container;
  },
});

export function addLegend() {
  new Legend().addTo(map);
  refreshMap();
}
