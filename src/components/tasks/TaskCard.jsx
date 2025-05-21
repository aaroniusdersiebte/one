// src/components/tasks/TaskCard.jsx
import React, { useState } from 'react';
import { FiCheck, FiClock, FiEdit, FiTrash2, FiMessageSquare } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';

const TaskCard = ({ task }) => {
  const { 
    completeTask, 
    uncompleteTask, 
    deleteTask, 
    openTaskWindow,
    tags
  } = useAppStore();
  
  const [isHovered, setIsHovered] = useState(false);
  
  // Find tags for this task
  const taskTags = tags.filter(tag => task.tags.includes(tag.id));
  
  // Get most recent note (if any)
  const lastNote = task.descriptionEntries && task.descriptionEntries.length > 0 
    ? task.descriptionEntries[0] 
    : null;
  
  // Format date helper
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    });
  };
  
  // Subtask completion stats
  const completedSubtasks = task.subtasks.filter(subtask => subtask.completed).length;
  const totalSubtasks = task.subtasks.length;
  
  // Event handlers
  const handleCardClick = (e) => {
    e.stopPropagation();
    openTaskWindow(task.id);
  };
  
  const handleComplete = (e) => {
    e.stopPropagation();
    if (task.completed) {
      uncompleteTask(task.id);
    } else {
      completeTask(task.id);
    }
    window.electron.hapticFeedback();
  };
  
  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      deleteTask(task.id);
      window.electron.hapticFeedback();
    }
  };

  return (
    <div 
      className={`bg-gray-800 rounded-lg p-4 shadow-md transition-all duration-200 cursor-pointer 
        ${task.completed ? 'opacity-75 border-l-4 border-green-600' : 'hover:shadow-lg hover:translate-y-[-2px]'}
        ${isHovered ? 'ring-1 ring-orange-500' : ''}
      `}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center">
          <button
            className={`w-5 h-5 rounded-full border flex items-center justify-center mr-2 ${
              task.completed 
                ? 'bg-green-600 border-green-600 text-white' 
                : 'border-gray-600 hover:border-orange-500'
            }`}
            onClick={handleComplete}
          >
            {task.completed && <FiCheck size={12} />}
          </button>
          
          <h3 className={`text-lg font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
            {task.title}
          </h3>
        </div>
        
        {/* Action buttons (visible on hover) */}
        {isHovered && (
          <div className="flex space-x-1">
            <button 
              className="text-gray-400 hover:text-orange-400 p-1"
              onClick={(e) => {
                e.stopPropagation();
                openTaskWindow(task.id, true); // Open in focus mode
              }}
              title="Focus mode"
            >
              <FiClock size={16} />
            </button>
            
            <button 
              className="text-gray-400 hover:text-orange-400 p-1"
              onClick={(e) => {
                e.stopPropagation();
                openTaskWindow(task.id);
              }}
              title="Edit"
            >
              <FiEdit size={16} />
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
      
      {/* Tags */}
      {taskTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {taskTags.map(tag => (
            <span
              key={tag.id}
              className="px-2 py-0.5 text-xs rounded-full"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
      
      {/* Last note preview */}
      {lastNote && (
        <div className="mt-2 text-sm text-gray-300 line-clamp-2 bg-gray-700 p-2 rounded">
          <p className="whitespace-normal break-words">
            {lastNote.text.length > 100 
              ? lastNote.text.substring(0, 100) + '...' 
              : lastNote.text
            }
          </p>
          <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
            <span>{formatDate(lastNote.createdAt)}</span>
            <div className="flex items-center">
              <FiMessageSquare size={12} className="mr-1" />
              <span>{task.descriptionEntries.length}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Subtasks progress */}
      {totalSubtasks > 0 && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Subtasks: {completedSubtasks}/{totalSubtasks}</span>
            <span>{Math.round((completedSubtasks / totalSubtasks) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div 
              className="bg-orange-600 h-1.5 rounded-full" 
              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;