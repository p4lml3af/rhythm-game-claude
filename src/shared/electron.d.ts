interface ElectronAPI {
  loadScores: () => Promise<Record<string, number>>;
  saveScores: (scores: Record<string, number>) => Promise<void>;
  loadSettings: () => Promise<import('./types').Settings | null>;
  saveSettings: (settings: import('./types').Settings) => Promise<void>;
}

interface Window {
  electronAPI?: ElectronAPI;
}
