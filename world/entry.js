// Entry params for the world: ?at=<site id> ?ask=<question> ?zoom=<0.2-3>. Pure, so it is testable.
export function parseEntry(search, siteIds) {
  const p = new URLSearchParams(search);
  const at = p.get('at');
  const ask = (p.get('ask') || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 160).trim();
  const z = p.get('zoom'), zoom = z && Number.isFinite(Number(z)) && Number(z) >= 0.2 && Number(z) <= 3 ? Number(z) : 1;
  return { at: siteIds.includes(at) ? at : null, ask: ask || null, zoom };
}
