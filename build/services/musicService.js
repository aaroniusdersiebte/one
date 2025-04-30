// src/services/musicService.js
const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const settingsService = require('./settingsService');

class MusicService {
  constructor() {
    this.settings = settingsService.getGeneralSettings();
  }

  // Register IPC handlers for the renderer process
  registerIPCHandlers() {
    // Get audio file metadata
    ipcMain.handle('music:get-metadata', async (event, filePath) => {
      try {
        return await this.getAudioMetadata(filePath);
      } catch (error) {
        console.error('Error getting audio metadata:', error);
        return { error: error.message };
      }
    });

    // Get audio duration
    ipcMain.handle('music:get-duration', async (event, filePath) => {
      try {
        return await this.getAudioDuration(filePath);
      } catch (error) {
        console.error('Error getting audio duration:', error);
        return { error: error.message };
      }
    });

    // Check if file exists
    ipcMain.handle('music:file-exists', async (event, filePath) => {
      try {
        return fs.existsSync(filePath);
      } catch (error) {
        console.error('Error checking file existence:', error);
        return false;
      }
    });
  }

  // Get audio metadata
  async getAudioMetadata(filePath) {
    // Basic metadata extraction from filename
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // Try to extract artist and title from filename (Artist - Title)
    let title = fileName;
    let artist = 'Unknown Artist';
    
    const splitName = fileName.split(' - ');
    if (splitName.length > 1) {
      artist = splitName[0];
      title = splitName.slice(1).join(' - ');
    }
    
    return {
      title,
      artist,
      album: 'Unknown Album',
      duration: 0 // Will be determined during playback
    };
  }

  // Get audio duration
  // Note: This is not easily possible in Node.js without additional libraries
  // In a real implementation, you would use libraries like node-ffprobe or music-metadata
  async getAudioDuration(filePath) {
    // Placeholder for a proper implementation
    return {
      duration: 0 // Will be determined during playback in the renderer
    };
  }
}

// Singleton instance
const musicService = new MusicService();

module.exports = musicService;