// Reading progress on blog posts: the knit row in .read-progress fills as the post body scrolls past.
// It never transitions, so it tracks the scroll position without animating between values (reduced motion too).
// Hidden in the markup; shown only once this runs, so no JS means no empty bar.

// 0 with the body's top at or below the top of the screen, 1 once its end is in view
export const readProgress = (top, height, vh) => {
  const span = height - vh;
  return span > 0 ? Math.min(1, Math.max(0, -top / span)) : 1;
};

const bar = globalThis.document?.querySelector('.read-progress');
const body = globalThis.document?.querySelector('.post-body');
if (bar && body) {
  let queued = false;
  const update = () => {
    queued = false;
    const r = body.getBoundingClientRect();
    bar.style.setProperty('--p', readProgress(r.top, r.height, innerHeight).toFixed(4));
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue, { passive: true });
  update();
  bar.hidden = false;
}
