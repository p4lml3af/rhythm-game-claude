# Phase 10 Execution Plan: Beatmap Validation & Error Handling

## Overview

**Goal**: Implement robust beatmap validation and error handling so that invalid beatmaps, missing files, and corrupted data produce clear user-facing error messages instead of silent failures or crashes.

**Current State**: A comprehensive `validateBeatmap()` function already exists in `src/shared/beatmapValidator.ts` with 26+ passing tests. However, it is **not wired into the loading pipeline**. The beatmap loader (`beatmapLoader.ts`) only checks for a notes array. Level discovery silently skips bad levels. There are no error boundaries, no error UI, and no user-facing error messages anywhere.

**Dependencies**: Phases 1-9 complete (verified by git history). The validator and all 10 levels are in place.

---

## Task Breakdown

### Task 1: Integrate `validateBeatmap()` into `beatmapLoader.ts`

**File**: `src/renderer/game/beatmapLoader.ts`

**What**:
- Import `validateBeatmap` from `../../shared/beatmapValidator`
- After parsing JSON, run `validateBeatmap(beatmap)` on the result
- If validation fails, throw a descriptive `BeatmapError` with the validation errors joined
- If validation passes with warnings, log warnings to console
- Keep the current fetch + JSON.parse flow but replace the basic `!beatmap.notes` check

**New type** (add to `src/shared/types.ts`):
```typescript
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
```

**Acceptance Criteria**:
- Loading a valid beatmap works as before
- Loading an invalid beatmap (missing fields, unsorted timestamps, overlaps) throws `BeatmapError` with specific errors
- Warnings are logged but don't prevent loading
- REQ-12 acceptance criterion 6 satisfied: "strict validation on beatmap files, rejecting invalid files with clear error messages"

---

### Task 2: Enhance level discovery with validation in main process

**File**: `src/main/index.js`

**What**:
- Import `validateBeatmap` (need CommonJS require since main process is JS)
- During `levels:list` IPC handler, validate each beatmap after parsing
- Add an `error` field to the level info returned to renderer when validation fails
- Still include the level in the list (so users can see it exists) but mark it as invalid
- Return validation errors so the UI can display them

**Updated LevelInfo type** (add to `src/shared/types.ts`):
```typescript
export interface LevelInfo {
  id: string;
  songTitle: string;
  bpm: number;
  duration: number;
  noteCount: number;
  error?: string;        // Set when beatmap is invalid or audio missing
  warnings?: string[];   // Non-blocking warnings
}
```

**Cases to handle**:
1. Beatmap file missing → `error: "Missing beatmap.json"`
2. Audio file missing → `error: "Missing audio.mp3"`
3. Invalid JSON syntax → `error: "Invalid JSON: <parse error>"`
4. Beatmap validation fails → `error: "Invalid beatmap: <first error>"` (include full errors list)
5. Valid beatmap → no error field

**Acceptance Criteria**:
- Valid levels load normally with no error field
- Levels with missing audio show in list with error message
- Levels with invalid beatmaps show in list with specific validation error
- Levels with malformed JSON show in list with parse error

---

### Task 3: Display error states in LevelSelect UI

**File**: `src/renderer/components/LevelSelect.tsx`

**What**:
- Levels with an `error` field render with a red error indicator and the error message
- Error levels are not clickable (disable play/practice)
- Error message shown as a subtitle below the level name in smaller red text
- Keyboard navigation skips error levels (or shows them but Enter does nothing)

**Visual Design** (minimal, consistent with existing dark theme):
- Error level row: slightly dimmed, red text for error message
- Error icon: red `!` prefix or similar minimal indicator
- No fancy styling — just clear communication

**Acceptance Criteria**:
- Error levels are visible but clearly marked as broken
- Clicking an error level does nothing (no navigation to game screen)
- Error message text is readable and specific (not generic "error")
- Non-error levels work exactly as before

---

### Task 4: Add error state to GameCanvas for load failures

**File**: `src/renderer/components/GameCanvas.tsx`

**What**:
- Add `loadError` state to GameCanvas
- When `loadBeatmap()` or `audioManager.loadAudio()` fails, set `loadError` with the error message
- Render an error screen instead of the canvas when `loadError` is set
- Error screen shows: error message + "Back to Level Select" button
- Distinguish error types:
  - `BeatmapError` → show validation errors
  - Network/fetch error → "Failed to load beatmap file"
  - Audio load error → "Failed to load audio file"

**New prop**: `onError?: (message: string) => void` — callback to App.tsx so it can navigate back

**Acceptance Criteria**:
- Loading a level with a bad beatmap shows an error message, not a blank canvas
- Loading a level with missing audio shows an error message
- User can navigate back to level select from the error screen
- No console-only errors — all failures visible to user

---

### Task 5: Add React Error Boundary component

**New File**: `src/renderer/components/ErrorBoundary.tsx`

**What**:
- Class component implementing `componentDidCatch` and `getDerivedStateFromError`
- Catches unhandled render errors in child components
- Displays a full-screen error message with:
  - "Something went wrong" heading
  - Error message text
  - "Return to Menu" button that resets state and navigates to main menu
- Styled consistently with the dark theme (black bg, grey/red text)

**Integration in `App.tsx`**:
- Wrap the `renderScreen()` output with `<ErrorBoundary>`
- Pass a `onReset` prop that sets screen back to 'menu'

**Acceptance Criteria**:
- A rendering crash in any component shows the error boundary UI instead of a white screen
- User can recover by clicking "Return to Menu"
- Error details visible for debugging

---

### Task 6: Add IPC handler for validating a single beatmap

**Files**: `src/main/index.js`, `src/preload/index.js`, `src/shared/electron.d.ts`

**What**:
- New IPC channel `beatmap:validate` that takes a level ID
- Reads the beatmap.json from the level folder
- Runs `validateBeatmap()` and returns the full `ValidationResult`
- Expose via preload as `window.electronAPI.validateBeatmap(levelId)`
- This enables future editor integration and on-demand validation

**Acceptance Criteria**:
- `window.electronAPI.validateBeatmap('level-01-first-steps')` returns a valid ValidationResult
- Invalid level IDs return an error result
- Missing files return appropriate error

---

### Task 7: Improve file I/O error handling for scores and settings

**File**: `src/main/index.js`

**What**:
- `scores:load` — if JSON parse fails, log a warning and return `{}` (already does this, but add specific corruption detection)
- `scores:save` — wrap in try/catch, return success/failure to renderer
- `settings:load` — if JSON parse fails, log warning with "Settings file corrupted. Restored defaults." and return null (already does this)
- `settings:save` — wrap in try/catch, return success/failure to renderer
- Atomic writes already use tmp+rename pattern (good) — add error handling for rename failures (disk full, permissions)

**Acceptance Criteria**:
- Corrupted scores.json → app starts with empty scores, warning logged
- Corrupted settings.json → app starts with defaults, warning logged
- Disk full during save → error returned to renderer (not silently lost)
- Write permission denied → error returned to renderer

---

### Task 8: Write unit tests for error handling paths

**New File**: `src/renderer/game/__tests__/beatmapLoader.test.ts`

**Tests**:
1. Valid beatmap loads successfully
2. Invalid JSON throws error
3. Missing notes array throws BeatmapError
4. Unsorted timestamps throws BeatmapError with specific message
5. Hold note without duration throws BeatmapError
6. Missing required fields throws BeatmapError
7. Valid beatmap with warnings logs warnings but loads successfully

**New File**: `src/renderer/components/__tests__/ErrorBoundary.test.tsx`

**Tests**:
1. Renders children when no error
2. Catches render error and shows error UI
3. Reset button restores normal state
4. Error message displayed in UI

**New File**: `src/main/__tests__/levelDiscovery.test.js`

**Tests**:
1. Valid level returns LevelInfo with no error
2. Missing beatmap.json returns LevelInfo with error
3. Missing audio.mp3 returns LevelInfo with error
4. Invalid JSON returns LevelInfo with parse error
5. Invalid beatmap (validation failure) returns LevelInfo with validation error
6. Levels sorted by ID

**Acceptance Criteria**:
- All error paths tested
- Tests pass with `npm test`
- Coverage > 70% for beatmapLoader.ts and error boundary

---

### Task 9: Update TypeScript types and electron API declarations

**Files**: `src/shared/types.ts`, `src/shared/electron.d.ts`

**What**:
- Add `BeatmapError` class to types.ts
- Add `error` and `warnings` fields to `LevelInfo`
- Add `validateBeatmap` to `ElectronAPI` interface in electron.d.ts
- Update `saveScores` and `saveSettings` return types to `Promise<{ success: boolean; error?: string }>`

**Acceptance Criteria**:
- No TypeScript errors after changes
- All new IPC channels have type declarations
- Existing code doesn't break

---

## Files Summary

### Files to Create
| File | Purpose |
|------|---------|
| `src/renderer/components/ErrorBoundary.tsx` | React error boundary |
| `src/renderer/game/__tests__/beatmapLoader.test.ts` | Loader error tests |
| `src/renderer/components/__tests__/ErrorBoundary.test.tsx` | Error boundary tests |
| `src/main/__tests__/levelDiscovery.test.js` | Level discovery tests |

### Files to Modify
| File | Changes |
|------|---------|
| `src/shared/types.ts` | Add BeatmapError class, update LevelInfo |
| `src/shared/electron.d.ts` | Add validateBeatmap to API, update return types |
| `src/renderer/game/beatmapLoader.ts` | Integrate validateBeatmap, throw BeatmapError |
| `src/renderer/components/GameCanvas.tsx` | Add loadError state, error UI |
| `src/renderer/components/LevelSelect.tsx` | Show error levels with messages |
| `src/renderer/App.tsx` | Wrap with ErrorBoundary |
| `src/main/index.js` | Validate during discovery, add IPC handler, improve file I/O |
| `src/preload/index.js` | Expose validateBeatmap IPC |

---

## Execution Order

```
Task 9 (Types) ← Foundation for everything else
    ↓
Task 1 (beatmapLoader) + Task 2 (level discovery) ← Can run in parallel
    ↓
Task 5 (ErrorBoundary) + Task 6 (validate IPC) ← Can run in parallel
    ↓
Task 3 (LevelSelect UI) + Task 4 (GameCanvas error) ← Depend on Tasks 1-2
    ↓
Task 7 (File I/O) ← Independent, can slot in anywhere
    ↓
Task 8 (Tests) ← After all implementation complete
```

---

## Requirements Satisfied

| Requirement | Criteria Addressed |
|-------------|-------------------|
| **REQ-12** (Beatmap Format) | Criterion 6: strict validation with clear error messages |
| **REQ-13** (File Organization) | Criterion 4: scan /songs/ and load all **valid** levels |
| **REQ-14** (Local File Storage) | Criteria 1-3: robust save/load with corruption recovery |
| **Design §6** (Error Handling) | All user error and system error categories from the table |

---

## Verification Checklist

After implementation, verify:
- [ ] Load valid level → plays normally (no regression)
- [ ] Load level with missing audio → error shown in level list
- [ ] Load level with invalid beatmap → specific validation error in level list
- [ ] Load level with malformed JSON → parse error in level list
- [ ] Click error level → nothing happens (disabled)
- [ ] GameCanvas load failure → error screen with back button
- [ ] Corrupt settings.json → defaults restored, app runs
- [ ] Corrupt scores.json → empty scores, app runs
- [ ] React render crash → error boundary catches it, "Return to Menu" works
- [ ] All new tests pass: `npm test`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] All 10 existing levels still load and play correctly
