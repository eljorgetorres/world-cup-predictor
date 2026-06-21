import { TEAMS } from '../data/teams.js';
import { GROUP_STANDINGS, REMAINING_MATCHES, GROUP_NAMES } from '../data/groups.js';
import {
  R32_MATCHES, R16_MATCHES, QF_MATCHES, SF_MATCHES, FINAL_MATCH,
  THIRD_PLACE_ELIGIBILITY,
} from '../data/bracket.js';

// Probability that team A beats team B (no draw)
function eloWinProb(eloA, eloB) {
  return 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
}

// Simulate a single group-stage match → returns 'home', 'away', or 'draw'
function simGroupMatch(homeId, awayId) {
  const eloH = TEAMS[homeId].elo;
  const eloA = TEAMS[awayId].elo;
  const pWin = eloWinProb(eloH, eloA);
  const DRAW_RATE = 0.26;
  const adjWin = pWin * (1 - DRAW_RATE);
  const adjLoss = (1 - pWin) * (1 - DRAW_RATE);
  const r = Math.random();
  if (r < adjWin) return 'home';
  if (r < adjWin + DRAW_RATE) return 'draw';
  return 'away';
}

// Simulate a knockout match → returns winner teamId
function simKnockout(teamAId, teamBId) {
  if (!teamAId || !teamBId) return teamAId || teamBId;
  const p = eloWinProb(TEAMS[teamAId].elo, TEAMS[teamBId].elo);
  return Math.random() < p ? teamAId : teamBId;
}

// Deep-clone standings array
function cloneStandings(standings) {
  return standings.map(s => ({ ...s }));
}

// Sort group standings by pts desc, then gd desc, then gf desc
function sortStandings(standings) {
  return [...standings].sort((a, b) => {
    const ptsDiff = b.pts - a.pts;
    if (ptsDiff !== 0) return ptsDiff;
    const gdA = a.gf - a.ga;
    const gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    return b.gf - a.gf;
  });
}

// Apply a simulated match result to standings
function applyResult(standings, homeId, awayId, result) {
  const home = standings.find(s => s.teamId === homeId);
  const away = standings.find(s => s.teamId === awayId);
  // Add 1 to gf/ga (approximate; exact goals not tracked in sim)
  if (result === 'home') {
    home.w++; home.pts += 3; home.gf += 2; home.ga += 0;
    away.l++;               away.gf += 0; away.ga += 2;
  } else if (result === 'away') {
    away.w++; away.pts += 3; away.gf += 2; away.ga += 0;
    home.l++;               home.gf += 0; home.ga += 2;
  } else {
    home.d++; home.pts += 1; home.gf += 1; home.ga += 1;
    away.d++; away.pts += 1; away.gf += 1; away.ga += 1;
  }
  home.mp++; away.mp++;
}

// Complete group stage for one group and return sorted standings
function simulateGroup(groupId) {
  const standings = cloneStandings(GROUP_STANDINGS[groupId]);
  for (const match of REMAINING_MATCHES[groupId]) {
    const result = simGroupMatch(match.home, match.away);
    applyResult(standings, match.home, match.away, result);
  }
  return sortStandings(standings);
}

// Assign 8 qualifying 3rd-place teams to their R32 slots
// Each 3rd-place team's group determines which slots it's eligible for.
// We use a greedy assignment prioritising least-flexible teams first.
function assignThirdPlaceSlots(qualifying3rd) {
  // Sort by number of eligible slots (ascending = most constrained first)
  const sorted = [...qualifying3rd].sort(
    (a, b) => THIRD_PLACE_ELIGIBILITY[a.group].length - THIRD_PLACE_ELIGIBILITY[b.group].length
  );

  const assignment = {}; // slotMatchId → teamId
  const usedGroups = new Set();

  for (const team of sorted) {
    const eligibleSlots = THIRD_PLACE_ELIGIBILITY[team.group].filter(
      slotId => !(slotId in assignment)
    );
    if (eligibleSlots.length > 0) {
      assignment[eligibleSlots[0]] = team.teamId;
      usedGroups.add(team.group);
    }
  }

  return assignment; // { 74: 'GER', 77: 'SWE', ... }
}

// Run one full tournament simulation
// Returns: map of teamId → { r32, r16, qf, sf, final, champion } hit counts
function runOneSim(counters) {
  // 1. Complete all groups
  const finalStandings = {};
  for (const g of GROUP_NAMES) {
    finalStandings[g] = simulateGroup(g);
  }

  // 2. Extract 1st, 2nd, 3rd place per group
  const winner = {};
  const runnerUp = {};
  const thirdPlace = [];

  for (const g of GROUP_NAMES) {
    const sorted = finalStandings[g];
    winner[g] = sorted[0].teamId;
    runnerUp[g] = sorted[1].teamId;
    const t3 = sorted[2];
    thirdPlace.push({ group: g, teamId: t3.teamId, pts: t3.pts, gd: t3.gf - t3.ga, gf: t3.gf });
  }

  // 3. Find best 8 third-place teams
  thirdPlace.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
  const best8 = thirdPlace.slice(0, 8);
  const thirdSlots = assignThirdPlaceSlots(best8); // {matchId: teamId}

  // 4. Resolve R32 slots
  function resolveSlot(slot) {
    if (slot.type === 'winner') return winner[slot.group];
    if (slot.type === 'runner-up') return runnerUp[slot.group];
    if (slot.type === 'best-3rd') return thirdSlots[R32_MATCHES.find(m => m.slot2 === slot || m.slot1 === slot)?.id] || null;
    return null;
  }

  // Build slot lookup by match id and position
  const slotLookup = {};
  for (const m of R32_MATCHES) {
    slotLookup[m.id] = {
      1: m.slot1.type === 'winner' ? winner[m.slot1.group]
        : m.slot1.type === 'runner-up' ? runnerUp[m.slot1.group]
        : thirdSlots[m.id] || null,
      2: m.slot2.type === 'winner' ? winner[m.slot2.group]
        : m.slot2.type === 'runner-up' ? runnerUp[m.slot2.group]
        : thirdSlots[m.id] || null,
    };
  }

  // 5. Simulate R32
  const r32Winners = {};
  for (const m of R32_MATCHES) {
    const t1 = slotLookup[m.id][1];
    const t2 = slotLookup[m.id][2];
    const w = simKnockout(t1, t2);
    r32Winners[m.id] = w;
    if (t1 && counters[t1]) counters[t1].r32++;
    if (t2 && counters[t2]) counters[t2].r32++;
  }

  // 6. Simulate R16
  const r16Winners = {};
  for (const m of R16_MATCHES) {
    const t1 = r32Winners[m.match1];
    const t2 = r32Winners[m.match2];
    const w = simKnockout(t1, t2);
    r16Winners[m.id] = w;
    if (t1 && counters[t1]) counters[t1].r16++;
    if (t2 && counters[t2]) counters[t2].r16++;
  }

  // 7. Simulate QF
  const qfWinners = {};
  for (const m of QF_MATCHES) {
    const t1 = r16Winners[m.match1];
    const t2 = r16Winners[m.match2];
    const w = simKnockout(t1, t2);
    qfWinners[m.id] = w;
    if (t1 && counters[t1]) counters[t1].qf++;
    if (t2 && counters[t2]) counters[t2].qf++;
  }

  // 8. Simulate SF
  const sfWinners = {};
  for (const m of SF_MATCHES) {
    const t1 = qfWinners[m.match1];
    const t2 = qfWinners[m.match2];
    const w = simKnockout(t1, t2);
    sfWinners[m.id] = w;
    if (t1 && counters[t1]) counters[t1].sf++;
    if (t2 && counters[t2]) counters[t2].sf++;
  }

  // 9. Simulate Final
  const finalist1 = sfWinners[SF_MATCHES[0].id];
  const finalist2 = sfWinners[SF_MATCHES[1].id];
  if (finalist1 && counters[finalist1]) counters[finalist1].final++;
  if (finalist2 && counters[finalist2]) counters[finalist2].final++;
  const champion = simKnockout(finalist1, finalist2);
  if (champion && counters[champion]) counters[champion].champion++;
}

// Main simulation: run N sims and return probability maps
export function runSimulation(numSims = 80000) {
  const counters = {};
  for (const id of Object.keys(TEAMS)) {
    counters[id] = { r32: 0, r16: 0, qf: 0, sf: 0, final: 0, champion: 0 };
  }

  for (let i = 0; i < numSims; i++) {
    runOneSim(counters);
  }

  // Convert to percentages
  const probs = {};
  for (const id of Object.keys(counters)) {
    probs[id] = {};
    for (const stage of ['r32', 'r16', 'qf', 'sf', 'final', 'champion']) {
      probs[id][stage] = (counters[id][stage] / numSims) * 100;
    }
  }

  return probs;
}

// Get expected bracket slot probabilities for display
// Returns: for each R32 slot, a sorted array of { teamId, prob }
export function getSlotProbs(numSims = 60000) {
  // slot key: `r32_${matchId}_${1|2}` → { teamId: count }
  const slotCounts = {};
  for (const m of R32_MATCHES) {
    slotCounts[`${m.id}_1`] = {};
    slotCounts[`${m.id}_2`] = {};
  }

  for (let i = 0; i < numSims; i++) {
    const finalStandings = {};
    for (const g of GROUP_NAMES) finalStandings[g] = simulateGroup(g);

    const winner = {};
    const runnerUp = {};
    const thirdPlace = [];
    for (const g of GROUP_NAMES) {
      const sorted = finalStandings[g];
      winner[g] = sorted[0].teamId;
      runnerUp[g] = sorted[1].teamId;
      const t3 = sorted[2];
      thirdPlace.push({ group: g, teamId: t3.teamId, pts: t3.pts, gd: t3.gf - t3.ga, gf: t3.gf });
    }
    thirdPlace.sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : b.gd !== a.gd ? b.gd - a.gd : b.gf - a.gf);
    const best8 = thirdPlace.slice(0, 8);
    const thirdSlots = assignThirdPlaceSlots(best8);

    for (const m of R32_MATCHES) {
      const t1 = m.slot1.type === 'winner' ? winner[m.slot1.group]
        : m.slot1.type === 'runner-up' ? runnerUp[m.slot1.group]
        : thirdSlots[m.id] || null;
      const t2 = m.slot2.type === 'winner' ? winner[m.slot2.group]
        : m.slot2.type === 'runner-up' ? runnerUp[m.slot2.group]
        : thirdSlots[m.id] || null;
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
