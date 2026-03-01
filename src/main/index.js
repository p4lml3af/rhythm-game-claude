const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { join } = require('path')
const fs = require('fs')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false, // Don't show until ready
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js')
    }
  })

  // Show window when ready to prevent flashing
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show')
    mainWindow.show()
    mainWindow.focus()
  })

  // Load the React app
  const url = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
  console.log('Loading URL:', url)

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL(url)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools()
  }

  // Log errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Score persistence IPC handlers
function getScoresPath() {
  return join(app.getPath('userData'), 'scores.json')
}

ipcMain.handle('scores:load', async () => {
  try {
    const data = fs.readFileSync(getScoresPath(), 'utf-8')
    return JSON.parse(data)
  } catch (err) {
    if (fs.existsSync(getScoresPath())) {
      console.warn('Scores file corrupted, starting with empty scores:', err.message)
    }
    return {}
  }
})

ipcMain.handle('scores:save', async (_event, scores) => {
  try {
    const filePath = getScoresPath()
    const tmpPath = filePath + '.tmp'
    fs.writeFileSync(tmpPath, JSON.stringify(scores, null, 2), 'utf-8')
    fs.renameSync(tmpPath, filePath)
    return { success: true }
  } catch (err) {
    console.error('Failed to save scores:', err.message)
    return { success: false, error: err.message }
  }
})

// Settings persistence IPC handlers
function getSettingsPath() {
  return join(app.getPath('userData'), 'settings.json')
}

ipcMain.handle('settings:load', async () => {
  try {
    const data = fs.readFileSync(getSettingsPath(), 'utf-8')
    return JSON.parse(data)
  } catch (err) {
    if (fs.existsSync(getSettingsPath())) {
      console.warn('Settings file corrupted. Restored defaults:', err.message)
    }
    return null
  }
})

ipcMain.handle('settings:save', async (_event, settings) => {
  try {
    const filePath = getSettingsPath()
    const tmpPath = filePath + '.tmp'
    fs.writeFileSync(tmpPath, JSON.stringify(settings, null, 2), 'utf-8')
    fs.renameSync(tmpPath, filePath)
    return { success: true }
  } catch (err) {
    console.error('Failed to save settings:', err.message)
    return { success: false, error: err.message }
  }
})

// Beatmap validator (CommonJS require for main process)
const { validateBeatmap } = require('../shared/beatmapValidator')

function getSongsDir() {
  return process.env.NODE_ENV === 'development'
    ? join(process.cwd(), 'public', 'songs')
    : join(__dirname, '../renderer/songs')
}

// Level discovery IPC handler
ipcMain.handle('levels:list', async () => {
  try {
    const songsDir = getSongsDir()

    if (!fs.existsSync(songsDir)) return []

    const entries = fs.readdirSync(songsDir, { withFileTypes: true })
    const levels = []

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const beatmapPath = join(songsDir, entry.name, 'beatmap.json')
      const audioPath = join(songsDir, entry.name, 'audio.mp3')

      // Missing beatmap file
      if (!fs.existsSync(beatmapPath)) {
        levels.push({
          id: entry.name,
          songTitle: entry.name,
          bpm: 0,
          duration: 0,
          noteCount: 0,
          error: 'Missing beatmap.json',
        })
        continue
      }

      // Missing audio file
      const hasAudio = fs.existsSync(audioPath)

      let data
      try {
        data = JSON.parse(fs.readFileSync(beatmapPath, 'utf-8'))
      } catch (parseErr) {
        levels.push({
          id: entry.name,
          songTitle: entry.name,
          bpm: 0,
          duration: 0,
          noteCount: 0,
          error: `Invalid JSON: ${parseErr.message}`,
        })
        continue
      }

      // Run validation
      const result = validateBeatmap(data)

      const levelInfo = {
        id: entry.name,
        songTitle: data.songTitle || entry.name,
        bpm: data.bpm || 0,
        duration: data.duration || 0,
        noteCount: Array.isArray(data.notes) ? data.notes.length : 0,
      }

      if (!hasAudio) {
        levels.push({ ...levelInfo, error: 'Missing audio.mp3' })
      } else if (!result.valid) {
        levels.push({
          ...levelInfo,
          error: `Invalid beatmap: ${result.errors[0]}`,
          warnings: result.warnings,
        })
      } else {
        levels.push({
          ...levelInfo,
          warnings: result.warnings.length > 0 ? result.warnings : undefined,
        })
      }
    }

    return levels.sort((a, b) => a.id.localeCompare(b.id))
  } catch (err) {
    console.error('Failed to list levels:', err)
    return []
  }
})

// Single beatmap validation IPC handler
ipcMain.handle('beatmap:validate', async (_event, levelId) => {
  try {
    const songsDir = getSongsDir()
    const beatmapPath = join(songsDir, levelId, 'beatmap.json')

    if (!fs.existsSync(beatmapPath)) {
      return { valid: false, errors: ['Beatmap file not found'], warnings: [], stats: null }
    }

    const data = JSON.parse(fs.readFileSync(beatmapPath, 'utf-8'))
    return validateBeatmap(data)
  } catch (err) {
    return { valid: false, errors: [err.message], warnings: [], stats: null }
  }
})

// Editor IPC handlers

// Select audio file via native dialog
ipcMain.handle('editor:select-audio', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Audio File',
      filters: [{ name: 'MP3 Audio', extensions: ['mp3'] }],
      properties: ['openFile'],
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const filePath = result.filePaths[0]
    const fileName = require('path').basename(filePath)
    return { filePath, fileName }
  } catch (err) {
    console.error('Failed to open audio dialog:', err.message)
    return null
  }
})

// Save a new level (copy audio + write beatmap)
ipcMain.handle('editor:save-level', async (_event, { levelName, audioSourcePath, beatmap }) => {
  try {
    // Validate beatmap before saving
    const validation = validateBeatmap(beatmap)
    if (!validation.valid) {
      return { success: false, error: `Invalid beatmap: ${validation.errors.join(', ')}` }
    }

    const songsDir = getSongsDir()
    if (!fs.existsSync(songsDir)) {
      fs.mkdirSync(songsDir, { recursive: true })
    }

    // Sanitize folder name
    const folderName = levelName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    const levelDir = join(songsDir, folderName)

    if (fs.existsSync(levelDir)) {
      return { success: false, error: `Level folder "${folderName}" already exists` }
    }

    fs.mkdirSync(levelDir, { recursive: true })

    // Copy audio file
    fs.copyFileSync(audioSourcePath, join(levelDir, 'audio.mp3'))

    // Write beatmap.json (atomic)
    const beatmapPath = join(levelDir, 'beatmap.json')
    const tmpPath = beatmapPath + '.tmp'
    fs.writeFileSync(tmpPath, JSON.stringify(beatmap, null, 2), 'utf-8')
    fs.renameSync(tmpPath, beatmapPath)

    return { success: true, levelId: folderName }
  } catch (err) {
    console.error('Failed to save level:', err.message)
    return { success: false, error: err.message }
  }
})

// Load a beatmap for editing
ipcMain.handle('editor:load-beatmap', async (_event, levelId) => {
  try {
    const songsDir = getSongsDir()
    const beatmapPath = join(songsDir, levelId, 'beatmap.json')
    const audioPath = join(songsDir, levelId, 'audio.mp3')

    if (!fs.existsSync(beatmapPath)) {
      return { error: 'Beatmap file not found' }
    }

    const data = JSON.parse(fs.readFileSync(beatmapPath, 'utf-8'))
    return { beatmap: data, audioPath }
  } catch (err) {
    return { error: err.message }
  }
})

// Update an existing level's beatmap
ipcMain.handle('editor:update-beatmap', async (_event, { levelId, beatmap }) => {
  try {
    const validation = validateBeatmap(beatmap)
    if (!validation.valid) {
      return { success: false, error: `Invalid beatmap: ${validation.errors.join(', ')}` }
    }

    const songsDir = getSongsDir()
    const beatmapPath = join(songsDir, levelId, 'beatmap.json')

    if (!fs.existsSync(join(songsDir, levelId))) {
      return { success: false, error: 'Level folder not found' }
    }

    // Atomic write
    const tmpPath = beatmapPath + '.tmp'
    fs.writeFileSync(tmpPath, JSON.stringify(beatmap, null, 2), 'utf-8')
    fs.renameSync(tmpPath, beatmapPath)

    return { success: true }
  } catch (err) {
    console.error('Failed to update beatmap:', err.message)
    return { success: false, error: err.message }
  }
})

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
