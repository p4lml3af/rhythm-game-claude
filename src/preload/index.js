const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadScores: () => ipcRenderer.invoke('scores:load'),
  saveScores: (scores) => ipcRenderer.invoke('scores:save', scores),
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
});
