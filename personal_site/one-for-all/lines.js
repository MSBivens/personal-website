// Relationship lines: the Connections on pins and Locations, drawn in their Relationship
// Type's style. Also the line geometry: curves, bowing apart lines that share both ends,
// and arrowheads.
import { map, toLatLng } from "./view.js";
import { pinsById, placesById, relTypesById, waypointsById } from "./state.js";
import { anchorOf } from "./markers.js";

// Same values as studio/schemaTypes/lineStyle.ts.
const WIDTH_PX = { thin: 2, normal: 3, thick: 5 };
export function dashFor(pattern, w) {
  switch (pattern) {
    case "dashed":
      return [w * 4, w * 3];
    case "dotted":
      return [0, w * 3]; // zero-length dashes with round caps are dots
    case "dashDot":
      return [w * 4, w * 2.5, 0, w * 2.5];
    case "longDash":
      return [w * 8, w * 3];
    default:
      return null;
  }
}
export const lineWidth = (rel) => WIDTH_PX[rel.width] || WIDTH_PX.normal;
// Colours come from a fixed palette in Studio; anything else falls back to black.
export const lineColor = (rel) => (/^#[0-9a-f]{6}$/i.test(rel.color || "") ? rel.color : "#222222");

// Drawn lines, for the legend to filter: { conn, group, a, b }
export const relationLayer = L.layerGroup().addTo(map);
export const connectionLinks = [];

// A small inline picture of a line, for the legend and connection lists.
const SVG = "http://www.w3.org/2000/svg";
export function lineSample({ color, width = 2, dash = null, direction = "none" }) {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("class", "line-sample");
  svg.setAttribute("viewBox", "0 0 24 10");
  svg.setAttribute("width", "24");
  svg.setAttribute("height", "10");
  svg.setAttribute("aria-hidden", "true");
  const line = document.createElementNS(SVG, "line");
  const end = direction === "arrow" ? 17 : 22;
  for (const [k, v] of Object.entries({ x1: 2, y1: 5, x2: end, y2: 5, stroke: color, "stroke-width": width, "stroke-linecap": "round" })) {
    line.setAttribute(k, v);
  }
  if (dash) line.setAttribute("stroke-dasharray", dash.join(" "));
  svg.append(line);
  if (direction === "arrow") {
    const head = document.createElementNS(SVG, "path");
    head.setAttribute("d", "M16,1 L23,5 L16,9 z");
    head.setAttribute("fill", color);
    svg.append(head);
  }
  return svg;
}

// The sample for a Relationship Type, scaled down to fit the legend.
export function relSample(rel) {
  const w = Math.min(lineWidth(rel), 3);
  return lineSample({ color: lineColor(rel), width: w, dash: dashFor(rel.pattern, w), direction: rel.direction });
}

/* ---------- Endpoints: a pin or a Location ---------- */
export function endpointById(id) {
  const entry = pinsById.get(id);
  if (entry) return { id, name: entry.pin.name, entry };
  const place = placesById.get(id);
  if (place) return { id, name: place.location.name, place };
  return null;
}

// A Location's lines start at its Hub, or at its own X/Y if it isn't a Hub.
function anchorOfEndpoint(end) {
  if (end.entry) return anchorOf(end.entry);
  const { place } = end;
  const { x, y } = place.location;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y, latlng: toLatLng(x, y), hub: place.isHub ? place : null };
}

const holderOf = (end) => end.entry || end.place;

/* ---------- Geometry ---------- */
// Lines between the same two points share a key whichever way they run; `reversed` says
// which way this one runs, so bends land on a consistent side.
export function pairKey(p, q) {
  const a = `${p.x},${p.y}`;
  const b = `${q.x},${q.y}`;
  return a < b ? [`${a}|${b}`, false] : [`${b}|${a}`, true];
}

const BOW = 0.22; // how far a curve bulges, as a share of its length
const CURVE_STEPS = 16;

// Gives every segment of every route a bend. Segments that join the same two points take
// turns at the middle slot and the slots either side of it (0, +1, -1, +2, ...). A network
// line already on that pair keeps the straight middle; Curved types never take it.
function assignBends(drawable, networkPairs) {
  const groups = new Map();
  for (const d of drawable) {
    d.bends = [];
    for (let i = 0; i < d.points.length - 1; i++) {
      const [key, reversed] = pairKey(d.points[i], d.points[i + 1]);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ d, i, reversed });
    }
  }
  const curved = (seg) => (seg.d.conn.rel.shape === "curved" ? 1 : 0);
  for (const [key, segs] of groups) {
    segs.sort((p, q) => curved(p) - curved(q) || (p.d.conn.rel.legendOrder ?? 0) - (q.d.conn.rel.legendOrder ?? 0));
    let next = networkPairs.has(key) ? 1 : 0;
    for (const seg of segs) {
      if (next === 0 && curved(seg)) next = 1;
      const slot = next === 0 ? 0 : Math.ceil(next / 2) * (next % 2 ? 1 : -1);
      next++;
      seg.d.bends[seg.i] = (seg.reversed ? -1 : 1) * slot * BOW;
    }
  }
}

// Image-pixel points → map positions, with each bent segment drawn as a curve.
function routeLatLngs(points, bends) {
  const out = [toLatLng(points[0].x, points[0].y)];
  for (let i = 0; i < points.length - 1; i++) {
    const p = points[i];
    const q = points[i + 1];
    const bend = bends[i] || 0;
    if (!bend) {
      out.push(toLatLng(q.x, q.y));
      continue;
    }
    // Control point: off the midpoint, perpendicular to the segment.
    const cx = (p.x + q.x) / 2 - (q.y - p.y) * bend;
    const cy = (p.y + q.y) / 2 + (q.x - p.x) * bend;
    for (let s = 1; s <= CURVE_STEPS; s++) {
      const t = s / CURVE_STEPS;
      const u = 1 - t;
      out.push(toLatLng(u * u * p.x + 2 * u * t * cx + t * t * q.x, u * u * p.y + 2 * u * t * cy + t * t * q.y));
    }
  }
  return out;
}

/* ---------- Arrowheads ---------- */
// Positioned in screen pixels, so they're re-placed after every zoom.
const ARROW_GAP = 18; // tip stops this far short of the end, clear of a 32px icon
const ARROW_SIZE = 12;
const arrows = [];

function makeArrow(color, latlngs) {
  const icon = L.divIcon({
    className: "line-arrow",
    html: `<svg viewBox="0 0 12 12" width="${ARROW_SIZE}" height="${ARROW_SIZE}"><path d="M0,0 L12,6 L0,12 z" fill="${color}" stroke="#fff" stroke-width="1"/></svg>`,
    iconSize: [ARROW_SIZE, ARROW_SIZE],
    iconAnchor: [ARROW_SIZE / 2, ARROW_SIZE / 2],
  });
  const arrow = { marker: L.marker(latlngs[latlngs.length - 1], { icon, interactive: false, keyboard: false }), latlngs };
  arrow.marker.on("add", () => placeArrow(arrow));
  arrows.push(arrow);
  return arrow.marker;
}

function placeArrow({ marker, latlngs }) {
  const pts = latlngs.map((ll) => map.latLngToLayerPoint(ll));
  let back = ARROW_GAP + ARROW_SIZE / 2; // walk back from the end to the arrow's centre
  for (let i = pts.length - 1; i > 0; i--) {
    const end = pts[i];
    const start = pts[i - 1];
    const len = end.distanceTo(start);
    if (len >= back) {
      const t = back / len;
      const centre = L.point(end.x + (start.x - end.x) * t, end.y + (start.y - end.y) * t);
      marker.setLatLng(map.layerPointToLatLng(centre));
      const el = marker.getElement();
      el.style.visibility = "";
      el.firstChild.style.transform = `rotate(${Math.atan2(end.y - start.y, end.x - start.x)}rad)`;
      return;
    }
    back -= len;
  }
  // Too short at this zoom to fit an arrow without covering the icons.
  marker.getElement().style.visibility = "hidden";
}

map.on("zoomend", () => {
  for (const arrow of arrows) if (map.hasLayer(arrow.marker)) placeArrow(arrow);
});

/* ---------- Building the lines ---------- */
function tooltipText(conn) {
  const via = conn.via.length ? ` via ${conn.via.map((po) => po.name).join(", ")}` : "";
  const label = conn.label ? ` · ${conn.label}` : "";
  return `${conn.rel.title}: ${conn.from.name} → ${conn.to.name}${via}${label}`;
}

function drawConnection({ conn, points, bends, a, b }) {
  const { rel } = conn;
  const w = lineWidth(rel);
  const color = lineColor(rel);
  const flowing = rel.direction === "flow";
  // Flowing needs gaps to show movement, so a solid flowing line gets short dashes.
  const dash = dashFor(rel.pattern, w) || (flowing ? [w * 3, w * 2] : null);
  const latlngs = routeLatLngs(points, bends);

  // A pale outline under each line keeps it readable on forests and water alike.
  const casing = L.polyline(latlngs, { color: "#fff", weight: w + 3, opacity: 0.55, interactive: false });
  const line = L.polyline(latlngs, {
    className: flowing ? "relation-line line-flow" : "relation-line",
    color,
    weight: w,
    opacity: 0.95,
    dashArray: dash ? dash.join(" ") : null,
  }).bindTooltip(tooltipText(conn), { sticky: true });
  if (flowing) {
    // The animation moves the dashes one full pattern length per cycle (see style.css).
    const period = dash.reduce((sum, n) => sum + n, 0);
    line.on("add", () => line.getElement().style.setProperty("--flow-offset", `-${period}px`));
  }
  const group = L.layerGroup([casing, line]);
  if (rel.direction === "arrow") group.addLayer(makeArrow(color, latlngs));
  connectionLinks.push({ conn, group, a, b });
}

// Reads every Connection, records it on both ends (for pop-ups and panels), and draws the
// ones whose ends are on the map. `networkPairs`: pairKeys already used by network lines.
export function connectRelationships(networkPairs) {
  const drawable = [];
  const collect = (from, connections) => {
    for (const c of connections || []) {
      const rel = relTypesById.get(c.typeId);
      const to = endpointById(c.to);
      if (!rel || !to) continue; // relationship or far end unpublished / Hidden
      // Unpublished Post Offices are skipped; the line goes straight past them.
      const via = (c.via || [])
        .map((id) => waypointsById.get(id))
        .filter((po) => po && Number.isFinite(po.x) && Number.isFinite(po.y));
      const conn = { rel, from, to, via, label: c.label, notes: c.notes };
      holderOf(from).links.push({ conn, dir: "out" });
      holderOf(to).links.push({ conn, dir: "in" });
      rel.count++;

      const a = anchorOfEndpoint(from);
      const b = anchorOfEndpoint(to);
      if (!a || !b) continue; // listed in pop-ups, but one end has no spot on the map
      if (!via.length && a.hub && a.hub === b.hub) {
        a.hub.innerLinks.push(conn); // both ends in one Hub: listed in its panel instead
        continue;
      }
      if (!via.length && a.x === b.x && a.y === b.y) continue;
      drawable.push({ conn, points: [a, ...via, b], a, b });
    }
  };
  for (const entry of pinsById.values()) collect({ id: entry.pin.id, name: entry.pin.name, entry }, entry.pin.connections);
  for (const place of placesById.values()) {
    collect({ id: place.location.id, name: place.location.name, place }, place.location.connections);
  }
  assignBends(drawable, networkPairs);
  for (const d of drawable) drawConnection(d);
}
