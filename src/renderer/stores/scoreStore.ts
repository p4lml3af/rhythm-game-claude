import { create } from 'zustand';

interface ScoreState {
  bestScores: Record<string, number>;
  setBestScore: (levelId: string, accuracy: number) => void;
  getBestScore: (levelId: string) => number | null;
  loadScores: (scores: Record<string, number>) => void;
}

export const useScoreStore = create<ScoreState>((set, get) => ({
  bestScores: {},

  setBestScore: (levelId: string, accuracy: number) => {
    const current = get().bestScores[levelId];
    if (current !== undefined && accuracy <= current) return;

    const newScores = { ...get().bestScores, [levelId]: accuracy };
    set({ bestScores: newScores });

    // Persist to disk if Electron API is available
    if (window.electronAPI?.saveScores) {
      window.electronAPI.saveScores(newScores);
    }
  },

  getBestScore: (levelId: string) => {
    const score = get().bestScores[levelId];
    return score !== undefined ? score : null;
  },

  loadScores: (scores: Record<string, number>) => {
    set({ bestScores: scores });
  },
}));
