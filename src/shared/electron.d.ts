interface ElectronAPI {
  loadScores: () => Promise<Record<string, number>>;
  saveScores: (scores: Record<string, number>) => Promise<void>;
  loadSettings: () => Promise<import('./types').Settings | null>;
  saveSettings: (settings: import('./types').Settings) => Promise<void>;
  listLevels: () => Promise<import('./types').LevelInfo[]>;
}

interface Window {
  electronAPI?: ElectronAPI;
}
