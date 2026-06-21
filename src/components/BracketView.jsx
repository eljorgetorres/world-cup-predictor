import { TEAMS } from '../data/teams.js';
import { GROUP_STANDINGS, GROUP_NAMES } from '../data/groups.js';
import { R32_MATCHES, R16_MATCHES, QF_MATCHES, SF_MATCHES } from '../data/bracket.js';

// Derive dominant team for a known slot (winner/runner-up of a group whose stage is done)
// Returns { teamId, prob } for the top candidate
function getTopCandidates(slot, slotProbs, matchId) {
  const key1 = `${matchId}_1`;
  const key2 = `${matchId}_2`;
  const isSlot1 = slot === R32_MATCHES.find(m => m.id === matchId)?.slot1;
  const key = isSlot1 ? key1 : key2;
  const candidates = slotProbs[key] || [];
  return candidates.slice(0, 3);
}

function SlotRow({ slot, matchId, slotProbs, probs, isWinner }) {
  const key = `${matchId}_${slot._pos}`;
  const candidates = slotProbs?.[key] || [];
  const top = candidates[0];
  const team = top ? TEAMS[top.teamId] : null;
  const isCertain = top && top.prob > 85;
  const champPct = team ? (probs[top.teamId]?.champion ?? 0) : 0;
  const advancePct = team ? (probs[top.teamId]?.r16 ?? 0) : 0;

  return (
    <div className={`match-slot${isWinner ? ' is-winner' : ''}`}>
      <span className="ms-flag">{team ? team.flag : '🏳'}</span>
      <div className="ms-info">
        <div className="ms-name">
          {team ? team.name : slot.label}
        </div>
        {isCertain ? (
          <div className="ms-desc">{slot.label}</div>
        ) : (
          <div className="ms-alts">
            {candidates.slice(0, 3).map(c => {
              const ct = TEAMS[c.teamId];
              return (
                <div key={c.teamId} className="ms-alt-row">
                  <span className="ms-alt-flag">{ct?.flag}</span>
                  <span className="ms-alt-name">{ct?.name}</span>
                  <span className="ms-alt-pct">{c.prob.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className={`ms-pct${champPct < 1 ? ' is-low' : ''}`}>
        {champPct >= 0.1 ? `${champPct.toFixed(1)}%` : ''}
      </div>
    </div>
  );
}

function MatchCard({ match, slotProbs, probs, label, className = '' }) {
  const key1 = `${match.id}_1`;
  const key2 = `${match.id}_2`;
  const top1 = slotProbs?.[key1]?.[0];
  const top2 = slotProbs?.[key2]?.[0];

  const slot1 = { ...match.slot1, _pos: 1 };
  const slot2 = { ...match.slot2, _pos: 2 };

  // Win probability (head to head between most likely teams)
  let matchWinP1 = null;
  if (top1 && top2 && TEAMS[top1.teamId] && TEAMS[top2.teamId]) {
    const e1 = TEAMS[top1.teamId].elo;
    const e2 = TEAMS[top2.teamId].elo;
    matchWinP1 = 1 / (1 + Math.pow(10, (e2 - e1) / 400));
  }

  return (
    <div className={`match-card ${className}`}>
      <div className="match-card-header">
        <span className="mh-id">Match {match.id}</span>
        <span className="mh-label">{label}</span>
      </div>
      <SlotRow slot={slot1} matchId={match.id} slotProbs={slotProbs} probs={probs} isWinner={matchWinP1 !== null && matchWinP1 > 0.5} />
      <SlotRow slot={slot2} matchId={match.id} slotProbs={slotProbs} probs={probs} isWinner={matchWinP1 !== null && matchWinP1 < 0.5} />
    </div>
  );
}

// For R16, QF, SF, Final: we work with team-level probability only (no slotProbs)
// Build probability distribution for each match in deeper rounds from `probs`
function buildDeepMatchSlots(matchSeries, probs, stage) {
  // We only have per-team stage probs; build match slot distributions from groups
  // For simplicity, show the teams most likely to reach each round and pair them
  // by bracket position

  // Get teams sorted by their probability of reaching this stage
  const teamsByStage = Object.entries(probs)
    .map(([id, p]) => ({ id, prob: p[stage] ?? 0 }))
    .filter(t => t.prob > 0.5)
    .sort((a, b) => b.prob - a.prob);

  return teamsByStage;
}

function DeepMatchCard({ matchId, label, team1, team2, probs, className = '' }) {
  const t1 = TEAMS[team1?.id];
  const t2 = TEAMS[team2?.id];

  const e1 = t1?.elo ?? 1600;
  const e2 = t2?.elo ?? 1600;
  const p1Win = 1 / (1 + Math.pow(10, (e2 - e1) / 400));

  const champP1 = team1 ? (probs[team1.id]?.champion ?? 0) : 0;
  const champP2 = team2 ? (probs[team2.id]?.champion ?? 0) : 0;

  const mkSlot = (team, t, champP, isW) => (
    <div className={`match-slot${isW ? ' is-winner' : ''}`}>
      <span className="ms-flag">{t?.flag ?? '🏳'}</span>
      <div className="ms-info">
        <div className="ms-name">{t?.name ?? 'TBD'}</div>
        <div className="ms-desc">
          {team ? `${(team.prob).toFixed(0)}% to reach this round` : ''}
        </div>
      </div>
      <div className={`ms-pct${champP < 1 ? ' is-low' : ''}`}>
        {champP >= 0.1 ? `${champP.toFixed(1)}%` : ''}
      </div>
    </div>
  );

  return (
    <div className={`match-card ${className}`}>
      <div className="match-card-header">
        <span className="mh-id">Match {matchId}</span>
        <span className="mh-label">{label}</span>
      </div>
      {mkSlot(team1, t1, champP1, p1Win > 0.5)}
      {mkSlot(team2, t2, champP2, p1Win < 0.5)}
    </div>
  );
}

export default function BracketView({ activeRound, probs, slotProbs }) {
  if (!probs || !slotProbs) return null;

  if (activeRound === 'r32') {
    return (
      <div className="bracket-container">
        <div className="section-title">Round of 32 — Championship odds per team</div>
        <div className="matches-grid">
          {R32_MATCHES.map(m => (
            <MatchCard
              key={m.id}
              match={m}
              slotProbs={slotProbs}
              probs={probs}
              label="R32"
            />
          ))}
        </div>
      </div>
    );
  }

  if (activeRound === 'r16') {
    // Top 16 teams by R16 probability, paired by bracket order
    const topTeams = Object.entries(probs)
      .map(([id, p]) => ({ id, prob: p.r16 }))
      .filter(t => t.prob > 1)
      .sort((a, b) => b.prob - a.prob);

    // Pair them based on R16 matches (top teams by probability, loosely paired)
    const r16Pairs = R16_MATCHES.map((m, i) => ({
      matchId: m.id,
      team1: topTeams[i * 2] || null,
      team2: topTeams[i * 2 + 1] || null,
    }));

    return (
      <div className="bracket-container">
        <div className="section-title">Round of 16 — Projected matchups & championship odds</div>
        <div className="matches-grid">
          {r16Pairs.map(({ matchId, team1, team2 }) => (
            <DeepMatchCard
              key={matchId}
              matchId={matchId}
              label="R16"
              team1={team1}
              team2={team2}
              probs={probs}
            />
          ))}
        </div>
        <OddsTable probs={probs} stage="r16" label="Round of 16" />
      </div>
    );
  }

  if (activeRound === 'qf') {
    const topTeams = Object.entries(probs)
      .map(([id, p]) => ({ id, prob: p.qf }))
      .filter(t => t.prob > 1)
      .sort((a, b) => b.prob - a.prob);

    const pairs = QF_MATCHES.map((m, i) => ({
      matchId: m.id,
      team1: topTeams[i * 2] || null,
      team2: topTeams[i * 2 + 1] || null,
    }));

    return (
      <div className="bracket-container">
        <div className="section-title">Quarterfinals — Projected matchups & championship odds</div>
        <div className="matches-grid">
          {pairs.map(({ matchId, team1, team2 }) => (
            <DeepMatchCard key={matchId} matchId={matchId} label="QF" team1={team1} team2={team2} probs={probs} />
          ))}
        </div>
        <OddsTable probs={probs} stage="qf" label="Quarterfinal" />
      </div>
    );
  }

  if (activeRound === 'sf') {
    const topTeams = Object.entries(probs)
      .map(([id, p]) => ({ id, prob: p.sf }))
      .filter(t => t.prob > 1)
      .sort((a, b) => b.prob - a.prob);

    const pairs = SF_MATCHES.map((m, i) => ({
      matchId: m.id,
      team1: topTeams[i * 2] || null,
      team2: topTeams[i * 2 + 1] || null,
    }));

    return (
      <div className="bracket-container">
        <div className="section-title">Semifinals — Projected matchups & championship odds</div>
        <div className="matches-grid">
          {pairs.map(({ matchId, team1, team2 }) => (
            <DeepMatchCard key={matchId} matchId={matchId} label="SF" team1={team1} team2={team2} probs={probs} />
          ))}
        </div>
        <OddsTable probs={probs} stage="sf" label="Semifinal" />
      </div>
    );
  }

  if (activeRound === 'final') {
    const topTeams = Object.entries(probs)
      .map(([id, p]) => ({ id, prob: p.final }))
      .filter(t => t.prob > 0.5)
      .sort((a, b) => b.prob - a.prob);

    const finalist1 = topTeams[0] || null;
    const finalist2 = topTeams[1] || null;

    return (
      <div className="bracket-container">
        <div className="section-title">World Cup Final — July 19, 2026 · MetLife Stadium</div>
        <div className="final-wrapper">
          <DeepMatchCard
            matchId={104}
            label="Final"
            team1={finalist1}
            team2={finalist2}
            probs={probs}
            className="final-card"
          />
        </div>
        <OddsTable probs={probs} stage="champion" label="Champion" />
      </div>
    );
  }

  return null;
}

function OddsTable({ probs, stage, label }) {
  const sorted = Object.entries(probs)
    .map(([id, p]) => ({
      id,
      r32: p.r32,
      r16: p.r16,
      qf: p.qf,
      sf: p.sf,
      final: p.final,
      champion: p.champion,
    }))
    .filter(t => t[stage] > 0.5)
    .sort((a, b) => b[stage] - a[stage])
    .slice(0, 20);

  return (
    <div className="odds-section">
      <h3>Full odds — probability to reach each stage</h3>
      <div className="odds-table-wrap">
        <table className="odds-table">
          <thead>
            <tr>
              <th>Team</th>
              <th>R32</th>
              <th>R16</th>
              <th>QF</th>
              <th>SF</th>
              <th>Final</th>
              <th>Champion</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(t => {
              const team = TEAMS[t.id];
              if (!team) return null;
              return (
                <tr key={t.id}>
                  <td>
                    <div className="ot-team-cell">
                      <span className="ot-flag">{team.flag}</span>
                      <span className="ot-name">{team.name}</span>
                    </div>
                  </td>
                  <td className={t.r32 > 80 ? 'pct-final' : 'pct-dim'}>{t.r32.toFixed(0)}%</td>
                  <td className={t.r16 > 50 ? 'pct-sf' : 'pct-dim'}>{t.r16.toFixed(0)}%</td>
                  <td className={t.qf > 25 ? 'pct-sf' : 'pct-dim'}>{t.qf.toFixed(0)}%</td>
                  <td className={t.sf > 12 ? 'pct-sf' : 'pct-dim'}>{t.sf.toFixed(0)}%</td>
                  <td className={t.final > 6 ? 'pct-final' : 'pct-dim'}>{t.final.toFixed(0)}%</td>
                  <td className="pct-champion">{t.champion.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
