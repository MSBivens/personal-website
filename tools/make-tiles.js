// Usage: npm run tiles -- <source-image> [output-dir]
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const TILE = 256;
const PAD = { r: 196, g: 222, b: 239 }; // the map's sea blue, also #map's background in style.css

const [src, outArg] = process.argv.slice(2);
if (!src) {
  console.error("Usage: npm run tiles -- <source-image> [output-dir]");
  process.exit(1);
}
const out = outArg || path.join(__dirname, "..", "personal_site", "one-for-all", "tiles");

(async () => {
  const { width, height } = await sharp(src, { limitInputPixels: false }).metadata();
  const maxZoom = Math.ceil(Math.log2(Math.max(width, height) / TILE));
  fs.rmSync(out, { recursive: true, force: true });

  for (let z = maxZoom; z >= 0; z--) {
    const scale = 2 ** (z - maxZoom);
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const { data, info } = await sharp(src, { limitInputPixels: false })
      .resize(w, h, { kernel: "lanczos3" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const raw = { raw: { width: info.width, height: info.height, channels: info.channels } };

    const cols = Math.ceil(w / TILE);
    const rows = Math.ceil(h / TILE);
    for (let y = 0; y < rows; y++) {
      fs.mkdirSync(path.join(out, String(z), String(y)), { recursive: true });
      for (let x = 0; x < cols; x++) {
        const tw = Math.min(TILE, w - x * TILE);
        const th = Math.min(TILE, h - y * TILE);
        await sharp(data, raw)
          .extract({ left: x * TILE, top: y * TILE, width: tw, height: th })
          .extend({ right: TILE - tw, bottom: TILE - th, background: PAD })
          .webp({ quality: 80 })
          .toFile(path.join(out, String(z), String(y), `${x}.webp`));
      }
    }
    console.log(`zoom ${z}: ${w}x${h}px, ${cols}x${rows} = ${cols * rows} tiles`);
  }
  console.log(`maxZoom=${maxZoom} width=${width} height=${height}`);
})();
