interface ElectronAPI {
  loadScores: () => Promise<Record<string, number>>;
  saveScores: (scores: Record<string, number>) => Promise<void>;
}

interface Window {
  electronAPI?: ElectronAPI;
}
