// Quest: open 3 distinct résumé case files to unlock "Recruit Harman".
// State persists in storage when it works and lives in memory when storage throws.
const KEY = 'recruit.v1';
const GOAL = 3;
const CASE_ACH = { codewisp: 'case-codewisp', 'shiba-inu': 'case-shiba' };

export const ACHIEVEMENTS = {
  'case-codewisp': 'Read the CodeWisp case file',
  'case-shiba': 'Opened the Shiba Inu platform',
  'asked-real': 'Asked the guide a real question',
  'side-quests': 'Found the side quests',
  'party-found': 'Party member found',
};

export function createQuest({ storage, caseIds }) {
  const valid = new Set(caseIds);
  let st = { viewed: [], achievements: [], sound: false };
  try { const raw = storage?.getItem(KEY); if (raw) st = { ...st, ...JSON.parse(raw) }; } catch { /* private mode */ }
  const save = () => { try { storage?.setItem(KEY, JSON.stringify(st)); } catch { /* memory only */ } };
  const grant = (ids) => {
    const fresh = ids.filter((id) => id && !st.achievements.includes(id));
    st.achievements.push(...fresh);
    return fresh;
  };

  return {
    viewCase(id) {
      let fresh = [];
      if (valid.has(id) && !st.viewed.includes(id)) {
        st.viewed.push(id);
        fresh = grant([CASE_ACH[id], st.viewed.length >= GOAL ? 'party-found' : null]);
        save();
      }
      return { progress: Math.min(st.viewed.length, GOAL), complete: st.viewed.length >= GOAL, newAchievements: fresh };
    },
    award(id) { const fresh = grant([id]); if (fresh.length) save(); return fresh; },
    state: () => ({ viewed: [...st.viewed], achievements: [...st.achievements], sound: st.sound }),
    setSound(on) { st.sound = !!on; save(); },
    goal: GOAL,
  };
}
