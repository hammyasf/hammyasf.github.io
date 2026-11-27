// Harman's little world: the homepage. A felt diorama on two floating islands; every building
// is a job from his résumé. Scout, the guide, answers typed questions on-device and walks
// Harman to the building that proves the answer. three.js from jsDelivr, no build step.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { HorizontalTiltShiftShader } from 'three/addons/shaders/HorizontalTiltShiftShader.js';
import { VerticalTiltShiftShader } from 'three/addons/shaders/VerticalTiltShiftShader.js';
import { V2, V3, PI, TAU, mesh, felt, pops, spring, tickers } from './felt.js';
import { buildWorld } from './props.js';
import { buildHarman, buildScout } from './characters.js';
import { sfx, toggleSound } from './audio.js';
import { parseEntry } from './entry.js';
import { SITES, SPAWN, SCOUT, clampWalkable, route, groundHeight, regionAt } from './layout.js';
import { plan } from './agent.js';
import { buildIndex } from '../recruit/keyword.js';
import { createGuide } from '../recruit/guide.js';
import { createEmbedder } from '../recruit/embedder.js';

const $ = (s) => document.querySelector(s);
const boot = { start: performance.now() }; const mark = (k) => { boot[k] = Math.round(performance.now() - boot.start); };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MAIL = 'mailto:playcivil@gmail.com?subject=Recruiting%20Harman';

// ---------- data ----------
const fetchJson = (f) => fetch(`recruit/data/${f}`).then((r) => { if (!r.ok) throw new Error(`${f} ${r.status}`); return r.json(); });
const get = (f) => fetchJson(f).catch(() => new Promise((ok) => setTimeout(ok, 600)).then(() => fetchJson(f))); // one retry for a flaky network
let facts, cases, config;
try { [facts, cases, config] = await Promise.all(['facts.json', 'cases.json', 'config.json'].map(get)); }
catch { $('#load').textContent = 'The world could not load. The plain résumé is just below.'; throw new Error('data failed to load'); }
mark('data');

// ---------- renderer, scene, camera ----------
const hero = $('#hero'), canvas = $('#world');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
let DPR = Math.min(devicePixelRatio, 1.5); // ponytail: fill-bound at retina; starts at 1.5x and steps down if frames drop
renderer.setPixelRatio(DPR);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 220);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;
mark('env');
{
  const c = document.createElement('canvas'); c.width = 4; c.height = 512;
  const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, '#8fbfe6'); gr.addColorStop(0.45, '#cfe0ee'); gr.addColorStop(0.75, '#f8dcc6'); gr.addColorStop(1, '#f2b79d');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t;
}
scene.fog = new THREE.Fog('#f3d2bf', 48, 130);
const SUN_OFF = new V3(14, 22, 10);
const sun = new THREE.DirectionalLight('#ffe0b8', 4.2);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 70 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.035;
scene.add(sun, sun.target, new THREE.HemisphereLight('#cfe4ff', '#e2b896', 0.5));

// ---------- the world and its people ----------
const { landmarks, colliders, trees, clouds, butterflies, fire } = buildWorld(scene, { cases });
const byId = new Map(landmarks.map((L) => [L.id, L]));
mark('world');
const harman = buildHarman(); scene.add(harman); harman.traverse((o) => { if (o.isMesh) o.castShadow = true; });
const scout = buildScout(); scout.position.set(SCOUT.x, 0, SCOUT.z); scene.add(scout);
pops.push({ obj: scout, at: 2.9, sfx: false }); scout.userData.base = scout.scale.clone(); scout.scale.setScalar(0.0001);
const shadowBlob = mesh(new THREE.CircleGeometry(0.42, 32), new THREE.MeshBasicMaterial({ color: '#3a2418', transparent: true, opacity: 0.22, depthWrite: false }), 0, 0.02, 0, scene, false);
shadowBlob.rotation.x = -PI / 2;

const puffs = [], puffMat = felt('#fff4e4', { rep: 1 }), puffGeo = new THREE.SphereGeometry(0.1, 12, 8);
function puff(x, y, z, n = 4, power = 1) {
  for (let i = 0; i < n; i++) {
    const m = mesh(puffGeo, puffMat, x, y + 0.08, z, scene, false), a = Math.random() * TAU;
    puffs.push({ m, vx: Math.cos(a) * (0.6 + Math.random() * 0.8) * power, vz: Math.sin(a) * (0.6 + Math.random() * 0.8) * power, vy: (0.4 + Math.random() * 0.6) * power, life: 0.6, s: 0.7 + Math.random() * 0.6 });
  }
}

// ---------- post: bloom on glows, tilt-shift for the miniature look ----------
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 2 }));
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new V2(1, 1), 0.5, 0.55, 1.0); composer.addPass(bloom);
const hTilt = new ShaderPass(HorizontalTiltShiftShader), vTilt = new ShaderPass(VerticalTiltShiftShader);
composer.addPass(hTilt); composer.addPass(vTilt); composer.addPass(new OutputPass());
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, t: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float t; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + t) * 43758.5453); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = vUv - 0.5; float v = smoothstep(0.85, 0.25, length(d * vec2(1.0, 0.85)));
      c.rgb *= mix(0.82, 1.0, v); c.rgb += (h(vUv * 800.0) - 0.5) * 0.025; gl_FragColor = c; }`,
});
composer.addPass(grade);
let W = 1, H = 1;
function resize() {
  W = Math.max(1, hero.clientWidth); H = Math.max(1, hero.clientHeight);
  renderer.setPixelRatio(DPR); renderer.setSize(W, H, false); composer.setPixelRatio(DPR); composer.setSize(W, H);
  camera.aspect = W / H; camera.fov = W < H ? 42 : 30; camera.updateProjectionMatrix();
  hTilt.uniforms.h.value = 3.2 / W; vTilt.uniforms.v.value = 3.2 / H;
}
addEventListener('resize', resize); resize();
let heroVisible = true;
new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }, { threshold: 0.05 }).observe(hero);
const heroInView = () => hero.getBoundingClientRect().top > -H * 0.5;

// ---------- the guide's brain (shared with the old recruit screen) ----------
const aiChip = $('#ai-chip');
const embedder = createEmbedder({
  onStatus(state, p) {
    aiChip.dataset.state = state;
    aiChip.textContent = state === 'ready' ? 'Scout runs on your device · AI ready'
      : state === 'failed' ? 'Scout is in keyword mode' : `Scout is waking up · ${Math.round((p || 0) * 100)}% of 23 MB, once`;
  },
});
const guide = createGuide({ facts, config, index: buildIndex(facts), embedder });
let aiLoading = null;
const loadAI = () => (aiLoading ??= get('embeddings.json').then((v) => { guide.setVectors(v); return embedder.load(); })
  .catch(() => { aiChip.dataset.state = 'failed'; aiChip.textContent = 'Scout is in keyword mode'; }));

// ---------- state ----------
const entry = parseEntry(location.search, SITES.map((x) => x.id));
const at = byId.get(entry.at);
const player = { pos: new V3(SPAWN.x, 0, SPAWN.z), vel: new V3(), y: 9, vy: 0, ground: false, yaw: 0.6, phase: 0, squash: 0, squashV: 0, blinkAt: 2, path: [], pending: null, auto: false, dropped: false };
if (at) player.pos.copy(at.door).add(new V3(0.3, 0, 0.3));
const keys = { f: false, b: false, l: false, r: false };
let T = reduced || at ? 6.5 : 0, last = performance.now(), controls = false, nearId = null, cardOpen = false, companion = !!at;
const camPos = new V3(), camLook = new V3(), camZoom = entry.zoom;

// ---------- DOM ----------
const title = $('#title'), hud = $('#hud'), hint = $('#hint'), ask = $('#ask'), card = $('#card'), live = $('#say-live');
$('#title-h').innerHTML = [...'Harman Kamboj'].map((c, i) => (c === ' ' ? ' ' : `<span class="ch" style="animation-delay:${0.05 * i}s">${c}</span>`)).join('');
const promptEl = Object.assign(document.createElement('div'), { className: 'prompt', innerHTML: '<b>E</b><span>Go in</span>' });
const label = Object.assign(document.createElement('div'), { className: 'label patch', innerHTML: '<div class="name"></div><div class="meta"></div>' });
$('#ui').append(promptEl, label);
$('#sound').addEventListener('click', () => { const on = toggleSound(); $('#sound').textContent = on ? 'Sound on' : 'Sound off'; $('#sound').setAttribute('aria-pressed', String(on)); });

// ---------- Scout speaks ----------
const INTRO = ['Oh, hello. You found Harman.', 'Every building here is a real job. Walk up to one and go in.', "Or ask me anything below, and I'll take you to the proof."];
let bubble = null, typing = null, hideAt = Infinity, introIdx = -1;
function say(text, { trace = [], acts = '', next = false, hold = 0 } = {}) {
  clearInterval(typing);
  if (!bubble) { bubble = document.createElement('div'); bubble.className = 'bubble patch'; $('#ui').append(bubble); bubble.addEventListener('click', onBubbleClick); requestAnimationFrame(() => bubble?.classList.add('on')); }
  const tr = trace.length ? `<pre class="trace">${trace.map((l) => esc(l).replace(/^(\w+)\(/, '<b>$1</b>(')).join('\n')}</pre>` : '';
  bubble.innerHTML = `<b class="who">SCOUT</b><span class="txt"></span>${next ? '<span class="next">▾</span>' : ''}${tr}${acts ? `<div class="acts">${acts}</div>` : ''}`;
  live.textContent = text;
  const span = bubble.querySelector('.txt');
  bubble.dataset.full = text;
  if (reduced) span.textContent = text;
  else { let n = 0; typing = setInterval(() => { n += 2; span.textContent = text.slice(0, n); if (n % 4 === 0) sfx.blip(); if (n >= text.length) { clearInterval(typing); typing = null; } }, 22); }
  hideAt = T + (hold || 4 + text.length * 0.045);
}
function hideBubble() { clearInterval(typing); typing = null; hideAt = Infinity; if (!bubble) return; bubble.classList.remove('on'); const b = bubble; bubble = null; setTimeout(() => b.remove(), 450); }
function finishTyping() { if (!typing || !bubble) return false; clearInterval(typing); typing = null; bubble.querySelector('.txt').textContent = bubble.dataset.full; return true; }
function nextIntro() {
  introIdx++;
  if (introIdx < INTRO.length) say(INTRO[introIdx], { next: introIdx < INTRO.length - 1, hold: introIdx < INTRO.length - 1 ? 3.6 : 6 });
  else { hideBubble(); companion = true; }
}
function onBubbleClick(e) {
  if (e.target.closest('a,button')) return;
  if (finishTyping()) return;
  if (introIdx >= 0 && introIdx < INTRO.length) nextIntro(); else hideBubble();
}

// ---------- cards ----------
let returnFocus = null;
function openCard(L) {
  const d = L.card; cardOpen = true; returnFocus = document.activeElement; sfx.open(); player.path = []; player.pending = null; player.auto = false;
  card.innerHTML = `<div class="kind">${esc(d.kind)}</div><h2 id="card-h">${esc(d.title)}</h2><p class="role">${esc(d.role)}</p>
    ${d.stack ? `<ul class="stack">${d.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
    <ul class="out">${d.items.map((it, i) => `<li style="animation-delay:${0.08 * i + 0.15}s">${esc(it)}</li>`).join('')}</ul>
    <div class="row">${d.recruit
      ? `<a class="btn hot" href="${MAIL}">Email Harman</a><a class="btn" href="Harman-Kamboj-Resume.pdf">Download résumé</a>`
      : d.link ? `<a class="btn hot" href="${esc(d.link)}">Read the full case</a>` : ''}<button class="btn" type="button" data-close>Back outside</button></div>`;
  // pageswap names the element whose data-morph matches the destination: the whole card morphs into the case header
  if (!d.recruit && d.link) card.dataset.morph = d.link; else delete card.dataset.morph;
  card.classList.add('on'); document.body.classList.add('reading');
  card.querySelector('[data-close]').addEventListener('click', closeCard);
  setTimeout(() => card.querySelector('.btn')?.focus({ preventScroll: true }), 60);
}
function closeCard() { delete card.dataset.morph; cardOpen = false; card.classList.remove('on'); document.body.classList.remove('reading'); sfx.close(); returnFocus?.focus?.({ preventScroll: true }); }

// ---------- walking: keys, taps, and Scout's walk_to ----------
function walkTo(dest, pending = null, auto = false) {
  player.path = route(player.pos, dest).map((p) => new V3(p.x, 0, p.z));
  player.pending = pending; player.auto = auto;
}
function act() {
  if (cardOpen) return closeCard();
  if (bubble && introIdx >= 0 && introIdx < INTRO.length) return onBubbleClick({ target: document.body });
  const L = byId.get(nearId);
  if (L) openCard(L);
}
function jump() {
  if (!controls || !player.ground || cardOpen) return;
  player.vy = 6.8; player.ground = false; player.squash = -0.25; sfx.jump(); puff(player.pos.x, groundHeight(player.pos.x, player.pos.z), player.pos.z, 3, 0.6);
}
const KEYMAP = { ArrowUp: 'f', w: 'f', W: 'f', ArrowDown: 'b', s: 'b', S: 'b', ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r' };
const typingInField = () => /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName || '');
const onControl = () => !/^(A|BUTTON|INPUT|TEXTAREA)$/.test(document.activeElement?.tagName || '');
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if (cardOpen) closeCard(); else if (bubble) hideBubble(); return; }
  if (typingInField() || !heroInView()) return;
  if (KEYMAP[e.key] && !cardOpen) { keys[KEYMAP[e.key]] = true; player.path = []; player.pending = null; player.auto = false; hint.classList.add('gone'); e.preventDefault(); return; }
  if (e.repeat) return;
  if (e.key === ' ' && onControl()) { jump(); e.preventDefault(); }
  else if (e.key === 'e' || e.key === 'E') act();
  else if (e.key === 'Enter' && onControl()) act();
  else if (e.key === '/') { e.preventDefault(); $('#ask-input').focus(); }
});
addEventListener('keyup', (e) => { if (KEYMAP[e.key]) keys[KEYMAP[e.key]] = false; });
addEventListener('blur', () => Object.keys(keys).forEach((k) => (keys[k] = false)));
const ray = new THREE.Raycaster(), ndc = new V2(), groundPlane = new THREE.Plane(new V3(0, 1, 0), 0);
const groups = landmarks.map((L) => L.group);
canvas.addEventListener('click', (e) => {
  if (cardOpen) return closeCard();
  if (!controls) return;
  hint.classList.add('gone');
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / W) * 2 - 1, -((e.clientY - r.top) / H) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(groups, true)[0];
  if (hit) {
    const L = landmarks.find((x) => { let o = hit.object; while (o) { if (o === x.group) return true; o = o.parent; } return false; });
    if (L) { if (nearId === L.id) return openCard(L); walkTo(L.door, L.id); return; }
  }
  const p = new V3();
  if (ray.ray.intersectPlane(groundPlane, p) && regionAt(p.x, p.z)) { walkTo(p); ripple(p); }
});
const rippleMesh = mesh(new THREE.RingGeometry(0.25, 0.33, 32), new THREE.MeshBasicMaterial({ color: '#fff7ea', transparent: true, opacity: 0, depthWrite: false }), 0, 0.03, 0, scene, false);
rippleMesh.rotation.x = -PI / 2; let rippleT = 9;
function ripple(p) { rippleMesh.position.set(p.x, groundHeight(p.x, p.z) + 0.04, p.z); rippleT = 0; }

// ---------- ask Scout: the agent ----------
// chips go straight to a known card: no search, so they answer even before the model loads
const CHIPS = [['Has he shipped AI agents?', 'ai.codewisp'], ['Any crypto work?', 'shib.overview'], ['Has he led a team?', 'work.leadership'],
  ['Does he make games?', 'games.overview'], ['Can he start now?', 'work.start'], ['What does he build for fun?', 'side.overview']];
$('#chips').innerHTML = CHIPS.map(([q, id]) => `<li><button type="button" data-card="${id}">${esc(q)}</button></li>`).join('');
$('#chips').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  act_on(b.textContent, { kind: 'confident', card: guide.card(b.dataset.card), trace: [`pick("${b.textContent}") → ${b.dataset.card}`] });
});
ask.addEventListener('submit', (e) => { e.preventDefault(); const q = $('#ask-input').value.trim(); if (q) { askScout(q); $('#ask-input').value = ''; } });
// the 23 MB model loads only when someone goes to ask; keyword search answers until it is ready
$('#ask-input').addEventListener('focus', loadAI, { once: true });
$('#chips').addEventListener('pointerenter', loadAI, { once: true });
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
async function askScout(q) {
  loadAI();
  let r = await guide.answer(q);
  if (r.kind === 'unknown' && !embedder.ready && aiLoading) { // keyword search missed: give the model a moment
    say('One moment, I am waking up properly…', { hold: 30 });
    await Promise.race([aiLoading, sleep(9000)]);
    r = await guide.answer(q);
  }
  act_on(q, r);
}
function act_on(q, result) {
  if (cardOpen) closeCard();
  introIdx = INTRO.length; companion = true; hint.classList.add('gone');
  const p = plan(result, { siteIds: landmarks.map((L) => L.id) });
  const links = p.steps.filter((s) => s.tool === 'offer_link').map((s) => `<a class="btn" href="${esc(s.arg.url)}">${esc(s.arg.label)}</a>`).join('');
  const acts = (p.cta ? `<a class="btn hot" href="${MAIL}">Email Harman</a>` : '') + links;
  say(p.text, { trace: [`ask("${q.length > 40 ? `${q.slice(0, 39)}…` : q}")`, ...p.trace], acts, hold: 7 + p.text.length * 0.05 });
  const walk = p.steps.find((s) => s.tool === 'walk_to'), open = p.steps.find((s) => s.tool === 'open');
  if (walk && byId.get(walk.arg)) walkTo(byId.get(walk.arg).door, open ? open.arg : null, true);
}

// ---------- helpers ----------
const toScreen = (v) => { const p = v.clone().project(camera); return { x: (p.x + 1) / 2 * W, y: (1 - p.y) / 2 * H, z: p.z }; };
const angleLerp = (a, b, k) => a + (((b - a + PI) % TAU + TAU) % TAU - PI) * k;
const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const tmp = new V3();

// ---------- the loop ----------
let fpsN = 0, fpsT = 0, lastStep = 0, shake = 0, crackleAt = 0;
function frame(now) {
  requestAnimationFrame(frame);
  if (!heroVisible || document.hidden) { last = now; return; }
  const dt = Math.min(0.1, (now - last) / 1000); last = now; T += dt; // ponytail: dt cap 0.1s keeps slow devices in real time; fine for these speeds
  fpsN++;
  if (now - fpsT > 1500) {
    const fps = window.__fps = Math.round(fpsN * 1000 / (now - fpsT)); fpsN = 0; fpsT = now;
    if (T > 7 && fps < 45 && DPR > 1) { DPR = Math.max(1, DPR - 0.25); resize(); }
  }
  for (const f of tickers) f(T, dt);
  for (const p of pops) {
    const k = spring(T - p.at); p.obj.scale.copy(p.obj.userData.base).multiplyScalar(Math.max(0.0001, k));
    if (p.obj.userData.squish !== undefined) p.obj.scale.y *= p.obj.userData.squish;
    if (!p.sfx && T > p.at) { p.sfx = true; if (p.obj.children.length > 6) sfx.pop(); }
  }

  // intro beats
  if (T > 0.3 && !title.classList.contains('on') && !at) title.classList.add('on');
  if (T > 4.8 && !title.classList.contains('off')) title.classList.add('off');
  if (T > 4.1 && !player.dropped) { player.dropped = true; player.vy = -2; }
  if (T > 4.7 && !controls) { controls = true; hud.classList.add('on'); hint.classList.add('on'); ask.classList.add('on'); }
  if (T > 5.3 && introIdx < 0 && !at) nextIntro();
  if (T > 24) hint.classList.add('gone');
  if (bubble && T > hideAt) { if (introIdx >= 0 && introIdx < INTRO.length) nextIntro(); else hideBubble(); }

  // movement: camera-relative keys, or follow the route (taps and Scout's walk_to)
  const input = new V3((keys.r ? 1 : 0) - (keys.l ? 1 : 0), 0, (keys.b ? 1 : 0) - (keys.f ? 1 : 0));
  if (input.lengthSq() === 0 && player.path.length) {
    const wp = player.path[0], d = tmp.set(wp.x - player.pos.x, 0, wp.z - player.pos.z), len = d.length();
    if (len < (player.path.length > 1 ? 0.5 : 0.25)) {
      player.path.shift();
      if (!player.path.length) { const L = byId.get(player.pending); player.pending = null; player.auto = false; if (L) openCard(L); }
    } else input.copy(d.multiplyScalar(1 / len));
  }
  if (!controls || cardOpen) input.set(0, 0, 0);
  if (input.lengthSq() > 1) input.normalize();
  const top = player.auto ? 5.4 : 4.2, accel = player.ground ? 26 : 12;
  player.vel.x += (input.x * top - player.vel.x) * Math.min(1, accel * dt / 4.2);
  player.vel.z += (input.z * top - player.vel.z) * Math.min(1, accel * dt / 4.2);
  player.pos.addScaledVector(player.vel, dt);
  for (const c of colliders) {
    const dx = player.pos.x - c.c.x, dz = player.pos.z - c.c.z, d = Math.hypot(dx, dz), min = c.r + 0.35;
    if (d < min && d > 0.0001) { player.pos.x = c.c.x + dx / d * min; player.pos.z = c.c.z + dz / d * min; }
  }
  const cw = clampWalkable(player.pos.x, player.pos.z); player.pos.x = cw.x; player.pos.z = cw.z;
  const gy = groundHeight(player.pos.x, player.pos.z);
  const speed = Math.hypot(player.vel.x, player.vel.z), sn = Math.min(1, speed / 4.2);
  if (speed > 0.3) player.yaw = angleLerp(player.yaw, Math.atan2(player.vel.x, player.vel.z), Math.min(1, dt * 12));

  // vertical: drop in, hop, land with a squash (y is height above the ground)
  if (player.dropped && !player.ground) {
    player.vy -= 22 * dt; player.y += player.vy * dt;
    if (player.y <= 0) {
      const impact = Math.min(1, -player.vy / 12); player.y = 0; player.vy = 0; player.ground = true;
      player.squash = 0.35 * impact + 0.1; shake = 0.25 * impact; puff(player.pos.x, gy, player.pos.z, 6 + Math.round(impact * 6), 0.6 + impact); sfx.land();
    }
  }
  player.squashV += (-player.squash * 180 - player.squashV * 14) * dt; player.squash += player.squashV * dt;

  // walk cycle
  const U = harman.userData;
  player.phase += dt * (5 + speed * 2.4) * (sn > 0.05 ? 1 : 0);
  const sw = Math.sin(player.phase) * sn;
  U.legs[0].rotation.x = sw * 0.7; U.legs[1].rotation.x = -sw * 0.7;
  U.arms[0].rotation.x = -sw * 0.6; U.arms[1].rotation.x = sw * 0.6;
  U.body.position.y = Math.abs(Math.sin(player.phase)) * 0.07 * sn;
  U.body.rotation.z = Math.sin(player.phase) * 0.07 * sn;
  U.body.rotation.x = sn * 0.12;
  const breathe = 1 + Math.sin(T * 2.2) * 0.015 * (1 - sn);
  U.torso.scale.set(1.06 * breathe, 1 / breathe, 0.88 * breathe);
  U.head.rotation.z = Math.sin(T * 1.3) * 0.04 * (1 - sn) - U.body.rotation.z * 0.5;
  if (!player.ground) { U.arms[0].rotation.z = -1.2; U.arms[1].rotation.z = 1.2; U.legs[0].rotation.x = 0.3; U.legs[1].rotation.x = -0.2; }
  else { U.arms[0].rotation.z = -0.16; U.arms[1].rotation.z = 0.16; }
  if (T > player.blinkAt) { player.blinkAt = T + 2 + Math.random() * 3; U.eyes.forEach((e) => (e.userData.blink = 0.14)); }
  U.eyes.forEach((e) => { e.userData.blink = Math.max(0, (e.userData.blink || 0) - dt); e.scale.y = e.userData.blink > 0 ? 0.15 : 1; });
  const sq = player.squash;
  harman.scale.set(1 + sq * 0.6, 1 - sq, 1 + sq * 0.6);
  harman.position.set(player.pos.x, gy + player.y, player.pos.z);
  harman.rotation.y = player.yaw;
  harman.visible = player.dropped;
  shadowBlob.position.set(player.pos.x, gy + 0.025, player.pos.z);
  const sh = Math.max(0.25, 1 - player.y / 8); shadowBlob.scale.setScalar(sh); shadowBlob.material.opacity = 0.22 * sh; shadowBlob.visible = player.dropped || T > 3;

  if (player.ground && sn > 0.3) {
    const stepIdx = Math.floor(player.phase / PI);
    if (stepIdx !== lastStep) { lastStep = stepIdx; sfx.step(); if (Math.random() < 0.5) puff(player.pos.x - player.vel.x * 0.05, gy, player.pos.z - player.vel.z * 0.05, 1, 0.3); }
  }
  for (let i = puffs.length - 1; i >= 0; i--) {
    const p = puffs[i]; p.life -= dt;
    p.m.position.x += p.vx * dt; p.m.position.z += p.vz * dt; p.m.position.y += p.vy * dt; p.vy *= 0.92; p.vx *= 0.9; p.vz *= 0.9;
    p.m.scale.setScalar(p.s * (0.6 + (0.6 - p.life)) * Math.max(0, p.life / 0.6));
    if (p.life <= 0) { scene.remove(p.m); puffs.splice(i, 1); }
  }
  rippleT += dt; rippleMesh.material.opacity = Math.max(0, 0.8 - rippleT * 1.6); rippleMesh.scale.setScalar(1 + rippleT * 2.5);

  // Scout: greets you at the start, then walks along at your side
  const S = scout.userData;
  if (companion) {
    const fwd = tmp.set(Math.sin(player.yaw), 0, Math.cos(player.yaw));
    const want = new V3(player.pos.x - fwd.x * 1.1 + fwd.z * 0.9, 0, player.pos.z - fwd.z * 1.1 - fwd.x * 0.9);
    const w2 = clampWalkable(want.x, want.z), d = Math.hypot(w2.x - scout.position.x, w2.z - scout.position.z);
    if (d > 0.15) { const k = Math.min(1, dt * (d > 4 ? 4 : 2.6)); scout.position.x += (w2.x - scout.position.x) * k; scout.position.z += (w2.z - scout.position.z) * k; }
    scout.position.y = groundHeight(scout.position.x, scout.position.z) + (d > 0.4 ? Math.abs(Math.sin(T * 10)) * 0.08 : 0);
  }
  const toP = new V3(player.pos.x - scout.position.x, 0, player.pos.z - scout.position.z);
  scout.rotation.y = angleLerp(scout.rotation.y, Math.atan2(toP.x, toP.z), Math.min(1, dt * 3));
  S.body.rotation.z = Math.sin(T * 1.4) * 0.04; S.head.rotation.x = Math.sin(T * 1.1) * 0.05;
  S.lantern.rotation.z = Math.sin(T * 2.2) * 0.25; S.lantern.rotation.x = Math.cos(T * 1.7) * 0.15;

  for (const b of butterflies) {
    const t = T * b.s + b.p;
    b.b.position.set(b.cx + Math.sin(t) * 2.2 + Math.sin(t * 2.3) * 0.5, 0.9 + Math.sin(t * 3.1) * 0.35, b.cz + Math.cos(t * 0.8) * 1.8);
    b.b.rotation.y = Math.atan2(Math.cos(t), -Math.sin(t * 0.8) * 0.8);
    const f = Math.sin(T * 18 + b.p) * 1.1; b.lp.rotation.z = f; b.rp.rotation.z = -f;
  }
  for (const c of clouds) { c.a += c.v * dt; c.c.position.set(c.C.x + Math.cos(c.a) * c.r, c.y + Math.sin(T * 0.4 + c.p) * 0.4, c.C.z + Math.sin(c.a) * c.r); }

  // nearest door
  let nl = null;
  if (controls) for (const L of landmarks) if (player.pos.distanceTo(L.door) < (L.id === 'camp' ? 1.9 : 1.6)) nl = L;
  if ((nl?.id || null) !== nearId) {
    nearId = nl?.id || null;
    promptEl.classList.toggle('on', !!nl); label.classList.toggle('on', !!nl);
    if (nl) { label.querySelector('.name').textContent = nl.name; label.querySelector('.meta').textContent = nl.sub; promptEl.querySelector('span').textContent = nl.id === 'camp' ? 'Recruit' : 'Go in'; sfx.chime(); }
  }
  const camp = byId.get('camp'), campD = player.pos.distanceTo(camp.center);
  if (campD < 5 && T > crackleAt) { crackleAt = T + 0.05 + Math.random() * 0.25; if (Math.random() < 1 - campD / 5) sfx.crackle(); }

  // camera: wide orbit during the intro, then a soft follow that leans toward an open building
  const portrait = W < H, dist = (portrait ? 1.35 : 1) * camZoom;
  const follow = new V3(player.pos.x, gy, player.pos.z);
  if (cardOpen && nearId) follow.lerp(byId.get(nearId).center, 0.5);
  const off = new V3(0, 9.2 * dist * (cardOpen ? 0.8 : 1), 12.8 * dist * (cardOpen ? 0.75 : 1));
  const followPos = follow.clone().add(off), followLook = follow.clone().add(new V3(0, 0.9, 0));
  const oa = 0.9 + T * 0.1, orbitPos = new V3(Math.cos(oa) * 36, 21, Math.sin(oa) * 36), orbitLook = new V3(0, -1, 0);
  const blend = ease((T - 3.6) / 2.2);
  const wantPos = orbitPos.lerp(followPos, blend), wantLook = orbitLook.lerp(followLook, blend);
  const k = blend >= 1 && camPos.lengthSq() > 0 ? 1 - Math.exp(-dt * 3.2) : 1;
  camPos.lerp(wantPos, k); camLook.lerp(wantLook, k);
  camera.position.copy(camPos);
  shake = Math.max(0, shake - dt); if (shake > 0) camera.position.add(new V3((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, 0));
  camera.lookAt(camLook);
  // the sun's shadow box follows the action
  const focusPt = blend >= 1 ? follow : new V3(0, 0, 0);
  sun.target.position.copy(focusPt); sun.position.copy(focusPt).add(SUN_OFF);

  // trees between the camera and Harman squash down out of the way
  const cx = camera.position.x, cz = camera.position.z, sx = player.pos.x - cx, sz = player.pos.z - cz, sl = sx * sx + sz * sz;
  for (const t of trees) {
    const u = ((t.position.x - cx) * sx + (t.position.z - cz) * sz) / sl;
    const d = Math.hypot(cx + sx * u - t.position.x, cz + sz * u - t.position.z);
    const want = blend >= 1 && u > 0.05 && u < 1.04 && d < 1.5 ? 0.3 : 1;
    t.userData.squish += (want - t.userData.squish) * Math.min(1, dt * 7);
  }

  const hp = toScreen(new V3(player.pos.x, gy + 0.8, player.pos.z));
  const focus = blend < 1 ? 0.5 : 1 - hp.y / H;
  hTilt.uniforms.r.value = vTilt.uniforms.r.value = THREE.MathUtils.lerp(hTilt.uniforms.r.value, focus, 0.1);
  grade.uniforms.t.value = T % 10;

  composer.render();

  // overlays
  if (nearId) {
    const p = toScreen(new V3(player.pos.x, gy + player.y + 2.15, player.pos.z)); promptEl.style.left = `${p.x}px`; promptEl.style.top = `${p.y}px`;
    const L = byId.get(nearId), q = toScreen(L.center.clone().setY(L.height + 0.4));
    const lw = label.offsetWidth / 2 + 10;
    label.style.left = `${Math.min(W - lw, Math.max(lw, q.x))}px`; label.style.top = `${Math.max(150, q.y)}px`;
  }
  if (bubble) {
    const p = toScreen(scout.position.clone().add(new V3(0, 1.75, 0)));
    const bw = bubble.offsetWidth / 2 + 12, x = Math.min(W - bw, Math.max(bw, p.x));
    bubble.style.left = `${x}px`; bubble.style.top = `${Math.max(bubble.offsetHeight + 70, p.y)}px`;
    bubble.style.setProperty('--tail', `${Math.min(90, Math.max(10, 50 + ((p.x - x) / (bw * 2)) * 100))}%`);
  }
}

mark('ready'); window.__boot = boot;
$('#load').style.opacity = 0;
requestAnimationFrame((t) => { last = t; $('#fade').classList.add('out'); requestAnimationFrame(frame); });
if (entry.ask) { // from a case page's "Ask Scout about this job"
  askScout(entry.ask).catch(() => say('Hmm, I lost my train of thought. Ask me again?', { hold: 8 }));
  const u = new URL(location.href); u.searchParams.delete('ask'); history.replaceState(history.state, '', u); // a reload or Back must not re-ask
}
window.__world = { player, camera, landmarks, keys, renderer, scene, composer, sun, tickers, askScout, get T() { return T; }, set T(v) { T = v; }, get fps() { return window.__fps; } };
