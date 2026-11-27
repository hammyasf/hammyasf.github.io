// Where everything is: two floating islands joined by a rope bridge.
// The main island holds the recent work and the campfire; the older island, across the
// bridge, holds 2016 to 2023. Pure data and geometry, no three.js, so it can be tested.

export const ISLANDS = [
  { id: 'main', x: 0, z: 0, r: 12.9, walk: 11.5 },
  { id: 'old', x: 33, z: -4, r: 10.5, walk: 9.3 },
];
export const BRIDGE = { a: { x: 10.9, z: -2.2 }, b: { x: 24.0, z: -3.4 }, half: 0.8 };
export const SPAWN = { x: -7.0, z: 7.3 };
export const SCOUT = { x: -5.4, z: 7.9 };
export const POND = { x: 0.6, z: 3.0, r: 1.85 };

// kind picks the felt model; radius is the walk-around footprint
export const SITES = [
  { id: 'codewisp', island: 'main', x: -8.7, z: -1.6, radius: 2.0, kind: 'arcade' },
  { id: 'shiba-inu', island: 'main', x: -2.6, z: -7.8, radius: 1.8, kind: 'tower' },
  { id: 'arch-mhf', island: 'main', x: 4.6, z: -7.6, radius: 1.9, kind: 'cottage' },
  { id: 'openspeaker', island: 'main', x: 7.8, z: 4.2, radius: 2.4, kind: 'theater' },
  { id: 'camp', island: 'main', x: 1.6, z: 8.0, radius: 1.1, kind: 'camp' },
  { id: 'gatheredhere', island: 'old', x: 29.0, z: -9.6, radius: 1.8, kind: 'pavilion' },
  { id: 'elasticswap', island: 'old', x: 35.4, z: -10.6, radius: 1.6, kind: 'kiosk' },
  { id: 'zvoid', island: 'old', x: 39.8, z: -4.4, radius: 1.8, kind: 'studio' },
  { id: 'koji', island: 'old', x: 36.4, z: 2.2, radius: 1.6, kind: 'toybox' },
  { id: 'aftertutor', island: 'old', x: 29.0, z: 1.8, radius: 2.0, kind: 'shop' },
];

// felt stepping-stone loops, one per island
const pts = (a) => a.map(([x, z]) => ({ x, z }));
export const PATHS = {
  main: pts([[-7.2, 7.6], [-6.6, 4.2], [-5.6, 0.8], [-4.6, -3.2], [-2.4, -4.6], [1.0, -4.6], [4.4, -4.4], [7.4, -3.0], [9.6, -2.2],
    [7.6, -0.6], [5.2, 1.6], [4.6, 5.0], [2.6, 5.6], [-1.5, 6.8], [-4.6, 7.2]]),
  old: pts([[24.6, -3.5], [27.6, -5.4], [29.6, -6.6], [33.0, -7.2], [36.2, -5.8], [37.0, -3.6], [35.4, -0.8], [32.4, -0.6], [29.8, -1.4], [26.8, -2.6]]),
};

const EPS = 1e-7;
const islandOf = (id) => ISLANDS.find((i) => i.id === id);
function onBridge(x, z) { // returns {t, off, len, ux, uz} for the bridge's centreline
  const dx = BRIDGE.b.x - BRIDGE.a.x, dz = BRIDGE.b.z - BRIDGE.a.z, len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len;
  const px = x - BRIDGE.a.x, pz = z - BRIDGE.a.z;
  return { t: (px * ux + pz * uz) / len, off: px * -uz + pz * ux, len, ux, uz };
}

/** 'main' | 'old' | 'bridge' | null (open sky) */
export function regionAt(x, z) {
  for (const i of ISLANDS) if (Math.hypot(x - i.x, z - i.z) < i.walk) return i.id;
  const b = onBridge(x, z);
  if (b.t >= 0 && b.t <= 1 && Math.abs(b.off) < BRIDGE.half) return 'bridge';
  return null;
}

/** The point itself when it is walkable, else the nearest walkable point. */
export function clampWalkable(x, z) {
  if (regionAt(x, z)) return { x, z };
  const cands = ISLANDS.map((i) => {
    const d = Math.hypot(x - i.x, z - i.z) || 1, k = (i.walk - EPS) / d;
    return { x: i.x + (x - i.x) * k, z: i.z + (z - i.z) * k };
  });
  const b = onBridge(x, z), t = Math.min(1, Math.max(0, b.t)), off = Math.max(-(BRIDGE.half - EPS), Math.min(BRIDGE.half - EPS, b.off));
  cands.push({ x: BRIDGE.a.x + b.ux * t * b.len - b.uz * off, z: BRIDGE.a.z + b.uz * t * b.len + b.ux * off });
  let best = cands[0], bd = Infinity;
  for (const c of cands) { const d = Math.hypot(c.x - x, c.z - z); if (d < bd) { bd = d; best = c; } }
  return best;
}

/** Waypoints from one point to another, crossing the bridge when the islands differ. */
export function route(from, to) {
  const end = { x: to.x, z: to.z }, A = { ...BRIDGE.a }, B = { ...BRIDGE.b };
  const f = clampWalkable(from.x, from.z), t = clampWalkable(to.x, to.z);
  const rf = regionAt(f.x, f.z), rt = regionAt(t.x, t.z);
  if (rf === rt) return [end];
  if (rf === 'bridge') return [rt === 'main' ? A : B, end];
  if (rt === 'bridge') return [rf === 'main' ? A : B, end];
  return rf === 'main' ? [A, B, end] : [B, A, end];
}

export const site = (id) => SITES.find((s) => s.id === id);
export const islandById = islandOf;
/** The building model for a case id, or null when there is none. */
export const kindFor = (id) => site(id)?.kind ?? null;

export const BRIDGE_SAG = 0.28;
/** Height of the walking surface: 0 on the islands, a gentle sag along the rope bridge. */
export function groundHeight(x, z) {
  if (regionAt(x, z) !== 'bridge') return 0;
  return -BRIDGE_SAG * Math.sin(Math.PI * Math.min(1, Math.max(0, onBridge(x, z).t)));
}
