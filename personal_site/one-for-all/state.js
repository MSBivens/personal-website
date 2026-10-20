// Shared lookups, filled once the map data has loaded.

// Campaign Settings: which pin is the party, where the party has been (oldest first), and
// the date of the last session ("YYYY-MM-DD"). Trail stops: { locationId, x, y, date, note }.
export const campaign = { partyId: null, trail: [], lastSession: null };

// "YYYY-MM-DD" in the viewer's own time zone, to compare with the session date (a calendar
// date, and the same day the Records window shows).
const localDay = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Created on or after the last session (pins and Locations). */
export function isNew(record) {
  const created = record.pin ? record.pin.createdAt : record.location && record.location.createdAt;
  return Boolean(campaign.lastSession && created && localDay(created) >= campaign.lastSession);
}

/** A pin whose status is marked "Open thread" in Studio. */
export const isOpenThread = (record) => Boolean(record.pin && record.pin.status && record.pin.status.openThread);

// Pin Type id → { id, title, plural, legendOrder, icon: { src, pixelated } }
export const typesById = new Map();

// Relationship Type id → { id, title, color, pattern, width, direction, shape,
// shownByDefault, legendOrder, count: connections of this type }
export const relTypesById = new Map();

// Pin id → { pin, type, icon, place, grouped, party, marker, rep, reports, links }
// `party`: it's the party pin, drawn on top of everything and never grouped.
// `grouped`: it has no position of its own, so it sits at its Location's spot.
// `marker`: its own marker (null if it has no position at all).
// `rep`: what currently stands for it on the map: its own marker, its Location's marker, or
// null if it's filtered out.
// `links`: [{ conn, dir: "out" | "in" }], the pin's Connections both ways.
export const pinsById = new Map();

// Post Office id → its pin, with x/y filled in from its Location if needed. They have no
// marker; lines bend through them.
export const waypointsById = new Map();

// Location id → { location, icon, point: {x, y} | null, readable, marker, rep,
//   entries: [pins with this Location], grouped: [those sitting at its spot], links,
//   innerReports: [{ from, to }], innerLinks: [conn] }
// `marker`: the Location marker (null without a position). `rep`: what currently stands
// for the Location: its marker, its one shown pin, or null.
// The `inner…` lists are lines between two records at its spot, listed in its panel
// instead of drawn.
export const placesById = new Map();
