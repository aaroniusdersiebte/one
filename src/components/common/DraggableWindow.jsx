// src/components/common/DraggableWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiMaximize, FiMinimize, FiPlusCircle, FiMinusCircle } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';
import TaskDetails from '../tasks/TaskDetails';
import NoteDetails from '../notes/NoteDetails';

const DraggableWindow = ({ 
  id, 
  title, 
  isPinned = false, 
  onClose,
  initialPosition = { x: 100, y: 100 },
  type,
  data
}) => {
  const { pinWindow, unpinWindow } = useAppStore();
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 500, height: 400 });
  const [isMaximized, setIsMaximized] = useState(false);
  const windowRef = useRef(null);
  
  // For click outside detection
  useEffect(() => {
    function handleClickOutside(event) {
      if (windowRef.current && !windowRef.current.contains(event.target) && !isPinned) {
        onClose();
      }
    }

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Remove event listener on cleanup
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, isPinned]);

  // Initialize drag
  const handleMouseDown = (e) => {
    if (isMaximized) return;
    
    setIsDragging(true);
    setStartPos({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    
    // Add temporary event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Prevent text selection during drag
    e.preventDefault();
  };

  // Handle drag movement
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y
    });
  };

  // End drag
  const handleMouseUp = () => {
    setIsDragging(false);
    
    // Remove temporary event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Toggle pin state
  const handleTogglePin = () => {
    if (isPinned) {
      unpinWindow(id);
    } else {
      pinWindow(id);
    }
  };

  // Toggle maximize state
  const handleToggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  // Resize window
  const handleResize = (direction) => {
    const increment = 50;
    if (direction === 'larger') {
      setSize({
        width: size.width + increment,
        height: size.height + increment
      });
    } else {
      setSize({
        width: Math.max(300, size.width - increment),
        height: Math.max(200, size.height - increment)
      });
    }
  };

  // Calculate window styles
  const windowStyle = isMaximized 
    ? {
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        width: '100%',
        height: '100%',
        zIndex: 50,
      }
    : {
        position: 'absolute',
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: 40,
      };

  // Render appropriate content based on window type
  const renderContent = () => {
    switch (type) {
      case 'task':
        return <TaskDetails taskId={data.id} />;
      case 'note':
        return <NoteDetails noteId={data.id} />;
      case 'newTask':
        return <TaskDetails isNew={true} initialGroupId={data.groupId} />;
      case 'newNote':
        return <NoteDetails isNew={true} />;
      default:
        return <div>Unknown window type</div>;
    }
  };

  return (
    <div 
      ref={windowRef}
      className={`bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col ${isDragging ? 'cursor-grabbing' : ''}`}
      style={windowStyle}
    >
      {/* Window header */}
      <div 
        className="p-3 bg-gray-700 flex items-center justify-between cursor-grab select-none"
        onMouseDown={handleMouseDown}
      >
        <h3 className="text-white font-medium truncate">{title}</h3>
        
        <div className="flex items-center space-x-2">
          {/* Window controls */}
          <button 
            className={`p-1 rounded-full ${isPinned ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={handleTogglePin}
            title={isPinned ? "Unpin window" : "Pin window"}
          >
            <FiPlusCircle size={16} />
          </button>
          
          <button 
            className="text-gray-400 hover:text-white p-1"
            onClick={handleToggleMaximize}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <FiMinimize size={16} /> : <FiMaximize size={16} />}
          </button>
          
          <button 
            className="text-gray-400 hover:text-red-500 p-1"
            onClick={onClose}
            title="Close"
          >
            <FiX size={16} />
          </button>
        </div>
      </div>
      
      {/* Window content */}
      <div className="flex-1 overflow-auto p-4">
        {renderContent()}
      </div>
      
      {/* Resize controls (only when not maximized) */}
      {!isMaximized && (
        <div className="p-1 bg-gray-700 flex justify-end">
          <button 
            className="text-gray-400 hover:text-white p-1"
            onClick={() => handleResize('smaller')}
            title="Make smaller"
          >
            <FiMinusCircle size={14} />
          </button>
          <button 
            className="text-gray-400 hover:text-white p-1"
            onClick={() => handleResize('larger')}
            title="Make larger"
          >
            <FiPlusCircle size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default DraggableWindow;