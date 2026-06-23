import { GROUP_STANDINGS, REMAINING_MATCHES, GROUP_NAMES } from '../data/groups.js';

function sortGroup(sim) {
  return [...sim].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gdDiff = (b.gf - b.ga) - (a.gf - a.ga);
    if (gdDiff !== 0) return gdDiff;
    return b.gf - a.gf;
  });
}

function computeGroupStatus(groupId) {
  const current = GROUP_STANDINGS[groupId];
  const remaining = REMAINING_MATCHES[groupId];
  const total = Math.pow(3, remaining.length);

  // alwaysTop2 = green (confirmed advance, guaranteed top 2)
  // neverTop3  = red   (confirmed eliminated — always 4th, can't even get best-3rd)
  const alwaysTop2 = new Set(current.map(s => s.teamId));
  const neverTop3  = new Set(current.map(s => s.teamId));

  for (let mask = 0; mask < total; mask++) {
    const sim = current.map(s => ({ ...s }));
    let m = mask;
    for (const match of remaining) {
      const outcome = m % 3;
      m = Math.floor(m / 3);
      const H = sim.find(s => s.teamId === match.home);
      const A = sim.find(s => s.teamId === match.away);
      if (outcome === 0)      { H.pts += 3; H.gf += 2; A.ga += 2; }
      else if (outcome === 1) { H.pts += 1; A.pts += 1; H.gf++; H.ga++; A.gf++; A.ga++; }
      else                    { A.pts += 3; A.gf += 2; H.ga += 2; }
    }
    const sorted = sortGroup(sim);
    const top2 = new Set([sorted[0].teamId, sorted[1].teamId]);
    const top3 = new Set([sorted[0].teamId, sorted[1].teamId, sorted[2].teamId]);

    for (const s of current) {
      if (!top2.has(s.teamId)) alwaysTop2.delete(s.teamId);
      if (top3.has(s.teamId))  neverTop3.delete(s.teamId);  // appears in top 3 → not always 4th
    }
  }

  const out = {};
  for (const s of current) {
    if (alwaysTop2.has(s.teamId))  out[s.teamId] = 'confirmed';
    else if (neverTop3.has(s.teamId)) out[s.teamId] = 'eliminated';
    else                           out[s.teamId] = 'maybe';
  }
  return out;
}

export function computeAllGroupStatuses() {
  const out = {};
  for (const g of GROUP_NAMES) out[g] = computeGroupStatus(g);
  return out;
}
