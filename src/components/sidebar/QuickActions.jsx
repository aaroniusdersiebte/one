// src/components/sidebar/QuickActions.jsx
import React, { useState } from 'react';
import { FiPlus, FiEdit, FiClock, FiPlay } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';

function QuickActions() {
  const [customMinutes, setCustomMinutes] = useState(25);
  const [showCustomTimer, setShowCustomTimer] = useState(false);
  
  const { 
    openNewTaskWindow, 
    openNewNoteWindow, 
    startFocusTimer,
    updateGlobalFocusTimer
  } = useAppStore();

  // Handle quick focus timer start
  const handleQuickFocusTimer = (minutes = 25) => {
    const seconds = minutes * 60;
    
    updateGlobalFocusTimer({
      duration: seconds,
      timeLeft: seconds,
      isRunning: true
    });
    
    window.electron.hapticFeedback();
  };
  
  // Handle custom timer start
  const handleStartCustomTimer = () => {
    if (customMinutes > 0) {
      handleQuickFocusTimer(customMinutes);
      setShowCustomTimer(false);
    }
  };

  return (
    <div className="p-3 bg-gray-800 rounded-lg">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
        SHORTCUTS
      </h3>
      
      <div className="space-y-2">
        {/* New Task Button */}
        <button
          className="flex items-center justify-center w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded transition-colors"
          onClick={() => openNewTaskWindow()}
        >
          <FiPlus className="mr-2" size={16} />
          <span>New Task</span>
        </button>
        
        <div className="flex space-x-2">
          {/* New Note Button */}
          <button
            className="flex-1 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-3 rounded transition-colors"
            onClick={() => openNewNoteWindow()}
          >
            <FiEdit className="mr-1" size={14} />
            <span>New Note</span>
          </button>
          
          {/* Quick Focus Button */}
          <button
            className="flex-1 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-3 rounded transition-colors"
            onClick={() => setShowCustomTimer(!showCustomTimer)}
          >
            <FiClock className="mr-1" size={14} />
            <span>Focus Timer</span>
          </button>
        </div>
        
        {/* Custom Timer Input */}
        {showCustomTimer && (
          <div className="bg-gray-700 p-3 rounded">
            <div className="flex items-center mb-2">
              <input
                type="number"
                className="w-16 bg-gray-600 text-white p-1 rounded-l outline-none text-center"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
              />
              <span className="bg-gray-600 text-white p-1 rounded-r">minutes</span>
            </div>
            
            <div className="flex space-x-2">
              <button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-sm flex items-center justify-center"
                onClick={handleStartCustomTimer}
              >
                <FiPlay size={12} className="mr-1" />
                Start Timer
              </button>
              
              <button
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded text-sm"
                onClick={() => handleQuickFocusTimer(25)}
              >
                25m
              </button>
              
              <button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm"
                onClick={() => handleQuickFocusTimer(45)}
              >
                45m
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuickActions;