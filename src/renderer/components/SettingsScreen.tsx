import React, { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Slider from '@radix-ui/react-slider';
import { useSettingsStore } from '../stores/settingsStore';
import type { Settings } from '../../shared/types';

interface SettingsScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

function friendlyKeyName(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Arrow')) return code.slice(5) + ' Arrow';
  return code.replace(/([A-Z])/g, ' $1').trim();
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ isOpen, onClose }) => {
  const { settings, updateColors, updateKeyBindings, updateVolume, resetToDefaults } = useSettingsStore();

  // Local draft state for editing
  const [draft, setDraft] = useState<Settings>(settings);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [listeningKey, setListeningKey] = useState<'left' | 'right' | null>(null);

  // Sync draft when settings change or modal opens
  useEffect(() => {
    if (isOpen) {
      setDraft(settings);
      setFieldErrors({});
      setListeningKey(null);
    }
  }, [isOpen, settings]);

  // Key capture listener
  const handleKeyCapture = useCallback((event: KeyboardEvent) => {
    if (!listeningKey) return;
    event.preventDefault();

    const code = event.code;
    const otherKey = listeningKey === 'left' ? draft.keyBindings.right : draft.keyBindings.left;

    if (code === otherKey) {
      setFieldErrors(prev => ({ ...prev, [`keyBinding${listeningKey.charAt(0).toUpperCase()}${listeningKey.slice(1)}`]: 'Key already bound to other lane' }));
      setListeningKey(null);
      return;
    }

    setDraft(prev => ({
      ...prev,
      keyBindings: { ...prev.keyBindings, [listeningKey]: code },
    }));
    setFieldErrors(prev => {
      const next = { ...prev };
      delete next[`keyBinding${listeningKey.charAt(0).toUpperCase()}${listeningKey.slice(1)}`];
      return next;
    });
    setListeningKey(null);
  }, [listeningKey, draft.keyBindings]);

  useEffect(() => {
    if (listeningKey) {
      window.addEventListener('keydown', handleKeyCapture);
      return () => window.removeEventListener('keydown', handleKeyCapture);
    }
  }, [listeningKey, handleKeyCapture]);

  const validateColor = (field: string, value: string): boolean => {
    if (!HEX_PATTERN.test(value)) {
      setFieldErrors(prev => ({ ...prev, [field]: 'Must be hex format #RRGGBB' }));
      return false;
    }
    setFieldErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    return true;
  };

  const handleColorChange = (field: keyof Settings['colors'], value: string) => {
    setDraft(prev => ({
      ...prev,
      colors: { ...prev.colors, [field]: value },
    }));
    validateColor(field, value);
  };

  const handleSave = () => {
    // Validate all colors
    const colorFields: (keyof Settings['colors'])[] = ['tap', 'hold', 'background', 'text'];
    let valid = true;
    for (const field of colorFields) {
      if (!validateColor(field, draft.colors[field])) valid = false;
    }

    // Validate key bindings not duplicated
    if (draft.keyBindings.left === draft.keyBindings.right) {
      setFieldErrors(prev => ({ ...prev, keyBindingRight: 'Cannot be same as left key' }));
      valid = false;
    }

    if (!valid) return;

    updateColors(draft.colors);
    updateKeyBindings(draft.keyBindings);
    updateVolume(draft.volume);
    onClose();
  };

  const handleReset = () => {
    resetToDefaults();
    onClose();
  };

  const colorInput = (label: string, field: keyof Settings['colors'], testId: string) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ color: '#CCCCCC', display: 'flex', alignItems: 'center', gap: 8 }}>
        {label}:
        <div style={{
          width: 24, height: 24, border: '1px solid #555',
          backgroundColor: HEX_PATTERN.test(draft.colors[field]) ? draft.colors[field] : '#000',
        }} />
        <input
          data-testid={testId}
          type="text"
          value={draft.colors[field]}
          onChange={e => handleColorChange(field, e.target.value)}
          style={{
            backgroundColor: '#222', color: '#CCC', border: '1px solid #555',
            padding: '4px 8px', width: 100, fontFamily: 'monospace',
          }}
        />
      </label>
      {fieldErrors[field] && <div style={{ color: '#FF4444', fontSize: 12, marginTop: 2 }}>{fieldErrors[field]}</div>}
    </div>
  );

  return (
    <Dialog.Root open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
        }} />
        <Dialog.Content
          data-testid="settings-dialog"
          style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            backgroundColor: '#111', border: '1px solid #333', padding: 24,
            width: 420, maxHeight: '80vh', overflowY: 'auto', color: '#CCC',
          }}
        >
          <Dialog.Title style={{ margin: '0 0 16px', fontSize: 20, color: '#FFF' }}>Settings</Dialog.Title>

          {/* Volume */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: '#CCCCCC', display: 'block', marginBottom: 8 }}>
              Volume: {draft.volume}%
            </label>
            <Slider.Root
              data-testid="slider-volume"
              value={[draft.volume]}
              onValueChange={([val]) => setDraft(prev => ({ ...prev, volume: val }))}
              max={100}
              step={1}
              style={{
                position: 'relative', display: 'flex', alignItems: 'center',
                width: '100%', height: 20,
              }}
            >
              <Slider.Track style={{
                backgroundColor: '#333', position: 'relative', flexGrow: 1, height: 4,
              }}>
                <Slider.Range style={{
                  position: 'absolute', backgroundColor: '#FFF', height: '100%',
                }} />
              </Slider.Track>
              <Slider.Thumb style={{
                display: 'block', width: 16, height: 16, backgroundColor: '#FFF',
                borderRadius: '50%', cursor: 'pointer',
              }} />
            </Slider.Root>
          </div>

          {/* Key Bindings */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#CCCCCC', marginBottom: 8 }}>Key Bindings</div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div>
                <label style={{ color: '#999', fontSize: 12 }}>Left Lane</label>
                <button
                  data-testid="button-key-left"
                  onClick={() => setListeningKey('left')}
                  style={{
                    display: 'block', backgroundColor: '#222', color: '#CCC',
                    border: listeningKey === 'left' ? '2px solid #FFF' : '1px solid #555',
                    padding: '8px 16px', cursor: 'pointer', minWidth: 80, textAlign: 'center',
                  }}
                >
                  {listeningKey === 'left' ? 'Press a key...' : friendlyKeyName(draft.keyBindings.left)}
                </button>
                {fieldErrors.keyBindingLeft && <div style={{ color: '#FF4444', fontSize: 12 }}>{fieldErrors.keyBindingLeft}</div>}
              </div>
              <div>
                <label style={{ color: '#999', fontSize: 12 }}>Right Lane</label>
                <button
                  data-testid="button-key-right"
                  onClick={() => setListeningKey('right')}
                  style={{
                    display: 'block', backgroundColor: '#222', color: '#CCC',
                    border: listeningKey === 'right' ? '2px solid #FFF' : '1px solid #555',
                    padding: '8px 16px', cursor: 'pointer', minWidth: 80, textAlign: 'center',
                  }}
                >
                  {listeningKey === 'right' ? 'Press a key...' : friendlyKeyName(draft.keyBindings.right)}
                </button>
                {fieldErrors.keyBindingRight && <div style={{ color: '#FF4444', fontSize: 12 }}>{fieldErrors.keyBindingRight}</div>}
              </div>
            </div>
          </div>

          {/* Colors */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#CCCCCC', marginBottom: 8 }}>Colors</div>
            {colorInput('Tap Note', 'tap', 'input-color-tap')}
            {colorInput('Hold Note', 'hold', 'input-color-hold')}
            {colorInput('Background', 'background', 'input-color-background')}
            {colorInput('Text', 'text', 'input-color-text')}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              data-testid="button-reset-defaults"
              onClick={handleReset}
              style={{
                backgroundColor: '#333', color: '#CCC', border: '1px solid #555',
                padding: '8px 16px', cursor: 'pointer', marginRight: 'auto',
              }}
            >
              Reset to Defaults
            </button>
            <button
              data-testid="button-cancel"
              onClick={onClose}
              style={{
                backgroundColor: '#333', color: '#CCC', border: '1px solid #555',
                padding: '8px 16px', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              data-testid="button-save"
              onClick={handleSave}
              style={{
                backgroundColor: '#555', color: '#FFF', border: '1px solid #777',
                padding: '8px 16px', cursor: 'pointer',
              }}
            >
              Save
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
