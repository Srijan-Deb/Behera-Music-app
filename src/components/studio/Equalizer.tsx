"use client";

import React, { useState, useEffect } from 'react';
import { audioEngine } from '@/lib/audio-engine';

const BANDS = [
  { index: 0, label: '60', type: 'Sub' },
  { index: 1, label: '230', type: 'Bass' },
  { index: 2, label: '910', type: 'Mid' },
  { index: 3, label: '3.6k', type: 'Treble' },
  { index: 4, label: '14k', type: 'Air' }
];

export function Equalizer() {
  const [gains, setGains] = useState<number[]>([0, 0, 0, 0, 0]);

  useEffect(() => {
    // Sync initial state if engine already has different values
    if (audioEngine.initialized && audioEngine.bands.length > 0) {
      setGains(audioEngine.bands.map(b => b.gain.value));
    }
  }, []);

  const handleGainChange = (index: number, value: number) => {
    const newGains = [...gains];
    newGains[index] = value;
    setGains(newGains);
    
    if (audioEngine.initialized) {
       audioEngine.setEqBand(index, value);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md flex flex-col gap-6 h-full min-h-[300px]">
       <div className="flex items-center justify-between">
         <h3 className="text-xl font-semibold">Equalizer</h3>
         <button 
           onClick={() => {
              const resets = [0, 0, 0, 0, 0];
              setGains(resets);
              resets.forEach((val, i) => audioEngine.setEqBand(i, val));
           }}
           className="text-xs text-primary hover:underline font-medium"
         >
           Reset Flat
         </button>
       </div>
       
       <div className="flex justify-between items-end flex-1 pb-4 gap-2">
         {BANDS.map((band) => (
            <div key={band.index} className="flex flex-col items-center gap-6 flex-1 h-full">
               <div className="relative flex flex-col items-center justify-center h-full w-full group">
                  <input 
                    type="range"
                    min={-12}
                    max={12}
                    step={0.1}
                    value={gains[band.index]}
                    onChange={(e) => handleGainChange(band.index, parseFloat(e.target.value))}
                    className="absolute w-36 h-2 -rotate-90 origin-center bg-black/40 rounded-lg appearance-none cursor-pointer accent-primary top-1/2 -mt-1 shadow-inner border border-white/5"
                  />
                  <div className="absolute font-mono text-[10px] text-muted-foreground/50 top-1/2 -mt-1 -translate-y-12">
                     {gains[band.index] > 0 ? '+' : ''}{gains[band.index].toFixed(1)}
                  </div>
               </div>
               <div className="flex flex-col items-center text-center mt-auto pt-4">
                 <span className="text-xs font-semibold">{band.label}</span>
                 <span className="text-[10px] text-muted-foreground">{band.type}</span>
               </div>
            </div>
         ))}
       </div>
    </div>
  );
}
