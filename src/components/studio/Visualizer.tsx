"use client";

import React, { useEffect, useRef } from 'react';
import { audioEngine } from '@/lib/audio-engine';
import { usePlayerStore } from '@/store/usePlayerStore';

export function Visualizer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isPlaying } = usePlayerStore();
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive Canvas
    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || 300;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      if (!audioEngine.analyserNode) {
         animationRef.current = requestAnimationFrame(draw);
         return;
      }

      const { analyserNode } = audioEngine;
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserNode.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create a smooth glowing aesthetic
      ctx.beginPath();
      
      const sliceWidth = canvas.width / (bufferLength / 2); // only draw the useful half of frequencies
      let x = 0;

      // Move to start bottom left
      ctx.moveTo(0, canvas.height);

      for (let i = 0; i < bufferLength / 2; i++) {
        // Curve smoothing
        const val = dataArray[i] / 255; 
        const y = canvas.height - (val * canvas.height * 0.8);
        
        ctx.lineTo(x, y);
        x += sliceWidth;
      }
      
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();

      // Create beautiful gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "rgba(52, 211, 153, 0.8)"); // emerald-400
      gradient.addColorStop(0.5, "rgba(34, 211, 238, 0.4)"); // cyan-400
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw shiny stroke
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(52, 211, 153, 0.9)";
      ctx.stroke();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="w-full h-full min-h-[300px] flex items-end justify-center relative rounded-xl overflow-hidden border border-white/5 bg-black/20">
      <canvas ref={canvasRef} className="w-full h-full absolute inset-0 block"></canvas>
      
      {!isPlaying && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10 transition-opacity duration-1000">
            <p className="text-muted-foreground font-medium drop-shadow-md tracking-wider uppercase text-sm">Play music to see visualizer</p>
         </div>
      )}
    </div>
  );
}
