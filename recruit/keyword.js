// BM25 keyword search: the guide's fallback when the embedding model is not loaded or fails.
// Scores are normalised to 0..1 against the best score the query could reach, and query words
// the cards never use count against that ceiling, so "kubernetes games" scores below "games".

const STOP = new Set('a an and are as at be by can did do does for from has have he her his how i in is it its me my of on or our she so that the their them they this to was we what when where which who why will with you your'.split(' '));
const K1 = 1.2, B = 0.75;

// Keeps "c++", "c#" and one-letter language names (r, c) so a question about them is not read as "know".
export const tokenize = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s.+#-]/gu, ' ')
  .split(/[\s.]+/).map((w) => w.replace(/^-+|-+$/g, '').replace(/^\++/, '')).filter((w) => w && !STOP.has(w)).map(stem);

// Light stemming so plural and singular forms meet: databases → database, stores → store.
function stem(w) {
  if (w.length <= 3 || /ss$|us$|is$/.test(w)) return w;
  if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
  return w.endsWith('s') ? w.slice(0, -1) : w;
}

export function buildIndex(cards) {
  const docs = cards.map((c) => {
    const terms = tokenize([c.title, c.text, ...(c.tags || []), ...(c.paraphrases || [])].join(' '));
    const tf = new Map();
    for (const t of terms) tf.set(t, (tf.get(t) || 0) + 1);
    return { id: c.id, tf, len: terms.length };
  });
  const df = new Map();
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) || 0) + 1);
  const avg = docs.reduce((s, d) => s + d.len, 0) / Math.max(docs.length, 1);
  return { docs, df, n: docs.length, avg };
}

const idf = (index, t) => Math.log(1 + (index.n - (index.df.get(t) || 0) + 0.5) / ((index.df.get(t) || 0) + 0.5));

export function search(index, query, k = 3) {
  const terms = [...new Set(tokenize(query))];
  if (!terms.length) return [];
  const ceiling = terms.reduce((s, t) => s + idf(index, t) * (K1 + 1), 0);
  return index.docs.map((d) => {
    let score = 0;
    for (const t of terms) {
      const f = d.tf.get(t);
      if (!f) continue;
      score += idf(index, t) * (f * (K1 + 1)) / (f + K1 * (1 - B + B * d.len / index.avg));
    }
    return { id: d.id, score: Math.min(1, score / ceiling) };
  }).filter((r) => r.score > 0).sort((a, b) => b.score - a.score).slice(0, k);
}
