// src/components/tasks/TaskDetails.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FiSave, FiCheck, FiX, FiPlay, FiPause, FiClock } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';
import SubtaskDraggableList from './SubtaskDraggableList';
import TagManager from '../tags/TagManager';

const TaskDetails = ({ taskId, isNew = false, initialGroupId = null }) => {
  const { 
    tasks, 
    groups, 
    tags, 
    addTask, 
    updateTask, 
    completeTask, 
    uncompleteTask,
    addDescriptionEntry,
    closeWindow,
    startFocusTimer
  } = useAppStore();
  
  // Find current task if not new
  const task = !isNew ? tasks.find(t => t.id === taskId) : null;
  
  // Form state
  const [title, setTitle] = useState(task ? task.title : 'New Task');
  const [selectedGroupId, setSelectedGroupId] = useState(
    task ? task.groupId : (initialGroupId || (groups.length > 0 ? groups[0].id : null))
  );
  const [newDescription, setNewDescription] = useState('');
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [editingEntryText, setEditingEntryText] = useState('');
  
  // Refs for input focus
  const titleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);
  
  // Set focus on title input when creating a new task
  useEffect(() => {
    if (isNew && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isNew]);
  
  // Update title in real-time as user types
  useEffect(() => {
    if (!isNew && task) {
      const debounceTimeout = setTimeout(() => {
        if (title !== task.title) {
          updateTask(taskId, { title });
        }
      }, 500);
      
      return () => clearTimeout(debounceTimeout);
    }
  }, [title, updateTask, taskId, isNew, task]);
  
  // Update group when changed
  const handleGroupChange = (e) => {
    const newGroupId = e.target.value;
    setSelectedGroupId(newGroupId);
    
    if (!isNew) {
      updateTask(taskId, { groupId: newGroupId });
    }
  };
  
  // Add new description entry
  const handleAddDescription = () => {
    if (newDescription.trim()) {
      if (isNew) {
        // For new tasks, store the description to add after task creation
        // This will be handled when saving the task
      } else {
        addDescriptionEntry(taskId, newDescription.trim());
        setNewDescription('');
        
        // Keep focus on the input field
        if (descriptionInputRef.current) {
          descriptionInputRef.current.focus();
        }
      }
      window.electron.hapticFeedback();
    }
  };
  
  // Handle key press in description field
  const handleDescriptionKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleAddDescription();
    }
  };
  
  // Start editing a description entry
  const handleEditEntry = (entry) => {
    setEditingEntryId(entry.id);
    setEditingEntryText(entry.text);
  };
  
  // Save edited description entry
  const handleSaveEditedEntry = () => {
    if (editingEntryText.trim() && !isNew) {
      updateTask(taskId, {
        descriptionEntries: task.descriptionEntries.map(entry => 
          entry.id === editingEntryId 
            ? { ...entry, text: editingEntryText, editedAt: new Date().toISOString() } 
            : entry
        )
      });
      
      setEditingEntryId(null);
      setEditingEntryText('');
      window.electron.hapticFeedback();
    }
  };
  
  // Cancel editing description entry
  const handleCancelEdit = () => {
    setEditingEntryId(null);
    setEditingEntryText('');
  };
  
  // Toggle task completion
  const handleToggleComplete = () => {
    if (!isNew) {
      if (task.completed) {
        uncompleteTask(taskId);
      } else {
        completeTask(taskId);
      }
      window.electron.hapticFeedback();
    }
  };
  
  // Save new task
  const handleSaveNewTask = () => {
    if (title.trim() && selectedGroupId) {
      // Create the task
      const newTaskId = addTask(selectedGroupId, title.trim());
      
      // Add initial description if provided
      if (newDescription.trim()) {
        addDescriptionEntry(newTaskId, newDescription.trim());
      }
      
      // Close the window
      window.electron.hapticFeedback();
      closeWindow();
    }
  };
  
  // Start focus timer for this task
  const handleStartFocusTimer = (minutes = 25) => {
    if (!isNew) {
      startFocusTimer(taskId, minutes * 60);
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
      {/* Task title and group selection */}
      <div className="mb-4">
        <input
          ref={titleInputRef}
          type="text"
          className="w-full bg-gray-700 text-white px-3 py-2 text-lg font-medium rounded outline-none focus:ring-1 focus:ring-orange-500"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
        />
        
        <div className="flex items-center mt-2">
          <select
            className="bg-gray-700 text-white px-3 py-2 rounded outline-none focus:ring-1 focus:ring-orange-500 flex-1"
            value={selectedGroupId || ''}
            onChange={handleGroupChange}
          >
            <option value="" disabled>Select group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          
          {!isNew && (
            <div className="flex space-x-2 ml-2">
              <button
                className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                  task?.completed 
                    ? 'bg-green-600 border-green-600 text-white' 
                    : 'border-gray-600 hover:border-orange-500'
                }`}
                onClick={handleToggleComplete}
              >
                {task?.completed && <FiCheck size={16} />}
              </button>
            </div>
          )}
        </div>
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
            <FiPlay size={14} className="mr-1" />
            25 min
          </button>
          
          <button
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm flex items-center"
            onClick={() => handleStartFocusTimer(15)}
            disabled={isNew}
          >
            <FiPlay size={14} className="mr-1" />
            15 min
          </button>
          
          <button
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm flex items-center"
            onClick={() => handleStartFocusTimer(45)}
            disabled={isNew}
          >
            <FiPlay size={14} className="mr-1" />
            45 min
          </button>
        </div>
      </div>
      
      {/* Add description entry */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-white mb-2">Add Note</h3>
        <div className="flex items-start">
          <textarea
            ref={descriptionInputRef}
            className="flex-1 bg-gray-700 text-white p-2 rounded resize-none outline-none min-h-[60px] focus:ring-1 focus:ring-orange-500"
            placeholder="Add a note... (Ctrl+Enter)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            onKeyDown={handleDescriptionKeyDown}
            rows={2}
          />
          <button
            className="ml-2 bg-orange-600 hover:bg-orange-700 text-white p-2 rounded h-[60px] w-[60px] flex items-center justify-center"
            onClick={handleAddDescription}
            disabled={!newDescription.trim()}
          >
            <FiSave size={20} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Ctrl+Enter</p>
      </div>
      
      {/* Existing notes */}
      {!isNew && task?.descriptionEntries && task.descriptionEntries.length > 0 && (
        <div className="mb-4 space-y-3">
          <h3 className="text-sm font-medium text-white mb-1">Notes</h3>
          
          {task.descriptionEntries.map((entry) => (
            <div key={entry.id} className="bg-gray-700 rounded p-3 relative">
              {editingEntryId === entry.id ? (
                <div>
                  <textarea
                    className="w-full bg-gray-600 text-white p-2 rounded resize-none outline-none mb-2 focus:ring-1 focus:ring-orange-500"
                    value={editingEntryText}
                    onChange={(e) => setEditingEntryText(e.target.value)}
                    rows={3}
                    autoFocus
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      className="text-gray-400 hover:text-gray-300 text-sm"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                    <button
                      className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm"
                      onClick={handleSaveEditedEntry}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div 
                    className="whitespace-pre-wrap text-white cursor-pointer"
                    onClick={() => handleEditEntry(entry)}
                  >
                    {entry.text}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>
                      {formatDate(entry.createdAt)}
                      {entry.editedAt && entry.editedAt !== entry.createdAt && " (edited)"}
                    </span>
                    <button
                      className="text-gray-400 hover:text-orange-400"
                      onClick={() => handleEditEntry(entry)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Subtasks */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-white mb-2">Subtasks</h3>
        {!isNew ? (
          <SubtaskDraggableList taskId={taskId} />
        ) : (
          <div className="bg-gray-700 p-3 rounded text-sm text-gray-400">
            Subtasks can be added after creating the task
          </div>
        )}
      </div>
      
      {/* Tags */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-white mb-2">Tags</h3>
        {!isNew ? (
          <TagManager taskId={taskId} />
        ) : (
          <div className="bg-gray-700 p-3 rounded text-sm text-gray-400">
            Tags can be added after creating the task
          </div>
        )}
      </div>
      
      {/* Bottom actions - only for new tasks */}
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
            onClick={handleSaveNewTask}
            disabled={!title.trim() || !selectedGroupId}
          >
            <FiSave className="mr-2" />
            Create Task
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskDetails;