interface ElectronAPI {
  loadScores: () => Promise<Record<string, number>>;
  saveScores: (scores: Record<string, number>) => Promise<{ success: boolean; error?: string }>;
  loadSettings: () => Promise<import('./types').Settings | null>;
  saveSettings: (settings: import('./types').Settings) => Promise<{ success: boolean; error?: string }>;
  listLevels: () => Promise<import('./types').LevelInfo[]>;
  validateBeatmap: (levelId: string) => Promise<import('./beatmapValidator').ValidationResult>;
}

interface Window {
  electronAPI?: ElectronAPI;
}
