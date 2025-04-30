// electron/main.js
const path = require('path');
const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');
const Store = require('electron-store');

// Determine environment and paths
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Get correct paths for services
const getResourcePath = (resourceName) => {
  if (isDev) {
    // In development, services are in src/services
    return path.join(__dirname, '..', 'src', resourceName);
  } else {
    // In production, services are copied to extraResources
    return path.join(process.resourcesPath, resourceName);
  }
};

// Log paths for debugging
console.log('App path:', app.getAppPath());
console.log('Resources path:', process.resourcesPath);
console.log('Services path:', getResourcePath('services'));

// Initialisiere den Speicher
const store = new Store({
  name: 'miniplaner-data',
  defaults: {
    groups: [],
    tasks: [],
    tags: [],
    notes: [],
    archivedTasks: [],
    music_moods: [],
    music_songs: []
  }
});

// Log store path
console.log('Store path:', store.path);

// Dienste importieren (dynamische Imports verwenden)
let settingsService;
let obsService;
let webServerService;
let musicService;

try {
  settingsService = require(path.join(getResourcePath('services'), 'settingsService.js'));
  console.log('Loaded settingsService');
} catch (error) {
  console.error('Error loading settingsService:', error);
  settingsService = {
    getOBSSettings: () => ({}),
    getGeneralSettings: () => ({}),
    updateGeneralSettings: () => ({}),
    updateOBSSettings: () => ({}),
    exportSettings: () => ({ success: false }),
    importSettings: () => ({ success: false })
  };
}

try {
  obsService = require(path.join(getResourcePath('services'), 'obsService.js'));
  console.log('Loaded obsService');
} catch (error) {
  console.error('Error loading obsService:', error);
  obsService = {
    registerIPCHandlers: () => {},
    handleTaskCompleted: () => {},
    handleSubtaskCompleted: () => {}
  };
}

try {
  webServerService = require(path.join(getResourcePath('services'), 'webServerService.js'));
  console.log('Loaded webServerService');
} catch (error) {
  console.error('Error loading webServerService:', error);
  webServerService = {
    registerIPCHandlers: () => {},
    start: () => {},
    stop: () => {}
  };
}

try {
  musicService = require(path.join(getResourcePath('services'), 'musicService.js'));
  console.log('Loaded musicService');
} catch (error) {
  console.error('Error loading musicService:', error);
  musicService = {
    registerIPCHandlers: () => {}
  };
}

let mainWindow;

function createWindow() {
  // Erstelle das Browserfenster
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1e1e1e', // Dunkles Theme
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Enable file access via modern Electron APIs
      webSecurity: true
    }
  });

  // WICHTIG: Lade die richtige URL basierend auf der Umgebung
  const startUrl = isDev 
    ? 'http://localhost:3000' // Dev server
    : `file://${path.join(__dirname, '../build/index.html')}`; // Production build path
  
  console.log('Loading URL:', startUrl);
  mainWindow.loadURL(startUrl);
  
  // Öffne die DevTools im Entwicklungsmodus
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Entferne Referenz auf das Fenster wenn es geschlossen wird
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  // Globale Referenz auf das Hauptfenster
  global.mainWindow = mainWindow;
}

// Erstelle das Fenster, wenn Electron bereit ist
app.whenReady().then(() => {
  // Register a custom protocol for audio files
  protocol.registerFileProtocol('audio-file', (request, callback) => {
    const filePath = decodeURIComponent(request.url.slice('audio-file://'.length));
    try {
      callback({ path: filePath });
    } catch (error) {
      console.error('Protocol error:', error);
      callback({ error: -2 /* FAILED */ });
    }
  });
  
  createWindow();
  
  // Dienste starten, wenn Einstellungen aktiviert sind
  try {
    const obsSettings = settingsService.getOBSSettings();
    if (obsSettings.enabled) {
      // Webserver starten
      webServerService.start();
      
      // Mit OBS verbinden, wenn autoReconnect aktiviert ist
      if (obsSettings.autoReconnect) {
        obsService.connect().catch(err => console.error('Fehler beim Verbinden mit OBS:', err));
      }
    }
  } catch (error) {
    console.error('Error starting services:', error);
  }
});


app.on('before-quit', () => {
  // Webserver stoppen, wenn die App beendet wird
  if (webServerService && typeof webServerService.stop === 'function') {
    webServerService.stop();
  }
});

// Beende die Anwendung, wenn alle Fenster geschlossen sind (außer auf macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // Auf macOS: Erstelle ein neues Fenster, wenn auf das Dock-Icon geklickt wird
  if (mainWindow === null) {
    createWindow();
  }
});


// IPC Kommunikation für Datenspeicherung
ipcMain.handle('getData', async (event, key) => {
  try {
    return store.get(key);
  } catch (error) {
    console.error(`Error getting data for key ${key}:`, error);
    return null;
  }
});

ipcMain.handle('saveData', async (event, { key, data }) => {
  try {
    store.set(key, data);
    return true;
  } catch (error) {
    console.error(`Error saving data for key ${key}:`, error);
    return false;
  }
});

// Haptisches Feedback durch Vibration (Windows)
ipcMain.handle('hapticFeedback', async () => {
  if (process.platform === 'win32' && mainWindow) {
    mainWindow.webContents.executeJavaScript(`
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(10);
      }
    `);
  }
});

// IPC für Einstellungen
ipcMain.handle('settings:getGeneral', async () => {
  return settingsService.getGeneralSettings();
});

ipcMain.handle('settings:updateGeneral', async (event, settings) => {
  return settingsService.updateGeneralSettings(settings);
});

ipcMain.handle('settings:getOBS', async () => {
  return settingsService.getOBSSettings();
});

ipcMain.handle('settings:updateOBS', async (event, settings) => {
  return settingsService.updateOBSSettings(settings);
});

// IPC für Datei-Dialoge
ipcMain.handle('showSaveDialog', async (event, options) => {
  return dialog.showSaveDialog(mainWindow, options);
});

ipcMain.handle('showOpenDialog', async (event, options) => {
  return dialog.showOpenDialog(mainWindow, options);
});

ipcMain.handle('showMessageBox', async (event, options) => {
  return dialog.showMessageBox(mainWindow, options);
});

ipcMain.handle('exportSettings', async (event, filePath) => {
  return settingsService.exportSettings(filePath);
});

ipcMain.handle('importSettings', async (event, filePath) => {
  return settingsService.importSettings(filePath);
});

ipcMain.handle('restartApp', async () => {
  app.relaunch();
  app.exit(0);
});

// IPC für Aufgabenabschluss (OBS-Integration)
ipcMain.handle('handleTaskCompleted', async (event, taskId, groupId) => {
  obsService.handleTaskCompleted({ id: taskId }, groupId);
  return true;
});

ipcMain.handle('handleSubtaskCompleted', async (event, taskId, subtaskId, groupId) => {
  obsService.handleSubtaskCompleted(taskId, subtaskId, groupId);
  return true;
});

// IPC for file operations
ipcMain.handle('readAudioFile', async (event, filePath) => {
  try {
    // Check if file exists
    if (!require('fs').existsSync(filePath)) {
      return { error: 'File not found' };
    }
    
    // Simply return success for now, actual audio processing will happen in the renderer
    return { success: true, path: filePath };
  } catch (error) {
    console.error('Error reading audio file:', error);
    return { error: error.message };
  }
});

// IPC-Handler für OBS und Webserver registrieren
obsService.registerIPCHandlers();
webServerService.registerIPCHandlers();
musicService.registerIPCHandlers(); // Register music service IPC handlers