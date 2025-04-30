// src/components/music/AddSongModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiUpload, FiMusic, FiSave } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';

function AddSongModal({ isOpen, onClose }) {
  const { 
    music: { moods, currentMood },
    addSong
  } = useAppStore();
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedMoodId, setSelectedMoodId] = useState(currentMood);
  const fileInputRef = useRef(null);
  
  // Reset form when modal opens and update selected mood
  useEffect(() => {
    if (isOpen) {
      setSelectedFiles([]);
      setSelectedMoodId(currentMood);
    }
  }, [isOpen, currentMood]);
  
  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Filter audio files
    const audioFiles = files.filter(file => 
      file.type.startsWith('audio/') || 
      file.name.endsWith('.mp3') || 
      file.name.endsWith('.wav') ||
      file.name.endsWith('.ogg') ||
      file.name.endsWith('.m4a')
    );
    
    setSelectedFiles(audioFiles);
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (selectedFiles.length === 0) return;
    
    // Process each file
    selectedFiles.forEach(file => {
      // Extract basic metadata from filename
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      
      // Simple metadata extraction (Artist - Title.mp3)
      let title = fileName;
      let artist = 'Unknown Artist';
      
      const splitName = fileName.split(' - ');
      if (splitName.length > 1) {
        artist = splitName[0];
        title = splitName.slice(1).join(' - ');
      }
      
      // Add song to store
      addSong(file.path, {
        title,
        artist,
        album: 'Unknown Album',
        duration: 0
      }, selectedMoodId);
    });
    
    window.electron.hapticFeedback();
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-4 w-full max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Add Songs</h2>
          <button
            className="text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Select Files
          </label>
          
          <div 
            className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-orange-500 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              accept="audio/*"
              onChange={handleFileChange}
            />
            
            <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-300">
              Click to select or drag and drop
            </p>
            <p className="text-sm text-gray-400">
              MP3, WAV, OGG, M4A files
            </p>
          </div>
          
          {/* Selected files list */}
          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Selected Files ({selectedFiles.length})
              </h3>
              <ul className="max-h-40 overflow-y-auto bg-gray-700 rounded divide-y divide-gray-600">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="px-3 py-2 flex items-center text-sm">
                    <FiMusic className="text-gray-400 mr-2" />
                    <span className="truncate text-white">{file.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Add to Mood (Optional)
          </label>
          <select
            className="w-full bg-gray-700 text-white p-3 rounded outline-none focus:ring-1 focus:ring-orange-500"
            value={selectedMoodId || ''}
            onChange={(e) => setSelectedMoodId(e.target.value || null)}
          >
            <option value="">No Mood</option>
            {moods.map((mood) => (
              <option key={mood.id} value={mood.id}>
                {mood.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex justify-end">
          <button
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded flex items-center"
            onClick={handleSubmit}
            disabled={selectedFiles.length === 0}
          >
            <FiSave className="mr-2" />
            <span>Add Songs</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddSongModal;