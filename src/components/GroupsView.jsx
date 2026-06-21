import { TEAMS } from '../data/teams.js';
import { GROUP_STANDINGS, GROUP_NAMES } from '../data/groups.js';

function qualStatus(pos) {
  if (pos === 0 || pos === 1) return 'q';   // top 2 → definitely or likely qualified
  if (pos === 2) return 'm';                  // 3rd → maybe
  return 'out';
}

function gd(row) { return row.gf - row.ga; }

export default function GroupsView({ probs }) {
  return (
    <div className="groups-grid">
      {GROUP_NAMES.map(g => {
        const rows = [...GROUP_STANDINGS[g]].sort((a, b) => {
          const pd = b.pts - a.pts;
          if (pd !== 0) return pd;
          const gdDiff = gd(b) - gd(a);
          if (gdDiff !== 0) return gdDiff;
          return b.gf - a.gf;
        });

        return (
          <div key={g} className="group-card">
            <div className="group-card-header">Group {g}</div>
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
                {rows.map((row, idx) => {
                  const team = TEAMS[row.teamId];
                  const qs = qualStatus(idx);
                  const rowClass = qs === 'q' ? 'row-qual' : qs === 'm' ? 'row-maybe' : '';
                  const champPct = probs[row.teamId]?.champion ?? 0;
                  return (
                    <tr key={row.teamId} className={rowClass}>
                      <td>
                        <div className="team-cell">
                          <span className={`qual-dot ${qs}`} />
                          <span className="t-flag">{team.flag}</span>
                          <span className="t-name">{team.name}</span>
                        </div>
                      </td>
                      <td>{row.mp}</td>
                      <td>{row.w}</td>
                      <td>{row.d}</td>
                      <td>{row.l}</td>
                      <td style={{ color: gd(row) > 0 ? '#39d98a' : gd(row) < 0 ? '#ff6b6b' : '#6b6b8a' }}>
                        {gd(row) > 0 ? `+${gd(row)}` : gd(row)}
                      </td>
                      <td className="pts-td">{row.pts}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="group-footer">
              <span className="gf-item"><span className="gf-dot q" /> Qualified</span>
              <span className="gf-item"><span className="gf-dot m" /> Possible 3rd</span>
              <span className="gf-item"><span className="gf-dot out" /> Eliminated</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
