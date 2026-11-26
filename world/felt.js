// Felt, knit and plastic: the materials and soft shapes everything is made from.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export const V2 = THREE.Vector2, V3 = THREE.Vector3;
export const PI = Math.PI, TAU = PI * 2;

// seeded random so the island is the same every visit
let seed = 1311;
export const R = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
export const rr = (a, b) => a + R() * (b - a);

// ---------- fabric textures: felt fibres and knit stitches, drawn once ----------
export function fibreCanvases(size = 256, count = 4200) {
  const bump = document.createElement('canvas'), col = document.createElement('canvas');
  bump.width = bump.height = col.width = col.height = size;
  const b = bump.getContext('2d'), c = col.getContext('2d');
  b.fillStyle = '#808080'; b.fillRect(0, 0, size, size);
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, size, size);
  // cloudy density, the way pressed felt is thicker in patches
  for (let i = 0; i < 70; i++) {
    const x = R() * size, y = R() * size, r = 10 + R() * 40, dark = R() < 0.5;
    for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) {
      for (const [ctx, col] of [[b, dark ? '0,0,0' : '255,255,255'], [c, dark ? '70,45,30' : '255,255,255']]) {
        const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r); g.addColorStop(0, `rgba(${col},${ctx === b ? 0.12 : 0.1})`); g.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = g; ctx.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
      }
    }
  }
  for (let i = 0; i < count; i++) {
    const x = R() * size, y = R() * size, a = R() * TAU, l = 3 + R() * 11, bend = rr(-1.2, 1.2);
    const light = R() < 0.5, alpha = 0.1 + R() * 0.22, w = 0.5 + R() * 1.0;
    for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) {
      const path = () => { const p = new Path2D(); p.moveTo(x + dx, y + dy); p.quadraticCurveTo(x + dx + Math.cos(a + bend) * l * 0.5, y + dy + Math.sin(a + bend) * l * 0.5, x + dx + Math.cos(a) * l, y + dy + Math.sin(a) * l); return p; };
      b.strokeStyle = light ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`; b.lineWidth = w; b.stroke(path());
      c.strokeStyle = light ? `rgba(255,255,255,${alpha})` : `rgba(60,40,30,${alpha * 0.55})`; c.lineWidth = w; c.stroke(path());
    }
  }
  return { bump, col };
}
export function knitCanvases(size = 128) {
  const bump = document.createElement('canvas'), col = document.createElement('canvas');
  bump.width = bump.height = col.width = col.height = size;
  const b = bump.getContext('2d'), c = col.getContext('2d');
  b.fillStyle = '#202020'; b.fillRect(0, 0, size, size); c.fillStyle = '#e4e4e4'; c.fillRect(0, 0, size, size);
  const cw = size / 8, ch = size / 8;
  for (let row = 0; row < 8; row++) for (let k = 0; k < 8; k++) {
    const cx = k * cw + cw / 2, cy = row * ch + ch / 2;
    for (const s of [-1, 1]) {
      for (const [ctx, hi] of [[b, '#ffffff'], [c, '#ffffff']]) {
        ctx.save(); ctx.translate(cx + s * cw * 0.2, cy); ctx.rotate(s * -0.55);
        const g = ctx.createRadialGradient(0, -ch * 0.1, 0, 0, 0, ch * 0.62);
        g.addColorStop(0, hi); g.addColorStop(1, ctx === b ? '#303030' : '#c8c8c8');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, cw * 0.24, ch * 0.62, 0, 0, TAU); ctx.fill(); ctx.restore();
      }
    }
  }
  return { bump, col };
}
const FELT = fibreCanvases(), KNIT = knitCanvases();
const texCache = new Map();
export function tex(kind, rep) {
  const key = `${kind}:${rep}`;
  if (texCache.has(key)) return texCache.get(key);
  const src = { feltB: FELT.bump, feltC: FELT.col, knitB: KNIT.bump, knitC: KNIT.col }[kind];
  const t = new THREE.CanvasTexture(src);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 8;
  if (kind.endsWith('C')) t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(key, t); return t;
}
const matCache = new Map();
export function felt(hex, { rep = 2, knit = false, sheen = 1, velvet = false } = {}) {
  const key = `${hex}:${rep}:${knit}:${velvet}`;
  if (matCache.has(key)) return matCache.get(key);
  const col = new THREE.Color(hex);
  const m = new THREE.MeshPhysicalMaterial({
    color: col, map: tex(knit ? 'knitC' : 'feltC', rep), bumpMap: tex(knit ? 'knitB' : 'feltB', rep), bumpScale: knit ? 6 : 4,
    roughness: velvet ? 0.75 : 0.95, sheen, sheenRoughness: velvet ? 0.3 : 0.55,
    sheenColor: col.clone().lerp(new THREE.Color('#ffffff'), velvet ? 0.6 : 0.4),
  });
  matCache.set(key, m); return m;
}
export const plastic = (hex, rough = 0.22) => new THREE.MeshPhysicalMaterial({ color: hex, roughness: rough, clearcoat: 1, clearcoatRoughness: 0.08 });
export const glow = (hex, k = 3) => new THREE.MeshStandardMaterial({ color: '#000000', emissive: hex, emissiveIntensity: k });
export const thread = new THREE.MeshStandardMaterial({ color: '#f6ead6', roughness: 1 });

export function mesh(geo, mat, x = 0, y = 0, z = 0, parent = null, shadow = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
  m.castShadow = shadow; m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
// rounded "pillow" cylinder: the base shape for tiers, logs, stones
export function pillowCyl(r, h, rd = 0.12, seg = 40) {
  const p = [new V2(0, 0)], n = 6; rd = Math.min(rd, r * 0.5, h * 0.5);
  for (let i = 0; i <= n; i++) { const a = -PI / 2 + (i / n) * PI / 2; p.push(new V2(r - rd + Math.cos(a) * rd, rd + Math.sin(a) * rd)); }
  for (let i = 0; i <= n; i++) { const a = (i / n) * PI / 2; p.push(new V2(r - rd + Math.cos(a) * rd, h - rd + Math.sin(a) * rd)); }
  p.push(new V2(0, h));
  return new THREE.LatheGeometry(p, seg);
}
export const softBox = (w, h, d, r = 0.2) => new RoundedBoxGeometry(w, h, d, 4, r);
export function softPrism(w, h, d) { // triangular roof with soft bevelled edges
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 4, curveSegments: 4 });
  g.translate(0, 0, -d / 2); return g;
}
// running stitches along a polyline, or around a ring
const stitchGeo = new THREE.CapsuleGeometry(0.02, 0.075, 2, 6);
export function stitches(points, parent, spacing = 0.16) {
  const pos = [], dir = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1], len = a.distanceTo(b), n = Math.max(1, Math.floor(len / spacing));
    for (let k = 0; k < n; k++) { pos.push(a.clone().lerp(b, (k + 0.5) / n)); dir.push(b.clone().sub(a).normalize()); }
  }
  const im = new THREE.InstancedMesh(stitchGeo, thread, pos.length), o = new THREE.Object3D(), up = new V3(0, 1, 0);
  pos.forEach((p, i) => { o.position.copy(p); o.quaternion.setFromUnitVectors(up, dir[i]); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
  parent.add(im); return im;
}
export const ring = (r, y, n = 48) => Array.from({ length: n + 1 }, (_, i) => new V3(Math.cos((i / n) * TAU) * r, y, Math.sin((i / n) * TAU) * r));
export function labelTexture(text, { w = 512, h = 128, bg = null, fg = '#fff', font = 'Fredoka', weight = 700, size = 78 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  g.fillStyle = fg; g.font = `${weight} ${size}px ${font}, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// ---------- pop-in: everything springs up out of the felt during the intro ----------
export const pops = [];
export function pop(obj, at) { obj.userData.base = obj.scale.clone(); obj.scale.setScalar(0.0001); pops.push({ obj, at, sfx: false }); return obj; }
export const spring = (t) => (t <= 0 ? 0.0001 : 1 - Math.exp(-5.5 * t) * Math.cos(11 * t));
export function rod(a, b, r, mat, parent) { // thin cylinder from point a to point b
  const d = b.clone().sub(a), m = mesh(new THREE.CylinderGeometry(r, r, d.length(), 8), mat, 0, 0, 0, parent, false);
  m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new V3(0, 1, 0), d.normalize()); return m;
}
export const tickers = []; // per-frame animations: fn(t, dt)
