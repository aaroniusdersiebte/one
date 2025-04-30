// src/components/music/Song.jsx
import React, { useState } from 'react';
import { 
  FiPlay, 
  FiPause, 
  FiEdit2, 
  FiTrash2, 
  FiPlus, 
  FiCheck 
} from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';

function Song({ song, index, isPlaying }) {
  const { 
    music: { moods, isPlaying: playbackActive },
    playSong,
    togglePlay,
    updateSong,
    deleteSong,
    moveSongToMood,
    addToQueue
  } = useAppStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(song.title);
  const [editArtist, setEditArtist] = useState(song.artist);
  const [editAlbum, setEditAlbum] = useState(song.album);
  const [showMoodMenu, setShowMoodMenu] = useState(false);
  

  const checkFileBeforePlaying = async () => {
    try {
      // Check if the file exists
      const fileCheck = await window.electron.checkAudioFile(song.filePath);
      
      if (!fileCheck.exists) {
        alert(`File not found: ${song.filePath}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking file:', error);
      alert('Error checking audio file');
      return false;
    }
  };
  

  const handlePlay = () => {
    if (isPlaying) {
      togglePlay();
    } else {
      playSong(song.id);
      window.electron.hapticFeedback();
    }
  };

  
  // Handle delete song
  const handleDelete = () => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${song.title}"?`);
    if (confirmDelete) {
      deleteSong(song.id);
      window.electron.hapticFeedback();
    }
  };
  
  // Handle save edited song
  const handleSave = () => {
    updateSong(song.id, {
      title: editTitle.trim() || 'Unknown Title',
      artist: editArtist.trim() || 'Unknown Artist',
      album: editAlbum.trim() || 'Unknown Album'
    });
    setIsEditing(false);
    window.electron.hapticFeedback();
  };
  
  // Format time (seconds) to MM:SS
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get the current mood of the song
  const currentMood = moods.find(m => m.id === song.moodId);
  
  return (
    <div 
      className={`grid grid-cols-12 gap-4 py-2 px-4 border-b border-gray-700 last:border-b-0 ${
        isPlaying ? 'bg-gray-700' : 'hover:bg-gray-700'
      } group`}
    >
      {/* Index / Play Button */}
      <div className="col-span-1 flex items-center">
        <div className="relative">
          <span className={`group-hover:hidden ${isPlaying ? 'hidden' : 'block'}`}>
            {index}
          </span>
          <button
            className={`absolute left-0 top-1/2 transform -translate-y-1/2 text-white ${
              isPlaying ? 'block' : 'group-hover:block hidden'
            }`}
            onClick={handlePlay}
          >
            {isPlaying && playbackActive ? <FiPause size={16} /> : <FiPlay size={16} />}
          </button>
        </div>
      </div>
      
      {/* Song Details */}
      {isEditing ? (
        // Edit mode
        <>
          <div className="col-span-4">
            <input
              className="w-full bg-gray-600 text-white px-2 py-1 rounded outline-none"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="col-span-3">
            <input
              className="w-full bg-gray-600 text-white px-2 py-1 rounded outline-none"
              value={editArtist}
              onChange={(e) => setEditArtist(e.target.value)}
            />
          </div>
          <div className="col-span-3">
            <input
              className="w-full bg-gray-600 text-white px-2 py-1 rounded outline-none"
              value={editAlbum}
              onChange={(e) => setEditAlbum(e.target.value)}
            />
          </div>
          <div className="col-span-1 flex justify-end">
            <button
              className="text-green-500 hover:text-green-400 p-1"
              onClick={handleSave}
              title="Save"
            >
              <FiCheck size={16} />
            </button>
            <button
              className="text-red-500 hover:text-red-400 p-1"
              onClick={() => {
                setIsEditing(false);
                setEditTitle(song.title);
                setEditArtist(song.artist);
                setEditAlbum(song.album);
              }}
              title="Cancel"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        </>
      ) : (
        // View mode
        <>
          <div className="col-span-4 flex items-center overflow-hidden">
            <div className="truncate">
              <span className={`${isPlaying ? 'text-orange-400 font-medium' : 'text-white'}`}>
                {song.title}
              </span>
              {currentMood && (
                <span 
                  className={`ml-2 px-2 py-0.5 text-xs rounded-full`}
                  style={{ backgroundColor: currentMood.color || '#f97316' }}
                >
                  {currentMood.name}
                </span>
              )}
            </div>
          </div>
          <div className="col-span-3 text-gray-400 truncate">{song.artist}</div>
          <div className="col-span-3 text-gray-400 truncate">{song.album}</div>
          <div className="col-span-1 flex justify-end items-center">
            <span className="text-gray-400 mr-2">
              {formatTime(song.duration)}
            </span>
            
            {/* Action buttons (visible on hover) */}
            <div className="hidden group-hover:flex items-center">
              <div className="relative">
                <button
                  className="text-gray-400 hover:text-white p-1"
                  onClick={() => setShowMoodMenu(!showMoodMenu)}
                  title="Add to Mood"
                >
                  <FiPlus size={16} />
                </button>
                
                {/* Mood selection dropdown */}
                {showMoodMenu && (
                  <div className="absolute right-0 mt-1 bg-gray-800 rounded shadow-lg z-10 w-48">
                    <ul className="py-1">
                      <li className="px-4 py-2 text-xs text-gray-400 uppercase">
                        Add to Mood
                      </li>
                      {moods.map(mood => (
                        <li key={mood.id}>
                          <button
                            className={`w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center ${
                              mood.id === song.moodId ? 'text-orange-400' : 'text-white'
                            }`}
                            onClick={() => {
                              moveSongToMood(song.id, mood.id);
                              setShowMoodMenu(false);
                              window.electron.hapticFeedback();
                            }}
                          >
                            <span 
                              className="w-2 h-2 rounded-full mr-2"
                              style={{ backgroundColor: mood.color || '#f97316' }}
                            />
                            <span>{mood.name}</span>
                            {mood.id === song.moodId && (
                              <FiCheck className="ml-2" size={14} />
                            )}
                          </button>
                        </li>
                      ))}
                      {song.moodId && (
                        <li>
                          <button
                            className="w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-400"
                            onClick={() => {
                              moveSongToMood(song.id, null);
                              setShowMoodMenu(false);
                              window.electron.hapticFeedback();
                            }}
                          >
                            Remove from Mood
                          </button>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              
              <button
                className="text-gray-400 hover:text-white p-1"
                onClick={() => {
                  setIsEditing(true);
                  setEditTitle(song.title);
                  setEditArtist(song.artist);
                  setEditAlbum(song.album);
                }}
                title="Edit"
              >
                <FiEdit2 size={16} />
              </button>
              
              <button
                className="text-gray-400 hover:text-white p-1"
                onClick={handleDelete}
                title="Delete"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Song;