// src/components/notes/NoteCard.jsx
import React, { useState } from 'react';
import { FiClock, FiEdit2, FiTrash2, FiArrowRight } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';

const NoteCard = ({ note }) => {
  const { 
    deleteNote, 
    openNoteWindow,
    groups,
    convertNoteToTask
  } = useAppStore();
  
  const [isHovered, setIsHovered] = useState(false);
  const [showConvertOptions, setShowConvertOptions] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(
    groups.length > 0 ? groups[0].id : null
  );
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    });
  };
  
  // Get preview of content
  const getContentPreview = () => {
    if (!note.content) return 'No content';
    return note.content.length > 150 
      ? note.content.substring(0, 150) + '...' 
      : note.content;
  };
  
  // Handle card click
  const handleCardClick = () => {
    openNoteWindow(note.id);
  };
  
  // Handle delete
  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${note.title}"?`)) {
      deleteNote(note.id);
      window.electron.hapticFeedback();
    }
  };
  
  // Handle convert to task
  const handleConvertToTask = (e) => {
    e.stopPropagation();
    
    if (selectedGroupId) {
      convertNoteToTask(note.id, selectedGroupId);
      window.electron.hapticFeedback();
    }
  };
  
  return (
    <div 
      className={`bg-gray-800 rounded-lg p-4 shadow-md transition-all duration-200 cursor-pointer h-full
        hover:shadow-lg hover:translate-y-[-2px]
        ${isHovered ? 'ring-1 ring-orange-500' : ''}
      `}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-medium text-white">
          {note.title || 'Untitled Note'}
        </h3>
        
        {/* Action buttons (visible on hover) */}
        {isHovered && (
          <div className="flex space-x-1">
            <button 
              className="text-gray-400 hover:text-orange-400 p-1"
              onClick={(e) => {
                e.stopPropagation();
                openNoteWindow(note.id, true); // Open with focus mode
              }}
              title="Focus mode"
            >
              <FiClock size={16} />
            </button>
            
            <button 
              className="text-gray-400 hover:text-orange-400 p-1"
              onClick={(e) => {
                e.stopPropagation();
                openNoteWindow(note.id);
              }}
              title="Edit"
            >
              <FiEdit2 size={16} />
            </button>
            
            <button 
              className="text-gray-400 hover:text-red-500 p-1"
              onClick={handleDelete}
              title="Delete"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        )}
      </div>
      
      {/* Note content preview */}
      <div className="text-sm text-gray-300 whitespace-pre-line break-words line-clamp-4 mb-4 min-h-[80px]">
        {getContentPreview()}
      </div>
      
      {/* Bottom info */}
      <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-700">
        <div className="text-xs text-gray-500">
          {formatDate(note.createdAt)}
        </div>
        
        {/* Convert to task */}
        {showConvertOptions ? (
          <div className="relative" onClick={e => e.stopPropagation()}>
            <div className="absolute bottom-8 right-0 bg-gray-700 rounded shadow-lg p-3 w-48 z-10">
              <select
                className="w-full bg-gray-600 text-white px-2 py-1 rounded outline-none mb-2 text-sm"
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
              
              <div className="flex justify-between">
                <button
                  className="text-xs text-gray-400 hover:text-white"
                  onClick={() => setShowConvertOptions(false)}
                >
                  Cancel
                </button>
                <button
                  className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded"
                  onClick={handleConvertToTask}
                  disabled={!selectedGroupId}
                >
                  Convert
                </button>
              </div>
            </div>
            
            <button
              className="text-orange-500 hover:text-orange-400 text-xs flex items-center"
              title="Convert to task"
            >
              <FiArrowRight size={12} className="mr-1" />
              <span>Convert</span>
            </button>
          </div>
        ) : (
          <button
            className="text-gray-400 hover:text-orange-400 text-xs flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              setShowConvertOptions(true);
            }}
            title="Convert to task"
          >
            <FiArrowRight size={12} className="mr-1" />
            <span>Convert</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default NoteCard;