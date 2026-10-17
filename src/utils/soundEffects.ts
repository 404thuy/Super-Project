// Web Audio API Synthesizer for tactile micro-interaction sound effects & procedural background music
// 100% offline, zero external asset dependencies, zero CORS issues, low latency

export const MUSIC_PRESETS = [
  {
    id: 'romantic-piano',
    name: 'Piano Lãng Mạn Tháng 10',
    desc: 'Giai điệu piano du dương, ấm áp và ngọt ngào',
    icon: '🎹',
    type: 'procedural' as const,
  },
  {
    id: 'music-box',
    name: 'Hộp Nhạc Kỷ Niệm',
    desc: 'Âm thanh hộp nhạc cổ điển trong trẻo, hoài niệm',
    icon: '🔔',
    type: 'procedural' as const,
  },
  {
    id: 'cosmic-ambient',
    name: 'Giai Điệu Ngân Hà 3D',
    desc: 'Không gian vũ trụ sâu lắng, êm dịu huyền ảo',
    icon: '✨',
    type: 'procedural' as const,
  },
  {
    id: 'spring-acoustic',
    name: 'Khúc Giao Mùa Dịu Dàng',
    desc: 'Hợp âm acoustic tươi sáng, ngập tràn sức sống 20/10',
    icon: '🌸',
    type: 'procedural' as const,
  },
  {
    id: 'custom-mp3',
    name: 'Tự Dán Link Nhạc MP3',
    desc: 'Sử dụng bài hát yêu thích từ đường dẫn online của bạn',
    icon: '🔗',
    type: 'url' as const,
  },
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private analyserDataArray: Uint8Array | null = null;

  // Background music scheduling
  private musicTimer: number | null = null;
  private activeCustomAudio: HTMLAudioElement | null = null;
  private currentMusicPreset: string | null = null;
  private isMusicPlaying: boolean = false;

  private getContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        // Master gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);

        // Music subgain
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);

        // Analyser for real-time equalizer
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyserDataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.musicGain.connect(this.analyser);

        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    const ctx = this.getContext();
    if (ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 1, ctx.currentTime);
    }
    if (this.activeCustomAudio) {
      this.activeCustomAudio.muted = muted;
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // ----------------------------------------------------
  // Tactile Micro-Interaction Sound Effects
  // ----------------------------------------------------

  // Soft keyboard/PIN click
  public playPinClick() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + Math.random() * 200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }

  // Wax seal break sound
  public playWaxSealBreak() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;
    try {
      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start();
    } catch {}
  }

  // Paper swoosh / envelope unfold
  public playPaperSwoosh() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;
    try {
      const bufferSize = ctx.sampleRate * 0.3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI) * 0.1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(1400, ctx.currentTime + 0.15);
      filter.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.3);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start();
    } catch {}
  }

  // Triumphant magical fanfare/chime
  public playSuccessChime() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const startTime = ctx.currentTime + idx * 0.08;
        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.8);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(startTime);
        osc.stop(startTime + 0.85);
      });
    } catch {}
  }

  // Sweet romantic pop sound when hearting a template
  public playHeartPop() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch {}
  }

  // Scratch friction texture sound
  public playScratchFriction() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350 + Math.random() * 200, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  }

  // Vinyl needle drop crackle
  public playVinylNeedleDrop() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }

  // Shooting star celestial twinkle
  public playShootingStar() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2800, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }

  // Play music preset alias for background music
  public playMusicPreset(presetId: string) {
    this.startBackgroundMusic(presetId);
  }

  // ----------------------------------------------------
  // Procedural Background Music Synthesizer Engine
  // ----------------------------------------------------

  public startBackgroundMusic(presetId?: string, customUrl?: string) {
    this.stopBackgroundMusic();
    const ctx = this.getContext();
    if (!ctx || !this.musicGain) return;

    const selected = presetId || (customUrl ? 'custom-mp3' : 'romantic-piano');
    this.currentMusicPreset = selected;
    this.isMusicPlaying = true;

    if (selected === 'custom-mp3' && customUrl) {
      try {
        const audio = new Audio(customUrl);
        audio.loop = true;
        audio.crossOrigin = 'anonymous';
        audio.muted = this.isMuted;
        audio.play().catch(() => {});
        this.activeCustomAudio = audio;
      } catch (err) {
        console.warn('Could not play custom audio:', err);
      }
      return;
    }

    // Procedural loops based on presetId
    let step = 0;
    const bpm = selected === 'music-box' ? 76 : selected === 'cosmic-ambient' ? 52 : 72;
    const stepDuration = 60 / bpm / 2; // eighth notes

    // Musical scales & patterns
    // Romantic piano: C major / A minor lyrical arpeggios
    const pianoPatterns = [
      [261.63, 329.63, 392.0, 523.25], // C4, E4, G4, C5
      [220.0, 261.63, 329.63, 440.0],  // A3, C4, E4, A4
      [174.61, 220.0, 261.63, 349.23], // F3, A3, C4, F4
      [196.0, 246.94, 293.66, 392.0],  // G3, B3, D4, G4
    ];

    // Music box: High bell-like twinkle tones
    const musicBoxMelody = [
      659.25, 783.99, 987.77, 1046.5, 987.77, 783.99, 659.25, 587.33,
      523.25, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33, 523.25,
    ];

    // Cosmic ambient: Slow ethereal pad chords
    const cosmicChords = [
      [130.81, 196.0, 246.94, 329.63], // C3, G3, B3, E4
      [110.0, 164.81, 220.0, 261.63],  // A2, E3, A3, C4
      [87.31, 130.81, 174.61, 220.0],   // F2, C3, F3, A3
      [98.0, 146.83, 196.0, 246.94],   // G2, D3, G3, B3
    ];

    // Spring acoustic: warm acoustic guitar chords
    const acousticChords = [
      [146.83, 220.0, 293.66, 369.99], // D3, A3, D4, F#4
      [196.0, 246.94, 293.66, 392.0],  // G3, B3, D4, G4
      [110.0, 164.81, 220.0, 277.18],  // A2, E3, A3, C#4
      [123.47, 185.0, 246.94, 293.66], // B2, F#3, B3, D4
    ];

    const playNextProceduralBeat = () => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicGain) return;
      const now = this.ctx.currentTime;

      if (selected === 'romantic-piano') {
        const chordIndex = Math.floor(step / 8) % pianoPatterns.length;
        const noteIndex = step % 4;
        const chord = pianoPatterns[chordIndex];
        const freq = chord[noteIndex];

        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const noteGain = this.ctx.createGain();

        osc.type = noteIndex === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.frequency.exponentialRampToValueAtTime(500, now + 1.2);

        noteGain.gain.setValueAtTime(noteIndex === 0 ? 0.22 : 0.14, now);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + 1.45);
      } else if (selected === 'music-box') {
        const freq = musicBoxMelody[step % musicBoxMelody.length];
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        noteGain.gain.setValueAtTime(0.18, now);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

        osc.connect(noteGain);
        noteGain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + 0.95);
      } else if (selected === 'cosmic-ambient') {
        // Slow wash every 8 steps
        if (step % 8 === 0) {
          const chordIndex = Math.floor(step / 8) % cosmicChords.length;
          const chord = cosmicChords[chordIndex];
          chord.forEach((freq) => {
            const osc = this.ctx!.createOscillator();
            const filter = this.ctx!.createBiquadFilter();
            const padGain = this.ctx!.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400, now);
            filter.frequency.linearRampToValueAtTime(850, now + 2.0);
            filter.frequency.linearRampToValueAtTime(350, now + 4.0);

            padGain.gain.setValueAtTime(0.0001, now);
            padGain.gain.linearRampToValueAtTime(0.045, now + 1.2);
            padGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);

            osc.connect(filter);
            filter.connect(padGain);
            padGain.connect(this.musicGain!);

            osc.start(now);
            osc.stop(now + 4.3);
          });
        }
      } else {
        // spring-acoustic
        const chordIndex = Math.floor(step / 6) % acousticChords.length;
        const noteIndex = step % 4;
        const chord = acousticChords[chordIndex];
        const freq = chord[noteIndex];

        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const noteGain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, now);
        filter.frequency.exponentialRampToValueAtTime(700, now + 0.8);

        noteGain.gain.setValueAtTime(0.16, now);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + 0.9);
      }

      step++;
      this.musicTimer = window.setTimeout(playNextProceduralBeat, stepDuration * 1000);
    };

    playNextProceduralBeat();
  }

  public stopBackgroundMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.activeCustomAudio) {
      this.activeCustomAudio.pause();
      this.activeCustomAudio = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isMusicPlaying;
  }

  public getCurrentPreset(): string | null {
    return this.currentMusicPreset;
  }

  // Real-time frequency data for equalizers
  public getAnalyserData(): Uint8Array {
    if (this.analyser && this.analyserDataArray) {
      this.analyser.getByteFrequencyData(this.analyserDataArray as unknown as Uint8Array<ArrayBuffer>);
      return this.analyserDataArray;
    }
    return new Uint8Array(16);
  }
}

export const soundFx = new SoundEngine();
