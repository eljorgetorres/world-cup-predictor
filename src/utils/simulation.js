import { TEAMS } from '../data/teams.js';
import { GROUP_STANDINGS, REMAINING_MATCHES, GROUP_NAMES } from '../data/groups.js';
import {
  R32_MATCHES, R16_MATCHES, QF_MATCHES, SF_MATCHES,
  THIRD_PLACE_ELIGIBILITY,
} from '../data/bracket.js';
import { rankGroupRows, playedGroupMatches } from './standings.js';

// ── Core math ─────────────────────────────────────────────────────────────────

function eloWinProb(eloA, eloB) {
  return 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
}

function poisson(lambda, k) {
  let p = Math.exp(-lambda);
  for (let i = 0; i < k; i++) p = p * lambda / (i + 1);
  return p;
}

// Dixon-Coles correction: fixes Poisson's known undercounting of 0-0 and 1-0/0-1 draws.
// rho is typically -0.13 to -0.18 in football literature.
function dixonColesTau(h, a, lH, lA, rho) {
  if (h === 0 && a === 0) return 1 - lH * lA * rho;
  if (h === 0 && a === 1) return 1 + lH * rho;
  if (h === 1 && a === 0) return 1 + lA * rho;
  if (h === 1 && a === 1) return 1 - rho;
  return 1;
}

function poissonMatchProbs(lambdaH, lambdaA) {
  const MAX = 6;
  const RHO = -0.13;
  let w = 0, d = 0, l = 0;
  for (let h = 0; h <= MAX; h++) {
    const ph = poisson(lambdaH, h);
    for (let a = 0; a <= MAX; a++) {
      const p = ph * poisson(lambdaA, a) * dixonColesTau(h, a, lambdaH, lambdaA, RHO);
      if (h > a) w += p; else if (h === a) d += p; else l += p;
    }
  }
  const tot = w + d + l || 1;
  return { w: w / tot, d: d / tot, l: l / tot };
}

// ── Poisson attack/defense ratings (Elo prior + Bayesian WC update) ───────────
// Pure raw WC stats from 2 games are too noisy — a single lucky result dominates.
// Instead, use Elo-derived ratings as a Bayesian prior, then nudge toward actual
// WC performance as more games are played. PRIOR_WEIGHT of 8 means 2 WC games
// only shift the estimate by ~20%; after 3 games it's ~27%.

function computePoissonRatings() {
  const PRIOR_WEIGHT = 8;

  let totalGF = 0, totalMP = 0;
  const wcStats = {};
  for (const group of Object.values(GROUP_STANDINGS)) {
    for (const row of group) {
      wcStats[row.teamId] = { gf: row.gf, ga: row.ga, mp: row.mp };
      totalGF += row.gf;
      totalMP += row.mp;
    }
  }
  const mu = totalMP > 0 ? totalGF / totalMP : 1.5;

  const teamList = Object.values(TEAMS);
  const avgElo = teamList.reduce((s, t) => s + t.elo, 0) / teamList.length;

  const ratings = {};
  for (const team of teamList) {
    const eloFactor = Math.pow(10, (team.elo - avgElo) * 0.00035);
    const priorAtt = mu * eloFactor;
    const priorDef = mu / eloFactor;

    const stats = wcStats[team.id];
    if (stats && stats.mp > 0) {
      // Bayesian blend: weight WC evidence relative to prior
      const w = stats.mp / (PRIOR_WEIGHT + stats.mp);
      ratings[team.id] = {
        att: priorAtt * (1 - w) + (stats.gf / stats.mp) * w,
        def: priorDef * (1 - w) + (stats.ga / stats.mp) * w,
      };
    } else {
      ratings[team.id] = { att: priorAtt, def: priorDef };
    }
  }

  return { mu, ratings };
}

// Module-level caches — both derived from static imported data, safe to compute once
let _poissonCache = null;
function getCachedPoissonRatings() {
  if (!_poissonCache) _poissonCache = computePoissonRatings();
  return _poissonCache;
}

const _probTableCache = Object.create(null);
function getCachedProbTable(method) {
  if (!_probTableCache[method]) _probTableCache[method] = buildProbTable(method);
  return _probTableCache[method];
}

// ── Probability lookup table builder ─────────────────────────────────────────
// Precomputes W/D/L probabilities AND expected goals for every team pair once.
// lambdaH/lambdaA reflect the selected method so score predictions respond to
// the method toggle (Elo-prior goals vs. Poisson WC-form goals vs. blend).

function buildProbTable(method) {
  const DRAW_RATE = 0.26;
  const { mu, ratings } = getCachedPoissonRatings();
  const teamIds = Object.keys(TEAMS);

  // Elo factors for pure-prior expected goals (used when method='elo')
  const avgElo = teamIds.reduce((s, id) => s + TEAMS[id].elo, 0) / teamIds.length;
  const eloFactor = {};
  for (const id of teamIds) {
    eloFactor[id] = Math.pow(10, (TEAMS[id].elo - avgElo) * 0.00035);
  }

  const table = {};
  for (const a of teamIds) {
    table[a] = {};
    for (const b of teamIds) {
      if (a === b) continue;
      const eloA = TEAMS[a].elo, eloB = TEAMS[b].elo;
      const eloP = eloWinProb(eloA, eloB);

      // Elo-only expected goals: pure Elo prior, no WC form
      const lambdaEloH = mu * eloFactor[a] / eloFactor[b];
      const lambdaEloA = mu * eloFactor[b] / eloFactor[a];

      if (method === 'elo') {
        table[a][b] = {
          gW: eloP * (1 - DRAW_RATE), gD: DRAW_RATE, koW: eloP,
          lambdaH: lambdaEloH, lambdaA: lambdaEloA,
        };
      } else {
        // Poisson expected goals: Elo prior blended with WC form
        const lambdaPH = ratings[a].att * ratings[b].def / mu;
        const lambdaPA = ratings[b].att * ratings[a].def / mu;
        const { w, d } = poissonMatchProbs(lambdaPH, lambdaPA);
        const poissonKo = w + d * 0.5;

        if (method === 'poisson') {
          table[a][b] = {
            gW: w, gD: d, koW: poissonKo,
            lambdaH: lambdaPH, lambdaA: lambdaPA,
          };
        } else {
          // hybrid: equal blend of Elo and Poisson for both probs and goals
          table[a][b] = {
            gW: 0.5 * eloP * (1 - DRAW_RATE) + 0.5 * w,
            gD: 0.5 * DRAW_RATE + 0.5 * d,
            koW: 0.5 * eloP + 0.5 * poissonKo,
            lambdaH: 0.5 * lambdaEloH + 0.5 * lambdaPH,
            lambdaA: 0.5 * lambdaEloA + 0.5 * lambdaPA,
          };
        }
      }
    }
  }
  return table;
}

// ── Per-match simulation ───────────────────────────────────────────────────────

function simGroupMatch(homeId, awayId, table) {
  const { gW, gD } = table[homeId][awayId];
  const r = Math.random();
  if (r < gW) return 'home';
  if (r < gW + gD) return 'draw';
  return 'away';
}

function simKnockout(teamAId, teamBId, table) {
  if (!teamAId || !teamBId) return teamAId || teamBId;
  return Math.random() < table[teamAId][teamBId].koW ? teamAId : teamBId;
}

// ── Group / bracket helpers ───────────────────────────────────────────────────

function cloneStandings(standings) { return standings.map(s => ({ ...s })); }

function applyResult(standings, homeId, awayId, result) {
  const home = standings.find(s => s.teamId === homeId);
  const away = standings.find(s => s.teamId === awayId);
  if (result === 'home') {
    home.w++; home.pts += 3; home.gf += 2;
    away.l++; away.ga += 2;
  } else if (result === 'away') {
    away.w++; away.pts += 3; away.gf += 2;
    home.l++; home.ga += 2;
  } else {
    home.d++; home.pts += 1; home.gf += 1; home.ga += 1;
    away.d++; away.pts += 1; away.gf += 1; away.ga += 1;
  }
  home.mp++; away.mp++;
}

function simulateGroup(groupId, table) {
  const standings = cloneStandings(GROUP_STANDINGS[groupId]);
  const matches = playedGroupMatches(groupId).slice();
  for (const match of REMAINING_MATCHES[groupId]) {
    const result = simGroupMatch(match.home, match.away, table);
    applyResult(standings, match.home, match.away, result);
    const hg = result === 'home' ? 2 : result === 'draw' ? 1 : 0;
    const ag = result === 'away' ? 2 : result === 'draw' ? 1 : 0;
    matches.push({ home: match.home, away: match.away, hg, ag });
  }
  return rankGroupRows(standings, matches);
}

function assignThirdPlaceSlots(qualifying3rd) {
  const sorted = [...qualifying3rd].sort(
    (a, b) => THIRD_PLACE_ELIGIBILITY[a.group].length - THIRD_PLACE_ELIGIBILITY[b.group].length
  );
  const assignment = {};
  for (const team of sorted) {
    const eligibleSlots = THIRD_PLACE_ELIGIBILITY[team.group].filter(
      slotId => !(slotId in assignment)
    );
    if (eligibleSlots.length > 0) assignment[eligibleSlots[0]] = team.teamId;
  }
  return assignment;
}

function resolveSlot(slot, matchId, winner, runnerUp, thirdSlots) {
  if (slot.type === 'winner') return winner[slot.group];
  if (slot.type === 'runner-up') return runnerUp[slot.group];
  return thirdSlots[matchId] || null;
}

// ── One full tournament sim ───────────────────────────────────────────────────

function runOneSim(counters, table) {
  const finalStandings = {};
  for (const g of GROUP_NAMES) finalStandings[g] = simulateGroup(g, table);

  const winner = {}, runnerUp = {}, thirdPlace = [];
  for (const g of GROUP_NAMES) {
    const sorted = finalStandings[g];
    winner[g] = sorted[0].teamId;
    runnerUp[g] = sorted[1].teamId;
    const t3 = sorted[2];
    thirdPlace.push({ group: g, teamId: t3.teamId, pts: t3.pts, gd: t3.gf - t3.ga, gf: t3.gf });
  }

  thirdPlace.sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : b.gd !== a.gd ? b.gd - a.gd : b.gf - a.gf);
  const thirdSlots = assignThirdPlaceSlots(thirdPlace.slice(0, 8));

  const slotLookup = {};
  for (const m of R32_MATCHES) {
    slotLookup[m.id] = {
      1: resolveSlot(m.slot1, m.id, winner, runnerUp, thirdSlots),
      2: resolveSlot(m.slot2, m.id, winner, runnerUp, thirdSlots),
    };
  }

  const r32Winners = {};
  for (const m of R32_MATCHES) {
    const t1 = slotLookup[m.id][1], t2 = slotLookup[m.id][2];
    r32Winners[m.id] = simKnockout(t1, t2, table);
    if (t1 && counters[t1]) counters[t1].r32++;
    if (t2 && counters[t2]) counters[t2].r32++;
  }

  const r16Winners = {};
  for (const m of R16_MATCHES) {
    const t1 = r32Winners[m.match1], t2 = r32Winners[m.match2];
    r16Winners[m.id] = simKnockout(t1, t2, table);
    if (t1 && counters[t1]) counters[t1].r16++;
    if (t2 && counters[t2]) counters[t2].r16++;
  }

  const qfWinners = {};
  for (const m of QF_MATCHES) {
    const t1 = r16Winners[m.match1], t2 = r16Winners[m.match2];
    qfWinners[m.id] = simKnockout(t1, t2, table);
    if (t1 && counters[t1]) counters[t1].qf++;
    if (t2 && counters[t2]) counters[t2].qf++;
  }

  const sfWinners = {};
  for (const m of SF_MATCHES) {
    const t1 = qfWinners[m.match1], t2 = qfWinners[m.match2];
    sfWinners[m.id] = simKnockout(t1, t2, table);
    if (t1 && counters[t1]) counters[t1].sf++;
    if (t2 && counters[t2]) counters[t2].sf++;
  }

  const f1 = sfWinners[SF_MATCHES[0].id], f2 = sfWinners[SF_MATCHES[1].id];
  if (f1 && counters[f1]) counters[f1].final++;
  if (f2 && counters[f2]) counters[f2].final++;
  const champion = simKnockout(f1, f2, table);
  if (champion && counters[champion]) counters[champion].champion++;
}

// ── Score prediction helper ───────────────────────────────────────────────────
// Reads win probabilities AND expected goals from the method-specific cached table
// so both the score display and probabilities respond to the method toggle.
export function getPrediction(homeId, awayId, method = 'elo') {
  const table = getCachedProbTable(method);
  const entry = table[homeId]?.[awayId];
  const homeWinP = entry?.gW ?? 0.4;
  const drawP    = entry?.gD ?? 0.25;
  return {
    homeWin:   Math.round(homeWinP * 100),
    draw:      Math.round(drawP * 100),
    awayWin:   Math.round((1 - homeWinP - drawP) * 100),
    homeGoals: Math.round(entry?.lambdaH ?? 1.3),
    awayGoals: Math.round(entry?.lambdaA ?? 1.0),
  };
}

// Expose the prob table for BracketView's method-aware predict mode
export function buildMatchupTable(method) { return getCachedProbTable(method); }

// ── Public API ────────────────────────────────────────────────────────────────

export const SIM_METHODS = [
  { key: 'elo',     label: 'Elo',          desc: 'Historical Elo strength ratings' },
  { key: 'poisson', label: 'Dixon-Coles',  desc: 'Elo prior + WC form, Dixon-Coles correction' },
  { key: 'hybrid',  label: 'Blend',        desc: 'Equal mix of Elo + Dixon-Coles' },
];

export function runSimulation(numSims = 60000, method = 'elo') {
  const table = getCachedProbTable(method);
  const counters = {};
  for (const id of Object.keys(TEAMS)) {
    counters[id] = { r32: 0, r16: 0, qf: 0, sf: 0, final: 0, champion: 0 };
  }
  for (let i = 0; i < numSims; i++) runOneSim(counters, table);

  const probs = {};
  for (const id of Object.keys(counters)) {
    probs[id] = {};
    for (const stage of ['r32', 'r16', 'qf', 'sf', 'final', 'champion']) {
      probs[id][stage] = (counters[id][stage] / numSims) * 100;
    }
  }
  return probs;
}

export function getSlotProbs(numSims = 40000) {
  const table = getCachedProbTable('elo');
  const slotCounts = {};
  for (const m of R32_MATCHES) {
    slotCounts[`${m.id}_1`] = {};
    slotCounts[`${m.id}_2`] = {};
  }

  for (let i = 0; i < numSims; i++) {
    const finalStandings = {};
    for (const g of GROUP_NAMES) finalStandings[g] = simulateGroup(g, table);

    const winner = {}, runnerUp = {}, thirdPlace = [];
    for (const g of GROUP_NAMES) {
      const sorted = finalStandings[g];
      winner[g] = sorted[0].teamId;
      runnerUp[g] = sorted[1].teamId;
      const t3 = sorted[2];
      thirdPlace.push({ group: g, teamId: t3.teamId, pts: t3.pts, gd: t3.gf - t3.ga, gf: t3.gf });
    }
    thirdPlace.sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : b.gd !== a.gd ? b.gd - a.gd : b.gf - a.gf);
    const thirdSlots = assignThirdPlaceSlots(thirdPlace.slice(0, 8));

    for (const m of R32_MATCHES) {
      const t1 = resolveSlot(m.slot1, m.id, winner, runnerUp, thirdSlots);
      const t2 = resolveSlot(m.slot2, m.id, winner, runnerUp, thirdSlots);
      if (t1) slotCounts[`${m.id}_1`][t1] = (slotCounts[`${m.id}_1`][t1] || 0) + 1;
      if (t2) slotCounts[`${m.id}_2`][t2] = (slotCounts[`${m.id}_2`][t2] || 0) + 1;
    }
  }

  const result = {};
  for (const key of Object.keys(slotCounts)) {
    const counts = slotCounts[key];
    const total = Object.values(counts).reduce((s, c) => s + c, 0);
    result[key] = Object.entries(counts)
      .map(([teamId, count]) => ({ teamId, prob: (count / total) * 100 }))
      .sort((a, b) => b.prob - a.prob);
  }
  return result;
}
