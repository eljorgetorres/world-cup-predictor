import { TEAMS } from '../data/teams.js';

export default function WinnerBanner({ probs }) {
  const sorted = Object.entries(probs)
    .map(([id, p]) => ({ id, pct: p.champion }))
    .filter(t => t.pct > 0.05)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 7);

  const top5 = sorted.slice(0, 5);

  return (
    <div className="winner-banner">
      <h2>🏆 World Cup Champion Prediction</h2>
      <div className="winner-podium">
        {top5.map((t, i) => {
          const team = TEAMS[t.id];
          return (
            <div key={t.id} className={`winner-card rank-${i + 1}`}>
              <span className="wc-rank-badge">#{i + 1}</span>
              <span className="wc-flag">{team.flag}</span>
              <span className="wc-name">{team.name}</span>
              <span className="wc-pct">{t.pct.toFixed(1)}%</span>
              <span className="wc-label">to win</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
