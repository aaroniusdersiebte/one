// src/App.jsx
import React, { useEffect, useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import Sidebar from './components/sidebar/Sidebar';
import MainContent from './components/MainContent';
import MusicContent from './components/music/MusicContent';
import MusicBar from './components/music/MusicBar';
import FloatingFocusTimer from './components/focus/FloatingFocusTimer';
import SettingsPanel from './components/settings/SettingsPanel';
import DraggableWindow from './components/common/DraggableWindow';
import { useAppStore } from './store/appStore';
import './styles/tailwind.css';

function App() {
  const { 
    initializeData, 
    moveTask, 
    moveGroup,
    moveSubtask,
    activeTab,
    setActiveTab,
    initializeMusicData,
    openWindows,
    closeWindow
  } = useAppStore();

  // State for settings panel
  const [showSettings, setShowSettings] = useState(false);

  // Load data on app start
  useEffect(() => {
    initializeData();
    initializeMusicData();
  }, [initializeData, initializeMusicData]);

  // Drag & Drop Handler
  const handleDragEnd = (result) => {
    const { destination, source, draggableId, type } = result;

    // If there's no destination, abort
    if (!destination) return;

    // If destination is the same as origin, abort
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    // Haptic feedback
    window.electron.hapticFeedback();

    // If a group was moved
    if (type === 'group') {
      moveGroup(source.index, destination.index);
      return;
    }

    // If a subtask was moved
    if (type === 'subtask') {
      moveSubtask(
        source.droppableId, // taskId
        draggableId,        // subtaskId
        source.index,
        destination.index
      );
      return;
    }

    // Move task
    moveTask(
      draggableId,
      source.droppableId,
      destination.droppableId,
      source.index,
      destination.index
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      {/* Module Navigation */}
      <div className="flex border-b border-gray-700 bg-gray-800">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'planner' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('planner')}
        >
          MiniPlaner
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'music' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('music')}
        >
          Mood Music
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar setShowSettings={setShowSettings} />

        {/* Main content with Drag & Drop context */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex-1 flex flex-col relative">
            {activeTab === 'planner' ? <MainContent /> : <MusicContent />}
            
            {/* Music control bar (always visible) */}
            <MusicBar />
            
            {/* Floating windows for tasks/notes */}
            {openWindows.map((window) => (
              <DraggableWindow
                key={window.id}
                id={window.id}
                title={window.title}
                isPinned={window.isPinned}
                onClose={() => closeWindow(window.id)}
                initialPosition={window.position}
                type={window.type}
                data={window.data}
              />
            ))}
            
            {/* Floating focus timer */}
            <FloatingFocusTimer />
          </div>
        </DragDropContext>
      </div>

      {/* Settings Panel */}
      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

export default App;