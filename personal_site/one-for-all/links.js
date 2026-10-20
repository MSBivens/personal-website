// Links to a record: /one-for-all#jenna opens Jenna's pop-up. Every pin and Location gets a
// slug from its name, Locations first, then pins, each in name order; a repeated slug gets
// -2, -3 and so on. Opening a record puts its slug in the address bar.
import { pinsById, placesById } from "./state.js";

const slugs = new Map(); // record (pin entry or place) → slug
const records = new Map(); // slug → record

export function slugify(name) {
  const slug = String(name || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // Faerûn → Faerun
    .toLowerCase()
    .replace(/['’]/g, "") // Baldur's → baldurs
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "record";
}

const nameOf = (record) => (record.pin ? record.pin.name : record.location.name);
const idOf = (record) => (record.pin ? record.pin.id : record.location.id);
const byName = (a, b) => nameOf(a).localeCompare(nameOf(b)) || idOf(a).localeCompare(idOf(b));

export function assignSlugs() {
  const all = [...[...placesById.values()].sort(byName), ...[...pinsById.values()].sort(byName)];
  for (const record of all) {
    const base = slugify(nameOf(record));
    let slug = base;
    for (let n = 2; records.has(slug); n++) slug = `${base}-${n}`;
    records.set(slug, record);
    slugs.set(record, slug);
  }
}

/** The record the address bar's #slug points at, if any. */
export const recordFromAddress = () => records.get(decodeURIComponent(location.hash.slice(1))) || null;

/** The full link to a record, keeping ?data=test if it's there. */
export const linkTo = (record) => `${location.origin}${location.pathname}${location.search}#${slugs.get(record)}`;

/** Puts the open record in the address bar (or takes it out when nothing is open). */
export function showInAddress(record) {
  const slug = record && slugs.get(record);
  history.replaceState(null, "", slug ? `#${slug}` : location.pathname + location.search);
}
