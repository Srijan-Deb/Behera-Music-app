"use client";

import React, { useState, useEffect } from 'react';
import { db, Song } from '@/lib/db';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Flame, Wind } from 'lucide-react';

export function MoodSlider() {
  const [moodLevel, setMoodLevel] = useState<number>(50);
  const [matchingSongs, setMatchingSongs] = useState<Song[]>([]);
  const { playTrack } = usePlayerStore();

  useEffect(() => {
     // Whenever mood level changes, query the database
     const fetchMood = async () => {
         const allSongs = await db.songs.toArray();
         
         // 0 -> Chill (Low Energy, High Valence)
         // 50 -> Neutral / Anything
         // 100 -> Energetic (High Energy, High Valence or any Valence)
         
         const filtered = allSongs.filter(song => {
             // Let's assume default energy is 0.5 if not processed
             const energy = song.energy ?? 0.5;
             const valence = song.valence ?? 0.5;
             
             if (moodLevel < 33) {
                 // Chill: Energy < 0.6
                 return energy < 0.6;
             } else if (moodLevel > 66) {
                 // Energetic: Energy > 0.6
                 return energy > 0.6;
             }
             return true; // Neutral includes everything
         });
         
         // Sort them by how close they are to the mood ideal
         filtered.sort((a, b) => {
             const eA = a.energy ?? 0.5;
             const eB = b.energy ?? 0.5;
             
             if (moodLevel < 33) {
                 return eA - eB; // Lower energy first
             } else if (moodLevel > 66) {
                 return eB - eA; // Higher energy first
             }
             return 0;
         });

         setMatchingSongs(filtered);
     };
     
     const timeoutId = setTimeout(() => {
         fetchMood();
     }, 300); // 300ms debounce
     
     return () => clearTimeout(timeoutId);
  }, [moodLevel]);

  const handlePlayMood = () => {
      if (matchingSongs.length > 0) {
          playTrack(matchingSongs[0], [...matchingSongs]);
      }
  };

  return (
    <div className="flex flex-col gap-4 bg-white/5 border border-white/10 p-5 rounded-xl backdrop-blur-sm">
        <div className="flex justify-between items-center mb-2">
           <h3 className="text-sm font-semibold text-foreground/90">Vibe Check</h3>
           <span className="text-xs text-muted-foreground px-2 py-1 bg-black/20 rounded-full">
              {matchingSongs.length} tracks
           </span>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-blue-400">
                <Wind className="w-4 h-4" />
                <span className="text-xs font-medium">Chill</span>
            </div>
            
            <input 
                type="range" 
                min="0" 
                max="100" 
                value={moodLevel} 
                onChange={(e) => setMoodLevel(Number(e.target.value))}
                className="flex-1 h-2 bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-red-500/50 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            />
            
            <div className="flex items-center gap-1.5 text-red-400">
                <span className="text-xs font-medium">Hype</span>
                <Flame className="w-4 h-4" />
            </div>
        </div>

        <button 
           onClick={handlePlayMood}
           disabled={matchingSongs.length === 0}
           className="mt-2 w-full py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
           Play {moodLevel < 33 ? 'Chill' : moodLevel > 66 ? 'Hype' : 'Mixed'} Mix
        </button>
    </div>
  );
}
