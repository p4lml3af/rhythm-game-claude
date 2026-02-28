const { app, BrowserWindow, ipcMain } = require('electron')
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
  } catch {
    return {}
  }
})

ipcMain.handle('scores:save', async (_event, scores) => {
  const filePath = getScoresPath()
  const tmpPath = filePath + '.tmp'
  fs.writeFileSync(tmpPath, JSON.stringify(scores, null, 2), 'utf-8')
  fs.renameSync(tmpPath, filePath)
})

// Settings persistence IPC handlers
function getSettingsPath() {
  return join(app.getPath('userData'), 'settings.json')
}

ipcMain.handle('settings:load', async () => {
  try {
    const data = fs.readFileSync(getSettingsPath(), 'utf-8')
    return JSON.parse(data)
  } catch {
    return null
  }
})

ipcMain.handle('settings:save', async (_event, settings) => {
  const filePath = getSettingsPath()
  const tmpPath = filePath + '.tmp'
  fs.writeFileSync(tmpPath, JSON.stringify(settings, null, 2), 'utf-8')
  fs.renameSync(tmpPath, filePath)
})

// Level discovery IPC handler
ipcMain.handle('levels:list', async () => {
  try {
    // In dev, songs are in public/songs/ served by Vite. Scan from project root.
    const songsDir = process.env.NODE_ENV === 'development'
      ? join(process.cwd(), 'public', 'songs')
      : join(__dirname, '../renderer/songs')

    if (!fs.existsSync(songsDir)) return []

    const entries = fs.readdirSync(songsDir, { withFileTypes: true })
    const levels = []

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const beatmapPath = join(songsDir, entry.name, 'beatmap.json')
      const audioPath = join(songsDir, entry.name, 'audio.mp3')

      if (!fs.existsSync(beatmapPath) || !fs.existsSync(audioPath)) continue

      try {
        const data = JSON.parse(fs.readFileSync(beatmapPath, 'utf-8'))
        levels.push({
          id: entry.name,
          songTitle: data.songTitle || entry.name,
          bpm: data.bpm || 0,
          duration: data.duration || 0,
          noteCount: Array.isArray(data.notes) ? data.notes.length : 0,
        })
      } catch {
        console.warn(`Skipping invalid beatmap: ${beatmapPath}`)
      }
    }

    return levels.sort((a, b) => a.id.localeCompare(b.id))
  } catch (err) {
    console.error('Failed to list levels:', err)
    return []
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
