// The world's props: the two felt islands, the rope bridge, one building per job,
// the pond, trees and flowers, clouds and butterflies. Positions come from layout.js.
import * as THREE from 'three';
import { V2, V3, PI, TAU, R, rr, tex, felt, plastic, glow, thread, mesh, pillowCyl, softBox, softPrism, stitches, ring, labelTexture, rod, pop, tickers } from './felt.js';
import { ISLANDS, BRIDGE, BRIDGE_SAG, SITES, PATHS, SPAWN, SCOUT, POND, regionAt } from './layout.js';

// a felt sign board with printed lettering
function sign(text, parent, { w = 1.6, h = 0.42, x = 0, y = 2, z = 1, bg = '#f4e2c2', fg = '#4a3428', size = 70, glowK = 0 } = {}) {
  const board = new THREE.Group(); board.position.set(x, y, z); parent.add(board);
  mesh(softBox(w, h, 0.08, 0.04), felt(bg, { rep: 1 }), 0, 0, 0, board);
  const mat = glowK
    ? new THREE.MeshStandardMaterial({ color: '#000', emissive: '#fff', emissiveMap: labelTexture(text, { bg, fg, size }), emissiveIntensity: glowK })
    : new THREE.MeshStandardMaterial({ map: labelTexture(text, { fg, size }), transparent: true, roughness: 1 });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.92, h * 0.8), mat); p.position.z = 0.045; board.add(p);
  return board;
}

function buildArcade() {
  const g = new THREE.Group();
  mesh(softBox(3, 3.3, 2.2, 0.38), felt('#6050d6', { rep: 3 }), 0, 1.65, 0, g);
  mesh(softBox(3.35, 0.95, 2.55, 0.3), felt('#3d3196', { rep: 3 }), 0, 3.55, 0.1, g);
  // marquee sign
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 0.62), new THREE.MeshStandardMaterial({ color: '#000', emissive: '#ffffff', emissiveMap: labelTexture('CODEWISP', { bg: '#1c1450', fg: '#9fe7ff' }), emissiveIntensity: 1.8 }));
  sign.position.set(0, 3.55, 1.39); g.add(sign);
  // screen with a tiny game playing on it
  mesh(softBox(2.3, 1.55, 0.25, 0.1), plastic('#16132a', 0.4), 0, 2.3, 1.05, g);
  const sc = document.createElement('canvas'); sc.width = 96; sc.height = 64;
  const st = new THREE.CanvasTexture(sc); st.magFilter = THREE.NearestFilter; st.minFilter = THREE.NearestFilter; st.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.05, 1.32), new THREE.MeshStandardMaterial({ color: '#000', emissive: '#fff', emissiveMap: st, emissiveIntensity: 1.6 }));
  screen.position.set(0, 2.3, 1.19); g.add(screen);
  const sg = sc.getContext('2d'); let jy = 0, jv = 0, bx = 96, score = 0, acc = 0;
  tickers.push((t, dt) => {
    acc += dt; if (acc < 0.06) return; acc = 0;
    bx -= 3; if (bx < -8) { bx = 96 + Math.random() * 40; score++; }
    if (jy === 0 && bx < 34 && bx > 22) jv = 4.2; jy = Math.max(0, jy + jv); jv -= 0.7;
    sg.fillStyle = '#0d0b26'; sg.fillRect(0, 0, 96, 64);
    sg.fillStyle = '#2a2470'; for (let i = 0; i < 8; i++) sg.fillRect((i * 17 - t * 20) % 110, 20 + (i % 3) * 8, 2, 2);
    sg.fillStyle = '#5fe0a0'; sg.fillRect(0, 50, 96, 14);
    sg.fillStyle = '#ffd25c'; sg.fillRect(20, 42 - jy, 8, 8);
    sg.fillStyle = '#ff6b6b'; sg.fillRect(bx, 42, 7, 8);
    sg.fillStyle = '#9fe7ff'; sg.font = '8px monospace'; sg.fillText(`SCORE ${score}`, 4, 10);
    st.needsUpdate = true;
  });
  // control deck: joystick and buttons
  const deck = mesh(softBox(2.7, 0.35, 0.95, 0.15), felt('#3d3196', { rep: 2 }), 0, 1.3, 1.35, g); deck.rotation.x = -0.3;
  const stick = new THREE.Group(); stick.position.set(-0.7, 1.5, 1.38); g.add(stick);
  mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 10), plastic('#222'), 0, 0.17, 0, stick);
  mesh(new THREE.SphereGeometry(0.14, 24, 16), plastic('#ef4a4a'), 0, 0.38, 0, stick);
  ['#ffd25c', '#5fd0ff', '#7be07b'].forEach((c, i) => mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 20), plastic(c), 0.1 + i * 0.32, 1.5, 1.36 + (i % 2) * 0.08, g).rotation.x = -0.3);
  tickers.push((t) => { stick.rotation.z = Math.sin(t * 3.1) * 0.25; stick.rotation.x = Math.cos(t * 2.3) * 0.2; });
  stitches([new V3(-1.32, 0.35, 1.11), new V3(-1.32, 2.95, 1.11)], g); stitches([new V3(1.32, 0.35, 1.11), new V3(1.32, 2.95, 1.11)], g);
  // antenna with a blinking bulb
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8), plastic('#cfcfe0'), 1.1, 4.4, 0, g);
  const bulb = mesh(new THREE.SphereGeometry(0.1, 16, 12), glow('#ff5a5a', 4), 1.1, 4.9, 0, g, false);
  tickers.push((t) => { bulb.material.emissiveIntensity = (t % 1.4) < 0.7 ? 5 : 0.3; });
  // the wisp: a little blue spirit that circles the roof
  const wisp = new THREE.Group(); g.add(wisp);
  const head = mesh(new THREE.SphereGeometry(0.22, 24, 16), glow('#7fd8ff', 5), 0, 0, 0, wisp, false);
  const tail = [0.16, 0.12, 0.08].map((r) => mesh(new THREE.SphereGeometry(r, 16, 12), glow('#7fd8ff', 3.5), 0, 0, 0, g, false));
  const wl = new THREE.PointLight('#7fd8ff', 4, 6, 1.6); wisp.add(wl);
  const trail = [];
  tickers.push((t) => {
    wisp.position.set(Math.cos(t * 0.9) * 1.3, 4.9 + Math.sin(t * 2.1) * 0.25, Math.sin(t * 0.9) * 0.9);
    trail.unshift(wisp.position.clone()); if (trail.length > 24) trail.pop();
    tail.forEach((m, i) => { const p = trail[Math.min(trail.length - 1, (i + 1) * 6)]; if (p) m.position.copy(p); });
    head.scale.setScalar(1 + Math.sin(t * 6) * 0.08);
  });
  return { g, depth: 2.2, height: 4.4 };
}function buildTower() {
  const g = new THREE.Group();
  const tiers = [[1.5, 1.6, '#e98a3c'], [1.2, 1.3, '#f4e2c2'], [0.95, 1.1, '#e98a3c']];
  let y = 0;
  tiers.forEach(([r, h, c], i) => {
    mesh(pillowCyl(r, h, 0.22, 48), felt(c, { rep: 3 }), 0, y, 0, g);
    stitches(ring(r - 0.02, y + 0.12, 40), g); stitches(ring(r - 0.02, y + h - 0.12, 40), g);
    for (let k = -1; k <= 1; k++) { // glowing windows facing the path
      const a = k * 0.6, wx = Math.sin(a) * (r - 0.02), wz = Math.cos(a) * (r - 0.02);
      const win = mesh(softBox(0.28, 0.4, 0.1, 0.05), glow('#ffcf7a', 1.4), wx, y + h * 0.55, wz, g, false); win.rotation.y = a;
      if (i === 0 && k === 0) win.visible = false;
    }
    y += h;
  });
  mesh(new THREE.SphereGeometry(1.0, 32, 16, 0, TAU, 0, PI / 2), felt('#8a4422', { rep: 2 }), 0, y, 0, g);
  // the door
  mesh(softBox(0.75, 1.1, 0.25, 0.18), felt('#7a3d1d', { rep: 1 }), 0, 0.55, 1.42, g);
  mesh(new THREE.SphereGeometry(0.06, 12, 8), plastic('#f2c14e', 0.15), 0.22, 0.55, 1.56, g);
  // spinning coin on top
  const coinFace = new THREE.MeshStandardMaterial({ color: '#ffd36a', metalness: 1, roughness: 0.3, map: labelTexture('SHIB', { w: 256, h: 256, bg: '#e8b23c', fg: '#a8641c', size: 84 }) });
  const coinSide = new THREE.MeshStandardMaterial({ color: '#ffcc55', metalness: 1, roughness: 0.25 });
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.13, 48), [coinSide, coinFace, coinFace]);
  coin.rotation.x = PI / 2; const coinPivot = new THREE.Group(); coinPivot.add(coin); coinPivot.position.y = y + 1.6; g.add(coinPivot); coin.castShadow = true;
  tickers.push((t) => { coinPivot.rotation.y = t * 1.6; coinPivot.position.y = y + 1.6 + Math.sin(t * 1.8) * 0.15; });
  // a plush shiba sitting by the door, wagging
  const dog = new THREE.Group(); dog.position.set(1.15, 0, 1.45); dog.rotation.y = -0.5; g.add(dog);
  const fur = felt('#e2873a', { rep: 2 }), cream = felt('#f7e6cc', { rep: 2 });
  mesh(new THREE.SphereGeometry(0.32, 24, 16), fur, 0, 0.3, 0, dog).scale.set(1, 1.1, 1.15);
  mesh(new THREE.SphereGeometry(0.2, 20, 14), cream, 0, 0.32, 0.2, dog).scale.set(1, 1.3, 0.8);
  const dHead = new THREE.Group(); dHead.position.set(0, 0.72, 0.12); dog.add(dHead);
  mesh(new THREE.SphereGeometry(0.26, 24, 16), fur, 0, 0, 0, dHead);
  mesh(new THREE.SphereGeometry(0.13, 20, 14), cream, 0, -0.06, 0.2, dHead).scale.set(1.2, 0.9, 1);
  mesh(new THREE.SphereGeometry(0.045, 12, 8), plastic('#1a1418'), 0, -0.01, 0.33, dHead);
  for (const s of [-1, 1]) {
    mesh(new THREE.SphereGeometry(0.04, 12, 8), plastic('#1a1418'), s * 0.1, 0.07, 0.22, dHead).scale.z = 0.5;
    const ear = mesh(new THREE.ConeGeometry(0.09, 0.2, 12), fur, s * 0.15, 0.24, -0.02, dHead); ear.rotation.z = -s * 0.3;
  }
  const tailPivot = new THREE.Group(); tailPivot.position.set(0, 0.35, -0.33); dog.add(tailPivot);
  const tl = mesh(new THREE.TorusGeometry(0.13, 0.06, 10, 20, PI * 1.4), fur, 0, 0.12, 0, tailPivot); tl.rotation.y = PI / 2;
  tickers.push((t) => { tailPivot.rotation.z = Math.sin(t * 12) * 0.5; dHead.rotation.z = Math.sin(t * 1.3) * 0.12; dHead.rotation.y = Math.sin(t * 0.7) * 0.25; });
  return { g, depth: 3, height: 6.2 };
}function buildTheater() {
  const g = new THREE.Group();
  mesh(softBox(4.2, 3, 2.6, 0.35), felt('#bf3b3f', { rep: 3 }), 0, 1.5, 0, g);
  mesh(softPrism(4.4, 1.3, 2.3), felt('#f4e2c2', { rep: 3 }), 0, 3.05, 0, g);
  stitches([new V3(-2.08, 0.3, 1.31), new V3(-2.08, 2.75, 1.31), new V3(2.08, 2.75, 1.31), new V3(2.08, 0.3, 1.31)], g);
  for (const cx of [-1.6, -0.95, 0.95, 1.6]) mesh(pillowCyl(0.17, 1.85, 0.08, 20), felt('#f4e2c2', { rep: 1 }), cx, 0, 1.45, g);
  // velvet curtains in the doorway
  for (const s of [-1, 1]) {
    const c = mesh(softBox(0.55, 1.7, 0.12, 0.06), felt('#7c1626', { rep: 2, velvet: true }), s * 0.33, 0.85, 1.34, g);
    c.rotation.z = s * 0.05;
  }
  mesh(softBox(1.5, 0.22, 0.2, 0.08), felt('#e2b553', { rep: 1 }), 0, 1.8, 1.36, g);
  // marquee with chasing bulbs
  const board = mesh(softBox(3.3, 0.85, 0.25, 0.1), felt('#22243f', { rep: 1 }), 0, 2.35, 1.42, g);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.6), new THREE.MeshStandardMaterial({ color: '#000', emissive: '#fff', emissiveMap: labelTexture('ENDEAVOR', { bg: '#22243f', fg: '#ffd98a' }), emissiveIntensity: 1.6 }));
  sign.position.set(0, 2.35, 1.56); g.add(sign);
  const bulbs = [];
  for (let i = 0; i < 22; i++) {
    const u = i / 22, perim = u * 2 * (3.3 + 0.85); let bx, by;
    if (perim < 3.3) { bx = -1.65 + perim; by = 0.42; } else if (perim < 4.15) { bx = 1.65; by = 0.42 - (perim - 3.3); } else if (perim < 7.45) { bx = 1.65 - (perim - 4.15); by = -0.43; } else { bx = -1.65; by = -0.43 + (perim - 7.45); }
    bulbs.push(mesh(new THREE.SphereGeometry(0.05, 10, 8), glow('#ffd98a', 3), bx, 2.35 + by, 1.57, g, false));
  }
  tickers.push((t) => bulbs.forEach((b, i) => { b.material.emissiveIntensity = ((i + Math.floor(t * 8)) % 3 === 0) ? 6 : 0.6; }));
  // two searchlight beams sweeping the sky
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(s * 1.7, 3.0, 0.4); g.add(pivot);
    mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.3, 16), plastic('#2a2a35'), 0, 0, 0, pivot);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(0.9, 7, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#fff1c9', transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = 3.5; beam.rotation.x = PI; pivot.add(beam);
    tickers.push((t) => { pivot.rotation.z = Math.sin(t * 0.7 + (s > 0 ? 1.4 : 0)) * 0.5 - s * 0.15; pivot.rotation.x = -0.25 + Math.cos(t * 0.5 + s) * 0.15; });
  }
  return { g, depth: 2.6, height: 4.4 };
}let fireLight = null;
const sparks = [];
function buildCamp() {
  const g = new THREE.Group();
  const bark = felt('#7b4a2c', { rep: 2 });
  for (let i = 0; i < 3; i++) {
    const log = mesh(pillowCyl(0.14, 1.1, 0.06, 16), bark, 0, 0, 0, g);
    log.rotation.z = PI / 2 - 0.35; log.rotation.y = (i / 3) * TAU; log.position.set(Math.cos((i / 3) * TAU) * 0.15, 0.08, Math.sin((i / 3) * TAU) * 0.15);
  }
  for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU; mesh(new THREE.SphereGeometry(0.17, 16, 12), felt('#a7a3a8', { rep: 1 }), Math.cos(a) * 0.62, 0.08, Math.sin(a) * 0.62, g).scale.set(1, 0.6, 1.1); }
  const drop = (s) => new THREE.LatheGeometry([[0, 0], [0.18, 0.07], [0.27, 0.24], [0.23, 0.45], [0.13, 0.66], [0, 0.92]].map(([x, y]) => new V2(x * s, y * s)), 20);
  const flames = [[1.0, '#ff7a2e', 2.4], [0.72, '#ffb13b', 3.4], [0.45, '#fff0a0', 4.6]].map(([s, c, k]) => mesh(drop(s), glow(c, k), 0, 0.12, 0, g, false));
  fireLight = new THREE.PointLight('#ff9a48', 5, 8, 1.6); fireLight.position.set(0, 0.8, 0); g.add(fireLight);
  for (let i = 0; i < 18; i++) { const m = mesh(new THREE.SphereGeometry(0.035, 8, 6), glow('#ffc070', 6), 0, -10, 0, g, false); sparks.push({ m, life: R() * 1.4, vx: 0, vz: 0 }); }
  tickers.push((t, dt) => {
    flames.forEach((f, i) => { const k = 1 + Math.sin(t * (9 + i * 3) + i) * 0.08; f.scale.set(1 + Math.sin(t * 7 + i) * 0.06, k, 1 + Math.cos(t * 8 + i) * 0.06); f.rotation.y = t * (1 + i); f.rotation.z = Math.sin(t * 5 + i) * 0.06; });
    fireLight.intensity = 4.5 + Math.sin(t * 13) * 0.8 + Math.sin(t * 29) * 0.5;
    for (const s of sparks) {
      s.life -= dt;
      if (s.life <= 0) { s.life = rr(0.8, 1.6); s.m.position.set(rr(-0.15, 0.15), 0.5, rr(-0.15, 0.15)); s.vx = rr(-0.2, 0.2); s.vz = rr(-0.2, 0.2); }
      s.m.position.x += s.vx * dt + Math.sin(t * 4 + s.life * 9) * 0.004; s.m.position.y += dt * 1.2; s.m.position.z += s.vz * dt;
      s.m.scale.setScalar(Math.max(0.01, s.life / 1.6));
    }
  });
  // tent
  const tent = mesh(softPrism(1.9, 1.5, 2.1), felt('#e9d7b4', { rep: 2 }), -1.4, 0, -1.9, g); tent.rotation.y = 0.5;
  const flap = mesh(softPrism(0.8, 0.9, 0.05), felt('#5a4a3c', { rep: 1 }), -1.4 + Math.sin(0.5) * 1.15, 0.02, -1.9 + Math.cos(0.5) * 1.15, g); flap.rotation.y = 0.5;
  // bunting between tent peak and a pole
  const pole = new V3(1.5, 1.8, -1.6), peak = new V3(-1.4, 1.62, -1.9);
  mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.8, 8), bark, pole.x, 0.9, pole.z, g);
  const sag = new THREE.QuadraticBezierCurve3(peak, new V3(0.05, 1.05, -1.75), pole);
  mesh(new THREE.TubeGeometry(sag, 20, 0.012, 5), thread, 0, 0, 0, g, false);
  const flagGeo = new THREE.BufferGeometry().setFromPoints([new V3(-0.11, 0, 0), new V3(0.11, 0, 0), new V3(0, -0.24, 0)]); flagGeo.computeVertexNormals();
  const flags = [];
  ['#e8604c', '#f2c14e', '#5fb38a', '#5f9de0', '#e8604c', '#f2c14e', '#5fb38a'].forEach((c, i) => {
    const p = sag.getPoint((i + 1) / 8);
    const f = mesh(flagGeo, new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.9, sheen: 1, side: THREE.DoubleSide }), p.x, p.y, p.z, g); flags.push(f);
  });
  tickers.push((t) => flags.forEach((f, i) => { f.rotation.x = Math.sin(t * 2.4 + i) * 0.35; }));
  // a felt sign
  const post = new THREE.Group(); post.position.set(1.2, 0, 0.8); post.rotation.y = -0.5; g.add(post);
  mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.1, 8), bark, 0, 0.55, 0, post);
  mesh(softBox(1.25, 0.5, 0.1, 0.06), felt('#f4e2c2', { rep: 1 }), 0, 1.05, 0.03, post);
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.35), new THREE.MeshStandardMaterial({ map: labelTexture('JOIN THE PARTY', { fg: '#7b4a2c', size: 62 }), transparent: true, roughness: 1 }));
  lbl.position.set(0, 1.05, 0.09); post.add(lbl);
  return { g, depth: 0.8, height: 2.4 };
}
// Arch Systems, Mental Health Foundation: a sage cottage with a beating felt heart and a little live chart
function buildCottage() {
  const g = new THREE.Group();
  mesh(softBox(3.0, 2.2, 2.4, 0.32), felt('#9fc7b8', { rep: 3 }), 0, 1.1, 0, g);
  mesh(softPrism(3.3, 1.3, 2.5), felt('#e9897b', { rep: 3 }), 0, 2.15, 0, g);
  stitches([new V3(-1.47, 0.3, 1.21), new V3(-1.47, 1.95, 1.21)], g); stitches([new V3(1.47, 0.3, 1.21), new V3(1.47, 1.95, 1.21)], g);
  mesh(softBox(0.7, 1.1, 0.2, 0.15), felt('#5d7a8c', { rep: 1 }), 0, 0.55, 1.22, g);
  mesh(new THREE.SphereGeometry(0.05, 10, 8), plastic('#f2c14e', 0.15), 0.2, 0.55, 1.34, g);
  for (const s of [-1, 1]) mesh(softBox(0.5, 0.5, 0.1, 0.06), glow('#ffd98a', 1.3), s * 0.95, 1.3, 1.21, g, false);
  sign('ARCH · MHF', g, { w: 1.5, h: 0.36, y: 1.82, z: 1.27, size: 62 });
  const heart = new THREE.Group(); heart.position.set(0.85, 3.25, 0.2); g.add(heart);
  const red = felt('#e0484f', { rep: 1 });
  for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.22, 20, 14), red, s * 0.14, 0.08, 0, heart);
  const tip = mesh(new THREE.ConeGeometry(0.31, 0.46, 20), red, 0, -0.18, 0, heart); tip.rotation.z = PI;
  // a small easel with three bars that rise and fall: the dashboards
  const easel = new THREE.Group(); easel.position.set(1.95, 0, 1.0); easel.rotation.y = -0.5; g.add(easel);
  mesh(softBox(0.85, 0.65, 0.06, 0.03), felt('#fbf3e4', { rep: 1 }), 0, 1.0, 0, easel);
  for (const s of [-1, 1]) rod(new V3(s * 0.3, 0, 0.15), new V3(s * 0.25, 0.75, 0), 0.025, felt('#86573a', { rep: 1 }), easel);
  const bars = ['#5fb38a', '#5f9de0', '#e8604c'].map((c, i) => { const b = mesh(softBox(0.14, 0.4, 0.04, 0.02), felt(c, { rep: 1 }), -0.22 + i * 0.22, 0.75, 0.04, easel, false); b.geometry.translate(0, 0.2, 0); b.position.y = 0.75; return b; });
  tickers.push((t) => {
    const p = t % 1.2, beat = 1 + 0.13 * Math.exp(-p * 14) + (p > 0.25 ? 0.08 * Math.exp(-(p - 0.25) * 14) : 0);
    heart.scale.setScalar(beat);
    bars.forEach((b, i) => { b.scale.y = 0.45 + 0.4 * (0.5 + 0.5 * Math.sin(t * 1.3 + i * 1.7)); });
  });
  return { g, depth: 2.4, height: 4.2 };
}

// GatheredHere: a calm white garden pavilion with soft lanterns and a eucalyptus
function buildPavilion() {
  const g = new THREE.Group();
  mesh(pillowCyl(1.6, 0.22, 0.08, 40), felt('#f3ece0', { rep: 2 }), 0, 0, 0, g);
  stitches(ring(1.58, 0.11, 60), g);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + PI / 6; mesh(pillowCyl(0.1, 1.9, 0.05, 12), felt('#fbf6ee', { rep: 1 }), Math.cos(a) * 1.3, 0.2, Math.sin(a) * 1.3, g); }
  const dome = mesh(new THREE.SphereGeometry(1.65, 40, 16, 0, TAU, 0, PI / 2), felt('#cbc4e6', { rep: 3 }), 0, 2.05, 0, g); dome.scale.y = 0.55;
  mesh(new THREE.SphereGeometry(0.12, 12, 10), plastic('#e8d9a8', 0.2), 0, 2.98, 0, g);
  mesh(softBox(1.3, 0.16, 0.4, 0.06), felt('#a98a6a', { rep: 1 }), 0, 0.55, -0.3, g);
  const lanterns = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + 0.4, l = new THREE.Group(); l.position.set(Math.cos(a) * 0.8, 1.95, Math.sin(a) * 0.8); g.add(l);
    rod(new V3(0, 0, 0), new V3(0, -0.3, 0), 0.006, thread, l);
    mesh(new THREE.SphereGeometry(0.11, 14, 10), glow('#ffe0a6', 2.2), 0, -0.4, 0, l, false).scale.y = 1.25;
    lanterns.push(l);
  }
  const tree = new THREE.Group(); tree.position.set(2.1, 0, -0.6); g.add(tree);
  mesh(pillowCyl(0.12, 1.6, 0.05, 12), felt('#e8e1d6', { rep: 1 }), 0, 0, 0, tree);
  for (let k = 0; k < 4; k++) mesh(new THREE.SphereGeometry(rr(0.4, 0.55), 18, 12), felt(k % 2 ? '#9db89c' : '#87a68a', { rep: 1 }), rr(-0.35, 0.35), 1.7 + rr(0, 0.5), rr(-0.35, 0.35), tree);
  sign('GATHEREDHERE', g, { w: 1.7, h: 0.34, x: -1.25, y: 0.75, z: 1.45, size: 52 }).rotation.y = 0.35;
  rod(new V3(-1.25, 0, 1.4), new V3(-1.25, 0.58, 1.4), 0.04, felt('#86573a', { rep: 1 }), g);
  tickers.push((t) => lanterns.forEach((l, i) => { l.rotation.z = Math.sin(t * 1.4 + i) * 0.12; l.rotation.x = Math.cos(t * 1.1 + i) * 0.1; }));
  return { g, depth: 3.2, height: 3.6 };
}

// ElasticSwap: a round swap kiosk with two coins trading places above a springy antenna
function buildKiosk() {
  const g = new THREE.Group();
  mesh(pillowCyl(1.05, 1.5, 0.2, 36), felt('#5bb7c7', { rep: 2 }), 0, 0, 0, g);
  stitches(ring(1.03, 0.15, 48), g); stitches(ring(1.03, 1.35, 48), g);
  const canopy = mesh(new THREE.ConeGeometry(1.45, 0.7, 12), felt('#f2c14e', { rep: 2 }), 0, 1.85, 0, g);
  canopy.rotation.y = PI / 12;
  mesh(softBox(1.3, 0.12, 0.5, 0.05), felt('#fbf3e4', { rep: 1 }), 0, 0.95, 1.0, g);
  mesh(softBox(0.9, 0.55, 0.06, 0.05), plastic('#1c2836', 0.3), 0, 1.25, 0.98, g);
  sign('ELASTICSWAP', g, { w: 1.5, h: 0.3, y: 0.45, z: 1.08, size: 54 });
  const coinMat = (c) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.9, roughness: 0.3 });
  const pair = new THREE.Group(); pair.position.y = 3.0; g.add(pair);
  const coins = ['#f6a3c8', '#7fc8f8'].map((c, i) => { const m = mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 32), coinMat(c), (i ? 1 : -1) * 0.55, 0, 0, pair); m.rotation.x = PI / 2; return m; });
  const helix = new THREE.CatmullRomCurve3(Array.from({ length: 40 }, (_, i) => new V3(Math.cos(i * 0.9) * 0.12, i * 0.018, Math.sin(i * 0.9) * 0.12)));
  const spring = new THREE.Group(); spring.position.y = 2.1; g.add(spring);
  mesh(new THREE.TubeGeometry(helix, 120, 0.02, 6), plastic('#cfd3d8', 0.3), 0, 0, 0, spring, false);
  const ball = mesh(new THREE.SphereGeometry(0.12, 16, 12), plastic('#e8604c'), 0, 0.75, 0, spring);
  tickers.push((t) => {
    pair.rotation.y = t * 1.4; coins.forEach((c) => { c.rotation.z = t * 3; });
    const s = 1 + Math.sin(t * 5) * 0.18; spring.scale.y = s; ball.scale.y = 1 / s;
  });
  return { g, depth: 2.1, height: 3.6 };
}

// Zvoid: a plush TV studio whose screen shows growing view bars: video analytics
function buildStudio() {
  const g = new THREE.Group();
  for (const s of [-1, 1]) mesh(pillowCyl(0.12, 0.45, 0.05, 12), felt('#4a3a33', { rep: 1 }), s * 1.0, 0, 0, g);
  mesh(softBox(3.0, 2.3, 2.1, 0.45), felt('#8a6fd1', { rep: 3 }), 0, 1.6, 0, g);
  stitches([new V3(-1.4, 0.65, 1.06), new V3(1.4, 0.65, 1.06)], g);
  mesh(softBox(2.2, 1.45, 0.2, 0.18), plastic('#14121c', 0.35), 0, 1.65, 1.0, g);
  const sc = document.createElement('canvas'); sc.width = 128; sc.height = 80;
  const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 1.22), new THREE.MeshStandardMaterial({ color: '#000', emissive: '#fff', emissiveMap: st, emissiveIntensity: 1.5 }));
  screen.position.set(0, 1.65, 1.11); g.add(screen);
  const sg = sc.getContext('2d'); let acc = 0;
  tickers.push((t, dt) => {
    acc += dt; if (acc < 0.08) return; acc = 0;
    sg.fillStyle = '#16122a'; sg.fillRect(0, 0, 128, 80);
    sg.fillStyle = '#b9a3f6'; sg.font = '9px monospace'; sg.fillText('VIEWS', 6, 12);
    for (let i = 0; i < 7; i++) {
      const h = 10 + (i * 6) + Math.sin(t * 2 + i) * 4 + (i === 6 ? Math.sin(t * 6) * 3 : 0);
      sg.fillStyle = i === 6 ? '#ffd25c' : '#7fd8a8'; sg.fillRect(8 + i * 16, 72 - h, 10, h);
    }
    sg.fillStyle = '#fff'; sg.beginPath(); sg.moveTo(104, 10); sg.lineTo(116, 16); sg.lineTo(104, 22); sg.closePath(); sg.fill();
    st.needsUpdate = true;
  });
  for (const s of [-1, 1]) { rod(new V3(s * 0.25, 2.7, 0), new V3(s * 0.85, 3.6, 0), 0.025, plastic('#cfd3d8', 0.3), g); mesh(new THREE.SphereGeometry(0.08, 12, 10), plastic(s > 0 ? '#e8604c' : '#f2c14e'), s * 0.85, 3.62, 0, g); }
  sign('ZVOID', g, { w: 1.1, h: 0.34, y: 0.5, z: 1.1, size: 70 });
  return { g, depth: 2.1, height: 3.8 };
}

// Koji: a giant toy box whose lid pops and a star springs out: templates and mini-games
function buildToybox() {
  const g = new THREE.Group();
  mesh(softBox(2.2, 1.9, 2.2, 0.25), felt('#f2c14e', { rep: 3 }), 0, 0.95, 0, g);
  const ribbon = felt('#e86a9a', { rep: 1 });
  mesh(softBox(0.32, 1.92, 2.24, 0.05), ribbon, 0, 0.95, 0, g); mesh(softBox(2.24, 1.92, 0.32, 0.05), ribbon, 0, 0.95, 0, g);
  const hinge = new THREE.Group(); hinge.position.set(0, 1.9, -1.1); g.add(hinge);
  const lid = mesh(softBox(2.35, 0.32, 2.35, 0.12), felt('#f7d36a', { rep: 2 }), 0, 0.12, 1.1, hinge);
  mesh(softBox(0.34, 0.34, 2.38, 0.06), ribbon, 0, 0.12, 1.1, hinge);
  for (const s of [-1, 1]) { const loop = mesh(new THREE.TorusGeometry(0.22, 0.08, 10, 20), ribbon, s * 0.22, 0.42, 1.1, hinge); loop.rotation.y = PI / 2; loop.rotation.x = s * 0.4; }
  const shape = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.18 : 0.42, a = (i / 10) * TAU + PI / 2; i ? shape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : shape.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const starGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 }); starGeo.center();
  const star = mesh(starGeo, glow('#ffe27a', 2.4), 0, 1.4, 0, g, false);
  sign('KOJI', g, { w: 1.0, h: 0.34, y: 0.5, z: 1.15, size: 72, bg: '#fbf3e4' });
  tickers.push((t) => {
    const c = t % 4.5, open = c < 1.8 ? Math.min(1, c / 0.25) * (c > 1.5 ? (1.8 - c) / 0.3 : 1) : 0;
    hinge.rotation.x = -open * 1.25;
    const up = c < 1.8 ? Math.sin(Math.min(1, c / 0.6) * PI / 2) * open : 0;
    star.position.y = 1.4 + up * 1.8 + Math.sin(t * 8) * 0.04 * up; star.rotation.y = t * 3; star.scale.setScalar(0.2 + up * 0.8);
  });
  return { g, depth: 2.3, height: 3.6 };
}

// Aftertutor and Bewakoof: a little shop with a striped awning, parcels and an app phone sign
function buildShop() {
  const g = new THREE.Group();
  mesh(softBox(3.2, 2.4, 2.2, 0.3), felt('#cfe0f2', { rep: 3 }), 0, 1.2, 0, g);
  mesh(softBox(3.4, 0.3, 2.4, 0.12), felt('#5d6f9a', { rep: 2 }), 0, 2.55, 0, g);
  for (let i = 0; i < 7; i++) { const st = mesh(softBox(0.46, 0.06, 0.8, 0.03), felt(i % 2 ? '#fbf3e4' : '#e8604c', { rep: 1 }), -1.38 + i * 0.46, 2.05, 1.35, g); st.rotation.x = 0.45; }
  mesh(softBox(1.6, 1.0, 0.1, 0.08), glow('#ffe9b8', 1.0), -0.55, 1.15, 1.11, g, false);
  ['#e8604c', '#5fb38a', '#f2c14e'].forEach((c, i) => { // tiny tees in the window
    const tee = new THREE.Group(); tee.position.set(-1.0 + i * 0.45, 1.15, 1.18); g.add(tee);
    mesh(softBox(0.24, 0.28, 0.03, 0.02), felt(c, { rep: 1 }), 0, 0, 0, tee, false); mesh(softBox(0.4, 0.09, 0.03, 0.02), felt(c, { rep: 1 }), 0, 0.1, 0, tee, false);
  });
  mesh(softBox(0.7, 1.2, 0.2, 0.14), felt('#7a5a48', { rep: 1 }), 0.95, 0.6, 1.12, g);
  sign('AFTERTUTOR', g, { w: 1.6, h: 0.34, y: 2.55, z: 1.22, size: 56, bg: '#5d6f9a', fg: '#fbf3e4' });
  for (let i = 0; i < 4; i++) { const b = mesh(softBox(rr(0.4, 0.55), rr(0.3, 0.45), rr(0.4, 0.5), 0.05), felt('#c79a6a', { rep: 1 }), 2.0 + (i % 2) * 0.35, 0.2 + Math.floor(i / 2) * 0.42, 0.6 - (i % 2) * 0.2, g); b.rotation.y = rr(-0.3, 0.3); }
  const phone = new THREE.Group(); phone.position.set(-2.05, 0, 0.9); phone.rotation.y = 0.4; g.add(phone);
  rod(new V3(0, 0, 0), new V3(0, 0.6, 0), 0.04, felt('#86573a', { rep: 1 }), phone);
  mesh(softBox(0.55, 0.95, 0.1, 0.1), plastic('#1c1c22', 0.25), 0, 1.05, 0, phone);
  const appScreen = mesh(softBox(0.45, 0.8, 0.02, 0.06), glow('#7fc8f8', 1.2), 0, 1.06, 0.055, phone, false);
  tickers.push((t) => { appScreen.material.emissiveIntensity = 1.0 + Math.sin(t * 2.2) * 0.35; phone.rotation.z = Math.sin(t * 1.3) * 0.03; });
  return { g, depth: 2.2, height: 3.4 };
}

const BUILDERS = { arcade: buildArcade, tower: buildTower, theater: buildTheater, camp: buildCamp, cottage: buildCottage, pavilion: buildPavilion, kiosk: buildKiosk, studio: buildStudio, toybox: buildToybox, shop: buildShop };
/** One building on its own, for the case-page vignette: { g, depth, height }. */
export const buildBuilding = (kind) => BUILDERS[kind]();
const SHORT = { koji: 'Gometa (Koji)', 'arch-mhf': 'Mental Health Foundation', aftertutor: 'Aftertutor · Bewakoof', openspeaker: 'Endeavor (OpenSpeaker)' };
const RECRUIT_CARD = { kind: 'Recruit', title: 'Recruit Harman', role: 'Applied AI and full-stack engineer · Chandigarh, remote',
  items: ['13+ years of production work across AI, crypto, enterprise, healthcare and e-commerce.', 'Starts now. Full-time with the right team; short contracts meanwhile.'], recruit: true };

function buildIsland(isl, world) {
  const k = isl.r / 12.9, ky = Math.min(1, 0.55 + k * 0.45);
  const g = new THREE.Group(); g.position.set(isl.x, 0, isl.z); world.add(g);
  const soil = new THREE.LatheGeometry([[0, -6.8], [2.2, -6.3], [5, -5.2], [8.4, -3.8], [11.2, -2.5], [12.6, -1.5], [12.95, -0.8]].map(([x, y]) => new V2(x * k, y * ky)), 96);
  const p = soil.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); if (y < -1) { const a = Math.atan2(z, x), q = 1 + 0.07 * Math.sin(a * 5 + y * 1.3) + 0.04 * Math.sin(a * 11 - y); p.setX(i, x * q); p.setZ(i, z * q); } }
  soil.computeVertexNormals();
  mesh(soil, felt('#a8674a', { rep: 6 }), 0, 0, 0, g);
  mesh(new THREE.LatheGeometry([[12.95, -0.8 * ky], [12.9, -0.45 * ky], [12.55, -0.14], [11.9, 0], [0, 0]].map(([x, y]) => new V2(x * k, y)), 96), felt('#8fbf6a', { rep: Math.round(14 * k) }), 0, 0, 0, g);
  stitches(ring(12.93 * k, -0.78 * ky, 160), g, 0.2);
  stitches(ring(12.6 * k, -0.14, 160), g, 0.2);
  for (let i = 0; i < 7; i++) { const a = R() * TAU, r = rr(3, 10) * k; mesh(new THREE.SphereGeometry(rr(0.4, 0.9), 20, 14), felt(R() < 0.5 ? '#8c5a43' : '#b98466', { rep: 2 }), Math.cos(a) * r, -rr(3.5, 6) * ky, Math.sin(a) * r, g).scale.y = 0.75; }
  for (let i = 0; i < 6; i++) {
    const a = R() * TAU, r = rr(2, 8) * k, x = Math.cos(a) * r, z = Math.sin(a) * r, top = (-4.5 - (8 - r) * 0.25) * ky;
    const curve = new THREE.CatmullRomCurve3([new V3(x, top + 0.5, z), new V3(x + rr(-0.4, 0.4), top - 1, z + rr(-0.4, 0.4)), new V3(x + rr(-0.6, 0.6), top - 2.2, z + rr(-0.6, 0.6))]);
    mesh(new THREE.TubeGeometry(curve, 16, 0.07, 6), felt('#6e8f4e', { rep: 1 }), 0, 0, 0, g);
  }
}

// a felt rope bridge: soft planks on a sagging line, rope rails and posts at both ends
function buildBridge(world) {
  const a = new V3(BRIDGE.a.x, 0, BRIDGE.a.z), b = new V3(BRIDGE.b.x, 0, BRIDGE.b.z);
  const dir = b.clone().sub(a), len = dir.length(); dir.normalize();
  const side = new V3(-dir.z, 0, dir.x), yaw = Math.atan2(dir.x, dir.z);
  const n = Math.floor(len / 0.42), geo = new THREE.BoxGeometry(1.5, 0.08, 0.34);
  const planks = new THREE.InstancedMesh(geo, felt('#b8865a', { rep: 1 }), n); planks.castShadow = true; planks.receiveShadow = true;
  const o = new THREE.Object3D(), tones = ['#b8865a', '#a77a50', '#c69468'];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n; o.position.copy(a).addScaledVector(dir, t * len); o.position.y = -BRIDGE_SAG * Math.sin(PI * t) - 0.04;
    o.rotation.set(0, yaw, 0); o.rotateZ(rr(-0.03, 0.03)); o.rotateY(rr(-0.06, 0.06)); o.updateMatrix(); planks.setMatrixAt(i, o.matrix); planks.setColorAt(i, new THREE.Color(tones[i % 3]));
  }
  planks.material = felt('#ffffff', { rep: 1 }); world.add(planks);
  const rope = felt('#e9d7b4', { rep: 1 }), wood = felt('#86573a', { rep: 1 });
  for (const s of [-1, 1]) {
    const pts = Array.from({ length: 13 }, (_, i) => { const t = i / 12; return a.clone().addScaledVector(dir, t * len).addScaledVector(side, s * 0.78).setY(0.95 - BRIDGE_SAG * 1.1 * Math.sin(PI * t)); });
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.035, 6), rope, 0, 0, 0, world);
    for (const [end, back] of [[a, -1], [b, 1]]) mesh(pillowCyl(0.09, 1.15, 0.05, 12), wood, end.x + side.x * s * 0.78 + dir.x * back * 0.1, -0.1, end.z + side.z * s * 0.78 + dir.z * back * 0.1, world);
    for (let i = 1; i < 12; i++) { const p = pts[i], q = a.clone().addScaledVector(dir, (i / 12) * len).addScaledVector(side, s * 0.75); q.y = -BRIDGE_SAG * Math.sin(PI * i / 12); rod(q, p, 0.012, rope, world); }
  }
}

function buildPaths(world) {
  const geo = pillowCyl(0.42, 0.07, 0.03, 20), mat = felt('#ffffff', { rep: 1 }), all = [];
  for (const pts of Object.values(PATHS)) all.push(...new THREE.CatmullRomCurve3(pts.map((p) => new V3(p.x, 0, p.z)), true).getSpacedPoints(Math.round(pts.length * 5.5)));
  const im = new THREE.InstancedMesh(geo, mat, all.length); im.receiveShadow = true;
  const o = new THREE.Object3D(), tones = ['#e9cfa6', '#dcbb8c', '#f0dcb8'];
  all.forEach((p, i) => {
    o.position.set(p.x + rr(-0.12, 0.12), 0, p.z + rr(-0.12, 0.12)); o.rotation.y = R() * TAU; const s = rr(0.8, 1.15); o.scale.set(s, 1, s * rr(0.75, 1));
    o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, new THREE.Color(tones[i % 3]));
  });
  world.add(im);
  return all;
}

function buildPond(world) {
  const pond = new THREE.Group(); pond.position.set(POND.x, 0, POND.z); world.add(pond);
  const water = mesh(new THREE.CircleGeometry(1.55, 48), new THREE.MeshPhysicalMaterial({ color: '#5aa6c8', roughness: 0.08, clearcoat: 1 }), 0, 0.035, 0, pond, false);
  water.rotation.x = -PI / 2;
  for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU + rr(-0.1, 0.1); mesh(new THREE.SphereGeometry(rr(0.2, 0.28), 16, 12), felt(R() < 0.5 ? '#b8b2b6' : '#9e98a0', { rep: 1 }), Math.cos(a) * 1.65, 0.06, Math.sin(a) * 1.65, pond).scale.y = 0.55; }
  const duck = new THREE.Group(); pond.add(duck);
  mesh(new THREE.SphereGeometry(0.2, 20, 14), felt('#f7cf3d', { rep: 1 }), 0, 0.15, 0, duck).scale.set(1, 0.75, 1.3);
  mesh(new THREE.SphereGeometry(0.13, 20, 14), felt('#f7cf3d', { rep: 1 }), 0, 0.33, 0.14, duck);
  mesh(new THREE.ConeGeometry(0.06, 0.12, 12), felt('#f08a2c', { rep: 1 }), 0, 0.31, 0.29, duck).rotation.x = PI / 2;
  for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.025, 8, 6), plastic('#111'), s * 0.065, 0.37, 0.24, duck);
  tickers.push((t) => { const a = t * 0.35; duck.position.set(Math.cos(a) * 0.8, Math.sin(t * 2.2) * 0.02, Math.sin(a) * 0.8); duck.rotation.y = -a; duck.rotation.z = Math.sin(t * 2.2) * 0.08; });
  pop(pond, 1.2);
}

function scatter(world, pathPts, colliders, landmarks) {
  const camp = landmarks.find((l) => l.id === 'camp');
  const clearOf = (x, z, isl, pathGap, bGap) => {
    if (regionAt(x, z) !== isl.id || Math.hypot(x - isl.x, z - isl.z) > isl.walk + 0.3) return false;
    for (const p of pathPts) if ((p.x - x) ** 2 + (p.z - z) ** 2 < pathGap * pathGap) return false;
    for (const c of colliders) if (Math.hypot(c.c.x - x, c.c.z - z) < c.r + bGap) return false;
    if (Math.hypot(camp.center.x - x, camp.center.z - z) < 3.4) return false;
    for (const q of [SPAWN, SCOUT, BRIDGE.a, BRIDGE.b]) if (Math.hypot(q.x - x, q.z - z) < 1.7) return false;
    return true;
  };
  const sway = [], trees = [], greens = ['#5f9e57', '#76b05e', '#4e8a4f', '#8cc06a'], petals = ['#f6a3b8', '#ffffff', '#f2c14e', '#b9a3f6', '#e8604c'];
  const rand = (isl, spread = 1) => { const a = R() * TAU, r = Math.sqrt(R()) * isl.walk * spread; return [isl.x + Math.cos(a) * r, isl.z + Math.sin(a) * r]; };
  const delay = (x, z, isl, k) => k + Math.hypot(x - isl.x, z - isl.z) * 0.06 + R() * 0.2;
  for (const isl of ISLANDS) {
    const placed = [], want = isl.id === 'main' ? 24 : 18;
    for (let tries = 0; placed.length < want && tries < 3000; tries++) {
      const [x, z] = rand(isl);
      if (!clearOf(x, z, isl, 1.4, 1.3) || placed.some((p) => Math.hypot(p.x - x, p.z - z) < 1.5)) continue;
      placed.push({ x, z });
      const t = new THREE.Group(); t.position.set(x, 0, z); world.add(t);
      const s = rr(0.8, 1.25);
      mesh(pillowCyl(0.13 * s, 0.9 * s, 0.05, 12), felt('#86573a', { rep: 1 }), 0, 0, 0, t);
      const crown = new THREE.Group(); crown.position.y = 0.8 * s; t.add(crown);
      if (R() < 0.5) {
        for (let k = 0; k < 3; k++) mesh(new THREE.ConeGeometry((0.85 - k * 0.2) * s, 0.9 * s, 20), felt(greens[(k + placed.length) % 4], { rep: 2 }), 0, k * 0.5 * s + 0.3 * s, 0, crown);
      } else {
        mesh(new THREE.SphereGeometry(0.75 * s, 24, 16), felt(greens[placed.length % 4], { rep: 2 }), 0, 0.55 * s, 0, crown);
        for (let k = 0; k < 3; k++) { const b = R() * TAU; mesh(new THREE.SphereGeometry(0.42 * s, 20, 14), felt(greens[(placed.length + k + 1) % 4], { rep: 2 }), Math.cos(b) * 0.5 * s, 0.4 * s + R() * 0.4 * s, Math.sin(b) * 0.5 * s, crown); }
        if (R() < 0.5) for (let k = 0; k < 4; k++) { const b = R() * TAU, h = R() * 0.6; mesh(new THREE.SphereGeometry(0.07, 10, 8), felt('#e8604c', { rep: 1 }), Math.cos(b) * 0.7 * s, (0.5 + h) * s, Math.sin(b) * 0.7 * s, crown, false); }
      }
      colliders.push({ c: new V3(x, 0, z), r: 0.45 });
      sway.push({ g: crown, p: R() * TAU });
      t.userData.squish = 1; trees.push(t);
      pop(t, delay(x, z, isl, 0.5));
    }
    for (let i = 0, n = 0; n < (isl.id === 'main' ? 12 : 9) && i < 2000; i++) {
      const [x, z] = rand(isl);
      if (!clearOf(x, z, isl, 1.0, 0.6)) continue; n++;
      const b = new THREE.Group(); b.position.set(x, 0, z); world.add(b);
      for (let k = 0; k < 3; k++) mesh(new THREE.SphereGeometry(rr(0.25, 0.4), 18, 12), felt(greens[(k + n) % 4], { rep: 1 }), rr(-0.3, 0.3), 0.18, rr(-0.3, 0.3), b).scale.y = 0.8;
      pop(b, delay(x, z, isl, 0.7));
    }
    // pom-pom flowers: three instanced meshes per island instead of three meshes per flower
    const fl = [];
    for (let i = 0; fl.length < (isl.id === 'main' ? 55 : 40) && i < 4000; i++) {
      const [x, z] = rand(isl, 1.04);
      if (clearOf(x, z, isl, 0.7, 0.3)) fl.push({ x: x - isl.x, z: z - isl.z, h: rr(0.18, 0.4) });
    }
    const bed = new THREE.Group(); bed.position.set(isl.x, 0, isl.z); world.add(bed);
    const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.015, 0.015, 1, 5), felt('#4e8a4f', { rep: 1 }), fl.length);
    const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 12, 8), felt('#ffffff', { rep: 1 }), fl.length);
    const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 8, 6), plastic('#f2c14e'), fl.length);
    const o = new THREE.Object3D();
    fl.forEach((f, i) => {
      o.position.set(f.x, f.h / 2, f.z); o.scale.set(1, f.h, 1); o.updateMatrix(); stems.setMatrixAt(i, o.matrix);
      o.position.y = f.h; o.scale.set(1, 0.6, 1); o.updateMatrix(); heads.setMatrixAt(i, o.matrix); heads.setColorAt(i, new THREE.Color(petals[i % 5]));
      o.position.y = f.h + 0.04; o.scale.set(1, 1, 1); o.updateMatrix(); dots.setMatrixAt(i, o.matrix);
    });
    for (const m of [stems, heads, dots]) { m.receiveShadow = true; bed.add(m); }
    pop(bed, isl.id === 'main' ? 1.0 : 1.3);
    for (let i = 0, n = 0; n < 4 && i < 2000; i++) {
      const [x, z] = rand(isl);
      if (!clearOf(x, z, isl, 0.9, 0.5)) continue; n++;
      const m = new THREE.Group(); m.position.set(x, 0, z); world.add(m);
      mesh(pillowCyl(0.08, 0.3, 0.04, 12), felt('#f7ecd9', { rep: 1 }), 0, 0, 0, m);
      mesh(new THREE.SphereGeometry(0.26, 24, 12, 0, TAU, 0, PI / 2), felt('#d8443c', { rep: 1 }), 0, 0.27, 0, m);
      for (let k = 0; k < 6; k++) { const b = (k / 6) * TAU; mesh(new THREE.SphereGeometry(0.04, 8, 6), felt('#ffffff', { rep: 1 }), Math.cos(b) * 0.17, 0.43, Math.sin(b) * 0.17, m, false).scale.y = 0.4; }
      pop(m, delay(x, z, isl, 1.0));
    }
  }
  tickers.push((t) => sway.forEach((s) => { s.g.rotation.z = Math.sin(t * 1.1 + s.p) * 0.035; s.g.rotation.x = Math.cos(t * 0.9 + s.p) * 0.03; }));
  return trees;
}

function buildSky(scene) {
  const clouds = [], C = { x: 16, z: -2 };
  for (let i = 0; i < 12; i++) {
    const c = new THREE.Group(), a = (i / 12) * TAU + rr(-0.2, 0.2), r = rr(30, 42), y = i % 3 === 0 ? rr(-9, -5) : rr(3, 9);
    const n = 4 + Math.floor(R() * 3);
    for (let k = 0; k < n; k++) mesh(new THREE.SphereGeometry(rr(0.9, 1.6), 24, 16), felt('#ffffff', { rep: 2 }), (k - n / 2) * 1.1, rr(-0.2, 0.5), rr(-0.4, 0.4), c, false).scale.y = 0.75;
    scene.add(c); clouds.push({ c, a, r, y, p: R() * TAU, v: rr(0.006, 0.014), C });
  }
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Group(), a = 2.4 + i * 1.5, r = rr(52, 62), s = rr(1.5, 2.6);
    mesh(new THREE.ConeGeometry(s * 1.2, s * 2.2, 24), felt('#a8674a', { rep: 2 }), 0, -s * 1.1, 0, g, false).rotation.x = PI;
    mesh(pillowCyl(s * 1.25, 0.3, 0.12, 32), felt('#8fbf6a', { rep: 3 }), 0, 0, 0, g, false);
    mesh(new THREE.SphereGeometry(s * 0.45, 20, 14), felt('#5f9e57', { rep: 1 }), 0, s * 0.6, 0, g, false);
    scene.add(g); clouds.push({ c: g, a, r, y: rr(-6, 4), p: R() * TAU, v: 0.003, C });
  }
  return clouds;
}

function buildButterflies(world) {
  const out = [];
  for (let i = 0; i < 7; i++) {
    const b = new THREE.Group(); world.add(b);
    const col = ['#f6a3b8', '#7fc8f8', '#f2c14e', '#ffffff', '#b9a3f6'][i % 5];
    const wingGeo = new THREE.CircleGeometry(0.12, 16); wingGeo.translate(0.12, 0, 0);
    const mat = new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.9, sheen: 1, side: THREE.DoubleSide });
    const L = new THREE.Mesh(wingGeo, mat), Rw = new THREE.Mesh(wingGeo, mat); Rw.scale.x = -1;
    L.rotation.x = Rw.rotation.x = -PI / 2; const lp = new THREE.Group(), rp = new THREE.Group(); lp.add(L); rp.add(Rw); b.add(lp, rp);
    const isl = ISLANDS[i % 2];
    out.push({ b, lp, rp, cx: isl.x + rr(-5, 5), cz: isl.z + rr(-5, 5), p: R() * TAU, s: rr(0.4, 0.7) });
  }
  return out;
}

/** Builds everything. cases: the résumé case records, keyed into each building's card. */
export function buildWorld(scene, { cases }) {
  const world = new THREE.Group(); scene.add(world);
  for (const isl of ISLANDS) buildIsland(isl, world);
  buildBridge(world);
  const pathPts = buildPaths(world);
  buildPond(world);
  const byId = new Map(cases.map((c) => [c.id, c]));
  const landmarks = SITES.map((S, i) => {
    const { g, depth, height } = BUILDERS[S.kind]();
    const own = PATHS[S.island];
    let best = own[0], bd = Infinity;
    for (const p of own) { const d = (p.x - S.x) ** 2 + (p.z - S.z) ** 2; if (d < bd) { bd = d; best = p; } }
    const dir = new V3(best.x - S.x, 0, best.z - S.z).normalize(); dir.z += 0.9; // face the path, turned toward the camera
    const yaw = Math.atan2(dir.x, dir.z);
    g.position.set(S.x, 0, S.z); g.rotation.y = yaw; world.add(g);
    const c = byId.get(S.id);
    const card = S.id === 'camp' ? RECRUIT_CARD : { kind: `Quest log · ${c.years}`, title: c.client, role: c.role, items: c.outcome, stack: c.stack, link: c.page || null };
    const name = S.id === 'camp' ? 'Join the party' : (SHORT[S.id] || c.client.replace(/ \(.*\)$/, ''));
    const sub = S.id === 'camp' ? 'Full-time or contract · remote' : `${c.years} · ${c.role}`;
    const L = { id: S.id, island: S.island, kind: S.kind, name, sub, card, group: g, radius: S.radius, height,
      center: new V3(S.x, 0, S.z), door: new V3(S.x + Math.sin(yaw) * (depth / 2 + 1.1), 0, S.z + Math.cos(yaw) * (depth / 2 + 1.1)) };
    pop(g, (S.island === 'main' ? 1.5 : 2.0) + i * 0.18);
    return L;
  });
  const colliders = landmarks.map((L) => ({ c: L.center, r: L.radius })).concat([{ c: new V3(POND.x, 0, POND.z), r: POND.r }]);
  const trees = scatter(world, pathPts, colliders, landmarks);
  return { world, landmarks, colliders, trees, clouds: buildSky(scene), butterflies: buildButterflies(world), fire: () => ({ light: fireLight, sparks }) };
}
