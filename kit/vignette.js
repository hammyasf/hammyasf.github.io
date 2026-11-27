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
    const { g: building, depth } = props.buildBuilding(kind);

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
    // additive light (the theater's searchlights) vanishes on a see-through canvas and is too tall for this frame:
    // here it is half length, normally blended, so the poster and the live page show the same beams
    building.traverse((o) => {
      if (o.material?.blending !== THREE.AdditiveBlending) return;
      o.material = Object.assign(o.material.clone(), { blending: THREE.NormalBlending, opacity: 0.16 });
      o.scale.y *= 0.5; o.position.y *= 0.5;
    });
    [[-1, -0.8, 0.9, '#5f9e57'], [1, 0.55, 0.8, '#76b05e']].forEach(([sx, sz, s, col]) => {
      const t = new THREE.Group(); t.position.set(sx * (r - 1.1), 0, sz * (r - 1.4)); stage.add(t);
      mesh(pillowCyl(0.13 * s, 0.9 * s, 0.05, 12), felt.felt('#86573a', { rep: 1 }), 0, 0, 0, t);
      mesh(new THREE.SphereGeometry(0.75 * s, 24, 16), felt.felt(col, { rep: 2 }), 0, 1.35 * s, 0, t);
    });

    // Frame fit: every vertex, at any turn of the stage and any pose its tickers sweep through, stays inside the
    // frame with a margin. Same aspect, same framing, so the still poster (captured here) and the live first frame match.
    // Each height band keeps its widest radius from the turning axis; the camera then fits those rings.
    const BANDS = 32, EL = 0.4, MARGIN = 0.84, v = new THREE.Vector3(), samples = [];
    for (const at of [8, 6, 4, 2, 0]) { // ends on t = 0, the pose of the first frame
      for (const f of tickers) f(at, 0);
      stage.updateMatrixWorld(true);
      stage.traverse((o) => {
        const pos = o.geometry?.attributes?.position;
        if (!pos || o.isInstancedMesh) return; // instanced stitches sit on the disc rim, inside the disc
        for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); if (v.y > -1) samples.push(v.y, Math.hypot(v.x, v.z)); } // below the disc: parked, hidden props
      });
    }
    let y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < samples.length; i += 2) { y0 = Math.min(y0, samples[i]); y1 = Math.max(y1, samples[i]); }
    const band = new Float32Array(BANDS), bh = (y1 - y0) / BANDS || 1;
    for (let i = 0; i < samples.length; i += 2) { const b = Math.min(BANDS - 1, Math.floor((samples[i] - y0) / bh)); band[b] = Math.max(band[b], samples[i + 1]); }
    const cy = (y0 + y1) / 2, ce = Math.cos(EL), se = Math.sin(EL), rings = [];
    band.forEach((rad, b) => { if (rad) rings.push([rad, y0 + b * bh - cy], [rad, y0 + (b + 1) * bh - cy]); });
    const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 200);
    // closest distance at which every ring point projects inside MARGIN of the frame, with the view nudged up or
    // down (s, along screen-up) so the top and bottom margins come out even
    const fit = (aspect) => {
      const tv = Math.tan((camera.fov * Math.PI) / 360), th = tv * aspect, pts = [];
      for (const [rad, y] of rings) for (let k = 0; k < 48; k++) {
        const a = (k / 48) * TAU, x = rad * Math.cos(a), z = rad * Math.sin(a);
        pts.push([x, y * se + z * ce, y * ce - z * se]); // across, along the view, screen-up
      }
      let d = 0, s = 0;
      for (let i = 0; i < 6; i++) {
        d = 0;
        for (const [x, depth, up] of pts) d = Math.max(d, depth + Math.abs(x) / (th * MARGIN), depth + Math.abs(up - s) / (tv * MARGIN));
        let lo = Infinity, hi = -Infinity;
        for (const [, depth, up] of pts) { const n = (up - s) / ((d - depth) * tv); lo = Math.min(lo, n); hi = Math.max(hi, n); }
        s += ((lo + hi) / 2) * d * tv;
      }
      return { d, s };
    };
    const resize = () => {
      const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
      renderer.setSize(w, h, false); camera.aspect = w / h;
      const { d, s } = fit(camera.aspect), ty = cy + s * ce, tz = -s * se; // target, moved s along screen-up
      camera.position.set(0, ty + d * se, tz + d * ce); camera.lookAt(0, ty, tz); camera.updateProjectionMatrix();
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
