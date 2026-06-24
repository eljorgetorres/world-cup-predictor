// WC2026 group ranking with the official tie-breaking order.
//
// When teams are level on points, FIFA applies (in order):
//   1. head-to-head points (matches between the tied teams only)
//   2. head-to-head goal difference
//   3. head-to-head goals scored
//   4. overall goal difference
//   5. overall goals scored
//   (then conduct score / FIFA ranking — not modelled here)
//
// Crucially, head-to-head comes BEFORE overall goal difference. A naive sort on
// points → overall GD → overall GF gets group elimination wrong: e.g. a team that
// could only ever draw level with a rival it already lost to would look like it
// can still finish above them, when in reality the head-to-head locks it below.

import { PLAYED_MATCHES } from '../data/playedMatches.js';

const PLAYED_BY_GROUP = {};
for (const m of PLAYED_MATCHES) {
  if (m.hg == null || m.ag == null) continue;
  (PLAYED_BY_GROUP[m.group] ??= []).push({ home: m.home, away: m.away, hg: m.hg, ag: m.ag });
}

// Real, completed matches for a group (with scores) — the basis for head-to-head.
export function playedGroupMatches(groupId) {
  return PLAYED_BY_GROUP[groupId] ?? [];
}

function gd(row) { return row.gf - row.ga; }

// Build a head-to-head mini-table over `teams`, using only the matches played
// between members of that set.
function h2hStats(teams, matches) {
  const ids = new Set(teams.map(t => t.teamId));
  const stat = {};
  for (const t of teams) stat[t.teamId] = { pts: 0, gf: 0, ga: 0 };
  for (const m of matches) {
    if (m.hg == null || m.ag == null) continue;
    if (!ids.has(m.home) || !ids.has(m.away)) continue;
    const H = stat[m.home], A = stat[m.away];
    H.gf += m.hg; H.ga += m.ag;
    A.gf += m.ag; A.ga += m.hg;
    if (m.hg > m.ag) H.pts += 3;
    else if (m.hg < m.ag) A.pts += 3;
    else { H.pts += 1; A.pts += 1; }
  }
  return stat;
}

function cmpOverall(a, b) {
  const g = gd(b) - gd(a);
  if (g !== 0) return g;
  return b.gf - a.gf;
}

// Resolve a set of teams that are all level on points.
function resolveTier(teams, matches) {
  if (teams.length === 1) return teams;

  const stat = h2hStats(teams, matches);
  const keyOf = (t) => {
    const s = stat[t.teamId];
    return `${s.pts}|${s.gf - s.ga}|${s.gf}`;
  };

  const sorted = [...teams].sort((a, b) => {
    const sa = stat[a.teamId], sb = stat[b.teamId];
    if (sb.pts !== sa.pts) return sb.pts - sa.pts;
    const hgd = (sb.gf - sb.ga) - (sa.gf - sa.ga);
    if (hgd !== 0) return hgd;
    if (sb.gf !== sa.gf) return sb.gf - sa.gf;
    return 0;
  });

  // Group teams the head-to-head table could not separate.
  const subgroups = [];
  for (const t of sorted) {
    const k = keyOf(t);
    const last = subgroups[subgroups.length - 1];
    if (last && last.k === k) last.items.push(t);
    else subgroups.push({ k, items: [t] });
  }

  // Head-to-head identical for everyone → fall through to overall criteria.
  if (subgroups.length === 1) {
    return [...teams].sort(cmpOverall);
  }

  // Some teams separated; for any still-tied subset, re-apply the procedure to
  // that reduced set (FIFA reruns criteria 1-3 on the smaller group first).
  const out = [];
  for (const sg of subgroups) {
    if (sg.items.length === 1) out.push(sg.items[0]);
    else out.push(...resolveTier(sg.items, matches));
  }
  return out;
}

// Rank a group's rows ({ teamId, pts, gf, ga, ... }) applying the full tiebreakers.
// `matches` is the list of all group matches ({ home, away, hg, ag }) — played
// plus any simulated/predicted ones — used for the head-to-head comparison.
export function rankGroupRows(rows, matches) {
  const byPts = [...rows].sort((a, b) => b.pts - a.pts);
  const result = [];
  let i = 0;
  while (i < byPts.length) {
    let j = i;
    while (j < byPts.length && byPts[j].pts === byPts[i].pts) j++;
    result.push(...resolveTier(byPts.slice(i, j), matches));
    i = j;
  }
  return result;
}
