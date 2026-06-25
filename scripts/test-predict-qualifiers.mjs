/**
 * Test script: predicted qualifiers + dot colors for Groups PREDICT mode.
 * Run: node scripts/test-predict-qualifiers.mjs
 */
import { TEAMS } from '../src/data/teams.js';
import { GROUP_NAMES } from '../src/data/groups.js';
import {
  computeAllPredictedStandings,
  computePredictedQualifiers,
} from '../src/utils/predictGroups.js';

function dotColor(predictionMode, predictedQualifiers, best8ThirdIds, row, position) {
  const predictQualify = predictionMode && (
    position < 2
      ? predictedQualifiers?.has(row.teamId)
      : position === 2
        ? best8ThirdIds?.has(row.teamId)
        : false
  );
  return predictionMode
    ? predictQualify
      ? 'confirmed'
      : position === 2
        ? 'maybe'
        : 'eliminated'
    : null;
}

const simMethod = 'elo';

const allStandings = computeAllPredictedStandings(simMethod);
const { qualifiers, best8ThirdIds, thirdPlaces } = computePredictedQualifiers(allStandings);
const best8 = thirdPlaces.slice(0, 8);

console.log('=== Predicted top 3 per group ===');
for (const g of GROUP_NAMES) {
  const rows = allStandings[g];
  const top3 = rows.slice(0, 3).map((r, i) => {
    const name = TEAMS[r.teamId]?.name ?? r.teamId;
    const color = dotColor(true, qualifiers, best8ThirdIds, r, i);
    return `${i + 1}. ${name} (${r.pts}pts, GD${r.gf - r.ga}) → ${color}`;
  });
  console.log(`Group ${g}: ${top3.join(' | ')}`);
}

console.log('\n=== Best 8 third-place (should be GREEN) ===');
best8.forEach((t, i) => {
  const name = TEAMS[t.teamId]?.name ?? t.teamId;
  const inSet = best8ThirdIds.has(t.teamId);
  console.log(`${i + 1}. ${name} (Group ${t.groupId}) ${t.pts}pts GD${t.gd} GF${t.gf} inBest8=${inSet}`);
});

console.log('\n=== 3rd-place teams NOT in best 8 (should be YELLOW) ===');
thirdPlaces.slice(8).forEach((t, i) => {
  const name = TEAMS[t.teamId]?.name ?? t.teamId;
  console.log(`${i + 9}. ${name} (Group ${t.groupId}) ${t.pts}pts GD${t.gd} GF${t.gf}`);
});

console.log(`\nTotal qualifiers: ${qualifiers.size} (expected 32)`);

const missing = best8.filter(t => !best8ThirdIds.has(t.teamId));
if (missing.length) {
  console.error('BUG: best-8 third not in best8ThirdIds Set:', missing);
  process.exit(1);
}
console.log('OK: all best-8 third places are in best8ThirdIds Set');

console.log('\n=== Verify dot logic for all 3rd-place teams ===');
let mismatches = 0;
for (const g of GROUP_NAMES) {
  const rows = allStandings[g];
  const third = rows[2];
  const pos = 2;
  const color = dotColor(true, qualifiers, best8ThirdIds, third, pos);
  const inBest8 = best8ThirdIds.has(third.teamId);
  const expected = inBest8 ? 'confirmed' : 'maybe';
  const name = TEAMS[third.teamId]?.name ?? third.teamId;
  const ok = color === expected;
  if (!ok) mismatches++;
  console.log(`Group ${g} 3rd ${name}: inBest8=${inBest8} color=${color} expected=${expected} ${ok ? 'OK' : 'MISMATCH!'}`);
}
if (mismatches) process.exit(1);
