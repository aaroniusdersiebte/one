// src/components/notes/NotesList.jsx
import React from 'react';
import { FiEdit3, FiPlus, FiClock, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';
import NoteCard from './NoteCard';

function NotesList() {
  const { 
    notes, 
    openNewNoteWindow,
    openNoteWindow,
    deleteNote
  } = useAppStore();

  // Handle new note creation
  const handleNewNote = () => {
    openNewNoteWindow();
  };

  // If no notes exist, show an empty state
  if (notes.length === 0) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-white">Notes</h1>
          
          <button
            className="flex items-center bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded"
            onClick={handleNewNote}
          >
            <FiPlus className="mr-1" />
            <span>New Note</span>
          </button>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <FiEdit3 size={48} className="mx-auto mb-4 text-gray-500" />
            <p className="text-gray-500 text-lg mb-4">No notes yet</p>
            <button
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md inline-flex items-center"
              onClick={handleNewNote}
            >
              <FiPlus className="mr-1" />
              <span>Create your first note</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-white">Notes</h1>
        
        <button
          className="flex items-center bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded"
          onClick={handleNewNote}
        >
          <FiPlus className="mr-1" />
          <span>New Note</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default NotesList;