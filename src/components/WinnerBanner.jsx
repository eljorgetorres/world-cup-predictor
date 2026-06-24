import { useState } from 'react';
import { TEAMS } from '../data/teams.js';
import { GROUP_STANDINGS } from '../data/groups.js';
import TeamModal from './TeamModal.jsx';
import FlagIcon from './FlagIcon.jsx';

const METHOD_LABELS = { elo: 'ELO', poisson: 'DIXON-COLES', hybrid: 'BLEND' };

function gdStr(gf, ga) {
  const d = gf - ga;
  return d > 0 ? `+${d}` : `${d}`;
}

export default function WinnerBanner({ probs, method, playerPhotos }) {
  const [selectedTeam, setSelectedTeam] = useState(null);

  const top5 = Object.entries(probs)
    .map(([id, p]) => ({ id, pct: p.champion }))
    .filter(t => t.pct > 0.05)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 6);

  const top1 = top5[0];
  const rest = top5.slice(1);

  const team1 = top1 ? TEAMS[top1.id] : null;
  const wcRow = team1 ? GROUP_STANDINGS[team1.group]?.find(r => r.teamId === top1.id) : null;

  return (
    <>
      <div className="winner-banner">
        <div className="winner-banner-header">
          <span className="winner-banner-title">WORLD CUP CHAMPION PREDICTION</span>
          <span className="winner-banner-method">{METHOD_LABELS[method] ?? 'ELO'} MODEL</span>
        </div>

        <div className="winner-banner-body">
          {top1 && (
            <button
              className="winner-top1"
              onClick={() => setSelectedTeam(top1.id)}
              aria-label={`View ${team1?.name} lineup`}
            >
              <div className="winner-top1-left">
                <div className="winner-top1-label">#1 FAVORITE</div>
                <FlagIcon teamId={top1.id} className="wc-flag" />
                <div className="wc-name">{team1?.name}</div>
                <div className="wc-pct">{top1.pct.toFixed(1)}%</div>
                <div className="wc-label">to win</div>
              </div>

              <div className="winner-top1-stats">
                <div className="wts-title">Team Profile</div>
                <div className="wts-row">
                  <span className="wts-label">FIFA RANK</span>
                  <span className="wts-value">#{team1?.rank}</span>
                </div>
                <div className="wts-row">
                  <span className="wts-label">ELO</span>
                  <span className="wts-value">{team1?.elo.toLocaleString()}</span>
                </div>
                <div className="wts-row">
                  <span className="wts-label">GROUP</span>
                  <span className="wts-value">{team1?.group}</span>
                </div>
                {wcRow && (
                  <>
                    <div className="wts-divider">WC 2026</div>
                    <div className="wts-row">
                      <span className="wts-label">W / D / L</span>
                      <span className="wts-value">{wcRow.w} · {wcRow.d} · {wcRow.l}</span>
                    </div>
                    <div className="wts-row">
                      <span className="wts-label">GOALS</span>
                      <span className="wts-value">{wcRow.gf}–{wcRow.ga}</span>
                    </div>
                    <div className="wts-row">
                      <span className="wts-label">POINTS</span>
                      <span className="wts-value wts-pts">{wcRow.pts}</span>
                    </div>
                  </>
                )}
              </div>
            </button>
          )}

          <div className="winner-rest">
            {rest.map((t, i) => (
              <button
                key={t.id}
                className="winner-row"
                onClick={() => setSelectedTeam(t.id)}
                aria-label={`View ${TEAMS[t.id]?.name} lineup`}
              >
                <span className="winner-rank">#{i + 2}</span>
                <FlagIcon teamId={t.id} className="winner-row-flag" />
                <span className="winner-row-name">{TEAMS[t.id]?.name}</span>
                <span className="winner-row-pct">{t.pct.toFixed(1)}%</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedTeam && (
        <TeamModal
          teamId={selectedTeam}
          onBack={() => setSelectedTeam(null)}
          backLabel="Close"
          playerPhotos={playerPhotos}
        />
      )}
    </>
  );
}
