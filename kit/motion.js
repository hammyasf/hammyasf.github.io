// felt kit motion: scroll reveals. View-transition wiring lives in the classic kit/transitions.js (render-blocking, in <head>).
// morphNameFor / navDirection are re-exported from it so there is one source of truth.
export const morphNameFor = (...a) => globalThis.feltTransitions.morphNameFor(...a);
export const navDirection = (...a) => globalThis.feltTransitions.navDirection(...a);

export function initMotion({ reduced = false, root = document } = {}) {
  const reveals = [...root.querySelectorAll('.reveal:not(.tool-ui .reveal)')];
  if (reduced) { reveals.forEach((el) => el.classList.add('in')); return; }

  try {
    const io = new IntersectionObserver((entries) => {
      let n = 0;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.style.setProperty('--delay', `${n++ * 60}ms`);
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }, { threshold: 0.12 });
    // already on screen: show now, no animation, so nothing hides then fades in
    const vh = root.defaultView?.innerHeight ?? root.documentElement.clientHeight ?? 0;
    const rest = [];
    for (const el of reveals) {
      const r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) el.classList.add('in', 'reveal-now'); else rest.push(el);
    }
    rest.forEach((el) => io.observe(el));
    root.documentElement.classList.add('motion-ready'); // only after setup worked: content stays visible otherwise
  } catch { /* leave reveals visible */ }
}
