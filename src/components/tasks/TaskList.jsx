// src/components/tasks/TaskList.jsx
import React, { useState } from 'react';
import { FiCheck, FiClock, FiEdit, FiTrash2, FiChevronRight, FiChevronDown, FiPlus, FiLayout, FiList } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';

const TaskList = ({ tasks, groupId = null }) => {
  const { 
    openTaskWindow,
    openNewTaskWindow,
    completeTask,
    uncompleteTask,
    deleteTask,
    viewMode,
    setViewMode,
    tags
  } = useAppStore();
  
  const [expandedTasks, setExpandedTasks] = useState({});
  
  // Check if there are any active (non-completed) tasks
  const activeTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);
  
  // Handle creating a new task
  const handleNewTask = () => {
    openNewTaskWindow(groupId);
  };
  
  // Toggle between grid and list view
  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };
  
  // Toggle task expansion
  const toggleTask = (taskId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };
  
  // Handle task completion
  const handleToggleComplete = (e, taskId, completed) => {
    e.stopPropagation();
    if (completed) {
      uncompleteTask(taskId);
    } else {
      completeTask(taskId);
    }
    window.electron.hapticFeedback();
  };
  
  // Handle task deletion
  const handleDelete = (e, taskId, title) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteTask(taskId);
      window.electron.hapticFeedback();
    }
  };
  
  // Get task tags
  const getTaskTags = (taskTags) => {
    return tags.filter(tag => taskTags.includes(tag.id));
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit'
    });
  };
  
  // Render task list item
  const renderTaskItem = (task, index) => {
    const isExpanded = expandedTasks[task.id] || false;
    const taskTags = getTaskTags(task.tags);
    
    // Get last note if available
    const lastNote = task.descriptionEntries && task.descriptionEntries.length > 0 
      ? task.descriptionEntries[0] 
      : null;
    
    // Calculate subtask completion
    const completedSubtasks = task.subtasks.filter(subtask => subtask.completed).length;
    const totalSubtasks = task.subtasks.length;
    
    return (
      <div 
        key={task.id}
        className={`bg-gray-800 rounded-lg mb-2 transition-all duration-200 overflow-hidden ${
          task.completed ? 'opacity-75 border-l-4 border-green-600' : ''
        }`}
      >
        {/* Task Header */}
        <div 
          className="p-3 cursor-pointer hover:bg-gray-700 flex items-center justify-between"
          onClick={() => toggleTask(task.id)}
        >
          <div className="flex items-center flex-1">
            <button
              className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                task.completed 
                  ? 'bg-green-600 border-green-600 text-white' 
                  : 'border-gray-600 hover:border-orange-500'
              }`}
              onClick={(e) => handleToggleComplete(e, task.id, task.completed)}
            >
              {task.completed && <FiCheck size={12} />}
            </button>
            
            <div className="flex-1">
              <div className="flex items-center">
                <h3 className={`font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                  {task.title}
                </h3>
                
                {totalSubtasks > 0 && (
                  <span className="ml-2 text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-400">
                    {completedSubtasks}/{totalSubtasks}
                  </span>
                )}
              </div>
              
              {/* Tags */}
              {taskTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
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
            </div>
            
            {/* Status indicator */}
            <div className="text-gray-500 text-sm mr-3">
              {task.completedAt ? formatDate(task.completedAt) : ''}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center">
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
              className="text-gray-400 hover:text-red-500 p-1 mr-2"
              onClick={(e) => handleDelete(e, task.id, task.title)}
              title="Delete"
            >
              <FiTrash2 size={16} />
            </button>
            
            {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
          </div>
        </div>
        
        {/* Task Details (when expanded) */}
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-700 pt-3">
            {/* Last note preview */}
            {lastNote && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-300 mb-1">Latest Note:</h4>
                <div className="bg-gray-700 p-2 rounded text-sm text-gray-300">
                  <p className="whitespace-normal break-words line-clamp-3">
                    {lastNote.text}
                  </p>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDate(lastNote.createdAt)}
                    {task.descriptionEntries.length > 1 && 
                      ` (+${task.descriptionEntries.length - 1} more notes)`}
                  </div>
                </div>
              </div>
            )}
            
            {/* Subtasks */}
            {task.subtasks.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-300 mb-1">Subtasks:</h4>
                <div className="space-y-1">
                  {task.subtasks.map(subtask => (
                    <div key={subtask.id} className="flex items-center bg-gray-700 rounded px-2 py-1">
                      <div 
                        className={`w-4 h-4 rounded-sm border mr-2 flex items-center justify-center ${
                          subtask.completed 
                            ? 'bg-green-600 border-green-600 text-white' 
                            : 'border-gray-500'
                        }`}
                      >
                        {subtask.completed && <FiCheck size={10} />}
                      </div>
                      <span 
                        className={`text-sm ${subtask.completed ? 'text-gray-500 line-through' : 'text-white'}`}
                      >
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quick actions */}
            <div className="flex justify-end">
              <button
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  openTaskWindow(task.id);
                }}
              >
                Open
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header with view toggle */}
      <div className="p-4 flex justify-between items-center sticky top-0 bg-gray-900 z-10">
        <div className="flex items-center">
          <button
            className={`p-2 rounded-l ${viewMode === 'grid' ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <FiLayout size={18} />
          </button>
          <button
            className={`p-2 rounded-r ${viewMode === 'list' ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <FiList size={18} />
          </button>
        </div>
        
        <button
          className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-md flex items-center"
          onClick={handleNewTask}
        >
          <FiPlus className="mr-1" size={18} />
          <span>New Task</span>
        </button>
      </div>
      
      {/* Task list */}
      <div className="p-4">
        {activeTasks.length > 0 ? (
          <div className="mb-8">
            {activeTasks.map((task, index) => renderTaskItem(task, index))}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-8 text-center mb-8">
            <p className="text-gray-400 mb-4">No active tasks</p>
            <button
              className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-md inline-flex items-center"
              onClick={handleNewTask}
            >
              <FiPlus className="mr-1" />
              <span>Create Task</span>
            </button>
          </div>
        )}
        
        {/* Completed tasks section */}
        {completedTasks.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-white mb-4 mt-8 border-t border-gray-700 pt-6">
              Completed Tasks ({completedTasks.length})
            </h2>
            <div className="opacity-75">
              {completedTasks.map((task, index) => renderTaskItem(task, index))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TaskList;