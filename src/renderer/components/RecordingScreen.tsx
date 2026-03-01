import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AudioManager } from '../game/audioManager';
import { InputHandler } from '../game/inputHandler';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  LANE_WIDTH,
  HIT_ZONE_Y,
  HIT_ZONE_HEIGHT,
  drawLanes,
  drawHitZones,
} from '../game/rendering';
import { useRecordingStore } from '../stores/recordingStore';
import { useSettingsStore } from '../stores/settingsStore';

interface RecordingScreenProps {
  audioSourcePath: string;
  songTitle: string;
  onRecordingComplete: () => void;
  onBack: () => void;
}

export const RecordingScreen: React.FC<RecordingScreenProps> = ({
  audioSourcePath,
  songTitle,
  onRecordingComplete,
  onBack,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);
  const inputHandlerRef = useRef<InputHandler | null>(null);
  const animFrameRef = useRef<number>(0);

  const [isReady, setIsReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [noteCount, setNoteCount] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [shouldShowStopPrompt, setShouldShowStopPrompt] = useState(false);

  // Track lane flash state
  const [isLeftFlashing, setIsLeftFlashing] = useState(false);
  const [isRightFlashing, setIsRightFlashing] = useState(false);
  const [isLeftHeld, setIsLeftHeld] = useState(false);
  const [isRightHeld, setIsRightHeld] = useState(false);

  const { keyBindings, volume } = useSettingsStore();

  const startRecording = useRecordingStore((s) => s.startRecording);
  const recordKeyDown = useRecordingStore((s) => s.recordKeyDown);
  const recordKeyUp = useRecordingStore((s) => s.recordKeyUp);
  const finishRecording = useRecordingStore((s) => s.finishRecording);

  // Load audio on mount
  useEffect(() => {
    const audioManager = new AudioManager();
    audioManagerRef.current = audioManager;

    const audioUrl = audioSourcePath.startsWith('file://')
      ? audioSourcePath
      : `file://${audioSourcePath}`;

    audioManager
      .loadAudio(audioUrl)
      .then(() => {
        audioManager.setVolume(volume);
        setDuration(audioManager.getDuration());
        setIsReady(true);
      })
      .catch((err) => {
        setAudioError(`Failed to load audio: ${err.message}`);
      });

    return () => {
      audioManager.stop();
      inputHandlerRef.current?.stop();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [audioSourcePath, volume]);

  // Handle recording complete (audio ends naturally)
  const handleAudioEnded = useCallback(() => {
    setIsRecording(false);
    inputHandlerRef.current?.stop();
    finishRecording();
    onRecordingComplete();
  }, [finishRecording, onRecordingComplete]);

  // Start recording
  const handleStart = useCallback(() => {
    const audioManager = audioManagerRef.current;
    if (!audioManager) return;

    const audioDuration = audioManager.getDuration();
    startRecording(audioSourcePath, songTitle, audioDuration);
    setIsRecording(true);

    // Set up input handler
    const handler = new InputHandler(
      (lane) => {
        const time = audioManagerRef.current?.getCurrentTime() ?? 0;
        useRecordingStore.getState().recordKeyDown(lane, time);
        setNoteCount(useRecordingStore.getState().keypresses.length);

        // Flash effect
        if (lane === 'left') {
          setIsLeftFlashing(true);
          setIsLeftHeld(true);
          setTimeout(() => setIsLeftFlashing(false), 100);
        } else {
          setIsRightFlashing(true);
          setIsRightHeld(true);
          setTimeout(() => setIsRightFlashing(false), 100);
        }
      },
      (lane) => {
        const time = audioManagerRef.current?.getCurrentTime() ?? 0;
        useRecordingStore.getState().recordKeyUp(lane, time);

        if (lane === 'left') setIsLeftHeld(false);
        else setIsRightHeld(false);
      },
      keyBindings
    );
    handler.start();
    inputHandlerRef.current = handler;

    // Start audio playback
    audioManager.play(handleAudioEnded);
  }, [audioSourcePath, songTitle, startRecording, keyBindings, handleAudioEnded]);

  // Stop recording (Escape)
  const handleStop = useCallback(() => {
    audioManagerRef.current?.stop();
    inputHandlerRef.current?.stop();
    setIsRecording(false);
    finishRecording();
    onRecordingComplete();
  }, [finishRecording, onRecordingComplete]);

  // Keyboard controls (Space to start, Escape to stop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isRecording && isReady && !shouldShowStopPrompt) {
        e.preventDefault();
        handleStart();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        if (isRecording) {
          if (shouldShowStopPrompt) {
            handleStop();
          } else {
            setShouldShowStopPrompt(true);
          }
        } else {
          onBack();
        }
      } else if (e.code === 'KeyN' && shouldShowStopPrompt) {
        setShouldShowStopPrompt(false);
      } else if (e.code === 'KeyY' && shouldShowStopPrompt) {
        handleStop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, isReady, shouldShowStopPrompt, handleStart, handleStop, onBack]);

  // Animation loop for time display + canvas
  useEffect(() => {
    const render = () => {
      const audioManager = audioManagerRef.current;
      if (audioManager && isRecording) {
        setCurrentTime(audioManager.getCurrentTime());
        setNoteCount(useRecordingStore.getState().keypresses.length);
      }

      // Draw canvas
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Lanes and hit zones
        drawLanes(ctx);
        drawHitZones(ctx);

        const leftLaneX = CANVAS_WIDTH / 2 - LANE_WIDTH - 50;
        const rightLaneX = CANVAS_WIDTH / 2 + 50;

        // Flash effect on keypress
        if (isLeftFlashing) {
          ctx.fillStyle = 'rgba(0, 255, 0, 0.4)';
          ctx.fillRect(leftLaneX, HIT_ZONE_Y, LANE_WIDTH, HIT_ZONE_HEIGHT);
        }
        if (isRightFlashing) {
          ctx.fillStyle = 'rgba(0, 255, 0, 0.4)';
          ctx.fillRect(rightLaneX, HIT_ZONE_Y, LANE_WIDTH, HIT_ZONE_HEIGHT);
        }

        // Hold indicator: colored bar growing upward from hit zone
        if (isLeftHeld) {
          const holdStart = useRecordingStore.getState().activeKeys.get('left');
          if (holdStart && audioManager) {
            const holdDuration = audioManager.getCurrentTime() - holdStart.timestamp;
            const barHeight = Math.min(holdDuration * 200, HIT_ZONE_Y); // 200px per second
            ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
            ctx.fillRect(leftLaneX, HIT_ZONE_Y - barHeight, LANE_WIDTH, barHeight);
          }
        }
        if (isRightHeld) {
          const holdStart = useRecordingStore.getState().activeKeys.get('right');
          if (holdStart && audioManager) {
            const holdDuration = audioManager.getCurrentTime() - holdStart.timestamp;
            const barHeight = Math.min(holdDuration * 200, HIT_ZONE_Y);
            ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
            ctx.fillRect(rightLaneX, HIT_ZONE_Y - barHeight, LANE_WIDTH, barHeight);
          }
        }

        // REC indicator
        if (isRecording) {
          ctx.fillStyle = '#FF0000';
          ctx.beginPath();
          ctx.arc(30, 30, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FF0000';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('REC', 45, 36);
        }

        // Time display
        const time = audioManager?.getCurrentTime() ?? 0;
        const dur = duration;
        ctx.fillStyle = '#CCCCCC';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(
          `${formatTime(time)} / ${formatTime(dur)}`,
          CANVAS_WIDTH - 20,
          36
        );

        // Progress bar
        const progress = dur > 0 ? time / dur : 0;
        ctx.fillStyle = '#333333';
        ctx.fillRect(20, CANVAS_HEIGHT - 20, CANVAS_WIDTH - 40, 6);
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(20, CANVAS_HEIGHT - 20, (CANVAS_WIDTH - 40) * progress, 6);

        // Note counter
        ctx.fillStyle = '#CCCCCC';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${noteCount} notes recorded`,
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT - 35
        );

        // Prompt
        if (!isRecording && isReady && !shouldShowStopPrompt) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(
            'Press Space to start recording',
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT / 2
          );
          ctx.fillStyle = '#888888';
          ctx.font = '14px sans-serif';
          ctx.fillText(
            'Press Escape to go back',
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT / 2 + 30
          );
        }

        // Stop prompt
        if (shouldShowStopPrompt) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(
            'Stop recording? Recorded notes will be kept.',
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT / 2 - 20
          );
          ctx.fillStyle = '#888888';
          ctx.font = '16px sans-serif';
          ctx.fillText(
            'Y = Stop  |  N = Continue',
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT / 2 + 20
          );
        }

        // Audio error
        if (audioError) {
          ctx.fillStyle = '#FF4444';
          ctx.font = '18px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(audioError, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
          ctx.fillStyle = '#888888';
          ctx.font = '14px sans-serif';
          ctx.fillText(
            'Press Escape to go back',
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT / 2 + 30
          );
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isRecording, isReady, duration, noteCount, isLeftFlashing, isRightFlashing, isLeftHeld, isRightHeld, shouldShowStopPrompt, audioError]);

  return (
    <div
      data-testid="screen-recording"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#000000',
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        data-testid="recording-canvas"
        style={{ border: '1px solid #333333' }}
      />
    </div>
  );
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
