"use client";

import React, { useState, useCallback } from 'react';
import { UploadCloud, Music } from 'lucide-react';
import { db } from '@/lib/db';
import { parseAudioFile } from '@/lib/audio-utils';
import { getAudioFingerprint, fetchMusicBrainzData } from '@/lib/audio-fingerprint';
import { getMoodFeatures } from '@/lib/mood-analysis';

export function DragDropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFiles = async (files: FileList | null) => {
    if (!files) return;
    setIsProcessing(true);
    
    const audioFiles = Array.from(files).filter(file => 
      file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.flac') || file.name.endsWith('.wav')
    );

    for (const file of audioFiles) {
      if (file) {
        try {
          const songData = await parseAudioFile(file);
          
          // Smart Metadata: if title seems messy/generic, use fingerprinting
          const isGenericName = songData.title === file.name.replace(/\.[^/.]+$/, "") 
              || songData.title.includes('track_') 
              || songData.artist === 'Unknown Artist';
              
          if (isGenericName) {
             const fpData = await getAudioFingerprint(file);
             if (fpData) {
                 const mbData = await fetchMusicBrainzData(fpData.fingerprint, fpData.duration);
                 if (mbData) {
                     songData.title = mbData.title;
                     songData.artist = mbData.artist;
                     if (mbData.coverArt) songData.coverArt = mbData.coverArt;
                 }
             }
          }
          
          // Mood Analysis
          const mood = await getMoodFeatures(file);
          if (mood) {
              songData.valence = mood.valence;
              songData.energy = mood.energy;
          }

          await db.songs.add(songData);
        } catch (error) {
          console.error("Failed to add song:", error);
        }
      }
    }
    
    setIsProcessing(false);
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    await processFiles(e.dataTransfer.files);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFiles(e.target.files);
    }
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer
        ${isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-upload')?.click()}
    >
      <input 
        id="file-upload" 
        type="file" 
        multiple 
        accept="audio/*,.mp3,.flac,.wav" 
        className="hidden" 
        onChange={handleFileChange}
      />
      {isProcessing ? (
        <div className="flex flex-col items-center gap-4 animate-pulse text-muted-foreground">
          <Music className="w-12 h-12" />
          <p>Processing files...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <UploadCloud className="w-12 h-12" />
          <p className="text-lg font-medium text-foreground">Drag and drop your music here</p>
          <p className="text-sm">or click to browse files</p>
          <p className="text-xs mt-2 opacity-70">Supports MP3, FLAC, WAV</p>
        </div>
      )}
    </div>
  );
}
