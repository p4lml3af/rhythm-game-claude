import { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { ResultsScreen } from './components/ResultsScreen';
import { MainMenu } from './components/MainMenu';
import { LevelSelect } from './components/LevelSelect';
import { EditorLevelSelect } from './components/EditorLevelSelect';
import { EditorScreen } from './components/editor/EditorScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useScoreStore } from './stores/scoreStore';
import { useSettingsStore } from './stores/settingsStore';
import { useEditorStore } from './stores/editorStore';
import { SettingsScreen } from './components/SettingsScreen';
import type { GameResults, LevelInfo } from '../shared/types';

type Screen = 'menu' | 'levelSelect' | 'playing' | 'results' | 'editorLevelSelect' | 'editor' | 'editorPreview';

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [results, setResults] = useState<GameResults | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [levels, setLevels] = useState<LevelInfo[]>([]);
  const [previousBest, setPreviousBest] = useState<number | null>(null);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [practiceSpeed, setPracticeSpeed] = useState(1.0);

  const { setBestScore, getBestScore, loadScores } = useScoreStore();
  const { loadSettings } = useSettingsStore();

  const refreshLevels = () => {
    if (window.electronAPI?.listLevels) {
      window.electronAPI.listLevels().then(setLevels);
    }
  };

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
    refreshLevels();
  }, [loadScores, loadSettings]);

  // Navigation handlers
  const handlePlay = () => setScreen('levelSelect');

  const handleSelectLevel = (levelId: string, practiceMode: boolean, speed: number) => {
    setSelectedLevelId(levelId);
    setIsPracticeMode(practiceMode);
    setPracticeSpeed(speed);
    setGameKey(prev => prev + 1);
    setScreen('playing');
  };

  const handleComplete = (gameResults: GameResults) => {
    if (!selectedLevelId) return;
    const oldBest = getBestScore(selectedLevelId);
    setPreviousBest(oldBest);

    // Only save scores in normal mode
    if (!isPracticeMode) {
      setBestScore(selectedLevelId, gameResults.accuracy);
    }

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

  // Editor navigation handlers
  const handleEditor = () => {
    refreshLevels();
    setScreen('editorLevelSelect');
  };

  const handleEditorCreateNew = async () => {
    const result = await window.electronAPI?.selectAudioFile();
    if (!result) return; // User cancelled

    const { filePath, fileName } = result;
    const title = fileName.replace(/\.mp3$/i, '');

    // We need to get audio duration — initialize editor with what we know,
    // then the EditorScreen will load the audio and we can update duration
    const editorStore = useEditorStore.getState();
    editorStore.resetEditor();
    editorStore.setBeatmapMetadata({ songTitle: title });

    // Set the audio source path so EditorScreen can load it
    useEditorStore.setState({
      audioSourcePath: filePath,
      audioFile: 'audio.mp3',
      isModified: false,
    });

    // We'll get duration once audio loads in EditorScreen
    // For now, set a placeholder — EditorScreen will update it
    setScreen('editor');
  };

  const handleEditorEdit = async (levelId: string) => {
    const result = await window.electronAPI?.loadBeatmap(levelId);
    if (!result || 'error' in result) {
      alert(`Failed to load level: ${(result as any)?.error || 'Unknown error'}`);
      return;
    }

    const { beatmap, audioPath } = result;
    const editorStore = useEditorStore.getState();
    editorStore.loadBeatmap(beatmap, levelId, audioPath);
    setScreen('editor');
  };

  const handleEditorBack = () => {
    refreshLevels();
    setScreen('editorLevelSelect');
  };

  const handleEditorPreview = () => {
    const editorStore = useEditorStore.getState();
    setSelectedLevelId(editorStore.sourceLevelId);
    setIsPracticeMode(true); // Don't save scores from preview
    setPracticeSpeed(1.0);
    setGameKey(prev => prev + 1);
    setScreen('editorPreview');
  };

  const handleEditorPreviewBack = () => {
    setScreen('editor');
  };

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
            onEditor={handleEditor}
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
        const isNewBest = !isPracticeMode && (previousBest === null || results.accuracy > previousBest);
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
            isPracticeMode={isPracticeMode}
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
              onBack={handleBackToLevelSelect}
              practiceMode={isPracticeMode}
              practiceSpeed={practiceSpeed}
            />
          </div>
        );

      case 'editorLevelSelect':
        return (
          <EditorLevelSelect
            levels={levels}
            onCreateNew={handleEditorCreateNew}
            onEditLevel={handleEditorEdit}
            onBack={handleBackToMenu}
          />
        );

      case 'editor':
        return (
          <EditorScreen
            onBack={handleEditorBack}
            onPreview={handleEditorPreview}
          />
        );

      case 'editorPreview':
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
              onComplete={handleEditorPreviewBack}
              onBack={handleEditorPreviewBack}
              practiceMode={true}
              practiceSpeed={1.0}
            />
          </div>
        );
    }
  };

  return (
    <>
      <ErrorBoundary onReset={handleBackToMenu}>
        {renderScreen()}
      </ErrorBoundary>
      <SettingsScreen
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}

export default App;
