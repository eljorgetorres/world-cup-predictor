# Auto-Updating World Cup 2026 Results — Implementation Plan

> Goal: after every World Cup 2026 match finishes, the app's data updates **automatically** from a free API, so the maintainer no longer hand-edits `src/data/*.js`. Standings should become **derived from match results**, eliminating a whole class of manual error.

---

## TL;DR — Recommended Approach

- **Architecture: Option A — scheduled GitHub Actions cron** that fetches results, regenerates a single committed data file, and triggers the normal redeploy. This is the only option with **zero hosting cost, no exposed API key, and no new runtime infrastructure** for a static Vite/React app.
- **Primary data source: [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json)** — public-domain JSON at a stable raw URL, **no API key, no rate limit, covers 2026 with finished scores**. It updates "after each match" on a roughly daily, wiki-style cadence — which matches how this app is already maintained (post-match, not minute-by-minute).
- **Fallback / freshness upgrade: [API-Football (API-Sports) free tier](https://www.api-football.com/)** — `league=1&season=2026`, 100 requests/day, real official standings + fixtures with finished status. Used if openfootball lags or as a cross-check. Key lives only in GitHub Actions secrets (never shipped to the browser).
- **Biggest structural win:** stop hand-maintaining `GROUP_STANDINGS` (the `mp/w/d/l/gf/ga/pts` aggregates) and `REMAINING_MATCHES`. **Derive them from `PLAYED_MATCHES` + the fixture list** at build time (or even at app runtime). The feed only needs to supply finished match scores; everything else is computed. This removes the most error-prone manual step entirely.
- **Team identity:** the app uses 3-letter codes (`MEX`, `BIH`, …); the feeds use full names or numeric IDs. Introduce an explicit **mapping table** plus a **hard validation step that fails the job on any unmapped team** — never silently drop a match.
- **Safety:** every run validates the regenerated data, supports a **dry-run mode** (build artifact + diff, no commit), only commits when something actually changed, and leaves a **manual override path** so the maintainer can still correct the feed.

**MVP (ship first):** a Node script + daily GitHub Action that pulls openfootball, maps team names → codes, regenerates `PLAYED_MATCHES`, and commits. Standings stay as-is for one iteration. **Then** flip standings to derived-from-matches and increase cron frequency.

---

## 1. Current State of the Codebase (confirmed)

The app is a static Vite + React SPA. All tournament data is hardcoded in `src/data/` and imported directly by components and utils (no fetch, no backend).

### Data shapes (the contracts any automation must produce)

`src/data/teams.js` — `TEAMS`, keyed by 3-letter code:

```js
MEX: { id: 'MEX', name: 'Mexico', group: 'A', elo: 1884, rank: 13 },
```

`src/data/playedMatches.js` — `PLAYED_MATCHES`, an array of finished matches. `hg`/`ag` are final home/away goals; `group`, `date` (UTC ISO), and `venue` strings:

```js
{ home: 'MEX', away: 'RSA', hg: 2, ag: 0, group: 'A', date: '2026-06-11T23:00:00Z', venue: 'Estadio Azteca · Mexico City, MEX' },
```

`src/data/upcomingMatches.js` — `UPCOMING_MATCHES`, same shape minus scores:

```js
{ home: 'CAN', away: 'SUI', group: 'B', date: '2026-06-24T19:00:00Z', venue: 'BC Place · Vancouver, CAN' },
```

`src/data/groups.js` — two hand-maintained structures:
- `GROUP_STANDINGS[group]` → rows `{ teamId, mp, w, d, l, gf, ga, pts }` (the aggregate table)
- `REMAINING_MATCHES[group]` → `{ home, away }` pairs not yet played
- plus `GROUP_NAMES`.

### How the data is consumed (who breaks if shapes change)

| File | Imports | Uses |
| --- | --- | --- |
| `src/utils/standings.js` | `PLAYED_MATCHES` | Builds head-to-head tables from matches with non-null `hg`/`ag`; FIFA tiebreaker ranking. |
| `src/utils/groupStatus.js` | `GROUP_STANDINGS`, `REMAINING_MATCHES`, `GROUP_NAMES` | Brute-forces all remaining-match permutations to mark teams confirmed/eliminated/maybe. |
| `src/utils/simulation.js` | `TEAMS`, `GROUP_STANDINGS`, `REMAINING_MATCHES`, `GROUP_NAMES` | Monte-Carlo / scenario simulation. |
| `src/utils/chaos.js` | `TEAMS`, `GROUP_STANDINGS`, `UPCOMING_MATCHES`, `PLAYED_MATCHES` | Travel/altitude signals. |
| `src/components/*` (App, Groups, Bracket, Upsets, Winner, TeamModal) | `TEAMS`, `GROUP_STANDINGS`, `UPCOMING_MATCHES` | Rendering. |

**Key observation:** `GROUP_STANDINGS` and `REMAINING_MATCHES` are *redundant* — they can be computed from `PLAYED_MATCHES` + the full fixture list + `TEAMS`. `standings.js` already derives head-to-head purely from matches. This is why the recommended end state makes standings **derived**, not fetched.

### Manual edit pain points today (what we're automating away)

1. Move a match from `UPCOMING_MATCHES` → `PLAYED_MATCHES` and add `hg`/`ag`.
2. Recompute and edit the four affected `GROUP_STANDINGS` rows by hand (`mp/w/d/l/gf/ga/pts`).
3. Remove the played pair from `REMAINING_MATCHES`.
4. Keep `home`/`away` orientation and `venue` strings consistent.

Steps 2–4 are pure derivation and are where manual error creeps in.

---

## 2. Free Data Source Comparison

| Source | 2026 WC w/ finished scores? | Auth / key | Free-tier limit | Freshness | Reliability | License / ToS | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| **openfootball/worldcup.json** | **Yes** — `2026/worldcup.json` includes `score.ft` per finished match | **None** | **None** (raw GitHub / CDN) | Wiki/manual, ~daily, "results land after each match" (maintainer commits, GH Action regenerates JSON) | High for our cadence; depends on a volunteer maintainer, but it's just a Git file we can pin/mirror | **Public domain** (no attribution required) | **Primary** |
| **API-Football (API-Sports v3)** | **Yes** — `league=1&season=2026`; `/fixtures` (status `FT`), `/standings` (official) | API key (`x-apisports-key` header) | **100 req/day**, all endpoints | Official, updated to final results promptly | High, commercial-grade | Paid ToS; free tier fine for non-commercial/low volume; **do not expose key client-side** | **Fallback / cross-check / freshness upgrade** |
| football-data.org | World Cup included, but **live/finished scores are delayed on free; live behind €12+/mo** | API key | 10 req/min, current season only | Delayed on free | High | ToS; attribution encouraged | Secondary fallback |
| TheSportsDB | World Cup events exist | Free key `123` (v1); **livescores require $9/mo v2** | 30 req/min (free v1) | v1 not live; updates lag | Medium; community-edited | ToS; attribution | Optional cross-check only |
| Wikipedia / Wikidata | Yes (scores in article tables) | None | None (be polite) | Fast but unstructured | Medium; HTML scraping is brittle | CC-BY-SA | Not recommended (parsing cost) |
| FIFA public/unofficial JSON | Yes | None (unofficial) | Unknown / unstable | Fast | **Low** — undocumented, can change/break | Unofficial; ToS unclear | Not recommended as primary |

### Why openfootball is the primary

- **No key** → nothing to store as a secret, nothing to leak, works even from the browser if we ever wanted Option C.
- **Stable shape & URL:** `https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json`.
- **Matches our update model:** this app already updates *after* matches finish, not live. openfootball's daily cadence is sufficient. (Confirmed via the maintainer's own issue comments: wiki-style, ~daily, "not designed for minute-by-minute live updates.")
- **Public domain** removes licensing risk for a hobby project.

### Confirmed openfootball 2026 response shape

```json
{
  "name": "World Cup 2026",
  "matches": [
    {
      "round": "Matchday 1",
      "date": "2026-06-11",
      "time": "13:00 UTC-6",
      "team1": "Mexico",
      "team2": "South Africa",
      "score": { "ft": [2, 0], "ht": [1, 0] },
      "goals1": [ { "name": "Julián Quiñones", "minute": "9" } ],
      "goals2": [],
      "group": "Group A",
      "ground": "Mexico City"
    }
  ]
}
```

- Finished matches have a `score.ft` array `[team1Goals, team2Goals]`. **Unplayed matches omit `score`** → that's our "finished?" test.
- Teams are **full names** (`"Mexico"`, `"Czech Republic"`, `"Bosnia & Herzegovina"`), not codes → name-based mapping needed.
- `group` is `"Group A"`; `ground` is a city only (lossy vs the app's rich venue strings — see §3).

### Important nuance — home/away orientation differs between feed and app

The app sometimes stores the opposite orientation from openfootball. Example (Group A, Matchday 1):
- App: `{ home: 'CZE', away: 'KOR', hg: 1, ag: 2 }`
- openfootball: `team1: "South Korea", team2: "Czech Republic", score.ft: [2, 1]`

Same result, opposite `home`/`away`. The mapping logic must **match fixtures by unordered team pair** and then **re-orient the score** to whatever orientation the app/fixture list uses, rather than blindly copying `team1→home`. (Group-stage points/GD are orientation-independent, but the stored row and the head-to-head record key off specific `home`/`away`, so we must normalize.)

---

## 3. Architecture Options

### Option A — Scheduled GitHub Actions cron (RECOMMENDED)

A workflow runs on a cron, executes a Node generator script, regenerates the data file(s), and commits. The existing deploy pipeline (e.g. GitHub Pages / Vercel / Netlify on push) redeploys automatically.

```
GitHub Actions (cron)
  └─ node scripts/update-results.mjs
        ├─ fetch openfootball 2026 JSON  (fallback: API-Football)
        ├─ map team names → 3-letter codes  (validate: fail on unmapped)
        ├─ reconcile finished matches into PLAYED_MATCHES (preserve venue/orientation)
        ├─ (phase 2) derive GROUP_STANDINGS + REMAINING_MATCHES from matches
        ├─ validate output (schema + invariants)
        └─ write src/data/generated/*.js (or .json)
  └─ if changed: git commit & push  →  triggers redeploy
```

| Criterion | Assessment |
| --- | --- |
| Cost | **$0** — GitHub Actions free minutes; no servers. |
| Complexity | Low–medium; one script + one workflow. |
| Secret handling | **None for openfootball.** API-Football key (if used) lives in Actions secrets, never in the bundle. |
| Reliability | High; if a run fails, data simply stays at last good commit. |
| "After every game" timeliness | Cron granularity (e.g. every 30–60 min). Good enough given the app's post-match model and openfootball's cadence. |
| Auditability | **Every update is a git commit** → full history, easy revert, easy manual override. |

### Option B — Serverless / edge function at runtime

App calls `/api/results` (Vercel/Netlify/Cloudflare function) which proxies the feed and reshapes it.

- Pros: fresher (per-request), key stays server-side.
- Cons: adds runtime infra + cold starts; the app is currently fully static; standings logic would need to move or run client-side on fetched data; more moving parts for a hobby app. Caching still needed to respect rate limits.
- Verdict: overkill unless near-live updates become a hard requirement.

### Option C — Client-side fetch directly from a free API

Browser fetches the feed on load.

- Pros: simplest conceptually; with openfootball there's **no key and no CORS key issue** (raw GitHub allows CORS), so it's actually viable for *this specific source*.
- Cons: every visitor hits the source; no commit history/audit; can't run the Node-only generation/validation; API-Football fallback would **expose the key** (disqualifying). Loses the "data as code + git history" benefit.
- Verdict: not recommended as the system of record. (Could be a future *progressive enhancement*: ship committed data, then optionally refresh client-side from openfootball for same-day freshness.)

**Decision: Option A.** It's free, secret-safe, auditable, and fits a static site with zero new infra.

---

## 4. Data-Mapping Plan (feed → app shapes)

### 4.1 Source of truth for fixtures, venues, dates

The app's `venue` strings (`"Estadio Azteca · Mexico City, MEX"`) and exact UTC `date` values are **richer than openfootball** (which gives city + local time only). Therefore:

- **Keep the existing fixture list (teams + group + date + venue) as the canonical schedule.** Introduce a single `FIXTURES` source (derived from today's `PLAYED_MATCHES` + `UPCOMING_MATCHES`) that holds `{ home, away, group, date, venue }` for all 104 matches.
- The feed supplies **only scores + finished status**. We never overwrite venue/date from the feed (avoids regressions in `chaos.js`, which keys off venue strings).

### 4.2 Match reconciliation algorithm

For each finished feed match (has `score.ft`):

1. Map `team1`/`team2` full names → codes via the mapping table (§5).
2. Find the matching fixture by **unordered pair `{codeA, codeB}` within the same group** (and same matchday/date if needed to disambiguate — group pairs are unique within group stage).
3. Read the fixture's canonical `home`/`away`. Assign `hg`/`ag` by orientation:
   - if fixture `home === team1` → `hg = ft[0]`, `ag = ft[1]`
   - else (`home === team2`) → `hg = ft[1]`, `ag = ft[0]`
4. Emit a `PLAYED_MATCHES` row: `{ home, away, hg, ag, group, date, venue }` using the fixture's `group/date/venue`.
5. Any fixture **without** a finished feed score remains in `UPCOMING_MATCHES`.

### 4.3 Deriving standings (the key cleanup — Phase 2)

Replace hand-maintained `GROUP_STANDINGS` and `REMAINING_MATCHES` with a pure function over matches:

```js
// pseudo: build aggregate rows from finished matches
function deriveGroupStandings(playedMatches, teams) {
  // for each team init {mp,w,d,l,gf,ga,pts}=0
  // for each played match: update both teams' mp, gf, ga, w/d/l, pts (3/1/0)
  // group rows by team.group; return { A: [...], B: [...], ... }
}

function deriveRemainingMatches(fixtures, playedSet) {
  // every fixture whose {home,away} isn't in playedSet, grouped, as {home, away}
}
```

This makes standings **impossible to get out of sync with results**, and `groupStatus.js`/`simulation.js`/components keep their exact import names (`GROUP_STANDINGS`, `REMAINING_MATCHES`) — they just import from a generated/derived module. **Call-out:** this is the single highest-value change; it deletes manual steps 2 and 3 from §1 permanently.

> Migration note: to keep the diff small and reviewable, Phase 1 can still emit `GROUP_STANDINGS` as a *generated literal* (computed by the script, written to a file) so imports don't move. Phase 2 then optionally collapses it into a runtime `derive*()` so there's nothing to store at all. Either way the numbers stop being typed by hand.

### 4.4 Team `rank`/`elo`

`elo` and `rank` in `teams.js` are model inputs, **not** match-derived, and the feeds don't carry the app's Elo. **Leave `TEAMS` untouched by automation** (manual/curated). Optionally, a *separate* later job could refresh world ranking from a ranking source, but treat it as out of scope for results auto-update.

### 4.5 Output format

- Write to `src/data/generated/results.generated.js` (or `.json` imported by thin wrappers) with a header banner: `// AUTO-GENERATED by scripts/update-results.mjs — do not edit by hand. Source: openfootball 2026 @ <commit/sha> on <timestamp>.`
- Thin re-export modules keep current import paths stable:
  - `playedMatches.js` → re-exports generated `PLAYED_MATCHES`
  - `upcomingMatches.js` → re-exports generated `UPCOMING_MATCHES`
  - `groups.js` → re-exports generated `GROUP_STANDINGS`/`REMAINING_MATCHES` (or the derive functions)

---

## 5. Team / ID Mapping Strategy

The app's codes are non-standard in places (e.g. `ALG` not `ALG`/`DZA`, `HTI` for Haiti, `RSA`, `BIH`, `CUW`, `DRC`). The feed uses full names. Strategy:

1. **Authoritative mapping table** keyed by **normalized full name → app code**, derived from `TEAMS` (`name → id`) plus an explicit **alias list** for naming differences. Examples to verify against the feed:

   | App `name` / code | openfootball name (verify) |
   | --- | --- |
   | `CIV` "Ivory Coast" | "Ivory Coast" / "Côte d'Ivoire" |
   | `DRC` "DR Congo" | "DR Congo" / "Congo DR" |
   | `KOR` "South Korea" | "South Korea" / "Korea Republic" |
   | `BIH` "Bosnia & Herzegovina" | "Bosnia & Herzegovina" / "Bosnia and Herzegovina" |
   | `CUW` "Curaçao" | "Curaçao" / "Curacao" |
   | `CPV` "Cape Verde" | "Cape Verde" / "Cabo Verde" |
   | `USA` "United States" | "United States" / "USA" |

2. **Normalization:** lower-case, strip accents/diacritics, collapse `&`/`and`, trim — so `"Curaçao"`, `"Curacao"`, `"CURAÇAO"` all resolve.
3. **Validation = hard failure.** If a feed match references a team name that doesn't resolve to a known code, the script **throws and the job fails** (no commit). This surfaces new aliases immediately instead of silently dropping a match. Log the offending name(s) for a one-line alias fix.
4. **For API-Football fallback:** map by numeric `team_id` (stable per provider) using a second small table, since names there may differ again.
5. Cross-check: every resolved code must exist in `TEAMS`; every group-stage fixture's two codes must share the same `group`.

---

## 6. Scheduling & "After Every Game" Trigger

- **Cron:** during the tournament, run **every 30 minutes** (`*/30 * * * *`). GitHub Actions cron is best-effort (can lag a few minutes) — fine here. Optionally tighten to every 15 min on match days; relax to a few times/day otherwise.
- **Detect newly finished matches:** a feed match is "finished" iff it has `score.ft`. Compute the set of finished pairs; compare to what's already in `PLAYED_MATCHES`. If the regenerated file is byte-identical to the committed one, **do nothing** (no empty commits).
- **Idempotency:** generation is a pure function of the feed + fixtures + mapping. Re-running yields the same output → safe to run on any cadence. Sort matches deterministically (by date, then group) so diffs are minimal and stable.
- **Avoid clobbering manual edits:** see §7 override path. Generated files carry the "do not edit by hand" banner; manual corrections go into a small `overrides` file the script merges last (manual wins), so a human fix is never overwritten by a stale/wrong feed.
- **Manual trigger:** also enable `workflow_dispatch` so the maintainer can force a run on demand.

---

## 7. Failure Handling & Safety

1. **Fetch resilience:** timeout + 2–3 retries with backoff. If primary (openfootball) fails or returns malformed JSON, optionally try fallback (API-Football). If both fail → **exit non-zero, no commit** (last good data stays live).
2. **Schema + invariant validation before writing/committing:**
   - JSON parses; `matches` is a non-empty array.
   - Every finished match maps to exactly one known fixture and two known team codes.
   - Scores are non-negative integers.
   - Each group ends with exactly 4 teams and ≤ 6 played matches.
   - Derived `mp` per team ≤ 3 (group stage); `pts` consistent with `w/d/l`.
   - No fixture is both played and upcoming.
   - **Sanity guard:** refuse to drop a large number of previously-played matches (guards against the feed briefly returning a truncated/empty dataset). E.g. fail if played-count would *decrease*.
3. **Dry-run mode:** `node scripts/update-results.mjs --dry-run` prints a **diff** of what would change (added matches, standings deltas) and writes nothing. The Action runs dry-run on PRs; real run only on the scheduled/`main` job.
4. **Alerting:** on failure, the Action fails visibly (red check + GitHub's default failure email). Optionally post to a webhook/Issue. Because each update is a commit, the maintainer can also just watch the commit log.
5. **Manual override path:**
   - `src/data/overrides.js` (hand-maintained) merged *after* feed data — manual entries win. Use for "feed is wrong / late" corrections.
   - Or revert the offending auto-commit; next run regenerates from the (now corrected) feed/overrides.
6. **Pin / mirror primary source:** optionally vendor a daily snapshot of the openfootball JSON into the repo (the commit *is* the audit trail) so a transient upstream outage or bad upstream edit can't break a build mid-tournament.

---

## 8. Phased Implementation Roadmap

### Phase 0 — Prep (no behavior change)
- Add `docs/` (this file). Decide cadence and whether to register an API-Football key for fallback.
- Snapshot current `src/data/*.js` as the baseline for diffing.

### Phase 1 — MVP: auto-update `PLAYED_MATCHES` + `UPCOMING_MATCHES`
- Build `FIXTURES` (canonical schedule) from current played+upcoming.
- Write `scripts/update-results.mjs`:
  - fetch openfootball → map names → reconcile finished matches (with orientation fix) → write generated played/upcoming files (preserving venue/date) → validate → emit only on change.
- Add `--dry-run`.
- Add GitHub Action: `workflow_dispatch` + daily cron; commit on change.
- **Standings still hand/generated as a literal** this phase (lowest risk). Verify the app renders identically to today.

### Phase 2 — Derive standings (kill manual steps 2–3)
- Implement `deriveGroupStandings()` and `deriveRemainingMatches()`.
- Repoint `groups.js` to the derived values (imports unchanged for consumers).
- Confirm `groupStatus.js`, `simulation.js`, components produce the same confirmed/eliminated/maybe results as before on current data (snapshot test).

### Phase 3 — Hardening & freshness
- Increase cron to every 15–30 min on match days.
- Add API-Football fallback + cross-check (flag mismatches between sources in the dry-run diff).
- Add invariant tests in CI and a small snapshot test for the generator (fixture JSON in → expected data out).
- Add `overrides.js` merge + sanity guards (§7).

### Phase 4 — Optional enhancements
- Knockout-stage support (openfootball `cup_finals.txt` / `/fixtures` rounds) feeding `BracketView`.
- Optional client-side same-day refresh from openfootball (progressive enhancement on top of committed data).
- Optional separate ranking/Elo refresh job (kept independent of results).

---

## 9. Concrete Next Actions & Open Questions

**Next actions (maintainer):**
1. Confirm the deploy trigger (does a push to `main` already redeploy? GitHub Pages / Vercel / Netlify?) so the Action's commit actually ships.
2. Decide cadence (suggest: every 30 min during the tournament).
3. (Optional, for fallback) Register a free **API-Football** account, get the key, add it as a GitHub Actions secret `APIFOOTBALL_KEY`. Not needed for the openfootball-only MVP.
4. Approve the plan to **derive standings** (Phase 2) — this is the change that removes the most manual work.

**Open questions / decisions:**
- **Source-of-truth cadence:** is daily-ish (openfootball) acceptable, or is near-live required? If near-live is mandatory, reconsider Option B + API-Football. (Recommendation: daily-ish is fine given the app's current model.)
- **Generated vs derived standings:** keep a generated literal (simpler diff/audit) or fully runtime-derive (nothing stored)? (Recommendation: generated literal in Phase 1, evaluate runtime-derive in Phase 2.)
- **Venue/date authority:** confirm we always keep the app's rich `venue`/`date` and never take them from the feed. (Recommendation: yes — feed supplies scores only.)
- **Alias coverage:** do a one-time pass mapping all 48 team names openfootball uses to the app's codes (esp. CIV, DRC, KOR, BIH, CUW, CPV, USA) before the first live run.
- **Knockout stage:** in scope now or a later phase? (Recommendation: Phase 4.)

---

## 10. Implementation (local setup)

**Status:** implemented and deployed via GitHub Actions on `main` (2026-06-25).

| Artifact | Path | Purpose |
| --- | --- | --- |
| Update script | `scripts/update-from-feed.mjs` | Fetches openfootball, maps teams, reconciles scores (with home/away orientation fix), derives standings + remaining fixtures, writes `src/data/*.js` |
| Team aliases | `scripts/team-map.json` | Normalized feed name → app 3-letter code; merged with `TEAMS` names at runtime |
| GitHub Action | `.github/workflows/update-scores.yml` | Cron every 30 min + `workflow_dispatch`; runs script and commits on change. Requires **Settings → Actions → General → Workflow permissions → Read and write**. |

### Commands

```bash
# Preview changes (no writes)
node scripts/update-from-feed.mjs --dry-run

# Apply updates locally
node scripts/update-from-feed.mjs
```

### What the script does (Phase 1 + derived standings)

1. Loads the **canonical fixture list** from committed `PLAYED_MATCHES` + `UPCOMING_MATCHES` (preserves venue/date/home-away).
2. Fetches `https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json`.
3. Maps feed team names via `scripts/team-map.json` + `TEAMS`; **throws on unmapped names**.
4. Matches finished feed rows to fixtures by **unordered pair within group**; re-orients `hg`/`ag` to the fixture's `home`/`away`.
5. Derives `GROUP_STANDINGS` and `REMAINING_MATCHES` from finished matches.
6. Validates (non-negative scores, no played-count regression, partition of fixtures, pts consistency).
7. Writes `src/data/playedMatches.js`, `upcomingMatches.js`, `groups.js` with an auto-generated banner (or prints diff in `--dry-run`).

Knockout placeholder teams in the feed (`W73`, `2A`, etc.) are skipped until Phase 4.

### Fallback (not wired yet)

If openfootball lags or is unavailable, [API-Football](https://www.api-football.com/) (`league=1&season=2026`) can be added as a fallback using a GitHub Actions secret `APIFOOTBALL_KEY`. The openfootball path is the default and requires no key.

### Still manual

- `src/data/teams.js` — Elo and FIFA rank values
- Knockout bracket data (Phase 4)
- Venue/date/kickoff schedule for fixtures not yet in committed `PLAYED_MATCHES` + `UPCOMING_MATCHES`

### Manual override

If the feed is wrong, revert the auto-commit or edit data by hand and re-run. A dedicated `overrides.js` merge (§7) is planned for Phase 3.

---

### Appendix — Key URLs
- openfootball 2026 JSON: `https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json`
- openfootball repo / README: `https://github.com/openfootball/worldcup.json`
- API-Football WC2026 guide (`league=1&season=2026`): `https://www.api-football.com/news/post/fifa-world-cup-2026-guide-to-using-data-with-api-sports`
- API-Football pricing (free = 100 req/day, all endpoints): `https://www.api-football.com/pricing`
- football-data.org pricing/coverage (free = delayed scores, 10 req/min): `https://www.football-data.org/pricing`
