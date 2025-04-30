// src/components/music/MoodView.jsx
import React, { useState } from 'react';
import { FiEdit2, FiSave, FiX, FiMusic } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';
import SongList from './SongList';

function MoodView({ moodId }) {
  const { 
    music: { moods, songs },
    updateMood
  } = useAppStore();
  
  const mood = moods.find(m => m.id === moodId);
  const moodSongs = songs.filter(song => song.moodId === moodId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(mood?.name || '');
  const [editColor, setEditColor] = useState(mood?.color || '#f97316');
  
  // Available colors for mood
  const colorOptions = [
    '#f97316', // Orange (default)
    '#10b981', // Green
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#ef4444', // Red
    '#f59e0b', // Yellow
    '#6366f1'  // Indigo
  ];
  
  // Handle save mood details
  const handleSave = () => {
    if (editName.trim() && mood) {
      updateMood(mood.id, {
        name: editName.trim(),
        color: editColor
      });
      setIsEditing(false);
      window.electron.hapticFeedback();
    }
  };
  
  // If mood not found
  if (!mood) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <p>Mood not found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Mood header */}
      <div className="mb-6 pb-4 border-b border-gray-700">
        {isEditing ? (
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="flex-1 mb-4 md:mb-0 md:mr-4">
              <label className="block text-gray-400 text-sm mb-1">Name</label>
              <input
                type="text"
                className="w-full bg-gray-700 text-white px-3 py-2 rounded outline-none"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="mb-4 md:mb-0 md:mr-4">
              <label className="block text-gray-400 text-sm mb-1">Color</label>
              <div className="flex space-x-2">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full ${
                      color === editColor ? 'ring-2 ring-white' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditColor(color)}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex space-x-2 mt-4 md:mt-0">
              <button
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded flex items-center"
                onClick={handleSave}
              >
                <FiSave className="mr-2" />
                <span>Save</span>
              </button>
              
              <button
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center"
                onClick={() => {
                  setIsEditing(false);
                  setEditName(mood.name);
                  setEditColor(mood.color || '#f97316');
                }}
              >
                <FiX className="mr-2" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: mood.color || '#f97316' }}
              />
              <h2 className="text-xl font-semibold text-white">{mood.name}</h2>
              <span className="ml-2 text-gray-400">
                {moodSongs.length} songs
              </span>
            </div>
            
            <button
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded flex items-center"
              onClick={() => {
                setIsEditing(true);
                setEditName(mood.name);
                setEditColor(mood.color || '#f97316');
              }}
            >
              <FiEdit2 className="mr-1" />
              <span>Edit Mood</span>
            </button>
          </div>
        )}
      </div>

      {/* Songs list */}
      {moodSongs.length > 0 ? (
        <SongList songs={moodSongs} />
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <FiMusic size={48} className="mb-4" />
          <p className="text-xl mb-2">No songs in this mood</p>
          <p>Drag and drop songs here or use the "Add Songs" button</p>
        </div>
      )}
    </div>
  );
}

export default MoodView;