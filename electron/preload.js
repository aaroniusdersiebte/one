// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// For file system access, we need to safely import fs
let fs;
let path;
try {
  fs = require('fs');
  path = require('path');
  console.log('Successfully loaded Node.js modules in preload');
} catch (error) {
  console.error('Error loading Node.js modules in preload:', error);
  // Create dummy versions if import fails
  fs = {
    existsSync: () => false,
    statSync: () => ({ size: 0, isFile: () => false, birthtime: new Date(), mtime: new Date() })
  };
  path = { join: (...args) => args.join('/') };
}

// Define all the API functions we want to expose
const electronAPI = {
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
};

// Expose the API to the renderer process
try {
  contextBridge.exposeInMainWorld('electron', electronAPI);
  console.log('Electron API exposed successfully');
} catch (error) {
  console.error('Failed to expose Electron API:', error);
}