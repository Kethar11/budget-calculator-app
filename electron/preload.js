const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  saveFile: (filename, data) => ipcRenderer.invoke('save-file', filename, data),
  loadFile: (filename) => ipcRenderer.invoke('load-file', filename),
  listFiles: () => ipcRenderer.invoke('list-files')
});

