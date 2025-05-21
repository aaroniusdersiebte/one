// src/components/tasks/TaskGrid.jsx
import React from 'react';
import { FiPlus, FiLayout, FiList } from 'react-icons/fi';
import TaskCard from './TaskCard';
import { useAppStore } from '../../store/appStore';

const TaskGrid = ({ tasks, groupId = null }) => {
  const { 
    openNewTaskWindow, 
    viewMode,
    setViewMode 
  } = useAppStore();
  
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
      
      {/* Task grid */}
      <div className="p-4">
        {activeTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {activeTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 opacity-75">
              {completedTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TaskGrid;