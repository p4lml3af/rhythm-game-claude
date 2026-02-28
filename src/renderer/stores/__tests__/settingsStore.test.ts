import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettingsStore } from '../settingsStore';
import { DEFAULT_SETTINGS } from '../../../shared/constants';

// Mock electronAPI
const mockSaveSettings = vi.fn();
Object.defineProperty(window, 'electronAPI', {
  value: { saveSettings: mockSaveSettings },
  writable: true,
});

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetToDefaults();
    mockSaveSettings.mockClear();
  });

  it('initializes with default settings', () => {
    const { settings } = useSettingsStore.getState();
    expect(settings.colors.tap).toBe('#0000FF');
    expect(settings.colors.hold).toBe('#FF0000');
    expect(settings.colors.background).toBe('#000000');
    expect(settings.colors.text).toBe('#CCCCCC');
    expect(settings.keyBindings.left).toBe('KeyD');
    expect(settings.keyBindings.right).toBe('KeyK');
    expect(settings.volume).toBe(100);
  });

  it('updateColors merges partial color updates', () => {
    useSettingsStore.getState().updateColors({ tap: '#00FF00' });
    const { settings } = useSettingsStore.getState();
    expect(settings.colors.tap).toBe('#00FF00');
    expect(settings.colors.hold).toBe('#FF0000'); // unchanged
  });

  it('updateKeyBindings merges partial key binding updates', () => {
    useSettingsStore.getState().updateKeyBindings({ left: 'ArrowLeft' });
    const { settings } = useSettingsStore.getState();
    expect(settings.keyBindings.left).toBe('ArrowLeft');
    expect(settings.keyBindings.right).toBe('KeyK'); // unchanged
  });

  it('updateVolume sets volume correctly', () => {
    useSettingsStore.getState().updateVolume(50);
    expect(useSettingsStore.getState().settings.volume).toBe(50);
  });

  it('updateVolume clamps to 0-100 range', () => {
    useSettingsStore.getState().updateVolume(-10);
    expect(useSettingsStore.getState().settings.volume).toBe(0);

    useSettingsStore.getState().updateVolume(150);
    expect(useSettingsStore.getState().settings.volume).toBe(100);
  });

  it('resetToDefaults reverts all settings', () => {
    useSettingsStore.getState().updateColors({ tap: '#AABBCC' });
    useSettingsStore.getState().updateKeyBindings({ left: 'ArrowLeft' });
    useSettingsStore.getState().updateVolume(25);

    useSettingsStore.getState().resetToDefaults();
    const { settings } = useSettingsStore.getState();
    expect(settings.colors.tap).toBe(DEFAULT_SETTINGS.colors.tap);
    expect(settings.keyBindings.left).toBe(DEFAULT_SETTINGS.keyBindings.left);
    expect(settings.volume).toBe(DEFAULT_SETTINGS.volume);
  });

  it('loadSettings hydrates store with saved settings', () => {
    const saved = {
      colors: { tap: '#111111', hold: '#222222', background: '#333333', text: '#444444' },
      keyBindings: { left: 'ArrowLeft', right: 'ArrowRight' },
      volume: 75,
    };
    useSettingsStore.getState().loadSettings(saved);
    const { settings } = useSettingsStore.getState();
    expect(settings).toEqual(saved);
  });

  it('persists settings via electronAPI on update', () => {
    useSettingsStore.getState().updateVolume(60);
    expect(mockSaveSettings).toHaveBeenCalledWith(
      expect.objectContaining({ volume: 60 })
    );
  });

  it('persists settings via electronAPI on color update', () => {
    useSettingsStore.getState().updateColors({ tap: '#ABCDEF' });
    expect(mockSaveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        colors: expect.objectContaining({ tap: '#ABCDEF' }),
      })
    );
  });

  it('persists settings via electronAPI on reset', () => {
    useSettingsStore.getState().resetToDefaults();
    expect(mockSaveSettings).toHaveBeenCalled();
  });
});
