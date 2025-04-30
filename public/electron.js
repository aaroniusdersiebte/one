// public/electron.js
const path = require('path');
const { app, BrowserWindow } = require('electron');
const isDev = process.env.NODE_ENV === 'development';

// Log app paths for debugging
console.log('App path:', app.getAppPath());
console.log('Process path:', process.resourcesPath);

// Determine the correct path for main.js
let mainFile;
try {
  // In development
  if (isDev) {
    mainFile = path.join(__dirname, '../electron/main.js');
  } 
  // In production (inside app.asar)
  else if (app.getAppPath().includes('app.asar')) {
    mainFile = path.join(app.getAppPath(), 'electron/main.js');
  }
  // In production (unpacked)
  else {
    mainFile = path.join(__dirname, '../electron/main.js');
  }
  
  console.log('Loading main from:', mainFile);
  
  // This is needed for proper packaging
  module.exports = require(mainFile);
} catch (error) {
  console.error('Error loading main.js:', error);
  // Provide a basic fallback implementation if main.js can't be loaded
  const { app, BrowserWindow } = require('electron');
  
  let mainWindow;
  
  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }
  
  app.whenReady().then(createWindow);
  
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
  
  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
  
  module.exports = app;
}