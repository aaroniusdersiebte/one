// src/App.jsx
import React, { useEffect, useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import Sidebar from './components/sidebar/Sidebar';
import MainContent from './components/MainContent';
import MusicContent from './components/music/MusicContent';
import MusicBar from './components/music/MusicBar';
import FocusMode from './components/focus/FocusMode';
import MinimizedFocus from './components/focus/MinimizedFocus';
import SettingsPanel from './components/settings/SettingsPanel';
import { useAppStore } from './store/appStore';
import './styles/tailwind.css';

function App() {
  const { 
    view, 
    initializeData, 
    moveTask, 
    moveGroup,
    focusModeActive,
    focusModeMinimized,
    restoreFocusMode,
    moveSubtask,
    activeTab,
    setActiveTab,
    initializeMusicData
  } = useAppStore();

  // State für Einstellungs-Panel
  const [showSettings, setShowSettings] = useState(false);

  // Daten beim App-Start laden
  useEffect(() => {
    initializeData();
    initializeMusicData();
  }, [initializeData, initializeMusicData]);

  // Drag & Drop Handler
  const handleDragEnd = (result) => {
    const { destination, source, draggableId, type } = result;

    // Wenn es kein Ziel gibt, abbrechen
    if (!destination) return;

    // Wenn das Ziel das gleiche wie der Ursprung ist, abbrechen
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    // Haptisches Feedback
    window.electron.hapticFeedback();

    // Wenn eine Gruppe verschoben wurde
    if (type === 'group') {
      moveGroup(source.index, destination.index);
      return;
    }

    // Wenn eine Unteraufgabe verschoben wurde
    if (type === 'subtask') {
      moveSubtask(
        source.droppableId, // taskId
        draggableId,        // subtaskId
        source.index,
        destination.index
      );
      return;
    }

    // Task verschieben
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
      {/* Tab Navigation */}
      <div className="flex bg-gray-800 border-b border-gray-700">
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
        {/* Seitenleiste */}
        <Sidebar setShowSettings={setShowSettings} />

        {/* Hauptinhalt mit Drag & Drop Kontext */}
        <DragDropContext onDragEnd={handleDragEnd}>
          {focusModeActive && !focusModeMinimized ? (
            <FocusMode />
          ) : (
            <div className="flex-1 flex flex-col">
              {activeTab === 'planner' ? <MainContent view={view} /> : <MusicContent />}
              
              {/* Musik-Steuerungsleiste (immer sichtbar) */}
              <MusicBar />
            </div>
          )}
        </DragDropContext>

        {/* Minimierter Fokus-Modus */}
        {focusModeActive && focusModeMinimized && (
          <MinimizedFocus onRestore={restoreFocusMode} />
        )}
      </div>

      {/* Einstellungs-Panel */}
      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

export default App;