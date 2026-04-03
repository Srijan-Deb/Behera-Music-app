"use client";

import React, { useState, useRef, useEffect } from 'react';
import { audioEngine } from '@/lib/audio-engine';
import { Headphones, Waves, BoxSelect } from 'lucide-react';

export function SpatialAudio() {
  const [reverbMode, setReverbMode] = useState<'off'|'club'|'cathedral'|'stadium'>('off');
  const [position, setPosition] = useState({ x: 0, z: -1 }); // Original default
  const padRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const handleUp = () => isDragging.current = false;
    window.addEventListener('pointerup', handleUp);
    return () => window.removeEventListener('pointerup', handleUp);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    updatePosition(e);
  };

  const updatePosition = (e: React.PointerEvent) => {
    if (!padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    
    // Bounds width in Web Audio coordinates. Let's make the box represent a 10x10 room
    const halfRoomSize = 5; 
    let normX = ((e.clientX - rect.left) / rect.width) * 2 - 1; 
    let normZ = ((e.clientY - rect.top) / rect.height) * 2 - 1; 
    
    // Clamp to boundaries visually
    normX = Math.max(-1, Math.min(1, normX));
    normZ = Math.max(-1, Math.min(1, normZ));

    const x = normX * halfRoomSize;
    const z = normZ * halfRoomSize;

    setPosition({ x, z });
    if (audioEngine.initialized) {
       audioEngine.setSpatialPosition(x, 0, z); // y=0 (flat plane)
    }
  };

  const handleSetReverb = (mode: 'off'|'club'|'cathedral'|'stadium') => {
     setReverbMode(mode);
     if (audioEngine.initialized) {
        audioEngine.setReverbMode(mode);
     }
  };

  // UI calculations
  const dotX = ((position.x / 5) + 1) / 2 * 100;
  const dotY = ((position.z / 5) + 1) / 2 * 100;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md flex flex-col gap-6 h-full">
       <div className="flex items-center gap-2 mb-2">
         <Waves className="w-5 h-5 text-cyan-400" />
         <h3 className="text-xl font-semibold">3D Environment</h3>
       </div>
       
       <div className="flex flex-col md:flex-row gap-8 items-center justify-center flex-1">
         
         {/* 3D Panner UI */}
         <div className="flex flex-col items-center gap-2">
           <div 
             ref={padRef}
             onPointerDown={handlePointerDown}
             onPointerMove={handlePointerMove}
             className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl border-2 border-white/10 bg-black/40 overflow-hidden cursor-crosshair shadow-inner select-none touch-none"
             style={{ backgroundImage: 'radial-gradient(circle at center, rgba(34, 211, 238, 0.05) 0%, transparent 70%)' }}
           >
              {/* Grid Lines */}
              <div className="absolute inset-0 pointer-events-none opacity-20" 
                   style={{ backgroundSize: '20px 20px', backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)' }} />
              
              {/* Center Listener (User) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-cyan-400/20 rounded-full flex items-center justify-center pointer-events-none z-10 border border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                 <Headphones className="w-4 h-4 text-cyan-400" />
              </div>

              {/* Draggable Audio Source */}
              <div 
                 className="absolute w-5 h-5 bg-white rounded-full pointer-events-none shadow-[0_0_15px_rgba(255,255,255,0.8)] z-20 transition-transform duration-75"
                 style={{ 
                   left: `${dotX}%`, 
                   top: `${dotY}%`, 
                   transform: 'translate(-50%, -50%)',
                   boxShadow: isDragging.current ? '0 0 20px rgba(52, 211, 153, 0.9)' : undefined,
                   backgroundColor: isDragging.current ? '#34d399' : 'white'
                 }}
              />
           </div>
           <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mt-2">Spatial Panner (Drag)</p>
         </div>

         {/* Concert Hall Mode (Reverb) */}
         <div className="flex flex-col gap-4 min-w-[160px]">
           <h4 className="text-sm font-semibold text-foreground/80 border-b border-white/10 pb-2">Acoustic Space</h4>
           
           <button 
             onClick={() => handleSetReverb('off')}
             className={`px-4 py-2 text-sm rounded-md transition-all text-left ${reverbMode === 'off' ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-transparent text-muted-foreground hover:bg-white/5 border border-transparent'}`}
           >
             Studio (Dry)
           </button>
           <button 
             onClick={() => handleSetReverb('club')}
             className={`px-4 py-2 text-sm rounded-md transition-all text-left ${reverbMode === 'club' ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-transparent text-muted-foreground hover:bg-white/5 border border-transparent'}`}
           >
             Small Club
           </button>
           <button 
             onClick={() => handleSetReverb('cathedral')}
             className={`px-4 py-2 text-sm rounded-md transition-all text-left ${reverbMode === 'cathedral' ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-transparent text-muted-foreground hover:bg-white/5 border border-transparent'}`}
           >
             Cathedral
           </button>
           <button 
             onClick={() => handleSetReverb('stadium')}
             className={`px-4 py-2 text-sm rounded-md transition-all text-left ${reverbMode === 'stadium' ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-transparent text-muted-foreground hover:bg-white/5 border border-transparent'}`}
           >
             Open Stadium
           </button>
         </div>

       </div>
    </div>
  );
}
