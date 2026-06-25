import { useState, useMemo } from 'react';
import { TEAMS } from '../data/teams.js';
import { GROUP_STANDINGS, GROUP_NAMES, REMAINING_MATCHES } from '../data/groups.js';
import { computeAllGroupStatuses } from '../utils/groupStatus.js';
import { rankGroupRows, playedGroupMatches } from '../utils/standings.js';
import {
  computeAllPredictedStandings,
  computePredictedQualifiers,
} from '../utils/predictGroups.js';
import TeamModal from './TeamModal.jsx';
import FlagIcon from './FlagIcon.jsx';

function gd(row) { return row.gf - row.ga; }
function gdStr(row) {
  const d = gd(row);
  return d > 0 ? `+${d}` : `${d}`;
}

function GroupCard({
  groupId,
  predictionMode,
  onTeamClick,
  predictedRows,
  predictedQualifiers,
  best8ThirdIds,
  groupStatuses,
}) {
  const currentRows = useMemo(() => {
    return rankGroupRows(GROUP_STANDINGS[groupId], playedGroupMatches(groupId));
  }, [groupId]);

  const rows = predictionMode ? predictedRows : currentRows;
  const statuses = groupStatuses[groupId];

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
          {rows.map((row, position) => {
            const team = TEAMS[row.teamId];
            const st = statuses[row.teamId] ?? 'maybe';

            // Prediction mode: dots from the same predicted standings used for
            // cross-group best-8-third selection (passed from parent).
            const predictQualify = predictionMode && (
              position < 2
                ? predictedQualifiers?.has(row.teamId)
                : position === 2
                  ? best8ThirdIds?.has(row.teamId)
                  : false
            );
            const predictState = predictionMode
              ? predictQualify
                ? 'confirmed'
                : position === 2
                  ? 'maybe'   // predicted 3rd but missed best-8-third
                  : 'eliminated'
              : st;

            const dotClass = `qs-${predictState}`;
            const rowClass = `row-status-${predictState}`;

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
            <span className="gf-item"><span className="gf-dot qs-maybe" /> Undecided</span>
            <span className="gf-item"><span className="gf-dot qs-eliminated" /> Eliminated</span>
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

  const groupStatuses = useMemo(
    () => computeAllGroupStatuses(),
    [GROUP_STANDINGS, REMAINING_MATCHES],
  );

  // Single source of truth: compute all predicted standings once, then derive
  // qualifiers + render rows from the same data (avoids per-card recompute drift).
  const allPredictedStandings = useMemo(() => {
    if (!predictionMode) return null;
    return computeAllPredictedStandings(simMethod);
  }, [predictionMode, simMethod]);

  const { qualifiers: predictedQualifiers, best8ThirdIds } = useMemo(() => {
    if (!allPredictedStandings) {
      return { qualifiers: null, best8ThirdIds: null };
    }
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
            onTeamClick={setSelectedTeam}
            predictedRows={allPredictedStandings?.[g]}
            predictedQualifiers={predictedQualifiers}
            best8ThirdIds={best8ThirdIds}
            groupStatuses={groupStatuses}
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
