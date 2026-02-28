import { create } from 'zustand';
import type { Settings } from '../../shared/types';
import { DEFAULT_SETTINGS } from '../../shared/constants';

interface SettingsState {
  settings: Settings;
  updateColors: (colors: Partial<Settings['colors']>) => void;
  updateKeyBindings: (keyBindings: Partial<Settings['keyBindings']>) => void;
  updateVolume: (volume: number) => void;
  resetToDefaults: () => void;
  loadSettings: (settings: Settings) => void;
}

function persistSettings(settings: Settings): void {
  if (window.electronAPI?.saveSettings) {
    window.electronAPI.saveSettings(settings);
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS, colors: { ...DEFAULT_SETTINGS.colors }, keyBindings: { ...DEFAULT_SETTINGS.keyBindings } },

  updateColors: (colors: Partial<Settings['colors']>) => {
    const newSettings = {
      ...get().settings,
      colors: { ...get().settings.colors, ...colors },
    };
    set({ settings: newSettings });
    persistSettings(newSettings);
  },

  updateKeyBindings: (keyBindings: Partial<Settings['keyBindings']>) => {
    const newSettings = {
      ...get().settings,
      keyBindings: { ...get().settings.keyBindings, ...keyBindings },
    };
    set({ settings: newSettings });
    persistSettings(newSettings);
  },

  updateVolume: (volume: number) => {
    const clamped = Math.max(0, Math.min(100, volume));
    const newSettings = { ...get().settings, volume: clamped };
    set({ settings: newSettings });
    persistSettings(newSettings);
  },

  resetToDefaults: () => {
    const defaults = {
      ...DEFAULT_SETTINGS,
      colors: { ...DEFAULT_SETTINGS.colors },
      keyBindings: { ...DEFAULT_SETTINGS.keyBindings },
    };
    set({ settings: defaults });
    persistSettings(defaults);
  },

  loadSettings: (settings: Settings) => {
    set({ settings });
  },
}));
