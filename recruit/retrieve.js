// Vector retrieval over precomputed card embeddings. Runs in the browser and in Node.

export function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

export function topK(q, ids, vectors, k = 3) {
  return ids.map((id, i) => ({ id, score: cosine(q, vectors[i]) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, k);
}

// hi: answer with confidence; between lo and hi: offer the closest card; below lo: say so.
export function decide(results, { hi, lo }) {
  const best = results[0];
  if (!best || best.score < lo) return { kind: 'unknown' };
  return { kind: best.score >= hi ? 'answer' : 'closest', id: best.id, score: best.score };
}

// Hybrid retrieval: w * dense cosine + (1 - w) * normalised keyword score, over every card.
// Questions about things no card mentions (a tool he has not used) lose the keyword half.
export function hybrid(q, ids, vectors, kwResults, w = 0.7, k = 3) {
  const kw = new Map(kwResults.map((r) => [r.id, r.score]));
  return ids.map((id, i) => ({ id, score: w * cosine(q, vectors[i]) + (1 - w) * (kw.get(id) || 0) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, k);
}
