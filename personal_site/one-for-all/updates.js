// Keeping players up to date: "What's new" lists the pins and Locations created since the
// last session (set in Campaign Settings); "Open threads" lists the pins whose status is an
// open thread, and can show only those on the map. Both open the same list window.
import { campaign, isNew, isOpenThread, pinsById, placesById } from "./state.js";
import { goTo } from "./panel.js";
import { badgeElement } from "./badges.js";
import { threadsView } from "./filters.js";
import { render } from "./render.js";

const modal = document.getElementById("list-modal");
const titleEl = document.getElementById("list-title");
const introEl = document.getElementById("list-intro");
const contentEl = document.getElementById("list-content");
const onlyRow = document.getElementById("list-only-row");
const onlyBox = document.getElementById("list-only");
const newButton = document.getElementById("new-button");
const threadsButton = document.getElementById("threads-button");
const chip = document.getElementById("threads-chip");
let opener = null;

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const sessionDate = () => dateFormat.format(new Date(`${campaign.lastSession}T00:00:00`));

const el = (tag, className, ...children) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.append(...children);
  return node;
};

// Records grouped by type in legend order (Locations last), each a button that goes to it.
function groupedList(records) {
  const groups = new Map();
  for (const record of records) {
    const key = record.pin ? record.type : "locations";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  const order = (key) => (key === "locations" ? Infinity : key.legendOrder ?? 0);
  const box = el("div", "place-records");
  for (const [key, group] of [...groups].sort(([a], [b]) => order(a) - order(b))) {
    const title = key === "locations" ? "Locations" : group.length === 1 ? key.title : key.plural || key.title;
    const name = (record) => (record.pin ? record.pin.name : record.location.name);
    const items = group
      .sort((a, b) => name(a).localeCompare(name(b)))
      .map((record) => {
        const img = Object.assign(new Image(16, 16), { src: record.icon.src, alt: "" });
        if (!record.icon.pixelated) img.classList.add("smooth");
        const button = el("button", "place-item", img, name(record));
        button.type = "button";
        button.addEventListener("click", () => {
          closeList({ restoreFocus: false });
          goTo(record);
        });
        const where = record.pin && record.place ? el("span", "place-tag", record.place.location.name) : "";
        return el("li", "", button, record.pin ? badgeElement(record.pin.status) : "", where);
      });
    box.append(el("div", "place-group", `${title} (${group.length})`), el("ul", "place-list", ...items));
  }
  return box;
}

function openList({ title, intro, records, empty, threads }) {
  opener = document.activeElement;
  titleEl.textContent = title;
  introEl.textContent = intro;
  contentEl.replaceChildren(records.length ? groupedList(records) : el("p", "list-empty", empty));
  onlyRow.hidden = !threads || !records.length;
  onlyBox.checked = threadsView.on;
  openModal("list-modal");
  (contentEl.querySelector("button") || modal.querySelector(".list-close")).focus();
}

const isListOpen = () => modal.style.display === "flex";
function closeList({ restoreFocus = true } = {}) {
  if (!isListOpen()) return;
  closeModal("list-modal");
  if (restoreFocus && opener && document.contains(opener)) opener.focus();
}

function setThreadsView(on) {
  threadsView.on = on;
  chip.hidden = !on;
  threadsButton.setAttribute("aria-pressed", String(on));
  render();
}

const freshRecords = () => [...pinsById.values(), ...placesById.values()].filter(isNew);
const threadRecords = () => [...pinsById.values()].filter(isOpenThread);

/** Shows the toolbar buttons once the data has loaded. */
export function setUpUpdates() {
  if (campaign.lastSession) {
    const count = freshRecords().length;
    document.getElementById("new-count").textContent = count;
    document.getElementById("new-count").hidden = !count;
    newButton.hidden = false;
  }
  threadsButton.hidden = false;
}

newButton.addEventListener("click", () =>
  openList({
    title: "What's new",
    intro: `Added since the last session (${sessionDate()}).`,
    records: freshRecords(),
    empty: "Nothing new since the last session.",
  }),
);
threadsButton.addEventListener("click", () =>
  openList({
    title: "Open threads",
    intro: "Things the party could still pursue.",
    records: threadRecords(),
    empty: "No open threads right now.",
    threads: true,
  }),
);
onlyBox.addEventListener("change", () => setThreadsView(onlyBox.checked));
document.getElementById("threads-chip-off").addEventListener("click", () => setThreadsView(false));
modal.querySelectorAll(".list-close").forEach((button) => button.addEventListener("click", () => closeList()));
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeList();
});
modal.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.stopPropagation();
    closeList();
  }
});
