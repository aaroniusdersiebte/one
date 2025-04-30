// src/components/settings/MusicSettings.jsx
import React, { useState, useEffect } from 'react';
import { 
  FiMusic, 
  FiFolder, 
  FiSliders, 
  FiHardDrive,
  FiFolderPlus
} from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';

function MusicSettings() {
  const [settings, setSettings] = useState({
    musicLibraryPath: '',
    defaultVolume: 0.7,
    fadeTransitions: true,
    visualizerEnabled: false,
    autoSaveMetadata: true
  });
  
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  
  // Load settings when component mounts
  useEffect(() => {
    async function loadSettings() {
      try {
        const generalSettings = await window.electron.getGeneralSettings();
        // Extract music settings or use defaults
        const musicSettings = generalSettings.music || {
          musicLibraryPath: '',
          defaultVolume: 0.7,
          fadeTransitions: true,
          visualizerEnabled: false,
          autoSaveMetadata: true
        };
        setSettings(musicSettings);
      } catch (error) {
        console.error('Fehler beim Laden der Musik-Einstellungen:', error);
      }
    }
    
    loadSettings();
  }, []);
  
  // Update settings in store
  const handleSettingsChange = (field, value) => {
    setSettings(prev => {
      const updated = { ...prev, [field]: value };
      // Save to general settings
      window.electron.getGeneralSettings().then(generalSettings => {
        window.electron.updateGeneralSettings({
          ...generalSettings,
          music: updated
        });
      });
      return updated;
    });
  };
  
  // Choose music library folder
  const handleChooseFolder = async () => {
    try {
      const result = await window.electron.showOpenDialog({
        title: 'Select Music Library Folder',
        properties: ['openDirectory']
      });
      
      if (!result.canceled && result.filePaths.length > 0) {
        handleSettingsChange('musicLibraryPath', result.filePaths[0]);
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
    }
  };
  
  // Simulate scanning library
  const handleScanLibrary = () => {
    if (isScanning) return;
    
    setIsScanning(true);
    setScanProgress(0);
    
    // Simulate scanning progress
    const interval = setInterval(() => {
      setScanProgress(prev => {
        const newProgress = prev + 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return newProgress;
      });
    }, 200);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white mb-4">Music Settings</h2>

      {/* Music Library */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center">
          <FiFolder className="mr-2" />
          Music Library
        </h3>
        
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Library Location
          </label>
          <div className="flex">
            <input
              className="flex-1 bg-gray-600 text-white p-2 rounded-l outline-none"
              value={settings.musicLibraryPath}
              placeholder="No folder selected"
              readOnly
            />
            <button
              className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-r"
              onClick={handleChooseFolder}
            >
              <FiFolderPlus size={18} />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Optional: Set a default folder for your music library
          </p>
        </div>
        
        <div className="mb-4">
          <button
            className={`px-4 py-2 rounded ${
              isScanning 
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-orange-600 hover:bg-orange-700'
            } text-white flex items-center`}
            onClick={handleScanLibrary}
            disabled={isScanning}
          >
            <FiHardDrive className="mr-2" />
            <span>{isScanning ? 'Scanning...' : 'Scan Library'}</span>
          </button>
          
          {/* Progress bar */}
          {isScanning && (
            <div className="w-full h-2 bg-gray-600 rounded-full mt-2">
              <div 
                className="h-full bg-orange-600 rounded-full transition-all duration-150"
                style={{ width: `${scanProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>

      {/* Playback Settings */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center">
          <FiSliders className="mr-2" />
          Playback Settings
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Default Volume
            </label>
            <div className="flex items-center">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                className="w-full"
                value={settings.defaultVolume}
                onChange={(e) => handleSettingsChange('defaultVolume', parseFloat(e.target.value))}
              />
              <span className="ml-2 text-white">
                {Math.round(settings.defaultVolume * 100)}%
              </span>
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="fadeTransitions"
              checked={settings.fadeTransitions}
              onChange={(e) => handleSettingsChange('fadeTransitions', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="fadeTransitions" className="text-white cursor-pointer">
              Enable smooth transitions between songs
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="visualizerEnabled"
              checked={settings.visualizerEnabled}
              onChange={(e) => handleSettingsChange('visualizerEnabled', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="visualizerEnabled" className="text-white cursor-pointer">
              Show audio visualizer in music bar
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoSaveMetadata"
              checked={settings.autoSaveMetadata}
              onChange={(e) => handleSettingsChange('autoSaveMetadata', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="autoSaveMetadata" className="text-white cursor-pointer">
              Auto-save edited metadata to music files
            </label>
          </div>
        </div>
      </div>

      {/* Audio Format Support */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center">
          <FiMusic className="mr-2" />
          Supported Formats
        </h3>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-800 rounded p-2 text-center">
            <span className="text-white">MP3</span>
          </div>
          <div className="bg-gray-800 rounded p-2 text-center">
            <span className="text-white">WAV</span>
          </div>
          <div className="bg-gray-800 rounded p-2 text-center">
            <span className="text-white">OGG</span>
          </div>
          <div className="bg-gray-800 rounded p-2 text-center">
            <span className="text-white">AAC</span>
          </div>
          <div className="bg-gray-800 rounded p-2 text-center">
            <span className="text-white">FLAC</span>
          </div>
          <div className="bg-gray-800 rounded p-2 text-center">
            <span className="text-white">M4A</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MusicSettings;