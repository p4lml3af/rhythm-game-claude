export interface Note {
  timestamp: number;      // Seconds from song start
  lane: 'left' | 'right'; // Lane assignment
  type: 'tap' | 'hold';   // Note type
  duration?: number;      // Required for hold notes (seconds)
  id?: string;            // Optional unique ID for tracking
}

export interface Beatmap {
  songTitle: string;
  audioFile: string;
  bpm: number;
  duration: number;       // Total song duration in seconds
  notes: Note[];
}

export interface GameState {
  notes: Note[];
  currentTime: number;    // Audio playback time
  accuracy: number;       // Current accuracy percentage (0-100)
  hits: number;           // Total successful hits
  misses: number;         // Total misses
  perfectHits: number;    // Hits within ±50ms
  goodHits: number;       // Hits within ±100ms but outside ±50ms
  combo: number;          // Current combo streak
  maxCombo: number;       // Longest combo this session
  activeHoldNotes: ActiveHoldNote[];  // Hold notes currently being tracked
}

export interface GameResults {
  accuracy: number;
  maxCombo: number;
  perfectHits: number;
  goodHits: number;
  totalNotes: number;
  hits: number;
  misses: number;
}

export type HitResult = 'perfect' | 'good' | 'miss';

export interface ActiveHoldNote {
  note: Note;                    // The hold note being tracked
  startResult: HitResult;        // How accurately the initial press was (perfect/good)
  isHeld: boolean;               // Is the key currently held down?
}

export interface LevelInfo {
  id: string;          // Folder name (e.g., 'test-level-01')
  songTitle: string;   // From beatmap.json
  bpm: number;         // From beatmap.json
  duration: number;    // From beatmap.json
  noteCount: number;   // beatmap.notes.length
  error?: string;        // Set when beatmap is invalid or audio missing
  warnings?: string[];   // Non-blocking warnings
}

export class BeatmapError extends Error {
  constructor(
    message: string,
    public readonly errors: string[],
    public readonly warnings: string[]
  ) {
    super(message);
    this.name = 'BeatmapError';
  }
}

export interface Settings {
  colors: {
    tap: string;        // Hex color, default '#0000FF'
    hold: string;       // Hex color, default '#FF0000'
    background: string; // Hex color, default '#000000'
    text: string;       // Hex color, default '#CCCCCC'
  };
  keyBindings: {
    left: string;       // Key code string, default 'KeyD'
    right: string;      // Key code string, default 'KeyK'
  };
  volume: number;       // 0-100, default 100
}
