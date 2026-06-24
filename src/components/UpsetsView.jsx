import { useState } from 'react';
import { TEAMS } from '../data/teams.js';
import { UPCOMING_MATCHES } from '../data/upcomingMatches.js';
import { getPrediction } from '../utils/simulation.js';
import { computeChaos } from '../utils/chaos.js';
import FlagIcon from './FlagIcon.jsx';
import TeamModal from './TeamModal.jsx';

function getETDateStr(utcMs) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(utcMs));
}

function formatDateHeader(utcMs) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long', month: 'long', day: 'numeric',
  }).format(new Date(utcMs));
}

const LEVEL_LABEL = { HIGH: 'HIGH', MED: 'MEDIUM', LOW: 'LOW' };

// ── Predicted-score tunables ────────────────────────────────────────────────
// MARGIN: how aggressively chaos bends the scoreline toward the underdog.
// Interpreted as "goals of margin compression per percentage point of
// win-probability shifted toward the underdog" (chaos.deltaForDog is in
// percentage points, clamped to ±18). At the max +18 this is 18 * 0.06 ≈ 1.08
// goals of compression, split evenly (each side moves ~0.54): a LOW-chaos match
// barely moves off the base score, while a HIGH-chaos match can erase a
// one-goal favourite's margin and flip a close game. Reusing deltaForDog keeps
// the scoreline consistent with the "CHAOS ADJUSTED" win % shown on the card.
const CHAOS_WEIGHT = 0.06;

// TOTAL: how strongly the goal-environment signal (rain/heat/altitude/stakes,
// summarised by chaos.goalEnvDelta in goals) scales the match's TOTAL expected
// goals up or down. Without this, raw expected goals cluster near 1.3–2.0 and
// every score rounds to 2–1/1–2. 1.0 applies the signal at face value; raise it
// for more weather-driven spread, lower it to hug the base model totals.
const GOAL_ENV_WEIGHT = 1.0;

// Floor on total expected goals so suppression can still reach 0–0 but never
// produces negative/empty expectations.
const TOTAL_GOALS_FLOOR = 0.3;

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

function ChaosBar({ score, level }) {
  return (
    <div className="chaos-bar-wrap">
      <div
        className={`chaos-bar-fill chaos-bar-${level.toLowerCase()}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

function ChaosCard({ match, simMethod, predictionMode, now, playerPhotos }) {
  const [teamView, setTeamView] = useState(null);

  const kickoff = new Date(match.date).getTime();
  const isLive = kickoff <= now && now < kickoff + 2 * 60 * 60 * 1000;

  const chaos  = computeChaos(match);
  const pred   = getPrediction(match.home, match.away, simMethod);
  const homeTeam = TEAMS[match.home];
  const awayTeam = TEAMS[match.away];

  // Adjusted probabilities
  const isFavHome = chaos.favId === match.home;
  const dogWinBase = isFavHome ? pred.awayWin : pred.homeWin;
  const dogWinAdj  = Math.min(90, Math.max(2, dogWinBase + chaos.deltaForDog));
  const favWinBase = isFavHome ? pred.homeWin : pred.awayWin;
  const favWinAdj  = Math.max(5, favWinBase - chaos.deltaForDog);
  const drawBase   = pred.draw;

  const homeWinAdj = isFavHome ? favWinAdj : dogWinAdj;
  const awayWinAdj = isFavHome ? dogWinAdj : favWinAdj;

  const deltaSign = chaos.deltaForDog >= 0 ? '+' : '';

  // ── Chaos-blended predicted scoreline ──────────────────────────────────────
  // Work from the RAW (unrounded) expected goals so the final round produces
  // realistic variety instead of clustering at 2–1. computeChaos picks fav/dog
  // by Elo, so resolve which side is the favourite first.
  const rawFavGoals = isFavHome ? pred.lambdaHome : pred.lambdaAway;
  const rawDogGoals = isFavHome ? pred.lambdaAway : pred.lambdaHome;
  const baseTotal   = rawFavGoals + rawDogGoals;

  // 1. TOTAL: scale the whole goal expectation by the goal-environment signal
  // (rain/heat/altitude suppress; desperation/attacking form inflate), keeping
  // each side's share of the base total.
  const adjTotal = Math.max(
    TOTAL_GOALS_FLOOR,
    baseTotal + GOAL_ENV_WEIGHT * chaos.goalEnvDelta,
  );
  const favShare = baseTotal > 0 ? rawFavGoals / baseTotal : 0.5;
  let favGoalsExp = adjTotal * favShare;
  let dogGoalsExp = adjTotal * (1 - favShare);

  // 2. MARGIN: convert the win-probability shift into an expected-goals shift,
  // then split it — the favourite sheds half, the underdog gains half. Positive
  // deltaForDog narrows the favourite's margin; negative widens it.
  const chaosGoalShift = CHAOS_WEIGHT * chaos.deltaForDog;
  favGoalsExp -= chaosGoalShift / 2;
  dogGoalsExp += chaosGoalShift / 2;

  const favGoalsAdj = Math.max(0, Math.round(favGoalsExp));
  const dogGoalsAdj = Math.max(0, Math.round(dogGoalsExp));

  const homeGoalsPred = isFavHome ? favGoalsAdj : dogGoalsAdj;
  const awayGoalsPred = isFavHome ? dogGoalsAdj : favGoalsAdj;

  return (
    <>
      <div className={`chaos-card${isLive ? ' chaos-card-live' : ''}`}>

        {/* Meta bar */}
        <div className="chaos-card-meta">
          <span className="game-meta-group">Group {match.group}</span>
          <span className="game-meta-sep">·</span>
          {isLive
            ? <span className="game-meta-live">LIVE</span>
            : <span className="game-meta-time">{formatMatchTime(match.date)}</span>
          }
          <span className="game-meta-sep">·</span>
          <span className="game-meta-venue">{match.venue}</span>
        </div>

        {/* Body: teams + chaos score side by side */}
        <div className="chaos-card-body">

          {/* Teams column */}
          <div className="chaos-teams">
            <button className="chaos-team" onClick={() => setTeamView(match.home)}>
              <FlagIcon teamId={match.home} className="chaos-flag" />
              <div className="chaos-team-info">
                <span className="chaos-team-name">{homeTeam?.name ?? match.home}</span>
                <span className="chaos-team-elo">ELO {homeTeam?.elo ?? '—'}</span>
              </div>
              <span className={`chaos-team-pct${!isFavHome ? ' chaos-pct-dog' : ''}`}>
                {pred.homeWin}%
              </span>
            </button>

            <div className="chaos-teams-draw">
              <span className="chaos-draw-label">DRAW</span>
              <span className="chaos-draw-pct">{pred.draw}%</span>
            </div>

            <button className="chaos-team" onClick={() => setTeamView(match.away)}>
              <FlagIcon teamId={match.away} className="chaos-flag" />
              <div className="chaos-team-info">
                <span className="chaos-team-name">{awayTeam?.name ?? match.away}</span>
                <span className="chaos-team-elo">ELO {awayTeam?.elo ?? '—'}</span>
              </div>
              <span className={`chaos-team-pct${isFavHome ? ' chaos-pct-dog' : ''}`}>
                {pred.awayWin}%
              </span>
            </button>
          </div>

          {/* Predicted score — centered in the middle gap (PREDICT mode only) */}
          {predictionMode && (
            <div className="chaos-pred-mid">
              <span className="chaos-pred-label">PREDICTED SCORE</span>
              <span className="chaos-pred-line">
                <span className="chaos-pred-goal">{homeGoalsPred}</span>
                <span className="chaos-pred-dash">–</span>
                <span className="chaos-pred-goal">{awayGoalsPred}</span>
              </span>
            </div>
          )}

          {/* Chaos score column */}
          <div className="chaos-score-panel">
            <div className="chaos-score-header">CHAOS SCORE</div>
            <div className="chaos-score-row">
              <span className={`chaos-score-num chaos-num-${chaos.level.toLowerCase()}`}>
                {chaos.chaosScore}
              </span>
              <span className="chaos-score-denom">/100</span>
              <span className={`chaos-level-badge chaos-level-${chaos.level.toLowerCase()}`}>
                {LEVEL_LABEL[chaos.level]}
              </span>
            </div>
            <ChaosBar score={chaos.chaosScore} level={chaos.level} />
          </div>
        </div>

        {/* Drivers */}
        {chaos.drivers.length > 0 && (
          <div className="chaos-drivers">
            <div className="chaos-drivers-title">TOP CHAOS SIGNALS</div>
            {chaos.drivers.map((d, i) => (
              <div key={i} className="chaos-driver-row">
                <span className="chaos-driver-text">{d.text}</span>
                <span className={`chaos-driver-delta ${d.delta >= 0 ? 'delta-up' : 'delta-down'}`}>
                  {d.delta >= 0 ? '+' : ''}{d.delta}%
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Footer: probability comparison */}
        <div className="chaos-footer">
          <div className="chaos-footer-col">
            <span className="chaos-footer-label">MODEL</span>
            <span className="chaos-footer-val">
              {homeTeam?.name} <strong>{pred.homeWin}%</strong>
              <span className="chaos-footer-sep"> · </span>
              {awayTeam?.name} <strong>{pred.awayWin}%</strong>
            </span>
          </div>
          <div className="chaos-footer-divider" />
          <div className="chaos-footer-col">
            <span className="chaos-footer-label">CHAOS ADJUSTED</span>
            <span className="chaos-footer-val">
              {homeTeam?.name} <strong>{homeWinAdj}%</strong>
              <span className="chaos-footer-sep"> · </span>
              {awayTeam?.name} <strong>{awayWinAdj}%</strong>
              <span className={`chaos-adj-tag ${chaos.deltaForDog >= 0 ? 'delta-up' : 'delta-down'}`}>
                {deltaSign}{chaos.deltaForDog}% for {chaos.dogTeam?.name}
              </span>
            </span>
          </div>
        </div>
      </div>

      {teamView && (
        <TeamModal teamId={teamView} onBack={() => setTeamView(null)} backLabel="Close" playerPhotos={playerPhotos} />
      )}
    </>
  );
}

export default function UpsetsView({ simMethod, predictionMode, playerPhotos }) {
  const now = Date.now();

  const todayET    = getETDateStr(now);
  const tomorrowET = getETDateStr(now + 86400000);

  const upcoming = UPCOMING_MATCHES.filter(m => {
    const kickoff = new Date(m.date).getTime();
    const isNotOver = kickoff + 2 * 60 * 60 * 1000 > now;
    const matchDateET = getETDateStr(kickoff);
    return isNotOver && (matchDateET === todayET || matchDateET === tomorrowET);
  });

  // Sort chronologically (chaos still computed per-card)
  const sorted = upcoming
    .map(m => ({ match: m, kickoff: new Date(m.date).getTime() }))
    .sort((a, b) => a.kickoff - b.kickoff);

  if (sorted.length === 0) {
    return (
      <div className="coming-soon-view">
        <div className="coming-soon-label">NO UPCOMING MATCHES</div>
      </div>
    );
  }

  // Group by ET date, preserving chronological order
  const byDate = [];
  for (const item of sorted) {
    const key = getETDateStr(item.kickoff);
    let group = byDate.find(g => g.key === key);
    if (!group) {
      group = { key, label: formatDateHeader(item.kickoff), items: [] };
      byDate.push(group);
    }
    group.items.push(item);
  }

  return (
    <div className="upsets-view">
      <div className="upsets-header">
        <div className="upsets-header-title">CHAOS INDEX</div>
        <div className="upsets-header-sub">
          Today &amp; tomorrow — weather, altitude, crowd lean, travel, body clock, momentum. Sorted by date.
        </div>
      </div>

      {byDate.map(group => (
        <div className="upsets-date-group" key={group.key}>
          <div className="upsets-date-header">{group.label}</div>
          <div className="upsets-cards">
            {group.items.map(({ match }) => (
              <ChaosCard
                key={`${match.home}-${match.away}`}
                match={match}
                simMethod={simMethod}
                predictionMode={predictionMode}
                now={now}
                playerPhotos={playerPhotos}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
