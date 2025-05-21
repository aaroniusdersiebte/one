// src/components/focus/FloatingFocusTimer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FiClock, FiPlay, FiPause, FiX, FiPlus, FiMinus, FiMove } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';

const FloatingFocusTimer = () => {
  const { 
    globalFocusTimer, 
    updateGlobalFocusTimer, 
    activeTaskInFocus,
    tasks,
    notes
  } = useAppStore();
  
  const [timerIntervalId, setTimerIntervalId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [minimized, setMinimized] = useState(false);
  const [todayFocusMinutes, setTodayFocusMinutes] = useState(0);
  const timerRef = useRef(null);
  
  // Load saved today's focus minutes from local storage
  useEffect(() => {
    const storedMinutes = localStorage.getItem('todayFocusMinutes');
    if (storedMinutes) {
      setTodayFocusMinutes(parseInt(storedMinutes, 10));
    }
  }, []);
  
  // Timer functionality
  useEffect(() => {
    if (globalFocusTimer.isRunning && globalFocusTimer.timeLeft > 0) {
      // Clear any existing timer
      if (timerIntervalId) {
        clearInterval(timerIntervalId);
      }
      
      // Start a new timer
      const intervalId = setInterval(() => {
        updateGlobalFocusTimer({ 
          timeLeft: Math.max(0, globalFocusTimer.timeLeft - 1) 
        });
        
        // Track total focus time
        if (globalFocusTimer.timeLeft % 60 === 0) { // Update once per minute
          const newTodayMinutes = todayFocusMinutes + 1;
          setTodayFocusMinutes(newTodayMinutes);
          localStorage.setItem('todayFocusMinutes', newTodayMinutes.toString());
        }
      }, 1000);
      
      setTimerIntervalId(intervalId);
      
      return () => clearInterval(intervalId);
    } else if (!globalFocusTimer.isRunning && timerIntervalId) {
      clearInterval(timerIntervalId);
      setTimerIntervalId(null);
      
      // Haptic feedback when timer finishes
      if (globalFocusTimer.timeLeft <= 0) {
        window.electron.hapticFeedback();
      }
    }
  }, [globalFocusTimer.isRunning, globalFocusTimer.timeLeft, updateGlobalFocusTimer, timerIntervalId, todayFocusMinutes]);
  
  // Format time (seconds) to MM:SS or HH:MM:SS
  const formatTime = (seconds) => {
    if (seconds <= 0) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get task or note title if there's an active focus item
  const getFocusItemTitle = () => {
    if (!activeTaskInFocus) return null;
    
    if (activeTaskInFocus.startsWith('note-')) {
      const noteId = activeTaskInFocus.replace('note-', '');
      const note = notes.find(n => n.id === noteId);
      return note ? note.title : null;
    } else {
      const task = tasks.find(t => t.id === activeTaskInFocus);
      return task ? task.title : null;
    }
  };
  
  const focusItemTitle = getFocusItemTitle();
  
  // Timer controls
  const toggleTimer = () => {
    updateGlobalFocusTimer({ 
      isRunning: !globalFocusTimer.isRunning 
    });
    window.electron.hapticFeedback();
  };
  
  const adjustTimer = (minutes) => {
    updateGlobalFocusTimer({ 
      timeLeft: Math.max(0, globalFocusTimer.timeLeft + (minutes * 60)),
      duration: Math.max(0, globalFocusTimer.duration + (minutes * 60))
    });
    window.electron.hapticFeedback();
  };
  
  const resetTimer = () => {
    updateGlobalFocusTimer({ 
      timeLeft: 0,
      duration: 0,
      isRunning: false
    });
    window.electron.hapticFeedback();
  };
  
  // Calculate progress as percentage
  const progress = globalFocusTimer.duration > 0 
    ? (globalFocusTimer.timeLeft / globalFocusTimer.duration) * 100 
    : 0;
  
  // Dragging functionality
  const handleMouseDown = (e) => {
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
  
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y
    });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    
    // Remove temporary event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  // If minimized, show a smaller version
  if (minimized) {
    return (
      <div 
        className="fixed bg-gray-800 rounded-lg shadow-lg p-2 z-50 cursor-grab hover:bg-gray-700 transition-colors"
        style={{ top: `${position.y}px`, left: `${position.x}px` }}
        onMouseDown={handleMouseDown}
        ref={timerRef}
      >
        <div className="flex items-center">
          <FiClock className="text-orange-500 mr-1" size={16} />
          <span className="text-white">
            {formatTime(globalFocusTimer.timeLeft)}
          </span>
          <button 
            className="ml-2 text-gray-400 hover:text-white p-1"
            onClick={() => setMinimized(false)}
          >
            <FiPlus size={12} />
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`fixed bg-gray-800 rounded-lg shadow-lg p-3 z-50 ${isDragging ? 'cursor-grabbing' : ''}`}
      style={{ top: `${position.y}px`, left: `${position.x}px`, width: '220px' }}
      ref={timerRef}
    >
      {/* Header */}
      <div 
        className="flex justify-between items-center mb-2 cursor-grab"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center text-orange-500">
          <FiClock className="mr-1" size={16} />
          <span className="font-medium">Focus Timer</span>
        </div>
        
        <div className="flex items-center">
          <button 
            className="text-gray-400 hover:text-white p-1"
            onClick={() => setMinimized(true)}
            title="Minimize"
          >
            <FiMinus size={12} />
          </button>
          
          <button 
            className="text-gray-400 hover:text-white p-1"
            onClick={resetTimer}
            title="Reset"
          >
            <FiX size={12} />
          </button>
        </div>
      </div>
      
      {/* Timer display */}
      <div className="flex items-center justify-center mb-2">
        <div className="relative w-full h-8 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="absolute h-full bg-orange-600 transition-all duration-1000"
            style={{ width: `${progress}%` }}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-mono text-lg">
              {formatTime(globalFocusTimer.timeLeft)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Timer controls */}
      <div className="flex justify-between mb-2">
        <button
          className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-sm"
          onClick={() => adjustTimer(-5)}
          disabled={globalFocusTimer.timeLeft < 300}
        >
          -5m
        </button>
        
        <button
          className={`px-3 py-1 rounded text-white text-sm ${
            globalFocusTimer.isRunning 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
          onClick={toggleTimer}
        >
          {globalFocusTimer.isRunning ? (
            <><FiPause size={14} className="inline mr-1" /> Pause</>
          ) : (
            <><FiPlay size={14} className="inline mr-1" /> Start</>
          )}
        </button>
        
        <button
          className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-sm"
          onClick={() => adjustTimer(5)}
        >
          +5m
        </button>
      </div>
      
      {/* Focus subject */}
      {focusItemTitle && (
        <div className="text-center text-sm text-gray-300 truncate">
          Focusing on: <span className="text-orange-400">{focusItemTitle}</span>
        </div>
      )}
      
      {/* Today's stats */}
      <div className="text-center text-xs text-gray-500 mt-1">
        Today: {todayFocusMinutes} minutes in focus
      </div>
    </div>
  );
};

export default FloatingFocusTimer;