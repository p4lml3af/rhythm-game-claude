import React, { useState } from 'react';
import { useRecordingStore } from '../stores/recordingStore';

interface RecordingResultsProps {
  onSave: () => void;
  onEditInEditor: () => void;
  onReRecord: () => void;
  onDiscard: () => void;
}

export const RecordingResults: React.FC<RecordingResultsProps> = ({
  onSave,
  onEditInEditor,
  onReRecord,
  onDiscard,
}) => {
  const keypresses = useRecordingStore((s) => s.keypresses);
  const duration = useRecordingStore((s) => s.duration);
  const bpm = useRecordingStore((s) => s.bpm);
  const songTitle = useRecordingStore((s) => s.songTitle);
  const setBpm = useRecordingStore((s) => s.setBpm);
  const setSongTitle = useRecordingStore((s) => s.setSongTitle);

  const [shouldShowDiscardConfirm, setShouldShowDiscardConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const tapCount = keypresses.filter((k) => k.type === 'tap').length;
  const holdCount = keypresses.filter((k) => k.type === 'hold').length;
  const totalNotes = keypresses.length;

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    if (totalNotes === 0) return;

    setSaveStatus('saving');
    try {
      const beatmap = useRecordingStore.getState().toBeatmap();
      const audioSourcePath = useRecordingStore.getState().audioSourcePath;

      const result = await window.electronAPI?.saveLevel({
        levelName: songTitle,
        audioSourcePath,
        beatmap,
      });

      if (result?.error) {
        setSaveStatus('error');
        setError(result.error);
      } else {
        setSaveStatus('saved');
        setTimeout(onSave, 1000);
      }
    } catch (err: any) {
      setSaveStatus('error');
      setError(err.message || 'Save failed');
    }
  };

  const handleDiscard = () => {
    if (shouldShowDiscardConfirm) {
      onDiscard();
    } else {
      setShouldShowDiscardConfirm(true);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    fontSize: '16px',
    backgroundColor: '#222222',
    color: '#FFFFFF',
    border: '1px solid #555555',
    width: '100%',
    boxSizing: 'border-box',
  };

  const buttonStyle = (color: string, disabled = false): React.CSSProperties => ({
    padding: '12px 24px',
    fontSize: '16px',
    backgroundColor: disabled ? '#333333' : color,
    color: disabled ? '#666666' : '#FFFFFF',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    flex: 1,
    textAlign: 'center',
  });

  return (
    <div
      data-testid="screen-recording-results"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#000000',
        color: '#CCCCCC',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ padding: '24px', textAlign: 'center', borderBottom: '1px solid #333333' }}>
        <h2 style={{ fontSize: '28px', color: '#FFFFFF', margin: 0 }}>Recording Complete</h2>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '24px', maxWidth: '500px', margin: '0 auto', width: '100%' }}>
        {/* Stats */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', color: '#888888', marginBottom: '12px' }}>Stats</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>Total notes: <span style={{ color: '#FFFFFF' }}>{totalNotes}</span></div>
            <div>Tap notes: <span style={{ color: '#FFFFFF' }}>{tapCount}</span></div>
            <div>Hold notes: <span style={{ color: '#FFFFFF' }}>{holdCount}</span></div>
            <div>Duration: <span style={{ color: '#FFFFFF' }}>{formatDuration(duration)}</span></div>
          </div>
          {totalNotes === 0 && (
            <div data-testid="no-notes-warning" style={{ color: '#FF6644', marginTop: '8px', fontSize: '14px' }}>
              No notes recorded. Try re-recording?
            </div>
          )}
        </div>

        {/* Song Title */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', color: '#888888', marginBottom: '4px' }}>
            Song Title
          </label>
          <input
            data-testid="input-song-title"
            type="text"
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* BPM */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', color: '#888888', marginBottom: '4px' }}>
            BPM
          </label>
          <input
            data-testid="input-bpm"
            type="number"
            value={bpm}
            onChange={(e) => setBpm(Math.max(1, parseInt(e.target.value) || 120))}
            min={1}
            max={300}
            style={{ ...inputStyle, width: '120px' }}
          />
        </div>

        {/* Status messages */}
        {saveStatus === 'saved' && (
          <div style={{ color: '#44FF44', marginBottom: '16px', textAlign: 'center' }}>
            Level saved successfully!
          </div>
        )}
        {saveStatus === 'error' && (
          <div style={{ color: '#FF4444', marginBottom: '16px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Discard confirmation */}
        {shouldShowDiscardConfirm && (
          <div style={{ color: '#FF6644', marginBottom: '16px', textAlign: 'center' }}>
            Discard recorded notes? Click Discard again to confirm.
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '2px', padding: '2px', borderTop: '1px solid #333333' }}>
        <button
          data-testid="button-save-recording"
          onClick={handleSave}
          disabled={totalNotes === 0 || saveStatus === 'saving'}
          style={buttonStyle('#225522', totalNotes === 0 || saveStatus === 'saving')}
        >
          {saveStatus === 'saving' ? 'Saving...' : 'Save as New Level'}
        </button>
        <button
          data-testid="button-edit-in-editor"
          onClick={onEditInEditor}
          style={buttonStyle('#222255')}
        >
          Edit in Visual Editor
        </button>
        <button
          data-testid="button-re-record"
          onClick={onReRecord}
          style={buttonStyle('#444444')}
        >
          Re-record
        </button>
        <button
          data-testid="button-discard-recording"
          onClick={handleDiscard}
          style={buttonStyle(shouldShowDiscardConfirm ? '#882222' : '#444444')}
        >
          Discard
        </button>
      </div>
    </div>
  );
};
