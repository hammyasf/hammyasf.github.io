// Achievements: pure, no DOM. Same localStorage key as the old enhance.js ('achv'), so earned ones carry over.
// The theme switcher is gone, so a stored 'themer' is kept in storage but never counted or listed.
export const ACHIEVEMENTS = {
  explorer: 'Opened the command palette',
  terminal: 'Opened the terminal',
  konami: 'Found the Konami code',
  matrix: 'Entered the matrix',
  gamer: 'Played the bug hunt',
};
const KEY = 'achv';

// storage: anything with getItem/setItem (localStorage), or null. Every access is guarded: private mode throws.
export function createAchievements(storage) {
  let got;
  try {
    const a = JSON.parse(storage.getItem(KEY) || '[]');
    got = new Set(Array.isArray(a) ? a : []);
  } catch { got = new Set(); }
  const has = (id) => Object.hasOwn(ACHIEVEMENTS, id) && got.has(id);
  const list = () => Object.entries(ACHIEVEMENTS).map(([id, label]) => ({ id, label, got: got.has(id) }));
  return {
    has,
    list,
    unlock(id) {
      if (!Object.hasOwn(ACHIEVEMENTS, id) || got.has(id)) return false;
      got.add(id);
      try { storage.setItem(KEY, JSON.stringify([...got])); } catch { /* still unlocked for this visit */ }
      return true;
    },
    text() {
      const l = list();
      return [`Achievements  ${l.filter((x) => x.got).length} / ${l.length}`, '', ...l.map((x) => `${x.got ? '[x]' : '[ ]'} ${x.label}`)].join('\n');
    },
  };
}
