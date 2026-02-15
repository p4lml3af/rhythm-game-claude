# Phase 1 Execution Plan: Project Setup & Scaffolding

## Overview

**Phase Goal**: Create a working Electron + React + Vite development environment with hot reload.

**Success Criteria**:
- `npm run dev` successfully launches Electron window
- React app displays "Hello World" message
- Hot Module Replacement (HMR) works instantly (<100ms)
- All project directories properly structured
- Environment ready for Phase 2 (Core Game Engine)

**Estimated Time**: 1-2 hours

**Dependencies**:
- ✅ Phase 0 complete (Technology Stack Decisions documented)
- Node.js installed on system (required for npm)

---

## Task Breakdown

### Task 1: Initialize npm Project
**Objective**: Create package.json with project metadata and prepare for dependency installation.

**Steps**:
1. Run `npm init` in project root directory
2. Configure package.json with:
   - **name**: `"minimal-beat-trainer"` (or similar)
   - **version**: `"0.1.0"`
   - **description**: `"Minimal 2-key rhythm game for hand-eye coordination"`
   - **main**: `"dist-electron/main.js"` (Electron main process entry)
   - **type**: `"module"` (enable ESM)
   - **author**: Your name
   - **license**: `"MIT"` (or preferred license)

**Files Modified**:
- `package.json` (created)

**Acceptance Criteria**:
- [ ] `package.json` exists in project root
- [ ] All required fields populated correctly
- [ ] `"type": "module"` set for ESM support

---

### Task 2: Install Core Dependencies
**Objective**: Install Electron, React, Vite, and electron-vite packages.

**Steps**:
1. Install production dependencies:
   ```bash
   npm install electron react react-dom
   ```
2. Install development dependencies:
   ```bash
   npm install --save-dev vite @vitejs/plugin-react electron-vite
   ```

**Expected Versions** (as of Feb 2024):
- `electron`: ^28.0.0 or latest
- `react`: ^18.2.0 or latest
- `react-dom`: ^18.2.0 or latest
- `vite`: ^5.0.0 or latest
- `@vitejs/plugin-react`: ^4.2.0 or latest
- `electron-vite`: ^2.0.0 or latest

**Files Modified**:
- `package.json` (dependencies added)
- `package-lock.json` (created)
- `node_modules/` (created, should be in .gitignore)

**Acceptance Criteria**:
- [ ] All 6 packages installed successfully
- [ ] No vulnerability warnings for critical/high severity issues
- [ ] `node_modules/` folder created
- [ ] `package-lock.json` generated

---

### Task 3: Configure Project Folder Structure
**Objective**: Create organized directory structure for main process, renderer, and assets.

**Steps**:
1. Create directory structure:
   ```
   /src
     /main          # Electron main process code
     /renderer      # React app (renderer process)
     /shared        # Shared types/utilities
   /songs           # Level data (empty for now)
   /public          # Static assets (icons, etc.)
   /resources       # Electron resources (optional)
   ```

2. Create placeholder files to preserve directory structure in Git:
   - `src/main/.gitkeep`
   - `src/renderer/.gitkeep`
   - `src/shared/.gitkeep`
   - `songs/.gitkeep`
   - `public/.gitkeep`

**Commands**:
```bash
mkdir -p src/main src/renderer src/shared songs public resources
touch src/main/.gitkeep src/renderer/.gitkeep src/shared/.gitkeep songs/.gitkeep public/.gitkeep
```

**Acceptance Criteria**:
- [ ] All 5 directories created
- [ ] `.gitkeep` files in each directory
- [ ] Directory structure matches implementation plan

---

### Task 4: Configure Vite Build Tooling
**Objective**: Set up Vite configuration for Electron with main + renderer process bundling.

**Steps**:
1. Create `electron.vite.config.js` in project root:
   - Configure main process build (src/main → dist-electron)
   - Configure renderer process build (src/renderer → dist)
   - Enable React plugin for renderer
   - Set up hot reload

**Files Created**:
- `electron.vite.config.js`

**File Content**:
```javascript
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  main: {
    // Main process configuration
    build: {
      outDir: 'dist-electron',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.js')
        }
      }
    }
  },
  preload: {
    // Preload script configuration (if needed later)
    build: {
      outDir: 'dist-electron'
    }
  },
  renderer: {
    // Renderer process (React app) configuration
    root: 'src/renderer',
    plugins: [react()],
    build: {
      outDir: '../../dist',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html')
        }
      }
    }
  }
})
```

**Acceptance Criteria**:
- [ ] `electron.vite.config.js` created
- [ ] Main, preload, and renderer configurations defined
- [ ] React plugin enabled for renderer
- [ ] Paths resolve correctly

---

### Task 5: Create Electron Main Process
**Objective**: Set up Electron main process to create app window and handle lifecycle.

**Steps**:
1. Create `src/main/index.js` with:
   - Import `app` and `BrowserWindow` from Electron
   - Create window function (800x600, frame optional)
   - Handle app lifecycle events (ready, window-all-closed, activate)
   - Load renderer HTML in development mode

**Files Created**:
- `src/main/index.js`

**File Content**:
```javascript
import { app, BrowserWindow } from 'electron'
import { join } from 'path'

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'), // Optional, for later
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Load the React app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173') // Vite dev server
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// App lifecycle
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
```

**Acceptance Criteria**:
- [ ] `src/main/index.js` created
- [ ] Window creation function defined (800x600)
- [ ] App lifecycle handlers implemented
- [ ] Development mode loads Vite dev server
- [ ] DevTools open automatically in dev mode

---

### Task 6: Create React Renderer App
**Objective**: Set up minimal React application with "Hello World" entry point.

**Steps**:
1. Create `src/renderer/index.html`:
   - Basic HTML5 template
   - Root div for React mounting
   - Script tag for main.jsx

2. Create `src/renderer/main.jsx`:
   - Import React and ReactDOM
   - Import App component
   - Render App to root div

3. Create `src/renderer/App.jsx`:
   - Simple functional component
   - Display "Hello World" message
   - Add minimal styling

4. Create `src/renderer/App.css`:
   - Black background
   - White text
   - Centered content

**Files Created**:
- `src/renderer/index.html`
- `src/renderer/main.jsx`
- `src/renderer/App.jsx`
- `src/renderer/App.css`

**File Content - index.html**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Minimal Beat Trainer</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/main.jsx"></script>
</body>
</html>
```

**File Content - main.jsx**:
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

**File Content - App.jsx**:
```javascript
import React from 'react'

function App() {
  return (
    <div className="app">
      <h1>Hello World</h1>
      <p>Minimal Beat Trainer - Phase 1 Setup Complete</p>
    </div>
  )
}

export default App
```

**File Content - App.css**:
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: #000000;
  color: #FFFFFF;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
}

.app h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.app p {
  font-size: 1.2rem;
  color: #CCCCCC;
}
```

**Acceptance Criteria**:
- [ ] All 4 React files created
- [ ] "Hello World" displays on black background
- [ ] Text is white/light grey
- [ ] Content centered vertically and horizontally

---

### Task 7: Add npm Scripts
**Objective**: Configure package.json scripts for development and build workflows.

**Steps**:
1. Add scripts to `package.json`:
   - `dev`: Start Vite dev server + Electron in development mode
   - `build`: Production build for main + renderer
   - `preview`: Test production build locally

**package.json scripts section**:
```json
"scripts": {
  "dev": "electron-vite dev",
  "build": "electron-vite build",
  "preview": "electron-vite preview"
}
```

**Files Modified**:
- `package.json`

**Acceptance Criteria**:
- [ ] All 3 scripts added to package.json
- [ ] `npm run dev` command available
- [ ] `npm run build` command available
- [ ] `npm run preview` command available

---

### Task 8: Configure Git Attributes
**Objective**: Ensure consistent line endings (LF) across all platforms.

**Steps**:
1. Create `.gitattributes` file in project root
2. Configure all text files to use LF line endings
3. Specifically target JS, JSX, JSON, CSS, HTML files

**Files Created**:
- `.gitattributes`

**File Content**:
```
# Auto detect text files and normalize to LF
* text=auto eol=lf

# Explicitly set LF for code files
*.js text eol=lf
*.jsx text eol=lf
*.json text eol=lf
*.css text eol=lf
*.html text eol=lf
*.md text eol=lf

# Ensure package files use LF
package.json text eol=lf
package-lock.json text eol=lf

# Binary files
*.png binary
*.jpg binary
*.mp3 binary
```

**Acceptance Criteria**:
- [ ] `.gitattributes` created
- [ ] All text file types configured for LF
- [ ] Binary file types marked as binary

---

### Task 9: Update .gitignore
**Objective**: Prevent committing build artifacts, dependencies, and OS files.

**Steps**:
1. Create or update `.gitignore` file
2. Exclude node_modules, dist folders, OS files

**Files Created/Modified**:
- `.gitignore`

**File Content**:
```
# Dependencies
node_modules/
package-lock.json

# Build output
dist/
dist-electron/

# Environment files
.env
.env.local

# OS files
.DS_Store
Thumbs.db
desktop.ini

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Logs
*.log
npm-debug.log*

# Electron
out/
```

**Acceptance Criteria**:
- [ ] `.gitignore` created
- [ ] `node_modules/` excluded
- [ ] Build directories excluded
- [ ] OS and IDE files excluded

---

### Task 10: Initial Test Run
**Objective**: Verify complete setup by running development server.

**Steps**:
1. Run `npm run dev`
2. Verify Electron window opens
3. Verify "Hello World" displays correctly
4. Test hot reload:
   - Modify text in `App.jsx`
   - Save file
   - Verify change appears instantly (<100ms)
5. Check DevTools console for errors

**Manual Testing Checklist**:
- [ ] `npm run dev` executes without errors
- [ ] Electron window opens (800x600)
- [ ] "Hello World" text visible on black background
- [ ] DevTools open automatically
- [ ] No console errors in DevTools
- [ ] Modify `App.jsx` text → save → change reflects instantly
- [ ] Close window → app exits cleanly

**Expected Behavior**:
- Window opens in ~2-3 seconds
- Hot reload updates in <100ms
- No red error messages in terminal or DevTools

**Troubleshooting**:
- If window doesn't open: Check terminal for errors, verify port 5173 is free
- If hot reload doesn't work: Check Vite dev server is running, verify file watchers enabled
- If "Hello World" doesn't display: Check browser console for React errors

---

## Testing Strategy

### Automated Tests (Optional for Phase 1)
Phase 1 is primarily infrastructure setup, so automated tests are minimal. We can set up Vitest configuration for future use:

**Optional Task**: Create `vitest.config.js` (basic setup for Phase 3)
```javascript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom', // For React component testing later
    globals: true
  }
})
```

**Optional Task**: Install Vitest
```bash
npm install --save-dev vitest @vitest/ui happy-dom
```

Add to `package.json` scripts:
```json
"test": "vitest",
"test:ui": "vitest --ui"
```

### Manual Testing (Required)
All testing for Phase 1 is manual verification:
- [x] Task 10 checklist above

---

## Requirements Traceability

Phase 1 provides foundational infrastructure but does not directly satisfy functional requirements. It sets up the platform for future requirements:

**REQ-15: Desktop Application Platform** (Partial - foundation only)
- ✅ Packaged as Electron desktop application
- ✅ Uses HTML5 Canvas infrastructure (renderer process ready)
- ✅ Web Audio API available (Chromium built-in)
- ✅ Framework-based UI (React) for menus
- ⏳ Runs offline (will be fully satisfied once app is complete)

**All other requirements** (REQ-1 through REQ-14, REQ-16) will be satisfied in subsequent phases.

---

## Deliverables Checklist

At the end of Phase 1, the following must be complete:

### Files Created
- [ ] `package.json` with correct metadata and scripts
- [ ] `electron.vite.config.js` with main/renderer config
- [ ] `src/main/index.js` (Electron main process)
- [ ] `src/renderer/index.html`
- [ ] `src/renderer/main.jsx`
- [ ] `src/renderer/App.jsx`
- [ ] `src/renderer/App.css`
- [ ] `.gitattributes` (LF line endings)
- [ ] `.gitignore` (exclude build artifacts)

### Directories Created
- [ ] `src/main/`
- [ ] `src/renderer/`
- [ ] `src/shared/`
- [ ] `songs/`
- [ ] `public/`
- [ ] `node_modules/` (with dependencies installed)

### Functionality Verified
- [ ] `npm run dev` launches Electron window successfully
- [ ] React app displays "Hello World" on black background
- [ ] Hot Module Replacement works (<100ms reload on save)
- [ ] DevTools accessible and error-free
- [ ] Window closes cleanly when app exits

### Documentation Updated
- [ ] (Optional) Update `implementation_plan.md` to mark Phase 1 as complete
- [ ] (Optional) Add any setup notes or troubleshooting to MEMORY.md

---

## Common Issues & Solutions

### Issue 1: `npm run dev` fails with "Cannot find module 'electron'"
**Solution**: Run `npm install` to ensure all dependencies installed correctly.

### Issue 2: Vite dev server fails to start (port 5173 in use)
**Solution**:
- Close other Vite projects
- Or change port in `electron.vite.config.js` renderer config:
  ```javascript
  renderer: {
    server: { port: 5174 }
  }
  ```
  Also update `src/main/index.js` URL to match new port.

### Issue 3: Hot reload not working
**Solution**:
- Verify file watchers enabled in VSCode settings
- Check that Vite dev server is running (terminal output shows "VITE v5.x.x ready")
- Try saving file with explicit Ctrl+S

### Issue 4: Blank white screen instead of "Hello World"
**Solution**:
- Open DevTools (F12) and check Console for errors
- Verify `src/renderer/main.jsx` imports and renders App component
- Check that `index.html` has correct script path (`/main.jsx`)

### Issue 5: Window opens but immediately closes
**Solution**:
- Check terminal for Electron errors
- Verify `src/main/index.js` has correct lifecycle handlers
- Ensure `app.whenReady()` is called before `createWindow()`

---

## Next Steps

After Phase 1 is complete and verified:

1. **Run `/plan-phase 2`** to create detailed plan for Core Game Engine
2. **Optional**: Commit Phase 1 work to Git with message:
   ```bash
   git add .
   git commit -m "Phase 1: Project setup complete - Electron + React + Vite"
   ```
3. **Begin Phase 2**: Core Game Engine - Tap Notes Only

---

## Time Estimates

| Task | Estimated Time |
|------|---------------|
| Task 1: Initialize npm | 5 minutes |
| Task 2: Install dependencies | 10 minutes |
| Task 3: Create folder structure | 5 minutes |
| Task 4: Configure Vite | 10 minutes |
| Task 5: Create main process | 15 minutes |
| Task 6: Create React app | 15 minutes |
| Task 7: Add npm scripts | 5 minutes |
| Task 8: Configure Git attributes | 5 minutes |
| Task 9: Update .gitignore | 5 minutes |
| Task 10: Test run & debugging | 15 minutes |
| **Total** | **~90 minutes** |

**Buffer for troubleshooting**: +30 minutes

**Total estimated time**: **1.5 - 2 hours**

---

## Success Validation

Phase 1 is successful when:
- ✅ All 10 tasks completed
- ✅ All deliverables checklist items checked
- ✅ `npm run dev` works flawlessly
- ✅ Hot reload verified working
- ✅ No errors in terminal or DevTools console
- ✅ Team member (or builder) can clone repo, run `npm install`, `npm run dev`, and see "Hello World"

**Ready to proceed to Phase 2**: Core Game Engine - Tap Notes Only
