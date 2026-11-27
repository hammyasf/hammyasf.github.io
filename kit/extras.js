// The hidden extras, sewn in felt: command palette, terminal, cheat sheet, achievement toasts, the Matrix
// (felt letters raining down), the Konami code and the bug hunt. Loaded lazily by kit/site.js, which calls run().
// Styles live in felt.css under "extras". Palette, terminal, cheat sheet and bug hunt are native <dialog class="modal">s:
// showModal() moves focus in, Esc closes, and the browser hands focus back to whatever opened them.
import { createAchievements } from './achievements.js';
import { runCommand } from './terminal.js';

const D = document;
const EMAIL = 'playcivil@gmail.com';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const PLUSH = ['var(--coral)', 'var(--butter)', 'var(--leaf)', '#7fa8d6', 'var(--berry)', 'var(--green)']; // sky, a shade deeper to show on cream
const pick = (a) => a[Math.floor(Math.random() * a.length)];
let store = null;
try { store = localStorage; } catch { /* private mode: achievements last for this visit */ }
const ach = createAchievements(store);

function el(tag, cls, text) {
  const e = D.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function dialog(cls, label, html) {
  const d = el('dialog', `modal ${cls}`);
  d.setAttribute('aria-label', label);
  d.innerHTML = html;
  // a click on the blurred backdrop (outside the dialog's box) closes it
  d.addEventListener('click', (e) => {
    const r = d.getBoundingClientRect();
    if (e.target === d && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) d.close();
  });
  D.body.append(d);
  return d;
}
const once = (fn) => { let v; return () => (v ??= fn()); };

/* ---------- toasts ---------- */
// Its own live region, a manual popover so it shows above an open dialog (both live in the top layer).
const toastEl = el('div', 'toast');
toastEl.setAttribute('role', 'status');
toastEl.popover = 'manual';
D.body.append(toastEl);
let toastT, toastReady = false;
setTimeout(() => { toastReady = true; }, 150); // a live region filled the instant it is inserted may go unannounced
function toast(strong, text) {
  if (!toastReady) { setTimeout(() => toast(strong, text), 150); return; }
  clearTimeout(toastT);
  // re-raise every time, so it lands above a dialog opened since the last toast
  try { toastEl.hidePopover(); toastEl.showPopover(); } catch { /* no popover support: still shows, under dialogs */ }
  toastEl.replaceChildren(el('b', '', strong), ` ${text}`);
  void toastEl.offsetWidth; // start the spring from the hidden pose
  toastEl.classList.add('on');
  toastT = setTimeout(() => {
    toastEl.classList.remove('on');
    toastT = setTimeout(() => { toastEl.replaceChildren(); try { toastEl.hidePopover(); } catch { /* fine */ } }, 450);
  }, 2800);
}
function unlock(id) {
  if (!ach.unlock(id)) return false;
  const a = ach.list().find((x) => x.id === id);
  toast('Achievement unlocked', a.label);
  return true;
}

/* ---------- command palette ---------- */
const ITEMS = [
  ['Home, the world', 'Go', '/index.html'], ['Writing / Blog', 'Go', '/blog.html'], ['The Lab (free tools)', 'Go', '/lab.html'],
  ['Open terminal', 'Tool', '#terminal'], ['Keyboard shortcuts', 'Tool', '#cheat'], ['View achievements', 'Tool', '#achievements'],
  ['Play the bug hunt', 'Tool', '#bughunt'], ['PDF to JPG tool', 'Tool', '/pdf-to-jpg.html'], ['Image converter tool', 'Tool', '/image-converter.html'],
  ['CodeWisp case study', 'Work', '/codewisp.html'], ['Shiba Inu case study', 'Work', '/shiba-inu.html'], ['OpenSpeaker case study', 'Work', '/openspeaker.html'],
  ['GatheredHere case study', 'Work', '/gatheredhere.html'], ['ElasticSwap case study', 'Work', '/elasticswap.html'], ['Koji case study', 'Work', '/koji.html'],
  ['Aftertutor case study', 'Work', '/aftertutor.html'],
  ['AI & agents', 'Topic', '/ai.html'], ['Web3 & on-chain', 'Topic', '/web3.html'], ['Full-stack & performance', 'Topic', '/full-stack.html'],
  ['Game dev', 'Topic', '/game-dev.html'], ['Career & building in public', 'Topic', '/career.html'],
  ['Hire an AI engineer', 'Hire', '/hire-ai-engineer.html'], ['Hire a senior Web3 engineer', 'Hire', '/hire-senior-web3-engineer.html'],
  ['Hire a freelance DeFi developer', 'Hire', '/hire-freelance-defi-developer.html'], ['Hire a remote full-stack engineer', 'Hire', '/hire-remote-fullstack-engineer.html'],
  ['Download resume', 'File', '/Harman-Kamboj-Resume.pdf'], ['Copy email address', 'Action', '#email'], ['Email Harman', 'Action', `mailto:${EMAIL}`],
  ['GitHub profile', 'Link', 'https://github.com/hammyasf'], ['LinkedIn profile', 'Link', 'https://linkedin.com/in/hammyasf'],
].map(([t, g, to]) => ({ t, g, to }));
const TINT = { Go: 'var(--sky)', Tool: 'var(--butter)', Work: 'var(--leaf)', Topic: 'var(--mint)', Hire: '#f9d3c9', File: 'var(--sand)', Action: '#f6d6e4', Link: 'var(--sand)' };

const palette = once(() => {
  const d = dialog('xpal', 'Command menu', `
    <input class="field" type="text" autofocus role="combobox" aria-expanded="true" aria-controls="xpal-list" aria-autocomplete="list"
      aria-label="Type a command or jump to a page" placeholder="Type a command or jump to…" autocomplete="off" spellcheck="false">
    <div class="xpal__list" id="xpal-list" role="listbox" aria-label="Commands"></div>
    <p class="xfoot" aria-hidden="true"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> choose</span><span><kbd>esc</kbd> close</span></p>`);
  const inp = d.querySelector('input'), list = d.querySelector('[role=listbox]');
  let shown = ITEMS, sel = 0;
  const mark = () => {
    [...list.children].forEach((r, i) => r.setAttribute('aria-selected', i === sel));
    const cur = list.children[sel];
    if (cur?.id) { inp.setAttribute('aria-activedescendant', cur.id); cur.scrollIntoView({ block: 'nearest' }); } else inp.removeAttribute('aria-activedescendant');
  };
  const render = () => {
    const q = inp.value.trim().toLowerCase();
    shown = q ? ITEMS.filter((it) => `${it.t} ${it.g}`.toLowerCase().includes(q)) : ITEMS;
    sel = 0;
    list.replaceChildren(...shown.map((it, i) => {
      const r = el('div', 'xrow');
      r.id = `xpal-${i}`;
      r.setAttribute('role', 'option');
      const tag = el('small', '', it.g);
      tag.style.setProperty('--g', TINT[it.g]);
      r.append(el('span', '', it.t), tag);
      r.onpointermove = () => { if (sel !== i) { sel = i; mark(); } };
      r.onclick = () => choose(it);
      return r;
    }));
    if (!shown.length) list.append(el('p', 'xpal__none', 'No matches. Try “work” or “hire”.'));
    mark();
  };
  const choose = (it) => {
    if (!it) return;
    d.close();
    if (it.to[0] === '#') run(it.to.slice(1));
    else if (/^https?:/.test(it.to)) window.open(it.to, '_blank', 'noopener');
    else location.href = it.to;
  };
  inp.addEventListener('input', render);
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sel = Math.max(0, Math.min(shown.length - 1, sel + (e.key === 'ArrowDown' ? 1 : -1)));
      mark();
    } else if (e.key === 'Enter') { e.preventDefault(); choose(shown[sel]); }
  });
  d.reset = () => { inp.value = ''; render(); };
  return d;
});

/* ---------- terminal ---------- */
const terminal = once(() => {
  const d = dialog('xterm', 'Terminal', `
    <div class="xterm__bar">
      <button type="button" class="xbtn" style="--b:var(--coral)" aria-label="Close terminal"></button><i class="xbtn" style="--b:var(--butter)"></i><i class="xbtn" style="--b:var(--leaf)"></i>
      <span>harman@portfolio: ~</span>
    </div>
    <div class="xterm__out" role="log" aria-live="polite"></div>
    <label class="xterm__line"><span aria-hidden="true">❯</span><span class="sr-only">Terminal command</span>
      <input type="text" autofocus autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go"></label>`);
  const out = d.querySelector('.xterm__out'), inp = d.querySelector('input');
  d.querySelector('button').onclick = () => d.close();
  const hist = [];
  let hi = 0;
  d.print = (text, cls) => {
    const line = el('div', cls, text);
    out.append(line);
    out.scrollTop = out.scrollHeight;
    return line;
  };
  const exec = (raw) => {
    const echo = d.print('', 'xterm__echo');
    echo.append(el('span', 'a', '❯ '), raw);
    const r = runCommand(raw, { achievements: ach });
    if (r.out) d.print(r.out);
    const later = (fn) => setTimeout(fn, 400);
    switch (r.action) {
      case 'clear': out.replaceChildren(); break;
      case 'close': setTimeout(() => d.close(), 200); break;
      case 'email': copyEmail((ok) => { if (!ok) d.print("the clipboard said no. run 'contact' instead.", 'm'); }); break;
      case 'gh': gh(d.print); break;
      case 'go': later(() => { location.href = r.arg; }); break;
      case 'open': window.open(r.arg, '_blank', 'noopener'); break;
      case 'matrix': case 'bughunt': case 'palette': later(() => { d.close(); run(r.action); }); break;
    }
  };
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const v = inp.value;
      inp.value = '';
      if (v.trim()) hist.push(v);
      hi = hist.length;
      exec(v);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      hi = Math.max(0, Math.min(hist.length, hi + (e.key === 'ArrowUp' ? -1 : 1)));
      inp.value = hist[hi] ?? '';
    }
  });
  d.print("Harman Kamboj — portfolio shell. Type 'help' for commands.\n", 'm');
  return d;
});

function gh(print) {
  fetch('https://api.github.com/users/hammyasf/repos?sort=pushed&per_page=6')
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((repos) => {
      if (!Array.isArray(repos) || !repos.length) return print('no public repos found', 'm');
      for (const x of repos.slice(0, 6)) {
        const line = print('');
        line.append(el('span', 'a', x.name), '  ', el('span', 'm', x.language || ''));
      }
    })
    .catch(() => print('could not reach github', 'm'));
}

function copyEmail(done) {
  Promise.resolve().then(() => navigator.clipboard.writeText(EMAIL)).then(() => done(true), () => done(false));
}

/* ---------- cheat sheet ---------- */
const cheat = once(() => {
  const rows = [['Command menu', '⌘K', 'Ctrl K'], ['Terminal', '`'], ['This cheat sheet', '?'], ['Home', 'g', 'h'], ['Writing', 'g', 'b'], ['The Lab', 'g', 'l'], ['Close anything', 'esc']];
  const d = dialog('xcheat', 'Keyboard shortcuts', `<h2>Keyboard shortcuts</h2><dl class="xkeys">${rows.map(([what, ...keys]) =>
    `<div><dt>${what}</dt><dd>${keys.map((k) => `<kbd>${k}</kbd>`).join(what === 'Command menu' ? ' or ' : ' then ')}</dd></div>`).join('')}</dl>
    <p class="xcheat__hint">There is one more, an old one. Up, up…</p>
    <form method="dialog"><button class="btn">Got it</button></form>`);
  return d;
});

/* ---------- matrix and konami: felt pieces over the page ---------- */
function layer() {
  const l = el('div', 'xrain');
  l.setAttribute('aria-hidden', 'true');
  D.body.append(l);
  return l;
}
const removeWhenDone = (l, anims) => Promise.all(anims.map((a) => a.finished)).finally(() => l.remove());

function matrix() {
  unlock('matrix');
  const l = layer(), calm = reduced();
  // columns of felt letters, each a short trail of 3-5 that tumble down one after another, like the film's rain
  const cols = Math.max(8, Math.round(innerWidth / 46)), anims = [];
  for (let c = 0; c < cols; c++) {
    const trail = calm ? 1 : 3 + Math.floor(Math.random() * 3), start = Math.random() * 2600, speed = 2200 + Math.random() * 1600, col = pick(PLUSH);
    for (let t = 0; t < trail; t++) {
      const g = el('i', '', pick([...'HARMAN01{}<>/=;*+KAMBOJ']));
      g.style.cssText = `left:${((c + 0.2 + Math.random() * 0.4) / cols) * 100}%;--s:${26 + Math.random() * 22}px;--c:${t ? pick(PLUSH) : col}`;
      l.append(g);
      if (calm) { g.style.top = `${5 + Math.random() * 85}%`; continue; }
      const spin = (Math.random() - 0.5) * 100;
      anims.push(g.animate([
        { transform: `translateY(-14vh) rotate(${-spin / 3}deg)` },
        { transform: `translateY(112vh) rotate(${spin}deg)` },
      ], { duration: speed, delay: start + t * 260, easing: 'cubic-bezier(.45,.05,.75,.7)', fill: 'both' }));
    }
  }
  // reduced motion: a still scatter of letters that fades in and out
  if (calm) anims.push(l.animate([{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 2800, fill: 'both' }));
  removeWhenDone(l, anims);
}

function konami() {
  if (!unlock('konami')) toast('↑↑↓↓←→←→BA', 'You know the code. Now go hire me.');
  if (reduced()) return;
  const l = layer(), anims = [];
  for (let i = 0; i < 44; i++) {
    const b = el('b');
    const s = 14 + Math.random() * 16, a = Math.random() * Math.PI * 2, r = 110 + Math.random() * 260;
    const x = Math.cos(a) * r, y = Math.sin(a) * r * 0.75 - 60, spin = (Math.random() - 0.5) * 540;
    b.style.cssText = `--s:${s}px;--c:${pick(PLUSH)};border-radius:${pick(['50%', '30%', '50% 50% 50% 0'])}`;
    l.append(b);
    anims.push(b.animate([
      { transform: 'translate(-50%,-50%) scale(0)', easing: 'cubic-bezier(.15,.8,.3,1)' }, // bursts out
      { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${spin / 2}deg) scale(1)`, opacity: 1, offset: 0.3, easing: 'ease-in' }, // then falls
      { transform: `translate(calc(-50% + ${x * 1.2}px), calc(-50% + ${y + 380}px)) rotate(${spin}deg) scale(.8)`, opacity: 0 },
    ], { duration: 1500 + Math.random() * 700, fill: 'both' }));
  }
  removeWhenDone(l, anims);
}

/* ---------- dispatcher ---------- */
const toggle = (d, onOpen) => {
  if (d.open) return d.close();
  d.showModal();
  onOpen?.(); // after, so its toast lands above the dialog
};
export function run(action) {
  switch (action) {
    case 'palette': return toggle(palette(), () => { palette().reset(); unlock('explorer'); });
    case 'terminal': return toggle(terminal(), () => unlock('terminal'));
    case 'achievements': {
      const t = terminal();
      if (!t.open) run('terminal');
      t.print(ach.text());
      return;
    }
    case 'cheat': return toggle(cheat());
    case 'matrix': return matrix();
    case 'konami': return konami();
    case 'email': return copyEmail((ok) => toast(ok ? 'Copied' : 'Hmm', ok ? 'my email is on your clipboard.' : 'the clipboard said no. Try “Email Harman”.'));
    case 'bughunt': return import('./bughunt.js').then((m) => m.openBugHunt({ toast, onPlay: () => unlock('gamer') }));
  }
}
