import { useState, useMemo } from 'react';
import { TEAMS } from '../data/teams.js';
import { GROUP_STANDINGS, GROUP_NAMES, REMAINING_MATCHES } from '../data/groups.js';
import { computeAllGroupStatuses } from '../utils/groupStatus.js';
import { getPrediction } from '../utils/simulation.js';
import TeamModal from './TeamModal.jsx';
import FlagIcon from './FlagIcon.jsx';

const GROUP_STATUSES = computeAllGroupStatuses();

function gd(row) { return row.gf - row.ga; }
function gdStr(row) {
  const d = gd(row);
  return d > 0 ? `+${d}` : `${d}`;
}

function predictGroupStandings(groupId, simMethod) {
  const rows = GROUP_STANDINGS[groupId].map(r => ({ ...r }));
  const remaining = REMAINING_MATCHES[groupId] ?? [];

  for (const { home, away } of remaining) {
    const pred = getPrediction(home, away, simMethod);
    const h = rows.find(r => r.teamId === home);
    const a = rows.find(r => r.teamId === away);
    if (!h || !a) continue;

    const hGoals = pred.homeGoals;
    const aGoals = pred.awayGoals;
    h.mp++; a.mp++;
    h.gf += hGoals; h.ga += aGoals;
    a.gf += aGoals; a.ga += hGoals;

    if (hGoals > aGoals) {
      h.pts += 3; h.w++;
      a.l++;
    } else if (hGoals === aGoals) {
      h.pts += 1; h.d++;
      a.pts += 1; a.d++;
    } else {
      a.pts += 3; a.w++;
      h.l++;
    }
  }

  return rows.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gdDiff = gd(b) - gd(a);
    if (gdDiff !== 0) return gdDiff;
    return b.gf - a.gf;
  });
}

// In WC2026, 12 groups → top 2 qualify (24 teams) + best 8 third-place (8 teams) = 32 R32 teams
function computePredictedQualifiers(allStandings) {
  const qualifiers = new Set();
  const thirdPlaces = [];

  for (const [groupId, rows] of Object.entries(allStandings)) {
    if (rows.length < 3) continue;
    qualifiers.add(rows[0].teamId); // 1st place
    qualifiers.add(rows[1].teamId); // 2nd place
    // 3rd place candidate
    const third = rows[2];
    thirdPlaces.push({
      teamId: third.teamId,
      pts: third.pts,
      gd: third.gf - third.ga,
      gf: third.gf,
    });
  }

  // Best 8 third-place teams qualify
  thirdPlaces.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd  !== a.gd)  return b.gd  - a.gd;
    return b.gf - a.gf;
  });

  thirdPlaces.slice(0, 8).forEach(t => qualifiers.add(t.teamId));
  return qualifiers;
}

function GroupCard({ groupId, predictionMode, simMethod, onTeamClick, predictedQualifiers }) {
  const currentRows = useMemo(() => {
    return [...GROUP_STANDINGS[groupId]].sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      const gdDiff = gd(b) - gd(a);
      if (gdDiff !== 0) return gdDiff;
      return b.gf - a.gf;
    });
  }, [groupId]);

  const predictedRows = useMemo(() => {
    if (!predictionMode) return null;
    return predictGroupStandings(groupId, simMethod);
  }, [groupId, predictionMode, simMethod]);

  const rows = predictionMode ? predictedRows : currentRows;
  const statuses = GROUP_STATUSES[groupId];

  return (
    <div className={`group-card${predictionMode ? ' group-card-predict' : ''}`}>
      <div className="group-card-header">
        Group {groupId}
        {predictionMode && <span className="group-predict-badge">PREDICTED</span>}
      </div>
      <table className="group-table">
        <thead>
          <tr>
            <th>Team</th>
            <th title="Played">P</th>
            <th title="Wins">W</th>
            <th title="Draws">D</th>
            <th title="Losses">L</th>
            <th title="Goal Difference">GD</th>
            <th title="Points">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const team = TEAMS[row.teamId];
            const st = statuses[row.teamId] ?? 'maybe';

            // Prediction mode: derive status from predictedQualifiers set
            const predictQualify = predictionMode && predictedQualifiers?.has(row.teamId);
            const dotClass = predictionMode
              ? predictQualify ? 'qs-confirmed' : 'qs-eliminated'
              : `qs-${st}`;

            const rowClass = predictionMode
              ? (predictQualify ? 'row-status-confirmed' : 'row-status-eliminated')
              : `row-status-${st}`;

            return (
              <tr
                key={row.teamId}
                className={rowClass}
                onClick={() => onTeamClick(row.teamId)}
                style={{ cursor: 'pointer' }}
              >
                <td>
                  <div className="team-cell">
                    <span className={`qual-dot ${dotClass}`} />
                    <FlagIcon teamId={row.teamId} className="t-flag" />
                    <span className="t-name">{team.name}</span>
                  </div>
                </td>
                <td>{row.mp}</td>
                <td>{row.w}</td>
                <td>{row.d}</td>
                <td>{row.l}</td>
                <td style={{ color: gd(row) > 0 ? 'var(--green)' : gd(row) < 0 ? 'var(--accent)' : 'var(--muted)' }}>
                  {gdStr(row)}
                </td>
                <td className="pts-td">{row.pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="group-footer">
        {predictionMode ? (
          <>
            <span className="gf-item"><span className="gf-dot qs-confirmed" /> Predicted qualify</span>
            <span className="gf-item"><span className="gf-dot qs-eliminated" /> Predicted out</span>
          </>
        ) : (
          <>
            <span className="gf-item"><span className="gf-dot qs-confirmed" /> Qualified</span>
            <span className="gf-item"><span className="gf-dot qs-maybe" /> Undecided</span>
            <span className="gf-item"><span className="gf-dot qs-eliminated" /> Eliminated</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function GroupsView({ probs, simMethod, predictionMode, playerPhotos }) {
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Compute ALL group predicted standings together (needed for 3rd-place comparison)
  const allPredictedStandings = useMemo(() => {
    if (!predictionMode) return null;
    const result = {};
    for (const g of GROUP_NAMES) {
      result[g] = predictGroupStandings(g, simMethod);
    }
    return result;
  }, [predictionMode, simMethod]);

  const predictedQualifiers = useMemo(() => {
    if (!allPredictedStandings) return null;
    return computePredictedQualifiers(allPredictedStandings);
  }, [allPredictedStandings]);

  return (
    <>
      <div className="groups-grid">
        {GROUP_NAMES.map(g => (
          <GroupCard
            key={g}
            groupId={g}
            predictionMode={predictionMode}
            simMethod={simMethod}
            onTeamClick={setSelectedTeam}
            predictedQualifiers={predictedQualifiers}
          />
        ))}
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
