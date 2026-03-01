import { create } from 'zustand';
import type { RecordedKeypress, Beatmap } from '../../shared/types';

interface RecordingState {
  // Session state
  isRecording: boolean;
  audioSourcePath: string | null;
  songTitle: string;
  duration: number;
  bpm: number;
  keypresses: RecordedKeypress[];
  activeKeys: Map<string, { timestamp: number }>;

  // Actions
  startRecording: (audioPath: string, title: string, duration: number) => void;
  recordKeyDown: (lane: 'left' | 'right', audioTime: number) => void;
  recordKeyUp: (lane: 'left' | 'right', audioTime: number) => void;
  finishRecording: () => void;
  setBpm: (bpm: number) => void;
  setSongTitle: (title: string) => void;
  reset: () => void;
  toBeatmap: () => Beatmap;
}

const HOLD_THRESHOLD = 0.2; // 200ms

const initialState = {
  isRecording: false,
  audioSourcePath: null as string | null,
  songTitle: '',
  duration: 0,
  bpm: 120,
  keypresses: [] as RecordedKeypress[],
  activeKeys: new Map<string, { timestamp: number }>(),
};

export const useRecordingStore = create<RecordingState>((set, get) => ({
  ...initialState,

  startRecording: (audioPath, title, duration) => {
    set({
      isRecording: true,
      audioSourcePath: audioPath,
      songTitle: title,
      duration,
      keypresses: [],
      activeKeys: new Map(),
    });
  },

  recordKeyDown: (lane, audioTime) => {
    const { activeKeys } = get();

    // Ignore if this lane already has an active key (shouldn't happen with InputHandler filtering)
    if (activeKeys.has(lane)) return;

    const newActiveKeys = new Map(activeKeys);
    newActiveKeys.set(lane, { timestamp: audioTime });

    const keypress: RecordedKeypress = {
      timestamp: audioTime,
      lane,
      type: 'tap',
    };

    set((state) => ({
      keypresses: [...state.keypresses, keypress],
      activeKeys: newActiveKeys,
    }));
  },

  recordKeyUp: (lane, audioTime) => {
    const { activeKeys, keypresses } = get();
    const activeKey = activeKeys.get(lane);
    if (!activeKey) return;

    const duration = audioTime - activeKey.timestamp;
    const newActiveKeys = new Map(activeKeys);
    newActiveKeys.delete(lane);

    if (duration > HOLD_THRESHOLD) {
      // Convert the last keypress for this lane to a hold note
      const updatedKeypresses = [...keypresses];
      for (let i = updatedKeypresses.length - 1; i >= 0; i--) {
        if (
          updatedKeypresses[i].lane === lane &&
          updatedKeypresses[i].timestamp === activeKey.timestamp
        ) {
          updatedKeypresses[i] = {
            ...updatedKeypresses[i],
            type: 'hold',
            duration,
          };
          break;
        }
      }
      set({ keypresses: updatedKeypresses, activeKeys: newActiveKeys });
    } else {
      set({ activeKeys: newActiveKeys });
    }
  },

  finishRecording: () => {
    set((state) => ({
      isRecording: false,
      keypresses: [...state.keypresses].sort((a, b) => a.timestamp - b.timestamp),
      activeKeys: new Map(),
    }));
  },

  setBpm: (bpm) => set({ bpm }),

  setSongTitle: (title) => set({ songTitle: title }),

  reset: () => set({ ...initialState, activeKeys: new Map() }),

  toBeatmap: () => {
    const { songTitle, bpm, duration, keypresses } = get();
    return {
      songTitle,
      audioFile: 'audio.mp3',
      bpm,
      duration,
      notes: keypresses
        .map((kp) => ({
          timestamp: kp.timestamp,
          lane: kp.lane,
          type: kp.type,
          ...(kp.type === 'hold' && kp.duration ? { duration: kp.duration } : {}),
        }))
        .sort((a, b) => a.timestamp - b.timestamp),
    };
  },
}));
