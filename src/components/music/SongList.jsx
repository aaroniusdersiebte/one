// src/components/music/SongList.jsx
import React, { useState } from 'react';
import { FiClock, FiMusic } from 'react-icons/fi';
import Song from './Song';
import { useAppStore } from '../../store/appStore';

function SongList({ songs }) {
  const { 
    music: { currentSong, currentMood },
    playMood
  } = useAppStore();
  
  const [sortOrder, setSortOrder] = useState('addedAt');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Handle sort change
  const handleSortChange = (order) => {
    if (sortOrder === order) {
      // Toggle direction if same order
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New sort order with default direction
      setSortOrder(order);
      setSortDirection('asc');
    }
  };
  
  // Sort songs based on current sort settings
  const sortedSongs = [...songs].sort((a, b) => {
    let comparison = 0;
    
    switch (sortOrder) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'artist':
        comparison = a.artist.localeCompare(b.artist);
        break;
      case 'album':
        comparison = a.album.localeCompare(b.album);
        break;
      case 'duration':
        comparison = a.duration - b.duration;
        break;
      case 'addedAt':
      default:
        comparison = new Date(a.addedAt) - new Date(b.addedAt);
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  // Get sort indicator
  const getSortIndicator = (column) => {
    if (sortOrder !== column) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };
  
  // Format time function
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <FiMusic size={48} className="mb-4" />
        <p>No songs found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Play All Button */}
      {songs.length > 0 && currentMood && (
        <div className="mb-4">
          <button
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded flex items-center"
            onClick={() => playMood(currentMood)}
          >
            <FiMusic className="mr-2" />
            <span>Play All ({songs.length} songs)</span>
          </button>
        </div>
      )}
      
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 py-2 px-4 bg-gray-800 rounded-t text-gray-400 font-medium">
        <div className="col-span-1">#</div>
        <div 
          className="col-span-4 cursor-pointer hover:text-white flex items-center"
          onClick={() => handleSortChange('title')}
        >
          Title {getSortIndicator('title')}
        </div>
        <div 
          className="col-span-3 cursor-pointer hover:text-white flex items-center"
          onClick={() => handleSortChange('artist')}
        >
          Artist {getSortIndicator('artist')}
        </div>
        <div 
          className="col-span-3 cursor-pointer hover:text-white flex items-center"
          onClick={() => handleSortChange('album')}
        >
          Album {getSortIndicator('album')}
        </div>
        <div 
          className="col-span-1 cursor-pointer hover:text-white flex items-center justify-end"
          onClick={() => handleSortChange('duration')}
        >
          <FiClock size={16} /> {getSortIndicator('duration')}
        </div>
      </div>
      
      {/* Songs List */}
      <div className="bg-gray-800 rounded-b">
        {sortedSongs.map((song, index) => (
          <Song 
            key={song.id} 
            song={song} 
            index={index + 1} 
            isPlaying={currentSong === song.id} 
          />
        ))}
      </div>
    </div>
  );
}

export default SongList;