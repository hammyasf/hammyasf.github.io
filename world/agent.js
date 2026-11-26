// Scout's agent step: turns the guide's answer (a fact card plus its action) into what Scout
// says and what Scout does in the world. Pure, so it can be tested; world.js carries out the steps.

const LINKS = {
  play_toy: {
    'taxi-meter': { label: 'Open Taxi Meter', url: 'https://taxi-meter.codepost.dev/' },
    'typed-by-hand': { label: 'Open Typed by Hand', url: 'https://typed-by-hand.codepost.dev/' },
  },
  show_pr: (n) => ({ label: `See Capgo pull request #${n}`, url: `https://github.com/Cap-go/capacitor-native-purchases/pull/${n}` }),
  open_resume: (arg) => (arg === 'fde'
    ? { label: 'Open the forward deployed résumé (PDF)', url: 'Harman-Kamboj-Resume-FDE.pdf' }
    : { label: 'Open the résumé (PDF)', url: 'Harman-Kamboj-Resume.pdf' }),
};

const walkAndOpen = (id) => [{ tool: 'walk_to', arg: id }, { tool: 'open', arg: id }];

/**
 * @param {{kind: string, card: object|null, trace: string[]}} result from guide.answer()
 * @param {{siteIds: string[]}} world the building ids that exist
 * @returns {{text: string, cta: boolean, steps: {tool: string, arg: any}[], trace: string[]}}
 */
export function plan(result, { siteIds }) {
  const search = result.trace.slice(0, 1); // the guide's search line; its action line is replaced by ours
  if (!result.card) {
    return { text: "I don't have that on file. Ask him directly; the email is right here.", cta: true, steps: [], trace: search };
  }
  const { card } = result, a = card.action;
  const text = (result.kind === 'closest' ? 'Closest I have: ' : '') + card.text;
  let steps = [];
  if (a?.tool === 'open_case' && siteIds.includes(a.arg)) steps = walkAndOpen(a.arg);
  else if (a?.tool === 'contact') steps = walkAndOpen('camp');
  else if (a?.tool === 'open_resume') steps = [{ tool: 'offer_link', arg: LINKS.open_resume(a.arg) }];
  else if (a?.tool === 'play_toy' && LINKS.play_toy[a.arg]) steps = [{ tool: 'offer_link', arg: LINKS.play_toy[a.arg] }];
  else if (a?.tool === 'show_pr') steps = [{ tool: 'offer_link', arg: LINKS.show_pr(a.arg) }];
  const trace = search.concat(steps.filter((s) => s.tool !== 'offer_link')
    .map((s) => (s.tool === 'walk_to' ? `walk_to("${s.arg}")` : `open_door("${s.arg}")`)));
  return { text, cta: a?.tool === 'contact', steps, trace };
}
