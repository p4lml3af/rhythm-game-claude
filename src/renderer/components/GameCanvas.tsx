import React, { useRef, useEffect, useState } from 'react';
import { drawLanes, drawHitZones, drawAccuracy } from '../game/rendering';
import { AudioManager } from '../game/audioManager';
import { loadBeatmap } from '../game/beatmapLoader';
import { calculateNoteY, drawNote, isNoteOnScreen } from '../game/noteRenderer';
import { InputHandler } from '../game/inputHandler';
import { checkHit, findNoteInHitZone, calculateAccuracy } from '../game/hitDetection';
import type { Beatmap, GameState } from '../../shared/types';

interface GameCanvasProps {
  width?: number;
  height?: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  width = 800,
  height = 600
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [beatmap, setBeatmap] = useState<Beatmap | null>(null);
  const [audioManager] = useState(() => new AudioManager());
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
    maxCombo: 0
  });
  const [lastHit, setLastHit] = useState<{ result: string; time: number } | null>(null);

  // Load beatmap and audio on mount
  useEffect(() => {
    const loadAssets = async () => {
      try {
        const loadedBeatmap = await loadBeatmap('/songs/test-level-01/beatmap.json');
        await audioManager.loadAudio('/songs/test-level-01/audio.mp3');
        setBeatmap(loadedBeatmap);
        console.log('Beatmap and audio loaded:', loadedBeatmap);
      } catch (error) {
        console.error('Failed to load assets:', error);
      }
    };

    loadAssets();
  }, [audioManager]);

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

        // Render notes
        if (beatmap && audioManager) {
          const currentTime = audioManager.getCurrentTime();

          beatmap.notes.forEach((note) => {
            const y = calculateNoteY(note.timestamp, currentTime);

            if (isNoteOnScreen(y)) {
              drawNote(ctx, note, y);
            }
          });
        }

        // Draw hit feedback
        if (lastHit && Date.now() - lastHit.time < 500) {
          ctx.save();
          ctx.fillStyle = lastHit.result === 'PERFECT' ? '#00FF00' :
                          lastHit.result === 'GOOD' ? '#FFFF00' : '#FF0000';
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
        drawAccuracy(ctx, gameState.accuracy);
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [beatmap, audioManager, gameState.accuracy, gameState.combo, lastHit]);

  // Initialize input handler
  useEffect(() => {
    const handleKeyPress = (lane: 'left' | 'right') => {
      console.log(`Key pressed: ${lane}`);

      if (!beatmap || !audioManager) {
        console.log('No beatmap or audio manager');
        return;
      }

      const currentTime = audioManager.getCurrentTime();
      console.log(`Current time: ${currentTime.toFixed(2)}s`);

      const activeNotes = beatmap.notes.filter(n => !gameState.notes.includes(n));
      console.log(`Active notes: ${activeNotes.length}`);

      const note = findNoteInHitZone(activeNotes, lane, currentTime);
      console.log(`Note found in hit zone:`, note);

      if (note) {
        const result = checkHit(note, currentTime);
        console.log(`Hit: ${result} (${lane} lane) at time ${currentTime.toFixed(2)}s, note time ${note.timestamp}s`);

        // Show visual feedback
        setLastHit({ result: result.toUpperCase(), time: Date.now() });

        setGameState((prev) => {
          const newState = { ...prev };
          newState.notes.push(note); // Mark as processed

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

          // Calculate accuracy (REQ-4, AC5)
          newState.accuracy = calculateAccuracy(newState.hits, newState.misses);

          return newState;
        });
      } else {
        console.log(`No note in hit zone for ${lane} lane at ${currentTime.toFixed(2)}s`);
      }
    };

    inputHandlerRef.current = new InputHandler(handleKeyPress);
    inputHandlerRef.current.start();

    return () => {
      inputHandlerRef.current?.stop();
    };
  }, [beatmap, audioManager, gameState.notes]);

  const handlePlayPause = () => {
    if (!audioManager || !beatmap) return;

    if (isPlaying) {
      audioManager.stop();
      setIsPlaying(false);
    } else {
      audioManager.play();
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
          backgroundColor: '#000000',
          margin: '0 auto'
        }}
      />
    </div>
  );
};
