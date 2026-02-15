# Phase 2 Execution Plan: Core Game Engine - Tap Notes Only

## Overview

**Phase Goal**: Build the foundational game loop with tap notes, Canvas rendering, and basic timing detection.

**Estimated Complexity**: Medium - Core timing logic is critical.

**Deliverable**: Playable game with tap notes, scrolling, and hit detection.

---

## Prerequisites: Verify Phase 1 Complete

Before starting Phase 2, verify the following from Phase 1:

- [ ] Electron window opens successfully with `npm run dev`
- [ ] React app renders with hot module replacement working
- [ ] Project folder structure exists:
  ```
  /src
    /main          # Electron main process
    /renderer      # React app
    /shared        # Shared types/utils
  /songs           # Level data
  /public          # Static assets
  ```
- [ ] Vite + electron-vite configured and running
- [ ] Basic "Hello World" React component displays

**If any prerequisite fails, complete Phase 1 first before proceeding.**

---

## Requirements Addressed

This phase satisfies portions of the following requirements:

- **REQ-1**: Core Gameplay - Two-Lane Note Scrolling (partial)
  - Acceptance Criteria 1, 2, 3, 5 (lanes, hit zones, scrolling, 60fps)
- **REQ-2**: Note Types - Tap and Hold (tap notes only in this phase)
  - Acceptance Criteria 1, 5 (tap notes, ignore key repeats)
- **REQ-3**: Timing Detection - Three-Tier Precision (partial)
  - Acceptance Criteria 1, 2, 4 (hit classification, Web Audio sync)
- **REQ-4**: Real-Time Feedback - Minimal Display (partial)
  - Acceptance Criteria 1, 5 (live accuracy percentage)

**Note**: Hold notes (REQ-2) and full timing validation (REQ-3) will be completed in later phases.

---

## Task Breakdown

### Task 1: Create Test Assets

**Objective**: Prepare a simple test beatmap and audio file for development.

**Files to Create**:

1. **`/songs/test-level-01/audio.mp3`**
   - Find a simple 30-60 second instrumental MP3 (royalty-free)
   - Or use a metronome/click track MP3
   - Place in `/songs/test-level-01/` folder

2. **`/songs/test-level-01/beatmap.json`**
   ```json
   {
     "songTitle": "Test Level 01",
     "audioFile": "audio.mp3",
     "bpm": 120,
     "duration": 30,
     "notes": [
       { "timestamp": 2.0, "lane": "left", "type": "tap" },
       { "timestamp": 4.0, "lane": "right", "type": "tap" },
       { "timestamp": 6.0, "lane": "left", "type": "tap" },
       { "timestamp": 8.0, "lane": "right", "type": "tap" },
       { "timestamp": 10.0, "lane": "left", "type": "tap" },
       { "timestamp": 12.0, "lane": "right", "type": "tap" },
       { "timestamp": 14.0, "lane": "left", "type": "tap" },
       { "timestamp": 16.0, "lane": "right", "type": "tap" },
       { "timestamp": 18.0, "lane": "left", "type": "tap" },
       { "timestamp": 20.0, "lane": "right", "type": "tap" }
     ]
   }
   ```
   - 10 tap notes, evenly spaced every 2 seconds
   - Alternating lanes for simple left-right pattern

**Acceptance Criteria**:
- [ ] Test beatmap JSON is valid and follows format from REQ-12
- [ ] Audio file loads successfully in browser
- [ ] Timestamps are sorted in ascending order

---

### Task 2: Define Shared Types

**Objective**: Create TypeScript interfaces for beatmap data structures.

**File to Create**: `/src/shared/types.ts`

```typescript
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
}

export type HitResult = 'perfect' | 'good' | 'miss';
```

**Acceptance Criteria**:
- [ ] Types match beatmap JSON structure from REQ-12
- [ ] TypeScript compiles with no errors
- [ ] Types support both tap and hold notes (even though holds not implemented yet)

---

### Task 3: Create GameCanvas Component

**Objective**: Set up React component with Canvas element and ref access.

**File to Create**: `/src/renderer/components/GameCanvas.tsx`

```typescript
import React, { useRef, useEffect } from 'react';

interface GameCanvasProps {
  width?: number;
  height?: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  width = 800,
  height = 600
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Game loop will be initialized here in next task
    console.log('Canvas ready:', canvas.width, 'x', canvas.height);

    return () => {
      // Cleanup will go here
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        display: 'block',
        backgroundColor: '#000000',
        margin: '0 auto'
      }}
    />
  );
};
```

**File to Modify**: `/src/renderer/App.tsx`

Replace "Hello World" with GameCanvas component:

```typescript
import { GameCanvas } from './components/GameCanvas';

function App() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#000000'
    }}>
      <GameCanvas width={800} height={600} />
    </div>
  );
}

export default App;
```

**Acceptance Criteria**:
- [ ] Canvas renders at 800x600 resolution
- [ ] Black background displays (REQ-1: no decorative elements)
- [ ] Canvas element accessible via useRef
- [ ] Component renders without errors in Electron window

---

### Task 4: Implement Game Loop (60fps)

**Objective**: Create requestAnimationFrame loop for 60fps rendering.

**File to Modify**: `/src/renderer/components/GameCanvas.tsx`

Add game loop inside useEffect:

```typescript
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let animationFrameId: number;
  let lastFrameTime = 0;
  const targetFPS = 60;
  const frameInterval = 1000 / targetFPS;

  const gameLoop = (timestamp: number) => {
    // Throttle to 60fps
    const deltaTime = timestamp - lastFrameTime;

    if (deltaTime >= frameInterval) {
      lastFrameTime = timestamp - (deltaTime % frameInterval);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Game logic will go here
      // - Update note positions
      // - Check for hits
      // - Render everything

      // Temporary: Draw test rectangle to verify loop running
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(10, 10, 50, 50);
    }

    animationFrameId = requestAnimationFrame(gameLoop);
  };

  animationFrameId = requestAnimationFrame(gameLoop);

  return () => {
    cancelAnimationFrame(animationFrameId);
  };
}, []);
```

**Acceptance Criteria**:
- [ ] Game loop runs at 60fps (REQ-1, AC5)
- [ ] requestAnimationFrame used (not setInterval)
- [ ] Canvas clears each frame
- [ ] Test rectangle renders to verify loop working
- [ ] Cleanup cancels animation frame on unmount

**Testing**: Open browser DevTools, check FPS in Performance monitor should be ~60fps.

---

### Task 5: Render Lanes and Hit Zones

**Objective**: Draw two vertical lanes and white hit zones at 1/4 from bottom.

**File to Create**: `/src/renderer/game/rendering.ts`

```typescript
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const LANE_WIDTH = 100;
export const HIT_ZONE_HEIGHT = 10;
export const HIT_ZONE_Y = CANVAS_HEIGHT * 0.75; // 1/4 from bottom

export function drawLanes(ctx: CanvasRenderingContext2D): void {
  const leftLaneX = CANVAS_WIDTH / 2 - LANE_WIDTH - 50;
  const rightLaneX = CANVAS_WIDTH / 2 + 50;

  // Draw left lane border
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 2;
  ctx.strokeRect(leftLaneX, 0, LANE_WIDTH, CANVAS_HEIGHT);

  // Draw right lane border
  ctx.strokeRect(rightLaneX, 0, LANE_WIDTH, CANVAS_HEIGHT);
}

export function drawHitZones(ctx: CanvasRenderingContext2D): void {
  const leftLaneX = CANVAS_WIDTH / 2 - LANE_WIDTH - 50;
  const rightLaneX = CANVAS_WIDTH / 2 + 50;

  // Draw left hit zone
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(leftLaneX, HIT_ZONE_Y, LANE_WIDTH, HIT_ZONE_HEIGHT);

  // Draw right hit zone
  ctx.fillRect(rightLaneX, HIT_ZONE_Y, LANE_WIDTH, HIT_ZONE_HEIGHT);
}
```

**File to Modify**: `/src/renderer/components/GameCanvas.tsx`

Import and call rendering functions in game loop:

```typescript
import { drawLanes, drawHitZones } from '../game/rendering';

// Inside gameLoop, after clearRect:
drawLanes(ctx);
drawHitZones(ctx);
```

**Acceptance Criteria**:
- [ ] Two vertical lanes visible (REQ-1, AC1)
- [ ] Hit zones positioned at 1/4 from bottom (REQ-1, AC2)
- [ ] Hit zones are white (REQ-1, AC2)
- [ ] No decorative elements beyond lanes and hit zones (REQ-1, AC4)

---

### Task 6: Load Beatmap and Audio

**Objective**: Load test beatmap JSON and MP3 using Web Audio API.

**File to Create**: `/src/renderer/game/audioManager.ts`

```typescript
export class AudioManager {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private startTime: number = 0;

  async loadAudio(audioPath: string): Promise<void> {
    this.audioContext = new AudioContext();

    const response = await fetch(audioPath);
    const arrayBuffer = await response.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
  }

  play(): void {
    if (!this.audioContext || !this.audioBuffer) {
      console.error('Audio not loaded');
      return;
    }

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.audioContext.destination);
    this.sourceNode.start(0);
    this.startTime = this.audioContext.currentTime;
  }

  getCurrentTime(): number {
    if (!this.audioContext) return 0;
    return this.audioContext.currentTime - this.startTime;
  }

  stop(): void {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode = null;
    }
  }
}
```

**File to Create**: `/src/renderer/game/beatmapLoader.ts`

```typescript
import type { Beatmap } from '../../shared/types';

export async function loadBeatmap(beatmapPath: string): Promise<Beatmap> {
  const response = await fetch(beatmapPath);
  const beatmap: Beatmap = await response.json();

  // Basic validation
  if (!beatmap.notes || !Array.isArray(beatmap.notes)) {
    throw new Error('Invalid beatmap: missing notes array');
  }

  return beatmap;
}
```

**File to Modify**: `/src/renderer/components/GameCanvas.tsx`

Load beatmap and audio on component mount:

```typescript
import { AudioManager } from '../game/audioManager';
import { loadBeatmap } from '../game/beatmapLoader';
import type { Beatmap } from '../../shared/types';

// Add state
const [beatmap, setBeatmap] = useState<Beatmap | null>(null);
const [audioManager] = useState(() => new AudioManager());

// Load on mount (separate useEffect before game loop)
useEffect(() => {
  const loadAssets = async () => {
    try {
      const loadedBeatmap = await loadBeatmap('/songs/test-level-01/beatmap.json');
      await audioManager.loadAudio('/songs/test-level-01/audio.mp3');
      setBeatmap(loadedBeatmap);
      console.log('Beatmap and audio loaded:', loadedBeatmap);
    } catch (error) {
      console.error('Failed to load assets:', error);
    }
  };

  loadAssets();
}, []);
```

**Acceptance Criteria**:
- [ ] Beatmap JSON loads successfully
- [ ] Audio MP3 loads into Web Audio API buffer (REQ-3, AC4)
- [ ] Console logs confirm successful loading
- [ ] No errors in browser console

---

### Task 7: Implement Note Scrolling

**Objective**: Calculate note positions and render scrolling notes.

**File to Create**: `/src/renderer/game/noteRenderer.ts`

```typescript
import type { Note } from '../../shared/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, LANE_WIDTH, HIT_ZONE_Y } from './rendering';

const NOTE_HEIGHT = 20;
const NOTE_SCROLL_SPEED = 200; // pixels per second
const SCROLL_DISTANCE = CANVAS_HEIGHT - HIT_ZONE_Y; // Distance from top to hit zone

export function calculateNoteY(noteTimestamp: number, currentTime: number): number {
  const timeUntilHit = noteTimestamp - currentTime;
  const distanceFromHitZone = timeUntilHit * NOTE_SCROLL_SPEED;
  return HIT_ZONE_Y - distanceFromHitZone;
}

export function drawNote(
  ctx: CanvasRenderingContext2D,
  note: Note,
  y: number
): void {
  const laneX = note.lane === 'left'
    ? CANVAS_WIDTH / 2 - LANE_WIDTH - 50
    : CANVAS_WIDTH / 2 + 50;

  // Tap note color (blue)
  ctx.fillStyle = '#0000FF';

  // Draw rectangle for tap note
  ctx.fillRect(
    laneX + LANE_WIDTH / 2 - 25, // Center in lane
    y,
    50, // Note width
    NOTE_HEIGHT
  );
}

export function isNoteOnScreen(y: number): boolean {
  return y >= -NOTE_HEIGHT && y <= CANVAS_HEIGHT;
}

export function isNoteInHitZone(y: number): boolean {
  const tolerance = 50; // Pixels of tolerance
  return Math.abs(y - HIT_ZONE_Y) <= tolerance;
}
```

**File to Modify**: `/src/renderer/components/GameCanvas.tsx`

Add note rendering in game loop:

```typescript
import { calculateNoteY, drawNote, isNoteOnScreen } from '../game/noteRenderer';

// Inside gameLoop, after drawing lanes and hit zones:
if (beatmap && audioManager) {
  const currentTime = audioManager.getCurrentTime();

  beatmap.notes.forEach((note) => {
    const y = calculateNoteY(note.timestamp, currentTime);

    if (isNoteOnScreen(y)) {
      drawNote(ctx, note, y);
    }
  });
}
```

**Acceptance Criteria**:
- [ ] Notes scroll downward at constant speed (REQ-1, AC3)
- [ ] Note Y position calculated from audioContext.currentTime (REQ-3, AC4)
- [ ] Notes disappear after passing hit zone (off-screen culling)
- [ ] Blue tap notes visible and distinct

**Testing**: Start audio playback manually (`audioManager.play()` in console) and verify notes scroll.

---

### Task 8: Implement Keyboard Input Handling

**Objective**: Capture D and K keypresses, ignore key repeats.

**File to Create**: `/src/renderer/game/inputHandler.ts`

```typescript
export type KeyCallback = (lane: 'left' | 'right') => void;

export class InputHandler {
  private keysPressed = new Set<string>();
  private leftKey: string = 'KeyD';
  private rightKey: string = 'KeyK';
  private onKeyPress: KeyCallback | null = null;

  constructor(onKeyPress: KeyCallback) {
    this.onKeyPress = onKeyPress;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Ignore key repeats (REQ-2, AC5)
    if (this.keysPressed.has(event.code)) {
      return;
    }

    this.keysPressed.add(event.code);

    if (event.code === this.leftKey && this.onKeyPress) {
      this.onKeyPress('left');
    } else if (event.code === this.rightKey && this.onKeyPress) {
      this.onKeyPress('right');
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.keysPressed.delete(event.code);
  }

  start(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  stop(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.keysPressed.clear();
  }
}
```

**File to Modify**: `/src/renderer/components/GameCanvas.tsx`

Initialize input handler:

```typescript
import { InputHandler } from '../game/inputHandler';

// Add inside component
const inputHandlerRef = useRef<InputHandler | null>(null);

useEffect(() => {
  const handleKeyPress = (lane: 'left' | 'right') => {
    console.log('Key pressed:', lane);
    // Hit detection will go here in next task
  };

  inputHandlerRef.current = new InputHandler(handleKeyPress);
  inputHandlerRef.current.start();

  return () => {
    inputHandlerRef.current?.stop();
  };
}, []);
```

**Acceptance Criteria**:
- [ ] D key detected for left lane (REQ-2, AC1)
- [ ] K key detected for right lane (REQ-2, AC1)
- [ ] Key repeats ignored (REQ-2, AC5)
- [ ] Simultaneous keypresses supported (REQ-3, AC3)

**Testing**: Press D and K keys, verify console logs show correct lane.

---

### Task 9: Implement Hit Detection

**Objective**: Detect when keypresses occur in timing windows and classify accuracy.

**File to Create**: `/src/renderer/game/hitDetection.ts`

```typescript
import type { Note, HitResult } from '../../shared/types';

const PERFECT_WINDOW = 0.05;  // ±50ms = 0.05 seconds
const GOOD_WINDOW = 0.1;       // ±100ms = 0.1 seconds

export function checkHit(
  note: Note,
  currentTime: number
): HitResult {
  const timeDifference = Math.abs(currentTime - note.timestamp);

  if (timeDifference <= PERFECT_WINDOW) {
    return 'perfect';
  } else if (timeDifference <= GOOD_WINDOW) {
    return 'good';
  } else {
    return 'miss';
  }
}

export function findNoteInHitZone(
  notes: Note[],
  lane: 'left' | 'right',
  currentTime: number
): Note | null {
  return notes.find((note) => {
    return (
      note.lane === lane &&
      Math.abs(currentTime - note.timestamp) <= GOOD_WINDOW
    );
  }) || null;
}
```

**File to Modify**: `/src/renderer/components/GameCanvas.tsx`

Add hit detection to input handler:

```typescript
import { checkHit, findNoteInHitZone } from '../game/hitDetection';
import type { GameState, HitResult } from '../../shared/types';

// Add game state
const [gameState, setGameState] = useState<GameState>({
  notes: [],
  currentTime: 0,
  accuracy: 100,
  hits: 0,
  misses: 0,
  perfectHits: 0,
  goodHits: 0,
  combo: 0,
  maxCombo: 0
});

// Update handleKeyPress
const handleKeyPress = (lane: 'left' | 'right') => {
  if (!beatmap || !audioManager) return;

  const currentTime = audioManager.getCurrentTime();
  const activeNotes = beatmap.notes.filter(n => !gameState.notes.includes(n));
  const note = findNoteInHitZone(activeNotes, lane, currentTime);

  if (note) {
    const result = checkHit(note, currentTime);
    console.log(`Hit: ${result} (${lane} lane)`);

    setGameState((prev) => {
      const newState = { ...prev };
      newState.notes.push(note); // Mark as processed

      if (result === 'perfect') {
        newState.perfectHits++;
        newState.hits++;
        newState.combo++;
      } else if (result === 'good') {
        newState.goodHits++;
        newState.hits++;
        newState.combo++;
      } else {
        newState.misses++;
        newState.combo = 0;
      }

      newState.maxCombo = Math.max(newState.maxCombo, newState.combo);

      // Calculate accuracy (REQ-4, AC5)
      const totalNotes = newState.hits + newState.misses;
      newState.accuracy = totalNotes > 0
        ? (newState.hits / totalNotes) * 100
        : 100;

      return newState;
    });
  }
};
```

**Acceptance Criteria**:
- [ ] Perfect hits detected within ±50ms (REQ-3, AC1)
- [ ] Good hits detected within ±100ms (REQ-3, AC1)
- [ ] Misses detected outside ±100ms (REQ-3, AC1)
- [ ] Only keypresses in hit zone register (REQ-3, AC2)
- [ ] Console logs show hit classification

---

### Task 10: Display Live Accuracy Percentage

**Objective**: Show accuracy percentage at bottom center during gameplay.

**File to Modify**: `/src/renderer/game/rendering.ts`

Add function:

```typescript
export function drawAccuracy(
  ctx: CanvasRenderingContext2D,
  accuracy: number
): void {
  ctx.fillStyle = '#CCCCCC';
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `${accuracy.toFixed(1)}%`,
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT - 30
  );
}
```

**File to Modify**: `/src/renderer/components/GameCanvas.tsx`

Call in game loop:

```typescript
import { drawAccuracy } from '../game/rendering';

// Inside gameLoop, at the end after drawing notes:
drawAccuracy(ctx, gameState.accuracy);
```

**Acceptance Criteria**:
- [ ] Accuracy percentage displays at bottom center (REQ-4, AC1)
- [ ] Updates immediately after each note (REQ-4, AC5)
- [ ] No other stats displayed during gameplay (REQ-4, AC2)
- [ ] Text readable with sufficient contrast

---

### Task 11: Add Play/Pause Controls (Temporary)

**Objective**: Add simple button to start audio playback for testing.

**File to Modify**: `/src/renderer/components/GameCanvas.tsx`

Add button outside canvas:

```typescript
const [isPlaying, setIsPlaying] = useState(false);

const handlePlayPause = () => {
  if (!audioManager || !beatmap) return;

  if (isPlaying) {
    audioManager.stop();
    setIsPlaying(false);
  } else {
    audioManager.play();
    setIsPlaying(true);
  }
};

return (
  <div>
    <button
      onClick={handlePlayPause}
      style={{
        position: 'absolute',
        top: 20,
        left: 20,
        padding: '10px 20px',
        fontSize: '16px'
      }}
    >
      {isPlaying ? 'Stop' : 'Play'}
    </button>
    <canvas ref={canvasRef} width={width} height={height} />
  </div>
);
```

**Acceptance Criteria**:
- [ ] Button starts audio playback
- [ ] Notes scroll in sync with audio
- [ ] Can stop and restart playback

**Note**: This is temporary UI for testing. Will be replaced with proper menu system in Phase 7.

---

## Testing Plan

### Manual Testing Checklist

Test the complete gameplay flow:

1. **Asset Loading**
   - [ ] Beatmap JSON loads without errors
   - [ ] Audio MP3 loads without errors
   - [ ] Console logs confirm successful loading

2. **Rendering**
   - [ ] Two lanes visible on black background
   - [ ] White hit zones positioned at 1/4 from bottom
   - [ ] Blue tap notes render and scroll downward
   - [ ] Notes disappear after passing hit zone
   - [ ] Accuracy percentage displays at bottom center
   - [ ] 60fps performance (check DevTools Performance monitor)

3. **Audio Synchronization**
   - [ ] Press Play button → audio starts
   - [ ] Notes reach hit zone in sync with audio
   - [ ] No perceived lag or desynchronization
   - [ ] Visual and audio feel "fair" (subjective test)

4. **Input Handling**
   - [ ] D key detected for left lane
   - [ ] K key detected for right lane
   - [ ] Holding keys doesn't register multiple hits (repeats ignored)
   - [ ] Can press both keys simultaneously

5. **Hit Detection**
   - [ ] Pressing key when note in hit zone registers hit
   - [ ] Pressing key when no note present does nothing
   - [ ] Console logs show "perfect", "good", or "miss" classification
   - [ ] Accuracy percentage updates after each note

6. **Edge Cases**
   - [ ] Pressing wrong lane key doesn't hit note in other lane
   - [ ] Multiple rapid keypresses handled correctly
   - [ ] First and last notes hit correctly

### Unit Tests (Optional for Phase 2)

If time permits, create basic unit tests:

**File to Create**: `/src/renderer/game/__tests__/hitDetection.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { checkHit } from '../hitDetection';
import type { Note } from '../../../shared/types';

describe('Hit Detection', () => {
  const testNote: Note = {
    timestamp: 5.0,
    lane: 'left',
    type: 'tap'
  };

  it('should classify perfect hit within ±50ms', () => {
    expect(checkHit(testNote, 5.0)).toBe('perfect');
    expect(checkHit(testNote, 5.04)).toBe('perfect');
    expect(checkHit(testNote, 4.96)).toBe('perfect');
  });

  it('should classify good hit within ±100ms but outside ±50ms', () => {
    expect(checkHit(testNote, 5.06)).toBe('good');
    expect(checkHit(testNote, 4.94)).toBe('good');
  });

  it('should classify miss outside ±100ms', () => {
    expect(checkHit(testNote, 5.11)).toBe('miss');
    expect(checkHit(testNote, 4.89)).toBe('miss');
  });
});
```

**Note**: Full unit test suite will be created in Phase 3 (Timing Validation).

---

## Success Criteria

Phase 2 is complete when:

- [ ] All manual testing checklist items pass
- [ ] Can play through entire test level (10 notes) without crashes
- [ ] Notes scroll in sync with audio (subjective validation)
- [ ] Accuracy percentage displays and updates correctly
- [ ] 60fps rendering maintained throughout gameplay
- [ ] No errors in browser console during normal gameplay
- [ ] Hit detection feels "fair" - no obvious timing issues

**Critical**: If timing feels unfair or notes are visibly out of sync with audio, **DO NOT proceed to Phase 3**. Debug synchronization issues first using:
- Console logs of `audioContext.currentTime` vs. note timestamps
- Adjust `NOTE_SCROLL_SPEED` constant if needed
- Verify Web Audio API playback is not buffering

---

## Dependencies for Next Phase

Phase 3 (Timing Validation & Testing) requires:

1. Working hit detection logic to test
2. Accuracy calculation formula to validate
3. Web Audio API currentTime for timing measurements
4. Beatmap loading logic for test scenarios

Ensure all Phase 2 code is functional before starting automated timing tests.

---

## Implementation Notes

### Code Organization

Keep code modular for testing:
- `rendering.ts`: Pure functions for drawing (no state)
- `hitDetection.ts`: Pure functions for timing logic (no side effects)
- `audioManager.ts`: Class encapsulating Web Audio API
- `GameCanvas.tsx`: React component orchestrating everything

### Performance Considerations

- Use `requestAnimationFrame` for game loop (not setInterval)
- Filter notes to only render visible ones (off-screen culling)
- Use `ctx.clearRect()` instead of clearing entire canvas
- Avoid creating new objects in game loop (reuse objects)

### Debugging Tips

If notes don't sync with audio:
1. Log `audioContext.currentTime` each frame
2. Log calculated note Y position for first note
3. Verify `NOTE_SCROLL_SPEED` constant matches expected visual speed
4. Check audio file duration matches beatmap.json duration
5. Ensure beatmap timestamps are in seconds (not milliseconds)

### Common Pitfalls to Avoid

- ❌ Don't use `Date.now()` for timing (use Web Audio API currentTime)
- ❌ Don't round note positions (causes jitter)
- ❌ Don't forget to cancel animationFrame on unmount (memory leak)
- ❌ Don't mutate state directly (use React setState)
- ❌ Don't re-create AudioContext on each render (create once)

---

## Estimated Time

- Task 1 (Test Assets): 15 minutes
- Task 2 (Types): 15 minutes
- Task 3 (GameCanvas): 20 minutes
- Task 4 (Game Loop): 30 minutes
- Task 5 (Lanes/Hit Zones): 30 minutes
- Task 6 (Load Assets): 45 minutes
- Task 7 (Note Scrolling): 1 hour
- Task 8 (Input Handling): 45 minutes
- Task 9 (Hit Detection): 1 hour
- Task 10 (Accuracy Display): 15 minutes
- Task 11 (Play/Pause): 15 minutes
- Testing & Debugging: 1-2 hours

**Total Estimated Time**: 6-8 hours

---

## Next Steps After Phase 2

Once Phase 2 is complete and tested:

1. **Proceed to Phase 3**: Timing Validation & Testing
   - Create Vitest test suite
   - Write automated timing tests
   - Validate ±10ms synchronization target
   - Document timing test results

2. **Do NOT proceed if**:
   - Timing feels unfair during manual testing
   - 60fps performance not maintained
   - Notes visibly out of sync with audio
   - Hit detection produces unexpected results

Phase 3 is the **critical gate** - automated timing tests must pass before adding more features.
