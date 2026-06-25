import { GROUP_STANDINGS, REMAINING_MATCHES, GROUP_NAMES } from '../data/groups.js';
import { rankGroupRows, playedGroupMatches } from './standings.js';
import { getPrediction } from './simulation.js';

export function predictGroupStandings(groupId, simMethod) {
  const rows = GROUP_STANDINGS[groupId].map(r => ({ ...r }));
  const remaining = REMAINING_MATCHES[groupId] ?? [];
  const matches = playedGroupMatches(groupId).slice();

  for (const { home, away } of remaining) {
    const pred = getPrediction(home, away, simMethod);
    const h = rows.find(r => r.teamId === home);
    const a = rows.find(r => r.teamId === away);
    if (!h || !a) continue;

    const hGoals = pred.homeGoals;
    const aGoals = pred.awayGoals;
    h.mp++; a.mp++;
    h.gf += hGoals; h.ga += aGoals;
    a.gf += aGoals; a.ga += hGoals;

    if (hGoals > aGoals) {
      h.pts += 3; h.w++;
      a.l++;
    } else if (hGoals === aGoals) {
      h.pts += 1; h.d++;
      a.pts += 1; a.d++;
    } else {
      a.pts += 3; a.w++;
      h.l++;
    }

    matches.push({ home, away, hg: hGoals, ag: aGoals });
  }

  return rankGroupRows(rows, matches);
}

// WC2026: top 2 per group (24) + best 8 third-place (8) = 32 R32 teams
export function computePredictedQualifiers(allStandings) {
  const qualifiers = new Set();
  const best8ThirdIds = new Set();
  const thirdPlaces = [];

  for (const groupId of GROUP_NAMES) {
    const rows = allStandings[groupId];
    if (!rows || rows.length < 3) continue;
    qualifiers.add(rows[0].teamId);
    qualifiers.add(rows[1].teamId);
    const third = rows[2];
    thirdPlaces.push({
      groupId,
      teamId: third.teamId,
      pts: third.pts,
      gd: third.gf - third.ga,
      gf: third.gf,
    });
  }

  thirdPlaces.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });

  for (const t of thirdPlaces.slice(0, 8)) {
    qualifiers.add(t.teamId);
    best8ThirdIds.add(t.teamId);
  }

  return { qualifiers, best8ThirdIds, thirdPlaces };
}

export function computeAllPredictedStandings(simMethod) {
  const result = {};
  for (const g of GROUP_NAMES) {
    result[g] = predictGroupStandings(g, simMethod);
  }
  return result;
}
