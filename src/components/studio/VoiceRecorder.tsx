"use client";

import React, { useState, useRef } from 'react';
import { Mic, Square, Save, Play } from 'lucide-react';
import { db } from '@/lib/db';

export function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordingBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setRecordingBlob(null);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Microphone access is required to use the Voice Recorder.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const clearRecording = () => {
    setRecordingBlob(null);
    setRecordingTime(0);
  };

  const saveRecording = async () => {
    if (recordingBlob) {
      await db.recordings.add({
        title: `Voice Note - ${new Date().toLocaleString()}`,
        audioBlob: recordingBlob,
        createdAt: new Date(),
        duration: recordingTime
      });
      clearRecording();
      alert("Recording saved to Recordings tab.");
    }
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = time % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md flex flex-col gap-6 h-full min-h-[300px]">
       <div className="flex items-center justify-between">
         <h3 className="text-xl font-semibold">Voice Recorder</h3>
         {isRecording && <span className="flex items-center gap-2 text-red-500 font-mono text-sm animate-pulse"><div className="w-2 h-2 rounded-full bg-red-500"></div> REC</span>}
       </div>
       
       <div className="flex-1 flex flex-col items-center justify-center gap-6">
         <div className="text-5xl font-mono tracking-widest font-light opacity-80">
           {formatTime(recordingTime)}
         </div>

         <div className="flex items-center gap-4">
           {!isRecording && !recordingBlob && (
              <button onClick={startRecording} className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg hover:shadow-red-500/50">
                 <Mic className="w-6 h-6" />
              </button>
           )}
           
           {isRecording && (
              <button onClick={stopRecording} className="w-16 h-16 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all shadow-lg">
                 <Square className="w-6 h-6 fill-current" />
              </button>
           )}

           {!isRecording && recordingBlob && (
              <>
                <button onClick={clearRecording} className="px-4 py-2 rounded-md bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors">Discard</button>
                <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center pointer-events-none">
                   <Play className="w-5 h-5 ml-1 fill-current" />
                </div>
                <button onClick={saveRecording} className="flex items-center gap-2 px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors shadow-md">
                   <Save className="w-4 h-4" /> Save
                </button>
              </>
           )}
         </div>
       </div>

       <p className="text-center text-xs text-muted-foreground">Recordings are saved securely to your local offline library.</p>
    </div>
  );
}
