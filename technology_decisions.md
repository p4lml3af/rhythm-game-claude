# Technology Stack Decisions

## Purpose
This document records all technology choices for the Minimal 2-Key Rhythm Game project, including rationale, tradeoffs, and dependencies between decisions.

## Decision-Making Philosophy
- **Timing precision is non-negotiable**: Any choice that could introduce lag or timing inaccuracy is rejected
- **Offline-first**: No cloud dependencies, all data stored locally
- **Simple over clever**: Choose proven, stable technologies over cutting-edge
- **Performance over features**: 60fps rendering is more important than fancy UI
- **Developer experience matters**: This is a solo project, so setup complexity and debugging matter

## Confirmed Constraints
- **Platform**: Desktop application (Windows 10 currently, cross-platform desirable)
- **Rendering**: HTML5 Canvas required for game graphics
- **Audio**: Web Audio API required for precise timing (±10ms target)
- **File Format**: MP3 audio files only
- **Storage**: Local file system (no database, no cloud)
- **Performance Target**: 60fps rendering during gameplay

---

## Decision Log

### Decision 1: Desktop Framework - Electron
**Date**: 2026-02-14

**Options Considered**:
- **Electron** (SELECTED): Mature framework bundling Chromium + Node.js
- Tauri: Lightweight alternative using system browser
- NW.js: Similar to Electron but less popular

**Rationale**:
- Mature ecosystem (13+ years) provides extensive documentation and community support
- Excellent developer experience with hot reloading and debugging tools
- Straightforward file system access via Node.js APIs for songs, beatmaps, settings, and scores
- Cross-platform support (Windows/Mac/Linux) without code changes
- Well-documented integration with modern frontend frameworks
- Solo developer benefits from "ググればわかる" (searchable solutions) ecosystem

**Key Tradeoffs Accepted**:
- App size: ~150-200MB (acceptable for desktop distribution)
- Memory usage: 80-120MB RAM (acceptable for modern systems)
- Startup time: 2-3 seconds (acceptable for a game that runs for extended sessions)

**Dependencies**:
- Node.js required for development
- Chromium provides Web Audio API and Canvas support (critical for timing and rendering)

**Environment Notes**:
- Currently developing on Windows 10
- Cross-platform capability preserved for future Mac/Linux distribution if desired

---

### Decision 2: Frontend Framework - React
**Date**: 2026-02-14

**Options Considered**:
- **React** (SELECTED): Industry-standard component-based UI framework
- Svelte: Compiler-based framework with simpler syntax
- Vue: Middle-ground framework with gentle learning curve
- Vanilla JavaScript: No framework approach

**Rationale**:
- Massive ecosystem provides extensive examples for Electron integration
- Abundant component libraries (shadcn/ui, Radix) for settings UI, sliders, modals, form inputs
- Largest community support - virtually every implementation question has documented answers
- Excellent Canvas integration - Canvas can render inside React components without conflicts
- Multiple state management options available (important for game state, editor state, settings)
- Proven track record with timing-critical applications

**Key Tradeoffs Accepted**:
- Larger bundle size (~140KB) compared to Svelte (minimal impact in Electron app)
- Steeper initial learning curve with hooks (useState, useEffect, useRef)
- More boilerplate code compared to Svelte

**Dependencies**:
- Node.js and npm for package management
- Will need React 18+ for concurrent features
- Requires bundler (Vite or Webpack) - to be decided in build tooling

**Integration Notes**:
- Canvas game rendering will be isolated in React component with useRef hook
- UI components (menus, settings, editor) built with React
- Game loop runs independently of React render cycle (requestAnimationFrame)

---

### Decision 3: Canvas Rendering - Vanilla Canvas API
**Date**: 2026-02-14

**Options Considered**:
- **Vanilla Canvas API** (SELECTED): Direct browser Canvas API usage
- Pixi.js: WebGL-accelerated 2D rendering library
- Konva: High-level Canvas wrapper with object model

**Rationale**:
- Simple graphics (rectangles for notes, lines for lanes, text) don't require library abstractions
- Direct control maximizes timing precision - no framework layer between code and rendering
- Easier debugging for timing issues (±10ms target) with fewer abstraction layers
- Zero additional bundle size beyond game code
- Excellent performance for ~20-50 visible notes at 60fps
- Canvas API is straightforward: `fillRect`, `fillText`, `clearRect` cover all needs

**Key Tradeoffs Accepted**:
- Manual positioning math (calculating note Y position from timestamp and scroll speed)
- No built-in sprite management or animation helpers
- More manual code for drawing each frame

**Dependencies**:
- HTML5 Canvas API (built into Chromium via Electron)
- Will use `requestAnimationFrame` for 60fps game loop
- React useRef hook to access Canvas element

**Implementation Notes**:
- Game loop: `requestAnimationFrame` → calculate note positions → clear canvas → draw notes/lanes/UI
- Timing synchronization: Web Audio API `currentTime` drives note position calculations
- Editor can use same Canvas approach or add library later if drag-and-drop complexity requires it

---

### Decision 4: State Management - Zustand
**Date**: 2026-02-14

**Options Considered**:
- **Zustand** (SELECTED): Lightweight (3KB) state management library
- React Context API: Built-in global state solution
- React useState + Props: Simplest approach with no dependencies
- Redux Toolkit: Enterprise-level state management

**Rationale**:
- Simple API feels natural coming from useState but works globally
- Excellent performance - only re-renders components using changed state (critical for 60fps game loop)
- No provider wrapping needed - just import and use hooks anywhere
- Built-in persistence middleware easily adapted for file system (settings.json, scores.json)
- Small bundle size (3KB) has negligible impact
- Popular in React game development for performance reasons
- 10-minute learning curve with extensive documentation

**Key Tradeoffs Accepted**:
- Additional dependency (3KB)
- Different mental model from pure React (though very similar to useState)

**Dependencies**:
- zustand npm package
- Will use persist middleware for auto-saving to files

**State Structure**:
```javascript
// Game settings
colors: { tap, hold, background, text }
keyBindings: { left, right }
volume: number

// Scores
bestScores: { [levelId]: accuracyPercentage }

// Current game state
currentLevel: levelData | null
isPracticeMode: boolean
practiceSpeed: number (0.5 to 1.0)

// Editor state
editingBeatmap: beatmapData | null
editorTimestamp: number
```

**Integration Notes**:
- Electron's fs module will read/write JSON files on startup/shutdown
- Zustand persist middleware triggers file writes on state changes
- Game loop accesses Zustand state but doesn't trigger re-renders (read directly, no hooks in game loop)

---

### Decision 5: Build Tooling - Vite + electron-vite
**Date**: 2026-02-14

**Options Considered**:
- **Vite + electron-vite** (SELECTED): Modern build tool with Electron integration
- Webpack: Traditional bundler with mature ecosystem
- electron-forge + Vite: Official Electron tooling with Vite plugin

**Rationale**:
- Blazing fast Hot Module Replacement (<100ms) - critical for iterating on timing and visual tweaks
- Simple configuration with minimal setup (5 minutes vs 30+ for Webpack)
- electron-vite handles main process + renderer process bundling automatically
- Fast production builds (3-5x faster than Webpack)
- Excellent developer experience with clear error messages and clean console output
- Native ESM support uses modern JavaScript features
- Growing ecosystem becoming standard for React apps
- Can add electron-builder or electron-forge later for distribution

**Key Tradeoffs Accepted**:
- Newer than Webpack (2020 vs 2012) though very stable now
- Different config syntax from Webpack (but simpler)

**Dependencies**:
- vite npm package
- electron-vite npm package for Electron integration
- @vitejs/plugin-react for React support

**Development Workflow**:
```bash
npm run dev      # Starts Vite dev server + Electron window
# Save file → instant HMR in <100ms
npm run build    # Production build
npm run preview  # Test production build locally
```

**Performance Impact**:
- Dev server startup: 1-2 seconds
- Hot reload: <100ms per change
- Production build: ~10-20 seconds for full app

---

### Decision 6: Testing Framework - Vitest
**Date**: 2026-02-14

**Options Considered**:
- **Vitest** (SELECTED): Vite-native testing framework
- Jest: Industry-standard testing framework
- Playwright: End-to-end browser automation (considered for later)

**Rationale**:
- Native Vite integration - uses same config and plugins, zero configuration friction
- Extremely fast test execution with HMR - re-runs instantly on file save
- Perfect for timing validation tests required by REQ-16 (±10ms synchronization)
- Jest-compatible API (describe, it, expect) for familiar syntax
- Built-in mocking for Web Audio API, Canvas, timers, and file system
- Watch mode auto-runs affected tests during development
- Built-in code coverage reports with c8
- Ideal for unit testing timing logic, accuracy calculations, beatmap validation

**Key Tradeoffs Accepted**:
- Newer than Jest (2021 vs 2016) though very stable
- Smaller plugin ecosystem than Jest (most Jest plugins work)

**Dependencies**:
- vitest npm package
- @vitest/ui for browser-based test UI (optional)
- happy-dom or jsdom for DOM testing

**Test Coverage Plan**:
```javascript
// Unit Tests
- Timing window classification (±50ms perfect, ±100ms good)
- Accuracy percentage calculation formulas
- Hold note duration detection
- Beatmap validation (sorted timestamps, no lane overlaps)
- Simultaneous input handling (both lanes)

// Integration Tests
- Audio-visual synchronization logic (mock Web Audio API)
- Settings persistence (mock file system)
- Score saving and loading

// Automated Timing Tests (REQ-16)
- Mock Web Audio currentTime and Canvas timestamps
- Simulate note rendering at exact timestamps
- Measure calculated positions vs expected
- Flag any deltas exceeding ±10ms threshold
```

**Environment Notes**:
- Tests run in Node.js environment with mocked browser APIs
- Can add Playwright later for full Electron E2E testing if needed

---

### Decision 7: UI Components & Design Foundation - Radix UI Primitives
**Date**: 2026-02-14

**Options Considered**:
- **Radix UI Primitives** (SELECTED): Unstyled, accessible component primitives
- shadcn/ui: Pre-styled components with Tailwind CSS
- Plain HTML/CSS: Zero dependencies, manual implementation
- Material-UI/Ant Design: Full design systems (rejected as too heavy)

**Rationale**:
- Aligns with "radical minimalism" design principle - no default styling to fight against
- Provides accessible primitives (keyboard navigation, ARIA) with zero visual opinion
- Lightweight - only JavaScript behavior, no CSS bundle
- Perfect for minimal aesthetic - complete control over every pixel
- Excellent primitives for needed components: Slider, Dialog, Select, RadioGroup
- Smaller bundle than full component libraries (~20KB vs 300KB+)

**Key Tradeoffs Accepted**:
- Must write all custom CSS for styling
- More work than pre-styled components (but maintains minimal vision)
- Additional dependency vs plain HTML (but gains accessibility for free)

**Dependencies**:
- @radix-ui/react-slider (for volume, practice speed)
- @radix-ui/react-dialog (for settings modals)
- @radix-ui/react-select (if needed for level selection)
- Custom CSS for minimal styling

**UI Foundation Specifications**:

**Accessibility Baseline**:
- Basic keyboard navigation enabled (arrow keys in menus, Enter to select, Escape to close)
- Radix primitives provide ARIA attributes automatically
- Not targeting full WCAG AA compliance (personal tool)
- Focus indicators visible for keyboard navigation

**Color Scheme**:
- Menus/UI: Black background with light grey text (#CCCCCC or similar)
- Matches game aesthetic for consistency
- No dark/light mode toggle (fixed dark theme)
- Consistent with gameplay visual style

**Component Styling Approach**:
- Minimal CSS - simple borders, padding, hover states only
- No shadows, gradients, or decorative elements
- Button hover: subtle color change
- Focus states: thin outline or border color change

**Color Customization UI**:
- Hex input fields (`<input type="text" pattern="#[0-9A-Fa-f]{6}">`)
- Manual entry (e.g., type `#0000FF` for blue)
- Most minimal approach, no color picker widget
- Can validate hex format and show preview swatch

**Reference Design**:
- No external reference site
- Pure minimal aesthetic: function over form
- Visual inspiration: terminal/command-line simplicity

**Components Needed**:
```
Settings Screen:
- Radix Slider: volume (0-100%), practice speed (50-100%)
- Text inputs: key bindings (D, K), hex colors
- Radix Dialog: modal for settings
- Buttons: Save, Cancel, Reset to Defaults

Level Select:
- Simple list (<ul>) with hover states
- Display: level name, best score percentage
- Buttons: Play, Practice Mode, Edit

Editor:
- Timeline (custom Canvas or HTML)
- Playback controls (play/pause buttons)
- Note type selector (RadioGroup or buttons)
- Save/Cancel buttons
```

---

### Decision 8: Packaging & Distribution - Deferred (electron-builder planned)
**Date**: 2026-02-14

**Options Considered**:
- **Defer Decision** (SELECTED): Run in dev mode during development, add packaging later
- electron-builder: Most popular packaging tool (planned for future)
- electron-forge: Official Electron tooling

**Rationale**:
- Focus on core game features first (timing, editor, levels) without distribution overhead
- Dev mode (`npm run dev`) sufficient for personal testing and development
- electron-builder can be added in ~10 minutes when needed
- No need for installers until core features are complete and validated
- Avoids premature complexity during initial development

**Key Tradeoffs Accepted**:
- Cannot easily share app with others during development (requires npm install + npm run dev)
- No testing of production build until packaging is set up
- Cannot test Windows installer experience until later

**Future Plan**:
- Add electron-builder when:
  - Core features complete and working (timing validation passed)
  - Ready to test "real" app experience outside dev mode
  - Want to share with others or create backup installer
- Configuration: ~10 lines in package.json
- First build will download platform tools (~500MB one-time)
- Can add code signing later if sharing publicly

**Development Workflow (Current)**:
```bash
npm run dev     # Launches Electron app in development mode
# App runs with hot reload, dev tools, full debugging
```

**Future Workflow (After adding electron-builder)**:
```bash
npm run dev              # Development mode
npm run build            # Production build
npm run dist             # Create Windows installer
# Output: dist/Minimal-Beat-Trainer-Setup-1.0.0.exe
```

---

### Decision 9: Local Development Environment - Windows 10 + Git Bash
**Date**: 2026-02-14

**Environment**:
- **OS**: Windows 10 Home (Build 10.0.19045)
- **Shell**: Git Bash (bundled with Git for Windows)
- **IDE**: VSCode with Claude Code plugin
- **Node.js**: Will be installed for npm/Electron development

**Cross-Platform Considerations**:
- **No immediate concerns**: Developing on Windows, targeting Windows primarily
- **Path handling**: Use forward slashes (/) in code - Node.js and Electron handle this correctly on all platforms
- **Line endings**: Configure `.gitattributes` for consistent LF line endings:
  ```
  * text=auto eol=lf
  *.js text eol=lf
  *.json text eol=lf
  ```
- **npm scripts**: Use cross-platform commands (avoid Windows-specific syntax)
- **File system**: Electron's fs module works identically on Windows/Mac/Linux

**Future Cross-Platform Support**:
- Electron bundles same Chromium on all platforms - code runs identically
- Can test Mac/Linux builds later using CI/CD or virtual machines
- No containerization needed (Electron is the container)

**Known Non-Issues**:
- ✅ Case sensitivity: Not a concern (Windows is case-insensitive, code will work on case-sensitive systems)
- ✅ Path separators: Node.js `path.join()` handles Windows/Unix differences automatically
- ✅ Native dependencies: None expected (Canvas and Web Audio are built into Chromium)

---

