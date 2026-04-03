import Dexie, { type EntityTable } from 'dexie';

export interface Song {
  id?: number;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  audioBlob: Blob;
  coverArt?: string; // base64 string
  createdAt: Date;
  isFavorite?: boolean;
  valence?: number;
  energy?: number;
}

export interface Playlist {
  id?: number;
  name: string;
  songIds: number[];
  createdAt: Date;
}

export interface Recording {
  id?: number;
  title: string;
  audioBlob: Blob;
  createdAt: Date;
  duration?: number;
}

export interface PlayHistory {
  id?: number;
  songId: number;
  playedAt: Date;
}

const db = new Dexie('BeheraDB') as Dexie & {
  songs: EntityTable<Song, 'id'>;
  playlists: EntityTable<Playlist, 'id'>;
  recordings: EntityTable<Recording, 'id'>;
  history: EntityTable<PlayHistory, 'id'>;
};

// Schema declaration
db.version(1).stores({
  songs: '++id, title, artist, album, createdAt'
});

db.version(2).stores({
  songs: '++id, title, artist, album, createdAt, isFavorite',
  playlists: '++id, name, createdAt'
}).upgrade(tx => {
  return tx.table('songs').toCollection().modify(song => {
    song.isFavorite = false;
  });
});

db.version(3).stores({
  songs: '++id, title, artist, album, createdAt, isFavorite',
  playlists: '++id, name, createdAt',
  recordings: '++id, title, createdAt'
});

db.version(5).stores({
  songs: '++id, title, artist, album, createdAt, isFavorite, valence, energy',
  playlists: '++id, name, createdAt',
  recordings: '++id, title, createdAt',
  history: '++id, songId, playedAt'
});

export { db };
