import * as mmb from 'music-metadata-browser';
import { Song } from './db';

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array) {
  let binary = '';
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export async function parseAudioFile(file: File): Promise<Omit<Song, 'id'>> {
  try {
    const metadata = await mmb.parseBlob(file);
    
    let coverArt: string | undefined = undefined;
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const picture = metadata.common.picture[0];
      const base64Data = arrayBufferToBase64(picture.data);
      coverArt = `data:${picture.format};base64,${base64Data}`;
    }

    return {
      title: metadata.common.title || file.name.replace(/\.[^/.]+$/, ''),
      artist: metadata.common.artist || 'Unknown Artist',
      album: metadata.common.album || 'Unknown Album',
      duration: metadata.format.duration,
      audioBlob: file,
      coverArt,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('Error parsing audio metadata:', error);
    // Fallback if parsing fails
    return {
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      audioBlob: file,
      createdAt: new Date(),
    };
  }
}
