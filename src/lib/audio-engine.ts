// src/lib/audio-engine.ts

const createReverb = (context: AudioContext, decay: number) => {
  const length = context.sampleRate * decay;
  const buffer = context.createBuffer(2, length, context.sampleRate);
  
  for (let c = 0; c < 2; c++) {
    const channelData = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) {
        // basic white noise multiplied by exponential decay simulates acoustic room reflections randomly bouncing
        channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (context.sampleRate * (decay / 5)));
    }
  }
  return buffer;
};

export const audioEngine = {
  audioContext: null as AudioContext | null,
  analyserNode: null as AnalyserNode | null,
  bands: [] as BiquadFilterNode[],
  sourceNode: null as MediaElementAudioSourceNode | null,
  pannerNode: null as PannerNode | null,
  convolverNode: null as ConvolverNode | null,
  dryGainNode: null as GainNode | null,
  wetGainNode: null as GainNode | null,
  
  initialized: false,
  
  // environments cache
  irBuffers: {} as Record<string, AudioBuffer>,

  initialize(audioElement: HTMLAudioElement) {
    if (this.initialized || !audioElement) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass();
    
    this.sourceNode = this.audioContext.createMediaElementSource(audioElement);
    this.analyserNode = this.audioContext.createAnalyser();
    
    this.analyserNode.fftSize = 2048; 
    this.analyserNode.smoothingTimeConstant = 0.85;

    // 1. Create EQ
    const frequencies = [60, 230, 910, 3600, 14000];
    this.bands = frequencies.map(freq => {
       const filter = this.audioContext!.createBiquadFilter();
       filter.type = 'peaking';
       filter.frequency.value = freq;
       filter.Q.value = 1;
       filter.gain.value = 0; 
       return filter;
    });

    // 2. Create Spatial Panner Node
    this.pannerNode = this.audioContext.createPanner();
    this.pannerNode.panningModel = 'HRTF'; // Head-related transfer function for real 3D Audio
    this.pannerNode.distanceModel = 'inverse';
    this.pannerNode.refDistance = 1;
    this.pannerNode.maxDistance = 10000;
    this.pannerNode.rolloffFactor = 1;
    // Set Listener at origin
    this.audioContext.listener.positionX.value = 0;
    this.audioContext.listener.positionY.value = 0;
    this.audioContext.listener.positionZ.value = 0;
    
    // Audio origin resting centrally
    this.pannerNode.positionX.value = 0;
    this.pannerNode.positionY.value = 0;
    this.pannerNode.positionZ.value = -1; // slightly in front

    // 3. Create Concert Hall (Convolver) setup for Reverb
    this.convolverNode = this.audioContext.createConvolver();
    this.dryGainNode = this.audioContext.createGain();
    this.wetGainNode = this.audioContext.createGain();
    
    this.dryGainNode.gain.value = 1; // Default pure sound
    this.wetGainNode.gain.value = 0; // Default no reverb

    // Synthesize Environment Reverbs
    this.irBuffers['club'] = createReverb(this.audioContext, 1.5);
    this.irBuffers['cathedral'] = createReverb(this.audioContext, 4.0);
    this.irBuffers['stadium'] = createReverb(this.audioContext, 8.0);
    
    // Graph Connection: Source -> EQ Bands -> Panner -> (Dry & Wet Split) -> Analyser -> Destination
    let currentNode: AudioNode = this.sourceNode;
    for (const band of this.bands) {
       currentNode.connect(band);
       currentNode = band;
    }
    currentNode.connect(this.pannerNode);
    
    // Split path into Reverb routing
    this.pannerNode.connect(this.dryGainNode);
    this.pannerNode.connect(this.convolverNode);
    this.convolverNode.connect(this.wetGainNode);
    
    // Merge back into Analyser
    this.dryGainNode.connect(this.analyserNode);
    this.wetGainNode.connect(this.analyserNode);

    // Final Output processing
    this.analyserNode.connect(this.audioContext.destination);
    
    this.initialized = true;
  },

  resume() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  },
  
  setEqBand(index: number, value: number) {
     if (this.bands[index]) {
        this.bands[index].gain.value = value;
     }
  },

  setSpatialPosition(x: number, y: number, z: number) {
    if (this.pannerNode) {
       // Smooth transitions utilizing setTargetAtTime
       this.pannerNode.positionX.setTargetAtTime(x, this.audioContext!.currentTime, 0.1);
       this.pannerNode.positionY.setTargetAtTime(y, this.audioContext!.currentTime, 0.1);
       this.pannerNode.positionZ.setTargetAtTime(z, this.audioContext!.currentTime, 0.1);
    }
  },

  setReverbMode(mode: 'off' | 'club' | 'cathedral' | 'stadium') {
    if (!this.convolverNode || !this.dryGainNode || !this.wetGainNode) return;

    if (mode === 'off') {
       this.dryGainNode.gain.value = 1;
       this.wetGainNode.gain.value = 0;
    } else {
       if (this.irBuffers[mode]) {
          this.convolverNode.buffer = this.irBuffers[mode];
          // Balanced wet/dry mix for spatial immersion
          this.dryGainNode.gain.value = 0.6;
          this.wetGainNode.gain.value = 0.8;
       }
    }
  }
};
