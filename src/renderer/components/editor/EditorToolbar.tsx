import React, { useState } from 'react';
import { useEditorStore } from '../../stores/editorStore';

interface EditorToolbarProps {
  onBack: () => void;
  onSave: () => void;
  onPreview: () => void;
  validationErrors: string[];
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onBack,
  onSave,
  onPreview,
  validationErrors,
}) => {
  const { songTitle, isModified, setBeatmapMetadata } = useEditorStore();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(songTitle);

  const canSave = isModified && validationErrors.length === 0;
  const isValid = validationErrors.length === 0;

  const handleTitleCommit = () => {
    if (titleDraft.trim()) {
      setBeatmapMetadata({ songTitle: titleDraft.trim() });
    } else {
      setTitleDraft(songTitle);
    }
    setIsEditingTitle(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '40px',
        padding: '0 12px',
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #333333',
        gap: '8px',
      }}
    >
      <button
        data-testid="button-editor-toolbar-back"
        onClick={onBack}
        style={{
          padding: '4px 12px',
          fontSize: '13px',
          backgroundColor: '#333333',
          color: '#CCCCCC',
          border: '1px solid #555555',
          cursor: 'pointer',
        }}
      >
        Back
      </button>

      {isEditingTitle ? (
        <input
          data-testid="input-editor-title"
          autoFocus
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={handleTitleCommit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleTitleCommit();
            if (e.key === 'Escape') {
              setTitleDraft(songTitle);
              setIsEditingTitle(false);
            }
          }}
          style={{
            flex: 1,
            padding: '4px 8px',
            fontSize: '16px',
            backgroundColor: '#222222',
            color: '#FFFFFF',
            border: '1px solid #555555',
            outline: 'none',
            maxWidth: '300px',
          }}
        />
      ) : (
        <div
          data-testid="input-editor-title"
          onClick={() => {
            setTitleDraft(songTitle);
            setIsEditingTitle(true);
          }}
          style={{
            flex: 1,
            fontSize: '16px',
            color: '#FFFFFF',
            cursor: 'text',
            padding: '4px 8px',
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {songTitle || 'Untitled'}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Validation indicator */}
      <div
        data-testid="indicator-validation-status"
        title={isValid ? 'Beatmap valid' : validationErrors.join('\n')}
        style={{
          fontSize: '13px',
          color: isValid ? '#44AA44' : '#FF4444',
          padding: '0 8px',
        }}
      >
        {isValid ? 'Valid' : `${validationErrors.length} error${validationErrors.length > 1 ? 's' : ''}`}
      </div>

      <button
        data-testid="button-editor-save"
        onClick={onSave}
        disabled={!canSave}
        style={{
          padding: '4px 12px',
          fontSize: '13px',
          backgroundColor: canSave ? '#224422' : '#222222',
          color: canSave ? '#88CC88' : '#555555',
          border: `1px solid ${canSave ? '#448844' : '#333333'}`,
          cursor: canSave ? 'pointer' : 'not-allowed',
        }}
      >
        Save{isModified ? ' *' : ''}
      </button>

      <button
        data-testid="button-editor-preview"
        onClick={onPreview}
        style={{
          padding: '4px 12px',
          fontSize: '13px',
          backgroundColor: '#333333',
          color: '#CCCCCC',
          border: '1px solid #555555',
          cursor: 'pointer',
        }}
      >
        Preview
      </button>
    </div>
  );
};
