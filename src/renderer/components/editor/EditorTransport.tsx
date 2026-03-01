import React, { useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { AudioManager } from '../../game/audioManager';

interface EditorTransportProps {
  audioManager: AudioManager | null;
}

export const EditorTransport: React.FC<EditorTransportProps> = ({ audioManager }) => {
  const {
    playheadTime,
    isPlaying,
    duration,
    setPlayheadTime,
    setIsPlaying,
  } = useEditorStore();

  const animRef = useRef<number>(0);

  // Animation loop: sync playhead with audio
  const updatePlayhead = useCallback(() => {
    if (audioManager && audioManager.getIsPlaying()) {
      const time = audioManager.getCurrentTime();
      setPlayheadTime(time);
      if (time >= duration) {
        audioManager.stop();
        setIsPlaying(false);
        setPlayheadTime(duration);
        return;
      }
      animRef.current = requestAnimationFrame(updatePlayhead);
    }
  }, [audioManager, duration, setPlayheadTime, setIsPlaying]);

  useEffect(() => {
    if (isPlaying) {
      animRef.current = requestAnimationFrame(updatePlayhead);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, updatePlayhead]);

  const handlePlayPause = () => {
    if (!audioManager) return;

    if (isPlaying) {
      audioManager.stop();
      setIsPlaying(false);
    } else {
      audioManager.playFrom(playheadTime, () => {
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    if (audioManager && isPlaying) {
      audioManager.stop();
    }
    setIsPlaying(false);
    setPlayheadTime(0);
  };

  const handleSkipBack = () => {
    const newTime = Math.max(0, playheadTime - 5);
    setPlayheadTime(newTime);
    if (isPlaying && audioManager) {
      audioManager.playFrom(newTime);
    }
  };

  const handleSkipForward = () => {
    const newTime = Math.min(duration, playheadTime + 5);
    setPlayheadTime(newTime);
    if (isPlaying && audioManager) {
      audioManager.playFrom(newTime);
    }
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const btnStyle: React.CSSProperties = {
    padding: '4px 10px',
    fontSize: '14px',
    backgroundColor: '#333333',
    color: '#CCCCCC',
    border: '1px solid #555555',
    cursor: 'pointer',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '40px',
        padding: '0 12px',
        backgroundColor: '#1a1a1a',
        borderTop: '1px solid #333333',
        gap: '6px',
      }}
    >
      <button
        data-testid="button-transport-skip-back"
        onClick={handleSkipBack}
        style={btnStyle}
        title="Skip back 5s"
      >
        &lt;&lt;
      </button>

      <button
        data-testid="button-transport-play"
        onClick={handlePlayPause}
        style={{
          ...btnStyle,
          backgroundColor: isPlaying ? '#442222' : '#224422',
          color: isPlaying ? '#FF8888' : '#88CC88',
          border: `1px solid ${isPlaying ? '#664444' : '#448844'}`,
          minWidth: '50px',
        }}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>

      <button
        data-testid="button-transport-stop"
        onClick={handleStop}
        style={btnStyle}
        title="Stop and reset"
      >
        Stop
      </button>

      <button
        data-testid="button-transport-skip-forward"
        onClick={handleSkipForward}
        style={btnStyle}
        title="Skip forward 5s"
      >
        &gt;&gt;
      </button>

      <div style={{ flex: 1 }} />

      <div
        data-testid="display-transport-time"
        style={{
          fontSize: '14px',
          color: '#CCCCCC',
          fontFamily: 'monospace',
        }}
      >
        {formatTime(playheadTime)} / {formatTime(duration)}
      </div>
    </div>
  );
};
