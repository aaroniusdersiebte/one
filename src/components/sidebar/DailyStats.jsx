// src/components/sidebar/DailyStats.jsx
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';

function DailyStats() {
  const { tasks, archivedTasks, globalFocusTimer } = useAppStore();
  
  const [stats, setStats] = useState({
    focusMinutes: 0,
    openTasks: 0,
    completedToday: 0,
    completedSubtasks: 0,
    totalSubtasks: 0
  });
  
  // Animation states for counters
  const [openTasksAnimation, setOpenTasksAnimation] = useState(false);
  const [completedTasksAnimation, setCompletedTasksAnimation] = useState(false);
  const [subtasksAnimation, setSubtasksAnimation] = useState(false);
  const [focusMinutesAnimation, setFocusMinutesAnimation] = useState(false);

  useEffect(() => {
    // Calculate day (6 AM to 6 AM)
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(6, 0, 0, 0);
    
    // If current time is before 6 AM, use previous day's start
    if (now.getHours() < 6) {
      dayStart.setDate(dayStart.getDate() - 1);
    }
    
    // Day end is always 6 AM the next day
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    // Find tasks completed today
    const completedToday = [...tasks, ...archivedTasks].filter(task => {
      if (!task.completedAt) return false;
      const completionDate = new Date(task.completedAt);
      return completionDate >= dayStart && completionDate < dayEnd;
    }).length;
    
    // Count open tasks
    const openTasks = tasks.filter(task => !task.completed).length;
    
    // Subtask statistics
    let completedSubtasks = 0;
    let totalSubtasks = 0;
    
    tasks.forEach(task => {
      if (task.subtasks && task.subtasks.length > 0) {
        totalSubtasks += task.subtasks.length;
        completedSubtasks += task.subtasks.filter(subtask => subtask.completed).length;
      }
    });
    
    // Get focus minutes from localStorage
    const focusMinutes = localStorage.getItem('todayFocusMinutes') 
      ? parseInt(localStorage.getItem('todayFocusMinutes'), 10) 
      : 0;
    
    // Check if values have changed and trigger animations
    if (openTasks !== stats.openTasks) {
      setOpenTasksAnimation(true);
      setTimeout(() => setOpenTasksAnimation(false), 500);
    }
    
    if (completedToday !== stats.completedToday) {
      setCompletedTasksAnimation(true);
      setTimeout(() => setCompletedTasksAnimation(false), 500);
    }
    
    if (completedSubtasks !== stats.completedSubtasks || totalSubtasks !== stats.totalSubtasks) {
      setSubtasksAnimation(true);
      setTimeout(() => setSubtasksAnimation(false), 500);
    }
    
    if (focusMinutes !== stats.focusMinutes) {
      setFocusMinutesAnimation(true);
      setTimeout(() => setFocusMinutesAnimation(false), 500);
    }
    
    setStats({
      focusMinutes,
      openTasks,
      completedToday,
      completedSubtasks,
      totalSubtasks
    });
  }, [tasks, archivedTasks]);

  // Format time for focus timer
  const formatFocusTime = (seconds) => {
    if (seconds <= 0) return '0m';
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <div className="p-3 bg-gray-800 rounded-lg mb-3">
      {/* Statistics Dashboard */}
      <div className="space-y-4">
        <div className="flex space-x-3 justify-between">
          {/* Focus Time */}
          <div className="flex flex-col items-center">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="#3d3d3d"
                  strokeWidth="2"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2"
                  strokeDasharray={`${2 * Math.PI * 10}`}
                  strokeDashoffset={`${2 * Math.PI * 10 * (1 - stats.focusMinutes / 120)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-xs font-bold text-white flex flex-col items-center">
                <span className={focusMinutesAnimation ? 'animate-bounce' : ''}>
                  {stats.focusMinutes}m
                </span>
                
                {/* Current timer display if active */}
                {globalFocusTimer.isRunning && (
                  <span className="text-[8px] text-orange-400 animate-pulse">
                    {formatFocusTime(globalFocusTimer.timeLeft)}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs text-gray-400 mt-1">Focus</span>
          </div>

          {/* Open Tasks */}
          <div className="flex flex-col items-center">
            <div 
              className={`w-12 h-12 bg-gray-700 rounded flex items-center justify-center ${
                openTasksAnimation ? 'animate-bounce' : ''
              }`}
            >
              <span className="text-lg font-bold text-white">{stats.openTasks}</span>
            </div>
            <span className="text-xs text-gray-400 mt-1">Open</span>
          </div>

          {/* Completed Tasks */}
          <div className="flex flex-col items-center">
            <div 
              className={`w-12 h-12 bg-gray-700 rounded flex items-center justify-center ${
                completedTasksAnimation ? 'animate-bounce' : ''
              }`}
            >
              <span className="text-lg font-bold text-green-500">{stats.completedToday}</span>
            </div>
            <span className="text-xs text-gray-400 mt-1">Done</span>
          </div>

          {/* Subtasks */}
          <div className="flex flex-col items-center">
            <div 
              className={`w-12 h-12 bg-gray-700 rounded flex items-center justify-center ${
                subtasksAnimation ? 'animate-bounce' : ''
              }`}
            >
              <span className="text-lg font-bold text-blue-500">
                {stats.completedSubtasks}/{stats.totalSubtasks}
              </span>
            </div>
            <span className="text-xs text-gray-400 mt-1">Sub</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DailyStats;