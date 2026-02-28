# Phase 6: Settings & Customization — Execution Plan

**Goal**: Add customizable colors, key bindings, and volume control with persistent settings stored via Electron IPC.

**Dependencies**: Phase 5 complete (score persistence via Electron IPC). The IPC pattern established in Phase 5 (`scores:load`/`scores:save`) will be reused for settings.

**Requirements Satisfied**:
- REQ-9: Visual Customization (tap color, hold color, background color, text color)
- REQ-10: Input Customization (key bindings for left/right lanes, master volume)
- REQ-14: Local File Storage (settings saved to local files, loaded on startup)

---

## Pre-Phase Verification

Before starting, verify Phase 5 deliverables work:
1. Run `npm run dev` — app launches, game plays, results show
2. Run `npm run test:run` — all existing tests pass
3. Confirm score persistence works (play level, check scores.json in userData)

---

## Task 1: Install Radix UI Dependencies

**Files**: `package.json`

Install the Radix UI primitives needed for the Settings screen:
```bash
npm install @radix-ui/react-dialog @radix-ui/react-slider
```

These provide unstyled, accessible Dialog (modal) and Slider (volume, practice speed) primitives per technology_decisions.md Decision 7.

**Acceptance**: `npm run dev` still launches correctly after install.

---

## Task 2: Create Settings Type & Constants

**Files to modify**: `src/shared/types.ts`

Add the `Settings` interface and default values. Per naming_conventions.md, the structure is:

```typescript
export interface Settings {
  colors: {
    tap: string;        // Hex color, default '#0000FF'
    hold: string;       // Hex color, default '#FF0000'
    background: string; // Hex color, default '#000000'
    text: string;       // Hex color, default '#CCCCCC'
  };
  keyBindings: {
    left: string;       // Key code string, default 'KeyD'
    right: string;      // Key code string, default 'KeyK'
  };
  volume: number;       // 0-100, default 100
}
```

**New file**: `src/shared/constants.ts`

Define `DEFAULT_SETTINGS` constant using UPPER_SNAKE_CASE per naming conventions:

```typescript
export const DEFAULT_SETTINGS: Settings = {
  colors: {
    tap: '#0000FF',
    hold: '#FF0000',
    background: '#000000',
    text: '#CCCCCC',
  },
  keyBindings: {
    left: 'KeyD',
    right: 'KeyK',
  },
  volume: 100,
};
```

**Acceptance**: TypeScript compiles, types importable from shared/types.

---

## Task 3: Create Settings Zustand Store

**New file**: `src/renderer/stores/settingsStore.ts`

Create a Zustand store following the same pattern as `scoreStore.ts`:

```typescript
interface SettingsState {
  settings: Settings;
  updateColors: (colors: Partial<Settings['colors']>) => void;
  updateKeyBindings: (keyBindings: Partial<Settings['keyBindings']>) => void;
  updateVolume: (volume: number) => void;
  resetToDefaults: () => void;
  loadSettings: (settings: Settings) => void;
}
```

Key behaviors:
- Each update function merges partial values into current settings
- After every update, call `window.electronAPI.saveSettings(settings)` to persist
- `resetToDefaults()` replaces entire settings with `DEFAULT_SETTINGS` and persists
- `loadSettings()` hydrates the store on app startup (called from App.tsx)

**Acceptance**: Store can be imported and used in React components.

---

## Task 4: Add Settings IPC Handlers (Electron Main Process)

**Files to modify**: `src/main/index.js`

Add two new IPC handlers following the established scores pattern:

```javascript
function getSettingsPath() {
  return join(app.getPath('userData'), 'settings.json')
}

ipcMain.handle('settings:load', async () => {
  // Read settings.json, return parsed JSON
  // If file missing or invalid, return null (renderer uses defaults)
})

ipcMain.handle('settings:save', async (_event, settings) => {
  // Atomic write: write .tmp then rename (same pattern as scores)
})
```

Use the same atomic write pattern (`.tmp` + `renameSync`) as scores persistence.

**Acceptance**: IPC handlers registered, no errors on app startup.

---

## Task 5: Expose Settings IPC in Preload Script

**Files to modify**: `src/preload/index.js`, `src/shared/electron.d.ts`

Add `loadSettings` and `saveSettings` to the context bridge:

```javascript
// preload/index.js
contextBridge.exposeInMainWorld('electronAPI', {
  loadScores: () => ipcRenderer.invoke('scores:load'),
  saveScores: (scores) => ipcRenderer.invoke('scores:save', scores),
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
});
```

Update `electron.d.ts` to add the new methods to the `ElectronAPI` interface:

```typescript
interface ElectronAPI {
  loadScores: () => Promise<Record<string, number>>;
  saveScores: (scores: Record<string, number>) => Promise<void>;
  loadSettings: () => Promise<Settings | null>;
  saveSettings: (settings: Settings) => Promise<void>;
}
```

**Acceptance**: `window.electronAPI.loadSettings` and `window.electronAPI.saveSettings` callable from renderer.

---

## Task 6: Load Settings on App Startup

**Files to modify**: `src/renderer/App.tsx`

Add settings loading alongside score loading in the startup useEffect:

```typescript
const { loadSettings } = useSettingsStore();

useEffect(() => {
  if (window.electronAPI?.loadSettings) {
    window.electronAPI.loadSettings().then(savedSettings => {
      if (savedSettings) loadSettings(savedSettings);
    });
  }
}, [loadSettings]);
```

If no saved settings exist (first launch), the store keeps `DEFAULT_SETTINGS`.

**Acceptance**: App launches correctly. On first run, defaults are used. On subsequent runs, saved settings are restored.

---

## Task 7: Build Settings Screen Component

**New file**: `src/renderer/components/SettingsScreen.tsx`

Create a Settings screen using Radix UI Dialog primitive. Per naming_conventions.md:
- Component name: `SettingsScreen`
- Props follow modal pattern: `{ isOpen, onClose }`
- All interactive elements have `data-testid` attributes

**Layout** (per implementation_plan.md Phase 6 and design.md):

1. **Volume Section**
   - Radix Slider (0-100) with `data-testid="slider-volume"`
   - Display current value as text

2. **Key Bindings Section**
   - "Press a key" capture inputs for left and right lanes
   - `data-testid="input-key-left"` and `data-testid="input-key-right"`
   - Validation: prevent binding same key to both lanes (REQ-10 AC5)
   - Display friendly key name (e.g., "D" not "KeyD")

3. **Colors Section**
   - Hex input fields for: tap note, hold note, background, text
   - `data-testid="input-color-tap"`, `input-color-hold`, `input-color-background`, `input-color-text`
   - Pattern validation: `#[0-9A-Fa-f]{6}`
   - Color preview swatch next to each input

4. **Action Buttons**
   - Save button: `data-testid="button-save"`
   - Cancel button: `data-testid="button-cancel"` (closes without saving)
   - Reset to Defaults button: `data-testid="button-reset-defaults"`

**Styling**: Minimal CSS per design principles — black background, grey text, simple borders, no decorative elements. Use inline styles or a small CSS file (e.g., `SettingsScreen.css`).

**Error Handling** per naming_conventions.md:
- `const [error, setError] = useState<string | null>(null)` for general errors
- `const [fieldErrors, setFieldErrors] = useState<{...}>({})` for per-field validation

**Key binding capture UX**:
- When user clicks the key binding input, switch to "listening" mode
- Capture next keydown event, extract `event.code` (e.g., "KeyD", "KeyK", "ArrowLeft")
- Display human-readable name (strip "Key" prefix for letter keys)
- Validate no duplicate bindings

**Acceptance**: Settings modal opens, all controls work, validation prevents invalid states.

---

## Task 8: Wire Settings into Game Canvas Rendering

**Files to modify**: `src/renderer/game/noteRenderer.ts`, `src/renderer/game/rendering.ts`, `src/renderer/components/GameCanvas.tsx`

Currently, colors are hardcoded:
- `noteRenderer.ts:27` — hold note color `#FF0000`
- `noteRenderer.ts:32` — tap note color `#0000FF`
- `rendering.ts:14` — lane border color `#333333`
- `rendering.ts:26` — hit zone color `#FFFFFF` (stays white per REQ-9 AC5)
- `rendering.ts:37` — accuracy text color `#CCCCCC`
- `GameCanvas.tsx:336` — background color `#000000`

**Approach**: Add color parameters to render functions rather than reading store directly from rendering utils (keeps them pure and testable):

```typescript
// noteRenderer.ts
export function drawNote(ctx, note, y, colors: { tap: string; hold: string }): void

// rendering.ts
export function drawAccuracy(ctx, accuracy, textColor: string): void
```

In `GameCanvas.tsx`, read settings from the Zustand store and pass colors to render functions:

```typescript
const { settings } = useSettingsStore();
// Pass settings.colors.tap, settings.colors.hold to drawNote
// Pass settings.colors.text to drawAccuracy
// Set canvas backgroundColor from settings.colors.background
```

**Acceptance**: Changing tap/hold/background/text colors in settings immediately changes game appearance. Hit zone stays white regardless of settings.

---

## Task 9: Wire Settings into Input Handler

**Files to modify**: `src/renderer/game/inputHandler.ts`, `src/renderer/components/GameCanvas.tsx`

The `InputHandler` class currently hardcodes `KeyD` and `KeyK`. Add the ability to configure key bindings:

```typescript
export class InputHandler {
  constructor(
    onKeyPress: KeyCallback,
    onKeyRelease?: KeyCallback,
    keyBindings?: { left: string; right: string }
  ) {
    this.leftKey = keyBindings?.left ?? 'KeyD';
    this.rightKey = keyBindings?.right ?? 'KeyK';
  }
}
```

In `GameCanvas.tsx`, pass the current key bindings from settings store when constructing the `InputHandler`:

```typescript
const { settings } = useSettingsStore();
inputHandlerRef.current = new InputHandler(
  handleKeyPress,
  handleKeyRelease,
  settings.keyBindings
);
```

**Acceptance**: Changing key bindings in settings changes which keys control the game.

---

## Task 10: Wire Settings into Audio Manager (Volume)

**Files to modify**: `src/renderer/game/audioManager.ts`

Currently, `AudioManager` connects `sourceNode` directly to `audioContext.destination` with no gain control. Add a GainNode for volume:

```typescript
export class AudioManager {
  private gainNode: GainNode | null = null;

  async loadAudio(audioPath: string): Promise<void> {
    this.audioContext = new AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    // ...decode audio...
  }

  play(onEnded?: () => void): void {
    // ...existing logic...
    this.sourceNode.connect(this.gainNode!); // Connect to gain, not destination
    // ...
  }

  setVolume(volume: number): void {
    // volume is 0-100, convert to 0.0-1.0
    if (this.gainNode) {
      this.gainNode.gain.value = volume / 100;
    }
  }
}
```

In `GameCanvas.tsx`, apply volume from settings on audio load and when settings change:

```typescript
useEffect(() => {
  audioManager.setVolume(settings.volume);
}, [settings.volume, audioManager]);
```

**Acceptance**: Volume slider at 0 = silent, at 100 = full volume, changes take effect immediately.

---

## Task 11: Integrate Settings Screen into App

**Files to modify**: `src/renderer/App.tsx`

Add a settings button and screen state management. For now (before Phase 7 menu system), add a minimal settings access point:

- Add a Settings button (gear icon or text) accessible from the game view
- Clicking opens the SettingsScreen modal
- Settings changes are saved and applied immediately
- Closing the modal returns to the game

```tsx
const [isSettingsOpen, setIsSettingsOpen] = useState(false);

// In render:
<button data-testid="button-settings" onClick={() => setIsSettingsOpen(true)}>
  Settings
</button>
<SettingsScreen
  isOpen={isSettingsOpen}
  onClose={() => setIsSettingsOpen(false)}
/>
```

**Acceptance**: Settings button visible. Opening settings, changing values, saving — all work. App restart preserves settings.

---

## Task 12: Write Unit Tests

**New files**:
- `src/renderer/stores/__tests__/settingsStore.test.ts`
- `src/renderer/game/__tests__/audioManager.test.ts` (volume tests)
- `src/renderer/game/__tests__/inputHandler.test.ts` (update existing with key binding tests)

### Settings Store Tests (`settingsStore.test.ts`)

1. **Default settings**: Store initializes with correct defaults
2. **Update colors**: Partial color update merges correctly
3. **Update key bindings**: Partial key binding update merges correctly
4. **Update volume**: Volume updates correctly, clamped to 0-100
5. **Reset to defaults**: All settings revert to `DEFAULT_SETTINGS`
6. **Load settings**: Full settings hydration works correctly
7. **Persistence trigger**: `saveSettings` IPC called on every update

### Settings Validation Tests

1. **Hex color validation**: Valid hex passes, invalid rejects
2. **Duplicate key prevention**: Same key for both lanes rejected
3. **Volume range**: Values outside 0-100 rejected or clamped

### Input Handler Key Binding Tests (update existing `inputHandler.test.ts`)

4. **Custom key bindings**: InputHandler uses provided key codes
5. **Default fallback**: No key bindings provided uses KeyD/KeyK

### Audio Volume Tests (`audioManager.test.ts`)

6. **Volume 100**: Gain value = 1.0
7. **Volume 50**: Gain value = 0.5
8. **Volume 0**: Gain value = 0.0

**Acceptance**: All tests pass with `npm run test:run`.

---

## Task 13: Settings Persistence End-to-End Verification

Manual testing checklist:

1. [ ] Launch app fresh (no settings.json) → defaults applied correctly
2. [ ] Change tap note color to green (#00FF00) → save → notes render green
3. [ ] Change hold note color to yellow (#FFFF00) → save → hold notes render yellow
4. [ ] Change background to dark blue (#000033) → save → canvas background changes
5. [ ] Change text color to white (#FFFFFF) → save → accuracy text changes
6. [ ] Change left key to ArrowLeft → save → ArrowLeft controls left lane
7. [ ] Change right key to ArrowRight → save → ArrowRight controls right lane
8. [ ] Attempt to bind same key to both lanes → error shown, save blocked
9. [ ] Change volume to 50% → audio plays at reduced volume
10. [ ] Change volume to 0% → audio silent
11. [ ] Click "Reset to Defaults" → all settings revert
12. [ ] Close and reopen app → all saved settings restored
13. [ ] Delete settings.json from userData → app launches with defaults (no crash)
14. [ ] Corrupt settings.json (invalid JSON) → app launches with defaults, warning logged

---

## Files Summary

### New Files
| File | Purpose |
|------|---------|
| `src/shared/constants.ts` | `DEFAULT_SETTINGS` and other shared constants |
| `src/renderer/stores/settingsStore.ts` | Zustand store for settings state + persistence |
| `src/renderer/components/SettingsScreen.tsx` | Settings UI component (Radix Dialog + Slider) |
| `src/renderer/stores/__tests__/settingsStore.test.ts` | Settings store unit tests |
| `src/renderer/game/__tests__/audioManager.test.ts` | Audio volume unit tests |

### Modified Files
| File | Changes |
|------|---------|
| `package.json` | Add @radix-ui/react-dialog, @radix-ui/react-slider |
| `src/shared/types.ts` | Add `Settings` interface |
| `src/shared/electron.d.ts` | Add `loadSettings`/`saveSettings` to ElectronAPI |
| `src/main/index.js` | Add settings:load/settings:save IPC handlers |
| `src/preload/index.js` | Expose loadSettings/saveSettings in context bridge |
| `src/renderer/App.tsx` | Load settings on startup, add settings button + modal |
| `src/renderer/game/noteRenderer.ts` | Accept color params in `drawNote` |
| `src/renderer/game/rendering.ts` | Accept color params in `drawAccuracy` |
| `src/renderer/game/audioManager.ts` | Add GainNode and `setVolume()` method |
| `src/renderer/game/inputHandler.ts` | Accept custom key bindings in constructor |
| `src/renderer/components/GameCanvas.tsx` | Pass settings to render/input/audio systems |
| `src/renderer/game/__tests__/inputHandler.test.ts` | Add custom key binding tests |

---

## Estimated Complexity: Medium

The settings store and IPC follow the established scores pattern closely. The main effort is in the SettingsScreen UI (hex inputs, key capture, validation) and threading settings through to the rendering/input/audio systems. No new architectural patterns are introduced.

---

## Implementation Order

Execute tasks in this order to minimize integration friction:

1. **Task 1** — Install Radix UI (unblocks Task 7)
2. **Task 2** — Types & constants (unblocks everything else)
3. **Task 3** — Settings store (unblocks Tasks 6, 7, 8, 9, 10)
4. **Tasks 4 + 5** — IPC handlers + preload (unblocks Task 6)
5. **Task 6** — Load on startup
6. **Tasks 8, 9, 10** — Wire settings into game systems (can be done in parallel)
7. **Task 7** — Build Settings screen UI
8. **Task 11** — Integrate settings screen into App
9. **Task 12** — Write tests
10. **Task 13** — Manual verification
