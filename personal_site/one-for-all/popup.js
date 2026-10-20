// The pin pop-up (a Win95 dialog), and the links in it that jump between pins and places.
import { isLocating } from "./view.js";
import { ICON_BASE, sanityIcon } from "./icons.js";
import { pinsById } from "./state.js";
import { reveal } from "./markers.js";
import { closePlace, isPlaceOpen, showPlace } from "./places.js";
import { relSample } from "./lines.js";
import { stopLocating } from "./locate.js";
import { linkTo, showInAddress } from "./links.js";

const ATTITUDES = { friendly: "Friendly", neutral: "Neutral", hostile: "Hostile", unknown: "Unknown" };

const pinModal = document.getElementById("pin-modal");
const backButton = document.getElementById("pin-back");
let returnFocusTo = null;
let backTo = null;

export function detailRow(label, ...content) {
  const row = document.createElement("div");
  row.className = "prop-row";
  const name = document.createElement("span");
  name.className = "prop-label";
  name.textContent = `${label}:`;
  const value = document.createElement("span");
  value.className = "prop-value";
  value.append(...content);
  row.append(name, value);
  return row;
}

function linkButton(text, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "pin-link";
  button.textContent = text;
  button.addEventListener("click", onClick);
  return button;
}

// Reports to / Direct reports: fly to the other pin (out of any cluster), then open it.
const pinLink = (entry) => linkButton(entry.pin.name, () => goTo(entry));

// From a Location panel: open the pin's pop-up straight away, with a way back to the panel.
export const pinButton = (entry, from) =>
  linkButton(entry.pin.name, () => {
    closePlace({ restoreFocus: false });
    showPin(entry, { from });
  });

const placeLink = (place) =>
  linkButton(place.location.name, () => showPlace(place, { returnFocus: returnFocusTo }));

const el = (tag, className, ...children) => {
  const node = document.createElement(tag);
  node.className = className;
  node.append(...children);
  return node;
};

// One Connection as seen from one of its ends: "[line] Communication → Jenna", then any
// Via stops and Label, then the Notes. `linkFor(endpoint)` makes the link to the other end.
function connectionItem({ conn, dir }, linkFor) {
  const other = dir === "out" ? conn.to : conn.from;
  const arrow = conn.rel.direction === "none" ? "—" : dir === "out" ? "→" : "←";
  const item = el("li", "", el("div", "conn-head", relSample(conn.rel), el("span", "conn-type", conn.rel.title), ` ${arrow} `, linkFor(other)));
  const meta = [conn.via.length && `via ${conn.via.map((po) => po.name).join(", ")}`, conn.label].filter(Boolean);
  if (meta.length) item.append(el("div", "conn-meta", meta.join(" · ")));
  if (conn.notes && conn.notes.trim()) item.append(el("div", "conn-notes", conn.notes.trim()));
  return item;
}

// A "Connections" block, or nothing if there are none.
export function connectionSection(links, linkFor) {
  if (!links || !links.length) return [];
  const otherName = ({ conn, dir }) => (dir === "out" ? conn.to : conn.from).name;
  const sorted = [...links].sort(
    (a, b) => (a.conn.rel.legendOrder ?? 0) - (b.conn.rel.legendOrder ?? 0) || otherName(a).localeCompare(otherName(b)),
  );
  return [el("div", "pin-connections", el("b", "", "Connections"), el("ul", "conn-list", ...sorted.map((link) => connectionItem(link, linkFor))))];
}

// In a pop-up, pins fly-to-and-open and Locations open their panel.
const popupLinkFor = (end) => (end.entry ? pinLink(end.entry) : placeLink(end.place));

// Studio descriptions are plain text; a blank line starts a new paragraph.
export function paragraphs(description) {
  const parts = Array.isArray(description)
    ? description
    : String(description || "").trim().split(/\n\s*\n/);
  return parts
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text) => {
      const p = document.createElement("p");
      p.textContent = text;
      return p;
    });
}

// `from`: the Location panel this was opened from, if any. Pins shown as part of their
// Location's marker always offer a way back to it.
export function showPin(entry, { from = null } = {}) {
  const { pin, type, icon, place } = entry;
  closePlace({ restoreFocus: false });
  returnFocusTo = (entry.rep && entry.rep.getElement()) || (from && from.rep && from.rep.getElement()) || null;
  backTo = from || (place && entry.rep && entry.rep === place.marker ? place : null);
  backButton.hidden = !backTo;
  if (backTo) backButton.textContent = `◀ Back to ${backTo.location.name}`;

  document.getElementById("pin-name").textContent = pin.name;
  const header = document.getElementById("pin-icon");
  header.src = icon.src;
  header.classList.toggle("smooth", !icon.pixelated);
  document.getElementById("pin-type").textContent = type.title;

  const rows = [];
  if (place) rows.push(detailRow("Location", placeLink(place)));
  if (pin.rank) {
    const rankIcon = sanityIcon(pin.rank.icon);
    const img = rankIcon
      ? Object.assign(new Image(16, 16), {
          src: rankIcon.src,
          alt: "",
          className: rankIcon.pixelated ? "pin-rank-icon" : "pin-rank-icon smooth",
        })
      : "";
    rows.push(detailRow("Rank", img, pin.rank.title || "Unnamed rank"));
  }
  if (pin.status && pin.status.title) rows.push(detailRow("Status", pin.status.title));
  // Unpublished party members come back as null.
  const recruiters = (pin.recruitedBy || []).filter(Boolean);
  if (recruiters.length) rows.push(detailRow("Recruited by", recruiters.join(", ")));
  if (pin.partyMember) rows.push(detailRow("Party member", pin.partyMember));
  if (pin.attitude) rows.push(detailRow("Attitude", ATTITUDES[pin.attitude] || pin.attitude));
  const giver = pinsById.get(pin.questGiver);
  if (giver) rows.push(detailRow("Quest giver", pinLink(giver)));
  const superior = pinsById.get(pin.reportsTo);
  if (superior) rows.push(detailRow("Reports to", pinLink(superior)));
  if (entry.reports && entry.reports.length) {
    const links = entry.reports.flatMap((report, i) => (i ? [", ", pinLink(report)] : [pinLink(report)]));
    rows.push(detailRow("Direct reports", ...links));
  }
  // Free-form Details rows from Studio; rows left empty are skipped.
  for (const { label, value } of pin.details || []) {
    if (label && value && value.trim()) rows.push(detailRow(label, value.trim()));
  }
  document.getElementById("pin-details").replaceChildren(...rows);
  document.getElementById("pin-connections").replaceChildren(...connectionSection(entry.links, popupLinkFor));
  document.getElementById("pin-description").replaceChildren(...paragraphs(pin.description));

  openModal("pin-modal");
  setCopyLink(pinCopyLink, entry);
  showInAddress(entry.pin.id ? entry : null);
  document.getElementById("pin-ok").focus();
}

export function closePin({ restoreFocus = true } = {}) {
  if (pinModal.style.display !== "flex") return;
  closeModal("pin-modal");
  showInAddress(null);
  if (restoreFocus && returnFocusTo) returnFocusTo.focus();
}

/** Fly to a pin or Location (out of any cluster) and open it. Ones that aren't drawn
 *  (filtered out, or with no position) just open. */
export function goTo(record) {
  closePin({ restoreFocus: false });
  closePlace({ restoreFocus: false });
  reveal(record.rep, () => (record.pin ? showPin(record) : showPlace(record)));
}

// "Copy link" in the pop-up and Location panel copies a link that opens this record.
const pinCopyLink = document.getElementById("pin-copy-link");
export function setCopyLink(button, record) {
  button.textContent = "Copy link";
  button.hidden = !record.pin?.id && !record.location;
  button.onclick = () =>
    navigator.clipboard
      .writeText(linkTo(record))
      .then(() => (button.textContent = "Copied!"))
      .catch(() => (button.textContent = "Couldn't copy"));
}

export function showError(message) {
  showPin({
    pin: { name: "Error", description: [message] },
    type: { title: "Map data could not be loaded" },
    icon: { src: ICON_BASE + "msg_error-0.png", pixelated: true },
    place: null,
    reports: [],
  });
}

backButton.addEventListener("click", () => {
  const place = backTo;
  closePin({ restoreFocus: false });
  if (place) showPlace(place);
});
document.querySelectorAll(".pin-close").forEach((b) => b.addEventListener("click", () => closePin()));
pinModal.addEventListener("click", (e) => {
  if (e.target === pinModal) closePin();
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (pinModal.style.display === "flex") closePin();
  else if (isPlaceOpen()) closePlace();
  else if (isLocating()) stopLocating();
});
