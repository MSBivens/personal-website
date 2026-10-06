// Loads the map's records from Sanity. They're edited in Sanity Studio (see
// docs/adding-map-pins.md); the dataset is public, so published records are read
// straight from Sanity's CDN without a token.

const SANITY = { projectId: "ohnkcmr7", dataset: "production", apiVersion: "2025-02-19" };

// Pin Types the code treats specially. Same IDs as studio/schemaTypes/ids.ts.
export const TYPE = {
  member: "pinType-member",
  npc: "pinType-npc",
  soulItem: "pinType-soulItem",
  quest: "pinType-quest",
  postOffice: "pinType-postOffice",
};

const ASSET = `{ url, extension, "width": metadata.dimensions.width }`;
const CONNECTIONS = `connections[defined(type._ref) && defined(to._ref)]{
  "typeId": type._ref, "to": to._ref, "via": via[]._ref, label, notes
}`;

// Hidden pins aren't fetched at all (they're still public through Sanity's API, though).
// A pin without a Map Visibility counts as a Map Pin.
const QUERY = `{
  "types": *[_type == "pinType"] | order(legendOrder asc){
    "id": _id, title, plural, legendOrder, "icon": icon.asset->${ASSET}
  },
  "relationshipTypes": *[_type == "relationshipType"] | order(legendOrder asc){
    "id": _id, title, color, pattern, width, direction, shape, legendOrder,
    "shownByDefault": coalesce(shownByDefault, true)
  },
  "locations": *[_type == "location"]{
    "id": _id, name, description, "isHub": showAsHub == true, x, y, "icon": icon.asset->${ASSET},
    "connections": ${CONNECTIONS}
  },
  "pins": *[_type == "pin" && coalesce(visibility, "pin") != "hidden"]{
    "id": _id, name, x, y, description,
    "visibility": coalesce(visibility, "pin"),
    "typeId": type._ref,
    "locationId": location._ref,
    "icon": icon.asset->${ASSET},
    "status": status->{ title, style },
    "details": details[defined(value)]{ label, value },
    "connections": ${CONNECTIONS},
    type._ref == "${TYPE.member}" => {
      "reportsTo": reportsTo._ref,
      "rank": rank->{ title, order, "icon": icon.asset->${ASSET} },
      "recruitedBy": recruitedBy[]->name
    },
    type._ref == "${TYPE.soulItem}" => { "partyMember": partyMember->name },
    type._ref == "${TYPE.npc}" => { attitude },
    type._ref == "${TYPE.quest}" => { "questGiver": questGiver._ref }
  }
}`;

const QUERY_URL =
  `https://${SANITY.projectId}.apicdn.sanity.io/v${SANITY.apiVersion}/data/query/${SANITY.dataset}` +
  `?query=${encodeURIComponent(QUERY)}`;

export async function loadMapData() {
  const res = await fetch(QUERY_URL);
  if (!res.ok) throw new Error(`Sanity returned ${res.status} for the map data query.`);
  const { result } = await res.json();
  return result;
}
