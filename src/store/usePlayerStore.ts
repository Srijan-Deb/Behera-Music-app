import { create } from 'zustand';
import { Song } from '@/lib/db';

interface PlayerState {
  currentTrack: Song | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  
  queue: Song[];
  currentIndex: number;
  isShuffle: boolean;
  repeatMode: 'none' | 'all' | 'one';
  
  // Actions
  playTrack: (song: Song, newQueue?: Song[]) => void;
  play: () => void;
  pause: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setQueue: (queue: Song[]) => void;
  
  nextTrack: () => void;
  prevTrack: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  handleEnded: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 1, // Range 0 to 1
  currentTime: 0,
  
  queue: [],
  currentIndex: -1,
  isShuffle: false,
  repeatMode: 'none',

  playTrack: (song, newQueue) => set((state) => {
    const queue = newQueue || state.queue;
    const index = queue.findIndex(s => s.id === song.id);
    return { 
      currentTrack: song, 
      isPlaying: true, 
      queue: queue, 
      currentIndex: index >= 0 ? index : -1 
    };
  }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  setVolume: (volume) => set({ volume }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setQueue: (queue) => set({ queue }),
  
  nextTrack: () => {
    const { queue, currentIndex, isShuffle, repeatMode, currentTrack } = get();
    if (queue.length === 0 || !currentTrack) return;
    
    if (repeatMode === 'one') {
      set({ currentTime: 0, isPlaying: true });
      return;
    }
    
    let nextIndex = currentIndex + 1;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        set({ isPlaying: false });
        return;
      }
    }
    
    set({ currentTrack: queue[nextIndex], currentIndex: nextIndex, isPlaying: true });
  },
  
  prevTrack: () => {
    const { queue, currentIndex, currentTime } = get();
    if (queue.length === 0 || currentIndex === -1) return;
    
    // If playing for more than 3 seconds, restart current track
    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }
    
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      set({ currentTrack: queue[prevIndex], currentIndex: prevIndex, isPlaying: true });
    }
  },
  
  toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),
  toggleRepeat: () => set((state) => ({
    repeatMode: state.repeatMode === 'none' ? 'all' : state.repeatMode === 'all' ? 'one' : 'none'
  })),
  
  handleEnded: async () => {
    const { repeatMode, nextTrack, currentTrack, queue, currentIndex, isShuffle } = get();
    
    // 1. Log playback to history
    if (currentTrack && currentTrack.id && currentTrack.id > 0) {
       import('@/lib/db').then(({ db }) => {
          db.history.add({
             songId: currentTrack.id as number,
             playedAt: new Date()
          }).catch(e => console.error("History logging failed", e));
       });
    }

    // 2. Resolve next step
    if (repeatMode === 'one') {
      set({ currentTime: 0, isPlaying: true });
    } else {
      // 3. Auto-recommendation if queue ends
      let willEndQueue = false;
      if (isShuffle) {
         willEndQueue = queue.length === 0; // shuffle theoretically loops forever if repeat All, else jumping randomly. Actually my previous nextTrack shuffle logic doesn't end.
      } else {
         willEndQueue = (currentIndex + 1 >= queue.length) && (repeatMode !== 'all');
      }

      if (willEndQueue && currentTrack) {
         try {
            const { db } = await import('@/lib/db');
            const allSongs = await db.songs.toArray();
            let nextSong = null;
            
            if (currentTrack.artist && currentTrack.artist !== 'Unknown Artist') {
               const sameArtistSongs = allSongs.filter(s => 
                  s.artist === currentTrack.artist && s.id !== currentTrack.id && !queue.find(qs => qs.id === s.id)
               );
               if (sameArtistSongs.length > 0) {
                  nextSong = sameArtistSongs[Math.floor(Math.random() * sameArtistSongs.length)];
               }
            }
            
            if (!nextSong && allSongs.length > 0) {
               const unplayed = allSongs.filter(s => !queue.find(qs => qs.id === s.id));
               if (unplayed.length > 0) {
                 nextSong = unplayed[Math.floor(Math.random() * unplayed.length)];
               }
            }
            
            if (nextSong) {
               const newQueue = [...queue, nextSong];
               set({ queue: newQueue, currentTrack: nextSong, currentIndex: currentIndex + 1, isPlaying: true });
               return; 
            }
         } catch (e) {
            console.error("Auto-recommendation failed", e);
         }
         
         set({ isPlaying: false });
      } else {
         nextTrack();
      }
    }
  }
}));
