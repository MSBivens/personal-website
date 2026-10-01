/**
 * START MENU LOGIC
 * Source of Authority: index.html
 */
function toggleStartMenu(e) {
  if (e) e.stopPropagation(); // Prevents immediate closing from body click
  const menu = document.getElementById("start-menu");
  if (menu) {
    menu.style.display = menu.style.display === "flex" ? "none" : "flex";
  }
}

function closeStartMenu() {
  const menu = document.getElementById("start-menu");
  if (menu) {
    menu.style.display = "none";
  }
}

/**
 * SYSTEM CLOCK
 * Source of Authority: index.html
 */
function updateClock() {
  const clockElement = document.getElementById("clock");
  if (!clockElement) return;

  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  clockElement.innerText = `${hours}:${minutes} ${ampm}`;
}

/**
 * ILLORIM & STORIES LOGIC
 * Standardizing tab and modal behavior
 */
function switchTab(tabName) {
  const lore = document.getElementById("lore");
  const map = document.getElementById("map");
  if (lore && map) {
    lore.style.display = tabName === "lore" ? "block" : "none";
    map.style.display = tabName === "map" ? "block" : "none";

    // Update tab styling
    const tabs = document.querySelectorAll(".tab");
    tabs.forEach((t) => t.classList.remove("active"));
    if (tabName === "lore") tabs[0].classList.add("active");
    else tabs[1].classList.add("active");
  }
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = "flex";
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = "none";
}

/**
 * INITIALIZATION
 */
document.addEventListener("DOMContentLoaded", () => {
  // Start Clock
  if (document.getElementById("clock")) {
    setInterval(updateClock, 1000);
    updateClock();
  }

  // Right-click protection for Lore pages
  if (document.querySelector(".explorer-window")) {
    window.oncontextmenu = (e) => e.preventDefault();
  }
});

/* =========================================
   EXPLORER & DECRYPTION LOGIC
   ========================================= */
const SECRET_KEY = "onsyn";

const fileMetadata = {
  Lanuella: {
    name: "Lanuella_and_Lanuer.doc",
    icon: "https://win98icons.alexmeub.com/icons/png/notepad_file-0.png",
    type: "Microsoft WordPad Document",
    size: "4.2 KB (4,302 bytes)",
    date: "Tuesday, October 24, 1995",
    note: "",
  },
  Locked: {
    name: "Locked_Archive.doc",
    icon: "https://win98icons.alexmeub.com/icons/png/file_locked-0.png",
    type: "Encrypted System File",
    size: "??? KB",
    date: "UNKNOWN",
    note: "ATTENTION: Requires resonance key to decrypt.",
  },
};

function openProps(key, e) {
  if (e) e.preventDefault();
  const data = fileMetadata[key];
  if (!data) return;

  document.getElementById("prop-filename").innerText = data.name;
  document.getElementById("prop-icon").src = data.icon;
  document.getElementById("prop-type").innerText = data.type;
  document.getElementById("prop-size").innerText = data.size;
  document.getElementById("prop-date").innerText = data.date;
  document.getElementById("prop-note").innerText = data.note;
  openModal("prop-modal");
}

function attemptDecrypt() {
  const input = document.getElementById("decrypt-input");
  if (input) input.value = "";
  const error = document.getElementById("decrypt-error");
  if (error) error.style.display = "none";
  openModal("decrypt-modal");
  setTimeout(() => input.focus(), 100);
}

function checkPassword() {
  const val = document.getElementById("decrypt-input").value.toLowerCase();
  const SECRET_KEY = "onsyn";

  if (val === SECRET_KEY) {
    // Redirect to the secret page
    window.location.href = "/secret";
  } else {
    const error = document.getElementById("decrypt-error");
    if (error) {
      error.style.display = "block";
      // Optional: add a classic Windows "shake" effect
      const win = document.querySelector("#decrypt-modal .prop-window");
      win.style.transform = "translateX(5px)";
      setTimeout(() => (win.style.transform = "translateX(-5px)"), 50);
      setTimeout(() => (win.style.transform = "translateX(0px)"), 100);
    }
  }
}
