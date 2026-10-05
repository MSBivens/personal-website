// Shared lookups, filled once the map data has loaded.

// Pin Type id → { id, title, plural, legendOrder, icon: { src, pixelated } }
export const typesById = new Map();

// Pin id → { pin, type, marker, icon, reports: [entries that report to this pin] }
export const pinsById = new Map();
