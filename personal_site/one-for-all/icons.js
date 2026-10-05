// Marker icons. Which icon a pin gets: its own override, then its rank's (members),
// then its type's, then FALLBACK_ICON, so a pin is never blank.

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

const cache = new Map();
export function pinIcon(icon, className = "") {
  const classes = [icon.pixelated ? "" : "smooth", className].filter(Boolean).join(" ");
  const key = `${icon.src}|${classes}`;
  if (!cache.has(key)) {
    cache.set(
      key,
      L.icon({
        iconUrl: icon.src,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: `map-pin ${classes}`.trim(),
      }),
    );
  }
  return cache.get(key);
}
