import { useState, useEffect, useMemo } from 'react';
import './App.css';
import { runSimulation, getSlotProbs } from './utils/simulation.js';
import WinnerBanner from './components/WinnerBanner.jsx';
import GroupsView from './components/GroupsView.jsx';
import BracketView from './components/BracketView.jsx';

const STAGES = [
  { id: 'groups', label: 'Groups', sub: '12 groups' },
  { id: 'r32', label: 'Round of 32', sub: 'Jun 28–Jul 3' },
  { id: 'r16', label: 'Round of 16', sub: 'Jul 4–7' },
  { id: 'qf', label: 'Quarterfinals', sub: 'Jul 9–11' },
  { id: 'sf', label: 'Semifinals', sub: 'Jul 14–15' },
  { id: 'final', label: 'Final', sub: 'Jul 19' },
];

export default function App() {
  const [activeRound, setActiveRound] = useState('groups');
  const [simResults, setSimResults] = useState(null);
  const [slotProbs, setSlotProbs] = useState(null);

  useEffect(() => {
    // Run simulation asynchronously so it doesn't block the initial render
    const timer = setTimeout(() => {
      const probs = runSimulation(80000);
      setSimResults(probs);
      const sp = getSlotProbs(60000);
      setSlotProbs(sp);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const isLoading = !simResults || !slotProbs;

  return (
    <div className="app">
      <header className="app-header">
        <h1>⚽ 2026 World Cup Predictor</h1>
        <p>
          Live group standings · Elo-based Monte Carlo simulation · 80,000 tournament runs
        </p>
      </header>

      {isLoading ? (
        <div className="loading">
          <div className="spinner" />
          <span>Running tournament simulation…</span>
        </div>
      ) : (
        <>
          <WinnerBanner probs={simResults} />

          <nav className="stage-nav">
            {STAGES.map(s => (
              <button
                key={s.id}
                className={`stage-tab${activeRound === s.id ? ' active' : ''}`}
                onClick={() => setActiveRound(s.id)}
              >
                {s.label}
                <span className="tab-sub">{s.sub}</span>
              </button>
            ))}
          </nav>

          {activeRound === 'groups' ? (
            <GroupsView probs={simResults} />
          ) : (
            <BracketView
              activeRound={activeRound}
              probs={simResults}
              slotProbs={slotProbs}
            />
          )}
        </>
      )}
    </div>
  );
}
