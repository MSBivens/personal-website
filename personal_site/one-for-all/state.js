// Shared lookups, filled once the map data has loaded.

// Pin Type id → { id, title, plural, legendOrder, icon: { src, pixelated } }
export const typesById = new Map();

// Pin id → { pin, type, marker, icon, place, reports: [entries that report to this pin] }
// `marker` is null for pins attached to a Hub (they only appear in its panel).
export const pinsById = new Map();

// Location id → { location, icon, isHub, marker, entries: [pins there], innerReports: [{ from, to }] }
// `innerReports` are network lines between two pins in the same Hub, listed in its panel
// instead of drawn.
export const placesById = new Map();
