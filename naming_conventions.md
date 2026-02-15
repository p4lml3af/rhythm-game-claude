# Naming Conventions

**Purpose**: Claude Code reads this before generating UI components, game logic, or tests. These conventions ensure consistency and support automated testing.

---

## UI Foundations

**Accessibility**: Basic keyboard navigation (arrow keys, Enter, Escape)
**Reference site**: None - pure minimal aesthetic (terminal/command-line simplicity)
**Component library**: Radix UI Primitives (unstyled, accessible primitives)
**Color scheme**: Black background (#000000), light grey text (#CCCCCC), fixed dark theme

---

## REQUIRED: Test IDs

All interactive elements MUST have `data-testid` attributes for E2E testing (when/if Playwright is added).

```tsx
// Buttons
<button data-testid="button-play">Play</button>
<button data-testid="button-settings">Settings</button>
<button data-testid="button-save">Save</button>

// Inputs
<input data-testid="input-key-left" />
<input data-testid="input-color-tap" />
<Slider data-testid="slider-volume" />

// Containers
<div data-testid="screen-level-select">...</div>
<div data-testid="screen-gameplay">...</div>
<div data-testid="modal-settings">...</div>

// Pattern: {element-type}-{purpose-or-name}
// Examples:
//   - button-{action}
//   - input-{field-name}
//   - slider-{setting-name}
//   - screen-{screen-name}
//   - modal-{modal-name}
```

**NOT**: ❌ No data-testid, generic IDs like "btn1", "input-field"

---

## REQUIRED: Modal Props

All modal/dialog components follow this standard:

```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;          // Called when modal closes (Escape, backdrop click)
  onSubmit?: () => void;         // Called when user confirms/saves
  children?: React.ReactNode;
}

// Example usage
<SettingsModal
  isOpen={isSettingsOpen}
  onClose={() => setIsSettingsOpen(false)}
  onSubmit={handleSaveSettings}
/>
```

**NOT**:
- ❌ `onCancel` - use `onClose`
- ❌ `handleClose` - use `onClose`
- ❌ `visible` - use `isOpen`

---

## REQUIRED: Error State

Error state follows this naming pattern:

```tsx
// Single error (string or null)
const [error, setError] = useState<string | null>(null);

// Field-specific errors (object)
const [fieldErrors, setFieldErrors] = useState<{
  keyLeft?: string;
  keyRight?: string;
  colorTap?: string;
}>({});

// Usage
{error && <div className="error-message">{error}</div>}
{fieldErrors.keyLeft && <span className="error-text">{fieldErrors.keyLeft}</span>}
```

**NOT**:
- ❌ `err`, `errorMsg`, `validationError` - use `error`
- ❌ `errors` (plural) for single error - use `error` (singular)
- ❌ `formErrors` - use `fieldErrors`

---

## REQUIRED: Timestamp Fields

Date/time fields use consistent naming:

```tsx
// Timestamps (Unix seconds or milliseconds)
beatmap.timestamp         // Absolute time in seconds (for notes)
audioContext.currentTime  // Web Audio API time in seconds

// ISO strings (if ever needed)
score.createdAt           // ISO 8601 string
level.lastPlayedAt        // ISO 8601 string

// NOT:
// ❌ beatmap.time
// ❌ beatmap.noteTime
// ❌ score.created
// ❌ level.lastPlayed
```

---

## Naming Patterns

| Category | Pattern | Example | NOT |
|----------|---------|---------|-----|
| **React Components** | PascalCase | `GameCanvas`, `LevelSelect`, `SettingsModal` | `gameCanvas`, `levelselect` |
| **React Hooks** | `use` prefix + camelCase | `useGameLoop`, `useAudioSync`, `useKeyPress` | `gameLoop`, `getAudioSync` |
| **Files (Components)** | PascalCase.tsx | `GameCanvas.tsx`, `SettingsModal.tsx` | `game-canvas.tsx`, `gameCanvas.tsx` |
| **Files (Utils)** | kebab-case.ts | `timing-utils.ts`, `beatmap-validator.ts` | `timingUtils.ts`, `timing_utils.ts` |
| **Files (Tests)** | {name}.test.ts(x) | `timing-utils.test.ts`, `GameCanvas.test.tsx` | `timing-utils.spec.ts` |
| **Variables** | camelCase | `notePosition`, `beatmapData`, `isPlaying` | `note_position`, `NotePosition` |
| **Functions** | camelCase (verb) | `calculateNotePosition`, `validateBeatmap`, `handleKeyDown` | `NotePosition`, `beatmap_valid` |
| **Constants** | UPPER_SNAKE_CASE | `PERFECT_WINDOW_MS`, `HIT_ZONE_Y_RATIO`, `DEFAULT_VOLUME` | `perfectWindowMs`, `HitZoneY` |
| **Types/Interfaces** | PascalCase | `Beatmap`, `Note`, `GameState`, `Settings` | `beatmap`, `INote`, `gameState` |
| **CSS Classes** | kebab-case | `.game-canvas`, `.level-list-item`, `.error-message` | `.gameCanvas`, `.level_list` |
| **Boolean vars** | `is/has/should` prefix | `isPlaying`, `hasError`, `shouldSaveScore` | `playing`, `error` (for boolean) |
| **Event Handlers** | `handle` prefix | `handleKeyDown`, `handleLevelSelect`, `handleSaveSettings` | `onKeyDown`, `keyDown`, `doSave` |

---

## Game-Specific Conventions

### Note Types
```tsx
// Type definitions
type NoteType = 'tap' | 'hold';  // NOT: "TAP", "HOLD", "Tap"
type Lane = 'left' | 'right';    // NOT: "LEFT", "L", 0, 1

// Beatmap structure
interface Note {
  timestamp: number;    // Seconds from song start (NOT: time, noteTime, ms)
  lane: Lane;           // 'left' or 'right' (NOT: laneId, track)
  type: NoteType;       // 'tap' or 'hold' (NOT: kind, noteType)
  duration?: number;    // Seconds (hold notes only) (NOT: length, holdTime)
}
```

### Hit Classification
```tsx
type HitResult = 'perfect' | 'good' | 'miss';  // NOT: "PERFECT", "Perfect", 0/1/2

// Function naming
function classifyHit(note: Note, pressTime: number): HitResult {
  // NOT: calculateHit, getHitType, evaluateNote
}
```

### Game State
```tsx
interface GameState {
  isPlaying: boolean;        // NOT: playing, gameActive
  isPaused: boolean;         // NOT: paused
  isPracticeMode: boolean;   // NOT: practiceMode, practice
  practiceSpeed: number;     // 0.5 to 1.0 (NOT: speed, playbackRate)
  currentTime: number;       // Seconds (NOT: time, position)
  accuracy: number;          // Percentage 0-100 (NOT: accuracyPercent, score)
}
```

### Settings Keys
```tsx
interface Settings {
  colors: {
    tap: string;           // Hex color (NOT: tapColor, tapNoteColor)
    hold: string;          // Hex color
    background: string;    // Hex color
    text: string;          // Hex color
  };
  keyBindings: {
    left: string;          // Key name (NOT: leftKey, keyLeft)
    right: string;         // Key name
  };
  volume: number;          // 0-100 (NOT: vol, masterVolume)
}
```

### File Paths (Code References)
```tsx
// Use forward slashes even on Windows (Node.js handles this)
const beatmapPath = 'songs/level-01/beatmap.json';  // ✅
const beatmapPath = 'songs\\level-01\\beatmap.json'; // ❌

// Use path.join for dynamic paths
import path from 'path';
const beatmapPath = path.join('songs', levelId, 'beatmap.json');  // ✅
```

---

## Toolset-Enforced (No Action Needed)

These conventions are automatically enforced by the chosen technology stack:

| Tool/Library | Convention | Example |
|--------------|------------|---------|
| **React** | Components = PascalCase | `function GameCanvas() {}` |
| **React** | Hooks = `use` prefix | `function useGameLoop() {}` |
| **JavaScript** | Variables = camelCase | `const notePosition = 0;` |
| **JavaScript** | Functions = camelCase | `function calculatePosition() {}` |
| **Vite** | ESM imports (not CommonJS) | `import { x } from 'y'` (NOT `require`) |
| **Canvas API** | 2D context methods | `ctx.fillRect()`, `ctx.fillStyle` |
| **Web Audio API** | camelCase properties | `audioContext.currentTime` |

---

## Example: Consistent Component

```tsx
// ✅ CORRECT
import React, { useState } from 'react';
import { Dialog } from '@radix-ui/react-dialog';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function SettingsModal({ isOpen, onClose, onSubmit }: SettingsModalProps) {
  const [volume, setVolume] = useState(100);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (volume < 0 || volume > 100) {
      setError('Volume must be between 0 and 100');
      return;
    }
    onSubmit();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div data-testid="modal-settings">
        <input
          data-testid="slider-volume"
          type="range"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
        />
        {error && <div className="error-message">{error}</div>}
        <button data-testid="button-save" onClick={handleSave}>Save</button>
      </div>
    </Dialog>
  );
}
```

```tsx
// ❌ INCORRECT
import React, { useState } from 'react';

function settings_modal(props) {  // ❌ Wrong casing, no types
  const [vol, setVol] = useState(100);  // ❌ Abbreviated name
  const [err, setErr] = useState(null);  // ❌ Abbreviated name

  function saveSettings() {  // ❌ No 'handle' prefix for handler
    if (vol < 0 || vol > 100) {
      setErr('Invalid volume');
      return;
    }
    props.onSave();  // ❌ Should be onSubmit
  }

  return (
    <div id="settings">  {/* ❌ No data-testid */}
      <input
        type="range"
        value={vol}
        onChange={(e) => setVol(e.target.value)}  {/* ❌ No data-testid */}
      />
      {err && <div>{err}</div>}  {/* ❌ No className */}
      <button onClick={saveSettings}>Save</button>  {/* ❌ No data-testid */}
    </div>
  );
}
```

---

## Enforcement

**During Development**:
- Claude Code will reference this file when generating code
- Code reviews should check convention compliance

**Before Commits** (Future):
- `/commit-phase` skill will check naming convention compliance
- Linters can be configured to enforce some patterns (ESLint, Prettier)

---

## Updates

This file should be updated when:
- New naming patterns emerge during development
- Team conventions change
- New tooling is added that enforces conventions

Last updated: 2026-02-14
