"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Music, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';

export function AudioPlayer() {
  const { 
    currentTrack, isPlaying, play, pause, volume, setVolume, currentTime, setCurrentTime,
    nextTrack, prevTrack, toggleShuffle, toggleRepeat, isShuffle, repeatMode, handleEnded 
  } = usePlayerStore();
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      // If we are repeating the same song (currentTime set to 0), we don't necessarily restart object URL
      if (audioRef.current.src && audioRef.current.currentTime === 0 && isPlaying) {
         audioRef.current.play();
         return;
      }
      
      const url = URL.createObjectURL(currentTrack.audioBlob);
      audioRef.current.src = url;
      if (isPlaying) {
        audioRef.current.play();
      }
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      if (currentTime === 0 && isPlaying) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    }
  }, [currentTime, isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        import('@/lib/audio-engine').then(({ audioEngine }) => {
           if (!audioEngine.initialized) {
             audioEngine.initialize(audioRef.current!);
           }
           audioEngine.resume();
        });
        audioRef.current.play().catch(e => console.error(e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Use an interval for time updates to prevent react lag vs onTimeUpdate event
  useEffect(() => {
     let interval: NodeJS.Timeout;
     if (isPlaying) {
       interval = setInterval(() => {
         if (audioRef.current) {
           setCurrentTime(audioRef.current.currentTime);
         }
       }, 500);
     }
     return () => clearInterval(interval);
  }, [isPlaying, setCurrentTime]);

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (isPlaying) pause();
    else play();
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full bg-background/80 backdrop-blur-lg border-t border-white/10 p-4 flex items-center justify-between z-50 shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.3)]">
      <audio 
        ref={audioRef} 
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        crossOrigin="anonymous"
      />
      
      <div className="flex items-center gap-4 w-1/3">
        {currentTrack.coverArt ? (
          <img src={currentTrack.coverArt} alt="Cover" className="w-12 h-12 rounded-md object-cover shadow-sm" />
        ) : (
          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-md flex items-center justify-center shadow-sm">
            <Music className="text-muted-foreground w-6 h-6" />
          </div>
        )}
        <div className="overflow-hidden">
          <p className="font-semibold text-sm truncate">{currentTrack.title}</p>
          <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 w-1/3">
        <div className="flex items-center gap-6">
          <button onClick={toggleShuffle} className={`transition-colors ${isShuffle ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <Shuffle className="w-4 h-4" />
          </button>
        
          <button onClick={prevTrack} className="text-foreground hover:text-primary transition-colors">
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          
          <button onClick={togglePlay} className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:scale-105 transition-transform shadow-md hover:shadow-lg shadow-primary/20">
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
          </button>
          
          <button onClick={nextTrack} className="text-foreground hover:text-primary transition-colors">
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          
          <button onClick={toggleRepeat} className={`transition-colors ${repeatMode !== 'none' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </button>
        </div>
        
        {/* Simple Progress Bar */}
        <div className="w-full flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
           <span>{Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}</span>
           <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
              if (audioRef.current && duration) {
                 const rect = e.currentTarget.getBoundingClientRect();
                 const pos = (e.clientX - rect.left) / rect.width;
                 audioRef.current.currentTime = pos * duration;
                 setCurrentTime(pos * duration);
              }
           }}>
               <div 
                   className="h-full bg-primary rounded-full transition-all duration-300 ease-linear pointer-events-none" 
                   style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
               />
           </div>
           <span>{Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 w-1/3 pr-4">
        <Volume2 className="w-4 h-4 text-muted-foreground" />
        <input 
          type="range" 
          min={0} 
          max={1} 
          step={0.01} 
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-24 accent-primary" 
        />
      </div>
    </div>
  );
}
