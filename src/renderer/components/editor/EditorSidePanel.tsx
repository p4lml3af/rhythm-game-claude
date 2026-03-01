import React from 'react';
import { useEditorStore, type EditorTool } from '../../stores/editorStore';

export const EditorSidePanel: React.FC = () => {
  const {
    songTitle,
    bpm,
    duration,
    notes,
    selectedTool,
    selectedNoteId,
    zoom,
    setTool,
    setZoom,
    setBeatmapMetadata,
    updateNote,
  } = useEditorStore();

  const tapCount = notes.filter((n) => n.type === 'tap').length;
  const holdCount = notes.filter((n) => n.type === 'hold').length;
  const leftCount = notes.filter((n) => n.lane === 'left').length;
  const rightCount = notes.filter((n) => n.lane === 'right').length;
  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const tools: { key: EditorTool; label: string; shortcut: string }[] = [
    { key: 'tap', label: 'Tap', shortcut: '1' },
    { key: 'hold', label: 'Hold', shortcut: '2' },
    { key: 'erase', label: 'Erase', shortcut: '3' },
  ];

  const sectionStyle: React.CSSProperties = {
    padding: '12px',
    borderBottom: '1px solid #333333',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#888888',
    textTransform: 'uppercase',
    marginBottom: '6px',
  };

  return (
    <div
      style={{
        width: '160px',
        backgroundColor: '#111111',
        borderRight: '1px solid #333333',
        overflowY: 'auto',
        fontSize: '13px',
        color: '#CCCCCC',
      }}
    >
      {/* Song Info */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Song Info</div>
        <div style={{ marginBottom: '4px', color: '#FFFFFF', fontSize: '14px' }}>
          {songTitle || 'Untitled'}
        </div>
        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '11px', color: '#888888' }}>BPM</label>
          <input
            data-testid="input-editor-bpm"
            type="number"
            min={1}
            max={999}
            value={bpm}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (val > 0) setBeatmapMetadata({ bpm: val });
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '4px',
              fontSize: '13px',
              backgroundColor: '#222222',
              color: '#FFFFFF',
              border: '1px solid #444444',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ fontSize: '12px', color: '#888888' }}>
          Duration: {formatDuration(duration)}
        </div>
      </div>

      {/* Note Counts */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Notes</div>
        <div data-testid="display-note-count" style={{ lineHeight: '1.6' }}>
          <div>Total: {notes.length}</div>
          <div style={{ fontSize: '12px', color: '#888888' }}>
            Tap: {tapCount} | Hold: {holdCount}
          </div>
          <div style={{ fontSize: '12px', color: '#888888' }}>
            L: {leftCount} | R: {rightCount}
          </div>
        </div>
      </div>

      {/* Tool Selector */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Tool</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {tools.map((t) => (
            <button
              key={t.key}
              data-testid={`button-tool-${t.key}`}
              onClick={() => setTool(t.key)}
              style={{
                padding: '6px 8px',
                fontSize: '13px',
                backgroundColor: selectedTool === t.key ? '#334433' : '#222222',
                color: selectedTool === t.key ? '#88CC88' : '#CCCCCC',
                border: `1px solid ${selectedTool === t.key ? '#448844' : '#444444'}`,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {t.label}{' '}
              <span style={{ fontSize: '11px', color: '#666666', float: 'right' }}>
                {t.shortcut}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Zoom */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Zoom: {zoom}px/s</div>
        <input
          data-testid="slider-editor-zoom"
          type="range"
          min={50}
          max={300}
          value={zoom}
          onChange={(e) => setZoom(parseInt(e.target.value, 10))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Selected Note Info */}
      {selectedNote && (
        <div data-testid="panel-selected-note" style={sectionStyle}>
          <div style={labelStyle}>Selected Note</div>
          <div style={{ marginBottom: '4px' }}>
            <label style={{ fontSize: '11px', color: '#888888' }}>Time (s)</label>
            <input
              type="number"
              step={0.01}
              min={0}
              value={selectedNote.timestamp.toFixed(2)}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val >= 0) updateNote(selectedNote.id!, { timestamp: val });
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '4px',
                fontSize: '13px',
                backgroundColor: '#222222',
                color: '#FFFFFF',
                border: '1px solid #444444',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: '4px' }}>
            <label style={{ fontSize: '11px', color: '#888888' }}>Lane</label>
            <select
              value={selectedNote.lane}
              onChange={(e) =>
                updateNote(selectedNote.id!, { lane: e.target.value as 'left' | 'right' })
              }
              style={{
                display: 'block',
                width: '100%',
                padding: '4px',
                fontSize: '13px',
                backgroundColor: '#222222',
                color: '#FFFFFF',
                border: '1px solid #444444',
                outline: 'none',
              }}
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div style={{ fontSize: '12px', color: '#888888' }}>
            Type: {selectedNote.type}
            {selectedNote.type === 'hold' && selectedNote.duration
              ? ` (${selectedNote.duration.toFixed(2)}s)`
              : ''}
          </div>
        </div>
      )}
    </div>
  );
};
