// The record panel: a Win95 Properties window docked to the right of the map (a sheet along
// the bottom on phones) showing one pin or Location. The map stays usable around it.
// Links in it fly to the other record and show it here; Back and Forward step through what
// you've opened, like a browser.
import { map, isLocating } from "./view.js";
import { ICON_BASE, sanityIcon } from "./icons.js";
import { pinsById, placesById } from "./state.js";
import { isDimmed, reveal, setSelected } from "./markers.js";
import { relSample } from "./lines.js";
import { stopLocating } from "./locate.js";
import { linkTo, showInAddress } from "./links.js";
import { badgeElement } from "./badges.js";

const ATTITUDES = { friendly: "Friendly", neutral: "Neutral", hostile: "Hostile", unknown: "Unknown" };

const panel = document.getElementById("record-panel");
const body = document.getElementById("panel-body");
const backButton = document.getElementById("panel-back");
const forwardButton = document.getElementById("panel-forward");
const copyButton = document.getElementById("panel-copy-link");
const expandButton = document.getElementById("panel-expand");

let history = []; // records opened, oldest first
let step = -1; // where we are in `history`
let current = null;
let returnFocusTo = null;

/* ---------- Building blocks ---------- */
const el = (tag, className, ...children) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.append(...children);
  return node;
};

export function detailRow(label, ...content) {
  return el("div", "prop-row", el("span", "prop-label", `${label}:`), el("span", "prop-value", ...content));
}

const nameOf = (record) => (record.pin ? record.pin.name : record.location.name);

/** A link-styled button that flies to a record and shows it here. */
function recordLink(record, text = nameOf(record)) {
  const button = el("button", "pin-link", text);
  button.type = "button";
  button.addEventListener("click", () => goTo(record));
  return button;
}

/** An icon + name row button, for the lists of records. */
function recordItem(record) {
  const isPin = Boolean(record.pin);
  const icon = record.icon;
  const img = Object.assign(new Image(16, 16), { src: icon.src, alt: "" });
  if (!icon.pixelated) img.classList.add("smooth");
  if (isPin && isDimmed(record.pin)) img.classList.add(`is-${record.pin.status.style}`);
  const button = el("button", "place-item", img, nameOf(record));
  button.type = "button";
  button.addEventListener("click", () => goTo(record));
  const item = el("li", "", button);
  if (isPin) item.append(badgeElement(record.pin.status));
  if (isPin && isDimmed(record.pin)) item.append(el("span", "place-tag", record.pin.status.title));
  return item;
}

/** A white Explorer-style box with a heading, or nothing if there's nothing to list. */
function listBox(heading, records) {
  if (!records.length) return [];
  const sorted = [...records].sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
  return [el("div", "place-records", el("div", "place-group", `${heading} (${records.length})`), el("ul", "place-list", ...sorted.map(recordItem)))];
}

// One Connection as seen from one of its ends: "[line] Communication → Jenna", then any
// Via stops and Label, then the Notes.
function connectionItem({ conn, dir }) {
  const other = dir === "out" ? conn.to : conn.from;
  const arrow = conn.rel.direction === "none" ? "—" : dir === "out" ? "→" : "←";
  const otherRecord = other.entry || other.place;
  const item = el("li", "", el("div", "conn-head", relSample(conn.rel), el("span", "conn-type", conn.rel.title), ` ${arrow} `, recordLink(otherRecord)));
  const meta = [conn.via.length && `via ${conn.via.map((po) => po.name).join(", ")}`, conn.label].filter(Boolean);
  if (meta.length) item.append(el("div", "conn-meta", meta.join(" · ")));
  if (conn.notes && conn.notes.trim()) item.append(el("div", "conn-notes", conn.notes.trim()));
  return item;
}

function connectionSection(links) {
  if (!links || !links.length) return [];
  const otherName = ({ conn, dir }) => (dir === "out" ? conn.to : conn.from).name;
  const sorted = [...links].sort(
    (a, b) => (a.conn.rel.legendOrder ?? 0) - (b.conn.rel.legendOrder ?? 0) || otherName(a).localeCompare(otherName(b)),
  );
  return [el("div", "pin-connections", el("b", "", "Connections"), el("ul", "conn-list", ...sorted.map(connectionItem)))];
}

// Studio descriptions are plain text; a blank line starts a new paragraph.
function paragraphs(description) {
  const parts = Array.isArray(description) ? description : String(description || "").trim().split(/\n\s*\n/);
  return parts
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text) => el("p", "", text));
}

const detailRows = (details) =>
  (details || []).filter(({ label, value }) => label && value && value.trim()).map(({ label, value }) => detailRow(label, value.trim()));

/* ---------- Linked records ---------- */
// Records whose description or Details mention this record's name as a whole word (names of
// 4+ letters only, so short ones don't match everywhere).
const straighten = (text) => String(text || "").replace(/[’‘]/g, "'");
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function mentionsOf(record) {
  const name = straighten(nameOf(record)).trim();
  if (name.replace(/[^\p{L}\p{N}]/gu, "").length < 4) return [];
  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])${escape(name)}($|[^\\p{L}\\p{N}])`, "iu");
  const textOf = (other) => {
    const source = other.pin || other.location;
    return straighten([source.description, ...(source.details || []).map((d) => d.value)].join("\n"));
  };
  return [...pinsById.values(), ...placesById.values()].filter((other) => other !== record && pattern.test(textOf(other)));
}

/* ---------- Pin and Location content ---------- */
function pinContent(entry) {
  const { pin, place: at } = entry;
  const rows = [];
  if (at) rows.push(detailRow("Location", recordLink(at)));
  if (pin.rank) {
    const rankIcon = sanityIcon(pin.rank.icon);
    const img = rankIcon
      ? Object.assign(new Image(16, 16), { src: rankIcon.src, alt: "", className: rankIcon.pixelated ? "pin-rank-icon" : "pin-rank-icon smooth" })
      : "";
    rows.push(detailRow("Rank", img, pin.rank.title || "Unnamed rank"));
  }
  if (pin.status && pin.status.title) rows.push(detailRow("Status", badgeElement(pin.status), pin.status.title));
  // Unpublished party members come back as null.
  const recruiters = (pin.recruitedBy || []).filter(Boolean);
  if (recruiters.length) rows.push(detailRow("Recruited by", recruiters.join(", ")));
  if (pin.partyMember) rows.push(detailRow("Party member", pin.partyMember));
  if (pin.attitude) rows.push(detailRow("Attitude", ATTITUDES[pin.attitude] || pin.attitude));
  const giver = pinsById.get(pin.questGiver);
  if (giver) rows.push(detailRow("Quest giver", recordLink(giver)));
  const superior = pinsById.get(pin.reportsTo);
  if (superior) rows.push(detailRow("Reports to", recordLink(superior)));
  if (entry.reports && entry.reports.length) {
    const links = entry.reports.flatMap((report, i) => (i ? [", ", recordLink(report)] : [recordLink(report)]));
    rows.push(detailRow("Direct reports", ...links));
  }
  rows.push(...detailRows(pin.details));

  const hereToo = at ? at.entries.filter((other) => other !== entry) : [];
  return [
    rows.length ? el("div", "pin-details", ...rows) : "",
    ...connectionSection(entry.links),
    el("div", "pin-description", ...paragraphs(pin.description)),
    ...listBox(at ? `Also at ${at.location.name}` : "Here too", hereToo),
    ...listBox("Mentioned in", mentionsOf(entry)),
  ];
}

// Lines between two records at the same Location's spot would have no length, so they're
// listed here instead.
function linesHere(at) {
  if (!at.innerReports.length && !at.innerLinks.length) return [];
  const items = [
    ...at.innerReports.map(({ from, to }) => el("li", "", recordLink(from), " reports to ", recordLink(to))),
    ...at.innerLinks.map((conn) => {
      const arrow = conn.rel.direction === "none" ? " — " : " → ";
      const link = (end) => (end.place === at ? end.name : recordLink(end.entry || end.place));
      return el("li", "", relSample(conn.rel), link(conn.from), arrow, link(conn.to), el("span", "place-tag", conn.rel.title));
    }),
  ];
  return [el("div", "place-records", el("div", "place-group", "Lines here"), el("ul", "place-list place-lines", ...items))];
}

// The pins at a Location, grouped by type in legend order.
function recordsHere(at) {
  if (!at.entries.length) return [el("div", "place-records", "Nothing here yet.")];
  const groups = new Map();
  for (const entry of at.entries) {
    if (!groups.has(entry.type)) groups.set(entry.type, []);
    groups.get(entry.type).push(entry);
  }
  const box = el("div", "place-records");
  for (const [type, entries] of [...groups].sort(([a], [b]) => (a.legendOrder ?? 0) - (b.legendOrder ?? 0))) {
    const heading = `${entries.length === 1 ? type.title : type.plural || type.title} (${entries.length})`;
    const sorted = entries.sort((a, b) => a.pin.name.localeCompare(b.pin.name));
    box.append(el("div", "place-group", heading), el("ul", "place-list", ...sorted.map(recordItem)));
  }
  return [box];
}

function placeContent(at) {
  const rows = detailRows(at.location.details);
  return [
    el("div", "pin-description", ...paragraphs(at.location.description)),
    rows.length ? el("div", "pin-details", ...rows) : "",
    ...recordsHere(at),
    ...connectionSection(at.links),
    ...linesHere(at),
    ...listBox("Mentioned in", mentionsOf(at)),
  ];
}

/* ---------- Showing, history and closing ---------- */
function syncNav() {
  backButton.disabled = step <= 0;
  forwardButton.disabled = step >= history.length - 1;
}

function render(record) {
  current = record;
  const isPin = Boolean(record.pin);
  document.getElementById("panel-name").textContent = nameOf(record);
  const icon = document.getElementById("panel-icon");
  icon.src = record.icon.src;
  icon.classList.toggle("smooth", !record.icon.pixelated);
  const count = !isPin && record.entries.length;
  document.getElementById("panel-kind").textContent = isPin
    ? record.type.title
    : `Location · ${count} ${count === 1 ? "record" : "records"}`;
  document.getElementById("panel-content").replaceChildren(...(isPin ? pinContent(record) : placeContent(record)));
  body.scrollTop = 0;
  copyButton.hidden = !(record.pin ? record.pin.id : record.location);
  copyButton.textContent = "Copy link";
  showInAddress(record.pin && !record.pin.id ? null : record);
  setSelected(record.rep || null);
  syncNav();
}

/** Shows a pin or Location in the panel, adding it to the Back/Forward history (unless
 *  Back or Forward is what brought us here). */
export function showRecord(record) {
  if (isLocating()) stopLocating();
  if (record !== history[step]) {
    history = history.slice(0, step + 1);
    history.push(record);
    step = history.length - 1;
  }
  const wasOpen = isPanelOpen();
  if (!wasOpen) returnFocusTo = (record.rep && record.rep.getElement()) || document.activeElement;
  panel.hidden = false;
  render(record);
  keepInView(record.rep);
  body.focus({ preventScroll: true });
}

export const showPin = (entry) => showRecord(entry);
export const showPlace = (at) => showRecord(at);

export const isPanelOpen = () => !panel.hidden;

export function closePanel({ restoreFocus = true } = {}) {
  if (!isPanelOpen()) return;
  panel.hidden = true;
  panel.classList.remove("is-expanded");
  current = null;
  history = [];
  step = -1;
  setSelected(null);
  showInAddress(null);
  if (restoreFocus && returnFocusTo && document.contains(returnFocusTo)) returnFocusTo.focus();
}

/** Fly to a pin or Location (out of any cluster) and show it. Ones that aren't drawn
 *  (filtered out, or with no position) just show. */
export function goTo(record) {
  reveal(record.rep, () => showRecord(record));
}

// Pan the map if the record's marker would sit under the panel.
function keepInView(layer) {
  if (!layer || !map.hasLayer(layer)) return;
  const point = map.latLngToContainerPoint(layer.getLatLng());
  const mapBox = map.getContainer().getBoundingClientRect();
  const panelBox = panel.getBoundingClientRect();
  const margin = 40;
  const sheet = panelBox.width >= mapBox.width - 2; // phone: a sheet along the bottom
  const visible = sheet
    ? { width: mapBox.width, height: panelBox.top - mapBox.top }
    : { width: panelBox.left - mapBox.left, height: mapBox.height };
  const outside =
    point.x < margin || point.y < margin || point.x > visible.width - margin || point.y > visible.height - margin;
  if (outside) map.panBy([point.x - visible.width / 2, point.y - visible.height / 2]);
}

export function showError(message) {
  showRecord({
    pin: { name: "Error", description: [message] },
    type: { title: "Map data could not be loaded" },
    icon: { src: ICON_BASE + "msg_error-0.png", pixelated: true },
    place: null,
    reports: [],
    links: [],
    rep: null,
  });
}

backButton.addEventListener("click", () => {
  if (step > 0) goTo(history[--step]);
});
forwardButton.addEventListener("click", () => {
  if (step < history.length - 1) goTo(history[++step]);
});
copyButton.addEventListener("click", () => {
  if (!current) return;
  navigator.clipboard
    .writeText(linkTo(current))
    .then(() => (copyButton.textContent = "Copied!"))
    .catch(() => (copyButton.textContent = "Couldn't copy"));
});
document.getElementById("panel-close").addEventListener("click", () => closePanel());
expandButton.addEventListener("click", () => {
  const expanded = panel.classList.toggle("is-expanded");
  expandButton.textContent = expanded ? "▼" : "▲";
  expandButton.setAttribute("aria-label", expanded ? "Shrink" : "Expand");
});
// Locate mode needs the whole map.
document.addEventListener("locate-start", () => closePanel({ restoreFocus: false }));
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (isPanelOpen()) closePanel();
  else if (isLocating()) stopLocating();
});
