import { useEffect } from 'react';
import { TEAMS } from '../data/teams.js';
import { LINEUPS } from '../data/lineups.js';
import { GROUP_STANDINGS } from '../data/groups.js';
import FlagIcon from './FlagIcon.jsx';

const BENCH_POS_PRIORITY = {
  ST: 0, CF: 0, FW: 0, RW: 0, LW: 0, AM: 0,
  CM: 1, DM: 1, RM: 1, LM: 1,
  CB: 2, RB: 2, LB: 2, RWB: 2, LWB: 2,
  GK: 3,
};

function parseLines(formation) {
  return [1, ...formation.split('-').map(Number)];
}

// Photos are preloaded at app startup and passed in as a prop

function PitchSVG() {
  const W = 68, H = 105;
  const pbW = 40.32, pbH = 16.5;
  const gaW = 18.32, gaH = 5.5;
  const spotY = 11.5;
  const cr = 9.15;
  const pbX = (W - pbW) / 2;
  const gaX = (W - gaW) / 2;
  const arcDist = (0.5 + pbH) - (0.5 + spotY);
  const arcOff = Math.sqrt(cr * cr - arcDist * arcDist);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pitch-svg" aria-hidden="true">
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i}
          x={0.5} y={0.5 + i * (H - 1) / 14}
          width={W - 1} height={(H - 1) / 14}
          fill={i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent'} />
      ))}
      <rect x={0.5} y={0.5} width={W - 1} height={H - 1}
        fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={0.6} />
      <line x1={0.5} y1={H / 2} x2={W - 0.5} y2={H / 2}
        stroke="rgba(255,255,255,0.55)" strokeWidth={0.6} />
      <circle cx={W / 2} cy={H / 2} r={cr}
        fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={0.6} />
      <circle cx={W / 2} cy={H / 2} r={0.5} fill="rgba(255,255,255,0.7)" />
      <rect x={pbX} y={0.5} width={pbW} height={pbH}
        fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={0.6} />
      <rect x={gaX} y={0.5} width={gaW} height={gaH}
        fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={0.6} />
      <circle cx={W / 2} cy={0.5 + spotY} r={0.5} fill="rgba(255,255,255,0.7)" />
      <path
        d={`M ${W/2 - arcOff} ${0.5 + pbH} A ${cr} ${cr} 0 0 0 ${W/2 + arcOff} ${0.5 + pbH}`}
        fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={0.6} />
      <path d={`M 1.5 0.5 A 1 1 0 0 1 0.5 1.5`}
        fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={0.6} />
      <path d={`M ${W - 1.5} 0.5 A 1 1 0 0 0 ${W - 0.5} 1.5`}
        fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={0.6} />
      <rect x={pbX} y={H - 0.5 - pbH} width={pbW} height={pbH}
        fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={0.6} />
      <rect x={gaX} y={H - 0.5 - gaH} width={gaW} height={gaH}
        fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={0.6} />
      <circle cx={W / 2} cy={H - 0.5 - spotY} r={0.5} fill="rgba(255,255,255,0.7)" />
      <path
        d={`M ${W/2 - arcOff} ${H - 0.5 - pbH} A ${cr} ${cr} 0 0 1 ${W/2 + arcOff} ${H - 0.5 - pbH}`}
        fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={0.6} />
      <path d={`M 0.5 ${H - 1.5} A 1 1 0 0 1 1.5 ${H - 0.5}`}
        fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={0.6} />
      <path d={`M ${W - 0.5} ${H - 1.5} A 1 1 0 0 0 ${W - 1.5} ${H - 0.5}`}
        fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={0.6} />
    </svg>
  );
}

function LineupGrid({ starting, formation, playerPhotos }) {
  const photos = playerPhotos ?? {};

  const lineSizes = parseLines(formation);
  const groups = [];
  let idx = 0;
  for (const count of lineSizes) {
    groups.push(starting.slice(idx, idx + count));
    idx += count;
  }
  const reversed = [...groups].reverse();

  return (
    <div className="lineup-pitch">
      <PitchSVG />
      <div className="lineup-overlay">
        {reversed.map((players, i) => {
          const isGK = i === reversed.length - 1;
          return (
            <div key={i} className="lineup-line">
              {[...players].reverse().map(p => (
                <div key={p.name} className="lineup-player">
                  <div className={`lp-dot${isGK ? ' lp-dot-gk' : ''}`}>
                    {photos[p.name] && (
                      <img src={photos[p.name]} alt="" className="lp-photo" />
                    )}
                  </div>
                  <span className="lp-name">{p.name}</span>
                  <span className="lp-pos">{p.pos}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function gdStr(row) {
  const d = row.gf - row.ga;
  return d > 0 ? `+${d}` : `${d}`;
}

function TeamStatsPanel({ team, teamId }) {
  const wcRow = GROUP_STANDINGS[team.group]?.find(r => r.teamId === teamId);

  return (
    <div className="team-stats-panel">
      <div className="tsp-title">TEAM PROFILE</div>
      <div className="tsp-row">
        <span className="tsp-label">FIFA RANK</span>
        <span className="tsp-value">#{team.rank}</span>
      </div>
      <div className="tsp-row">
        <span className="tsp-label">ELO</span>
        <span className="tsp-value">{team.elo.toLocaleString()}</span>
      </div>
      <div className="tsp-row">
        <span className="tsp-label">GROUP</span>
        <span className="tsp-value">{team.group}</span>
      </div>

      {wcRow && (
        <>
          <div className="tsp-divider">WC 2026</div>
          <div className="tsp-row">
            <span className="tsp-label">PLAYED</span>
            <span className="tsp-value">{wcRow.mp}</span>
          </div>
          <div className="tsp-row">
            <span className="tsp-label">W / D / L</span>
            <span className="tsp-value">{wcRow.w} · {wcRow.d} · {wcRow.l}</span>
          </div>
          <div className="tsp-row">
            <span className="tsp-label">GOALS</span>
            <span className="tsp-value">{wcRow.gf}–{wcRow.ga}</span>
          </div>
          <div className="tsp-row">
            <span className="tsp-label">GD</span>
            <span className="tsp-value" style={{ color: (wcRow.gf - wcRow.ga) > 0 ? 'var(--green)' : (wcRow.gf - wcRow.ga) < 0 ? '#ff6b6b' : 'inherit' }}>
              {gdStr(wcRow)}
            </span>
          </div>
          <div className="tsp-row">
            <span className="tsp-label">POINTS</span>
            <span className="tsp-value pts-highlight">{wcRow.pts}</span>
          </div>
        </>
      )}
    </div>
  );
}

export default function TeamModal({ teamId, onBack, backLabel = 'Back', playerPhotos }) {
  const team = TEAMS[teamId];
  const lineup = LINEUPS[teamId];

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onBack(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack]);

  if (!team) return null;

  const sortedBench = lineup
    ? [...lineup.bench].sort(
        (a, b) => (BENCH_POS_PRIORITY[a.pos] ?? 1) - (BENCH_POS_PRIORITY[b.pos] ?? 1)
      )
    : [];

  return (
    <div className="modal-backdrop" onClick={onBack}>
      <div className="modal-card modal-card-team" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-back" onClick={onBack} aria-label="Back">
            ‹ {backLabel}
          </button>
          <div className="modal-team-title">
            <FlagIcon teamId={teamId} className="modal-team-flag" />
            <span className="modal-team-name">{team.name}</span>
          </div>
        </div>

        <div className="modal-body team-modal-body">
          {lineup ? (
            <>
              <div className="team-pitch-col">
                <div className="lineup-label">
                  Formation: <strong>{lineup.formation}</strong>
                </div>
                <LineupGrid starting={lineup.starting} formation={lineup.formation} playerPhotos={playerPhotos} />
              </div>
              <div className="team-stats-col">
                <TeamStatsPanel team={team} teamId={teamId} />
              </div>
              <div className="team-bench-col">
                <div className="bench-section">
                  <div className="bench-label">Bench</div>
                  <div className="bench-list">
                    {sortedBench.map(p => (
                      <div key={p.name} className="bench-player">
                        <span className="bench-pos">{p.pos}</span>
                        <span className="bench-name">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="modal-no-data">Lineup not available</div>
          )}
        </div>
      </div>
    </div>
  );
}
