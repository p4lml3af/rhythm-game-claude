# Requirements: Minimal 2-Key Rhythm Game

## 1. Introduction

### Project Context
This is a personal desktop rhythm game designed to improve hand-eye coordination through rhythm-based timing challenges without visual or cognitive overwhelm. The project addresses a specific pain point: existing rhythm games (Guitar Hero, DDR, osu!) have excessive visual clutter and too many buttons, making it difficult to focus on the core timing mechanic.

### What We're Building
A 2-key rhythm game with Guitar Hero-style vertical scrolling, featuring radical visual minimalism, progressive difficulty, and custom level support. The game will be packaged as a desktop application using web technologies (HTML5 Canvas for rendering, Web Audio API for precise timing, framework-based UI).

### Target User
Solo user (builder/player) who wants to:
- Improve hand-eye coordination measurably over time
- Relax with music without visual overwhelm
- Practice reflexes during downtime, boredom, or waiting time
- Experience progression and mastery without cognitive overload

### Why This Exists
Current alternatives either:
- Have too many buttons (Guitar Hero's 5+ keys, Clone Hero)
- Have too much visual clutter (animations, effects, decorative UI in most rhythm games)
- Are too simple (1-button games like Rhythm Doctor)
- Use complex controls (mouse-based like osu!)

This game fills the gap between 1-button games (too simple) and 5+ button games (too complex), providing a pure focus on timing mechanics with minimal distractions.

---

## 2. Glossary

**Beatmap**: A JSON file containing the note chart for a level, including timestamps, lane assignments, note types, and hold durations.

**Canvas**: HTML5 Canvas API used for rendering the game graphics (note scrolling, hit zones, UI elements).

**Good Hit**: A note hit within ±100ms of the perfect timing window (successful but not perfect).

**Hit Zone**: The white horizontal zones positioned 1/4 up from the bottom of the screen where notes must be pressed.

**Hold Note**: A note that requires the player to press and hold the key for a specific duration.

**Lane**: One of two vertical columns (left or right) down which notes scroll.

**Level**: A playable song with an associated beatmap, consisting of audio file (MP3) and beatmap file (JSON).

**Perfect Hit**: A note hit within ±50ms of the exact target timestamp (highest accuracy).

**Practice Mode**: A mode where note speed can be adjusted (50-100%) without affecting accuracy records, used for learning difficult sections.

**Tap Note**: A note that requires a single keypress at a specific moment.

**Timing Window**: The acceptable margin of error for hitting a note (±50ms for perfect, ±100ms for good).

**Web Audio API**: Browser API providing low-latency, precise audio timing specifically designed for rhythm games.

---

## 3. Requirements

### Requirement 1: Core Gameplay - Two-Lane Note Scrolling
**Traces to**: A1 (visual clutter impairs focus), A2 (2 buttons optimal), A7 (minimal design solves cognitive overload)

**User Story**: As a player, I want notes to scroll down two clean vertical lanes without visual clutter, so that I can focus entirely on timing without distraction.

**Acceptance Criteria**:
1. THE System SHALL render exactly two vertical lanes (left and right) on a solid background color.
2. THE System SHALL position hit zones at 1/4 up from the bottom of the screen (white horizontal zones).
3. THE System SHALL scroll notes downward from top to bottom at a consistent speed synchronized with the audio.
4. THE System SHALL display no decorative elements, animations, or visual effects during gameplay except notes and hit zones.
5. THE System SHALL maintain 60fps rendering performance during gameplay.

---

### Requirement 2: Note Types - Tap and Hold
**Traces to**: A2 (2 buttons optimal), A5 (can implement with acceptable timing precision)

**User Story**: As a player, I want two distinct note types (tap and hold) so that gameplay has variety while remaining simple.

**Acceptance Criteria**:
1. THE System SHALL support tap notes that require a single keypress at the moment the note reaches the hit zone.
2. THE System SHALL support hold notes that require pressing and holding a key for the note's entire duration.
3. THE System SHALL visually distinguish tap notes from hold notes using different colors (customizable by user).
4. THE System SHALL register a hold note as successful only if the key is pressed when the note enters the hit zone AND held until the note exits the hit zone.
5. THE System SHALL ignore key repeats (keyboard auto-repeat) for tap notes, registering only the initial keydown event.

---

### Requirement 3: Timing Detection - Three-Tier Precision
**Traces to**: A3 (timing accuracy is primary technical barrier), A5 (can implement with acceptable timing precision)

**User Story**: As a player, I want precise timing detection with clear thresholds for perfect vs. good hits, so that I can measure and improve my accuracy.

**Acceptance Criteria**:
1. THE System SHALL classify note hits into three categories:
   - **Perfect Hit**: Keypress within ±50ms of the note's target timestamp
   - **Good Hit**: Keypress within ±100ms of the note's target timestamp (but outside ±50ms)
   - **Miss**: Keypress outside ±100ms or no keypress
2. THE System SHALL only register keypresses that occur while a note is within the hit zone (no early key queuing).
3. THE System SHALL allow simultaneous keypresses for both lanes when notes overlap in time.
4. THE System SHALL use Web Audio API's precise timing to synchronize audio playback with note scrolling within ±10ms accuracy.
5. THE System SHALL update the live accuracy percentage immediately after each note is resolved.

---

### Requirement 4: Real-Time Feedback - Minimal Display
**Traces to**: A1 (visual clutter impairs focus), A7 (minimal design solves cognitive overload)

**User Story**: As a player, I want minimal real-time feedback during gameplay, so that I stay focused on timing without distractions.

**Acceptance Criteria**:
1. THE System SHALL display only a live accuracy percentage at the bottom center of the screen during gameplay.
2. THE System SHALL NOT display hit/miss indicators, combo counters, or score during gameplay.
3. THE System SHALL NOT play audio feedback sounds for misses.
4. THE System SHALL NOT show visual effects (flashes, color changes) when notes are missed.
5. THE System SHALL update the accuracy percentage after each note is resolved (hit or miss).

---

### Requirement 5: End-of-Level Results
**Traces to**: A4 (user will maintain motivation for regular use)

**User Story**: As a player, I want detailed statistics at the end of each level, so that I can track my improvement over time.

**Acceptance Criteria**:
1. THE System SHALL display an end-of-level screen showing:
   - Final accuracy percentage
   - Max combo (longest streak of consecutive successful hits)
   - Perfect hits count (number of notes hit within ±50ms)
   - Comparison to personal best ("New best!" or "Previous best: X%")
2. THE System SHALL save the best accuracy percentage for each level persistently.
3. THE System SHALL NOT display good hits count separately (only perfect hits).
4. THE System SHALL NOT display individual hit/miss breakdown on the results screen.

---

### Requirement 6: Ten Progressive Starting Levels
**Traces to**: A4 (user will maintain motivation for regular use), A6 (adding new songs will be frequent need)

**User Story**: As a player, I want 10 starting levels with progressive difficulty, so that I can build skills gradually from beginner to advanced.

**Acceptance Criteria**:
1. THE System SHALL include 10 pre-made levels with the following progression:
   - **Levels 1-3**: Tap notes only, slow tempo, single lane focus
   - **Levels 4-6**: Introduce hold notes, medium tempo, both lanes active
   - **Levels 7-8**: Mixed tap/hold, faster tempo, more complex patterns
   - **Levels 9-10**: Advanced patterns, high tempo, challenging combinations
2. THE System SHALL use royalty-free instrumental music (no vocals) with varied energy levels (chill, electronic, high-energy).
3. THE System SHALL provide levels with durations between 1-3 minutes each.
4. THE System SHALL make all 10 levels immediately available (no unlocking required).

---

### Requirement 7: Level Selection Interface
**Traces to**: A7 (minimal design solves cognitive overload)

**User Story**: As a player, I want a simple level selection menu, so that I can quickly choose a level and start playing.

**Acceptance Criteria**:
1. THE System SHALL display levels in a simple list menu format.
2. THE System SHALL show each level's best accuracy percentage (or "Not played yet" if never attempted).
3. THE System SHALL allow selecting any level at any time (all levels unlocked from start).
4. THE System SHALL NOT display difficulty ratings, stars, or grades in the level list.

---

### Requirement 8: Practice Mode - Adjustable Speed
**Traces to**: A4 (user will maintain motivation for regular use), A6 (adding new songs will be frequent need)

**User Story**: As a player, I want to slow down difficult songs in practice mode, so that I can learn complex patterns before attempting them at full speed.

**Acceptance Criteria**:
1. THE System SHALL provide a practice mode toggle for each level.
2. THE System SHALL allow adjusting note speed via slider control from 50% to 100% in practice mode.
3. THE System SHALL display a red indicator button at the top left of the screen when practice mode is active.
4. THE System SHALL NOT save accuracy scores or update personal bests when practice mode is active.
5. THE System SHALL adjust both audio playback speed and note scroll speed proportionally when practice mode speed is changed.

---

### Requirement 9: Visual Customization
**Traces to**: A7 (minimal design solves cognitive overload), A9 (desktop/keyboard is right platform)

**User Story**: As a player, I want to customize visual colors, so that I can personalize the game without compromising minimalism.

**Acceptance Criteria**:
1. THE System SHALL allow customizing tap note color (default: blue).
2. THE System SHALL allow customizing hold note color (default: red).
3. THE System SHALL allow customizing background color (default: black).
4. THE System SHALL allow customizing UI text color (default: white).
5. THE System SHALL NOT allow customizing hit zone appearance (stays white).
6. THE System SHALL save color preferences persistently.

---

### Requirement 10: Input Customization
**Traces to**: A9 (desktop/keyboard is right platform)

**User Story**: As a player, I want to customize key bindings and volume, so that the game fits my preferred setup.

**Acceptance Criteria**:
1. THE System SHALL allow rebinding the left lane key (default: D).
2. THE System SHALL allow rebinding the right lane key (default: K).
3. THE System SHALL provide a master volume slider (0-100%).
4. THE System SHALL save input and volume preferences persistently.
5. THE System SHALL prevent binding the same key to both lanes.

---

### Requirement 11: Custom Level Support - Editor Integration
**Traces to**: A6 (adding new songs will be frequent need), A10 (personal tool, no market validation needed)

**User Story**: As a player, I want to create custom beatmaps for my own songs, so that I can expand the game indefinitely with music I enjoy.

**Acceptance Criteria**:
1. THE System SHALL include a built-in level editor accessible from the main menu.
2. THE System SHALL support two beatmap creation modes:
   - **Visual drag-and-drop editor**: Place notes on a timeline by clicking/dragging
   - **Play-along recording mode**: Record keypresses while playing along to a song, generating a beatmap automatically
3. THE System SHALL allow saving custom beatmaps to the local file system.
4. THE System SHALL allow loading custom beatmaps into the game for regular play.
5. THE System SHALL allow editing existing beatmaps (both starter levels and custom levels) in the visual editor.

---

### Requirement 12: Beatmap File Format
**Traces to**: A5 (can implement with acceptable timing precision), A6 (adding new songs will be frequent need)

**User Story**: As a player creating custom levels, I want a simple, human-readable beatmap format, so that I can understand and manually edit beatmaps if needed.

**Acceptance Criteria**:
1. THE System SHALL store beatmaps as JSON files with the following structure:
   ```json
   {
     "songTitle": "Level Name",
     "audioFile": "song.mp3",
     "bpm": 120,
     "duration": 180,
     "notes": [
       {
         "timestamp": 2.5,
         "lane": "left",
         "type": "tap"
       },
       {
         "timestamp": 5.0,
         "lane": "right",
         "type": "hold",
         "duration": 1.5
       }
     ]
   }
   ```
2. THE System SHALL use absolute timestamps (seconds from song start) for note timing.
3. THE System SHALL support "left" and "right" lane values.
4. THE System SHALL support "tap" and "hold" note types.
5. THE System SHALL require a "duration" field (in seconds) for hold notes.
6. THE System SHALL perform strict validation on beatmap files, rejecting invalid files with clear error messages.

---

### Requirement 13: File Organization
**Traces to**: A6 (adding new songs will be frequent need)

**User Story**: As a player creating custom levels, I want a clear file structure, so that I can easily organize and manage songs.

**Acceptance Criteria**:
1. THE System SHALL organize levels in a `/songs/` directory with subfolders per level:
   ```
   /songs/
     /level-01-chill-vibes/
       audio.mp3
       beatmap.json
     /custom-my-song/
       audio.mp3
       beatmap.json
   ```
2. THE System SHALL support MP3 audio format only.
3. THE System SHALL require each level folder to contain exactly one `audio.mp3` and one `beatmap.json`.
4. THE System SHALL scan the `/songs/` directory on startup and load all valid levels.

---

### Requirement 14: Local File Storage
**Traces to**: A9 (desktop/keyboard is right platform), A10 (personal tool, no market validation needed)

**User Story**: As a player, I want my settings and scores saved locally, so that my progress persists between sessions without requiring cloud services.

**Acceptance Criteria**:
1. THE System SHALL save settings (colors, key bindings, volume) to local files on the desktop file system.
2. THE System SHALL save best accuracy scores for each level to local files.
3. THE System SHALL load settings and scores on application startup.
4. THE System SHALL NOT require internet connectivity to save or load data.

---

### Requirement 15: Desktop Application Platform
**Traces to**: A9 (desktop/keyboard is right platform), A10 (personal tool, no market validation needed)

**User Story**: As a player, I want a standalone desktop application, so that I can play offline without browser limitations.

**Acceptance Criteria**:
1. THE System SHALL be packaged as a desktop application (using Electron or similar framework).
2. THE System SHALL run offline without requiring internet connectivity.
3. THE System SHALL use HTML5 Canvas for game rendering.
4. THE System SHALL use Web Audio API for audio playback and timing.
5. THE System SHALL use a framework-based UI (React or similar) for menus and settings.

---

### Requirement 16: Timing Validation - Automated Testing
**Traces to**: A3 (timing accuracy is primary technical barrier), A5 (can implement with acceptable timing precision)

**User Story**: As a developer (player), I want automated timing tests, so that I can objectively measure and validate timing accuracy.

**Acceptance Criteria**:
1. THE System SHALL include an automated timing test mode that simulates perfect keypresses.
2. THE System SHALL measure and report timing delay/lag between audio playback and note rendering.
3. THE System SHALL flag timing inaccuracies greater than ±10ms.
4. THE System SHALL allow manual playtesting alongside automated tests.

---

## 4. Traceability Matrix

| Requirement | Assumption(s) Addressed |
|-------------|------------------------|
| REQ-1: Two-Lane Note Scrolling | A1, A2, A7 |
| REQ-2: Note Types | A2, A5 |
| REQ-3: Timing Detection | A3, A5 |
| REQ-4: Real-Time Feedback | A1, A7 |
| REQ-5: End-of-Level Results | A4 |
| REQ-6: Ten Starting Levels | A4, A6 |
| REQ-7: Level Selection | A7 |
| REQ-8: Practice Mode | A4, A6 |
| REQ-9: Visual Customization | A7, A9 |
| REQ-10: Input Customization | A9 |
| REQ-11: Custom Level Support | A6, A10 |
| REQ-12: Beatmap Format | A5, A6 |
| REQ-13: File Organization | A6 |
| REQ-14: Local File Storage | A9, A10 |
| REQ-15: Desktop Platform | A9, A10 |
| REQ-16: Timing Validation | A3, A5 |

---

## 5. Success Criteria

The project will be considered successful when:

1. **Core Functionality**: All 10 starting levels are playable with accurate timing (±10ms synchronization).
2. **Timing Validation**: Automated timing tests pass with no lag detected, and manual playtesting confirms the game "feels fair."
3. **Editor Functionality**: Both visual editor and play-along recording mode can create valid beatmaps that play correctly.
4. **Customization**: All settings (colors, keys, volume, practice speed) save and load correctly.
5. **Personal Use Goal**: The builder uses the game regularly for 2 weeks to validate motivation (A4) and minimal design effectiveness (A1, A7).

---

## 6. Out of Scope (For Initial Release)

The following are explicitly not included in the initial version:

- Mobile or web browser versions (desktop only)
- Multiplayer or online features
- Auto-beatmap generation from MP3 files
- Advanced analytics or statistics tracking
- Multiple visual themes or skins
- Achievement system or progression unlocks
- Audio formats other than MP3 (no WAV, OGG support)
- Cloud save synchronization
- Leaderboards or score sharing
