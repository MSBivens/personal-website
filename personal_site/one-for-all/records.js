// The Records window: every pin and Location in one Explorer-style table. Sort by clicking a
// column heading, narrow it by type and status, and click a name to fly to it and open it.
import { campaign, isNew, isOpenThread, pinsById, placesById } from "./state.js";
import { goTo } from "./panel.js";
import { badgeElement } from "./badges.js";

const modal = document.getElementById("records-modal");
const toggle = document.getElementById("records-button");
const typeSelect = document.getElementById("records-type");
const statusSelect = document.getElementById("records-status");
const showSelect = document.getElementById("records-show");
const tbody = document.getElementById("records-rows");
const countLabel = document.getElementById("records-count");
const LOCATIONS = "locations"; // type filter value for Locations (Pin Type ids never look like this)

let rows = [];
let sort = { key: "name", dir: 1 };

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function buildRecords() {
  rows = [
    ...[...pinsById.values()].map((entry) => ({
      record: entry,
      name: entry.pin.name,
      icon: entry.icon,
      typeId: entry.type.id,
      type: entry.type.title,
      typeOrder: entry.type.legendOrder ?? 0,
      location: entry.place ? entry.place.location.name : "",
      status: (entry.pin.status && entry.pin.status.title) || "",
      statusStyle: entry.pin.status && entry.pin.status.style,
      statusInfo: entry.pin.status,
      added: entry.pin.createdAt || "",
    })),
    ...[...placesById.values()].map((place) => ({
      record: place,
      name: place.location.name,
      icon: place.icon,
      typeId: LOCATIONS,
      type: "Location",
      typeOrder: Infinity,
      location: "",
      status: "",
      added: place.location.createdAt || "",
    })),
  ];

  // Type filter: the types that have records, in legend order, then Locations.
  const types = new Map();
  for (const row of rows) if (!types.has(row.typeId)) types.set(row.typeId, row);
  const options = [...types.values()]
    .sort((a, b) => a.typeOrder - b.typeOrder)
    .map((row) => new Option(row.typeId === LOCATIONS ? "Locations" : row.type, row.typeId));
  typeSelect.replaceChildren(new Option("All types", ""), ...options);
  toggle.hidden = false;
}

// Statuses offered are the ones used by records of the chosen type.
function fillStatuses() {
  const chosen = statusSelect.value;
  const statuses = [...new Set(rows.filter(matchesType).map((row) => row.status).filter(Boolean))].sort();
  statusSelect.replaceChildren(new Option("Any status", ""), ...statuses.map((status) => new Option(status, status)));
  statusSelect.value = statuses.includes(chosen) ? chosen : "";
  statusSelect.disabled = !statuses.length;
}

const matchesType = (row) => !typeSelect.value || row.typeId === typeSelect.value;
const matchesShow = (row) =>
  !showSelect.value || (showSelect.value === "new" ? isNew(row.record) : isOpenThread(row.record));
const matches = (row) =>
  matchesType(row) && (!statusSelect.value || row.status === statusSelect.value) && matchesShow(row);

const COMPARE = {
  name: (a, b) => a.name.localeCompare(b.name),
  type: (a, b) => a.typeOrder - b.typeOrder || a.type.localeCompare(b.type),
  location: (a, b) => a.location.localeCompare(b.location),
  status: (a, b) => a.status.localeCompare(b.status),
  added: (a, b) => a.added.localeCompare(b.added),
};

function cell(className, ...content) {
  const td = Object.assign(document.createElement("td"), { className });
  td.append(...content);
  return td;
}

function renderRows() {
  const shown = rows
    .filter(matches)
    .sort((a, b) => sort.dir * COMPARE[sort.key](a, b) || a.name.localeCompare(b.name));
  tbody.replaceChildren(
    ...shown.map((row) => {
      const tr = document.createElement("tr");
      const button = Object.assign(document.createElement("button"), { type: "button", className: "place-item" });
      const icon = Object.assign(new Image(16, 16), { src: row.icon.src, alt: "" });
      if (!row.icon.pixelated) icon.classList.add("smooth");
      if (row.statusStyle && row.statusStyle !== "normal") icon.classList.add(`is-${row.statusStyle}`);
      button.append(icon, row.name);
      if (isNew(row.record)) button.append(newTag());
      button.addEventListener("click", () => {
        closeRecords({ restoreFocus: false });
        goTo(row.record);
      });
      const added = row.added ? dateFormat.format(new Date(row.added)) : "";
      tr.append(
        cell("records-name", button),
        cell("records-type", row.type),
        cell("records-location", row.location),
        cell("records-status", badgeElement(row.statusInfo), row.status),
        cell("records-added", added),
      );
      return tr;
    }),
  );
  countLabel.textContent = `${shown.length} ${shown.length === 1 ? "record" : "records"}`;
  for (const th of modal.querySelectorAll("th[data-sort]")) {
    const sorted = th.dataset.sort === sort.key;
    th.setAttribute("aria-sort", sorted ? (sort.dir > 0 ? "ascending" : "descending") : "none");
  }
}

function newTag() {
  return Object.assign(document.createElement("span"), { className: "new-tag inline", textContent: "NEW" });
}

function openRecords() {
  // "New since last session" only means something once a session date is set.
  showSelect.querySelector('option[value="new"]').disabled = !campaign.lastSession;
  fillStatuses();
  renderRows();
  openModal("records-modal");
  toggle.setAttribute("aria-expanded", "true");
  typeSelect.focus();
}

export const isRecordsOpen = () => modal.style.display === "flex";

function closeRecords({ restoreFocus = true } = {}) {
  if (!isRecordsOpen()) return;
  closeModal("records-modal");
  toggle.setAttribute("aria-expanded", "false");
  if (restoreFocus) toggle.focus();
}

toggle.addEventListener("click", openRecords);
typeSelect.addEventListener("change", () => {
  fillStatuses();
  renderRows();
});
statusSelect.addEventListener("change", renderRows);
showSelect.addEventListener("change", renderRows);
for (const th of modal.querySelectorAll("th[data-sort]")) {
  th.querySelector("button").addEventListener("click", () => {
    const key = th.dataset.sort;
    // Newest first is the useful way round for Added.
    sort = { key, dir: sort.key === key ? -sort.dir : key === "added" ? -1 : 1 };
    renderRows();
  });
}
modal.querySelectorAll(".records-close").forEach((button) => button.addEventListener("click", () => closeRecords()));
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeRecords();
});
modal.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.stopPropagation();
    closeRecords();
  }
});
