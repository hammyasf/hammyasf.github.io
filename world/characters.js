// The plush characters: Harman (from his photos) and Scout, the guide.
import * as THREE from 'three';
import { V3, PI, TAU, R, felt, plastic, glow, tex, mesh, softBox, rod } from './felt.js';

// Harman, as a plush: curly top with faded sides, full dark beard, sunglasses,
// mustard polo, dark jeans, white sneakers, watch on the left wrist, red thread on the right.
const SKIN = '#d9a07a', HAIR = '#1f1918';
export function buildHarman() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const polo = felt('#dca22a', { rep: 7, knit: true }), jeans = felt('#2f3d5c', { rep: 2 }), skin = felt(SKIN, { rep: 2 });
  const hair = felt(HAIR, { rep: 2 }), fade = felt('#3e3029', { rep: 3 }), beardMat = new THREE.MeshPhysicalMaterial({ color: '#2e221c', map: tex('feltC', 5), bumpMap: tex('feltB', 5), bumpScale: 3, roughness: 1, sheen: 0.6, transparent: true, opacity: 0.92, depthWrite: false });
  const tipping = felt('#efe2c4', { rep: 1 }), metal = new THREE.MeshStandardMaterial({ color: '#cfd3d8', metalness: 0.85, roughness: 0.3 });
  // legs: dark jeans, white sneakers
  const legs = [-1, 1].map((s) => {
    const hip = new THREE.Group(); hip.position.set(s * 0.15, 0.42, 0); body.add(hip);
    mesh(new THREE.CapsuleGeometry(0.12, 0.2, 4, 12), jeans, 0, -0.2, 0, hip);
    mesh(new THREE.SphereGeometry(0.13, 18, 12), felt('#f4f1ea', { rep: 1 }), 0, -0.35, 0.05, hip).scale.set(1, 0.6, 1.4);
    mesh(new THREE.SphereGeometry(0.135, 18, 12), plastic('#ffffff', 0.6), 0, -0.39, 0.05, hip).scale.set(1.02, 0.25, 1.45);
    return hip;
  });
  // torso: mustard polo with collar, placket and buttons
  const torso = mesh(new THREE.CapsuleGeometry(0.32, 0.26, 6, 20), polo, 0, 0.75, 0, body); torso.scale.set(1.06, 1, 0.88);
  const collar = mesh(new THREE.TorusGeometry(0.16, 0.035, 10, 28), polo, 0, 1.07, 0.02, body); collar.rotation.x = PI / 2 - 0.25;
  mesh(new THREE.CircleGeometry(0.11, 20), felt('#1c1c20', { rep: 1 }), 0, 1.06, 0.17, body, false).rotation.x = -0.5;
  for (const s of [-1, 1]) { const f = mesh(softBox(0.15, 0.03, 0.12, 0.012), polo, s * 0.085, 1.05, 0.2, body); f.rotation.set(-0.6, s * 0.5, s * 0.35); }
  mesh(softBox(0.06, 0.17, 0.02, 0.008), polo, 0, 0.95, 0.285, body).rotation.x = -0.12;
  for (const y of [0.99, 0.92]) mesh(new THREE.SphereGeometry(0.014, 8, 6), plastic('#efe2c4', 0.3), 0, y, 0.3, body, false);
  // arms: short sleeves with tipping; watch on his left wrist, red thread on his right
  const arms = [-1, 1].map((s) => {
    const sh = new THREE.Group(); sh.position.set(s * 0.36, 0.98, 0); body.add(sh);
    mesh(new THREE.CapsuleGeometry(0.105, 0.08, 4, 12), polo, 0, -0.07, 0, sh);
    const tip = mesh(new THREE.TorusGeometry(0.1, 0.014, 6, 20), tipping, 0, -0.15, 0, sh, false); tip.rotation.x = PI / 2;
    mesh(new THREE.CapsuleGeometry(0.075, 0.15, 4, 12), skin, 0, -0.24, 0, sh);
    mesh(new THREE.SphereGeometry(0.088, 16, 12), skin, 0, -0.38, 0, sh);
    if (s > 0) { // his left: smartwatch
      const band = mesh(new THREE.TorusGeometry(0.078, 0.022, 8, 20), metal, 0, -0.31, 0, sh, false); band.rotation.x = PI / 2;
      mesh(softBox(0.06, 0.075, 0.03, 0.01), plastic('#16161a', 0.15), 0.07, -0.31, 0, sh, false).rotation.y = PI / 2;
    } else { // his right: red thread
      const th = mesh(new THREE.TorusGeometry(0.077, 0.009, 6, 20), felt('#d8343a', { rep: 1 }), 0, -0.31, 0, sh, false); th.rotation.x = PI / 2;
    }
    sh.rotation.z = s * 0.16;
    return sh;
  });
  // head
  const head = new THREE.Group(); head.position.y = 1.38; body.add(head);
  mesh(new THREE.SphereGeometry(0.42, 36, 24), skin, 0, 0, 0, head);
  // high fade: dark just under the curls, fading to skin above the ears
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.424, 36, 8, PI / 2 + PI * 0.28, PI * 1.44, PI * 0.18, PI * 0.12), fade));
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.422, 36, 8, PI / 2 + PI * 0.28, PI * 1.44, PI * 0.3, PI * 0.08), felt('#9c7660', { rep: 3 })));
  // curly top: a crown of felt pom-pom curls, fuller at the front
  const curls = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 10), hair, 46), co = new THREE.Object3D();
  curls.castShadow = true; curls.receiveShadow = true; head.add(curls);
  for (let i = 0; i < 46; i++) {
    const th = Math.sqrt(R()) * PI * 0.27, ph = R() * TAU, front = Math.max(0, Math.sin(ph)), r = 0.4 + front * 0.05;
    co.position.set(-Math.cos(ph) * Math.sin(th) * r, Math.cos(th) * r + 0.03 + front * 0.03, Math.sin(ph) * Math.sin(th) * r + 0.02);
    co.scale.setScalar(0.075 + R() * 0.045); co.rotation.set(R() * 3, R() * 3, 0); co.updateMatrix(); curls.setMatrixAt(i, co.matrix);
  }
  // light, groomed beard: painted as a mask on a shell over the lower face, so it can follow
  // a real beard line: sideburns from the fade, a clean cheek line, moustache joined to the chin
  {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256); g.filter = 'blur(1.2px)'; g.fillStyle = '#b4b4b4';
    g.beginPath(); g.moveTo(12, 30); g.lineTo(42, 30);
    g.quadraticCurveTo(46, 88, 88, 104); g.quadraticCurveTo(108, 94, 128, 97);
    g.quadraticCurveTo(148, 94, 168, 104); g.quadraticCurveTo(210, 88, 214, 30); g.lineTo(244, 30);
    g.lineTo(244, 190); g.quadraticCurveTo(204, 246, 128, 248); g.quadraticCurveTo(52, 246, 12, 190); g.closePath(); g.fill();
    g.fillStyle = '#fff'; // fuller moustache and chin
    // canvas y: nose ≈ 85, moustache ≈ 122, mouth ≈ 146, chin ≈ 240
    g.beginPath(); g.moveTo(98, 134); g.quadraticCurveTo(104, 114, 128, 116); g.quadraticCurveTo(152, 114, 158, 134); g.quadraticCurveTo(128, 124, 98, 134); g.fill();
    g.fillStyle = '#000'; g.beginPath(); g.ellipse(128, 145, 17, 2.5, 0, 0, TAU); g.fill(); // mouth line
    const mask = new THREE.CanvasTexture(c);
    beardMat.alphaMap = mask;
    // shell spans the temples (top of canvas) to under the jaw (bottom), ±0.6π around the face
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.4235, 48, 24, PI / 2 - PI * 0.6, PI * 1.2, PI * 0.36, PI * 0.42), beardMat));
  }
  // a thin silver chain, as in the photos
  { const ch = mesh(new THREE.TorusGeometry(0.17, 0.008, 6, 40), metal, 0, 1.02, 0.05, body, false); ch.rotation.x = PI / 2 - 0.45; }
  // ears, nose, brows
  for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.075, 12, 10), skin, s * 0.42, -0.01, 0, head).scale.set(0.5, 1, 1);
  mesh(new THREE.SphereGeometry(0.06, 14, 10), felt('#c98a66', { rep: 1 }), 0, 0.0, 0.43, head).scale.set(1, 1.1, 1);
  for (const s of [-1, 1]) { const b = mesh(new THREE.CapsuleGeometry(0.026, 0.1, 3, 8), hair, s * 0.14, 0.18, 0.39, head, false); b.rotation.z = PI / 2 - s * 0.12; }
  // button eyes sit behind the sunglasses
  const eyes = [-1, 1].map((s) => { const e = mesh(new THREE.SphereGeometry(0.05, 16, 12), plastic('#121014', 0.12), s * 0.14, 0.07, 0.39, head, false); e.scale.z = 0.5; return e; });
  // sunglasses: dark glossy lenses, thin metal frame
  const lensMat = new THREE.MeshPhysicalMaterial({ color: '#1a2230', roughness: 0.04, metalness: 0.4, clearcoat: 1, clearcoatRoughness: 0.02 });
  for (const s of [-1, 1]) {
    const lens = mesh(softBox(0.2, 0.13, 0.025, 0.04), lensMat, s * 0.13, 0.07, 0.43, head, false); lens.rotation.y = s * 0.24;
    rod(new V3(s * 0.225, 0.11, 0.39), new V3(s * 0.415, 0.07, 0.02), 0.008, metal, head);
  }
  rod(new V3(-0.05, 0.1, 0.445), new V3(0.05, 0.1, 0.445), 0.009, metal, head);
  root.userData = { body, legs, arms, head, eyes, torso };
  return root;
}
export function buildScout() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const cloak = felt('#4f7d5c', { rep: 2 });
  mesh(new THREE.ConeGeometry(0.48, 1.05, 28), cloak, 0, 0.52, 0, body);
  const scarf = mesh(new THREE.TorusGeometry(0.27, 0.09, 12, 28), felt('#e8604c', { rep: 1, knit: true }), 0, 0.86, 0, body); scarf.rotation.x = PI / 2;
  const tailEnd = mesh(new THREE.CapsuleGeometry(0.07, 0.3, 4, 10), felt('#e8604c', { rep: 1, knit: true }), 0.18, 0.66, 0.2, body); tailEnd.rotation.z = 0.3;
  const head = new THREE.Group(); head.position.y = 1.1; body.add(head);
  mesh(new THREE.SphereGeometry(0.36, 28, 18), cloak, 0, 0, 0, head);
  const hood = mesh(new THREE.ConeGeometry(0.26, 0.5, 20), cloak, 0, 0.36, -0.08, head); hood.rotation.x = -0.5;
  mesh(new THREE.SphereGeometry(0.27, 24, 16), felt('#26232e', { rep: 1 }), 0, -0.02, 0.14, head).scale.set(1, 0.9, 0.7);
  const eyes = [-1, 1].map((s) => mesh(new THREE.SphereGeometry(0.045, 12, 10), glow('#fff2b0', 3.5), s * 0.09, 0.02, 0.33, head, false));
  // lantern on a stick
  const arm = new THREE.Group(); arm.position.set(0.32, 0.72, 0.12); body.add(arm);
  mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8), felt('#86573a', { rep: 1 }), 0.12, 0.2, 0.1, arm).rotation.z = -0.6;
  const lantern = new THREE.Group(); lantern.position.set(0.36, 0.5, 0.1); arm.add(lantern);
  mesh(new THREE.TorusGeometry(0.05, 0.01, 6, 12), plastic('#2b2b30'), 0, 0.02, 0, lantern);
  const cage = new THREE.Group(); cage.position.y = -0.14; lantern.add(cage);
  mesh(new THREE.SphereGeometry(0.08, 16, 12), glow('#ffcc6e', 5), 0, 0, 0, cage, false);
  mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.04, 12), plastic('#2b2b30'), 0, 0.1, 0, cage);
  mesh(new THREE.CylinderGeometry(0.09, 0.06, 0.04, 12), plastic('#2b2b30'), 0, -0.1, 0, cage);
  const ll = new THREE.PointLight('#ffb85c', 1.2, 4, 2); cage.add(ll);
  root.userData = { body, head, eyes, lantern, cage };
  return root;
}
