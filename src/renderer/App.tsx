import { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { ResultsScreen } from './components/ResultsScreen';
import { MainMenu } from './components/MainMenu';
import { LevelSelect } from './components/LevelSelect';
import { useScoreStore } from './stores/scoreStore';
import { useSettingsStore } from './stores/settingsStore';
import { SettingsScreen } from './components/SettingsScreen';
import type { GameResults, LevelInfo } from '../shared/types';

type Screen = 'menu' | 'levelSelect' | 'playing' | 'results';

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [results, setResults] = useState<GameResults | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [levels, setLevels] = useState<LevelInfo[]>([]);
  const [previousBest, setPreviousBest] = useState<number | null>(null);

  const { setBestScore, getBestScore, loadScores } = useScoreStore();
  const { loadSettings } = useSettingsStore();

  // Load scores, settings, and levels on mount
  useEffect(() => {
    if (window.electronAPI?.loadScores) {
      window.electronAPI.loadScores().then(loadScores);
    }
    if (window.electronAPI?.loadSettings) {
      window.electronAPI.loadSettings().then(savedSettings => {
        if (savedSettings) loadSettings(savedSettings);
      });
    }
    if (window.electronAPI?.listLevels) {
      window.electronAPI.listLevels().then(setLevels);
    }
  }, [loadScores, loadSettings]);

  // Navigation handlers
  const handlePlay = () => setScreen('levelSelect');

  const handleSelectLevel = (levelId: string) => {
    setSelectedLevelId(levelId);
    setGameKey(prev => prev + 1);
    setScreen('playing');
  };

  const handleComplete = (gameResults: GameResults) => {
    if (!selectedLevelId) return;
    const oldBest = getBestScore(selectedLevelId);
    setPreviousBest(oldBest);
    setBestScore(selectedLevelId, gameResults.accuracy);
    setResults(gameResults);
    setScreen('results');
  };

  const handleReplay = () => {
    setResults(null);
    setGameKey(prev => prev + 1);
    setScreen('playing');
  };

  const handleBackToLevelSelect = () => {
    setResults(null);
    setScreen('levelSelect');
  };

  const handleBackToMenu = () => {
    setScreen('menu');
  };

  const handleSettings = () => setIsSettingsOpen(true);

  // Get the current level's title for results screen
  const currentLevelTitle = levels.find(l => l.id === selectedLevelId)?.songTitle || selectedLevelId || '';

  // Render current screen
  const renderScreen = () => {
    switch (screen) {
      case 'menu':
        return (
          <MainMenu
            onPlay={handlePlay}
            onSettings={handleSettings}
            onEditor={() => {}}
          />
        );

      case 'levelSelect':
        return (
          <LevelSelect
            levels={levels}
            onSelectLevel={handleSelectLevel}
            onBack={handleBackToMenu}
            onSettings={handleSettings}
          />
        );

      case 'results':
        if (!results) return null;
        const isNewBest = previousBest === null || results.accuracy > previousBest;
        return (
          <ResultsScreen
            accuracy={results.accuracy}
            maxCombo={results.maxCombo}
            perfectHits={results.perfectHits}
            totalNotes={results.totalNotes}
            levelId={selectedLevelId || ''}
            levelTitle={currentLevelTitle}
            previousBest={previousBest}
            isNewBest={isNewBest}
            onReplay={handleReplay}
            onBack={handleBackToLevelSelect}
          />
        );

      case 'playing':
        return (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#000000'
          }}>
            <GameCanvas
              key={gameKey}
              width={800}
              height={600}
              levelId={selectedLevelId || 'test-level-01'}
              onComplete={handleComplete}
            />
          </div>
        );
    }
  };

  return (
    <>
      {renderScreen()}
      <SettingsScreen
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}

export default App;
