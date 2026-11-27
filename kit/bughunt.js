// Bug hunt: the old homepage's twenty-second canvas game (git 7de1afc, #play), now a felt modal.
// Felt ladybugs pop up on a mint felt lawn; tap them before they shrink away. Best score keeps its old key, bestBugs.
const D = document;
const LIFE = 1150, ROUND = 20000;
const BUGS = ['#e8604c', '#e86a9a', '#f2c14e']; // coral, berry, butter
const BITS = ['#e8604c', '#f2c14e', '#8fbf6a', '#cfe0f2', '#e86a9a'];
let dlg = null;
let still = false; // prefers-reduced-motion, read at each Start: no bursts, no pop or shrink; the game itself stays

export function openBugHunt({ toast, onPlay }) {
  if (!dlg) dlg = build(toast, onPlay);
  dlg.showModal();
  dlg.fit();
}

function build(toast, onPlay) {
  const d = D.createElement('dialog');
  d.className = 'modal xbug';
  d.setAttribute('aria-labelledby', 'xbug-h');
  d.innerHTML = `
    <h2 id="xbug-h">Bug hunt</h2>
    <div class="xbug__hud"><span class="chip">Score <b data-k="score">0</b></span><span class="chip">Best <b data-k="best">0</b></span><span class="chip">Time <b data-k="time">20</b>s</span></div>
    <div class="xbug__stage">
      <canvas tabindex="-1" aria-label="Bug hunt game: tap the felt bugs before they vanish"></canvas>
      <div class="xbug__over"><p aria-live="polite">Twenty seconds. Tap the felt bugs before they shrink away.</p><button class="btn hot" type="button" autofocus>Start ▸</button></div>
    </div>
    <form method="dialog" class="xbug__foot"><button class="btn">Close</button></form>`;
  D.body.append(d);
  const $ = (s) => d.querySelector(s);
  const cv = $('canvas'), g = cv.getContext('2d'), over = $('.xbug__over'), msg = $('.xbug__over p'), startBtn = $('.xbug__over .btn');
  const hud = { score: $('[data-k=score]'), best: $('[data-k=best]'), time: $('[data-k=time]') };
  const felt = new Image();
  let pattern = null;
  felt.onload = () => { pattern = g.createPattern(felt, 'repeat'); };
  felt.src = new URL('felt-texture.webp', import.meta.url).href;

  let W = 0, H = 0, bugs = [], bits = [], playing = false, score = 0, best = 0, spawnT = 0, spawnEvery = 820, lastTs = 0, endAt = 0;
  try { best = parseInt(localStorage.getItem('bestBugs') || '0', 10) || 0; } catch { /* private mode */ }
  hud.best.textContent = best;

  d.fit = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  addEventListener('resize', () => { if (d.open) d.fit(); });

  const spawn = (ts) => {
    const r = 18 + Math.random() * 12;
    bugs.push({ x: r + Math.random() * (W - 2 * r), y: r + 6 + Math.random() * (H - 2 * r - 12), r, born: ts, col: BUGS[Math.floor(Math.random() * BUGS.length)], tilt: (Math.random() - 0.5) * 1.2 });
  };
  const burst = (x, y, n, power) => {
    if (still) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * power;
      bits.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.5, life: 1, sz: 4 + Math.random() * 5, col: BITS[i % BITS.length], rot: Math.random() * 6 });
    }
  };

  function drawBug(b, now) {
    const age = Math.max(0, now - b.born), p = age / LIFE;
    // springs up (overshoots a little), then slowly shrinks as it gets ready to leave
    const grow = Math.min(1, age / 220), pop = 1 + Math.sin(grow * Math.PI) * 0.18;
    const r = still ? b.r : b.r * (grow < 1 ? grow * pop : 1 - 0.28 * p);
    g.save();
    g.translate(b.x, b.y);
    g.rotate(b.tilt);
    g.globalAlpha = 1 - 0.2 * p;
    g.fillStyle = 'rgba(84,46,30,.18)'; // soft shadow on the felt
    g.beginPath(); g.ellipse(0, r * 0.35, r * 1.02, r * 0.9, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2d2440'; // head
    g.beginPath(); g.arc(0, -r * 0.82, r * 0.42, 0, Math.PI * 2); g.fill();
    g.fillStyle = b.col; // body
    g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
    if (pattern) { g.globalAlpha *= 0.45; g.fillStyle = pattern; g.fill(); g.globalAlpha = 1 - 0.2 * p; }
    g.strokeStyle = '#2d2440'; g.lineWidth = Math.max(1.5, r * 0.08); // wing seam
    g.beginPath(); g.moveTo(0, -r); g.lineTo(0, r); g.stroke();
    g.fillStyle = '#2d2440'; // spots
    for (const [sx, sy, sr] of [[-0.45, -0.3, 0.17], [0.45, -0.3, 0.17], [-0.42, 0.38, 0.14], [0.42, 0.38, 0.14]]) {
      g.beginPath(); g.arc(sx * r, sy * r, sr * r, 0, Math.PI * 2); g.fill();
    }
    if (r > 8) { // the stitch
      g.setLineDash([3, 3]); g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,255,255,.7)';
      g.beginPath(); g.arc(0, 0, r - 4, 0, Math.PI * 2); g.stroke();
    }
    g.restore();
  }

  function frame(ts) {
    if (!playing) return;
    requestAnimationFrame(frame);
    const dt = ts - lastTs;
    lastTs = ts;
    hud.time.textContent = Math.ceil(Math.max(0, (endAt - ts) / 1000));
    spawnT += dt;
    if (spawnT >= spawnEvery) { spawnT = 0; spawn(ts); spawnEvery = Math.max(360, spawnEvery * 0.97); }
    g.clearRect(0, 0, W, H);
    bugs = bugs.filter((b) => ts - b.born <= LIFE);
    bugs.forEach((b) => drawBug(b, ts));
    stepBits(0.03);
    if (ts >= endAt) end();
  }

  function start() {
    onPlay?.();
    still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    d.fit();
    score = 0; bugs = []; bits = []; spawnEvery = 820; spawnT = 0;
    hud.score.textContent = 0;
    playing = true;
    lastTs = performance.now(); endAt = lastTs + ROUND;
    over.hidden = true;
    cv.focus();
    requestAnimationFrame(frame);
  }

  function end() {
    playing = false;
    if (score > best) {
      best = score;
      try { localStorage.setItem('bestBugs', best); } catch { /* private mode */ }
      hud.best.textContent = best;
      toast('New best', `${best} bugs. Nice.`);
      burst(W / 2, H / 2, 70, 7);
      const fade = () => { if (playing || !bits.length) return; g.clearRect(0, 0, W, H); stepBits(0.02); requestAnimationFrame(fade); };
      if (!still) requestAnimationFrame(fade);
    }
    msg.textContent = `Time! You caught ${score}. Best ${best}. Go again?`;
    startBtn.textContent = 'Play again ▸';
    over.hidden = false;
    startBtn.focus();
  }
  // felt bits: fall with a little gravity, spin, fade
  function stepBits(decay) {
    bits = bits.filter((q) => (q.life -= decay) > 0);
    for (const q of bits) {
      q.x += q.vx; q.y += q.vy; q.vy += 0.18; q.rot += 0.1;
      g.save(); g.globalAlpha = q.life; g.fillStyle = q.col; g.translate(q.x, q.y); g.rotate(q.rot);
      g.beginPath(); g.roundRect(-q.sz / 2, -q.sz / 2, q.sz, q.sz, 2); g.fill(); g.restore();
    }
  }

  cv.addEventListener('pointerdown', (e) => {
    if (!playing) return;
    const rect = cv.getBoundingClientRect(), mx = e.clientX - rect.left, my = e.clientY - rect.top;
    for (let i = bugs.length - 1; i >= 0; i--) {
      const b = bugs[i], dx = mx - b.x, dy = my - b.y;
      if (dx * dx + dy * dy <= (b.r + 8) ** 2) {
        bugs.splice(i, 1);
        hud.score.textContent = ++score;
        burst(b.x, b.y, 10, 4);
        return;
      }
    }
  });
  startBtn.addEventListener('click', start);
  d.addEventListener('close', () => {
    playing = false;
    bugs = []; bits = [];
    g.clearRect(0, 0, W, H);
    over.hidden = false;
  });
  d.addEventListener('click', (e) => {
    const r = d.getBoundingClientRect();
    if (e.target === d && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) d.close();
  });
  return d;
}
