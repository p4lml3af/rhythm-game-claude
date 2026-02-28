import { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { ResultsScreen } from './components/ResultsScreen';
import { useScoreStore } from './stores/scoreStore';
import { useSettingsStore } from './stores/settingsStore';
import { SettingsScreen } from './components/SettingsScreen';
import type { GameResults } from '../shared/types';

type Screen = 'playing' | 'results';

const LEVEL_ID = 'test-level-01';

function App() {
  const [screen, setScreen] = useState<Screen>('playing');
  const [results, setResults] = useState<GameResults | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { setBestScore, getBestScore, loadScores } = useScoreStore();
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    if (window.electronAPI?.loadScores) {
      window.electronAPI.loadScores().then(loadScores);
    }
    if (window.electronAPI?.loadSettings) {
      window.electronAPI.loadSettings().then(savedSettings => {
        if (savedSettings) loadSettings(savedSettings);
      });
    }
  }, [loadScores, loadSettings]);

  const [previousBest, setPreviousBest] = useState<number | null>(null);

  const handleComplete = (gameResults: GameResults) => {
    const oldBest = getBestScore(LEVEL_ID);
    setPreviousBest(oldBest);
    setBestScore(LEVEL_ID, gameResults.accuracy);
    setResults(gameResults);
    setScreen('results');
  };

  const handleReplay = () => {
    setResults(null);
    setGameKey(prev => prev + 1);
    setScreen('playing');
  };

  const handleBack = () => {
    setResults(null);
    setGameKey(prev => prev + 1);
    setScreen('playing');
  };

  if (screen === 'results' && results) {
    const isNewBest = previousBest === null || results.accuracy > previousBest;

    return (
      <ResultsScreen
        accuracy={results.accuracy}
        maxCombo={results.maxCombo}
        perfectHits={results.perfectHits}
        totalNotes={results.totalNotes}
        levelId={LEVEL_ID}
        previousBest={previousBest}
        isNewBest={isNewBest}
        onReplay={handleReplay}
        onBack={handleBack}
      />
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#000000'
    }}>
      <button
        data-testid="button-settings"
        onClick={() => setIsSettingsOpen(true)}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          padding: '8px 16px',
          fontSize: '14px',
          backgroundColor: '#333',
          color: '#CCC',
          border: '1px solid #555',
          cursor: 'pointer',
          zIndex: 1000,
        }}
      >
        Settings
      </button>
      <GameCanvas
        key={gameKey}
        width={800}
        height={600}
        levelId={LEVEL_ID}
        onComplete={handleComplete}
      />
      <SettingsScreen
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
