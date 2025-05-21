// src/components/notes/NoteDetails.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FiSave, FiArrowRight, FiClock } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';

const NoteDetails = ({ noteId, isNew = false }) => {
  const { 
    notes, 
    groups, 
    addNote, 
    updateNote,
    convertNoteToTask, 
    closeWindow,
    startFocusTimer
  } = useAppStore();
  
  // Find current note if not new
  const note = !isNew ? notes.find(n => n.id === noteId) : null;
  
  // Form state
  const [title, setTitle] = useState(note ? note.title : 'New Note');
  const [content, setContent] = useState(note ? note.content : '');
  const [showConvertOptions, setShowConvertOptions] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(
    groups.length > 0 ? groups[0].id : null
  );
  
  // Refs for input focus
  const titleInputRef = useRef(null);
  const contentInputRef = useRef(null);
  
  // Set focus on title input when creating a new note
  useEffect(() => {
    if (isNew && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isNew]);
  
  // Update note in real-time as user types
  useEffect(() => {
    if (!isNew && note) {
      const debounceTimeout = setTimeout(() => {
        if (title !== note.title || content !== note.content) {
          updateNote(noteId, title, content);
        }
      }, 500);
      
      return () => clearTimeout(debounceTimeout);
    }
  }, [title, content, updateNote, noteId, isNew, note]);
  
  // Save new note
  const handleSaveNewNote = () => {
    if (title.trim()) {
      addNote(title.trim(), content);
      window.electron.hapticFeedback();
      closeWindow();
    }
  };
  
  // Convert note to task
  const handleConvertToTask = () => {
    if (selectedGroupId && !isNew) {
      convertNoteToTask(noteId, selectedGroupId);
      window.electron.hapticFeedback();
      closeWindow();
    }
  };
  
  // Start focus timer for this note
  const handleStartFocusTimer = (minutes = 25) => {
    if (!isNew) {
      startFocusTimer(`note-${noteId}`, minutes * 60);
      window.electron.hapticFeedback();
    }
  };
  
  // Date formatting helper
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Note title */}
      <div className="mb-4">
        <input
          ref={titleInputRef}
          type="text"
          className="w-full bg-gray-700 text-white px-3 py-2 text-lg font-medium rounded outline-none focus:ring-1 focus:ring-orange-500"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
        />
        
        {!isNew && note && (
          <div className="text-xs text-gray-500 mt-1">
            Created: {formatDate(note.createdAt)}
          </div>
        )}
      </div>
      
      {/* Focus timer controls */}
      <div className="bg-gray-700 rounded p-3 mb-4">
        <h3 className="text-sm font-medium text-white mb-2 flex items-center">
          <FiClock className="mr-1" size={14} />
          Focus Timer
        </h3>
        
        <div className="flex space-x-2">
          <button
            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm flex items-center"
            onClick={() => handleStartFocusTimer(25)}
            disabled={isNew}
          >
            <span>25 min</span>
          </button>
          
          <button
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm flex items-center"
            onClick={() => handleStartFocusTimer(15)}
            disabled={isNew}
          >
            <span>15 min</span>
          </button>
          
          <button
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm flex items-center"
            onClick={() => handleStartFocusTimer(45)}
            disabled={isNew}
          >
            <span>45 min</span>
          </button>
        </div>
      </div>
      
      {/* Note content */}
      <div className="flex-1 mb-4">
        <h3 className="text-sm font-medium text-white mb-2">Content</h3>
        <textarea
          ref={contentInputRef}
          className="w-full h-full min-h-[200px] bg-gray-700 text-white p-3 rounded resize-none outline-none focus:ring-1 focus:ring-orange-500"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note here..."
        />
      </div>
      
      {/* Convert to task */}
      {!isNew && (
        <div className="mb-4">
          {showConvertOptions ? (
            <div className="bg-gray-700 rounded p-3">
              <h3 className="text-sm font-medium text-white mb-2 flex items-center">
                <FiArrowRight className="mr-1" size={14} />
                Convert to Task
              </h3>
              
              <select
                className="w-full bg-gray-600 text-white px-3 py-2 rounded outline-none mb-3 focus:ring-1 focus:ring-orange-500"
                value={selectedGroupId || ''}
                onChange={(e) => setSelectedGroupId(e.target.value)}
              >
                <option value="" disabled>Select group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              
              <div className="flex justify-end space-x-2">
                <button
                  className="text-gray-400 hover:text-gray-300 text-sm"
                  onClick={() => setShowConvertOptions(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm"
                  onClick={handleConvertToTask}
                  disabled={!selectedGroupId}
                >
                  Convert
                </button>
              </div>
            </div>
          ) : (
            <button
              className="text-gray-400 hover:text-white px-3 py-1 rounded text-sm flex items-center"
              onClick={() => setShowConvertOptions(true)}
            >
              <FiArrowRight className="mr-1" size={14} />
              Convert to Task
            </button>
          )}
        </div>
      )}
      
      {/* Bottom actions - only for new notes */}
      {isNew && (
        <div className="mt-auto pt-4 flex justify-end">
          <button
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded mr-2"
            onClick={() => closeWindow()}
          >
            Cancel
          </button>
          <button
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded flex items-center"
            onClick={handleSaveNewNote}
            disabled={!title.trim()}
          >
            <FiSave className="mr-2" />
            Create Note
          </button>
        </div>
      )}
    </div>
  );
};

export default NoteDetails;