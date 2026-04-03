export const getAudioFingerprint = async (audioBlob: Blob): Promise<{ fingerprint: string, duration: number } | null> => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Only decode the first 120 seconds to save memory
        const arrayBuffer = await audioBlob.slice(0, 5 * 1024 * 1024).arrayBuffer(); // First ~5MB
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Downsample to 11025Hz for chromaprint
        const offlineCtx = new OfflineAudioContext(1, audioBuffer.duration * 11025, 11025);
        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineCtx.destination);
        source.start(0);
        
        const resampledBuffer = await offlineCtx.startRendering();
        const pcmData = resampledBuffer.getChannelData(0);
        
        let chromaprint: any;
        try {
            // Bypass Webpack/Turbopack WASM build errors by importing safely
            const moduleUrl = 'https://esm.sh/chromaprint-wasm@latest';
            chromaprint = await import(/* webpackIgnore: true */ moduleUrl);
        } catch (e) {
            console.warn("Chromaprint WASM module not loaded. Using fallback.");
            return null;
        }

        // Standard WebAssembly chromaprint wrapper assumption
        // If the package requires manual initialization:
        let fp;
        if (typeof chromaprint.getFingerprint === 'function') {
             fp = await chromaprint.getFingerprint(pcmData, 11025);
        } else if (chromaprint.default && typeof chromaprint.default.getFingerprint === 'function') {
             fp = await chromaprint.default.getFingerprint(pcmData, 11025);
        }
        
        if (fp) {
             return { fingerprint: fp, duration: audioBuffer.duration };
        }
        
        return null; // Fallback
    } catch (error) {
        console.error("Fingerprinting failed:", error);
        return null;
    }
};

export const fetchMusicBrainzData = async (fingerprint: string, duration: number) => {
    try {
        const clientKey = '8XaBELgH'; // Generic test key
        const response = await fetch(`https://api.acoustid.org/v2/lookup?client=${clientKey}&meta=recordings+releasegroups+compress&duration=${Math.floor(duration)}&fingerprint=${fingerprint}`);
        
        if (!response.ok) return null;
        const data = await response.json();
        
        if (data.status === 'ok' && data.results && data.results.length > 0) {
            const result = data.results[0];
            if (result.recordings && result.recordings.length > 0) {
                const recording = result.recordings[0];
                const artist = recording.artists?.[0]?.name || 'Unknown Artist';
                const title = recording.title || 'Unknown Title';
                const release = recording.releasegroups?.[0];
                
                let coverArt = undefined;
                if (release && release.id) {
                    try {
                        const coverInfo = await fetch(`https://coverartarchive.org/release-group/${release.id}`);
                        if (coverInfo.ok) {
                            const coverData = await coverInfo.json();
                            coverArt = coverData.images?.[0]?.thumbnails?.['250'] || coverData.images?.[0]?.image;
                        }
                    } catch (e) {
                        console.warn("Could not fetch cover art");
                    }
                }
                return { title, artist, coverArt };
            }
        }
        return null;
    } catch (e) {
        console.error("MusicBrainz fetch failed:", e);
        return null;
    }
};
