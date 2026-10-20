// Marker icons. Which icon a pin gets: its own override, then its rank's (members),
// then its type's, then FALLBACK_ICON, so a pin is never blank.
import { badgeSvg } from "./badges.js";

export const ICON_BASE = "https://win98icons.alexmeub.com/icons/png/";

// Kept in the repo so it can't go missing.
export const FALLBACK_ICON = { src: "/one-for-all/icons/fallback.png", pixelated: true };

// A Sanity image asset → { src, pixelated }. Sanity resizes uploads on the fly (SVGs
// can't be resized, but don't need to be). Small uploads are pixel art like the Win98
// icons, so they keep hard edges; bigger ones are drawn smoothly.
export function sanityIcon(asset) {
  if (!asset || !asset.url) return null;
  if (asset.extension === "svg") return { src: asset.url, pixelated: false };
  return { src: `${asset.url}?w=64&h=64&fit=max`, pixelated: !(asset.width > 64) };
}

// A pin marker: its icon, with its status badge (if any) on the bottom-right corner.
const cache = new Map();
export function pinIcon(icon, className = "", status = null) {
  const classes = [icon.pixelated ? "" : "smooth", className].filter(Boolean).join(" ");
  const badge = badgeSvg(status);
  const key = `${icon.src}|${classes}|${badge}`;
  if (!cache.has(key)) {
    const src = icon.src.replace(/"/g, "&quot;");
    cache.set(
      key,
      L.divIcon({
        html: `<img class="pin-img" src="${src}" alt="" width="32" height="32">${badge}`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: `map-pin ${classes}`.trim(),
      }),
    );
  }
  return cache.get(key);
}
