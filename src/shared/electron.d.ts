interface ElectronAPI {
  loadScores: () => Promise<Record<string, number>>;
  saveScores: (scores: Record<string, number>) => Promise<{ success: boolean; error?: string }>;
  loadSettings: () => Promise<import('./types').Settings | null>;
  saveSettings: (settings: import('./types').Settings) => Promise<{ success: boolean; error?: string }>;
  listLevels: () => Promise<import('./types').LevelInfo[]>;
  validateBeatmap: (levelId: string) => Promise<import('./beatmapValidator').ValidationResult>;

  // Editor APIs
  selectAudioFile: () => Promise<{ filePath: string; fileName: string } | null>;
  saveLevel: (data: { levelName: string; audioSourcePath: string; beatmap: import('./types').Beatmap }) => Promise<{ success: boolean; levelId?: string; error?: string }>;
  loadBeatmap: (levelId: string) => Promise<{ beatmap: import('./types').Beatmap; audioPath: string } | { error: string }>;
  updateBeatmap: (data: { levelId: string; beatmap: import('./types').Beatmap }) => Promise<{ success: boolean; error?: string }>;
}

interface Window {
  electronAPI?: ElectronAPI;
}
