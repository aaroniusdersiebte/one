// electron/main.js
const path = require('path');
const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron'); // Add protocol import
const Store = require('electron-store');

// Bessere Pfadhandhabung für Dienste
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const servicesPath = isDev ? '../src/services' : '../src/services';

// Dienste importieren
const settingsService = require(path.join(__dirname, servicesPath, 'settingsService'));
const obsService = require(path.join(__dirname, servicesPath, 'obsService'));
const webServerService = require(path.join(__dirname, servicesPath, 'webServerService'));
const musicService = require(path.join(__dirname, servicesPath, 'musicService'));

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
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const startUrl = isDev 
    ? 'http://localhost:3000' // Dev server
    : `file://${path.join(__dirname, '../build/index.html')}`; // Production build path
  
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
  const obsSettings = settingsService.getOBSSettings();
  if (obsSettings.enabled) {
    // Webserver starten
    webServerService.start();
    
    // Mit OBS verbinden, wenn autoReconnect aktiviert ist
    if (obsSettings.autoReconnect) {
      obsService.connect().catch(err => console.error('Fehler beim Verbinden mit OBS:', err));
    }
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
  return store.get(key);
});

ipcMain.handle('saveData', async (event, { key, data }) => {
  store.set(key, data);
  return true;
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