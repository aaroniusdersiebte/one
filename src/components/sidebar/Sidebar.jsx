// src/components/sidebar/Sidebar.jsx
import React, { useState } from 'react';
import { 
  FiHome, 
  FiPlus, 
  FiFolder, 
  FiArchive, 
  FiEdit, 
  FiSearch,
  FiX,
  FiSettings,
  FiTrash2,
  FiEdit2,
  FiMove,
  FiMusic
} from 'react-icons/fi';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { useAppStore } from '../../store/appStore';
import DailyStats from './DailyStats';
import QuickActions from './QuickActions';
import MoodList from '../music/MoodList';

function Sidebar({ setShowSettings }) {
  const { 
    groups, 
    view, 
    setView, 
    addGroup,
    updateGroup,
    deleteGroup,
    setSearchQuery,
    searchQuery,
    activeTab,
    setActiveTab
  } = useAppStore();
  
  // State for group management
  const [newGroupName, setNewGroupName] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGroupDragging, setIsGroupDragging] = useState(false);

  // Handle adding a new group
  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      addGroup(newGroupName.trim());
      setNewGroupName('');
      setIsAddingGroup(false);
      window.electron.hapticFeedback();
    }
  };

  // Handle editing group name
  const handleUpdateGroup = (groupId) => {
    if (editingGroupName.trim()) {
      updateGroup(groupId, { name: editingGroupName });
      setEditingGroupId(null);
      setEditingGroupName('');
      window.electron.hapticFeedback();
    }
  };

  // Handle deleting a group
  const handleDeleteGroup = (groupId, groupName) => {
    const confirmed = window.confirm(`Are you sure you want to delete the group "${groupName}"? Tasks will be moved to "No Group".`);
    if (confirmed) {
      deleteGroup(groupId);
      // If current view is this group, switch to all tasks
      if (view === `group-${groupId}`) {
        setView('all');
      }
      window.electron.hapticFeedback();
    }
  };

  // Keyboard event handlers
  const handleNewGroupKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddGroup();
    } else if (e.key === 'Escape') {
      setIsAddingGroup(false);
      setNewGroupName('');
    }
  };

  const handleEditGroupKeyDown = (e, groupId) => {
    if (e.key === 'Enter') {
      handleUpdateGroup(groupId);
    } else if (e.key === 'Escape') {
      setEditingGroupId(null);
      setEditingGroupName('');
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      setIsSearching(false);
    }
  };

  return (
    <div className="w-64 h-full bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-semibold text-white">
          {activeTab === 'planner' ? 'MiniPlaner' : 'Mood Music'}
        </h1>
      </div>

      {/* Daily statistics (only for planner tab) */}
      {activeTab === 'planner' && (
        <div className="p-2">
          <DailyStats />
        </div>
      )}

      {/* Search (only for planner tab) */}
      {activeTab === 'planner' && (
        <div className="p-2">
          {isSearching ? (
            <div className="flex items-center bg-gray-700 rounded px-2 py-1">
              <FiSearch className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent w-full text-white outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoFocus
              />
              {searchQuery && (
                <FiX
                  className="text-gray-400 cursor-pointer"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearching(false);
                  }}
                />
              )}
            </div>
          ) : (
            <button
              className="flex items-center text-gray-400 hover:text-white w-full px-2 py-1"
              onClick={() => setIsSearching(true)}
            >
              <FiSearch className="mr-2" />
              <span>Search</span>
            </button>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {/* Switch between apps */}
        <div className="px-4 py-2 mb-2">
          <div className="flex bg-gray-700 rounded-lg">
            <button
              className={`flex-1 py-2 text-center text-sm rounded-lg ${
                activeTab === 'planner' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('planner')}
            >
              Planner
            </button>
            <button
              className={`flex-1 py-2 text-center text-sm rounded-lg ${
                activeTab === 'music' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('music')}
            >
              Music
            </button>
          </div>
        </div>

        {/* Planner Navigation */}
        {activeTab === 'planner' && (
          <ul>
            {/* All Tasks */}
            <li>
              <button
                className={`flex items-center w-full px-4 py-2 ${
                  view === 'all' 
                    ? 'bg-gray-700 text-orange-400' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setView('all')}
              >
                <FiHome className="mr-2" />
                <span>All Tasks</span>
              </button>
            </li>

            {/* Notes */}
            <li>
              <button
                className={`flex items-center w-full px-4 py-2 ${
                  view === 'notes' 
                    ? 'bg-gray-700 text-orange-400' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setView('notes')}
              >
                <FiEdit className="mr-2" />
                <span>Notes</span>
              </button>
            </li>

            {/* Archive */}
            <li>
              <button
                className={`flex items-center w-full px-4 py-2 ${
                  view === 'archive' 
                    ? 'bg-gray-700 text-orange-400' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setView('archive')}
              >
                <FiArchive className="mr-2" />
                <span>Archive</span>
              </button>
            </li>

            {/* Groups Header */}
            <li className="px-4 py-2 text-xs text-gray-500 uppercase mt-4 flex items-center justify-between">
              <span>Groups</span>
              <FiMove className={`text-gray-500 ${isGroupDragging ? 'text-orange-500' : ''}`} size={12} />
            </li>

            {/* Draggable Groups List */}
            <Droppable droppableId="groups-list" type="group">
              {(provided) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="mb-2"
                >
                  {groups.map((group, index) => (
                    <Draggable 
                      key={group.id} 
                      draggableId={group.id} 
                      index={index}
                    >
                      {(provided, snapshot) => {
                        if (snapshot.isDragging !== isGroupDragging) {
                          setIsGroupDragging(snapshot.isDragging);
                        }
                        
                        return (
                          <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="group"
                          >
                            {editingGroupId === group.id ? (
                              <div className="px-4 py-2">
                                <div className="flex items-center">
                                  <input
                                    type="text"
                                    className="bg-gray-700 text-white px-2 py-1 rounded w-full outline-none focus:ring-1 focus:ring-orange-500"
                                    value={editingGroupName}
                                    onChange={(e) => setEditingGroupName(e.target.value)}
                                    onKeyDown={(e) => handleEditGroupKeyDown(e, group.id)}
                                    autoFocus
                                  />
                                  <button
                                    className="ml-2 text-green-500 hover:text-green-400 p-1"
                                    onClick={() => handleUpdateGroup(group.id)}
                                  >
                                    <FiCheck size={14} />
                                  </button>
                                  <button
                                    className="text-red-500 hover:text-red-400 p-1"
                                    onClick={() => {
                                      setEditingGroupId(null);
                                      setEditingGroupName('');
                                    }}
                                  >
                                    <FiX size={14} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <button
                                  className={`flex items-center w-full px-4 py-2 ${
                                    view === `group-${group.id}` 
                                      ? 'bg-gray-700 text-orange-400' 
                                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                  }`}
                                  onClick={() => setView(`group-${group.id}`)}
                                >
                                  <FiFolder className="mr-2" />
                                  <span>{group.name}</span>
                                </button>
                                
                                <div className="hidden group-hover:flex mr-2">
                                  <button 
                                    className="text-blue-500 hover:text-blue-400 p-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingGroupId(group.id);
                                      setEditingGroupName(group.name);
                                    }}
                                    title="Rename"
                                  >
                                    <FiEdit2 size={14} />
                                  </button>
                                  <button 
                                    className="text-red-500 hover:text-red-400 p-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteGroup(group.id, group.name);
                                    }}
                                    title="Delete"
                                  >
                                    <FiTrash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </li>
                        );
                      }}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Add New Group */}
            {isAddingGroup ? (
              <li className="px-4 py-2">
                <div className="flex items-center">
                  <input
                    type="text"
                    placeholder="Group name"
                    className="bg-gray-700 text-white px-2 py-1 rounded w-full outline-none focus:ring-1 focus:ring-orange-500"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyDown={handleNewGroupKeyDown}
                    autoFocus
                  />
                  <button
                    className="ml-2 text-green-500 hover:text-green-400 p-1"
                    onClick={handleAddGroup}
                  >
                    <FiCheck size={14} />
                  </button>
                  <button
                    className="text-red-500 hover:text-red-400 p-1"
                    onClick={() => {
                      setIsAddingGroup(false);
                      setNewGroupName('');
                    }}
                  >
                    <FiX size={14} />
                  </button>
                </div>
              </li>
            ) : (
              <li>
                <button
                  className="flex items-center text-gray-400 hover:text-white w-full px-4 py-2"
                  onClick={() => setIsAddingGroup(true)}
                >
                  <FiPlus className="mr-2" />
                  <span>New Group</span>
                </button>
              </li>
            )}
          </ul>
        )}

        {/* Music Navigation */}
        {activeTab === 'music' && (
          <MoodList />
        )}
      </nav>

      {/* Settings Button */}
      <div className="p-2 border-t border-gray-700">
        <button
          className="flex items-center text-gray-400 hover:text-white w-full px-4 py-2"
          onClick={() => setShowSettings(true)}
        >
          <FiSettings className="mr-2" />
          <span>Settings</span>
        </button>
      </div>

      {/* Shortcuts at the bottom (only for planner tab) */}
      {activeTab === 'planner' && (
        <div className="p-2 mt-auto">
          <QuickActions />
        </div>
      )}
    </div>
  );
}

export default Sidebar;