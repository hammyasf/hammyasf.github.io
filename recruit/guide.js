// The guide: answers a typed question from the fact cards and reports what it did.
// Hybrid retrieval when the in-browser model is ready, keyword search before that or if it fails.
import { hybrid, decide } from './retrieve.js';
import { search } from './keyword.js';

const clip = (q) => (q.length > 48 ? `${q.slice(0, 47)}…` : q);

export function createGuide({ facts, emb = null, config, index, embedder }) {
  const byId = new Map(facts.map((f) => [f.id, f]));

  async function answer(question) {
    const q = String(question || '').trim();
    if (!q) return { kind: 'unknown', card: null, trace: [] };
    const kw = search(index, q, facts.length);
    let d, tool = 'keyword_search';
    if (embedder?.ready && emb) {
      try {
        const v = await embedder.embed(q);
        d = decide(hybrid(v, emb.ids, emb.vectors, kw, config.w, 3), config);
        tool = 'search_facts';
      } catch { d = null; }
    }
    d ??= decide(kw.slice(0, 3), config.kw);
    const card = d.kind === 'unknown' ? null : byId.get(d.id);
    const trace = [`${tool}("${clip(q)}") → ${card ? card.id : 'no match'}${d.score != null ? ` · ${d.score.toFixed(2)}` : ''}`];
    if (card?.action) trace.push(`${card.action.tool}(${card.action.arg != null ? `"${card.action.arg}"` : ''})`);
    return { kind: d.kind, card, score: d.score, trace };
  }

  return { answer, card: (id) => byId.get(id), setVectors: (v) => { emb = v; } };
}
