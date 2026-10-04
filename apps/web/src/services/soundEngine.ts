/**
 * Web Audio API synthesizer for ambient sounds (Rain, Ocean, Singing Bowl, Chimes)
 * Provides 100% self-contained, offline-ready peaceful audio for workout chimes & recovery.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private rainNode: AudioNode | null = null;
  private rainGain: GainNode | null = null;
  private oceanGain: GainNode | null = null;
  private bowlGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isPlayingAmbient = false;
  private activeSound: 'rain' | 'ocean' | 'bowl' | 'zen' = 'rain';

  private initContext() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Soft Tibetan singing bowl or meditation bell chime
  public playBell(frequency = 432) {
    if (typeof window === 'undefined') return;
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      const now = this.ctx.currentTime;
      // Fundamental + rich overtones
      const harmonics = [1, 2.01, 3.02, 4.04];
      const gains = [0.4, 0.2, 0.1, 0.05];

      harmonics.forEach((factor, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency * factor, now);

        gain.gain.setValueAtTime(gains[idx], now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 3.6);
      });
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  // Start continuous soothing ambient sound
  public startAmbient(sound: 'rain' | 'ocean' | 'bowl' | 'zen' = 'rain', volume = 0.4) {
    if (typeof window === 'undefined') return;
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      this.stopAmbient();
      this.activeSound = sound;
      this.isPlayingAmbient = true;

      if (sound === 'rain') {
        this.startRain(volume);
      } else if (sound === 'ocean') {
        this.startOcean(volume);
      } else if (sound === 'bowl' || sound === 'zen') {
        this.startSingingBowlDrone(volume);
      }
    } catch {
      // ignored
    }
  }

  private startRain(volume: number) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    // Pink noise generation
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Lowpass filter for gentle rain acoustics
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(volume * 0.6, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);

    whiteNoise.start();
    this.rainNode = whiteNoise;
  }

  private startOcean(volume: number) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.08;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);

    // LFO to modulate wave swell
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8 sec wave cycle

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(280, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    this.oceanGain = this.ctx.createGain();
    this.oceanGain.gain.setValueAtTime(volume * 0.7, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.oceanGain);
    this.oceanGain.connect(this.masterGain);

    whiteNoise.start();
    lfo.start();
    this.rainNode = whiteNoise;
  }

  private startSingingBowlDrone(volume: number) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const baseFreq = 216; // A3 harmonic
    const freqs = [baseFreq, baseFreq * 1.5, baseFreq * 2.01, baseFreq * 2.75];

    this.bowlGain = this.ctx.createGain();
    this.bowlGain.gain.setValueAtTime(0.001, now);
    this.bowlGain.gain.exponentialRampToValueAtTime(volume * 0.35, now + 2);
    this.bowlGain.connect(this.masterGain);

    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.bowlGain) return;
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Subtle frequency detune drift
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.2 + idx * 0.05, now);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(1.5, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      oscGain.gain.setValueAtTime(0.2 / (idx + 1), now);

      osc.connect(oscGain);
      oscGain.connect(this.bowlGain);

      osc.start();
      lfo.start();
    });
  }

  public stopAmbient() {
    if (this.rainNode) {
      try {
        (this.rainNode as AudioScheduledSourceNode).stop();
      } catch {
        // ignored
      }
      this.rainNode = null;
    }
    this.isPlayingAmbient = false;
  }

  public getIsPlaying(): boolean {
    return this.isPlayingAmbient;
  }

  public getActiveSound(): string {
    return this.activeSound;
  }
}

export const soundEngine = new SoundEngine();
