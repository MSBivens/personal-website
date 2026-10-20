// What the Legend has ticked, remembered in this browser. The markers and lines read it when
// they're drawn; the Legend changes it and redraws.

// Legend key for the row that shows Locations with nothing at them yet (Pin Type ids never
// look like this).
export const PLACES = "places";

// v2: types are keyed by their Pin Type id, so older saved choices don't apply.
const LEGEND_KEY = "one-for-all-legend-v2";

export const legendState = (() => {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(LEGEND_KEY)) || {};
  } catch {}
  const obj = (value) => (value && typeof value === "object" && !Array.isArray(value) ? value : {});
  return {
    hidden: new Set(Array.isArray(saved.hidden) ? saved.hidden : []),
    network: saved.network === true,
    trail: saved.trail !== false, // the party's trail starts shown
    lines: obj(saved.lines), // Relationship Type id → shown? (unset: the type's "Shown by default")
    // On a phone the open legend covers most of the map, so it starts minimised there.
    collapsed: typeof saved.collapsed === "boolean" ? saved.collapsed : matchMedia("(max-width: 600px)").matches,
    folded: new Set(Array.isArray(saved.folded) ? saved.folded : []),
  };
})();

export function saveLegendState() {
  try {
    localStorage.setItem(
      LEGEND_KEY,
      JSON.stringify({ ...legendState, hidden: [...legendState.hidden], folded: [...legendState.folded] }),
    );
  } catch {}
}

/** Is this Pin Type (or PLACES) unticked? */
export const isHidden = (key) => legendState.hidden.has(key);

export const lineShown = (rel) => legendState.lines[rel.id] ?? rel.shownByDefault !== false;
