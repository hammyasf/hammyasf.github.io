// The guide's tools. Each renders into the stage; the page is the agent's environment.
// All case text comes from cases.json and card text from facts.json: no copy lives here.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MAIL = 'mailto:playcivil@gmail.com?subject=Recruiting%20Harman';
const PRS = [246, 247, 248, 249, 253];

export function createTools({ stage, cases, quest, cardText, onCase = () => {}, onAchievement = () => {}, onClose = () => {} }) {
  const byId = new Map(cases.map((c) => [c.id, c]));
  let returnTo = null;

  // returnTo: a selector for where focus goes on close (the opener itself may be re-rendered away)
  const show = (html, label) => {
    stage.innerHTML = `<div class="stage__panel" role="region" aria-label="${esc(label)}" tabindex="-1">
      <button class="stage__close" type="button" aria-label="Close">Esc</button>${html}</div>`;
    stage.hidden = false;
    stage.dataset.open = 'true';
    stage.querySelector('.stage__close').addEventListener('click', close);
    stage.querySelector('.stage__panel').focus({ preventScroll: true });
    stage.scrollIntoView?.({ block: 'nearest' });
  };

  function close() {
    stage.dataset.open = 'false';
    stage.innerHTML = stage.dataset.idle || '';
    onClose();
    const target = returnTo && document.querySelector(returnTo);
    (target || document.querySelector('#choices .choice'))?.focus({ preventScroll: true });
    returnTo = null;
  }

  const caseHtml = (c) => {
    const pic = c.image
      ? `<img class="codex__shot" src="${c.image}" srcset="${c.image800} 800w, ${c.image} 1440w" sizes="(max-width: 900px) 92vw, 560px" alt="${esc(c.imageAlt)}" loading="lazy">`
      : c.logo
        ? `<img class="codex__logo" src="${c.logo}" alt="${esc(c.client)} logo" width="72" height="72" loading="lazy">`
        : `<p class="codex__name" aria-hidden="true">${esc(c.client.split(' (')[0])}</p>`;
    return `<article class="codex">
      <p class="codex__kind">Case file · completed quest</p>
      ${pic}
      <h3 class="codex__title">${esc(c.client)}</h3>
      <p class="codex__meta">${esc(c.role)} · ${esc(c.years)}</p>
      <ul class="codex__stack">${c.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      <ul class="codex__outcome">${c.outcome.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>
      ${c.page ? `<a class="codex__link" href="${c.page}">Read the full case</a>` : ''}
    </article>`;
  };

  const run = (tool, arg, back) => {
    returnTo = back || null;
    switch (tool) {
      case 'open_case': {
        const c = byId.get(arg);
        if (!c) return console.warn('unknown case', arg);
        show(caseHtml(c), `Case file: ${c.client}`);
        const r = quest.viewCase(arg);
        onCase(r);
        if (r.newAchievements.length) onAchievement(r.newAchievements);
        return;
      }
      case 'play_toy':
        if (arg === 'typed-by-hand') {
          show(`<article class="codex codex--toy"><p class="codex__kind">Side quest · runs live</p>
            <iframe class="toy-frame" src="https://typed-by-hand.codepost.dev/app/" title="Typed by Hand, live" loading="lazy"></iframe>
            <a class="codex__link" href="https://typed-by-hand.codepost.dev/">Open Typed by Hand</a></article>`, 'Typed by Hand');
        } else {
          show(`<article class="codex codex--toy"><p class="codex__kind">Side quest · Mac app</p>
            <img class="codex__shot" src="img/taxi-meter.jpg" srcset="img/taxi-meter-800.jpg 800w, img/taxi-meter.jpg 1440w" sizes="(max-width: 900px) 92vw, 560px" alt="Taxi Meter's page with its yellow and red fare display" loading="lazy">
            <p>${esc(cardText('side.taxi'))}</p>
            <a class="codex__link" href="https://taxi-meter.codepost.dev/">Open Taxi Meter</a></article>`, 'Taxi Meter');
        }
        onAchievement(quest.award('side-quests'));
        return;
      case 'show_pr':
        show(`<article class="codex"><p class="codex__kind">Side quest · merged upstream</p>
          <img class="codex__shot" src="img/pr246-43.jpg" srcset="img/pr246-43-800.jpg 800w, img/pr246-43.jpg 2214w" sizes="(max-width: 900px) 92vw, 560px" alt="Pull request 246 on Capgo's capacitor-native-purchases, marked Merged" loading="lazy">
          <p>${esc(cardText('side.prs'))}</p>
          <ul class="codex__prs">${PRS.map((n) => `<li><a href="https://github.com/Cap-go/capacitor-native-purchases/pull/${n}">Capgo native-purchases #${n}</a></li>`).join('')}</ul>
        </article>`, 'Merged pull requests');
        onAchievement(quest.award('side-quests'));
        return;
      case 'show_stats':
        show(`<article class="codex"><p class="codex__kind">Character sheet · years</p>
          <ul class="codex__outcome">${['intro.years', 'work.typescript', 'ai.history', 'games.community'].map((id) => `<li>${esc(cardText(id))}</li>`).join('')}</ul>
        </article>`, 'Experience in years');
        return;
      case 'open_resume':
        window.open(arg === 'fde' ? 'Harman-Kamboj-Resume-FDE.pdf' : 'Harman-Kamboj-Resume.pdf', '_blank', 'noopener');
        return;
      case 'contact':
        window.location.href = MAIL;
        return;
      default:
        console.warn('unknown tool', tool);
    }
  };

  return { run, close, isOpen: () => stage.dataset.open === 'true' };
}
