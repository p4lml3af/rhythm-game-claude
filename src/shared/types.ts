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

export type HitResult = 'perfect' | 'good' | 'miss';

export interface ActiveHoldNote {
  note: Note;                    // The hold note being tracked
  startResult: HitResult;        // How accurately the initial press was (perfect/good)
  isHeld: boolean;               // Is the key currently held down?
}
