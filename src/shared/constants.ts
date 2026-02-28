import type { Settings } from './types';

export const DEFAULT_SETTINGS: Settings = {
  colors: {
    tap: '#0000FF',
    hold: '#FF0000',
    background: '#000000',
    text: '#CCCCCC',
  },
  keyBindings: {
    left: 'KeyD',
    right: 'KeyK',
  },
  volume: 100,
};
