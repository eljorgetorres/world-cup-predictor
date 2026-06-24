import { GROUP_STANDINGS, REMAINING_MATCHES, GROUP_NAMES } from '../data/groups.js';
import { rankGroupRows, playedGroupMatches } from './standings.js';

// Synthetic scoreline for a simulated outcome, matching the +2 / 1-1 goal model.
// 0 = home win (2-0), 1 = draw (1-1), 2 = away win (0-2)
function syntheticScore(outcome) {
  if (outcome === 0) return { hg: 2, ag: 0 };
  if (outcome === 1) return { hg: 1, ag: 1 };
  return { hg: 0, ag: 2 };
}

function computeGroupStatus(groupId) {
  const current = GROUP_STANDINGS[groupId];
  const remaining = REMAINING_MATCHES[groupId];
  const played = playedGroupMatches(groupId);
  const total = Math.pow(3, remaining.length);

  // alwaysTop2 = green (confirmed advance, guaranteed top 2)
  // neverTop3  = red   (confirmed eliminated — can never even reach top 3, so it
  //              can be neither a top-2 finisher nor a best-third qualifier)
  const alwaysTop2 = new Set(current.map(s => s.teamId));
  const neverTop3  = new Set(current.map(s => s.teamId));

  for (let mask = 0; mask < total; mask++) {
    const sim = current.map(s => ({ ...s }));
    const matches = played.slice();   // real results carry the head-to-head record
    let m = mask;
    for (const match of remaining) {
      const outcome = m % 3;
      m = Math.floor(m / 3);
      const H = sim.find(s => s.teamId === match.home);
      const A = sim.find(s => s.teamId === match.away);
      const { hg, ag } = syntheticScore(outcome);
      H.gf += hg; H.ga += ag; A.gf += ag; A.ga += hg;
      if (outcome === 0)      { H.pts += 3; }
      else if (outcome === 1) { H.pts += 1; A.pts += 1; }
      else                    { A.pts += 3; }
      matches.push({ home: match.home, away: match.away, hg, ag });
    }

    const sorted = rankGroupRows(sim, matches);
    const top2 = new Set([sorted[0].teamId, sorted[1].teamId]);
    const top3 = new Set([sorted[0].teamId, sorted[1].teamId, sorted[2].teamId]);

    for (const s of current) {
      if (!top2.has(s.teamId)) alwaysTop2.delete(s.teamId);
      if (top3.has(s.teamId))  neverTop3.delete(s.teamId);  // appears in top 3 → not always 4th
    }
  }

  const out = {};
  for (const s of current) {
    if (alwaysTop2.has(s.teamId))      out[s.teamId] = 'confirmed';
    else if (neverTop3.has(s.teamId)) out[s.teamId] = 'eliminated';
    else                              out[s.teamId] = 'maybe';
  }
  return out;
}

export function computeAllGroupStatuses() {
  const out = {};
  for (const g of GROUP_NAMES) out[g] = computeGroupStatus(g);
  return out;
}
