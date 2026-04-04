"use client";

import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, Song, Recording } from "@/lib/db";
import { DragDropZone } from "@/components/library/DragDropZone";
import { AudioPlayer } from "@/components/player/AudioPlayer";
import { usePlayerStore } from "@/store/usePlayerStore";
import { SearchBar } from "@/components/library/SearchBar";
import { PlaylistsView } from "@/components/library/PlaylistsView";
import { Equalizer } from "@/components/studio/Equalizer";
import { SpatialAudio } from "@/components/studio/SpatialAudio";
import { Visualizer } from "@/components/studio/Visualizer";
import { VoiceRecorder } from "@/components/studio/VoiceRecorder";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { WebRTCNetwork } from "@/components/network/WebRTCNetwork";
import { MoodSlider } from "@/components/library/MoodSlider";
import { ThemeSelector } from "@/components/ThemeSelector";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Play, Heart, Mic, Trash, Globe, Download } from "lucide-react";

export default function Home() {
  const songs = useLiveQuery(() => db.songs.toArray()) || [];
  const recordings = useLiveQuery(() => db.recordings.toArray()) || [];
  const { playTrack, currentTrack, isPlaying } = usePlayerStore();
  
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'playlists' | 'recordings' | 'studio' | 'analytics' | 'network'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'artist'>('date');
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone;
    setIsStandalone(isStandaloneMode);
  }, []);

  const appName = "Behera".split("");

  let filteredSongs = songs.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          song.artist.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'favorites') {
      return matchesSearch && song.isFavorite;
    }
    return matchesSearch;
  });

  filteredSongs = filteredSongs.sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const toggleFavorite = async (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    if (song.id) {
      const newFavStat = !song.isFavorite;
      await db.songs.update(song.id, { isFavorite: newFavStat });
      
      // Push to Yjs silently so other peers get it natively
      if (typeof window !== 'undefined') {
         import('@/lib/yjs-store').then(({ yFavorites }) => {
             yFavorites.set(`${song.title}|||${song.artist}`, newFavStat);
         });
      }
    }
  };

  const deleteRecording = async (e: React.MouseEvent, id?: number) => {
    e.stopPropagation();
    if (id) await db.recordings.delete(id);
  };

  const handlePlayTrack = (song: Song) => {
    const songIndex = filteredSongs.findIndex(s => s.id === song.id);
    const newQueue = filteredSongs.slice(songIndex);
    playTrack(song, newQueue);
  };

  const handlePlayRecording = (rec: Recording) => {
    const fakeSong: Song = {
       id: rec.id ? -rec.id : Math.random(), // negative ID or random to avoid collision
       title: rec.title,
       artist: 'Voice Note',
       audioBlob: rec.audioBlob,
       createdAt: rec.createdAt,
       duration: rec.duration
    };
    playTrack(fakeSong, [fakeSong]);
  };

  return (
    <main className="min-h-screen bg-background text-foreground pb-32 font-sans selection:bg-primary/30">
      <div className="max-w-6xl mx-auto p-6 flex flex-col gap-8">
        
        <header className="flex flex-row items-center justify-between pt-10">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-extrabold tracking-tight flex items-center w-fit">
              {appName.map((letter, i) => (
                 <motion.span
                   key={i}
                   className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"
                   animate={{
                      y: isPlaying ? [0, -8, 0] : [0, -3, 0],
                      scaleY: isPlaying ? [1, 1.15, 1] : 1
                   }}
                   transition={{
                     duration: isPlaying ? 0.5 : 2,
                     repeat: Infinity,
                     delay: i * 0.1,
                     ease: "easeInOut"
                   }}
                 >
                   {letter}
                 </motion.span>
              ))}
            </h1>
            <p className="text-muted-foreground">Your beautiful offline-first music companion.</p>
          </div>
          <div className="flex items-center gap-4">
            {!isStandalone && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.dispatchEvent(new CustomEvent('behera-trigger-install'))}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)]"
              >
                <Download className="w-4 h-4" />
                Install App
              </motion.button>
            )}
            <ThemeSelector />
          </div>
        </header>

        {activeTab !== 'studio' && (
          <section className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <DragDropZone />
            </div>
            <div className="md:col-span-1">
              <MoodSlider />
            </div>
          </section>
        )}

        <section className="flex flex-col gap-6 mt-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 overflow-x-auto pb-2">
             <div className="flex bg-white/5 p-1 rounded-full border border-white/10 w-fit shrink-0">
               <button onClick={() => setActiveTab('all')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                 All Songs
               </button>
               <button onClick={() => setActiveTab('favorites')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'favorites' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                 Favorites
               </button>
               <button onClick={() => setActiveTab('playlists')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'playlists' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                 Playlists
               </button>
               <button onClick={() => setActiveTab('recordings')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'recordings' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                 Recordings
               </button>
               <button onClick={() => setActiveTab('analytics')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'analytics' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                 Analytics
               </button>
               <button onClick={() => setActiveTab('network')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'network' ? 'bg-primary text-primary-foreground shadow-sm flex items-center gap-1.5' : 'text-muted-foreground hover:text-foreground flex items-center gap-1.5'}`}>
                 <Globe className="w-4 h-4" /> Sync
               </button>
               <button onClick={() => setActiveTab('studio')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'studio' ? 'bg-primary text-primary-foreground shadow-sm flex items-center gap-1.5' : 'text-muted-foreground hover:text-foreground flex items-center gap-1.5'}`}>
                 <div className={`w-2 h-2 rounded-full ${activeTab === 'studio' ? 'bg-emerald-300' : 'bg-emerald-500/50'}`}></div> Studio
               </button>
             </div>
             
             {['all', 'favorites'].includes(activeTab) && (
               <div className="flex items-center gap-3 w-full xl:w-auto shrink-0">
                 <div className="flex-1 xl:w-64">
                   <SearchBar value={searchQuery} onChange={setSearchQuery} />
                 </div>
                 <div className="relative flex items-center bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                    <span className="text-xs text-muted-foreground mr-2 font-medium">Sort:</span>
                    <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value as 'date'|'title'|'artist')}
                      className="bg-transparent text-sm focus:outline-none appearance-none cursor-pointer pr-4 hover:text-primary transition-colors [&>option]:bg-background"
                    >
                      <option value="date">Newest</option>
                      <option value="title">A-Z</option>
                      <option value="artist">Artist</option>
                    </select>
                 </div>
               </div>
             )}
          </div>
          
          {activeTab === 'analytics' ? (
            <AnalyticsDashboard />
          ) : activeTab === 'network' ? (
            <WebRTCNetwork />
          ) : activeTab === 'studio' ? (
             <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-full">
                  <Visualizer />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                   <Equalizer />
                   <SpatialAudio />
                   <VoiceRecorder />
                </div>
             </div>
          ) : activeTab === 'recordings' ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recordings.length === 0 ? (
                  <div className="col-span-full border border-white/5 bg-white/5 backdrop-blur-md rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-inner mt-4">
                    <Mic className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">No Voice Notes</h3>
                    <p className="text-muted-foreground mt-1">Head over to the Studio tab to record something.</p>
                  </div>
                ) : (
                  recordings.map((rec) => (
                    <div 
                      key={rec.id} 
                      className={`group relative flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer hover:bg-white/5 shadow-sm hover:shadow-md border-white/5 bg-background`}
                      onClick={() => handlePlayRecording(rec)}
                    >
                      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white/5 flex-shrink-0 border border-white/10">
                          <div className="w-full h-full flex items-center justify-center text-primary">
                            <Mic className="w-5 h-5" />
                          </div>
                      </div>
                      
                      <div className="flex flex-col flex-1 overflow-hidden">
                         <p className="font-semibold text-sm truncate text-foreground/90 group-hover:text-foreground">{rec.title}</p>
                         <p className="text-xs text-muted-foreground truncate">{rec.createdAt.toLocaleString()}</p>
                      </div>

                      <button onClick={(e) => deleteRecording(e, rec.id)} className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                         <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
             </div>
          ) : activeTab === 'playlists' ? (
            <PlaylistsView />
          ) : (
             <>
                {songs.length === 0 ? (
                  <div className="border border-white/5 bg-white/5 backdrop-blur-md rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-inner mt-4">
                    <Music className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">Your library is empty</h3>
                    <p className="text-muted-foreground mt-1">Drag and drop some audio files above to start listening.</p>
                  </div>
                ) : filteredSongs.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                     <p>No songs found matching your search.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSongs.map((song) => (
                      <div 
                        key={song.id} 
                        className={`group relative flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer hover:bg-white/5 shadow-sm hover:shadow-md
                          ${currentTrack?.id === song.id ? 'border-primary/50 bg-primary/5' : 'border-white/5 bg-background'}`}
                        onClick={() => handlePlayTrack(song)}
                      >
                        <div className="relative w-16 h-16 rounded-md overflow-hidden bg-white/5 flex-shrink-0 border border-white/10">
                          {song.coverArt ? (
                            <img src={song.coverArt} alt={song.title} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <Music className="w-6 h-6" />
                            </div>
                          )}
                          <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity backdrop-blur-[2px] ${currentTrack?.id === song.id && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {currentTrack?.id === song.id && isPlaying ? (
                               <div className="flex items-center justify-center gap-[3px] h-6 w-8">
                                 {[0, 1, 2, 3].map((bar) => (
                                    <motion.div
                                      key={bar}
                                      className="w-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                                      animate={{ height: ["4px", "16px", "4px"] }}
                                      transition={{
                                         duration: 0.8,
                                         repeat: Infinity,
                                         delay: bar * 0.15,
                                         ease: "easeInOut"
                                      }}
                                    />
                                 ))}
                               </div>
                            ) : (
                               <Play className="w-7 h-7 text-white fill-white ml-1 drop-shadow-md" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col flex-1 overflow-hidden">
                           <p className="font-semibold text-sm truncate text-foreground/90 group-hover:text-foreground">{song.title}</p>
                           <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                        </div>
                        
                        <button 
                           onClick={(e) => toggleFavorite(e, song)} 
                           className={`p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100 ${song.isFavorite ? 'opacity-100 text-red-500 hover:bg-red-500/10' : 'text-muted-foreground hover:bg-white/10 hover:text-foreground'}`}
                           title={song.isFavorite ? "Remove from favorites" : "Add to favorites"}
                        >
                           <Heart className={`w-4 h-4 ${song.isFavorite ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
             </>
          )}
        </section>
      </div>

      <AudioPlayer />
    </main>
  );
}
