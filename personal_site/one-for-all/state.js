// Shared lookups, filled once the map data has loaded.

// Pin Type id → { id, title, plural, legendOrder, icon: { src, pixelated } }
export const typesById = new Map();

// Relationship Type id → { id, title, color, pattern, width, direction, shape,
// shownByDefault, legendOrder, count: connections of this type }
export const relTypesById = new Map();

// Pin id → { pin, type, marker, icon, place, reports, links }
// `marker` is null for pins attached to a Hub (they only appear in its panel).
// `links`: [{ conn, dir: "out" | "in" }], the pin's Connections both ways.
export const pinsById = new Map();

// Post Office id → its pin. They have no marker; lines bend through them.
export const waypointsById = new Map();

// Location id → { location, icon, isHub, marker, entries: [pins there], links,
//   innerReports: [{ from, to }], innerLinks: [conn] }
// The `inner…` lists are lines between two pins in the same Hub, listed in its panel
// instead of drawn.
export const placesById = new Map();
