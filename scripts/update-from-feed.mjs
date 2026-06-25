#!/usr/bin/env node
/**
 * Fetch openfootball World Cup 2026 results and regenerate match/standings data.
 *
 * Usage:
 *   node scripts/update-from-feed.mjs           # write src/data/*.js if changed
 *   node scripts/update-from-feed.mjs --dry-run # print diff only, no writes
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FEED_URL =
  'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';
const DRY_RUN = process.argv.includes('--dry-run');

const { PLAYED_MATCHES: CURRENT_PLAYED } = await import('../src/data/playedMatches.js');
const { UPCOMING_MATCHES: CURRENT_UPCOMING } = await import('../src/data/upcomingMatches.js');
const { GROUP_STANDINGS: CURRENT_STANDINGS, REMAINING_MATCHES: CURRENT_REMAINING } =
  await import('../src/data/groups.js');
const { TEAMS } = await import('../src/data/teams.js');

const teamMapJson = JSON.parse(readFileSync(join(__dirname, 'team-map.json'), 'utf8'));

// ── Team name normalization & mapping ───────────────────────────────────────

function normalizeTeamName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildTeamLookup() {
  const lookup = new Map(Object.entries(teamMapJson.aliases));

  for (const team of Object.values(TEAMS)) {
    lookup.set(normalizeTeamName(team.name), team.id);
  }

  return lookup;
}

const TEAM_LOOKUP = buildTeamLookup();

function resolveTeamCode(feedName) {
  const key = normalizeTeamName(feedName);
  const code = TEAM_LOOKUP.get(key);
  if (!code) {
    throw new Error(`Unmapped team name from feed: "${feedName}" (normalized: "${key}")`);
  }
  if (!TEAMS[code]) {
    throw new Error(`Mapped code "${code}" for "${feedName}" is not in TEAMS`);
  }
  return code;
}

function pairKey(a, b) {
  return [a, b].sort().join('|');
}

function parseGroup(groupField) {
  const m = /^Group ([A-L])$/.exec(groupField ?? '');
  return m ? m[1] : null;
}

function isKnockoutPlaceholder(name) {
  return /^(W\d+|L\d+|1[A-L]|2[A-L]|3[A-Z/]+)$/.test(name.trim());
}

// ── Fixtures (canonical schedule from committed data) ───────────────────────

function buildFixtures() {
  const fixtures = [];
  const seen = new Set();

  for (const m of [...CURRENT_PLAYED, ...CURRENT_UPCOMING]) {
    const key = `${m.group}:${pairKey(m.home, m.away)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    fixtures.push({
      home: m.home,
      away: m.away,
      group: m.group,
      date: m.date,
      venue: m.venue,
    });
  }

  fixtures.sort((a, b) => a.date.localeCompare(b.date) || a.group.localeCompare(b.group));
  return fixtures;
}

// ── Fetch feed ────────────────────────────────────────────────────────────────

async function fetchFeed(retries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(FEED_URL, { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!Array.isArray(json.matches) || json.matches.length === 0) {
        throw new Error('Feed missing or empty matches array');
      }
      return json;
    } catch (err) {
      lastError = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, attempt * 1000));
    }
  }
  throw new Error(`Failed to fetch feed after ${retries} attempts: ${lastError.message}`);
}

// ── Reconcile feed → played / upcoming ────────────────────────────────────────

function reconcile(feed, fixtures) {
  const fixtureByPair = new Map();
  for (const f of fixtures) {
    fixtureByPair.set(`${f.group}:${pairKey(f.home, f.away)}`, f);
  }

  const played = [];
  const matchedKeys = new Set();
  const unmapped = [];

  for (const m of feed.matches) {
    if (isKnockoutPlaceholder(m.team1) || isKnockoutPlaceholder(m.team2)) continue;

    const group = parseGroup(m.group);
    if (!group) continue;
    if (!m.score?.ft) continue;

    let code1;
    let code2;
    try {
      code1 = resolveTeamCode(m.team1);
      code2 = resolveTeamCode(m.team2);
    } catch (err) {
      unmapped.push(err.message);
      continue;
    }

    const key = `${group}:${pairKey(code1, code2)}`;
    const fixture = fixtureByPair.get(key);
    if (!fixture) {
      throw new Error(
        `Feed match ${m.team1} vs ${m.team2} (${group}) has no matching fixture in app schedule`,
      );
    }

    matchedKeys.add(key);
    const [ft1, ft2] = m.score.ft;
    if (!Number.isInteger(ft1) || !Number.isInteger(ft2) || ft1 < 0 || ft2 < 0) {
      throw new Error(`Invalid score for ${m.team1} vs ${m.team2}: ${JSON.stringify(m.score.ft)}`);
    }

    let hg;
    let ag;
    if (fixture.home === code1) {
      hg = ft1;
      ag = ft2;
    } else if (fixture.home === code2) {
      hg = ft2;
      ag = ft1;
    } else {
      throw new Error(`Orientation mismatch: fixture ${fixture.home}-${fixture.away}, feed ${code1}-${code2}`);
    }

    played.push({
      home: fixture.home,
      away: fixture.away,
      hg,
      ag,
      group: fixture.group,
      date: fixture.date,
      venue: fixture.venue,
    });
  }

  if (unmapped.length) {
    throw new Error(`Unmapped teams in feed:\n  ${unmapped.join('\n  ')}`);
  }

  played.sort((a, b) => a.date.localeCompare(b.date) || a.group.localeCompare(b.group));

  const playedKeys = new Set(played.map((m) => `${m.group}:${pairKey(m.home, m.away)}`));
  const upcoming = fixtures.filter((f) => !playedKeys.has(`${f.group}:${pairKey(f.home, f.away)}`));

  return { played, upcoming, matchedKeys };
}

// ── Derive standings & remaining ──────────────────────────────────────────────

function deriveGroupStandings(playedMatches) {
  const groups = Object.fromEntries('ABCDEFGHIJKL'.split('').map((g) => [g, {}]));

  for (const m of playedMatches) {
    for (const [teamId, gf, ga] of [
      [m.home, m.hg, m.ag],
      [m.away, m.ag, m.hg],
    ]) {
      if (!groups[m.group][teamId]) {
        groups[m.group][teamId] = { teamId, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
      }
      const row = groups[m.group][teamId];
      row.mp += 1;
      row.gf += gf;
      row.ga += ga;
      if (m.hg === m.ag) {
        row.d += 1;
        row.pts += 1;
      } else if (gf > ga) {
        row.w += 1;
        row.pts += 3;
      } else {
        row.l += 1;
      }
    }
  }

  const standings = {};
  for (const [g, rows] of Object.entries(groups)) {
    standings[g] = Object.values(rows).sort(
      (a, b) => b.pts - a.pts || b.gf - b.ga - (a.gf - a.ga) || b.gf - a.gf || a.teamId.localeCompare(b.teamId),
    );
  }
  return standings;
}

function deriveRemainingMatches(fixtures, playedMatches) {
  const playedKeys = new Set(
    playedMatches.map((m) => `${m.group}:${pairKey(m.home, m.away)}`),
  );
  const remaining = Object.fromEntries('ABCDEFGHIJKL'.split('').map((g) => [g, []]));

  for (const f of fixtures) {
    const key = `${f.group}:${pairKey(f.home, f.away)}`;
    if (!playedKeys.has(key)) {
      remaining[f.group].push({ home: f.home, away: f.away });
    }
  }

  return remaining;
}

// ── Validation ────────────────────────────────────────────────────────────────

function validate({ played, upcoming, standings, remaining }, fixtures) {
  if (played.length < CURRENT_PLAYED.length) {
    throw new Error(
      `Sanity check failed: played count would decrease (${CURRENT_PLAYED.length} → ${played.length})`,
    );
  }

  for (const m of played) {
    if (!TEAMS[m.home] || !TEAMS[m.away]) {
      throw new Error(`Unknown team in played match: ${m.home} vs ${m.away}`);
    }
    if (TEAMS[m.home].group !== m.group || TEAMS[m.away].group !== m.group) {
      throw new Error(`Group mismatch for ${m.home} vs ${m.away} in group ${m.group}`);
    }
  }

  const groupStageFixtures = fixtures.length;
  if (played.length + upcoming.length !== groupStageFixtures) {
    throw new Error(
      `Partition error: ${played.length} played + ${upcoming.length} upcoming ≠ ${groupStageFixtures} fixtures`,
    );
  }

  for (const g of 'ABCDEFGHIJKL') {
    const rows = standings[g];
    if (rows.length !== 4) {
      throw new Error(`Group ${g} standings has ${rows.length} teams (expected 4)`);
    }
    for (const row of rows) {
      if (row.mp > 3) throw new Error(`${row.teamId} has mp=${row.mp} (>3)`);
      if (row.pts !== row.w * 3 + row.d) {
        throw new Error(`${row.teamId} pts inconsistent with w/d/l`);
      }
    }
    if (remaining[g].length + rows[0].mp > 3) {
      // each team plays 3 MD; remaining pairs per group = unplayed fixtures
    }
  }
}

// ── JS file formatting ────────────────────────────────────────────────────────

function escVenue(v) {
  return v.includes("'") ? `"${v.replace(/"/g, '\\"')}"` : `'${v}'`;
}

function fmtMatch(m, withScore) {
  const venue = escVenue(m.venue);
  if (withScore) {
    return `  { home: '${m.home}', away: '${m.away}', hg: ${m.hg}, ag: ${m.ag}, group: '${m.group}', date: '${m.date}', venue: ${venue} },`;
  }
  return `  { home: '${m.home}', away: '${m.away}', group: '${m.group}', date: '${m.date}', venue: ${venue} },`;
}

function formatPlayedFile(played, sourceMeta) {
  const lines = played.map((m) => fmtMatch(m, true));
  return `// AUTO-GENERATED by scripts/update-from-feed.mjs — do not edit by hand.
// Source: ${sourceMeta}
// Completed group stage matches with venues — used by chaos.js for travel + altitude signals
// and by the standings/elimination logic for head-to-head tiebreakers.

export const PLAYED_MATCHES = [
${lines.join('\n')}
];
`;
}

function formatUpcomingFile(upcoming, sourceMeta) {
  const lines = upcoming.map((m) => fmtMatch(m, false));
  return `// AUTO-GENERATED by scripts/update-from-feed.mjs — do not edit by hand.
// Source: ${sourceMeta}
// All remaining group stage matches. \`date\` is the authoritative UTC kickoff time.

export const UPCOMING_MATCHES = [
${lines.join('\n')}
];
`;
}

function formatGroupsFile(standings, remaining, sourceMeta) {
  const fmtRow = (r) =>
    `    { teamId: '${r.teamId}', mp: ${r.mp}, w: ${r.w}, d: ${r.d}, l: ${r.l}, gf: ${r.gf}, ga: ${r.ga}, pts: ${r.pts} },`;
  const fmtPair = (p) => `    { home: '${p.home}', away: '${p.away}' },`;

  const standingBlocks = 'ABCDEFGHIJKL'
    .split('')
    .map((g) => `  ${g}: [\n${standings[g].map(fmtRow).join('\n')}\n  ],`)
    .join('\n');

  const remainingBlocks = 'ABCDEFGHIJKL'
    .split('')
    .map((g) => {
      const pairs = remaining[g];
      if (pairs.length === 0) return `  ${g}: [],`;
      return `  ${g}: [\n${pairs.map(fmtPair).join('\n')}\n  ],`;
    })
    .join('\n');

  return `// AUTO-GENERATED by scripts/update-from-feed.mjs — do not edit by hand.
// Source: ${sourceMeta}
// Group standings and remaining fixtures derived from PLAYED_MATCHES.

export const GROUP_STANDINGS = {
${standingBlocks}
};

export const REMAINING_MATCHES = {
${remainingBlocks}
};

export const GROUP_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
`;
}

// ── Diff helpers ──────────────────────────────────────────────────────────────

function matchId(m) {
  return `${m.group}:${m.home}-${m.away}`;
}

function summarizeDiff(current, next, label, idFn = matchId) {
  const curMap = new Map(current.map((m) => [idFn(m), m]));
  const nextMap = new Map(next.map((m) => [idFn(m), m]));
  const added = [];
  const removed = [];
  const changed = [];

  for (const [id, m] of nextMap) {
    if (!curMap.has(id)) added.push(m);
    else {
      const c = curMap.get(id);
      if (JSON.stringify(c) !== JSON.stringify(m)) changed.push({ from: c, to: m });
    }
  }
  for (const id of curMap.keys()) {
    if (!nextMap.has(id)) removed.push(curMap.get(id));
  }

  console.log(`\n── ${label} ──`);
  console.log(`  current: ${current.length}  →  next: ${next.length}`);
  if (added.length) {
    console.log(`  +${added.length} added:`);
    for (const m of added) console.log(`    ${idFn(m)}${m.hg != null ? ` (${m.hg}-${m.ag})` : ''}`);
  }
  if (removed.length) {
    console.log(`  -${removed.length} removed:`);
    for (const m of removed) console.log(`    ${idFn(m)}`);
  }
  if (changed.length) {
    console.log(`  ~${changed.length} changed:`);
    for (const { from, to } of changed) {
      console.log(`    ${idFn(from)}: ${JSON.stringify(from)} → ${JSON.stringify(to)}`);
    }
  }
  if (!added.length && !removed.length && !changed.length) console.log('  (no changes)');

  return { added, removed, changed };
}

function summarizeStandingsDiff(current, next) {
  console.log('\n── GROUP_STANDINGS (pts deltas) ──');
  let any = false;
  for (const g of 'ABCDEFGHIJKL') {
    const cur = new Map(current[g].map((r) => [r.teamId, r]));
    const nxt = new Map(next[g].map((r) => [r.teamId, r]));
    for (const [teamId, row] of nxt) {
      const prev = cur.get(teamId);
      if (!prev || prev.pts !== row.pts || prev.mp !== row.mp) {
        any = true;
        console.log(
          `  Group ${g} ${teamId}: mp ${prev?.mp ?? '?'}→${row.mp}, pts ${prev?.pts ?? '?'}→${row.pts}`,
        );
      }
    }
  }
  if (!any) console.log('  (no changes)');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(DRY_RUN ? 'DRY RUN — no files will be written' : 'Updating World Cup 2026 data from openfootball feed…');

  const fixtures = buildFixtures();
  console.log(`Loaded ${fixtures.length} group-stage fixtures from committed schedule`);

  const feed = await fetchFeed();
  const finishedInFeed = feed.matches.filter((m) => m.score?.ft && parseGroup(m.group)).length;
  console.log(`Fetched feed: ${feed.matches.length} matches (${finishedInFeed} finished group-stage)`);

  const { played, upcoming } = reconcile(feed, fixtures);
  const standings = deriveGroupStandings(played);
  const remaining = deriveRemainingMatches(fixtures, played);

  validate({ played, upcoming, standings, remaining }, fixtures);

  const sourceMeta = `openfootball 2026 @ ${FEED_URL} on ${new Date().toISOString()}`;
  const files = {
    played: formatPlayedFile(played, sourceMeta),
    upcoming: formatUpcomingFile(upcoming, sourceMeta),
    groups: formatGroupsFile(standings, remaining, sourceMeta),
  };

  const paths = {
    played: join(ROOT, 'src/data/playedMatches.js'),
    upcoming: join(ROOT, 'src/data/upcomingMatches.js'),
    groups: join(ROOT, 'src/data/groups.js'),
  };

  summarizeDiff(CURRENT_PLAYED, played, 'PLAYED_MATCHES');
  summarizeDiff(CURRENT_UPCOMING, upcoming, 'UPCOMING_MATCHES');
  summarizeStandingsDiff(CURRENT_STANDINGS, standings);

  const remainingCount = Object.values(remaining).reduce((n, arr) => n + arr.length, 0);
  const currentRemainingCount = Object.values(CURRENT_REMAINING).reduce((n, arr) => n + arr.length, 0);
  console.log(`\n── REMAINING_MATCHES ──`);
  console.log(`  current: ${currentRemainingCount}  →  next: ${remainingCount}`);

  const hashes = Object.fromEntries(
    Object.entries(files).map(([k, content]) => [k, createHash('sha256').update(content).digest('hex').slice(0, 12)]),
  );
  console.log(`\nOutput hashes: played=${hashes.played} upcoming=${hashes.upcoming} groups=${hashes.groups}`);

  if (DRY_RUN) {
    console.log('\nDry run complete. Re-run without --dry-run to write files.');
    return;
  }

  for (const [key, path] of Object.entries(paths)) {
    writeFileSync(path, files[key], 'utf8');
    console.log(`Wrote ${path}`);
  }

  console.log('\nUpdate complete.');
}

main().catch((err) => {
  console.error(`\nERROR: ${err.message}`);
  process.exit(1);
});
