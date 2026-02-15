# Implementation Plan: Minimal 2-Key Rhythm Game

## Overview

This plan outlines the implementation of a radically minimal 2-key rhythm game built as a desktop application using Electron, React, and Canvas. The approach prioritizes **timing precision validation** above all else—the core game engine will be built and tested for ±10ms synchronization accuracy before adding secondary features. The project will be built in focused phases, with each phase producing a testable deliverable that validates critical assumptions.

**Core Approach**:
- Build timing-critical foundation first (game engine, audio sync, Canvas rendering)
- Validate timing precision with automated tests before proceeding
- Add complexity incrementally (hold notes, practice mode, editor)
- Create 10 starting levels after core mechanics are proven
- Defer packaging and polish until core features are complete

**Technology Stack** (see [technology_decisions.md](technology_decisions.md)):
- Electron + React + Vite for desktop app with fast development
- Zustand for state management
- Vanilla Canvas API for game rendering
- Web Audio API for precise timing
- Radix UI Primitives for minimal UI components
- Vitest for unit and timing validation tests

---

## Phase 0: Technology Stack Decisions ✅

**Status**: Complete (2026-02-14)

All technology decisions have been made and documented in [technology_decisions.md](technology_decisions.md).

**Key Decisions**:
- Desktop Framework: Electron
- Frontend: React 18+
- Build Tool: Vite + electron-vite
- State Management: Zustand
- Canvas: Vanilla Canvas API
- Testing: Vitest
- UI Components: Radix UI Primitives
- Packaging: Deferred (electron-builder planned)

---

## Phase 1: Project Setup & Scaffolding

**Goal**: Create a working Electron + React + Vite development environment with hot reload.

**Tasks**:
1. Initialize npm project and install core dependencies (Electron, React, Vite, electron-vite)
2. Configure electron-vite for main process + renderer process bundling
3. Set up basic Electron window (800x600, frameless optional)
4. Create React app entry point with minimal UI (just "Hello World")
5. Configure Vite development server with hot module replacement
6. Set up project folder structure:
   ```
   /src
     /main          # Electron main process
     /renderer      # React app
     /shared        # Shared types/utils
   /songs           # Level data (initially empty)
   /public          # Static assets
   ```
7. Add `.gitattributes` for consistent line endings (LF)
8. Test: Run `npm run dev` and verify Electron window opens with React app

**Deliverable**: Running Electron app with React and instant hot reload.

**Estimated Complexity**: Low - Standard Electron + React setup.

---

## Phase 2: Core Game Engine - Tap Notes Only

**Goal**: Build the foundational game loop with tap notes, Canvas rendering, and basic timing detection.

**Tasks**:
1. Create `GameCanvas` React component with useRef to access Canvas element
2. Implement 60fps game loop using `requestAnimationFrame`
3. Render two vertical lanes (left/right) and white hit zones at 1/4 from bottom
4. Load test MP3 file using Web Audio API
5. Create simple test beatmap JSON (10 tap notes, one lane, evenly spaced)
6. Implement note scrolling:
   - Calculate note Y position from `audioContext.currentTime` and note timestamp
   - Scroll notes downward at constant speed
   - Remove notes after they pass hit zone
7. Implement keyboard input handling (D and K keys, ignore key repeats)
8. Implement basic hit detection:
   - Check if keypress occurs while note is in hit zone
   - Classify as Perfect (±50ms), Good (±100ms), or Miss
9. Display live accuracy percentage at bottom center
10. Test: Play through test level, verify notes scroll in sync with audio

**Deliverable**: Playable game with tap notes, scrolling, and hit detection.

**Estimated Complexity**: Medium - Core timing logic is critical.

---

## Phase 3: Timing Validation & Testing

**Goal**: Validate that audio-visual synchronization meets ±10ms target (REQ-16).

**Tasks**:
1. Set up Vitest with basic configuration
2. Write unit tests for timing window classification:
   - Test ±50ms boundary for Perfect hits
   - Test ±100ms boundary for Good hits
   - Test edge cases (exactly at boundaries)
3. Write unit test for accuracy percentage calculation
4. Create automated timing test:
   - Mock Web Audio API `currentTime`
   - Mock Canvas timestamps
   - Simulate note rendering at exact timestamps
   - Measure deltas between audio time and visual position
   - Flag any delta > ±10ms
5. Run automated timing test with metronome beatmap (notes every 1 second)
6. Manual playtesting: Play test level, verify timing "feels fair"
7. If timing fails: Debug synchronization, adjust scroll speed calculation
8. Document timing test results

**Deliverable**: Passing automated timing tests confirming ±10ms synchronization.

**Estimated Complexity**: Medium-High - Timing is highest-risk assumption (A3, A5).

**Critical**: Do NOT proceed to Phase 4 until timing validation passes.

---

## Phase 4: Hold Notes & Note Types

**Goal**: Add hold note support with duration tracking.

**Tasks**:
1. Extend beatmap format to include `type: "hold"` and `duration` fields
2. Visually distinguish hold notes from tap notes (red vs blue, or length)
3. Implement hold note rendering (draw extended rectangle or line)
4. Implement hold note detection logic:
   - Detect keydown when note enters hit zone
   - Track key held state
   - Detect keyup when note exits hit zone
   - Classify as successful if held for entire duration (within timing windows)
5. Write unit tests for hold note duration detection
6. Create test beatmap with mix of tap and hold notes
7. Test: Play beatmap, verify hold notes require sustained press

**Deliverable**: Working hold notes with correct duration detection.

**Estimated Complexity**: Medium - Hold note timing is moderately complex.

---

## Phase 5: End-of-Level Results & Score Persistence

**Goal**: Display end-of-level statistics and save best scores.

**Tasks**:
1. Track statistics during gameplay:
   - Total notes
   - Perfect hits, good hits, misses
   - Max combo (longest streak of consecutive hits)
2. Calculate final accuracy percentage: `(perfectHits + goodHits) / totalNotes * 100`
3. Create end-of-level results screen component:
   - Display final accuracy percentage
   - Display max combo
   - Display perfect hits count
   - Display comparison to personal best ("New best!" or "Previous best: X%")
4. Set up Zustand store for scores: `{ [levelId]: bestAccuracyPercentage }`
5. Implement file system integration:
   - Use Electron's `fs` module to write `scores.json`
   - Load scores on app startup
   - Save new best score only if accuracy improves
6. Write unit test for score comparison logic
7. Test: Play same level multiple times, verify best score updates correctly

**Deliverable**: End-of-level stats screen with persistent best scores.

**Estimated Complexity**: Low-Medium - Straightforward UI and file I/O.

---

## Phase 6: Settings & Customization

**Goal**: Add customizable colors, key bindings, and volume control.

**Tasks**:
1. Set up Zustand store for settings:
   ```javascript
   {
     colors: { tap: '#0000FF', hold: '#FF0000', background: '#000000', text: '#CCCCCC' },
     keyBindings: { left: 'D', right: 'K' },
     volume: 100
   }
   ```
2. Create Settings screen component using Radix UI Dialog
3. Add settings controls:
   - Radix Slider for volume (0-100%)
   - Text inputs for key bindings (with validation: no duplicate keys)
   - Hex input fields for colors (with pattern validation)
   - Display color preview swatches next to hex inputs
4. Apply settings:
   - Use colors in Canvas rendering
   - Listen for custom key bindings in input handler
   - Set Web Audio API volume
5. Implement file system persistence:
   - Save `settings.json` when settings change
   - Load settings on app startup
   - Provide "Reset to Defaults" button
6. Write custom CSS for minimal settings UI (black background, grey text, simple borders)
7. Test: Change settings, restart app, verify settings persisted

**Deliverable**: Fully functional settings screen with persistent customization.

**Estimated Complexity**: Medium - UI work + file persistence.

---

## Phase 7: Level Selection & Menu System

**Goal**: Create menu navigation between level select, settings, and gameplay.

**Tasks**:
1. Create main menu component with navigation buttons:
   - Play (goes to level select)
   - Settings (opens settings dialog)
   - Editor (goes to editor - implemented in later phase)
2. Create level selection screen:
   - Scan `/songs/` directory for level folders
   - Display list of levels with:
     - Level name (from beatmap.json)
     - Best accuracy percentage (from scores.json, or "Not played yet")
   - "Play" and "Practice Mode" buttons per level
3. Implement navigation state machine:
   - Main Menu → Level Select → Gameplay → Results → Level Select
   - Settings accessible from Main Menu and Level Select
4. Add basic keyboard navigation (arrow keys to select level, Enter to play)
5. Write minimal CSS for level list (simple hover states, clean layout)
6. Test: Navigate through all screens, verify flow works

**Deliverable**: Complete menu system for navigating the app.

**Estimated Complexity**: Low-Medium - UI and routing logic.

---

## Phase 8: Practice Mode

**Goal**: Add practice mode with adjustable speed (50-100%).

**Tasks**:
1. Add practice mode toggle to level select screen (checkbox or toggle button)
2. Add Radix Slider for practice speed (50-100%, only visible when practice mode enabled)
3. Extend Zustand state to track `isPracticeMode` and `practiceSpeed`
4. Adjust Web Audio API playback rate: `audioBuffer.playbackRate.value = practiceSpeed`
5. Adjust note scroll speed proportionally: `noteSpeed = baseSpeed * practiceSpeed`
6. Display red practice mode indicator at top left during gameplay
7. Modify score saving logic: **Do NOT save scores** when `isPracticeMode === true`
8. Display "PRACTICE MODE" label on end-of-level results
9. Test: Play level at 50% speed, verify audio and notes sync correctly
10. Test: Achieve perfect accuracy in practice mode, verify score NOT saved

**Deliverable**: Working practice mode with speed control and score isolation.

**Estimated Complexity**: Low-Medium - Playback rate adjustment is straightforward.

---

## Phase 9: Create 10 Starting Levels

**Goal**: Design and create 10 beatmaps with progressive difficulty.

**Tasks**:
1. Source 10 royalty-free instrumental MP3s (1-3 minutes each) with varied energy levels
2. Create beatmap JSON files manually or using simple recording tool (see Phase 11)
3. Progression structure:
   - **Levels 1-3**: Tap notes only, slow tempo (60-80 BPM), single lane focus
   - **Levels 4-6**: Introduce hold notes, medium tempo (100-120 BPM), both lanes active
   - **Levels 7-8**: Mixed tap/hold, faster tempo (130-150 BPM), complex patterns
   - **Levels 9-10**: Advanced patterns, high tempo (150+ BPM), challenging combinations
4. Organize files in `/songs/` directory:
   ```
   /songs/level-01-chill-vibes/
     audio.mp3
     beatmap.json
   /songs/level-02-.../
   ```
5. Validate all beatmaps using beatmap validation function (timestamps sorted, no overlaps)
6. Playtest each level manually to ensure fun and fairness
7. Adjust note patterns based on playtesting feedback

**Deliverable**: 10 complete, tested levels ready to play.

**Estimated Complexity**: High - Time-intensive creative work.

**Note**: This phase can start in parallel with Phase 8 and continue through Phase 10.

---

## Phase 10: Beatmap Validation & Error Handling

**Goal**: Implement robust beatmap validation and error handling.

**Tasks**:
1. Create `validateBeatmap(json)` function:
   - Check required fields: `songTitle`, `audioFile`, `bpm`, `duration`, `notes`
   - Validate notes array: each note has `timestamp`, `lane`, `type`
   - Verify hold notes have `duration` field
   - Check timestamps are sorted in ascending order
   - Detect lane overlaps (notes in same lane too close together)
   - Return detailed error messages with line numbers
2. Implement error handling for level loading:
   - Beatmap file missing → show error in level list, skip level
   - Audio file missing → show error in level list, skip level
   - Invalid beatmap JSON → show specific validation error
3. Add error boundary component to catch React errors gracefully
4. Test error cases:
   - Load level with missing audio file
   - Load level with invalid beatmap (unsorted timestamps)
   - Load level with missing required fields
5. Write unit tests for beatmap validation function

**Deliverable**: Robust error handling prevents crashes from invalid beatmaps.

**Estimated Complexity**: Low-Medium - Mostly validation logic.

---

## Phase 11: Visual Level Editor (Optional - Can Defer)

**Goal**: Build visual beatmap editor with timeline and note placement.

**Tasks**:
1. Create Editor component with layout:
   - Timeline (horizontal) showing audio waveform or time markers
   - Two lanes (vertical) for left/right note placement
   - Playback controls (play/pause, scrub timeline)
   - Note type selector (tap vs hold toggle)
2. Implement file picker for selecting MP3 file
3. Load audio into Web Audio API, get duration
4. Render timeline with time markers (0s, 5s, 10s, etc.)
5. Implement note placement:
   - Click on timeline → create note at timestamp + selected lane
   - Click existing note → delete note
   - Click note type toggle to switch tap/hold
   - Drag hold note end to adjust duration
6. Implement audio preview: play audio and scroll notes to test timing
7. Add Save button:
   - Validate beatmap
   - Prompt for level name
   - Save to `/songs/[name]/` folder
8. Test: Create simple beatmap, save, load in game, verify it plays correctly

**Deliverable**: Visual editor for creating custom beatmaps.

**Estimated Complexity**: High - Complex UI with drag-and-drop and audio sync.

**Note**: This phase can be deferred to after Phase 12 if time is limited. Levels can be created manually for initial release.

---

## Phase 12: Play-Along Recording Mode (Alternative Editor)

**Goal**: Build play-along recording as simpler alternative to visual editor.

**Tasks**:
1. Create Recording component with minimal UI:
   - File picker for MP3
   - "Start Recording" button
   - Display simplified game view (two lanes, hit zones, no notes)
2. Load audio file and initialize recording state
3. During playback:
   - Capture keydown events for D and K keys
   - Record: `{ timestamp: currentAudioTime, lane: 'left'/'right', type: 'tap' }`
   - If key held > 200ms: convert last tap to hold note with duration = hold time
4. After recording completes:
   - Sort recorded notes by timestamp
   - Display preview: "Recorded X notes. Save beatmap?"
5. Save recorded beatmap to `/songs/` directory
6. Test: Record simple beatmap by playing along, verify it plays correctly

**Deliverable**: Simple recording-based beatmap creator.

**Estimated Complexity**: Medium - Simpler than visual editor but requires timing precision.

**Note**: Can be implemented **instead of** or **in addition to** Phase 11 visual editor.

---

## Phase 13: Polish & Final Testing

**Goal**: Final polish, comprehensive testing, and bug fixes.

**Tasks**:
1. Manual playtesting session:
   - Play all 10 starting levels
   - Test all settings combinations
   - Test practice mode at various speeds
   - Verify all navigation flows
2. Edge case testing:
   - Simultaneous keypresses (both lanes at once)
   - Rapid note sequences
   - Very long hold notes
   - Empty beatmaps
3. Performance testing:
   - Verify 60fps during gameplay (use browser DevTools FPS monitor)
   - Check memory usage stays stable during long play sessions
4. Fix any bugs discovered during testing
5. Write unit tests for any bugs found and fixed
6. Visual polish:
   - Ensure all text is readable (sufficient contrast)
   - Verify color customization works for all UI elements
   - Check that focus indicators are visible for keyboard navigation
7. Add electron-builder configuration for Windows installer (if ready to distribute)

**Deliverable**: Polished, tested app ready for regular use.

**Estimated Complexity**: Medium - Depends on number of bugs found.

---

## Future Enhancements (Post-Release)

These are improvements discovered during development that are worth pursuing after the core game is complete and validated.

### Enhancement 1: Zundo - Undo/Redo for Beatmap Editor
**Source**: Context7 MCP documentation lookup (2026-02-15)

**What**: [Zundo](https://github.com/charkour/zundo) is a lightweight Zustand middleware that adds time-travel (undo/redo) functionality to any Zustand store. Benchmark score: 84.3, High source reputation.

**Why**: The beatmap editor (Phase 11) will involve placing and removing notes on a timeline. Without undo/redo, a misplaced note requires manual deletion and re-placement — frustrating during creative work. Zundo plugs directly into our existing Zustand store with minimal code.

**Implementation**:
```javascript
import { temporal } from 'zundo'

const useEditorStore = create(
  temporal((set) => ({
    notes: [],
    addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
    removeNote: (id) => set((state) => ({ notes: state.notes.filter(n => n.id !== id) })),
  }))
)

// Ctrl+Z / Ctrl+Y support:
const { undo, redo } = useEditorStore.temporal.getState()
```

**When**: After Phase 11 (Visual Editor) or Phase 12 (Recording Mode) is working. Add as a polish step for the editor experience.

**Estimated Complexity**: Low - Drop-in middleware, ~30 minutes to integrate.

---

## Phase Dependencies

```
Phase 0 (Tech Stack) ✅
    ↓
Phase 1 (Project Setup)
    ↓
Phase 2 (Core Game Engine - Tap Notes)
    ↓
Phase 3 (Timing Validation) ← CRITICAL GATE: Must pass before proceeding
    ↓
Phase 4 (Hold Notes)
    ↓
Phase 5 (Results & Score Persistence)
    ↓
Phase 6 (Settings & Customization)
    ↓
Phase 7 (Menu System)
    ↓
Phase 8 (Practice Mode)
    ↓
Phase 10 (Validation & Error Handling)
    ↓
Phase 13 (Polish & Testing)

Phase 9 (Create 10 Levels) ← Can run in parallel with Phases 8-10

Phase 11 (Visual Editor) ← Optional, can be deferred or replaced by Phase 12
Phase 12 (Recording Mode) ← Alternative to Phase 11, or both
```

---

## Risk Areas & Mitigation

### Risk 1: Timing Precision Fails (±10ms not achievable)
**Impact**: Critical - Entire project depends on accurate timing (A3, A5)

**Mitigation**:
- Phase 3 validates timing **before** adding features
- Automated tests measure objective synchronization
- If timing fails: Debug with Web Audio API currentTime logging, adjust scroll calculation
- Fallback: Increase tolerance to ±15ms if ±10ms proves impossible (but test first)

**Early Warning Signs**: Automated timing test reports deltas > ±10ms, manual playtesting feels unfair

---

### Risk 2: Hold Note Implementation Complexity
**Impact**: Medium - Hold notes add significant complexity to timing logic

**Mitigation**:
- Implement tap notes first and validate before adding holds (Phase 2-3 before Phase 4)
- Write unit tests for hold duration detection
- Start with simple hold patterns in test beatmaps
- Can simplify to "hold notes are just longer tap notes" if duration tracking proves too complex

**Early Warning Signs**: Hold note timing feels inconsistent, edge cases fail

---

### Risk 3: Creating 10 Quality Levels Takes Too Long
**Impact**: Medium - Manual beatmap creation is time-intensive

**Mitigation**:
- Start with 3-5 simple levels to validate core mechanics (A4 motivation testing)
- Build editor tools (Phase 11 or 12) to speed up creation
- Can launch with fewer levels and add more later
- Recording mode (Phase 12) is faster than manual JSON editing

**Early Warning Signs**: Level creation taking > 1 hour per level

---

### Risk 4: Motivation Drops After Initial Novelty (A4)
**Impact**: High - If not fun long-term, project fails personal use goal

**Mitigation**:
- Manual validation: Builder plays regularly for 2 weeks after Phase 13 (per requirements)
- Track actual usage patterns
- Progressive difficulty (10 levels) maintains challenge
- Practice mode allows mastery of difficult sections
- If motivation fails: Revisit minimal design (maybe TOO minimal?), add subtle progression elements

**Early Warning Signs**: Builder stops playing after 3-5 days, levels feel repetitive

---

### Risk 5: Visual Editor Too Complex to Build
**Impact**: Low-Medium - Affects custom level creation workflow

**Mitigation**:
- Phase 12 (recording mode) is simpler alternative
- Can defer editor entirely and create levels manually or via recording
- Minimal viable editor: Just timeline + click to place notes (no waveform, no drag)
- Can always add visual editor in future update after core game proven

**Early Warning Signs**: Editor implementation taking > 2 weeks, dragging issues

---

## Success Criteria

The project will be considered **complete and successful** when:

### Core Functionality ✓
- [ ] All 10 starting levels are playable with smooth 60fps rendering
- [ ] Automated timing tests pass with ±10ms synchronization (REQ-16)
- [ ] Manual playtesting confirms timing "feels fair" (no perceived lag)
- [ ] Both tap and hold notes work correctly with accurate hit detection

### Features Complete ✓
- [ ] Practice mode adjusts speed (50-100%) without breaking synchronization
- [ ] All settings (colors, keys, volume) save and load correctly across sessions
- [ ] Best scores persist and update correctly (only in non-practice mode)
- [ ] End-of-level stats display accurately (accuracy %, max combo, perfect hits)

### Editor Functionality ✓
- [ ] At least one beatmap creation method works (visual editor OR recording mode)
- [ ] Custom beatmaps can be created, saved, and played in-game
- [ ] Beatmap validation prevents invalid files from crashing the game

### Personal Use Validation ✓
- [ ] Builder uses the game regularly for **2 weeks** to validate:
  - Motivation sustained (A4 assumption)
  - Minimal design effective - focus stays on timing (A1, A7 assumptions)
  - 2-button complexity feels right - not too simple, not too complex (A2 assumption)
- [ ] Builder reports measurable improvement in accuracy over 2-week period
- [ ] No show-stopping bugs discovered during regular use

### Quality Standards ✓
- [ ] No crashes or data loss during normal use
- [ ] All unit tests and timing validation tests pass
- [ ] Code coverage > 70% for timing-critical logic (hit detection, accuracy calculation)
- [ ] Application runs without internet connectivity (offline requirement met)

---

## Next Steps

After this implementation plan is reviewed and approved:

1. **Run `/plan-phase 1`** to create detailed execution plan for Phase 1 (Project Setup & Scaffolding)
2. Begin development with Phase 1
3. After each phase completes, run `/plan-phase N` for the next phase
4. Track progress and update this plan if scope or approach changes

**Note**: The `/tech-stack` workflow will now proceed to create `naming_conventions.md` as the final setup step before implementation begins.
