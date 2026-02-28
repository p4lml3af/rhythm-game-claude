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
