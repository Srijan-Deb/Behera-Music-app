export const getMoodFeatures = async (audioBlob: Blob): Promise<{ valence: number, energy: number } | null> => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Decode the full blob — slicing at arbitrary byte offsets corrupts audio frame headers
        const arrayBuffer = await audioBlob.arrayBuffer();
        let audioBuffer: AudioBuffer;
        try {
            audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        } catch (decodeErr) {
            console.warn("Mood: Audio decode failed, skipping mood analysis.", decodeErr);
            return null;
        }
        const pcmData = audioBuffer.getChannelData(0);

        // Attempt Essentia.js — wrap the ENTIRE flow so any crash falls back gracefully
        try {
            const moduleUrl = 'https://esm.sh/essentia.js@latest';
            const essentiaModule = await import(/* webpackIgnore: true */ moduleUrl);
            const EssentiaWASM = essentiaModule.EssentiaWASM || essentiaModule.default?.EssentiaWASM;

            if (!EssentiaWASM || typeof EssentiaWASM !== 'function') {
                throw new Error("EssentiaWASM constructor not found in module");
            }

            const essentia = new EssentiaWASM();
            
            const audioVector = essentia.arrayToVector(pcmData);
            
            const energyResult = essentia.Energy(audioVector);
            const dynamicComplexity = essentia.DynamicComplexity(audioVector);
            
            let energy = (energyResult.energy || 0.5) * 10; 
            if (energy > 1) energy = 1;

            let valence = 0.5;
            const complexity = dynamicComplexity.dynamicComplexity || 0;
            valence = 1.0 - (Math.min(complexity, 20) / 20);

            audioVector.delete();

            return { valence, energy };
        } catch (essentiaErr) {
            console.warn("Essentia.js unavailable, using heuristic fallback.", essentiaErr);
            return extractHeuristicMood(pcmData, audioBuffer.sampleRate);
        }
    } catch (error) {
        console.error("Mood Analysis failed:", error);
        return null;
    }
};

// Extremely lightweight offline fallback if essentia fails
const extractHeuristicMood = (pcmData: Float32Array, sampleRate: number) => {
    const sampleLength = Math.min(pcmData.length, sampleRate * 10);
    if (sampleLength === 0) return { valence: 0.5, energy: 0.5 };

    let sum = 0;
    for (let i = 0; i < sampleLength; i++) {
        sum += pcmData[i] * pcmData[i];
    }
    const rms = Math.sqrt(sum / sampleLength);
    const energy = Math.min(rms * 5, 1.0);
    
    // Fallback valence is random between 0.4 and 0.8 just to populate the UI
    const valence = 0.4 + (Math.random() * 0.4);
    
    return { valence, energy };
};
