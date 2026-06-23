import { useState } from 'react';
import { TEAMS } from '../data/teams.js';
import TeamModal from './TeamModal.jsx';
import FlagIcon from './FlagIcon.jsx';

const METHOD_LABELS = { elo: 'ELO', poisson: 'DIXON-COLES', hybrid: 'BLEND' };

export default function WinnerBanner({ probs, method, playerPhotos }) {
  const [selectedTeam, setSelectedTeam] = useState(null);

  const top5 = Object.entries(probs)
    .map(([id, p]) => ({ id, pct: p.champion }))
    .filter(t => t.pct > 0.05)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  const top1 = top5[0];
  const rest = top5.slice(1);

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
              aria-label={`View ${TEAMS[top1.id]?.name} lineup`}
            >
              <div className="winner-top1-label">#1 FAVORITE</div>
              <FlagIcon teamId={top1.id} className="wc-flag" />
              <div className="wc-name">{TEAMS[top1.id]?.name}</div>
              <div className="wc-pct">{top1.pct.toFixed(1)}%</div>
              <div className="wc-label">to win</div>
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
