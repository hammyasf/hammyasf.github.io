// Entry: wires the recruit screen. Pure logic lives in the imported modules.
import { buildIndex } from './keyword.js';
import { createGuide } from './guide.js';
import { createDialogue } from './dialogue.js';
import { createQuest, ACHIEVEMENTS } from './quest.js';
import { createTools } from './tools.js';
import { createEmbedder } from './embedder.js';

const $ = (s) => document.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
// The form is guarded before anything loads: a question typed early waits instead of reloading the page.
let handleAsk = null, earlyQuestion = null;
$('#ask').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = $('#ask-input').value.trim();
  if (!q) return;
  if (handleAsk) handleAsk(q); else earlyQuestion = q;
});
const get = (f) => fetch(`recruit/data/${f}`).then((r) => { if (!r.ok) throw new Error(`${f} ${r.status}`); return r.json(); });
let facts, cases, tree, config, voiced;
try {
  [facts, cases, tree, config, voiced] = await Promise.all(['facts.json', 'cases.json', 'dialogue.json', 'config.json', 'voice.json'].map(get));
} catch {
  $('#say').textContent = "The guide can't load right now. Everything is in the plain version below, and the Email button works.";
  $('#say-live').textContent = $('#say').textContent;
  throw new Error('recruit data failed to load');
}
const VOICED = new Set(voiced);

let storage = null;
try { storage = window.localStorage; } catch { /* blocked */ }
const quest = createQuest({ storage, caseIds: cases.map((c) => c.id) });
const index = buildIndex(facts);
const chip = $('#model-chip');
const embedder = createEmbedder({
  onStatus(state, p) {
    chip.dataset.state = state;
    chip.textContent = state === 'ready' ? 'on-device AI · ready'
      : state === 'failed' ? 'keyword mode'
      : `guide warming up · ${Math.round((p || 0) * 100)}% of 23 MB, once`;
  },
});
const guide = createGuide({ facts, config, index, embedder });
// The card vectors (173 KB) load with the model, never before the choices.
let aiLoading = null;
const loadAI = () => (aiLoading ??= get('embeddings.json')
  .then((v) => { guide.setVectors(v); return embedder.load(); })
  .catch(() => { chip.dataset.state = 'failed'; chip.textContent = 'keyword mode'; }));
const dialogue = createDialogue(tree);
const stage = $('#stage');
stage.dataset.idle = stage.innerHTML;

// ---- the guide speaks ----
let typing = null;
function say(text, { cta = false, audio } = {}) {
  const el = $('#say');
  $('#say-live').textContent = text;
  $('#say-cta').hidden = !cta;
  clearInterval(typing);
  if (reduced) { el.textContent = text; } else {
    let i = 0;
    el.innerHTML = '<span></span><i class="caret"></i>';
    const span = el.firstChild;
    typing = setInterval(() => {
      i += 2;
      span.textContent = text.slice(0, i);
      if (i >= text.length) { clearInterval(typing); typing = null; }
    }, 16);
    el.dataset.full = text;
  }
  if (audio) lastVoice = audio;
  playVoice(audio);
}
function skipTyping() {
  if (!typing) return;
  clearInterval(typing); typing = null;
  const el = $('#say'); el.innerHTML = `<span>${escapeHtml(el.dataset.full || '')}</span><i class="caret"></i>`;
}
const escapeHtml = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
function trace(lines) {
  $('#trace').innerHTML = lines.map((l) => escapeHtml(l).replace(/^(\w+)\(/, '<b>$1</b>(')).join('\n');
}

// ---- voice (Gemini TTS clips, off by default) ----
let audioEl = null;
function playVoice(id) {
  if (!quest.state().sound || !VOICED.has(id)) return;
  audioEl?.pause();
  audioEl = new Audio(`recruit/audio/${id}.mp3`);
  audioEl.play().catch(() => {});
}
const soundBtn = $('#sound');
const syncSound = () => {
  const on = quest.state().sound;
  soundBtn.setAttribute('aria-pressed', String(on));
  soundBtn.setAttribute('aria-label', on ? 'Guide voice on' : 'Guide voice off');
  soundBtn.textContent = on ? '🔊' : '🔇';
};
let lastVoice = 'start';
soundBtn.addEventListener('click', () => { quest.setSound(!quest.state().sound); syncSound(); if (!quest.state().sound) audioEl?.pause(); else playVoice(lastVoice); });
syncSound();

// ---- quest, achievements, toast ----
function renderQuest() {
  const st = quest.state();
  const n = Math.min(st.viewed.length, quest.goal);
  [...$('#pips').children].forEach((p, i) => { p.dataset.on = String(i < n); });
  $('#pips').setAttribute('aria-label', `${n} of ${quest.goal} reviewed`);
  const done = st.viewed.length >= quest.goal;
  const rec = $('#recruit');
  rec.setAttribute('aria-disabled', String(!done));
  rec.tabIndex = done ? 0 : -1;
  $('#share-btn').hidden = !done;
  $('#ach-btn').textContent = `Achievements ${st.achievements.length}/${Object.keys(ACHIEVEMENTS).length}`;
  $('#ach-list').innerHTML = Object.entries(ACHIEVEMENTS)
    .map(([id, label]) => `<li data-got="${st.achievements.includes(id)}">${st.achievements.includes(id) ? '★' : '☆'} ${label}</li>`).join('');
  document.querySelectorAll('#log button').forEach((b) => { b.dataset.seen = String(st.viewed.includes(b.dataset.case)); });
}
let toastTimer;
function toast(ids) {
  if (!ids?.length) return;
  const t = $('#toast');
  t.innerHTML = `<b>Achievement</b> ${ids.map((id) => ACHIEVEMENTS[id]).join(' · ')}`;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
  renderQuest();
  if (ids.includes('party-found')) {
    say('Party member found. The Recruit button is lit.', { cta: true, audio: 'party-found' });
    import('./share.js').then(({ openShare }) => openShare({ portraitUrl: 'recruit/art/portrait.png' }));
  }
}
$('#recruit').addEventListener('click', (e) => { if ($('#recruit').getAttribute('aria-disabled') === 'true') e.preventDefault(); });
$('#ach-btn').addEventListener('click', () => {
  const pop = $('#ach'); pop.hidden = !pop.hidden;
  $('#ach-btn').setAttribute('aria-expanded', String(!pop.hidden));
});
$('#share-btn').addEventListener('click', async () => {
  const { openShare } = await import('./share.js');
  openShare({ portraitUrl: 'recruit/art/portrait.png' });
});

// ---- tools on the stage ----
const tools = createTools({ stage, cases, quest, cardText: (id) => guide.card(id)?.text || '', onCase: renderQuest, onAchievement: toast, onClose: () => { renderLog(); renderQuest(); } });
function renderLog() {
  const log = $('#log');
  if (!log) return;
  log.innerHTML = cases.map((c) => `<li><button type="button" data-case="${c.id}">${escapeHtml(c.client)}<span>${escapeHtml(c.role)} · ${escapeHtml(c.years)}</span></button></li>`).join('');
}
stage.addEventListener('click', (e) => {
  const b = e.target.closest('[data-case]');
  if (b) { tools.run('open_case', b.dataset.case, `#log [data-case="${b.dataset.case}"]`); trace([`open_case("${b.dataset.case}")`]); }
});

// ---- dialogue choices ----
function renderChoices(node) {
  $('#choices').innerHTML = node.choices.map((c, i) => `<li><button class="choice${/fun\?$|^Back$/.test(c.label) ? ' choice--quiet' : ''}" type="button" data-i="${i}">${escapeHtml(c.label)}</button></li>`).join('');
}
function useCard(card, via, returnTo) {
  if (!card) return;
  const lines = [via];
  if (card.action) lines.push(`${card.action.tool}(${card.action.arg != null ? `"${card.action.arg}"` : ''})`);
  trace(lines);
  say(card.text, { cta: card.action?.tool === 'contact', audio: card.id });
  if (card.action && card.action.tool !== 'contact') tools.run(card.action.tool, card.action.arg, returnTo);
}
$('#choices').addEventListener('click', (e) => {
  const b = e.target.closest('.choice');
  if (!b) return;
  const label = b.textContent, i = Number(b.dataset.i), from = dialogue.current().id;
  const r = dialogue.choose(i);
  renderChoices(r.node);
  // the line that opened a file is the one focus returns to; after moving to a new node, its first line
  const back = `#choices .choice[data-i="${r.node.id === from ? i : 0}"]`;
  $(back)?.focus({ preventScroll: true });
  if (r.card) useCard(guide.card(r.card), `pick_line("${label}") → ${r.card}`, back);
  else say(r.node.line, { audio: r.node.id });
  if (r.node.id === 'side') toast(quest.award('side-quests'));
});
$('#choices').addEventListener('keydown', (e) => {
  if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;
  const all = [...document.querySelectorAll('#choices .choice')];
  const i = all.indexOf(document.activeElement);
  const next = all[(i + (e.key === 'ArrowDown' ? 1 : -1) + all.length) % all.length];
  next?.focus(); e.preventDefault();
});

// ---- typed questions ----
handleAsk = async (q) => {
  loadAI();
  const r = await guide.answer(q);
  trace(r.trace);
  toast(quest.award('asked-real'));
  if (!r.card) { say("I don't have that on file. Ask him directly.", { cta: true, audio: 'unknown' }); return; }
  say((r.kind === 'closest' ? 'Closest I have: ' : '') + r.card.text, { cta: r.card.action?.tool === 'contact' });
  if (r.card.action && r.card.action.tool !== 'contact') tools.run(r.card.action.tool, r.card.action.arg, '#ask-input');
};

$('#side-btn').addEventListener('click', () => {
  dialogue.reset();
  const r = dialogue.choose(tree.nodes.start.choices.findIndex((c) => c.next === 'side'));
  renderChoices(r.node);
  useCard(guide.card(r.card), `pick_line("What does he build for fun?") → ${r.card}`);
  toast(quest.award('side-quests'));
});

// ---- keys ----
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (tools.isOpen()) { tools.close(); }
    else if (!$('#ach').hidden) { $('#ach').hidden = true; $('#ach-btn').setAttribute('aria-expanded', 'false'); $('#ach-btn').focus(); }
    return;
  }
  if (e.key === '/' && document.activeElement !== $('#ask-input')) { e.preventDefault(); $('#ask-input').focus(); return; }
  if (typing && e.key !== 'Tab') skipTyping();
});
$('#say').addEventListener('click', skipTyping);

// ---- start ----
renderLog();
renderChoices(dialogue.current());
renderQuest();
$('#ask-input').addEventListener('focus', loadAI, { once: true });
const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
idle(loadAI, { timeout: 4000 });
if (earlyQuestion) handleAsk(earlyQuestion);
window.__recruit = { guide, quest, tools, dialogue, embedder };
