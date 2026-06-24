import { useState, useEffect, Fragment } from 'react';
import 'flag-icons/css/flag-icons.min.css';
import './App.css';
import { runSimulation, getSlotProbs, buildMatchupTable, getPrediction, SIM_METHODS } from './utils/simulation.js';
import WinnerBanner from './components/WinnerBanner.jsx';
import GroupsView from './components/GroupsView.jsx';
import BracketView from './components/BracketView.jsx';
import UpsetsView from './components/UpsetsView.jsx';
import TeamModal from './components/TeamModal.jsx';
import FlagIcon from './components/FlagIcon.jsx';
import { TEAMS } from './data/teams.js';
import { GROUP_STANDINGS } from './data/groups.js';
import { UPCOMING_MATCHES } from './data/upcomingMatches.js';
import { LINEUPS } from './data/lineups.js';
import { PLAYER_WIKI } from './data/playerWiki.js';

// ─── Photo preload ─────────────────────────────────────────────────────────

async function fetchPhotoBatch(batch) {
  const wikiToName = {};
  const titles = batch.map(({ playerName, wikiTitle }) => {
    wikiToName[wikiTitle] = playerName;
    return wikiTitle;
  }).join('|');

  try {
    const { query } = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=pageimages&format=json&pithumbsize=100&origin=*&redirects=1`
    ).then(r => r.json());
    if (!query?.pages) return {};

    const resolvedMap = { ...wikiToName };
    if (query.normalized) for (const { from, to } of query.normalized) { if (resolvedMap[from]) resolvedMap[to] = resolvedMap[from]; }
    if (query.redirects)  for (const { from, to } of query.redirects)  { if (resolvedMap[from]) resolvedMap[to] = resolvedMap[from]; }

    const result = {};
    for (const page of Object.values(query.pages)) {
      if (page.thumbnail?.source && resolvedMap[page.title]) result[resolvedMap[page.title]] = page.thumbnail.source;
    }
    return result;
  } catch { return {}; }
}

async function preloadAllPhotos() {
  const seen = new Set();
  const entries = [];
  for (const lineup of Object.values(LINEUPS)) {
    for (const p of lineup.starting) {
      const wikiTitle = PLAYER_WIKI[p.name] ?? p.name;
      if (!seen.has(wikiTitle)) { seen.add(wikiTitle); entries.push({ playerName: p.name, wikiTitle }); }
    }
  }
  if (!entries.length) return {};

  const BATCH = 50;
  const run = arr => {
    const batches = [];
    for (let i = 0; i < arr.length; i += BATCH) batches.push(arr.slice(i, i + BATCH));
    return Promise.all(batches.map(fetchPhotoBatch)).then(r => Object.assign({}, ...r));
  };

  const photos = await run(entries);
  const fallback = entries.filter(({ playerName }) => !photos[playerName])
                          .map(({ playerName }) => ({ playerName, wikiTitle: `${playerName} (footballer)` }));
  if (fallback.length) Object.assign(photos, await run(fallback));
  return photos;
}

// ─── Time helpers ───────────────────────────────────────────────────────────

function formatMatchTime(dateStr) {
  const d = new Date(dateStr);
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
  const parts = fmt.formatToParts(d);
  const get = t => parts.find(p => p.type === t)?.value ?? '';
  const time = get('minute') === '00'
    ? `${get('hour')} ${get('dayPeriod')}`
    : `${get('hour')}:${get('minute')} ${get('dayPeriod')}`;
  return `${get('month')} ${get('day')} · ${time} ET`;
}

function getETDateKey(dateStr) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(dateStr));
}

function matchdayLabel(dateStr) {
  const d = new Date(dateStr);
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'numeric', day: 'numeric' }).formatToParts(d);
  const month = parseInt(parts.find(p => p.type === 'month')?.value ?? '6');
  const day   = parseInt(parts.find(p => p.type === 'day')?.value ?? '1');
  if (month === 6 && day <= 17) return 'MD1';
  if (month === 6 && day <= 23) return 'MD2';
  return 'MD3';
}

// ─── Next Match widget ──────────────────────────────────────────────────────

function MatchPair({ match }) {
  const home = TEAMS[match.home];
  const away = TEAMS[match.away];
  return (
    <div className="next-match-teams">
      <div className="nm-team">
        <FlagIcon teamId={match.home} className="nm-flag" />
        <span className="nm-name">{home?.name}</span>
      </div>
      <span className="nm-vs">vs</span>
      <div className="nm-team">
        <FlagIcon teamId={match.away} className="nm-flag" />
        <span className="nm-name">{away?.name}</span>
      </div>
    </div>
  );
}

function NextMatch() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  // Collect live matches first; fall back to the next simultaneous kickoff batch
  const live = UPCOMING_MATCHES.filter(m => {
    const t = new Date(m.date).getTime();
    return t <= now && now < t + 2 * 60 * 60 * 1000;
  });

  let batch, isLive;
  if (live.length > 0) {
    batch = live;
    isLive = true;
  } else {
    const future = UPCOMING_MATCHES.filter(m => new Date(m.date).getTime() > now);
    if (future.length === 0) return null;
    const nextTime = new Date(future[0].date).getTime();
    batch = future.filter(m => new Date(m.date).getTime() === nextTime);
    isLive = false;
  }

  return (
    <div className="wc-header-next">
      <div className={`next-match-pill${isLive ? ' pill-live' : ' pill-next'}`}>
        {isLive ? 'LIVE' : 'NEXT'}
      </div>
      {batch.slice(0, 2).map((m, i) => (
        <Fragment key={`${m.home}-${m.away}`}>
          {i > 0 && <div className="nm-match-sep" />}
          <MatchPair match={m} />
        </Fragment>
      ))}
      <span className="next-match-meta">{formatMatchTime(batch[0].date)}</span>
    </div>
  );
}

// ─── Game Card ──────────────────────────────────────────────────────────────

export function GameCardGrid({ homeId, awayId, simMethod, predictionMode, onHomeClick, onAwayClick }) {
  const pred = getPrediction(homeId, awayId, simMethod);
  const homeTeam = TEAMS[homeId];
  const awayTeam = TEAMS[awayId];
  const homeWins = pred.homeGoals > pred.awayGoals;
  const awayWins = pred.awayGoals > pred.homeGoals;
  const hElo = homeTeam?.elo ?? 1600;
  const aElo = awayTeam?.elo ?? 1600;

  return (
    <>
      <div className="game-card-grid">
        {/* Home */}
        <button className="game-side" onClick={onHomeClick}>
          {predictionMode && (
            <div className={`game-win-pct${homeWins ? ' pct-hi' : ''}`}>
              {pred.homeWin}% WIN
            </div>
          )}
          <div className="game-team-info">
            <FlagIcon teamId={homeId} className="game-flag" />
            <div className="game-team-text">
              <div className="game-name">{homeTeam?.name ?? 'TBD'}</div>
              {homeTeam && <div className="game-elo-sub">ELO {hElo.toLocaleString()} · #{homeTeam.rank}</div>}
            </div>
          </div>
        </button>

        {/* Center */}
        <div className="game-center">
          {predictionMode ? (
            <>
              <div className="game-score-row">
                <span className="game-goals">{pred.homeGoals}</span>
                <span className="game-colon">:</span>
                <span className="game-goals">{pred.awayGoals}</span>
              </div>
              <div className="game-draw-pct">Draw {pred.draw}%</div>
            </>
          ) : (
            <span className="game-vs">VS</span>
          )}
        </div>

        {/* Away */}
        <button className="game-side game-side-away" onClick={onAwayClick}>
          {predictionMode && (
            <div className={`game-win-pct${awayWins ? ' pct-hi' : ''}`}>
              {pred.awayWin}% WIN
            </div>
          )}
          <div className="game-team-info game-team-info-rev">
            <div className="game-team-text game-team-text-rev">
              <div className="game-name">{awayTeam?.name ?? 'TBD'}</div>
              {awayTeam && <div className="game-elo-sub">ELO {aElo.toLocaleString()} · #{awayTeam.rank}</div>}
            </div>
            <FlagIcon teamId={awayId} className="game-flag" />
          </div>
        </button>
      </div>

      {/* Probability strip */}
      {predictionMode && (
        <div className="game-prob-strip">
          <div style={{ width: `${pred.homeWin}%`, background: homeWins ? 'var(--green)' : 'var(--border)' }} />
          <div style={{ width: `${pred.draw}%`,    background: 'var(--border2)' }} />
          <div style={{ width: `${pred.awayWin}%`, background: awayWins ? 'var(--accent)' : 'var(--border)' }} />
        </div>
      )}
    </>
  );
}

function GameCard({ match, simMethod, predictionMode, playerPhotos, now }) {
  const [teamView, setTeamView] = useState(null);
  const kickoff = new Date(match.date).getTime();
  const isLive = kickoff <= now && now < kickoff + 2 * 60 * 60 * 1000;

  return (
    <>
      <div className={`game-card${isLive ? ' game-card-live' : ''}`}>
        <div className="game-card-meta">
          <span className="game-meta-group">Group {match.group}</span>
          <span className="game-meta-sep">·</span>
          {isLive
            ? <span className="game-meta-live">LIVE</span>
            : <span className="game-meta-time">{formatMatchTime(match.date)}</span>
          }
          <span className="game-meta-sep">·</span>
          <span className="game-meta-venue">{match.venue}</span>
        </div>
        <GameCardGrid
          homeId={match.home}
          awayId={match.away}
          simMethod={simMethod}
          predictionMode={predictionMode}
          onHomeClick={() => setTeamView(match.home)}
          onAwayClick={() => setTeamView(match.away)}
        />
      </div>

      {teamView && (
        <TeamModal teamId={teamView} onBack={() => setTeamView(null)} backLabel="Close" playerPhotos={playerPhotos} />
      )}
    </>
  );
}

// ─── Games View ─────────────────────────────────────────────────────────────

function GamesView({ simMethod, predictionMode, playerPhotos }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const active = UPCOMING_MATCHES.filter(
    m => new Date(m.date).getTime() + 2 * 60 * 60 * 1000 > now
  );

  const byDate = {};
  for (const match of active) {
    const etKey = getETDateKey(match.date);
    if (!byDate[etKey]) byDate[etKey] = [];
    byDate[etKey].push(match);
  }

  return (
    <div className="games-view">
      {Object.keys(byDate).sort().map(dateKey => {
        const matches = byDate[dateKey];
        const dateDisplay = formatMatchTime(matches[0].date).split(' · ')[0];
        return (
          <div key={dateKey} className="games-day">
            <div className="games-day-header">
              <span className="games-day-md">{matchdayLabel(matches[0].date)}</span>
              <span className="games-day-date">{dateDisplay}</span>
            </div>
            {matches.map(match => (
              <GameCard
                key={`${match.home}-${match.away}`}
                match={match}
                simMethod={simMethod}
                predictionMode={predictionMode}
                playerPhotos={playerPhotos}
                now={now}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── App root ────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState('upsets');
  const [allProbs, setAllProbs] = useState(null);
  const [slotProbs, setSlotProbs] = useState(null);
  const [matchupTables, setMatchupTables] = useState(null);
  const [simMethod, setSimMethod] = useState('elo');
  const [predictionMode, setPredictionMode] = useState(false);
  const [playerPhotos, setPlayerPhotos] = useState({});

  useEffect(() => {
    const t = setTimeout(() => {
      setAllProbs({
        elo:     runSimulation(60000, 'elo'),
        poisson: runSimulation(60000, 'poisson'),
        hybrid:  runSimulation(60000, 'hybrid'),
      });
      setSlotProbs(getSlotProbs(40000));
      setMatchupTables({
        elo:     buildMatchupTable('elo'),
        poisson: buildMatchupTable('poisson'),
        hybrid:  buildMatchupTable('hybrid'),
      });
    }, 50);
    preloadAllPhotos().then(setPlayerPhotos);
    return () => clearTimeout(t);
  }, []);

  const loading = !allProbs || !slotProbs;
  const simResults = allProbs?.[simMethod];

  return (
    <>
      {/* Full-width sticky dark header */}
      <header className="app-header">
        <div className="wc-topbar">
          <div className="wc-topbar-left">
            <div className="wc-header-title">
              <div className="wc-header-pre">WORLD CUP 2026</div>
              <h1 className="wc-header-main">PREDICTOR</h1>
            </div>
            <NextMatch />
          </div>
          <div className="wc-topbar-right">
            <div className="header-method-picker">
              <span className="header-method-label">MODEL</span>
              {SIM_METHODS.map(({ key, label, desc }) => (
                <button
                  key={key}
                  className={`header-method-btn${simMethod === key ? ' active' : ''}`}
                  onClick={() => setSimMethod(key)}
                  title={desc}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Constrained content */}
      <div className="app">
        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <span>Running tournament simulation…</span>
          </div>
        ) : (
          <>
            <WinnerBanner probs={simResults} method={simMethod} playerPhotos={playerPhotos} />

            {/* Nav sits directly under champion panel */}
            <nav className="stage-nav">
              <button
                className={`nav-predict-btn${predictionMode ? ' pred-on' : ''}`}
                onClick={() => setPredictionMode(m => !m)}
                title="Toggle score predictions"
              >
                <span className="nav-predict-dot" />
                PREDICT
                <span className="nav-predict-badge">{predictionMode ? 'ON' : 'OFF'}</span>
              </button>
              <div className="stage-nav-sep" />
              <button className={`stage-tab${view === 'upsets'  ? ' active' : ''}`} onClick={() => setView('upsets')}>UPSETS</button>
              <button className={`stage-tab${view === 'games'   ? ' active' : ''}`} onClick={() => setView('games')}>GAMES</button>
              <button className={`stage-tab${view === 'bracket' ? ' active' : ''}`} onClick={() => setView('bracket')}>BRACKET</button>
              <button className={`stage-tab${view === 'groups'  ? ' active' : ''}`} onClick={() => setView('groups')}>GROUPS</button>
            </nav>

            {view === 'games' ? (
              <GamesView simMethod={simMethod} predictionMode={predictionMode} playerPhotos={playerPhotos} />
            ) : view === 'groups' ? (
              <GroupsView probs={simResults} simMethod={simMethod} predictionMode={predictionMode} playerPhotos={playerPhotos} />
            ) : view === 'upsets' ? (
              <UpsetsView simMethod={simMethod} predictionMode={predictionMode} playerPhotos={playerPhotos} />
            ) : (
              <BracketView
                probs={simResults}
                slotProbs={slotProbs}
                matchupTable={matchupTables?.[simMethod]}
                predictionMode={predictionMode}
                simMethod={simMethod}
                playerPhotos={playerPhotos}
              />
            )}
          </>
        )}

        <footer className="app-footer">
          <span>Unofficial fan project — not affiliated with or endorsed by FIFA or any football federation.</span>
          <span>Player images via <a href="https://commons.wikimedia.org" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a> (CC BY-SA). Elo ratings from public historical data.</span>
        </footer>
      </div>
    </>
  );
}
