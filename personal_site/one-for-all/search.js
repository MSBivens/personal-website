// The Find box in the toolbar: type part of a name (or a word from a record's Location,
// Details, status or description) and pick a result to fly to it and open it.
// Press / anywhere on the map page to jump to the box.
import { pinsById, placesById } from "./state.js";
import { goTo } from "./popup.js";

const input = document.getElementById("find-input");
const list = document.getElementById("find-results");
const MAX_RESULTS = 8;

// Lower case without accents, so "faerun" finds "Faerûn".
const fold = (text) =>
  String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

let index = [];
let results = [];
let active = -1;

export function buildSearchIndex() {
  const detailText = (details) => (details || []).map(({ label, value }) => `${label} ${value}`);
  index = [
    ...[...pinsById.values()].map((entry) => ({
      record: entry,
      name: entry.pin.name,
      icon: entry.icon,
      kind: [entry.type.title, entry.place && entry.place.location.name].filter(Boolean).join(" · "),
      extra: [
        entry.place && entry.place.location.name,
        entry.pin.status && entry.pin.status.title,
        ...detailText(entry.pin.details),
        entry.pin.description,
      ],
    })),
    ...[...placesById.values()].map((place) => ({
      record: place,
      name: place.location.name,
      icon: place.icon,
      kind: "Location",
      extra: [...detailText(place.location.details), place.location.description],
    })),
  ].map((item) => ({ ...item, foldedName: fold(item.name), foldedExtra: fold(item.extra.join(" ")) }));
}

// Name matches first (start of the name, then start of a word, then anywhere), then records
// whose other text has every word typed.
function search(query) {
  const q = fold(query).trim();
  if (!q) return [];
  const words = q.split(/\s+/);
  const scored = [];
  for (const item of index) {
    let score;
    if (item.foldedName.startsWith(q)) score = 0;
    else if (item.foldedName.split(/[^a-z0-9]+/).some((word) => word.startsWith(q))) score = 1;
    else if (item.foldedName.includes(q)) score = 2;
    else if (words.every((word) => item.foldedName.includes(word) || item.foldedExtra.includes(word))) score = 3;
    else continue;
    scored.push({ item, score });
  }
  return scored
    .sort((a, b) => a.score - b.score || a.item.name.localeCompare(b.item.name))
    .slice(0, MAX_RESULTS)
    .map(({ item }) => item);
}

function setActive(i) {
  active = i;
  list.querySelectorAll("[role=option]").forEach((option, n) => option.setAttribute("aria-selected", String(n === i)));
  if (i >= 0) {
    input.setAttribute("aria-activedescendant", `find-option-${i}`);
    document.getElementById(`find-option-${i}`).scrollIntoView({ block: "nearest" });
  } else {
    input.removeAttribute("aria-activedescendant");
  }
}

function closeList() {
  list.hidden = true;
  input.setAttribute("aria-expanded", "false");
  setActive(-1);
}

function showResults() {
  results = search(input.value);
  if (!input.value.trim()) return closeList();
  const options = results.map((item, i) => {
    const option = Object.assign(document.createElement("li"), { id: `find-option-${i}`, className: "find-option" });
    option.setAttribute("role", "option");
    const icon = Object.assign(new Image(16, 16), { src: item.icon.src, alt: "" });
    if (!item.icon.pixelated) icon.classList.add("smooth");
    const name = Object.assign(document.createElement("span"), { className: "find-name", textContent: item.name });
    const kind = Object.assign(document.createElement("span"), { className: "find-kind", textContent: item.kind });
    option.append(icon, name, kind);
    // mousedown, so the pick lands before the box loses focus and closes the list.
    option.addEventListener("mousedown", (e) => {
      e.preventDefault();
      choose(i);
    });
    return option;
  });
  if (!options.length) {
    const none = Object.assign(document.createElement("li"), { className: "find-none", textContent: "No matches" });
    options.push(none);
  }
  list.replaceChildren(...options);
  list.hidden = false;
  input.setAttribute("aria-expanded", "true");
  setActive(results.length ? 0 : -1);
}

function choose(i) {
  const item = results[i];
  if (!item) return;
  input.value = "";
  closeList();
  input.blur();
  goTo(item.record);
}

input.addEventListener("input", showResults);
input.addEventListener("focus", () => input.value.trim() && showResults());
input.addEventListener("blur", closeList);
input.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    if (list.hidden) showResults();
    if (!results.length) return;
    const step = e.key === "ArrowDown" ? 1 : -1;
    setActive((active + step + results.length) % results.length);
  } else if (e.key === "Enter") {
    e.preventDefault();
    choose(active >= 0 ? active : 0);
  } else if (e.key === "Escape") {
    // Don't let the page's Esc handling close a pop-up as well.
    e.stopPropagation();
    if (!list.hidden) closeList();
    else {
      input.value = "";
      input.blur();
    }
  }
});

// "/" jumps to the Find box, unless you're typing somewhere already.
document.addEventListener("keydown", (e) => {
  if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
  const target = e.target;
  if (target.closest && target.closest("input, textarea, select, [contenteditable]")) return;
  if (document.querySelector(".modal[style*='flex']")) return;
  e.preventDefault();
  input.focus();
});
