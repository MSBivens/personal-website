// Party members. They have no markers of their own; the party pin's panel lists them by
// status, and their names elsewhere (Recruited by, Soul Items, Death Sites) say "(Away)" or
// "(Dead)" when they aren't with the party.
import { pinsById } from "./state.js";
import { TYPE } from "./data.js";

// Party Member id → { id, name, status: "alive" | "away" | "dead", soulItem, deathSites }
// `soulItem`: their Soul Item's pin entry, if published. `deathSites`: Death Site entries, oldest first.
export const partyById = new Map();

const STATUS_NOTE = { away: "Away", dead: "Dead" };

/** "Syl (Away)", "Illyn (Dead)", or just the name for someone with the party. */
export function partyName(member) {
  if (!member) return "";
  const note = STATUS_NOTE[member.status];
  return note ? `${member.name} (${note})` : member.name;
}

export function collectParty(party) {
  for (const member of party || []) {
    if (!member || !member.name) continue;
    partyById.set(member.id, { ...member, status: member.status || "alive", soulItem: null, deathSites: [] });
  }
  for (const entry of pinsById.values()) {
    const member = partyById.get(entry.pin.partyMemberId);
    if (!member) continue;
    if (entry.pin.typeId === TYPE.soulItem) member.soulItem = entry;
    if (entry.pin.typeId === TYPE.deathSite) member.deathSites.push(entry);
  }
  for (const member of partyById.values()) {
    member.deathSites.sort((a, b) => String(a.pin.createdAt).localeCompare(String(b.pin.createdAt)));
  }
}
