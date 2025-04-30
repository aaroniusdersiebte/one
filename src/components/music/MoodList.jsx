// src/components/music/MoodList.jsx
import React, { useState } from 'react';
import { 
  FiMusic, 
  FiPlusCircle, 
  FiPlay, 
  FiEdit2, 
  FiTrash2, 
  FiCheck, 
  FiX 
} from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';

function MoodList() {
  const { 
    music: { moods, songs, currentMood },
    setCurrentMood,
    playMood,
    addMood,
    updateMood,
    deleteMood
  } = useAppStore();
  
  const [isAddingMood, setIsAddingMood] = useState(false);
  const [newMoodName, setNewMoodName] = useState('');
  const [editingMoodId, setEditingMoodId] = useState(null);
  const [editingMoodName, setEditingMoodName] = useState('');
  
  // Submit new mood
  const handleAddMood = () => {
    if (newMoodName.trim()) {
      addMood(newMoodName.trim());
      setNewMoodName('');
      setIsAddingMood(false);
      window.electron.hapticFeedback();
    }
  };
  
  // Submit edited mood
  const handleUpdateMood = () => {
    if (editingMoodName.trim() && editingMoodId) {
      updateMood(editingMoodId, { name: editingMoodName.trim() });
      setEditingMoodId(null);
      setEditingMoodName('');
      window.electron.hapticFeedback();
    }
  };
  
  // Start editing a mood
  const handleStartEdit = (mood) => {
    setEditingMoodId(mood.id);
    setEditingMoodName(mood.name);
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setEditingMoodId(null);
    setEditingMoodName('');
  };
  
  // Delete mood confirmation
  const handleDeleteMood = (moodId) => {
    const confirmed = window.confirm('Are you sure you want to delete this mood? Songs will be moved to "All Songs".');
    if (confirmed) {
      deleteMood(moodId);
      window.electron.hapticFeedback();
    }
  };
  
  // Keyboard event handlers
  const handleNewMoodKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddMood();
    } else if (e.key === 'Escape') {
      setIsAddingMood(false);
      setNewMoodName('');
    }
  };
  
  const handleEditMoodKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleUpdateMood();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };
  
  // Count songs in each mood
  const getSongCount = (moodId) => {
    return songs.filter(song => song.moodId === moodId).length;
  };

  return (
    <div className="pt-2">
      <h3 className="px-4 py-2 text-xs text-gray-500 uppercase font-semibold">
        Music Library
      </h3>
      
      <ul>
        {/* All Songs item */}
        <li>
          <button
            className={`flex items-center justify-between w-full px-4 py-2 ${
              currentMood === null 
                ? 'bg-gray-700 text-orange-400' 
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
            onClick={() => setCurrentMood(null)}
          >
            <div className="flex items-center">
              <FiMusic className="mr-2" />
              <span>All Songs</span>
            </div>
            <span className="text-xs bg-gray-600 px-2 py-0.5 rounded-full">
              {songs.length}
            </span>
          </button>
        </li>
        
        {/* Moods list */}
        {moods.map((mood) => (
          <li key={mood.id}>
            {editingMoodId === mood.id ? (
              <div className="px-4 py-2 flex items-center">
                <input
                  type="text"
                  className="flex-1 bg-gray-600 text-white px-2 py-1 rounded-l outline-none"
                  value={editingMoodName}
                  onChange={(e) => setEditingMoodName(e.target.value)}
                  onKeyDown={handleEditMoodKeyDown}
                  autoFocus
                />
                <button
                  className="bg-green-600 hover:bg-green-700 p-1 text-white"
                  onClick={handleUpdateMood}
                >
                  <FiCheck size={18} />
                </button>
                <button
                  className="bg-red-600 hover:bg-red-700 p-1 text-white rounded-r"
                  onClick={handleCancelEdit}
                >
                  <FiX size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center group">
                <button
                  className={`flex items-center flex-1 px-4 py-2 ${
                    currentMood === mood.id 
                      ? 'bg-gray-700 text-orange-400' 
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                  onClick={() => setCurrentMood(mood.id)}
                >
                  <span 
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: mood.color || '#f97316' }}
                  />
                  <span>{mood.name}</span>
                  <span className="ml-2 text-xs bg-gray-600 px-2 py-0.5 rounded-full">
                    {getSongCount(mood.id)}
                  </span>
                </button>
                
                <div className="hidden group-hover:flex pr-2">
                  <button
                    className="text-green-500 hover:text-green-400 p-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      playMood(mood.id);
                    }}
                    title="Play"
                  >
                    <FiPlay size={14} />
                  </button>
                  <button
                    className="text-blue-500 hover:text-blue-400 p-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(mood);
                    }}
                    title="Edit"
                  >
                    <FiEdit2 size={14} />
                  </button>
                  <button
                    className="text-red-500 hover:text-red-400 p-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMood(mood.id);
                    }}
                    title="Delete"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
        
        {/* Add new mood */}
        {isAddingMood ? (
          <li className="px-4 py-2">
            <div className="flex items-center">
              <input
                type="text"
                className="flex-1 bg-gray-600 text-white px-2 py-1 rounded-l outline-none"
                placeholder="Mood name"
                value={newMoodName}
                onChange={(e) => setNewMoodName(e.target.value)}
                onKeyDown={handleNewMoodKeyDown}
                autoFocus
              />
              <button
                className="bg-green-600 hover:bg-green-700 p-1 text-white"
                onClick={handleAddMood}
              >
                <FiCheck size={18} />
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 p-1 text-white rounded-r"
                onClick={() => {
                  setIsAddingMood(false);
                  setNewMoodName('');
                }}
              >
                <FiX size={18} />
              </button>
            </div>
          </li>
        ) : (
          <li>
            <button
              className="flex items-center text-gray-400 hover:text-white w-full px-4 py-2"
              onClick={() => setIsAddingMood(true)}
            >
              <FiPlusCircle className="mr-2" />
              <span>New Mood</span>
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}

export default MoodList;