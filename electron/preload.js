// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// Exponiere sichere APIs für den Renderer-Prozess
contextBridge.exposeInMainWorld('electron', {
  // Datenspeicherung
  getData: (key) => ipcRenderer.invoke('getData', key),
  saveData: (key, data) => ipcRenderer.invoke('saveData', { key, data }),
  
  // Haptisches Feedback
  hapticFeedback: () => ipcRenderer.invoke('hapticFeedback'),
  
  // Einstellungen
  getGeneralSettings: () => ipcRenderer.invoke('settings:getGeneral'),
  updateGeneralSettings: (settings) => ipcRenderer.invoke('settings:updateGeneral', settings),
  getOBSSettings: () => ipcRenderer.invoke('settings:getOBS'),
  updateOBSSettings: (settings) => ipcRenderer.invoke('settings:updateOBS', settings),
  
  // Datei-Dialoge
  showSaveDialog: (options) => ipcRenderer.invoke('showSaveDialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('showOpenDialog', options),
  showMessageBox: (options) => ipcRenderer.invoke('showMessageBox', options),
  exportSettings: (filePath) => ipcRenderer.invoke('exportSettings', filePath),
  importSettings: (filePath) => ipcRenderer.invoke('importSettings', filePath),
  restartApp: () => ipcRenderer.invoke('restartApp'),
  
  // OBS-Funktionen
  getOBSConnectionStatus: () => ipcRenderer.invoke('obs:get-connection-status'),
  connectToOBS: () => ipcRenderer.invoke('obs:connect'),
  disconnectFromOBS: () => ipcRenderer.invoke('obs:disconnect'),
  testOBSSource: (params) => ipcRenderer.invoke('obs:test-source', params),
  testOBSFilter: (params) => ipcRenderer.invoke('obs:test-filter', params),
  handleTaskCompleted: (taskId, groupId) => ipcRenderer.invoke('handleTaskCompleted', taskId, groupId),
  handleSubtaskCompleted: (taskId, subtaskId, groupId) => ipcRenderer.invoke('handleSubtaskCompleted', taskId, subtaskId, groupId),
  
  // Webserver-Funktionen
  getWebServerStatus: () => ipcRenderer.invoke('webserver:status'),
  startWebServer: () => ipcRenderer.invoke('webserver:start'),
  stopWebServer: () => ipcRenderer.invoke('webserver:stop'),
  restartWebServer: () => ipcRenderer.invoke('webserver:restart'),
  updateWebServerTasks: (tasks) => ipcRenderer.invoke('webserver:update-tasks', tasks),
  getWebServerPreviewUrl: () => ipcRenderer.invoke('webserver:get-preview-url'),
  
  // Music-Funktionen
  getAudioMetadata: (filePath) => ipcRenderer.invoke('music:get-metadata', filePath),
  getAudioDuration: (filePath) => ipcRenderer.invoke('music:get-duration', filePath),
  checkFileExists: (filePath) => ipcRenderer.invoke('music:file-exists', filePath),
  readAudioFile: (filePath) => ipcRenderer.invoke('readAudioFile', filePath),
  
  // Direct file system access (for development and testing)
  checkAudioFile: async (filePath) => {
    try {
      const exists = fs.existsSync(filePath);
      return { exists, path: filePath };
    } catch (error) {
      console.error('Error checking audio file:', error);
      return { exists: false, error: error.message };
    }
  },
  
  getFileStats: async (filePath) => {
    try {
      const stats = fs.statSync(filePath);
      return { 
        success: true, 
        size: stats.size,
        isFile: stats.isFile(),
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      console.error('Error getting file stats:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Event-Handling
  on: (channel, func) => {
    const validChannels = ['obs:connection-status', 'obs:connection-error'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  removeListener: (channel, func) => {
    const validChannels = ['obs:connection-status', 'obs:connection-error'];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, func);
    }
  }
});