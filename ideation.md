# Ideation: Minimal 2-Key Rhythm Game

## Meta
- Status: Ready for Kickoff
- Last Updated: 2026-02-14
- Sessions: 1

## 1. Origin
- **Entry Type**: Solution
- **Initial Statement**: "I want to build a game for myself. It's roughly based off Guitar hero and dance dance revolution."
- **Refined Problem Statement**: Existing rhythm games (including Guitar Hero) have too much visual clutter and too many buttons, making it difficult to focus on the core timing mechanic and improve hand-eye coordination without cognitive overload.

## 2. Jobs to be Done
- **Primary Job**: Improve hand-eye coordination through rhythm-based timing challenges without visual or cognitive overwhelm
- **Related Jobs**:
  - Relax with music in a focused way
  - Practice reflexes during downtime
  - Have a casual activity for boredom or waiting time
- **Current Alternatives**:
  - Guitar Hero (correct mechanic but 5+ keys and excessive visual clutter)
  - Other rhythm games like DDR, Unbeatable, Geometry Dash (too many graphics, decorations obscure timing indicators)
  - Issue: Animation effects, background movement, decorative UI elements all make it hard to see WHEN to click
- **Switching Triggers**:
  - Frustration with visual noise in existing games
  - Desire for something simpler that focuses on pure timing mechanic
  - Want to practice coordination without decoding visual clutter

## 3. User Segments

### Segment 1: Solo User (Builder/Player)
- **Context**: Playing during downtime, when bored, when waiting, or when specifically wanting to practice hand-eye coordination
- **Motivation**:
  - Improve hand-eye coordination measurably over time
  - Relax with music without visual overwhelm
  - Challenge of mastering increasingly difficult songs
  - Satisfaction of having exactly the tool needed
  - Sense of progression and achievement
- **Ability Barriers**:
  - Timing detection must be precise (any lag or unfairness kills motivation)
  - Need visible progression system to maintain engagement
  - Adding new songs should be straightforward
  - Visual design must stay minimal (can't creep toward clutter)
- **Potential Prompts**:
  - "I'm bored and want something to do"
  - "I want to practice my reflexes for 10 minutes"
  - "I'm waiting and need a quick activity"
  - "Guitar Hero is too cluttered, I need something cleaner"

## 4. Market Landscape

### Direct Competitors
| Competitor | What They Do | Strengths | Weaknesses | Pricing |
|------------|--------------|-----------|------------|---------|
| Unbeatable | Two-button rhythm action game (2025) | Simple controls, satisfying mechanics | Still has visual effects and complexity | TBD (in development) |
| A Dance of Fire and Ice | One-button rhythm game with orbiting planets | Ultra-minimal controls, clean design | Only 1 button (may be too simple), stylized visuals | $3.99-$5.99 |
| osu! | Free rhythm game with mouse/tablet controls | Free, huge song library, active community | Complex UI, visual clutter, 3-4 "buttons" (mouse positions) | Free (optional $4.99/month supporter) |
| Clone Hero | Free Guitar Hero clone for PC | Free, customizable, huge song library | Still 5-button Guitar Hero layout | Free |
| Rhythm Doctor | One-button spacebar rhythm game | Simple control, clever mechanics | Visual complexity in presentation | ~$15 |

### Indirect Competitors
| Solution | How it's used for this job | Gap it leaves |
|----------|---------------------------|---------------|
| Reaction Time apps (RTap, Lights Out, etc.) | Mobile reflex training with color/tap tests | No music/rhythm component, not enjoyable as a game |
| Hand-eye coordination tests | Web-based coordination measurement | Pure testing, not training or fun |
| Lumosity brain training | Cognitive games including coordination | Gamified but not rhythm-based, subscription model |
| Guitar Hero (current solution) | Full rhythm game with coordination challenge | 5+ buttons, excessive visual clutter, requires special controller |

### Market Signals
- **Growth**: Rhythm game market valued at $2.5B in 2025, projected 12% CAGR to $7B by 2033
- **Mobile & VR**: Mobile rhythm gaming driving expansion; VR rhythm games (Beat Saber) achieving mainstream success
- **Accessibility**: 84% of users prefer minimalist interfaces; accessibility is cornerstone of 2025 UI/UX trends
- **Minimalism**: Overly complicated menus being replaced by clean, minimalist designs that reduce cognitive load
- **Indie Scene**: itch.io shows vibrant rhythm game experimentation, though market is oversaturated overall

### Opportunity Gaps
1. **Pure Minimalism Gap**: Even "simple" rhythm games (Unbeatable, ADOFAI) still have stylized visuals, effects, and aesthetic elements that create visual noise for someone wanting ONLY the timing mechanic
2. **2-Button Sweet Spot**: Gap between 1-button games (too simple) and 5+ button games (too complex) - a 2-button rhythm game hits the middle ground
3. **Training vs. Entertainment**: Reflex training apps are clinical/boring; rhythm games are entertaining but cluttered - no solution combines minimal training focus with music enjoyment
4. **Desktop-Native Simple Rhythm**: Most minimal rhythm games target mobile or use complex mouse controls (osu!) - keyboard-based 2-key desktop rhythm games are rare
5. **Personal Customization**: Commercial games are designed for broad audiences; there's no "build your own minimal rhythm trainer" option for personal use

## 5. Assumptions Log

| ID | Assumption | Category | Importance | Confidence | Evidence | Validation Strategy |
|----|------------|----------|------------|------------|----------|---------------------|
| A1 | Visual clutter significantly impairs focus on timing | Problem | High | Medium | User reports frustration with "all those" visual elements; market trends show 84% prefer minimal UI | Build minimal prototype and test if focus improves vs. Guitar Hero |
| A2 | 2 buttons is optimal for simplicity + engagement | Problem | Medium | Low | Games successfully use 1-8 buttons; no universal "optimal" exists | Prototype with 2 buttons, test if it feels too simple/complex |
| A3 | Lag/timing accuracy is primary technical barrier | Problem | High | Medium | User explicitly stated lag would kill motivation; rhythm games require precise timing | Test Web Audio API timing in early prototype, measure latency |
| A4 | User will maintain motivation for regular use | User | High | Medium | User wants this for hand-eye coordination training; casual players can stay motivated without progression | Build and use for 2 weeks, track actual usage patterns |
| A5 | Can implement with acceptable timing precision | User | High | Medium | Web Audio API provides low-latency precise timing; AudioBufferSourceNode designed for rhythm games | Technical spike: implement basic timing detection, measure accuracy |
| A6 | Adding new songs will be frequent need | User | Medium | Low | Unknown usage pattern for personal tool | Monitor song addition frequency after initial implementation |
| A7 | Minimal design solves cognitive overload | Solution | High | Medium | User reports clutter makes it "too hard to know when to click"; minimalism trend strong | A/B test: minimal UI vs. slightly decorated UI, measure preference |
| A8 | Progression system necessary for engagement | Solution | Low | Medium | Research shows casual players don't need progression; flow state drives engagement | Launch without progression, add only if motivation drops |
| A9 | Desktop/keyboard is right platform | Solution | Medium | Medium | User context is desktop use; keyboard allows precise timing | Start desktop-first, consider mobile later if needed |
| A10 | Personal tool, no market validation needed | Market | High | High | User explicitly building for self, not market | No validation needed - personal project |
| A11 | Existing solutions too complex to modify | Market | Medium | High | Commercial games have locked designs; open-source options (Clone Hero) still use 5-button layout | Verified through research; building custom is faster than modifying |

### Priority Matrix
- **Test First** (High Importance, Low Confidence): A2 (2-button optimal)
- **Validate Early** (High Importance, Medium Confidence): A1 (visual clutter), A3 (timing accuracy), A4 (motivation), A5 (implementation feasibility), A7 (minimal design)
- **Monitor** (High Importance, High Confidence): A10 (personal tool)
- **Validate Later** (Lower priority): A6 (song addition), A8 (progression), A9 (platform), A11 (existing solutions)

## 6. Solution Hypotheses

### Hypothesis 1: "Minimal Beat Trainer" (SELECTED)
- **Description**: A 2-key rhythm game with Guitar Hero-style vertical scrolling, radical visual minimalism, and progressive difficulty. Features two note types (tap and hold), customizable colors, and both pre-made and custom level support.
- **Key Features**:
  - **Visual Design**: Black background, white hit zones positioned 1/4 up the screen, customizable note colors (blue for tap notes, red for hold notes)
  - **Mechanics**: Two-lane scrolling with tap notes (single press, margin of error = note size) and hold notes (sustained press through entire note)
  - **Controls**: Two keyboard keys (e.g., D and K) for left/right lanes
  - **Feedback**: Minimal UI during gameplay (no distracting metrics), accuracy percentage and stats shown only at end of level
  - **Content**: 10 starting levels with progressive difficulty + ability to create custom levels
  - **Progression**: Typing trainer approach (start simple, build complexity) + music learning approach (practice mode to slow down songs 50-100%)
  - **Technology**: Web-based using HTML5 Canvas for rendering + Web Audio API for precise timing
- **Key Differentiator**: Combines radical visual minimalism with personal customization - no commercial rhythm game offers this level of stripped-down focus while supporting custom level creation
- **Target Segment**: Solo user (builder/player) wanting hand-eye coordination training without cognitive overwhelm
- **Validates Assumptions**: A1 (visual clutter impairs focus), A2 (2 buttons optimal), A3 (timing accuracy critical), A5 (can implement), A6 (song addition important), A7 (minimal design works)
- **Key Risks**:
  - Timing precision implementation (lag would kill motivation)
  - Level editor complexity vs. usability
  - Creating 10 quality starting levels takes significant time
  - Hold note implementation may be technically challenging
  - Custom beatmap format needs to be simple enough to hand-edit if needed
- **Prior Art & Lessons**:
  - PianoHero (keyboard rhythm game using Canvas + requestAnimationFrame at 60Hz)
  - rhy-game library (JavaScript rhythm framework with lane-based charts)
  - Multiple devs cite "timing synchronization of visuals, input, and audio" as the hardest problem
  - Web Audio API's precise scheduling is proven solution for timing issues
  - Hold notes require tracking press duration + visual feedback - doable but needs care
  - Simple JSON beatmap formats work well (timestamp + lane + type + duration)

### Hypothesis 2: "Pure Minimalist MVP" (Alternative - Start Simpler)
- **Description**: Simplified version of H1 for fastest validation - tap notes only, no holds, no practice mode, 1-3 songs to start
- **Key Differentiator**: Fastest path to validating timing accuracy and 2-button feel
- **Validates Assumptions**: A2, A3, A5, A7
- **Key Risks**: May feel too simple/boring; doesn't test hold notes or progression
- **Recommendation**: Consider this as Phase 1 if timing implementation proves difficult

### Hypothesis 3: "Feature-Rich Trainer" (Alternative - More Features)
- **Description**: H1 plus auto-beatmap generation from MP3s, adaptive difficulty, detailed analytics, multiple themes
- **Key Differentiator**: Smart training features without visual clutter
- **Validates Assumptions**: A4 (motivation), A6 (easy song addition)
- **Key Risks**: Scope creep, AI beatmap quality varies, defeats "just play" simplicity
- **Prior Art**: Beat Sage auto-generates Beat Saber maps but quality is inconsistent
- **Recommendation**: Add these features AFTER core works, only if desired

### Recommendation
**Pursue Hypothesis 1 ("Minimal Beat Trainer")** because:
1. **Addresses core opportunity gaps**: Delivers the pure minimalism and 2-button sweet spot missing from market
2. **Validates highest-risk assumptions early**: Tests timing accuracy (A3), 2-button optimality (A2), and implementation feasibility (A5) immediately
3. **Best fit for user needs**: Personal training tool with customization matches solo user segment perfectly
4. **Proven technical foundation**: Web Audio API + Canvas approach has multiple successful precedents
5. **Balances simplicity and features**: Enough complexity (holds, practice mode, custom levels) to maintain long-term engagement without cluttering the core experience

**Critical path to validate assumptions:**
1. **Week 1-2**: Build minimal playable (tap notes only) to test timing precision (A3, A5)
2. **Week 3**: Add hold notes and test 2-button feel (A2)
3. **Week 4**: Create level editor and first 3 levels (A6)
4. **Week 5-6**: Complete 10 starting levels and practice mode
5. **Week 7-8**: Use daily for 2 weeks to validate motivation (A4) and minimal design (A1, A7)

**Key risks to monitor:**
- Timing lag/unfairness (immediate dealbreaker - test first)
- Hold note implementation complexity
- Level creation tedium (may need better tooling)
- Motivation drop after initial novelty (track usage patterns)

## 7. Open Questions for /kickoff

### Requirements Questions
- [ ] **Level editor approach**: Manual JSON editing, visual drag-and-drop editor, or play-along recording mode?
- [ ] **Editor integration**: Built into the game or separate tool?
- [ ] **Song selection for 10 starting levels**: Royalty-free music libraries? Public domain? User preference genres?
- [ ] **Starting level duration**: 30-60 second snippets or full 2-3 minute songs?
- [ ] **Difficulty progression curve**: How should the 10 levels progress? (e.g., 1-3 tap only slow, 4-6 introduce holds medium, 7-10 mixed fast)
- [ ] **Level selection UI**: Menu screen with level list? How to show difficulty/stats?
- [ ] **Settings/preferences**: Which colors for notes? Which keys to bind? Volume control?
- [ ] **Practice mode details**: Speed range (50-100%)? Visual indicators for slowed tempo?

### Technical Questions
- [ ] **Beatmap format specification**: JSON structure for notes (timestamp, lane, type, duration for holds)?
- [ ] **Audio file format support**: MP3 only? Also WAV, OGG?
- [ ] **Timing synchronization approach**: How to sync audio playback with note scrolling?
- [ ] **File organization structure**: Directory layout for songs (e.g., `/songs/[name]/audio.mp3 + beatmap.json`)?
- [ ] **Beatmap validation**: How to validate/sanitize user-created beatmaps?
- [ ] **Storage approach**: Local filesystem? Browser IndexedDB? LocalStorage?
- [ ] **Rendering performance**: Canvas optimization for smooth 60fps scrolling?
- [ ] **Input handling**: Keydown/keyup events - how to handle key repeat/ghosting?

### Implementation Priorities
- [ ] **Build order**: Core timing engine first, or beatmap editor first?
- [ ] **Testing strategy**: How to validate timing accuracy early? Metronome test?
- [ ] **Framework choices**: Pure vanilla JS or use libraries? Which Canvas utilities?
- [ ] **Beatmap creation workflow**: Create 10 levels manually first or build editor first?
- [ ] **Development platform**: Web-first for easy iteration, or desktop app?

### User Experience Questions
- [ ] **Feedback on missed notes**: Visual indication (flash red)? Audio feedback (miss sound)? Both? Neither?
- [ ] **Scoring system**: Accuracy percentage only? Also combo counter? Score?
- [ ] **End-of-level screen**: Which stats to show? (Accuracy, hits/misses, max combo, grade?)
- [ ] **Visual customization scope**: Just note colors or also background, hit zone style?
- [ ] **Accessibility considerations**: Colorblind mode? Adjustable note speed independent of music?

## 8. Research Log
| Date | Topic | Source | Key Findings |
|------|-------|--------|--------------|
| 2026-02-14 | Landscape scan - simple rhythm games | Web search | Found Unbeatable (2-button, 2025), Geometry Dash (1-button), Rhythm Doctor (1-button spacebar). Validates niche for minimalist rhythm games. |
| 2026-02-14 | Pain point validation - Guitar Hero difficulty | Web search | Confirmed Guitar Hero Easy mode uses minimum 3 frets, aligning with user frustration about button complexity from level 1. |
| 2026-02-14 | Beginner-friendly rhythm games | Web search | Beat Saber, Friday Night Funkin', Taiko no Tatsujin noted as "easy to learn, hard to master" - but user confirms these still have too much visual clutter. |
| 2026-02-14 | Competitive analysis - minimal rhythm games | Web search | Two-button rhythm games exist (Unbeatable, itch.io catalog); clean UI examples (World Dai Star); accessibility trends in 2025 UI/UX |
| 2026-02-14 | Hand-eye coordination training evidence | Web search | Rhythm games proven to improve coordination, reflexes, and motor skills; VR studies show measurable improvements in reaction time |
| 2026-02-14 | Reflex training alternatives | Web search | RTap, Reaction Time apps, Lumosity exist for coordination training but lack music/rhythm component that makes practice enjoyable |
| 2026-02-14 | Guitar Hero alternatives analysis | Web search | Clone Hero (free 5-button), osu! (free mouse-based), Tap Tap Revenge (mobile tap) - none hit 2-button minimal desktop sweet spot |
| 2026-02-14 | Market trends - rhythm games | Web search | $2.5B market in 2025, 12% CAGR to $7B by 2033; mobile/VR driving growth; accessibility and minimalism are key 2025 UI trends |
| 2026-02-14 | Indie rhythm game landscape | Web search | itch.io shows vibrant experimentation with hybrid genres; market oversaturated but niches exist; one-button and two-button tags active |
| 2026-02-14 | Pricing models - rhythm games | Web search | osu! free with optional $5/month supporter; Clone Hero free; ADOFAI $4-6; most minimal games use free or low-cost models |
| 2026-02-14 | Assumption validation - button count | Web search | No universal "optimal" button count; games successfully use 1-8 buttons; depends on design goals and target audience |
| 2026-02-14 | Assumption validation - timing implementation | Web search | Web Audio API provides low-latency precise timing specifically for rhythm games; AudioBufferSourceNode designed for timing-critical audio |
| 2026-02-14 | Assumption validation - progression systems | Web search | Casual players don't require progression; can stay at same level for years; engagement comes from flow state and fun, not just advancement |
| 2026-02-14 | Prior art - web rhythm game development | Web search | Found rhy-game library, PianoHero, JS Hero, multiple GitHub examples; web-based rhythm games are proven feasible with HTML5 Canvas + Web Audio API |
| 2026-02-14 | Prior art - hold note implementation | Web search | Hold notes require tracking button press duration and visual feedback; timing synchronization is key challenge; multiple successful implementations exist |
| 2026-02-14 | Prior art - Guitar Hero clones in JavaScript | Web search | PianoHero uses Canvas + requestAnimationFrame at 60Hz; JS Hero uses vanilla JavaScript; "hidden complexity is synchronizing timing of visuals, input, and audio" |
| 2026-02-14 | Prior art - beatmap/chart formats | Web search | Simple lane-based JSON formats work well; can include timestamp + lane + note type + duration; AI beatmap generation exists but quality varies |
