// The page's module entry on every converted page (replaces the old enhance.js).
// Head contract: felt.css, then the classic transitions.js, then <script type="module" src="/kit/site.js">.
// Loads motion now, the analytics beacon, a menu button, and the extras (palette, terminal, matrix, konami,
// bug hunt) lazily: on first idle, or on the key that wants them. Any element with data-extra="<action>" runs it.
import { initMotion } from './motion.js';

initMotion({ reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, root: document });

// Cloudflare analytics, as enhance.js had it. Not on local dev hosts: there it only counts us and its CORS error fails smoke.
if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
  const beacon = document.createElement('script');
  beacon.defer = true;
  beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  beacon.setAttribute('data-cf-beacon', JSON.stringify({ token: '67319da24fb341b6bc63d535a3edda18' })); // gitleaks:allow (public site token, already in the live enhance.js)
  document.head.appendChild(beacon);
}

let extras = null;
const load = () => (extras ??= import('./extras.js').catch((e) => { extras = null; throw e; }));
// the trigger's own action runs once extras are in, so the first keypress is never lost
export const run = (action) => load().then((m) => m.run(action)).catch(() => {});
(window.requestIdleCallback ?? ((f) => setTimeout(f, 1200)))(() => load().catch(() => {}), { timeout: 2500 });

const fab = document.createElement('button');
fab.type = 'button';
fab.className = 'btn xfab';
fab.dataset.extra = 'palette';
fab.setAttribute('aria-keyshortcuts', 'Meta+K Control+K');
fab.innerHTML = '<span aria-hidden="true">✦</span> Menu <kbd>⌘K</kbd>';
document.body.append(fab);

document.addEventListener('click', (e) => {
  const t = e.target.closest?.('[data-extra]');
  if (t) { e.preventDefault(); run(t.dataset.extra); }
});

const KEYS = { '`': 'terminal', '?': 'cheat' };
const GO = { h: '/index.html', b: '/blog.html', l: '/lab.html' }; // "g then h" etc.
const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
let k = 0, gAt = 0;
addEventListener('keydown', (e) => {
  const t = e.target;
  if (!e.key || t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
  const key = e.key.toLowerCase();
  if ((e.metaKey || e.ctrlKey) && key === 'k') { e.preventDefault(); run('palette'); return; }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  k = key === KONAMI[k] ? k + 1 : key === KONAMI[0] ? 1 : 0;
  if (k === KONAMI.length) { k = 0; run('konami'); return; }
  if (GO[key] && Date.now() - gAt < 800) { e.preventDefault(); location.href = GO[key]; return; }
  gAt = key === 'g' ? Date.now() : 0;
  if (KEYS[e.key]) { e.preventDefault(); run(KEYS[e.key]); }
});
