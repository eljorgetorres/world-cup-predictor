import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TEAMS } from '../data/teams.js';
import { MATCH_SCHEDULE } from '../data/matchSchedule.js';
import { GROUP_STANDINGS } from '../data/groups.js';
import { getPrediction } from '../utils/simulation.js';
import TeamModal from './TeamModal.jsx';
import FlagIcon from './FlagIcon.jsx';

// ─── Layout constants ─────────────────────────────────────────────────────────
const HALF_H    = 80;
const CARD_H    = HALF_H * 2 + 1;
const BASE_UNIT = CARD_H + 14;
const COL_W     = 210;
const CONN_W    = 44;
const LABEL_H   = 44;
const THRESH    = 80;

// ─── Tree ─────────────────────────────────────────────────────────────────────
const R32_ORDER = [74,77,73,75,83,84,81,82,76,78,79,80,86,88,85,87];
const R16_ORDER = [89,90,93,94,91,92,95,96];
const QF_ORDER  = [97,98,99,100];
const SF_ORDER  = [101,102];
const FINAL_ID  = 104;

const R32_SET = new Set(R32_ORDER);

const SOURCES = {
  89:[74,77], 90:[73,75], 93:[83,84], 94:[81,82],
  91:[76,78], 92:[79,80], 95:[86,88], 96:[85,87],
  97:[89,90], 98:[93,94], 99:[91,92], 100:[95,96],
  101:[97,98], 102:[99,100], 104:[101,102],
};

const ALL_ROUNDS = [
  { id:'r32',   label:'Round of 32',   sub:'Jun 28–Jul 3', order: R32_ORDER },
  { id:'r16',   label:'Round of 16',   sub:'Jul 4–7',      order: R16_ORDER },
  { id:'qf',    label:'Quarterfinals', sub:'Jul 9–11',     order: QF_ORDER  },
  { id:'sf',    label:'Semifinals',    sub:'Jul 14–15',    order: SF_ORDER  },
  { id:'final', label:'Final',         sub:'Jul 19',       order: [FINAL_ID]},
];

const CONNECTORS = [
  R16_ORDER.map(d => ({ s1: SOURCES[d][0], s2: SOURCES[d][1], d })),
  QF_ORDER .map(d => ({ s1: SOURCES[d][0], s2: SOURCES[d][1], d })),
  SF_ORDER .map(d => ({ s1: SOURCES[d][0], s2: SOURCES[d][1], d })),
  [{ s1: SOURCES[FINAL_ID][0], s2: SOURCES[FINAL_ID][1], d: FINAL_ID }],
];

function getRoundLabel(matchId) {
  if (R32_SET.has(matchId)) return 'Round of 32';
  if (R16_ORDER.includes(matchId)) return 'Round of 16';
  if (QF_ORDER.includes(matchId)) return 'Quarterfinals';
  if (SF_ORDER.includes(matchId)) return 'Semifinals';
  if (matchId === FINAL_ID) return 'Final';
  return '';
}

// ─── Dynamic layout ───────────────────────────────────────────────────────────
function makeLayout(baseOrder) {
  const total   = baseOrder.length * BASE_UNIT;
  const idxMap  = Object.fromEntries(baseOrder.map((id, i) => [id, i]));
  const baseSet = new Set(baseOrder);

  function cy(id) {
    if (baseSet.has(id)) return idxMap[id] * BASE_UNIT + BASE_UNIT / 2;
    const [s1, s2] = SOURCES[id];
    return (cy(s1) + cy(s2)) / 2;
  }

  function cardTop(id) {
    return baseSet.has(id)
      ? idxMap[id] * BASE_UNIT + (BASE_UNIT - CARD_H) / 2
      : cy(id) - CARD_H / 2;
  }

  return { cy, cardTop, total };
}

// ─── Slot deduplication ───────────────────────────────────────────────────────
function dedupeSlots(sp) {
  const bestProb = {}, bestKey = {};
  for (const [key, teams] of Object.entries(sp)) {
    for (const { teamId, prob } of teams) {
      if ((bestProb[teamId] ?? -1) < prob) {
        bestProb[teamId] = prob;
        bestKey[teamId] = key;
      }
    }
  }
  const result = {};
  for (const [key, teams] of Object.entries(sp)) {
    const kept  = teams.filter(({ teamId }) => bestKey[teamId] === key);
    const total = kept.reduce((s, t) => s + t.prob, 0);
    result[key] = total > 0
      ? kept.map(t => ({ ...t, prob: (t.prob / total) * 100 }))
      : [];
  }
  return result;
}

// ─── Probability helpers ──────────────────────────────────────────────────────
function eloWin(e1, e2) { return 1 / (1 + Math.pow(10, (e2 - e1) / 400)); }

// ─── R16 advance probability computation ─────────────────────────────────────
// koWin(id1, id2) returns the KO win probability for id1 vs id2 using selected method
function computeAdvanceProbs(sp, koWin) {
  const result = {};
  for (const matchId of R32_ORDER) {
    const s1 = sp[`${matchId}_1`] ?? [];
    const s2 = sp[`${matchId}_2`] ?? [];
    const wins = {};
    for (const a of s1) {
      let pWin = s2.length === 0 ? 1
        : s2.reduce((acc, b) => acc + (b.prob / 100) * koWin(a.teamId, b.teamId), 0);
      wins[a.teamId] = (wins[a.teamId] ?? 0) + (a.prob / 100) * pWin;
    }
    for (const b of s2) {
      let pWin = s1.length === 0 ? 1
        : s1.reduce((acc, a) => acc + (a.prob / 100) * koWin(b.teamId, a.teamId), 0);
      wins[b.teamId] = (wins[b.teamId] ?? 0) + (b.prob / 100) * pWin;
    }
    const total = Object.values(wins).reduce((s, p) => s + p, 0);
    result[matchId] = total > 0
      ? Object.entries(wins)
          .map(([teamId, p]) => ({ teamId, prob: (p / total) * 100 }))
          .sort((a, b) => b.prob - a.prob)
      : [];
  }
  return result;
}

function topWinner(matchId, sp, koWin) {
  if (R32_SET.has(matchId)) {
    const a = sp[`${matchId}_1`]?.[0], b = sp[`${matchId}_2`]?.[0];
    if (!a && !b) return null;
    if (!a) return b; if (!b) return a;
    return koWin(a.teamId, b.teamId) >= 0.5 ? a : b;
  }
  const [s1, s2] = SOURCES[matchId];
  const w1 = topWinner(s1, sp, koWin), w2 = topWinner(s2, sp, koWin);
  if (!w1 && !w2) return null;
  if (!w1) return w2; if (!w2) return w1;
  return koWin(w1.teamId, w2.teamId) >= 0.5 ? w1 : w2;
}

function getSlots(matchId, sp, advProbs, predictionMode, koWin) {
  if (R32_SET.has(matchId)) {
    return { s1alts: sp[`${matchId}_1`] ?? [], s2alts: sp[`${matchId}_2`] ?? [], deep: false };
  }
  if (!predictionMode) {
    return { s1alts: [], s2alts: [], deep: true };
  }
  const [src1, src2] = SOURCES[matchId];
  if (R32_SET.has(src1)) {
    const top1 = advProbs?.[src1]?.[0];
    const top2 = advProbs?.[src2]?.[0];
    return { s1alts: top1 ? [top1] : [], s2alts: top2 ? [top2] : [], deep: true };
  }
  const w1 = topWinner(src1, sp, koWin), w2 = topWinner(src2, sp, koWin);
  return { s1alts: w1 ? [w1] : [], s2alts: w2 ? [w2] : [], deep: true };
}

function getModalTeams(matchId, sp, advProbs, predictionMode, koWin) {
  if (R32_SET.has(matchId)) {
    const t1 = (sp[`${matchId}_1`] ?? [])[0]?.teamId ?? null;
    const t2 = (sp[`${matchId}_2`] ?? [])[0]?.teamId ?? null;
    return [t1, t2];
  }
  if (!predictionMode) return [null, null];
  const [src1, src2] = SOURCES[matchId];
  if (R32_SET.has(src1)) {
    return [advProbs?.[src1]?.[0]?.teamId ?? null, advProbs?.[src2]?.[0]?.teamId ?? null];
  }
  return [topWinner(src1, sp, koWin)?.teamId ?? null, topWinner(src2, sp, koWin)?.teamId ?? null];
}

// ─── HalfSlot ─────────────────────────────────────────────────────────────────
function HalfSlot({ alts, deep }) {
  const topProb    = alts[0]?.prob ?? 0;
  const showSingle = deep || alts.length <= 1 || topProb >= THRESH;
  const teams      = showSingle ? alts.slice(0, 1) : alts.slice(0, 3);
  const rowH       = HALF_H / (teams.length || 1);

  if (teams.length === 0) {
    return (
      <div className="bmc-half" style={{ height: HALF_H }}>
        <div className="bmc-row-single">
          <span className="bmc-tbd-dot" />
          <span className="bmc-name-text">TBD</span>
        </div>
      </div>
    );
  }

  if (showSingle) {
    const t       = TEAMS[teams[0].teamId];
    const slotPct = !deep && topProb < 99 ? Math.round(topProb) : null;
    return (
      <div className="bmc-half" style={{ height: HALF_H }}>
        <div className="bmc-row-single">
          <FlagIcon teamId={teams[0].teamId} className="bmc-flag" />
          <span className="bmc-name-text">{t?.name ?? 'TBD'}</span>
          {slotPct !== null && <span className="bmc-pct-sm">{slotPct}%</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="bmc-half" style={{ height: HALF_H }}>
      {teams.map(item => {
        const t = TEAMS[item.teamId];
        return (
          <div key={item.teamId} className="bmc-row-multi" style={{ height: rowH }}>
            <FlagIcon teamId={item.teamId} className="bmc-flag-sm" />
            <span className="bmc-name-sm">{t?.name ?? '?'}</span>
            <span className="bmc-pct-sm">{item.prob.toFixed(0)}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── MatchCard ────────────────────────────────────────────────────────────────
function MatchCard({ matchId, sp, advProbs, cardTop, predictionMode, onCardClick, koWin }) {
  const { s1alts, s2alts, deep } = getSlots(matchId, sp, advProbs, predictionMode, koWin);
  const isFinal = matchId === FINAL_ID;

  return (
    <div
      className={`bmc${isFinal ? ' bmc-final' : ''} bmc-clickable`}
      style={{ top: cardTop(matchId), height: CARD_H }}
      onClick={() => onCardClick(matchId)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onCardClick(matchId)}
      aria-label={`Match ${matchId} details`}
    >
      <HalfSlot alts={s1alts} deep={deep} />
      <div className="bmc-divider" />
      <HalfSlot alts={s2alts} deep={deep} />
    </div>
  );
}

// ─── Connector ────────────────────────────────────────────────────────────────
function Connector({ pairs, cy, total }) {
  const mid = CONN_W / 2;
  return (
    <svg className="bracket-conn" width={CONN_W} height={total} style={{ flexShrink: 0, marginTop: LABEL_H }}>
      {pairs.map(({ s1, s2, d }) => {
        const y1 = cy(s1), y2 = cy(s2), yd = cy(d);
        return (
          <g key={d}>
            <line x1={0}   y1={y1} x2={mid}    y2={y1} />
            <line x1={0}   y1={y2} x2={mid}    y2={y2} />
            <line x1={mid} y1={y1} x2={mid}    y2={y2} />
            <line x1={mid} y1={yd} x2={CONN_W} y2={yd} />
          </g>
        );
      })}
    </svg>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────
function Column({ roundId, label, sub, order, sp, advProbs, cardTop, total, isStart, onActivate, onBack, predictionMode, onCardClick, koWin }) {
  return (
    <div id={`bcol-${roundId}`} className="bracket-col" style={{ width: COL_W, flexShrink: 0 }}>
      <div
        className={`bracket-col-label${isStart ? ' bcl-active' : ''}`}
        onClick={onActivate}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onActivate()}
      >
        {isStart && onBack && (
          <button className="bcl-back" onClick={e => { e.stopPropagation(); onBack(); }} aria-label="Previous round">‹</button>
        )}
        <div className="bcl-text">
          <span className="bcl-name">{label}</span>
          <span className="bcl-sub">{sub}</span>
        </div>
      </div>
      <div style={{ position: 'relative', height: total }}>
        {order.map(id => (
          <MatchCard
            key={id} matchId={id} sp={sp} advProbs={advProbs}
            cardTop={cardTop} predictionMode={predictionMode}
            onCardClick={onCardClick} koWin={koWin}
          />
        ))}
      </div>
    </div>
  );
}

function gdStr(s) {
  if (!s) return '—';
  const d = s.gf - s.ga;
  return d > 0 ? `+${d}` : `${d}`;
}

function GameName({ name }) {
  return <span className="game-name">{name ?? 'TBD'}</span>;
}

// ─── Matchup Modal ────────────────────────────────────────────────────────────
function MatchupModal({ matchId, sp, advProbs, predictionMode, simMethod, playerPhotos, onClose, koWin }) {
  const [teamView, setTeamView] = useState(null);
  const schedule = MATCH_SCHEDULE[matchId];
  const roundLabel = getRoundLabel(matchId);
  const [t1id, t2id] = getModalTeams(matchId, sp, advProbs, predictionMode, koWin);

  const hasBoth = t1id && t2id;
  const pred = hasBoth ? getPrediction(t1id, t2id, simMethod) : null;
  const t1 = t1id ? TEAMS[t1id] : null;
  const t2 = t2id ? TEAMS[t2id] : null;

  const homeWins = pred && pred.homeGoals > pred.awayGoals;
  const awayWins = pred && pred.awayGoals > pred.homeGoals;

  const hElo = t1?.elo ?? 1600;
  const aElo = t2?.elo ?? 1600;
  const totalElo = hElo + aElo;
  const homePct = Math.round((hElo / totalElo) * 100);
  const awayPct = 100 - homePct;

  const hRow = t1 ? GROUP_STANDINGS[t1.group]?.find(r => r.teamId === t1id) : null;
  const aRow = t2 ? GROUP_STANDINGS[t2.group]?.find(r => r.teamId === t2id) : null;

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') { teamView ? setTeamView(null) : onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, teamView]);

  if (teamView) {
    return (
      <TeamModal
        teamId={teamView}
        onBack={() => setTeamView(null)}
        backLabel="Match Info"
        playerPhotos={playerPhotos}
      />
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card bmu-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-back" onClick={onClose} aria-label="Close">‹ Bracket</button>
          <div className="modal-match-label">
            <span className="modal-round-badge">{roundLabel}</span>
          </div>
        </div>

        <div className="modal-body">
          {schedule && (
            <div className="matchup-schedule">
              <div className="matchup-date">{schedule.date} · {schedule.time}</div>
              <div className="matchup-venue">{schedule.venue} · {schedule.city}</div>
            </div>
          )}

          {/* GameCard-style match panel */}
          <div className="game-card">
            <div className="game-card-body">
              <div className="game-card-left">
                <div className="game-matchup">
                  <button
                    className={`game-team game-team-btn${homeWins && predictionMode ? ' game-winner' : ''}${!t1id ? ' game-team-tbd' : ''}`}
                    onClick={() => t1id && setTeamView(t1id)}
                    disabled={!t1id}
                  >
                    <FlagIcon teamId={t1id} className="game-flag" />
                    <GameName name={t1?.name} />
                  </button>

                  <div className="game-center-block">
                    {hasBoth && predictionMode ? (
                      <div className="game-score-block show">
                        <span className="game-goals">{pred.homeGoals}</span>
                        <span className="game-dash">–</span>
                        <span className="game-goals">{pred.awayGoals}</span>
                      </div>
                    ) : (
                      <div className="game-vs-block show">
                        <span className="game-vs">VS</span>
                      </div>
                    )}
                  </div>

                  <button
                    className={`game-team game-team-right game-team-btn${awayWins && predictionMode ? ' game-winner' : ''}${!t2id ? ' game-team-tbd' : ''}`}
                    onClick={() => t2id && setTeamView(t2id)}
                    disabled={!t2id}
                  >
                    <GameName name={t2?.name} />
                    <FlagIcon teamId={t2id} className="game-flag" />
                  </button>
                </div>

                <div className={`game-probs${hasBoth && predictionMode ? ' show' : ''}`}>
                  {hasBoth && pred && (
                    <>
                      <span className={`game-prob${homeWins && predictionMode ? ' game-prob-hi' : ''}`}>{t1.name} {pred.homeWin}%</span>
                      <span className="game-prob-draw">Draw {pred.draw}%</span>
                      <span className={`game-prob${awayWins && predictionMode ? ' game-prob-hi' : ''}`}>{t2.name} {pred.awayWin}%</span>
                    </>
                  )}
                </div>
              </div>

              {hasBoth && (
                <>
                  <div className="game-card-divider" />
                  <div className="game-card-right">
                    <div className="game-stat-block">
                      <div className="game-stat-title">STRENGTH</div>
                      <div className="game-elo-bar-wrap">
                        <div className="game-elo-bar">
                          <div className="game-elo-home" style={{ width: `${homePct}%` }} />
                          <div className="game-elo-away" style={{ width: `${awayPct}%` }} />
                        </div>
                        <div className="game-elo-labels">
                          <span className="game-elo-pct">{homePct}%</span>
                          <span className="game-elo-pct">{awayPct}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="game-stat-block">
                      <div className="game-stat-title">MATCHUP STATS</div>
                      <table className="game-stats-table">
                        <thead>
                          <tr>
                            <th className="gst-home">{t1.name}</th>
                            <th className="gst-label"></th>
                            <th className="gst-away">{t2.name}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="gst-home">{hElo.toLocaleString()}</td>
                            <td className="gst-label">ELO</td>
                            <td className="gst-away">{aElo.toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td className="gst-home">#{t1.rank}</td>
                            <td className="gst-label">RANK</td>
                            <td className="gst-away">#{t2.rank}</td>
                          </tr>
                          <tr>
                            <td className="gst-home">{hRow ? `${hRow.pts}pts` : '—'}</td>
                            <td className="gst-label">WC PTS</td>
                            <td className="gst-away">{aRow ? `${aRow.pts}pts` : '—'}</td>
                          </tr>
                          <tr>
                            <td className="gst-home" style={{ color: (hRow?.gf - hRow?.ga) > 0 ? 'var(--green)' : (hRow?.gf - hRow?.ga) < 0 ? 'var(--accent)' : 'inherit' }}>
                              {hRow ? gdStr(hRow) : '—'}
                            </td>
                            <td className="gst-label">GD</td>
                            <td className="gst-away" style={{ color: (aRow?.gf - aRow?.ga) > 0 ? 'var(--green)' : (aRow?.gf - aRow?.ga) < 0 ? 'var(--accent)' : 'inherit' }}>
                              {aRow ? gdStr(aRow) : '—'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BracketView({ probs, slotProbs, matchupTable, predictionMode, simMethod, playerPhotos }) {
  const scrollRef       = useRef(null);
  const prevStartIdxRef = useRef(0);
  const [startRound, setStartRound] = useState('r32');
  const [activeMatchId, setActiveMatchId] = useState(null);

  // KO win prob respects the currently selected simulation method
  const koWin = useCallback((id1, id2) => {
    return matchupTable?.[id1]?.[id2]?.koW
      ?? eloWin(TEAMS[id1]?.elo ?? 1600, TEAMS[id2]?.elo ?? 1600);
  }, [matchupTable]);

  const advanceProbs = useMemo(
    () => dedupeSlots(computeAdvanceProbs(slotProbs, koWin)),
    [slotProbs, koWin],
  );

  const startIdx      = ALL_ROUNDS.findIndex(r => r.id === startRound);
  const visibleRounds = ALL_ROUNDS.slice(startIdx);

  const slideDir = startIdx > prevStartIdxRef.current ? 'fwd' : 'back';
  useEffect(() => { prevStartIdxRef.current = startIdx; }, [startIdx]);

  const layout = useMemo(
    () => makeLayout(visibleRounds[0].order),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startRound],
  );

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
  }, [startRound]);

  const goBack = useCallback(() => {
    if (startIdx > 0) setStartRound(ALL_ROUNDS[startIdx - 1].id);
  }, [startIdx]);

  if (!probs || !slotProbs) return null;

  return (
    <>
      <div className="bracket-wrapper">
        <div className="bracket-outer">
          <div className="bracket-scroll" ref={scrollRef}>
            <div className={`bracket-inner bi-${slideDir}`} key={startRound}>
              {visibleRounds.flatMap((r, i) => [
                <Column
                  key={r.id}
                  roundId={r.id}
                  label={r.label}
                  sub={r.sub}
                  order={r.order}
                  sp={slotProbs}
                  advProbs={advanceProbs}
                  cardTop={layout.cardTop}
                  total={layout.total}
                  isStart={i === 0}
                  onActivate={() => setStartRound(r.id)}
                  onBack={i === 0 && startIdx > 0 ? goBack : null}
                  predictionMode={predictionMode}
                  onCardClick={setActiveMatchId}
                  koWin={koWin}
                />,
                i < visibleRounds.length - 1
                  ? <Connector key={`conn-${i}`} pairs={CONNECTORS[startIdx + i]} cy={layout.cy} total={layout.total} />
                  : null,
              ])}
            </div>
          </div>
        </div>
      </div>

      {activeMatchId !== null && (
        <MatchupModal
          matchId={activeMatchId}
          sp={slotProbs}
          advProbs={advanceProbs}
          predictionMode={predictionMode}
          simMethod={simMethod}
          playerPhotos={playerPhotos}
          onClose={() => setActiveMatchId(null)}
          koWin={koWin}
        />
      )}
    </>
  );
}
