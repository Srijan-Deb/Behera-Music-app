"use client";

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Plus, ListMusic, MoreVertical, Trash } from 'lucide-react';

export function PlaylistsView() {
  const playlists = useLiveQuery(() => db.playlists.toArray()) || [];
  const [isCreating, setIsCreating] = useState(false);
  const [newParams, setNewParams] = useState({ name: '' });

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newParams.name.trim() === '') return;
    
    await db.playlists.add({
      name: newParams.name,
      songIds: [],
      createdAt: new Date()
    });
    setNewParams({ name: '' });
    setIsCreating(false);
  };

  const handleDelete = async (id: number | undefined) => {
    if (id) await db.playlists.delete(id);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Your Playlists</h3>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-md text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreatePlaylist} className="flex gap-2 items-center bg-white/5 p-4 rounded-xl border border-white/10">
          <input 
            autoFocus
            type="text" 
            placeholder="Playlist name..."
            value={newParams.name}
            onChange={(e) => setNewParams({ name: e.target.value })}
            className="flex-1 bg-black/20 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">Save</button>
          <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
        </form>
      )}

      {playlists.length === 0 && !isCreating ? (
        <div className="border border-white/5 bg-white/5 backdrop-blur-md rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-inner">
          <ListMusic className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium">No Playlists</h3>
          <p className="text-muted-foreground mt-1">Create your first playlist to organize your music.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map(playlist => (
            <div key={playlist.id} className="group relative flex items-center gap-4 p-4 rounded-xl border border-white/5 hover:border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
               <div className="w-12 h-12 bg-black/20 border border-white/10 rounded-md flex items-center justify-center">
                 <ListMusic className="w-5 h-5 text-muted-foreground" />
               </div>
               <div className="flex flex-col flex-1 overflow-hidden">
                 <p className="font-semibold text-sm truncate">{playlist.name}</p>
                 <p className="text-xs text-muted-foreground">{playlist.songIds.length} tracks</p>
               </div>
               
               <button 
                 onClick={(e) => { e.stopPropagation(); handleDelete(playlist.id); }}
                 className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                 title="Delete Playlist"
               >
                 <Trash className="w-4 h-4" />
               </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
