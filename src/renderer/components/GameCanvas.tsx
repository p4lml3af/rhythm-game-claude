import React, { useRef, useEffect, useState } from 'react';
import { drawLanes, drawHitZones, drawAccuracy } from '../game/rendering';
import { AudioManager } from '../game/audioManager';
import { loadBeatmap } from '../game/beatmapLoader';
import { calculateNoteY, drawNote, isNoteOnScreen } from '../game/noteRenderer';
import { InputHandler } from '../game/inputHandler';
import { checkHit, findNoteInHitZone, calculateAccuracy, checkHoldStart, checkHoldComplete, findHoldNoteInHitZone, countUnprocessedNotes } from '../game/hitDetection';
import type { Beatmap, GameState, GameResults } from '../../shared/types';
import { useSettingsStore } from '../stores/settingsStore';

interface GameCanvasProps {
  width?: number;
  height?: number;
  levelId?: string;
  onComplete?: (results: GameResults) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  width = 800,
  height = 600,
  levelId = 'test-level-01',
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [beatmap, setBeatmap] = useState<Beatmap | null>(null);
  const [audioManager] = useState(() => new AudioManager());
  const { settings } = useSettingsStore();
  const inputHandlerRef = useRef<InputHandler | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    notes: [],
    currentTime: 0,
    accuracy: 100,
    hits: 0,
    misses: 0,
    perfectHits: 0,
    goodHits: 0,
    combo: 0,
    maxCombo: 0,
    activeHoldNotes: []
  });
  const [lastHit, setLastHit] = useState<{ result: string; time: number } | null>(null);

  // Apply volume setting
  useEffect(() => {
    audioManager.setVolume(settings.volume);
  }, [settings.volume, audioManager]);

  // Load beatmap and audio on mount
  useEffect(() => {
    const loadAssets = async () => {
      try {
        const loadedBeatmap = await loadBeatmap(`/songs/${levelId}/beatmap.json`);
        await audioManager.loadAudio(`/songs/${levelId}/audio.mp3`);
        setBeatmap(loadedBeatmap);
        console.log('Beatmap and audio loaded:', loadedBeatmap);
      } catch (error) {
        console.error('Failed to load assets:', error);
      }
    };

    loadAssets();
  }, [audioManager, levelId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastFrameTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const gameLoop = (timestamp: number) => {
      // Throttle to 60fps
      const deltaTime = timestamp - lastFrameTime;

      if (deltaTime >= frameInterval) {
        lastFrameTime = timestamp - (deltaTime % frameInterval);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw lanes and hit zones
        drawLanes(ctx);
        drawHitZones(ctx);

        // Render notes and check hold note auto-completion
        if (beatmap && audioManager) {
          const currentTime = audioManager.getCurrentTime();

          beatmap.notes.forEach((note) => {
            const y = calculateNoteY(note.timestamp, currentTime);
            const holdHeight = (note.type === 'hold' && note.duration)
              ? note.duration * 200 : 0; // 200 = NOTE_SCROLL_SPEED

            if (isNoteOnScreen(y, holdHeight)) {
              drawNote(ctx, note, y, settings.colors);
            }
          });

          // Auto-complete hold notes when key is still held past end time
          if (gameState.activeHoldNotes.length > 0) {
            gameState.activeHoldNotes.forEach(holdNote => {
              if (holdNote.isHeld && checkHoldComplete(holdNote.note, currentTime)) {
                setGameState(prev => {
                  const active = prev.activeHoldNotes.find(h => h === holdNote);
                  if (!active) return prev; // Already removed

                  const newState = { ...prev };
                  if (active.startResult === 'perfect') {
                    newState.perfectHits++;
                  } else {
                    newState.goodHits++;
                  }
                  newState.hits++;
                  newState.combo++;
                  newState.maxCombo = Math.max(newState.maxCombo, newState.combo);
                  newState.accuracy = calculateAccuracy(newState.hits, newState.misses);
                  newState.activeHoldNotes = prev.activeHoldNotes.filter(h => h !== holdNote);
                  setLastHit({ result: 'HELD!', time: Date.now() });
                  return newState;
                });
              }
            });
          }
        }

        // Draw hit feedback
        if (lastHit && Date.now() - lastHit.time < 500) {
          ctx.save();
          ctx.fillStyle = lastHit.result === 'PERFECT' ? '#00FF00' :
                          lastHit.result === 'GOOD' ? '#FFFF00' :
                          lastHit.result === 'HELD!' ? '#00FF00' :
                          lastHit.result === 'RELEASED!' ? '#FF0000' : '#FF0000';
          ctx.font = 'bold 48px sans-serif';
          ctx.textAlign = 'center';
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 10;
          ctx.fillText(lastHit.result + '!', canvas.width / 2, canvas.height / 2);
          ctx.restore();
        }

        // Draw combo
        if (gameState.combo > 0) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '32px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${gameState.combo}x`, canvas.width / 2, 50);
        }

        // Draw accuracy percentage
        drawAccuracy(ctx, gameState.accuracy, settings.colors.text);
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [beatmap, audioManager, gameState.accuracy, gameState.combo, lastHit, settings.colors]);

  // Initialize input handler
  useEffect(() => {
    const handleKeyPress = (lane: 'left' | 'right') => {
      if (!beatmap || !audioManager) return;

      const currentTime = audioManager.getCurrentTime();
      const activeNotes = beatmap.notes.filter(n => !gameState.notes.includes(n));

      // Check for hold notes first
      const holdNote = findHoldNoteInHitZone(activeNotes, lane, currentTime);
      if (holdNote) {
        const result = checkHoldStart(holdNote, currentTime);
        if (result !== 'miss') {
          // Start tracking this hold note
          setGameState(prev => ({
            ...prev,
            notes: [...prev.notes, holdNote],
            activeHoldNotes: [...prev.activeHoldNotes, {
              note: holdNote,
              startResult: result,
              isHeld: true
            }]
          }));
          setLastHit({ result: result.toUpperCase(), time: Date.now() });
          return;
        }
      }

      // Fall through to tap note logic
      const note = findNoteInHitZone(activeNotes, lane, currentTime);

      if (note) {
        const result = checkHit(note, currentTime);
        setLastHit({ result: result.toUpperCase(), time: Date.now() });

        setGameState((prev) => {
          const newState = { ...prev };
          newState.notes = [...prev.notes, note]; // Mark as processed

          if (result === 'perfect') {
            newState.perfectHits++;
            newState.hits++;
            newState.combo++;
          } else if (result === 'good') {
            newState.goodHits++;
            newState.hits++;
            newState.combo++;
          } else {
            newState.misses++;
            newState.combo = 0;
          }

          newState.maxCombo = Math.max(newState.maxCombo, newState.combo);
          newState.accuracy = calculateAccuracy(newState.hits, newState.misses);

          return newState;
        });
      }
    };

    const handleKeyRelease = (lane: 'left' | 'right') => {
      if (!audioManager) return;

      const currentTime = audioManager.getCurrentTime();

      setGameState(prev => {
        const holdNote = prev.activeHoldNotes.find(
          h => h.note.lane === lane && h.isHeld
        );
        if (!holdNote) return prev;

        const isComplete = checkHoldComplete(holdNote.note, currentTime);
        const newState = { ...prev };

        if (isComplete) {
          // Success — count using the initial press result
          if (holdNote.startResult === 'perfect') {
            newState.perfectHits++;
          } else {
            newState.goodHits++;
          }
          newState.hits++;
          newState.combo++;
          newState.maxCombo = Math.max(newState.maxCombo, newState.combo);
          setLastHit({ result: 'HELD!', time: Date.now() });
        } else {
          // Released too early — miss
          newState.misses++;
          newState.combo = 0;
          setLastHit({ result: 'RELEASED!', time: Date.now() });
        }

        newState.accuracy = calculateAccuracy(newState.hits, newState.misses);
        // Remove from active hold notes
        newState.activeHoldNotes = prev.activeHoldNotes.filter(h => h !== holdNote);

        return newState;
      });
    };

    inputHandlerRef.current = new InputHandler(handleKeyPress, handleKeyRelease, settings.keyBindings);
    inputHandlerRef.current.start();

    return () => {
      inputHandlerRef.current?.stop();
    };
  }, [beatmap, audioManager, gameState.notes, settings.keyBindings]);

  const handleSongEnd = () => {
    if (!beatmap) return;

    setIsPlaying(false);

    setGameState(prev => {
      const activeHoldNoteRefs = prev.activeHoldNotes.map(h => h.note);
      const unprocessed = countUnprocessedNotes(beatmap.notes, prev.notes, activeHoldNoteRefs);
      const finalMisses = prev.misses + unprocessed + prev.activeHoldNotes.length;
      const totalNotes = beatmap.notes.length;
      const finalAccuracy = totalNotes === 0 ? 100 : ((prev.perfectHits + prev.goodHits) / totalNotes) * 100;

      const results: GameResults = {
        accuracy: Math.round(finalAccuracy * 10) / 10,
        maxCombo: prev.maxCombo,
        perfectHits: prev.perfectHits,
        goodHits: prev.goodHits,
        totalNotes,
        hits: prev.hits,
        misses: finalMisses,
      };

      if (onComplete) {
        // Defer to avoid setState-in-setState
        setTimeout(() => onComplete(results), 0);
      }

      return { ...prev, misses: finalMisses, accuracy: finalAccuracy, activeHoldNotes: [] };
    });
  };

  const handlePlayPause = () => {
    if (!audioManager || !beatmap) return;

    if (isPlaying) {
      audioManager.stop();
      setIsPlaying(false);
    } else {
      audioManager.play(handleSongEnd);
      setIsPlaying(true);
    }
  };

  return (
    <div>
      <button
        data-testid="button-play"
        onClick={handlePlayPause}
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          padding: '10px 20px',
          fontSize: '16px',
          zIndex: 1000
        }}
      >
        {isPlaying ? 'Stop' : 'Play'}
      </button>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          display: 'block',
          backgroundColor: settings.colors.background,
          margin: '0 auto'
        }}
      />
    </div>
  );
};
