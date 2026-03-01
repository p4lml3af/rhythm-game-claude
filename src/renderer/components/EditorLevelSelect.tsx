import React, { useState, useEffect, useRef } from 'react';
import type { LevelInfo } from '../../shared/types';

interface EditorLevelSelectProps {
  levels: LevelInfo[];
  onCreateNew: () => void;
  onRecordNew: () => void;
  onEditLevel: (levelId: string) => void;
  onBack: () => void;
}

export const EditorLevelSelect: React.FC<EditorLevelSelectProps> = ({
  levels,
  onCreateNew,
  onRecordNew,
  onEditLevel,
  onBack,
}) => {
  const [focusIndex, setFocusIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Only show valid (no error) levels for editing
  const editableLevels = levels.filter((l) => !l.error);

  // Total items: back(0), create-new(1), record-new(2), then editable levels
  const totalItems = 3 + editableLevels.length;

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIndex((prev) => (prev <= 0 ? totalItems - 1 : prev - 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIndex((prev) => (prev >= totalItems - 1 ? 0 : prev + 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusIndex === 0) onBack();
      else if (focusIndex === 1) onCreateNew();
      else if (focusIndex === 2) onRecordNew();
      else onEditLevel(editableLevels[focusIndex - 3].id);
    } else if (e.key === 'Escape') {
      onBack();
    }
  };

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      data-testid="screen-editor-level-select"
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid #333333',
        }}
      >
        <button
          data-testid="button-editor-back"
          onClick={onBack}
          onMouseEnter={() => setFocusIndex(0)}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: focusIndex === 0 ? '#444444' : '#333333',
            color: '#CCCCCC',
            border: `1px solid ${focusIndex === 0 ? '#888888' : '#555555'}`,
            cursor: 'pointer',
          }}
        >
          Back
        </button>
        <h2 style={{ fontSize: '24px', color: '#FFFFFF', margin: 0 }}>Level Editor</h2>
        <div style={{ width: '60px' }} />
      </div>

      {/* Create New / Record Buttons */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #333333', display: 'flex', gap: '12px' }}>
        <button
          data-testid="button-create-new-level"
          onClick={onCreateNew}
          onMouseEnter={() => setFocusIndex(1)}
          style={{
            flex: 1,
            padding: '16px',
            fontSize: '18px',
            backgroundColor: focusIndex === 1 ? '#224422' : '#1a331a',
            color: '#88CC88',
            border: `1px solid ${focusIndex === 1 ? '#448844' : '#335533'}`,
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          + Create New Level
        </button>
        <button
          data-testid="button-record-new-level"
          onClick={onRecordNew}
          onMouseEnter={() => setFocusIndex(2)}
          style={{
            flex: 1,
            padding: '16px',
            fontSize: '18px',
            backgroundColor: focusIndex === 2 ? '#442222' : '#331a1a',
            color: '#CC8888',
            border: `1px solid ${focusIndex === 2 ? '#884444' : '#553333'}`,
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          Record Play-Along
        </button>
      </div>

      {/* Level List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {editableLevels.length === 0 ? (
          <div
            style={{
              padding: '32px 24px',
              textAlign: 'center',
              color: '#666666',
              fontSize: '16px',
            }}
          >
            No existing levels to edit
          </div>
        ) : (
          editableLevels.map((level, index) => {
            const itemIndex = index + 3;
            return (
              <div
                key={level.id}
                data-testid={`button-edit-level-${level.id}`}
                onClick={() => onEditLevel(level.id)}
                onMouseEnter={() => setFocusIndex(itemIndex)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 24px',
                  cursor: 'pointer',
                  backgroundColor: focusIndex === itemIndex ? '#222222' : 'transparent',
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
                  style={{
                    padding: '6px 16px',
                    fontSize: '14px',
                    backgroundColor: '#333333',
                    color: '#CCCCCC',
                    border: '1px solid #555555',
                  }}
                >
                  Edit
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
