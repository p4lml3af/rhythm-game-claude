const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadScores: () => ipcRenderer.invoke('scores:load'),
  saveScores: (scores) => ipcRenderer.invoke('scores:save', scores),
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  listLevels: () => ipcRenderer.invoke('levels:list'),
  validateBeatmap: (levelId) => ipcRenderer.invoke('beatmap:validate', levelId),

  // Editor APIs
  selectAudioFile: () => ipcRenderer.invoke('editor:select-audio'),
  saveLevel: (data) => ipcRenderer.invoke('editor:save-level', data),
  loadBeatmap: (levelId) => ipcRenderer.invoke('editor:load-beatmap', levelId),
  updateBeatmap: (data) => ipcRenderer.invoke('editor:update-beatmap', data),
});
