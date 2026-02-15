# Design: Minimal 2-Key Rhythm Game

## 1. Overview

### Problem Restatement
Existing rhythm games (Guitar Hero, DDR, osu!, Unbeatable) suffer from visual clutter and button complexity that prevents users from focusing on the core timing mechanic. Visual effects, decorative UI elements, background animations, and 5+ button layouts create cognitive overload, making it difficult to see exactly when to press keys and practice hand-eye coordination effectively.

### Solution Approach
Build a radically minimal 2-key rhythm game as a desktop application using:
- **Two lanes** (left/right) with clean vertical scrolling
- **Two note types** (tap and hold) for variety without complexity
- **Zero visual clutter** during gameplay (black background, white hit zones, colored notes, live accuracy percentage only)
- **Guitar Hero-style mechanics** (notes scroll down to hit zones) with simplified controls
- **Built-in level editor** (visual + play-along recording) for infinite content expansion
- **Practice mode** with adjustable speed for skill building
- **Desktop-native** (Electron-based) for offline use and precise timing control

The design prioritizes **timing precision** and **visual minimalism** above all else. Every feature must justify its existence against the question: "Does this help or hinder focus on timing?"

---

## 2. Key Design Principles

### Principle 1: Radical Minimalism
**Rationale**: Visual clutter is the core problem we're solving (A1, A7). Any visual element that doesn't directly serve timing feedback is removed.

**In Practice**:
- No decorative UI, animations, or effects during gameplay
- Only essential information visible: notes, hit zones, live accuracy %
- Customization focuses on colors (personal preference) not features (no complexity creep)
- Practice mode indicator is minimal (red button, top left, no text)

**Design Decisions This Resolves**:
- When uncertain about adding visual feedback → default to NO
- When choosing between information displays → show less, not more
- When designing menus → simple lists over grids, cards, or fancy layouts

---

### Principle 2: Timing Precision is Non-Negotiable
**Rationale**: Timing accuracy is the highest-risk technical assumption (A3, A5). Perceived unfairness or lag kills motivation immediately.

**In Practice**:
- Web Audio API for precise timing synchronization (±10ms target)
- Automated timing tests to detect lag objectively
- 60fps rendering with Canvas optimization
- Clear timing windows (±50ms perfect, ±100ms good) with no ambiguity
- Manual validation by builder before release

**Design Decisions This Resolves**:
- Framework choice → must not interfere with Canvas rendering performance
- Audio format → MP3 only to avoid codec complexity/latency
- Input handling → first keydown only, ignore repeats for consistency
- When trading off features vs performance → always choose performance

---

### Principle 3: Two-Key Sweet Spot
**Rationale**: Gap exists between 1-button games (too simple) and 5+ button games (too complex). Two buttons hits the middle ground for coordination training (A2).

**In Practice**:
- Exactly two lanes, no more
- Two distinct note types (tap and hold) for variety
- Simultaneous notes allowed (both lanes can have notes at same time)
- Difficulty scales through tempo and patterns, not button count

**Design Decisions This Resolves**:
- When designing beatmaps → complexity comes from rhythm patterns, not spatial distribution
- When considering new note types → must fit within 2-key paradigm
- When balancing difficulty → adjust speed/density, never add keys

---

### Principle 4: Personal Tool, Personal Control
**Rationale**: This is a personal project (A10) built for one user's specific needs. Customization serves individual preference, not mass-market appeal.

**In Practice**:
- All colors customizable (notes, background, text)
- Key bindings fully rebindable
- Practice mode speed adjustable (50-100% slider)
- Built-in editor for infinite content creation
- Local file storage (no cloud, no accounts, no internet dependency)

**Design Decisions This Resolves**:
- When choosing features → personal utility over broad appeal
- When storing data → local files over databases or cloud services
- When validating beatmaps → strict (prevent errors) over permissive (handle all edge cases)
- When adding settings → include if it affects personal preference, exclude if it complicates unnecessarily

---

### Principle 5: Build Core First, Expand Later
**Rationale**: Timing precision is the highest risk (A3). Validate core mechanics work perfectly before investing in secondary features.

**In Practice**:
- Build order: game engine → test timing → add editor → create 10 levels
- MVP validates timing with manually-created JSON beatmaps before building editor
- Practice mode and customization added after core gameplay proven
- No feature creep during initial build (resist adding "nice-to-haves" prematurely)

**Design Decisions This Resolves**:
- When prioritizing tasks → core timing engine before UI polish
- When blocked on editor complexity → can always create beatmaps manually as fallback
- When tempted to add features → defer until core is validated by real use

---

## 3. Technology Approach

**Note**: Detailed technology stack decisions will be made using the `/tech-stack` skill.

### Current Constraints
- **Platform**: Desktop application (Electron or similar framework)
- **Rendering**: HTML5 Canvas for game graphics
- **Audio**: Web Audio API for precise timing
- **UI Framework**: Framework-based (React or similar) for menus and settings
- **Audio Format**: MP3 only
- **Storage**: Local file system (no database, no cloud)

### Key Technical Requirements
1. **Timing Synchronization**: Audio playback must sync with note rendering within ±10ms
2. **Performance**: Maintain 60fps during gameplay with Canvas rendering
3. **File System Access**: Read/write local files for songs, beatmaps, settings, scores
4. **Input Handling**: Capture keydown/keyup events with no repeat, support simultaneous keys

The `/tech-stack` workflow will determine:
- Specific Electron configuration and build process
- UI framework choice (React, Vue, or alternative)
- Canvas rendering libraries or vanilla implementation
- State management approach for game logic
- Testing frameworks for automated timing validation

---

## 4. Correctness Properties

These are universal invariants that must hold across all valid system states. Each property is directly testable.

### Property 1: Timing Window Consistency
**Statement**: For any note N with target timestamp T, a keypress at time K SHALL be classified as:
- Perfect if |K - T| ≤ 50ms
- Good if 50ms < |K - T| ≤ 100ms
- Miss if |K - T| > 100ms

**Validates**: REQ-3 (Timing Detection)

**Test Method**: Unit test with known note timestamp and simulated keypresses at various offsets.

---

### Property 2: Audio-Visual Synchronization
**Statement**: For any note N reaching the hit zone at visual time V, the audio playback time A SHALL satisfy |V - A| ≤ 10ms.

**Validates**: REQ-3 (Timing Detection), REQ-16 (Timing Validation)

**Test Method**: Automated timing test measures audio playback position vs. Canvas rendering timestamps over 100+ notes.

---

### Property 3: Hold Note Duration Accuracy
**Statement**: For any hold note H with duration D, the note SHALL be classified as successful if and only if the key is pressed continuously for the entire interval [T, T+D] where T is the note's target timestamp (within timing window tolerances).

**Validates**: REQ-2 (Note Types)

**Test Method**: Unit test with simulated key hold at various durations (too short, exact, too long).

---

### Property 4: Practice Mode Score Isolation
**Statement**: For any level L played in practice mode (speed < 100%), the accuracy score SHALL NOT update the stored best score for level L.

**Validates**: REQ-8 (Practice Mode)

**Test Method**: Play level in practice mode with perfect accuracy, verify best score file unchanged; play at 100% speed, verify best score updates.

---

### Property 5: Beatmap Temporal Ordering
**Statement**: For any valid beatmap B, all notes SHALL be sorted by timestamp in ascending order, and no two notes in the same lane SHALL have overlapping time intervals (accounting for timing windows).

**Validates**: REQ-12 (Beatmap File Format)

**Test Method**: Beatmap validation function checks timestamp ordering and lane collision before loading.

---

### Property 6: Accuracy Percentage Correctness
**Statement**: For any level completion with H hits (perfect + good) out of N total notes, the displayed accuracy percentage SHALL equal (H / N) × 100, rounded to one decimal place.

**Validates**: REQ-4 (Real-Time Feedback), REQ-5 (End-of-Level Results)

**Test Method**: Unit test with known hit/miss counts, verify displayed percentage matches formula.

---

### Property 7: File System Atomicity
**Statement**: For any settings or score update operation, the data SHALL either be fully written to disk or not written at all (no partial writes that corrupt state).

**Validates**: REQ-14 (Local File Storage)

**Test Method**: Simulate interruptions during file writes, verify files are either valid or unchanged (not corrupted).

---

### Property 8: Input Simultaneity
**Statement**: For any two notes N1 (left lane) and N2 (right lane) with timestamps T1 and T2 where |T1 - T2| ≤ 100ms, simultaneous keypresses for both lanes SHALL register both notes as successful hits.

**Validates**: REQ-3 (Timing Detection)

**Test Method**: Unit test with overlapping notes in different lanes, simulate simultaneous keypresses, verify both register.

---

## 5. Business Logic Flows

### Flow 1: Play Level (Normal Mode)
**Trigger**: User selects a level from the level list menu

**Preconditions**:
- Level has valid `audio.mp3` and `beatmap.json` files
- User settings (key bindings, colors, volume) loaded

**Steps**:
1. Load beatmap JSON, validate structure
2. Load audio file into Web Audio API buffer
3. Initialize game state:
   - Parse notes from beatmap
   - Set up Canvas rendering context
   - Reset live accuracy to 100%
4. Start audio playback at time T=0
5. Begin render loop (60fps):
   - Calculate current audio playback time
   - Update note positions (scroll down based on elapsed time)
   - Check for keypresses and evaluate timing for notes in hit zone
   - Update live accuracy percentage
   - Render frame (notes, hit zones, accuracy text)
6. When audio completes:
   - Calculate final statistics (accuracy, max combo, perfect hits)
   - Compare to stored best accuracy for this level
   - If new best, update stored score file
   - Display end-of-level results screen

**Postconditions**:
- User sees final statistics
- Best score updated if improved
- User can return to level select or replay

---

### Flow 2: Play Level (Practice Mode)
**Trigger**: User selects a level and enables practice mode with speed < 100%

**Preconditions**: Same as Flow 1

**Steps**:
1. Load beatmap and audio (same as Flow 1, steps 1-3)
2. **Adjust playback speed**: Set Web Audio API playback rate to user-selected speed (0.5 to 1.0)
3. **Adjust note scroll speed**: Scale visual note velocity to match audio speed
4. Display red practice mode indicator at top left
5. Start audio playback at adjusted speed
6. Render loop (same as Flow 1, step 5)
7. When audio completes:
   - Calculate final statistics
   - **Do NOT compare to best score**
   - **Do NOT update stored score file**
   - Display end-of-level results with "PRACTICE MODE" label

**Postconditions**:
- User sees final statistics (not saved)
- Best score remains unchanged
- User can adjust speed or return to normal mode

---

### Flow 3: Create Beatmap (Play-Along Recording)
**Trigger**: User selects "Create New Level" → "Play-Along Recording" from editor menu

**Preconditions**:
- User has selected an MP3 file from file system
- File is valid MP3 format

**Steps**:
1. Load audio file into Web Audio API buffer
2. Initialize recording state:
   - Empty notes array
   - Audio playback time tracker
3. Display simplified game view (two lanes, hit zones, no notes)
4. Start audio playback
5. During playback:
   - On keydown (left lane): Record `{ timestamp: currentAudioTime, lane: "left", type: "tap" }`
   - On keydown (right lane): Record `{ timestamp: currentAudioTime, lane: "right", type: "tap" }`
   - If key held > 200ms: Convert last tap note to hold note, set duration = hold time
6. When audio completes:
   - Sort recorded notes by timestamp
   - Display preview: "Recorded X notes. Preview beatmap?"
7. If user confirms:
   - Open visual editor with recorded beatmap loaded
8. If user cancels:
   - Discard recorded notes

**Postconditions**:
- Recorded beatmap available for editing or saving
- User can refine beatmap in visual editor

---

### Flow 4: Create/Edit Beatmap (Visual Editor)
**Trigger**: User selects "Create New Level" → "Visual Editor" or "Edit Existing Level"

**Preconditions**:
- For new level: User has selected an MP3 file
- For edit: Level's beatmap.json exists and is valid

**Steps**:
1. Load audio file and beatmap (if editing existing)
2. Display editor interface:
   - Timeline view (horizontal) showing audio waveform
   - Two lanes (vertical) for note placement
   - Playback controls (play/pause, scrub timeline)
3. Allow user interactions:
   - **Add note**: Click on timeline at desired timestamp + lane → note created
   - **Delete note**: Click existing note → note removed
   - **Change note type**: Click note → toggle tap/hold
   - **Adjust hold duration**: Drag hold note's end point
   - **Play preview**: Start audio, scroll notes to test timing
4. When user clicks "Save":
   - Validate beatmap structure (sorted timestamps, no lane overlaps)
   - If valid: Prompt for level name and save to `/songs/[name]/` folder
   - If invalid: Display error message with specific issues
5. When user clicks "Cancel":
   - Prompt "Discard unsaved changes?"
   - If confirmed: Return to main menu

**Postconditions**:
- Valid beatmap saved to file system (if saved)
- New level appears in level select menu (if saved)
- User can play newly created level

---

### Flow 5: Automated Timing Test
**Trigger**: Developer runs timing test mode (debug feature)

**Preconditions**:
- At least one test level exists (simple metronome beatmap)

**Steps**:
1. Load test level beatmap (e.g., notes at exact 1-second intervals)
2. Initialize timing measurement:
   - Array to store timing deltas
3. Start audio playback
4. During playback:
   - At each note's exact target timestamp: Simulate perfect keypress
   - Measure visual rendering timestamp when note reaches hit zone
   - Calculate delta = |audioTimestamp - visualTimestamp|
   - Store delta in array
5. When test completes:
   - Calculate statistics: mean delta, max delta, standard deviation
   - Flag any deltas > 10ms as failures
   - Display report: "Timing Test: X/Y notes within ±10ms, max delta: Zms"

**Postconditions**:
- Developer sees objective timing accuracy report
- Issues flagged for investigation if deltas exceed threshold

---

### Flow 6: Load Settings on Startup
**Trigger**: Application launches

**Preconditions**: None (first launch or returning user)

**Steps**:
1. Check for settings file existence (`/settings.json`)
2. If exists:
   - Load JSON, validate structure
   - Apply colors (notes, background, text)
   - Apply key bindings
   - Apply volume
3. If not exists or invalid:
   - Use default settings (blue tap notes, red hold notes, black background, white text, D/K keys, 100% volume)
   - Create settings file with defaults
4. Check for scores file existence (`/scores.json`)
5. If exists:
   - Load best accuracy for each level
6. If not exists:
   - Initialize empty scores object
   - Create scores file
7. Scan `/songs/` directory for level folders
8. For each folder with valid `audio.mp3` and `beatmap.json`:
   - Add to level list
9. Display main menu with level count

**Postconditions**:
- Settings and scores loaded into application state
- All available levels discovered and ready to play

---

## 6. Error Handling Strategy

### Philosophy
- **Never lose user work**: Beatmaps in progress are auto-saved or warned before discard
- **Fail loudly on data integrity**: Invalid beatmaps rejected with clear error messages (strict validation)
- **Degrade gracefully on non-critical errors**: Missing custom level → skip and continue, log error
- **Transparent errors**: Show specific error messages to user (not generic "something went wrong")

### User Errors vs. System Errors

| Error Type | System Response | Rationale |
|------------|----------------|-----------|
| **User creates invalid beatmap** (missing fields, unsorted timestamps) | **Reject with specific error message**: "Beatmap invalid: notes must be sorted by timestamp. Fix line 23." | Strict validation (REQ-12), prevent corrupted gameplay |
| **User selects non-MP3 audio file in editor** | **Block with error**: "Only MP3 files are supported. Selected file: .wav" | Prevent incompatible formats early |
| **User rebinds both lanes to same key** | **Block with error**: "Cannot bind both lanes to the same key." | Prevent unplayable configuration |
| **User exits editor without saving** | **Warn**: "You have unsaved changes. Discard?" → Confirm/Cancel | Never lose user work unexpectedly |
| **Beatmap file missing on level load** | **Show error in level list**: "Level X: Missing beatmap.json" → Skip level | Degrade gracefully, allow other levels to work |
| **Audio file fails to load** (corrupted MP3, file deleted) | **Show error in level list**: "Level X: Audio file corrupted or missing" → Skip level | Degrade gracefully, log error for debugging |
| **Settings file corrupted** | **Reset to defaults, show warning**: "Settings file corrupted. Restored defaults." | Prevent app crash, continue with sane defaults |
| **Scores file corrupted** | **Reset scores, show warning**: "Scores file corrupted. Best scores reset." | Prevent app crash, user can rebuild scores |
| **Canvas rendering fails** (hardware acceleration issue) | **Show critical error, exit gracefully**: "Graphics rendering failed. Game cannot start." | Cannot proceed without rendering |
| **Web Audio API unavailable** (unsupported platform) | **Show critical error, exit gracefully**: "Audio system unavailable. Game cannot start." | Cannot proceed without audio |
| **Disk full during save** | **Show error, retry option**: "Save failed: Disk full. Free up space and retry." | Allow user to fix issue and retry |
| **Write permission denied** | **Show error, suggest solution**: "Cannot save: Permission denied. Check folder permissions." | Inform user of OS-level issue |

### Error Categories

**Critical Errors** (prevent app from running):
- Canvas rendering unavailable
- Web Audio API unavailable
- No write access to application directory

**Degradable Errors** (affect specific features, app continues):
- Individual level files corrupted or missing
- Settings/scores file corrupted (reset to defaults)

**User-Preventable Errors** (strict validation):
- Invalid beatmap structure
- Unsupported file formats
- Invalid configuration (duplicate key bindings)

---

## 7. Testing Strategy

### Unit Testing
**Coverage Target**: Core timing logic, beatmap validation, accuracy calculation

**Key Test Suites**:
1. **Timing Window Classification**:
   - Test note hit at exact timestamp → Perfect
   - Test note hit at +40ms → Perfect
   - Test note hit at +60ms → Good
   - Test note hit at +110ms → Miss
   - Test edge cases (±50ms, ±100ms exactly)

2. **Hold Note Detection**:
   - Key pressed and held for exact duration → Success
   - Key released early → Miss
   - Key pressed late → Miss
   - Key held too long → Success (extra hold doesn't hurt)

3. **Accuracy Calculation**:
   - Test 10 hits out of 10 notes → 100.0%
   - Test 8 hits out of 10 notes → 80.0%
   - Test 0 hits out of 10 notes → 0.0%
   - Test rounding (e.g., 7/9 = 77.8%)

4. **Beatmap Validation**:
   - Valid beatmap → Load successfully
   - Missing required fields → Reject with error
   - Unsorted timestamps → Reject with error
   - Overlapping notes in same lane → Reject with error
   - Invalid note type → Reject with error

5. **Simultaneous Input**:
   - Two notes at T=2.5s (left + right), both keys pressed → Both hit
   - Two notes at T=2.5s, only left key pressed → Left hit, right miss

### Integration Testing
**Coverage Target**: Audio-visual synchronization, file I/O, state persistence

**Key Test Scenarios**:
1. **End-to-End Level Play**:
   - Load level → Play through → Verify score saved correctly
   - Play same level twice → Verify best score updates only on improvement
   - Play in practice mode → Verify score NOT saved

2. **Editor Workflows**:
   - Create beatmap via play-along → Verify JSON structure valid
   - Create beatmap via visual editor → Save → Load in game → Verify plays correctly
   - Edit existing beatmap → Save → Verify changes applied

3. **Settings Persistence**:
   - Change colors/keys/volume → Restart app → Verify settings retained
   - Corrupt settings file → Restart → Verify defaults restored

### Automated Timing Tests
**Coverage Target**: Audio-visual sync accuracy

**Approach**:
1. Create metronome test level (notes every 1 second at 60 BPM)
2. Simulate perfect keypresses at exact timestamps
3. Measure rendering timestamps when notes reach hit zone
4. Calculate deltas, flag any > ±10ms
5. Run test 10 times, verify consistent results

### Manual Playtesting
**Coverage Target**: Subjective "feel", usability, motivation

**Validation Goals**:
1. **Timing feels fair** (A3): No perceived lag or unfairness
2. **Minimal design works** (A1, A7): Focus stays on timing, no distractions
3. **2-button complexity right** (A2): Not too simple, not too complex
4. **Motivation sustained** (A4): Builder plays regularly for 2 weeks

**Process**:
- Builder plays all 10 starting levels
- Notes any perceived timing issues
- Tracks usage over 2-week period
- Validates assumptions A1, A2, A3, A4, A7

### Property-Based Testing
**Coverage Target**: Invariants (Section 4 Correctness Properties)

**Approach**:
1. For each correctness property, generate random test cases
2. Example: Property 1 (Timing Window Consistency)
   - Generate random note timestamp T
   - Generate random keypress offset O (-200ms to +200ms)
   - Verify classification matches expected category
3. Run 1000+ random test cases per property
4. Flag any violations

---

## 8. Next Steps

After approval of this design document:

1. **Run `/tech-stack`** to make detailed technology decisions:
   - Electron configuration
   - UI framework selection (React vs. Vue vs. Svelte)
   - Canvas rendering approach (library vs. vanilla)
   - State management pattern
   - Testing framework choices
   - Build and packaging process

2. **Generate implementation plan** using `/plan-phase` to break down build phases

3. **Begin development** with Phase 1: Core game engine and timing validation
