import React, { useState, useEffect, useRef } from 'react';

interface MainMenuProps {
  onPlay: () => void;
  onSettings: () => void;
  onEditor: () => void;
}

const buttons = ['Play', 'Settings', 'Editor'] as const;

export const MainMenu: React.FC<MainMenuProps> = ({ onPlay, onSettings, onEditor }) => {
  const [focusIndex, setFocusIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const handleAction = (index: number) => {
    if (index === 0) onPlay();
    else if (index === 1) onSettings();
    else if (index === 2) onEditor();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIndex(prev => (prev <= 0 ? buttons.length - 1 : prev - 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIndex(prev => (prev >= buttons.length - 1 ? 0 : prev + 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleAction(focusIndex);
    }
  };

  const buttonStyle = (index: number): React.CSSProperties => ({
    padding: '16px 48px',
    fontSize: '20px',
    backgroundColor: focusIndex === index ? '#444444' : '#333333',
    color: '#CCCCCC',
    border: focusIndex === index ? '1px solid #888888' : '1px solid #555555',
    cursor: 'pointer',
    width: '240px',
    textAlign: 'center',
    outline: 'none',
  });

  return (
    <div
      ref={containerRef}
      data-testid="screen-menu"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#000000',
        color: '#CCCCCC',
        fontFamily: 'sans-serif',
        outline: 'none',
      }}
    >
      <h1 style={{ fontSize: '56px', color: '#FFFFFF', marginBottom: '60px' }}>
        Beat Trainer
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <button
          data-testid="button-play"
          onClick={onPlay}
          onMouseEnter={() => setFocusIndex(0)}
          style={buttonStyle(0)}
        >
          Play
        </button>
        <button
          data-testid="button-settings-menu"
          onClick={onSettings}
          onMouseEnter={() => setFocusIndex(1)}
          style={buttonStyle(1)}
        >
          Settings
        </button>
        <button
          data-testid="button-editor"
          onClick={onEditor}
          onMouseEnter={() => setFocusIndex(2)}
          style={buttonStyle(2)}
        >
          Editor
        </button>
      </div>
    </div>
  );
};
