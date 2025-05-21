// src/components/MainContent.jsx
import React from 'react';
import { useAppStore } from '../store/appStore';
import TaskGrid from './tasks/TaskGrid';
import TaskList from './tasks/TaskList';
import NotesList from './notes/NotesList';
import ArchivedTasks from './tasks/ArchivedTasks';
import TrelloView from './tasks/TrelloView';

function MainContent() {
  const { 
    groups, 
    tasks, 
    view, 
    viewMode,
    searchQuery
  } = useAppStore();

  // Determine current title and task list based on view
  let title = 'All Tasks';
  let currentGroupId = null;
  let filteredTasks = [];

  // Special views
  if (view === 'notes') {
    return <NotesList />;
  }

  if (view === 'archive') {
    return <ArchivedTasks />;
  }

  // Handle search
  if (searchQuery) {
    title = `Search Results: "${searchQuery}"`;
    filteredTasks = tasks.filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.subtasks.some(subtask => 
        subtask.title.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      (task.descriptionEntries && task.descriptionEntries.some(entry =>
        entry.text.toLowerCase().includes(searchQuery.toLowerCase())
      ))
    );
  } 
  // Group view
  else if (view.startsWith('group-')) {
    currentGroupId = view.split('group-')[1];
    const group = groups.find(g => g.id === currentGroupId);
    
    if (group) {
      title = group.name;
      filteredTasks = tasks.filter(task => task.groupId === currentGroupId);
    }
  } 
  // All tasks view
  else {
    // Show only non-completed tasks in the all view
    filteredTasks = tasks.filter(task => !task.completed);
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-semibold text-white">{title}</h1>
      </div>

      {/* Content based on view mode */}
      {view === 'all' && viewMode === 'trello' ? (
        <TrelloView />
      ) : viewMode === 'grid' ? (
        <TaskGrid tasks={filteredTasks} groupId={currentGroupId} />
      ) : (
        <TaskList tasks={filteredTasks} groupId={currentGroupId} />
      )}
    </div>
  );
}

export default MainContent;