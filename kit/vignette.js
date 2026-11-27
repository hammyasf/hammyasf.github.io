// One building, alive: the 3D header patch on a case page. A small felt grass disc, the
// building, two trees and the world's lighting, turning slowly. three.js and the world modules
// load lazily so a failure (no WebGL, offline CDN) falls back to the still image.
const TURN_SECONDS = 40;

export async function mountVignette(canvas, { caseId, reduced, fallbackSrc, loadThree = () => import('three') }) {
  const fallback = () => {
    const img = canvas.ownerDocument.createElement('img');
    img.src = fallbackSrc; img.alt = '';
    img.className = canvas.className; if (canvas.id) img.id = canvas.id; // so the page's art CSS still applies
    canvas.replaceWith(img);
    return { destroy() {}, fallback: true };
  };
  let renderer, stop = () => {};
  try {
    const THREE = await loadThree();
    const [{ RoomEnvironment }, felt, props, layout] = await Promise.all([
      import('three/addons/environments/RoomEnvironment.js'), import('../world/felt.js'), import('../world/props.js'), import('../world/layout.js'),
    ]);
    const kind = layout.kindFor(caseId);
    if (!kind) throw new Error(`no building for ${caseId}`);
    const { TAU, mesh, stitches, ring, pillowCyl, tickers } = felt;
    const { g: building, depth, height } = props.buildBuilding(kind);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const scene = new THREE.Scene();
    scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.35;
    const sun = new THREE.DirectionalLight('#ffe0b8', 4.2);
    sun.position.set(7, 11, 5); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.035;
    scene.add(sun, new THREE.HemisphereLight('#cfe4ff', '#e2b896', 0.5));

    // grass disc with a stitched rim; the whole stage turns, so the light stays put
    const r = Math.max(depth, 3.2) / 2 + 2.6, stage = new THREE.Group(); scene.add(stage);
    mesh(new THREE.LatheGeometry([[r, -0.5], [r + 0.05, -0.2], [r - 0.3, 0], [0, 0]].map(([x, y]) => new THREE.Vector2(x, y)), 96), felt.felt('#8fbf6a', { rep: 6 }), 0, 0, 0, stage);
    stitches(ring(r - 0.05, -0.25, 96), stage, 0.2);
    stage.add(building);
    [[-1, -0.8, 0.9, '#5f9e57'], [1, 0.55, 0.8, '#76b05e']].forEach(([sx, sz, s, col]) => {
      const t = new THREE.Group(); t.position.set(sx * (r - 1.1), 0, sz * (r - 1.4)); stage.add(t);
      mesh(pillowCyl(0.13 * s, 0.9 * s, 0.05, 12), felt.felt('#86573a', { rep: 1 }), 0, 0, 0, t);
      mesh(new THREE.SphereGeometry(0.75 * s, 24, 16), felt.felt(col, { rep: 2 }), 0, 1.35 * s, 0, t);
    });

    const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 100);
    const resize = () => {
      const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
      renderer.setSize(w, h, false); camera.aspect = w / h;
      const d = Math.max(height * 1.9, r * 2.0) * Math.max(1, 1.5 / camera.aspect) * 1.5; // wider fit for narrow canvases
      camera.position.set(0, height * 0.9 + 1.6, d); camera.lookAt(0, height * 0.3, 0); camera.updateProjectionMatrix();
    };
    resize();
    stage.rotation.y = 0.5;
    let t = 0, last = performance.now(), raf = 0, onscreen = true;
    const frame = () => {
      raf = 0;
      const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
      t += dt;
      if (!reduced) { stage.rotation.y += (TAU / TURN_SECONDS) * dt; for (const f of tickers) f(t, dt); }
      renderer.render(scene, camera);
      if (!reduced && onscreen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduced && onscreen && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    frame(); // one frame always, so a reduced-motion visitor still gets the still
    const io = typeof IntersectionObserver === 'function' ? new IntersectionObserver((entries) => { onscreen = entries.at(-1).isIntersecting; wake(); }) : null;
    io?.observe(canvas);
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { resize(); if (!raf) renderer.render(scene, camera); }) : null;
    ro?.observe(canvas);
    document.addEventListener('visibilitychange', wake);
    stop = () => { cancelAnimationFrame(raf); io?.disconnect(); ro?.disconnect(); document.removeEventListener('visibilitychange', wake); renderer.dispose(); };
    wake();
    return { destroy: stop, fallback: false };
  } catch (e) {
    stop(); renderer?.dispose?.();
    return fallback();
  }
}
