// Share card shown when the quest completes: a canvas image to download plus share links.
// X and LinkedIn cannot attach an in-browser image, so their links share the page (its preview is share.jpg).
const SITE = 'https://hammyasf.github.io/';
const MAIL = 'mailto:playcivil@gmail.com?subject=Recruiting%20Harman';

export async function openShare({ portraitUrl }) {
  let dlg = document.getElementById('share-dlg');
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.id = 'share-dlg';
    dlg.className = 'panel share';
    dlg.setAttribute('aria-labelledby', 'share-h');
    document.body.append(dlg);
  }
  const text = encodeURIComponent('I just recruited Harman Kamboj, an Applied AI and full-stack engineer, through a guide that runs in your browser.');
  dlg.innerHTML = `
    <p class="panel__label" id="share-h">Party member found</p>
    <canvas width="1200" height="630" class="share__card" role="img" aria-label="Share card: I recruited Harman Kamboj, Applied AI and full-stack engineer"></canvas>
    <div class="share__actions">
      <a class="btn btn--gold" href="${MAIL}">Recruit Harman</a>
      <button class="btn" type="button" data-dl>Download card</button>
      <a class="btn" href="https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(SITE)}" target="_blank" rel="noopener">Share on X</a>
      <a class="btn" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SITE)}" target="_blank" rel="noopener">Share on LinkedIn</a>
      <button class="btn" type="button" data-close>Close</button>
    </div>`;
  const canvas = dlg.querySelector('canvas');
  await draw(canvas, portraitUrl);
  dlg.querySelector('[data-dl]').addEventListener('click', () => canvas.toBlob((b) => {
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(b), download: 'recruited-harman.png' });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, 'image/png'));
  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  dlg.showModal();
}

async function draw(canvas, portraitUrl) {
  const c = canvas.getContext('2d');
  await document.fonts?.ready;
  const g = c.createLinearGradient(0, 0, 1200, 630);
  g.addColorStop(0, '#0d1020'); g.addColorStop(1, '#1b2140');
  c.fillStyle = g; c.fillRect(0, 0, 1200, 630);
  c.strokeStyle = '#f4c95d'; c.lineWidth = 6; c.strokeRect(24, 24, 1152, 582);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = portraitUrl; });
    c.imageSmoothingEnabled = false;
    c.fillStyle = '#f4c95d'; c.fillRect(80, 150, 330, 330);
    c.drawImage(img, 85, 155, 320, 320);
  } catch { /* card still works without the portrait */ }
  c.fillStyle = '#f4c95d'; c.font = '500 30px "Pixelify Sans", monospace';
  c.fillText('PARTY MEMBER FOUND', 470, 210);
  c.fillStyle = '#eef1fa'; c.font = '700 64px Manrope, sans-serif';
  c.fillText('I recruited', 470, 290);
  c.fillText('Harman Kamboj', 470, 365);
  c.fillStyle = '#c9cfe4'; c.font = '500 30px Manrope, sans-serif';
  c.fillText('Applied AI and full-stack engineer', 470, 420);
  c.fillStyle = '#f4c95d'; c.font = '400 26px "Pixelify Sans", monospace';
  c.fillText('hammyasf.github.io', 470, 500);
}
