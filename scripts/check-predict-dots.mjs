/**
 * Playwright check: Groups predict mode dot colors vs expected.
 * Run: node scripts/check-predict-dots.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { GROUP_NAMES } from '../src/data/groups.js';
import {
  computeAllPredictedStandings,
  computePredictedQualifiers,
} from '../src/utils/predictGroups.js';

function dotColor(qualifiers, best8ThirdIds, row, position) {
  const predictQualify = position < 2
    ? qualifiers.has(row.teamId)
    : position === 2
      ? best8ThirdIds.has(row.teamId)
      : false;
  return predictQualify ? 'qs-confirmed' : position === 2 ? 'qs-maybe' : 'qs-eliminated';
}

const allStandings = computeAllPredictedStandings('elo');
const { qualifiers, best8ThirdIds } = computePredictedQualifiers(allStandings);

const server = await createServer({
  configFile: './vite.config.js',
  server: { port: 5199, strictPort: false },
});
await server.listen();
const url = server.resolvedUrls?.local?.[0] ?? 'http://localhost:5199';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(url);
await page.waitForSelector('.nav-predict-btn');
await page.click('.nav-predict-btn');
await page.click('button:has-text("Groups")');
await page.waitForSelector('.group-card-predict');

const results = await page.evaluate(() => {
  const cards = document.querySelectorAll('.group-card-predict');
  return Array.from(cards).map(card => {
    const groupId = card.querySelector('.group-card-header')?.textContent?.match(/Group (\w)/)?.[1];
    const rows = card.querySelectorAll('tbody tr');
    return {
      groupId,
      teams: Array.from(rows).map((row, i) => ({
        position: i,
        name: row.querySelector('.t-name')?.textContent?.trim(),
        dotClass: row.querySelector('.qual-dot')?.className ?? '',
      })),
    };
  });
});

await browser.close();
await server.close();

let failures = 0;
console.log('=== DOM vs Expected ===');
for (const card of results) {
  const g = card.groupId;
  const standings = allStandings[g];
  if (!standings) continue;
  for (const team of card.teams) {
    const row = standings[team.position];
    if (!row) continue;
    const expectedColor = dotColor(qualifiers, best8ThirdIds, row, team.position);
    const actualHasConfirmed = team.dotClass.includes('qs-confirmed');
    const actualHasMaybe = team.dotClass.includes('qs-maybe');
    const actualHasElim = team.dotClass.includes('qs-eliminated');
    const actualColor = actualHasConfirmed ? 'qs-confirmed' : actualHasMaybe ? 'qs-maybe' : actualHasElim ? 'qs-eliminated' : 'unknown';
    const ok = actualColor === expectedColor;
    if (!ok) {
      failures++;
      console.log(`FAIL Group ${g} pos ${team.position + 1} ${team.name}: expected ${expectedColor}, got ${actualColor}`);
    }
    if (team.position === 2) {
      const inBest8 = best8ThirdIds.has(row.teamId);
      const label = inBest8 ? 'GREEN' : 'YELLOW';
      console.log(`  Group ${g} 3rd ${team.name}: expected ${label}, dot=${actualColor} ${ok ? 'OK' : 'FAIL'}`);
    }
  }
}
console.log(`\nTotal failures: ${failures}`);
process.exit(failures > 0 ? 1 : 0);
