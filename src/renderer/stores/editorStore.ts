import { create } from 'zustand';
import type { Note, Beatmap } from '../../shared/types';

export type EditorTool = 'tap' | 'hold' | 'erase';

interface EditorState {
  // Beatmap data
  songTitle: string;
  audioFile: string;
  bpm: number;
  duration: number;
  notes: Note[];

  // Editor UI state
  selectedTool: EditorTool;
  selectedNoteId: string | null;
  zoom: number;
  scrollPosition: number;
  playheadTime: number;
  isPlaying: boolean;
  isModified: boolean;

  // Source level info
  sourceLevelId: string | null;
  audioSourcePath: string | null;

  // Actions
  setTool: (tool: EditorTool) => void;
  addNote: (lane: 'left' | 'right', timestamp: number, type: 'tap' | 'hold', duration?: number) => void;
  removeNote: (noteId: string) => void;
  updateNote: (noteId: string, updates: Partial<Note>) => void;
  selectNote: (noteId: string | null) => void;
  setZoom: (zoom: number) => void;
  setScrollPosition: (pos: number) => void;
  setPlayheadTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setBeatmapMetadata: (meta: { songTitle?: string; bpm?: number; duration?: number }) => void;
  loadBeatmap: (beatmap: Beatmap, levelId: string | null, audioPath: string | null) => void;
  resetEditor: () => void;
  toBeatmap: () => Beatmap;
}

let noteCounter = 0;
function generateNoteId(): string {
  return `note-${Date.now()}-${++noteCounter}`;
}

const initialState = {
  songTitle: '',
  audioFile: 'audio.mp3',
  bpm: 120,
  duration: 0,
  notes: [] as Note[],
  selectedTool: 'tap' as EditorTool,
  selectedNoteId: null as string | null,
  zoom: 100,
  scrollPosition: 0,
  playheadTime: 0,
  isPlaying: false,
  isModified: false,
  sourceLevelId: null as string | null,
  audioSourcePath: null as string | null,
};

export const useEditorStore = create<EditorState>((set, get) => ({
  ...initialState,

  setTool: (tool) => set({ selectedTool: tool }),

  addNote: (lane, timestamp, type, duration) => {
    const note: Note = {
      id: generateNoteId(),
      timestamp,
      lane,
      type,
      ...(type === 'hold' && duration ? { duration } : {}),
    };
    set((state) => ({
      notes: [...state.notes, note].sort((a, b) => a.timestamp - b.timestamp),
      isModified: true,
    }));
  },

  removeNote: (noteId) => {
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== noteId),
      selectedNoteId: state.selectedNoteId === noteId ? null : state.selectedNoteId,
      isModified: true,
    }));
  },

  updateNote: (noteId, updates) => {
    set((state) => ({
      notes: state.notes
        .map((n) => (n.id === noteId ? { ...n, ...updates } : n))
        .sort((a, b) => a.timestamp - b.timestamp),
      isModified: true,
    }));
  },

  selectNote: (noteId) => set({ selectedNoteId: noteId }),

  setZoom: (zoom) => set({ zoom: Math.max(50, Math.min(300, zoom)) }),

  setScrollPosition: (pos) => set({ scrollPosition: Math.max(0, pos) }),

  setPlayheadTime: (time) => set({ playheadTime: Math.max(0, time) }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setBeatmapMetadata: (meta) => {
    set((state) => ({
      ...(meta.songTitle !== undefined ? { songTitle: meta.songTitle } : {}),
      ...(meta.bpm !== undefined ? { bpm: meta.bpm } : {}),
      ...(meta.duration !== undefined ? { duration: meta.duration } : {}),
      isModified: true,
    }));
  },

  loadBeatmap: (beatmap, levelId, audioPath) => {
    // Ensure all notes have IDs
    const notes = beatmap.notes.map((n) => ({
      ...n,
      id: n.id || generateNoteId(),
    }));
    set({
      songTitle: beatmap.songTitle,
      audioFile: beatmap.audioFile,
      bpm: beatmap.bpm,
      duration: beatmap.duration,
      notes,
      sourceLevelId: levelId,
      audioSourcePath: audioPath,
      isModified: false,
      selectedNoteId: null,
      scrollPosition: 0,
      playheadTime: 0,
      isPlaying: false,
      selectedTool: 'tap',
    });
  },

  resetEditor: () => set({ ...initialState, notes: [] }),

  toBeatmap: () => {
    const { songTitle, audioFile, bpm, duration, notes } = get();
    return {
      songTitle,
      audioFile,
      bpm,
      duration,
      notes: notes
        .map(({ id, ...rest }) => rest)
        .sort((a, b) => a.timestamp - b.timestamp),
    };
  },
}));
