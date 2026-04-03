"use client";

import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, Disc3, History } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';

export function AnalyticsDashboard() {
  const history = useLiveQuery(() => db.history.toArray()) || [];
  const songs = useLiveQuery(() => db.songs.toArray()) || [];
  const { playTrack, queue } = usePlayerStore();

  // Data processing: Top Artists
  const chartData = useMemo(() => {
    const artistCounts: Record<string, number> = {};
    history.forEach(h => {
      const song = songs.find(s => s.id === h.songId);
      if (song) {
        artistCounts[song.artist] = (artistCounts[song.artist] || 0) + 1;
      }
    });

    return Object.entries(artistCounts)
      .map(([name, plays]) => ({ name, plays }))
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 5); // top 5 artists
  }, [history, songs]);

  // Data processing: Recent Plays
  const recentHistory = useMemo(() => {
     return history
       .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
       .slice(0, 10)
       .map(h => {
          const s = songs.find(s => s.id === h.songId);
          return { ...h, song: s };
       })
       .filter(h => h.song);
  }, [history, songs]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md flex flex-col gap-2 relative overflow-hidden group">
            <div className="flex items-center gap-2 text-primary">
               <Activity className="w-5 h-5" />
               <h3 className="font-semibold text-foreground">Total Streams</h3>
            </div>
            <p className="text-5xl font-extrabold tracking-tighter mt-2">{history.length}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Total tracks successfully finished.</p>
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4 group-hover:scale-110 transition-transform">
               <Activity className="w-32 h-32" />
            </div>
         </div>

         <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md flex flex-col gap-2 relative overflow-hidden group">
            <div className="flex items-center gap-2 text-cyan-400">
               <Disc3 className="w-5 h-5" />
               <h3 className="font-semibold text-foreground">Library Size</h3>
            </div>
            <p className="text-5xl font-extrabold tracking-tighter mt-2">{songs.length}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Unique offline tracks stored.</p>
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4 group-hover:rotate-45 transition-transform">
               <Disc3 className="w-32 h-32" />
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md h-[400px] flex flex-col">
           <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-primary"/> Top Artists</h3>
           <div className="flex-1 w-full relative">
              {chartData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 12}} width={100} />
                     <Tooltip 
                       cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                       contentStyle={{backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px'}} 
                     />
                     <Bar dataKey="plays" radius={[0, 4, 4, 0]} barSize={24}>
                       {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#colorGradient)`} />
                       ))}
                     </Bar>
                     <defs>
                       <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                         <stop offset="0%" stopColor="#34d399" stopOpacity={0.8}/> {/* Emerald-400 */}
                         <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.8}/> {/* Cyan-400 */}
                       </linearGradient>
                     </defs>
                   </BarChart>
                 </ResponsiveContainer>
              ) : (
                 <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm font-medium">
                    <p>Play some music to generate analytics.</p>
                 </div>
              )}
           </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md h-[400px] flex flex-col">
           <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><History className="w-5 h-5 text-cyan-400"/> Recent History</h3>
           <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {recentHistory.length > 0 ? (
                 <div className="flex flex-col gap-3">
                   {recentHistory.map((h, i) => (
                     <div key={h.id || i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex flex-col overflow-hidden">
                           <p className="font-medium text-sm truncate">{h.song?.title}</p>
                           <p className="text-xs text-muted-foreground truncate">{h.song?.artist}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                           {new Date(h.playedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                        </span>
                     </div>
                   ))}
                 </div>
              ) : (
                 <div className="h-full flex items-center justify-center text-muted-foreground text-sm font-medium">
                    <p>No listening history yet.</p>
                 </div>
              )}
           </div>
        </div>
      </div>

    </div>
  );
}
