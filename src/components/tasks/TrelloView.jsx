// src/components/tasks/TrelloView.jsx
import React, { useRef, useEffect } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { FiPlus, FiLayout, FiList, FiGrid } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';
import TaskCard from './TaskCard';

function TrelloView() {
  const { 
    groups, 
    tasks, 
    openNewTaskWindow,
    viewMode,
    setViewMode
  } = useAppStore();
  
  // Refs for horizontal scrolling
  const scrollContainerRef = useRef(null);
  
  // Enable horizontal scroll with mouse wheel
  useEffect(() => {
    const handleWheel = (e) => {
      if (scrollContainerRef.current) {
        if (e.deltaY !== 0) {
          e.preventDefault();
          scrollContainerRef.current.scrollLeft += e.deltaY;
        }
      }
    };
    
    const currentRef = scrollContainerRef.current;
    if (currentRef) {
      currentRef.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (currentRef) {
        currentRef.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  // Filter open tasks by group
  const groupedTasks = {};
  groups.forEach(group => {
    const tasksInGroup = tasks.filter(task => 
      task.groupId === group.id && !task.completed
    );
    
    // Sort by order
    groupedTasks[group.id] = tasksInGroup.sort((a, b) => a.order - b.order);
  });

  // Tasks without group (open only)
  const ungroupedTasks = tasks.filter(task => 
    !task.groupId && !task.completed
  ).sort((a, b) => a.order - b.order);

  // Toggle view mode
  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header with view toggles */}
      <div className="p-4 flex justify-between items-center border-b border-gray-700 z-10">
        <div className="flex items-center">
          <button
            className={`p-2 rounded-l ${viewMode === 'grid' ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => handleToggleViewMode('grid')}
            title="Grid view"
          >
            <FiGrid size={18} />
          </button>
          <button
            className={`p-2 ${viewMode === 'list' ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => handleToggleViewMode('list')}
            title="List view"
          >
            <FiList size={18} />
          </button>
          <button
            className={`p-2 rounded-r ${viewMode === 'trello' ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => handleToggleViewMode('trello')}
            title="Trello/Kanban view"
          >
            <FiLayout size={18} />
          </button>
        </div>
      </div>

      {/* Horizontal scrollable container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 flex overflow-x-auto overflow-y-hidden p-4 pb-8"
        style={{ scrollbarWidth: 'thin', msOverflowStyle: 'none' }}
      >
        {/* Groups as columns */}
        {groups.map((group) => (
          <div 
            key={group.id} 
            className="flex-shrink-0 flex flex-col w-72 bg-gray-800 rounded-lg shadow mx-2"
          >
            {/* Group Header */}
            <div className="p-3 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-medium text-white">{group.name}</h2>
              <div className="text-sm text-gray-400">
                {groupedTasks[group.id]?.length || 0}
              </div>
            </div>

            {/* Tasks Container */}
            <Droppable droppableId={group.id} type="task">
              {(provided) => (
                <div 
                  className="flex-1 overflow-y-auto p-2 min-h-[200px] max-h-[calc(100vh-220px)]"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {groupedTasks[group.id]?.length > 0 ? (
                    <div className="space-y-2">
                      {groupedTasks[group.id].map((task, index) => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          isKanban={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-10">
                      No tasks
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Add Task Button */}
            <div className="p-2 border-t border-gray-700">
              <button
                className="flex items-center text-gray-400 hover:text-orange-400 w-full p-2 rounded-md hover:bg-gray-700"
                onClick={() => openNewTaskWindow(group.id)}
              >
                <FiPlus className="mr-2" />
                <span>Add Task</span>
              </button>
            </div>
          </div>
        ))}

        {/* Ungrouped Tasks */}
        {ungroupedTasks.length > 0 && (
          <div className="flex-shrink-0 flex flex-col w-72 bg-gray-800 rounded-lg shadow mx-2">
            <div className="p-3 border-b border-gray-700">
              <h2 className="text-lg font-medium text-white">Ungrouped</h2>
            </div>

            <Droppable droppableId="ungrouped" type="task">
              {(provided) => (
                <div 
                  className="flex-1 overflow-y-auto p-2 min-h-[200px] max-h-[calc(100vh-220px)]"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <div className="space-y-2">
                    {ungroupedTasks.map((task, index) => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        isKanban={true}
                      />
                    ))}
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
            
            {/* Add Ungrouped Task Button */}
            <div className="p-2 border-t border-gray-700">
              <button
                className="flex items-center text-gray-400 hover:text-orange-400 w-full p-2 rounded-md hover:bg-gray-700"
                onClick={() => openNewTaskWindow(null)}
              >
                <FiPlus className="mr-2" />
                <span>Add Task</span>
              </button>
            </div>
          </div>
        )}
        
        {/* Add Group Button Column */}
        <div className="flex-shrink-0 w-72 mx-2">
          <button
            className="bg-gray-800 bg-opacity-70 hover:bg-opacity-100 rounded-lg p-3 w-full text-gray-400 hover:text-white flex items-center justify-center transition-colors"
            onClick={() => {
              // Open group creation dialog in sidebar
              // This will be handled by setting a state in AppStore
              // and then the Sidebar component will react to it
              // For now, just provide feedback
              window.electron.hapticFeedback();
              alert('Please use the "New Group" button in the sidebar to add a new group');
            }}
          >
            <FiPlus className="mr-2" />
            <span>Add Group</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default TrelloView;