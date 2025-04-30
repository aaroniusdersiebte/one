// src/components/music/MusicContent.jsx
import React, { useState, useRef } from 'react';
import { FiUpload, FiPlusCircle, FiMusic } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';
import MoodView from './MoodView';
import SongList from './SongList';
import CreateMoodModal from './CreateMoodModal';
import AddSongModal from './AddSongModal';

function MusicContent() {
  const { 
    music: { moods, songs, currentMood },
    addSong,
    playMood
  } = useAppStore();
  
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [showCreateMoodModal, setShowCreateMoodModal] = useState(false);
  const fileInputRef = useRef(null);
  
  // Handle drag and drop for song files
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get the dropped files
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };
  
  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };
  
  const handleFiles = async (files) => {
    // Only accept audio files
    const audioFiles = Array.from(files).filter(file => 
      file.type.startsWith('audio/') || 
      file.name.endsWith('.mp3') || 
      file.name.endsWith('.wav') ||
      file.name.endsWith('.ogg') ||
      file.name.endsWith('.m4a')
    );
    
    if (audioFiles.length === 0) {
      alert('Please select audio files');
      return;
    }
    
    // Process each audio file
    for (const file of audioFiles) {
      try {
        // In Electron, we can access the file path directly
        const filePath = file.path;
        
        // Extract metadata from filename or prompt user
        // For this example, we'll just use the filename
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        
        // Simple metadata extraction from filename (Artist - Title.mp3)
        let title = fileName;
        let artist = 'Unknown Artist';
        
        const splitName = fileName.split(' - ');
        if (splitName.length > 1) {
          artist = splitName[0];
          title = splitName.slice(1).join(' - ');
        }
        
        // Add song to the store
        addSong(filePath, {
          title,
          artist,
          album: 'Unknown Album',
          duration: 0 // We'll get actual duration when playing
        }, currentMood);
        
        // Show success notification
        console.log(`Added song: ${title} by ${artist}`);
      } catch (error) {
        console.error('Error adding song:', error);
      }
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Get songs for the current view
  let viewTitle = 'All Songs';
  let viewSongs = songs;
  
  if (currentMood) {
    const mood = moods.find(m => m.id === currentMood);
    viewTitle = mood ? mood.name : 'Unknown Mood';
    viewSongs = songs.filter(song => song.moodId === currentMood);
  }
  
  return (
    <div 
      className="flex-1 flex flex-col h-full overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-white">{viewTitle}</h1>
        
        <div className="flex">
          <button
            className="flex items-center bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded mr-2"
            onClick={() => setShowCreateMoodModal(true)}
          >
            <FiPlusCircle className="mr-1" />
            <span>New Mood</span>
          </button>
          
          <button
            className="flex items-center bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded mr-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <FiUpload className="mr-1" />
            <span>Add Songs</span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept="audio/*"
              className="hidden"
            />
          </button>
          
          {currentMood && (
            <button
              className="flex items-center bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
              onClick={() => playMood(currentMood)}
            >
              <FiMusic className="mr-1" />
              <span>Play Mood</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentMood ? (
          // Mood View
          <MoodView moodId={currentMood} />
        ) : (
          // All Songs view
          viewSongs.length > 0 ? (
            <SongList songs={viewSongs} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FiMusic size={48} className="mb-4" />
              <p className="text-xl mb-2">No songs yet</p>
              <p className="mb-4">Add songs to get started</p>
              <button
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded flex items-center"
                onClick={() => fileInputRef.current?.click()}
              >
                <FiUpload className="mr-2" />
                <span>Upload Music</span>
              </button>
            </div>
          )
        )}
      </div>

      {/* Modals */}
      <CreateMoodModal 
        isOpen={showCreateMoodModal} 
        onClose={() => setShowCreateMoodModal(false)} 
      />
      
      <AddSongModal 
        isOpen={showAddSongModal} 
        onClose={() => setShowAddSongModal(false)} 
      />
    </div>
  );
}

export default MusicContent;