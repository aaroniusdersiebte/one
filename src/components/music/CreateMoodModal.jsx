// src/components/music/CreateMoodModal.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';

function CreateMoodModal({ isOpen, onClose }) {
  const { addMood } = useAppStore();
  
  const [name, setName] = useState('');
  const [color, setColor] = useState('#f97316'); // Default orange
  
  // Available colors
  const colorOptions = [
    '#f97316', // Orange (default)
    '#10b981', // Green
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#ef4444', // Red
    '#f59e0b', // Yellow
    '#6366f1'  // Indigo
  ];
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setColor('#f97316');
    }
  }, [isOpen]);
  
  // Create mood and close modal
  const handleCreate = () => {
    if (name.trim()) {
      addMood(name.trim(), color);
      window.electron.hapticFeedback();
      onClose();
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-4 w-full max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Create New Mood</h2>
          <button
            className="text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Name
          </label>
          <input
            className="w-full bg-gray-700 text-white p-3 rounded outline-none focus:ring-1 focus:ring-orange-500"
            placeholder="Mood name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((colorOption) => (
              <button
                key={colorOption}
                className={`w-8 h-8 rounded-full ${
                  color === colorOption ? 'ring-2 ring-white' : ''
                }`}
                style={{ backgroundColor: colorOption }}
                onClick={() => setColor(colorOption)}
              />
            ))}
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded flex items-center"
            onClick={handleCreate}
            disabled={!name.trim()}
          >
            <FiCheck className="mr-2" />
            <span>Create Mood</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateMoodModal;