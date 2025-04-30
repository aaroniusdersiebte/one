// src/components/music/MusicBar.jsx
import React, { useEffect, useRef, useState } from 'react';
import { 
  FiPlay, 
  FiPause, 
  FiSkipBack, 
  FiSkipForward, 
  FiVolume2, 
  FiVolumeX,
  FiRepeat,
  FiShuffle,
  FiAlertCircle
} from 'react-icons/fi';
import { useAppStore } from '../../store/appStore';

function MusicBar() {
  const { 
    music: { 
      currentSong, 
      isPlaying, 
      volume, 
      shuffle, 
      repeat, 
      progress, 
      duration,
      songs
    },
    togglePlay,
    stopPlayback,
    nextSong,
    previousSong,
    toggleShuffle,
    toggleRepeat,
    setVolume,
    seekTo,
    updateProgress,
    setDuration
  } = useAppStore();
  
  const audioRef = useRef(null);
  const progressInterval = useRef(null);
  const [fileError, setFileError] = useState(false);
  
  // Current song details
  const currentSongDetails = currentSong ? songs.find(song => song.id === currentSong) : null;
  
  // Format time (seconds) to MM:SS
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle audio playback
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error('Error playing audio:', err);
          setFileError(true);
          stopPlayback();
        });
      }
      
      // Start progress tracking
      progressInterval.current = setInterval(() => {
        if (audioRef.current) {
          updateProgress(audioRef.current.currentTime / audioRef.current.duration);
        }
      }, 1000);
    } else {
      audioRef.current.pause();
      
      // Stop progress tracking
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying, updateProgress, stopPlayback]);
  
  // Update audio source when song changes
  useEffect(() => {
    if (!audioRef.current || !currentSongDetails) return;
    
    try {
      setFileError(false);
      
      // Check if we're in development or production
      const isDev = process.env.NODE_ENV === 'development';
      
      // In development mode, try to load directly first
      // This won't work for security reasons, but we'll catch the error
      if (isDev) {
        // First try to check if file exists using our Electron bridge
        window.electron.checkAudioFile(currentSongDetails.filePath)
          .then(result => {
            if (result.exists) {
              // Try to use audio-file protocol
              try {
                const encodedPath = encodeURIComponent(currentSongDetails.filePath);
                audioRef.current.src = `audio-file://${encodedPath}`;
                audioRef.current.load();
                
                if (isPlaying) {
                  audioRef.current.play().catch(err => {
                    console.error('Error playing audio with protocol:', err);
                    setFileError(true);
                    stopPlayback();
                  });
                }
              } catch (protocolError) {
                console.error('Protocol error:', protocolError);
                setFileError(true);
              }
            } else {
              console.error('File not found:', currentSongDetails.filePath);
              setFileError(true);
            }
          })
          .catch(err => {
            console.error('Error checking file:', err);
            setFileError(true);
          });
      } else {
        // In production, use our custom protocol
        const encodedPath = encodeURIComponent(currentSongDetails.filePath);
        audioRef.current.src = `audio-file://${encodedPath}`;
        audioRef.current.load();
        
        if (isPlaying) {
          audioRef.current.play().catch(err => {
            console.error('Error playing audio:', err);
            setFileError(true);
            stopPlayback();
          });
        }
      }
    } catch (error) {
      console.error('Error setting audio source:', error);
      setFileError(true);
      stopPlayback();
    }
  }, [currentSong, currentSongDetails, isPlaying, stopPlayback]);
  
  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
  
  // Handle seeking
  const handleSeek = (e) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    
    if (audioRef.current) {
      const newTime = pos * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      seekTo(pos);
    }
  };
  
  // Handle song end
  const handleSongEnd = () => {
    if (repeat === 'one') {
      // Repeat current song
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => {
          console.error('Error replaying audio:', err);
          setFileError(true);
          stopPlayback();
        });
      }
    } else {
      // Play next song
      nextSong();
    }
  };
  
  // Handle metadata loaded to get actual duration
  const handleMetadataLoaded = () => {
    if (audioRef.current) {
      // Update duration in the store
      setDuration(audioRef.current.duration);
      // Reset progress to 0
      updateProgress(0);
      // Clear any previous errors
      setFileError(false);
    }
  };
  
  // If no song is playing, show a minimal version
  if (!currentSongDetails) {
    return (
      <div className="h-16 bg-gray-800 border-t border-gray-700 flex items-center px-4">
        <p className="text-gray-400">No song playing</p>
      </div>
    );
  }

  return (
    <div className="h-16 bg-gray-800 border-t border-gray-700 flex items-center px-4">
      {/* Audio element (hidden) */}
      <audio
        ref={audioRef}
        onEnded={handleSongEnd}
        onLoadedMetadata={handleMetadataLoaded}
        preload="auto"
      />
      
      {/* Song info */}
      <div className="flex-1 min-w-0 mr-4">
        <div className="flex items-center">
          <div className="truncate text-white font-medium">
            {currentSongDetails.title}
          </div>
          {fileError && (
            <div className="ml-2 text-red-500 flex items-center" title="File error or not found">
              <FiAlertCircle size={16} />
            </div>
          )}
        </div>
        <div className="truncate text-gray-400 text-sm">
          {currentSongDetails.artist}
        </div>
      </div>
      
      {/* Playback controls */}
      <div className="flex items-center space-x-4">
        {/* Previous button */}
        <button
          className="text-gray-400 hover:text-white"
          onClick={previousSong}
        >
          <FiSkipBack size={20} />
        </button>
        
        {/* Play/Pause button */}
        <button
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-full w-10 h-10 flex items-center justify-center"
          onClick={togglePlay}
          disabled={fileError}
        >
          {isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
        </button>
        
        {/* Next button */}
        <button
          className="text-gray-400 hover:text-white"
          onClick={nextSong}
        >
          <FiSkipForward size={20} />
        </button>
      </div>
      
      {/* Progress bar and time */}
      <div className="flex-1 flex items-center mx-4">
        <span className="text-xs text-gray-400 mr-2">
          {formatTime(progress * duration)}
        </span>
        
        <div 
          className="flex-1 h-1 bg-gray-700 rounded cursor-pointer"
          onClick={handleSeek}
        >
          <div 
            className="h-full bg-orange-600 rounded"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        
        <span className="text-xs text-gray-400 ml-2">
          {formatTime(duration)}
        </span>
      </div>
      
      {/* Additional controls */}
      <div className="flex items-center space-x-2">
        {/* Shuffle button */}
        <button
          className={`p-1 rounded ${
            shuffle ? 'text-orange-500 bg-gray-700' : 'text-gray-400 hover:text-white'
          }`}
          onClick={toggleShuffle}
          title="Shuffle"
        >
          <FiShuffle size={16} />
        </button>
        
        {/* Repeat button */}
        <button
          className={`p-1 rounded ${
            repeat !== 'none' ? 'text-orange-500 bg-gray-700' : 'text-gray-400 hover:text-white'
          }`}
          onClick={toggleRepeat}
          title={`Repeat: ${repeat}`}
        >
          <FiRepeat size={16} />
          {repeat === 'one' && (
            <span className="absolute text-[8px] font-bold top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              1
            </span>
          )}
        </button>
        
        {/* Volume control */}
        <div className="flex items-center ml-2">
          <button
            className="text-gray-400 hover:text-white"
            onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
          >
            {volume === 0 ? <FiVolumeX size={16} /> : <FiVolume2 size={16} />}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 ml-1"
          />
        </div>
      </div>
    </div>
  );
}

export default MusicBar;