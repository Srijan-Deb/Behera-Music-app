"use client";

import * as Y from 'yjs';

// Lazily imported providers because they aggressively depend on `window` and `crypto` APIs
let WebrtcProvider: any;
let IndexeddbPersistence: any;

export const ydoc = new Y.Doc();

// Collaborative Data Structures
export const yFavorites = ydoc.getMap<boolean>('favorites');
export const yPlaylists = ydoc.getArray<any>('playlists');

export let webrtcProvider: any = null;
export let indexeddbProvider: any = null;

export const initializeOfflineStorage = async () => {
    if (typeof window === 'undefined' || indexeddbProvider) return;
    
    try {
        const yIndexedDbModule = await import('y-indexeddb');
        IndexeddbPersistence = yIndexedDbModule.IndexeddbPersistence;
        indexeddbProvider = new IndexeddbPersistence('behera-yjs', ydoc);
        return new Promise<void>((resolve) => {
            indexeddbProvider.on('synced', () => resolve());
        });
    } catch (e) {
        console.error("Yjs IndexedDB setup failed", e);
    }
};

export const connectToNetwork = async (roomName: string, onStatus?: (status: string) => void) => {
    if (typeof window === 'undefined') return;

    if (webrtcProvider) {
        webrtcProvider.disconnect();
        webrtcProvider.destroy();
    }
    
    try {
        if (!WebrtcProvider) {
            const yWebrtcModule = await import('y-webrtc');
            WebrtcProvider = yWebrtcModule.WebrtcProvider;
        }

        if (onStatus) onStatus('connecting');

        // Hash-based load balancing for signaling servers
        // If thousands of users connect, we split them across 5 potential signaling clouds
        const signalingBuckets = [
            ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com'],
            ['wss://y-webrtc-signaling-us.herokuapp.com', 'wss://signaling.yjs.dev'],
            ['wss://y-webrtc-signaling-eu.herokuapp.com', 'wss://y-webrtc-signaling-us.herokuapp.com'],
            ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-us.herokuapp.com'],
            ['wss://y-webrtc-signaling-us.herokuapp.com', 'wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com']
        ];
        
        let hash = 0;
        for (let i = 0; i < roomName.length; i++) {
            hash = roomName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const bucketIndex = Math.abs(hash) % signalingBuckets.length;
        const shardedSignalingServers = signalingBuckets[bucketIndex];

        webrtcProvider = new WebrtcProvider(roomName, ydoc, {
            // Distribute loads
            signaling: shardedSignalingServers
        });

        // The default awareness status checker
        webrtcProvider.on('synced', (state: any) => {
            if (state.synced && onStatus) onStatus('connected');
        });

        webrtcProvider.on('peers', (obj: any) => {
            if (onStatus) {
                const count = obj.webrtcPeers.length;
                onStatus(count > 0 ? `connected (${count} peers)` : 'waiting for peers');
            }
        });
        
    } catch (e) {
        console.error("Y-WebRTC Connection Failed:", e);
        if (onStatus) onStatus('error');
    }
};

export const disconnectNetwork = () => {
    if (webrtcProvider) {
        webrtcProvider.disconnect();
    }
};
