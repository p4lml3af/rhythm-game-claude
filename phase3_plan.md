# Phase 3: Timing Validation & Testing — Execution Plan

## Overview

**Goal**: Set up the testing infrastructure (Vitest) and write comprehensive tests that validate the core game engine built in Phase 2. This is the **critical gate** — timing synchronization must pass ±10ms before the project proceeds to Phase 4 (Hold Notes).

**Phase 2 Deliverables to Validate**:
- Hit detection timing windows (±50ms perfect, ±100ms good)
- Note Y-position calculation from audio time
- Audio-visual synchronization (±10ms target)
- Accuracy percentage calculation
- Simultaneous input handling
- Input handler key repeat prevention

**Requirements Satisfied**:
- REQ-3 (Timing Detection — three-tier precision) — AC1, AC2, AC3, AC4, AC5
- REQ-4 (Real-Time Feedback) — AC5 (accuracy updates after each note)
- REQ-16 (Timing Validation — automated testing) — AC1, AC2, AC3

**Correctness Properties Tested**:
- Property 1: Timing Window Consistency
- Property 2: Audio-Visual Synchronization
- Property 6: Accuracy Percentage Correctness
- Property 8: Input Simultaneity

---

## Pre-Phase Verification

Before starting, verify Phase 2 deliverables are functional:

1. Run `npm run dev` — Electron window opens with canvas rendering
2. Press Play — audio starts, notes scroll down in sync
3. Press D/K keys — hit detection fires, accuracy updates
4. Confirm no TypeScript or runtime errors in console

---

## Task Breakdown

### Task 1: Install Vitest and Configure Test Environment

**What**: Add Vitest as dev dependency and create configuration file.

**Files to create/modify**:
- `package.json` — add vitest, @vitest/coverage-v8, happy-dom as devDependencies; add `test` and `test:coverage` scripts
- `vitest.config.ts` — new file at project root
- `tsconfig.json` — new file at project root (needed for TypeScript test files)

**Details**:

Install:
```bash
npm install -D vitest @vitest/coverage-v8 happy-dom
```

`vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/renderer/game/**', 'src/shared/**'],
      thresholds: {
        // Phase 3 target: 70%+ coverage on timing-critical code
        'src/renderer/game/hitDetection.ts': { statements: 100, branches: 100 },
        'src/renderer/game/noteRenderer.ts': { statements: 80 },
      }
    }
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@game': resolve(__dirname, 'src/renderer/game'),
    }
  }
})
```

`package.json` scripts to add:
```json
"test": "vitest",
"test:run": "vitest run",
"test:coverage": "vitest run --coverage"
```

`tsconfig.json` — minimal config for TypeScript resolution in tests:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

**Acceptance criteria**: `npm run test:run` executes with zero errors (even if no test files exist yet).

---

### Task 2: Unit Tests for Hit Detection Timing Windows

**What**: Test `checkHit()` and `findNoteInHitZone()` from `hitDetection.ts` against all timing boundary conditions.

**File to create**: `src/renderer/game/__tests__/hitDetection.test.ts`

**Tests to write**:

#### Suite 1: `checkHit` — Timing Window Classification (Property 1)
| Test Case | Input (offset from timestamp) | Expected Result |
|-----------|-------------------------------|-----------------|
| Exact hit | 0ms | `perfect` |
| Early perfect | -49ms | `perfect` |
| Late perfect | +49ms | `perfect` |
| Perfect boundary (exact) | +50ms | `perfect` |
| Perfect boundary (exact negative) | -50ms | `perfect` |
| Early good | -51ms | `good` |
| Late good | +51ms | `good` |
| Good boundary (exact) | +100ms | `good` |
| Good boundary (exact negative) | -100ms | `good` |
| Early miss | -101ms | `miss` |
| Late miss | +101ms | `miss` |
| Far miss | +500ms | `miss` |
| Very far miss | -1000ms | `miss` |

Implementation approach:
```typescript
describe('checkHit', () => {
  const makeNote = (timestamp: number): Note => ({
    timestamp,
    lane: 'left',
    type: 'tap'
  });

  it('returns perfect for exact hit', () => {
    expect(checkHit(makeNote(5.0), 5.0)).toBe('perfect');
  });

  it('returns perfect at +50ms boundary', () => {
    expect(checkHit(makeNote(5.0), 5.05)).toBe('perfect');
  });

  it('returns good at +51ms (just outside perfect)', () => {
    expect(checkHit(makeNote(5.0), 5.051)).toBe('good');
  });

  // ... etc for all boundary cases
});
```

#### Suite 2: `findNoteInHitZone` — Note Discovery
| Test Case | Setup | Expected |
|-----------|-------|----------|
| Note in range, correct lane | left note at 5.0s, query left at 5.0s | Returns note |
| Note in range, wrong lane | left note at 5.0s, query right at 5.0s | Returns null |
| No notes | empty array | Returns null |
| Note out of range | left note at 5.0s, query at 6.0s | Returns null |
| Multiple notes, picks first match | notes at 5.0s and 5.05s | Returns first |
| Simultaneous notes, different lanes | left at 5.0, right at 5.0, query left | Returns left note only |

**Traces to**: REQ-3 AC1 (three-tier classification), REQ-3 AC2 (hit zone detection), Design Property 1

---

### Task 3: Unit Tests for Accuracy Calculation

**What**: Extract the accuracy calculation logic from GameCanvas into a pure function and test it.

**Files to modify**:
- `src/renderer/game/hitDetection.ts` — add `calculateAccuracy()` function
- `src/renderer/game/__tests__/hitDetection.test.ts` — add accuracy tests

**New function to add to `hitDetection.ts`**:
```typescript
export function calculateAccuracy(hits: number, misses: number): number {
  const totalNotes = hits + misses;
  if (totalNotes === 0) return 100;
  return (hits / totalNotes) * 100;
}
```

Then update `GameCanvas.tsx` to use this extracted function instead of inline calculation.

#### Suite 3: `calculateAccuracy` — Accuracy Percentage (Property 6)
| Test Case | Hits | Misses | Expected |
|-----------|------|--------|----------|
| Perfect score | 10 | 0 | 100.0 |
| All misses | 0 | 10 | 0.0 |
| 80% accuracy | 8 | 2 | 80.0 |
| Fractional (7/9) | 7 | 2 | 77.777... |
| Single hit | 1 | 0 | 100.0 |
| Single miss | 0 | 1 | 0.0 |
| No notes yet | 0 | 0 | 100.0 |
| Large numbers | 999 | 1 | 99.9 |

**Traces to**: REQ-4 AC5, REQ-5 AC1, Design Property 6

---

### Task 4: Unit Tests for Note Position Calculation

**What**: Test `calculateNoteY()` and helper functions from `noteRenderer.ts` to validate audio-visual synchronization math.

**File to create**: `src/renderer/game/__tests__/noteRenderer.test.ts`

**Constants referenced from code**:
- `HIT_ZONE_Y = 450` (CANVAS_HEIGHT * 0.75)
- `NOTE_SCROLL_SPEED = 200` px/s

#### Suite 4: `calculateNoteY` — Note Position from Audio Time
| Test Case | noteTimestamp | currentTime | Expected Y | Explanation |
|-----------|--------------|-------------|------------|-------------|
| Note at hit zone | 5.0s | 5.0s | 450 | timeUntilHit=0, at hit zone |
| Note 1s above hit zone | 5.0s | 4.0s | 250 | 1s away × 200px/s = 200px above 450 |
| Note 2s above hit zone | 5.0s | 3.0s | 50 | 2s × 200 = 400px above |
| Note past hit zone | 5.0s | 6.0s | 650 | -1s × 200 = 200px below |
| Note at very top | 5.0s | 2.75s | 0 | 2.25s × 200 = 450px above |
| Fractional timing | 5.5s | 5.0s | 350 | 0.5s × 200 = 100px above |

Formula verification: `Y = HIT_ZONE_Y - (noteTimestamp - currentTime) * NOTE_SCROLL_SPEED`
= `450 - (noteTimestamp - currentTime) * 200`

#### Suite 5: `isNoteOnScreen` — Viewport Culling
| Test Case | Y | Expected |
|-----------|---|----------|
| Top of screen | 0 | true |
| Bottom of screen | 600 | true |
| Just above screen | -21 | false |
| Just below screen | 601 | false |
| In hit zone | 450 | true |
| Partially visible top | -10 | true |

#### Suite 6: `isNoteInHitZone` — Visual Hit Zone Check
| Test Case | Y | Expected | Explanation |
|-----------|---|----------|-------------|
| Exact hit zone | 450 | true | At HIT_ZONE_Y |
| 50px above | 400 | true | Within tolerance |
| 50px below | 500 | true | Within tolerance |
| 51px above | 399 | false | Outside tolerance |
| 51px below | 501 | false | Outside tolerance |

**Traces to**: REQ-1 AC3 (consistent scroll speed), REQ-3 AC4 (audio-visual sync), Design Property 2

---

### Task 5: Unit Tests for Input Handler

**What**: Test the `InputHandler` class for key repeat prevention and lane mapping.

**File to create**: `src/renderer/game/__tests__/inputHandler.test.ts`

**Tests to write**:

#### Suite 7: InputHandler — Key Mapping and Repeat Prevention
| Test Case | Action | Expected |
|-----------|--------|----------|
| D key fires left lane | keydown 'KeyD' | callback('left') |
| K key fires right lane | keydown 'KeyK' | callback('right') |
| Other key ignored | keydown 'KeyA' | no callback |
| Key repeat blocked | keydown 'KeyD' twice (no keyup) | callback fires once |
| Key release allows re-press | keydown → keyup → keydown 'KeyD' | callback fires twice |
| Simultaneous keys both fire | keydown 'KeyD' + keydown 'KeyK' | both callbacks fire |
| Stop removes listeners | stop() then keydown | no callback |

Implementation: Create `KeyboardEvent` mocks with `code` property and dispatch to the handler.

**Traces to**: REQ-2 AC5 (ignore key repeats), REQ-3 AC3 (simultaneous keypresses), Design Property 8

---

### Task 6: Automated Timing Synchronization Test

**What**: The highest-priority test — validates that the note rendering position calculation stays synchronized with audio time within ±10ms.

**File to create**: `src/renderer/game/__tests__/timingSync.test.ts`

**Approach**: Mock `AudioContext.currentTime` and verify that `calculateNoteY()` produces positions that correspond to audio time within ±10ms tolerance.

**Tests to write**:

#### Suite 8: Audio-Visual Synchronization (Property 2, REQ-16)

**Test 1: Metronome beatmap — 100 notes at 1-second intervals**
```
Setup: Generate 100 notes at timestamps 1.0, 2.0, 3.0, ..., 100.0
For each note:
  - Simulate audio time = note.timestamp (exact moment note should be at hit zone)
  - Calculate note Y position via calculateNoteY()
  - Assert Y == HIT_ZONE_Y (450px)
  - Calculate time delta: |expected_time - actual_time_from_position| <= 10ms
```

**Test 2: Sub-second note spacing**
```
Setup: Generate notes at 0.1s intervals (100ms apart)
Verify each note's Y position at its exact timestamp == HIT_ZONE_Y
```

**Test 3: Position-to-time roundtrip verification**
```
For a note at timestamp T:
  - Calculate Y at time T → should be HIT_ZONE_Y
  - Reverse: Given Y = HIT_ZONE_Y, calculate time → should be T
  - Verify |calculated_time - T| <= 0.01 (10ms)
```

**Test 4: Continuous time progression**
```
For a note at timestamp 10.0s:
  - Step through time from 0.0 to 20.0 in 0.001s (1ms) increments
  - At each step, calculate Y position
  - Verify Y moves monotonically downward (no jumps or stutters)
  - At time 10.0s, Y must be within ±2px of HIT_ZONE_Y (corresponds to ±10ms)
```

**Test 5: Time-to-pixel precision check**
```
With NOTE_SCROLL_SPEED = 200px/s:
  - 10ms = 2px of movement
  - Verify: |calculateNoteY(T, T + 0.01) - HIT_ZONE_Y| == 2px
  - Verify: |calculateNoteY(T, T - 0.01) - HIT_ZONE_Y| == 2px
  - This confirms 10ms of audio drift = only 2px visual drift (acceptable)
```

**Test 6: Hit detection timing matches visual position**
```
For a note at timestamp 5.0s:
  - When Y position is at HIT_ZONE_Y (time = 5.0s): checkHit → 'perfect'
  - When Y position is 10px below (time = 5.05s): checkHit → 'perfect' (within ±50ms)
  - When Y position is 20px below (time = 5.1s): checkHit → 'good' (within ±100ms)
  - When Y position is 21px below (time = 5.105s): checkHit → 'miss'
Verify that visual position and timing classification are consistent.
```

**Traces to**: REQ-3 AC4, REQ-16 AC1/AC2/AC3, Design Property 2

---

### Task 7: Simultaneous Input Test

**What**: Verify that two notes at the same timestamp in different lanes can both be hit.

**File**: Add to `src/renderer/game/__tests__/hitDetection.test.ts`

#### Suite 9: Simultaneous Notes (Property 8)
```
Setup:
  leftNote = { timestamp: 5.0, lane: 'left', type: 'tap' }
  rightNote = { timestamp: 5.0, lane: 'right', type: 'tap' }
  notes = [leftNote, rightNote]

Test 1: Find left note when querying left lane
  findNoteInHitZone(notes, 'left', 5.0) → leftNote

Test 2: Find right note when querying right lane
  findNoteInHitZone(notes, 'right', 5.0) → rightNote

Test 3: Both notes hittable independently
  checkHit(leftNote, 5.0) → 'perfect'
  checkHit(rightNote, 5.0) → 'perfect'

Test 4: Slightly offset simultaneous notes (±100ms)
  leftNote at 5.0, rightNote at 5.08
  Both should be detectable from their respective lanes
```

**Traces to**: REQ-3 AC3, Design Property 8

---

### Task 8: Extract Pure Functions from GameCanvas (Refactor)

**What**: The accuracy calculation is currently inline in `GameCanvas.tsx`. Extract it into a testable pure function. Also consider extracting any other inline logic that should be unit-tested.

**Files to modify**:
- `src/renderer/game/hitDetection.ts` — add `calculateAccuracy()` export
- `src/renderer/components/GameCanvas.tsx` — import and use `calculateAccuracy()` instead of inline math

**This is a minimal refactor** — only move the accuracy formula, don't restructure the component.

**Verification**: Run the game after refactoring to confirm identical behavior.

---

### Task 9: Run Full Test Suite and Validate Coverage

**What**: Execute all tests, review results, and verify coverage targets.

**Commands**:
```bash
npm run test:run          # All tests pass
npm run test:coverage     # Coverage report generated
```

**Coverage targets for Phase 3**:
| File | Target |
|------|--------|
| `hitDetection.ts` | 100% statements, 100% branches |
| `noteRenderer.ts` | 80%+ statements |
| `inputHandler.ts` | 80%+ statements |

**Pass criteria**:
- All timing synchronization tests pass (±10ms)
- All hit detection boundary tests pass
- All accuracy calculation tests pass
- All simultaneous input tests pass
- Zero test failures

---

### Task 10: Document Timing Test Results

**What**: Record the test results in a brief summary for future reference.

**File to create**: `phase3_results.md` (project root)

**Contents**:
- Date of test run
- Number of tests: passed/failed
- Coverage percentages for critical files
- Timing synchronization results: max delta observed, mean delta
- Any issues found and fixes applied
- Conclusion: PASS/FAIL for ±10ms synchronization gate

---

## File Summary

### New Files
| File | Purpose |
|------|---------|
| `vitest.config.ts` | Vitest test configuration |
| `tsconfig.json` | TypeScript compiler configuration (project root) |
| `src/renderer/game/__tests__/hitDetection.test.ts` | Hit detection + accuracy + simultaneous input tests |
| `src/renderer/game/__tests__/noteRenderer.test.ts` | Note position + viewport + hit zone visual tests |
| `src/renderer/game/__tests__/inputHandler.test.ts` | Input handler key repeat + mapping tests |
| `src/renderer/game/__tests__/timingSync.test.ts` | Automated timing synchronization validation (REQ-16) |
| `phase3_results.md` | Test results documentation |

### Modified Files
| File | Change |
|------|--------|
| `package.json` | Add vitest, coverage, happy-dom devDependencies; add test scripts |
| `src/renderer/game/hitDetection.ts` | Extract `calculateAccuracy()` as exported function |
| `src/renderer/components/GameCanvas.tsx` | Use imported `calculateAccuracy()` instead of inline formula |

---

## Execution Order

```
Task 1: Install Vitest + configure  ← Must be first
    ↓
Task 8: Extract calculateAccuracy   ← Small refactor before writing tests
    ↓
Tasks 2-5: Unit tests (can be done in any order)
    ├─ Task 2: Hit detection timing windows
    ├─ Task 3: Accuracy calculation
    ├─ Task 4: Note position calculation
    └─ Task 5: Input handler
    ↓
Tasks 6-7: Integration/sync tests
    ├─ Task 6: Timing synchronization (REQ-16)
    └─ Task 7: Simultaneous input
    ↓
Task 9: Run full suite + coverage validation
    ↓
Task 10: Document results
```

---

## Critical Gate

**This phase is a CRITICAL GATE per the implementation plan.**

Phase 3 passes ONLY when:
1. All automated tests pass (zero failures)
2. Timing synchronization tests confirm ±10ms accuracy
3. Coverage meets targets (100% on hitDetection, 80%+ on noteRenderer/inputHandler)
4. Manual playtesting confirms timing "feels fair" (developer judgment)

**If timing fails**: Debug synchronization by logging `audioContext.currentTime` deltas in the game loop, adjust `NOTE_SCROLL_SPEED` or position calculation, and re-run tests. If ±10ms proves impossible, the fallback is to increase tolerance to ±15ms (but only after exhausting debugging options).

**Do NOT proceed to Phase 4 until this gate passes.**

---

## Estimated Test Count

| Suite | Tests |
|-------|-------|
| checkHit timing windows | ~13 |
| findNoteInHitZone | ~6 |
| calculateAccuracy | ~8 |
| calculateNoteY | ~6 |
| isNoteOnScreen | ~6 |
| isNoteInHitZone | ~5 |
| InputHandler | ~7 |
| Timing synchronization | ~6 |
| Simultaneous input | ~4 |
| **Total** | **~61** |
