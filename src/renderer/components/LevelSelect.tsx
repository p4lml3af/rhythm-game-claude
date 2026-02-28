import React, { useState, useEffect, useRef } from 'react';
import { useScoreStore } from '../stores/scoreStore';
import type { LevelInfo } from '../../shared/types';

interface LevelSelectProps {
  levels: LevelInfo[];
  onSelectLevel: (levelId: string) => void;
  onBack: () => void;
  onSettings: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const LevelSelect: React.FC<LevelSelectProps> = ({
  levels,
  onSelectLevel,
  onBack,
  onSettings,
}) => {
  const [focusIndex, setFocusIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { getBestScore } = useScoreStore();

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIndex(prev => (prev <= 0 ? Math.max(levels.length - 1, 0) : prev - 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIndex(prev => (prev >= levels.length - 1 ? 0 : prev + 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (levels[focusIndex]) onSelectLevel(levels[focusIndex].id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onBack();
    }
  };

  return (
    <div
      ref={containerRef}
      data-testid="screen-level-select"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#000000',
        color: '#CCCCCC',
        fontFamily: 'sans-serif',
        outline: 'none',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 24px',
        borderBottom: '1px solid #333333',
      }}>
        <button
          data-testid="button-back-to-menu"
          onClick={onBack}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#333333',
            color: '#CCCCCC',
            border: '1px solid #555555',
            cursor: 'pointer',
          }}
        >
          Back
        </button>
        <h2 style={{ fontSize: '24px', color: '#FFFFFF', margin: 0 }}>Select Level</h2>
        <button
          data-testid="button-settings-level-select"
          onClick={onSettings}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#333333',
            color: '#CCCCCC',
            border: '1px solid #555555',
            cursor: 'pointer',
          }}
        >
          Settings
        </button>
      </div>

      {/* Level list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {levels.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666666' }}>
            No levels found
          </div>
        )}
        {levels.map((level, index) => {
          const best = getBestScore(level.id);
          return (
            <div
              key={level.id}
              data-testid={`level-row-${level.id}`}
              onClick={() => onSelectLevel(level.id)}
              onMouseEnter={() => setFocusIndex(index)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 24px',
                cursor: 'pointer',
                backgroundColor: focusIndex === index ? '#222222' : 'transparent',
                borderBottom: '1px solid #1a1a1a',
              }}
            >
              <div>
                <div style={{ fontSize: '18px', color: '#FFFFFF', marginBottom: '4px' }}>
                  {level.songTitle}
                </div>
                <div style={{ fontSize: '13px', color: '#888888' }}>
                  {level.bpm} BPM | {formatDuration(level.duration)} | {level.noteCount} notes
                </div>
              </div>
              <div
                data-testid={`level-best-${level.id}`}
                style={{
                  fontSize: '16px',
                  color: best !== null ? '#FFFFFF' : '#555555',
                  fontWeight: best !== null ? 'bold' : 'normal',
                }}
              >
                {best !== null ? `${best.toFixed(1)}%` : 'Not played'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
