// Status badges: a small round symbol on the corner of a pin (and next to its status in
// lists), set per Status in Studio. Drawn as SVG rather than emoji so they look the same on
// every device.
const BADGES = {
  done: {
    label: "Done",
    fill: "#2e7d32",
    mark: '<path d="M4.5 8.3 7 10.8 11.6 5.5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  unconfirmed: {
    label: "Unconfirmed",
    fill: "#b06d00",
    mark: '<path d="M6.1 6.2a2 2 0 1 1 2.9 1.8c-.7.4-1 .8-1 1.5v.4" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/><circle cx="8" cy="11.9" r="1" fill="#fff"/>',
  },
  lead: {
    label: "Lead",
    fill: "#c0392b",
    mark: '<path d="M8 4v4.6" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="8" cy="11.6" r="1.1" fill="#fff"/>',
  },
  dead: {
    label: "Dead",
    fill: "#222",
    mark:
      '<circle cx="8" cy="7.2" r="3.6" fill="#fff"/><rect x="6.2" y="9.4" width="3.6" height="2.6" rx=".6" fill="#fff"/>' +
      '<circle cx="6.6" cy="7.2" r="1" fill="#222"/><circle cx="9.4" cy="7.2" r="1" fill="#222"/>',
  },
  failed: {
    label: "Failed",
    fill: "#6b1f1f",
    mark: '<path d="M5.4 5.4 10.6 10.6M10.6 5.4 5.4 10.6" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
  },
};

/** SVG markup for a status's badge, or "" for none. Only our own fixed markup goes in here. */
export function badgeSvg(status, size = 14) {
  const badge = status && BADGES[status.badge];
  if (!badge) return "";
  return (
    `<svg class="status-badge" viewBox="0 0 16 16" width="${size}" height="${size}" role="img" aria-label="${badge.label}">` +
    `<circle cx="8" cy="8" r="7.2" fill="${badge.fill}" stroke="#fff" stroke-width="1.4"/>${badge.mark}</svg>`
  );
}

/** The same badge as an element, for lists and the record panel. */
export function badgeElement(status, size = 12) {
  const markup = badgeSvg(status, size);
  if (!markup) return "";
  const holder = document.createElement("span");
  holder.className = "badge-inline";
  holder.innerHTML = markup;
  return holder;
}
