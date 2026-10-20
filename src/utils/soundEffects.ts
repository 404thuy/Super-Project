import {
  VIETNAMESE_MUSIC_LIBRARY,
  getSongById,
  type SongItem,
} from '../data/vietnameseMusic';
import { SONG_SCORES } from './songTracks';

export const MUSIC_PRESETS = [
  ...VIETNAMESE_MUSIC_LIBRARY.map((s) => ({
    id: s.id,
    name: `${s.title} - ${s.artist}`,
    desc: `Điệp khúc: "${s.chorusLyric.slice(0, 42)}..."`,
    icon: s.icon,
    type: 'url' as const,
    category: s.category,
  })),
  {
    id: 'custom-mp3',
    name: 'Tự Dán Link Nhạc MP3',
    desc: 'Sử dụng bài hát yêu thích từ đường dẫn online của bạn',
    icon: '🔗',
    type: 'url' as const,
  },
];

const PRESET_AUDIO_MAP: Record<string, string> = {
  'romantic-piano': '/music/ban-tinh-ca-dau-tien.mp3',
  'music-box': '/music/nhat-ky-cua-me.mp3',
  'spring-acoustic': '/music/spring-acoustic.mp3',
  'cosmic-ambient': '/music/cosmic-ambient.mp3',
  'pop-acoustic': '/music/ngay-dau-tien.mp3',
  'lofi-chill': '/music/giac-mo-tinh-co.mp3',
  'vintage-vinyl': '/music/mot-nha.mp3',
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false; // Music mute state
  public isSfxMuted: boolean = false; // SFX mute state (hoàn toàn độc lập với nhạc nền)
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private analyserDataArray: Uint8Array | null = null;
  private pendingAutoplayAudio: HTMLAudioElement | null = null;
  private unlockListenersAttached: boolean = false;

  // Background music scheduling
  private musicTimer: number | null = null;
  private activeCustomAudio: HTMLAudioElement | null = null;
  private activeAudioUrl: string | null = null;
  private activeRangeStart: number = 0;
  private activeRangeEnd: number | null = null;
  private playPromise: Promise<void> | null = null;
  private ytIframe: HTMLIFrameElement | null = null;
  private currentMusicPreset: string | null = null;
  private isMusicPlaying: boolean = false;
  private playbackSessionId: number = 0;
  private streamCache: Map<string, string> = new Map();
  private audioPool: Map<string, HTMLAudioElement> = new Map();
  private onlineSongMetadata: Map<string, { title: string; artist: string }> = new Map();

  public registerSongMetadata(idOrUrl: string, title: string, artist: string) {
    if (idOrUrl) {
      this.onlineSongMetadata.set(idOrUrl, { title, artist });
    }
  }

  public getSongMetadata(idOrUrl: string): { title: string; artist: string } | undefined {
    return this.onlineSongMetadata.get(idOrUrl);
  }

  constructor() {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.preloadAllMusic();
        this.setupGlobalUnlock();
      }, 50);
    }
  }

  // Tự động mở khóa âm thanh ngay lần chạm đầu tiên của người dùng
  public setupGlobalUnlock() {
    if (typeof window === 'undefined' || this.unlockListenersAttached) return;
    this.unlockListenersAttached = true;

    const unlock = () => {
      // 1. Khởi tạo và resume AudioContext ngay trong user gesture
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      } else if (!this.ctx) {
        this.getContext();
      }

      // 2. Mở khóa và tự động phát bài hát nếu trước đó bị browser chặn autoplay
      if (this.pendingAutoplayAudio && this.isMusicPlaying) {
        const audio = this.pendingAutoplayAudio;
        this.pendingAutoplayAudio = null;
        audio.play().catch(() => {});
      } else if (this.activeCustomAudio && this.isMusicPlaying && this.activeCustomAudio.paused) {
        this.activeCustomAudio.play().catch(() => {});
      }
    };

    ['pointerdown', 'touchstart', 'touchend', 'mousedown', 'keydown', 'click'].forEach((evt) => {
      window.addEventListener(evt, unlock, { capture: true, passive: true });
    });
  }

  public resumeAudioContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private getContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        // Master gain: LUÔN CỐ ĐỊNH = 1.0 kết nối ra loa, không bao giờ ngắt masterGain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // SFX Subgain: Nối vào masterGain, điều khiển riêng tiếng click, nút bấm, chime...
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.isSfxMuted ? 0 : 1.0, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        // Music Subgain: Nối vào masterGain, điều khiển riêng nhạc nền
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(this.isMuted ? 0 : 0.45, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);

        // Analyser for real-time equalizer
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyserDataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.musicGain.connect(this.analyser);
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
    if (ctx && this.musicGain) {
      this.musicGain.gain.setValueAtTime(muted ? 0 : 0.45, ctx.currentTime);
    }
    if (this.activeCustomAudio) {
      this.activeCustomAudio.muted = muted;
    }
    if (this.ytIframe && this.ytIframe.contentWindow) {
      try {
        const cmd = muted ? 'mute' : 'unMute';
        this.ytIframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: cmd }), '*');
      } catch {}
    }
  }

  public setSfxMuted(muted: boolean) {
    this.isSfxMuted = muted;
    const ctx = this.getContext();
    if (ctx && this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(muted ? 0 : 1.0, ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    if (!this.isMuted) {
      if (this.pendingAutoplayAudio) {
        const audio = this.pendingAutoplayAudio;
        this.pendingAutoplayAudio = null;
        audio.play().catch(() => {});
      } else if (this.activeCustomAudio && this.activeCustomAudio.paused && this.isMusicPlaying) {
        this.activeCustomAudio.play().catch(() => {});
      }
    }
    return this.isMuted;
  }

  // ----------------------------------------------------
  // Tactile Micro-Interaction Sound Effects
  // ----------------------------------------------------

  // Soft keyboard/PIN click
  public playPinClick() {
    if (this.isSfxMuted) return;
    const ctx = this.getContext();
    const destGain = this.sfxGain || this.masterGain;
    if (!ctx || !destGain) return;
    try {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + Math.random() * 200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(destGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }

  // Mechanical music box winding ratchet sound
  public playMusicBoxWinding() {
    if (this.isSfxMuted) return;
    const ctx = this.getContext();
    const destGain = this.sfxGain || this.masterGain;
    if (!ctx || !destGain) return;
    try {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const now = ctx.currentTime;
      [0, 0.055, 0.115].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1600 + idx * 180, now + offset);
        osc.frequency.exponentialRampToValueAtTime(420, now + offset + 0.045);

        gain.gain.setValueAtTime(0.24, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.045);

        osc.connect(gain);
        gain.connect(destGain);
        osc.start(now + offset);
        osc.stop(now + offset + 0.05);
      });
    } catch {}
  }

  // Wax seal break sound
  public playWaxSealBreak() {
    if (this.isSfxMuted) return;
    const ctx = this.getContext();
    const destGain = this.sfxGain || this.masterGain;
    if (!ctx || !destGain) return;
    try {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
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
      gain.connect(destGain);
      noise.start();
    } catch {}
  }

  // Paper swoosh / envelope unfold
  public playPaperSwoosh() {
    if (this.isSfxMuted) return;
    const ctx = this.getContext();
    const destGain = this.sfxGain || this.masterGain;
    if (!ctx || !destGain) return;
    try {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
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
      gain.connect(destGain);
      noise.start();
    } catch {}
  }

  // Triumphant magical fanfare/chime
  public playSuccessChime() {
    if (this.isSfxMuted) return;
    const ctx = this.getContext();
    const destGain = this.sfxGain || this.masterGain;
    if (!ctx || !destGain) return;
    try {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const startTime = ctx.currentTime + idx * 0.08;
        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.8);

        osc.connect(gain);
        gain.connect(destGain);
        osc.start(startTime);
        osc.stop(startTime + 0.85);
      });
    } catch {}
  }

  // Sweet romantic pop sound when hearting a template
  public playHeartPop() {
    if (this.isSfxMuted) return;
    const ctx = this.getContext();
    const destGain = this.sfxGain || this.masterGain;
    if (!ctx || !destGain) return;
    try {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(destGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch {}
  }

  // Scratch friction texture sound
  public playScratchFriction() {
    if (this.isSfxMuted) return;
    const ctx = this.getContext();
    const destGain = this.sfxGain || this.masterGain;
    if (!ctx || !destGain) return;
    try {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350 + Math.random() * 200, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(destGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  }

  // Vinyl needle drop crackle
  public playVinylNeedleDrop() {
    if (this.isSfxMuted) return;
    const ctx = this.getContext();
    const destGain = this.sfxGain || this.masterGain;
    if (!ctx || !destGain) return;
    try {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(destGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }

  // Shooting star celestial twinkle
  public playShootingStar() {
    if (this.isSfxMuted) return;
    const ctx = this.getContext();
    const destGain = this.sfxGain || this.masterGain;
    if (!ctx || !destGain) return;
    try {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2800, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(destGain);
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

  // Lấy stream audio có lời ca sĩ trực tiếp tốc độ cực nhanh (0ms delay)
  public async fetchInstantAudioStream(title: string, artist: string): Promise<string | null> {
    const query = `${title} ${artist}`.toLowerCase().trim();
    if (this.streamCache.has(query)) {
      return this.streamCache.get(query)!;
    }

    try {
      // 1. Thử qua backend proxy
      const apiRes = await fetch(`/api/music-preview?term=${encodeURIComponent(query)}`);
      const apiData = await apiRes.json();
      if (apiData.success && apiData.previewUrl) {
        this.streamCache.set(query, apiData.previewUrl);
        return apiData.previewUrl;
      }
    } catch {}

    try {
      // 2. Dự phòng trực tiếp Apple iTunes Search API (Hỗ trợ CORS mở toàn cầu)
      const directRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&country=VN&media=music&limit=1`);
      const directData = await directRes.json();
      if (directData.results && directData.results.length > 0 && directData.results[0].previewUrl) {
        const previewUrl = directData.results[0].previewUrl;
        this.streamCache.set(query, previewUrl);
        return previewUrl;
      }
    } catch {}

    return null;
  }

  // Tải trước nhẹ nhàng (không spam nạp 47 file cùng lúc tránh tràn bộ nhớ và MediaCodec trên di động)
  public preloadAllMusic() {
    // Để tối ưu trải nghiệm trên điện thoại di động (iOS Safari & Android Chrome),
    // việc stream file âm thanh diễn ra tức thì khi người dùng bấm chọn hoặc phát thử.
  }

  private getOrCreateCustomAudio(): HTMLAudioElement {
    if (!this.activeCustomAudio) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.autoplay = false;
      // Thuộc tính quan trọng cho iOS Safari & Android Web
      (audio as any).playsInline = true;
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      audio.volume = 0.85;
      audio.muted = this.isMuted;
      this.activeCustomAudio = audio;
    }
    return this.activeCustomAudio;
  }

  public playNativeAudio(url: string, startSeconds: number = 0, endSeconds?: number) {
    try {
      const cleanStart = Math.max(0, startSeconds);
      const cleanEnd = endSeconds && endSeconds > cleanStart ? endSeconds : null;
      this.activeRangeStart = cleanStart;
      this.activeRangeEnd = cleanEnd;

      const audio = this.getOrCreateCustomAudio();
      audio.muted = this.isMuted;
      audio.volume = 0.85;

      // 1. Nếu đang phát đúng URL này rồi, chỉ cần seek mượt mà không reload hay pause
      if (this.activeAudioUrl === url && audio.src) {
        this.attachLoopHandler(audio);

        const doSeek = () => {
          try {
            audio.currentTime = cleanStart;
          } catch {}
        };
        if (audio.readyState >= 1) {
          doSeek();
        } else {
          audio.addEventListener('loadedmetadata', doSeek, { once: true });
          audio.addEventListener('canplay', doSeek, { once: true });
        }

        if (audio.paused) {
          const p = audio.play();
          if (p !== undefined) {
            this.playPromise = p;
            p.then(() => {
              this.pendingAutoplayAudio = null;
            }).catch((err) => {
              if (err.name === 'NotAllowedError') {
                this.pendingAutoplayAudio = audio;
              } else if (err.name !== 'AbortError') {
                console.warn('Native audio playback error:', err);
              }
            });
          }
        }
        return;
      }

      // 2. Chuyển sang bài khác: reset nguồn phát an toàn
      audio.ontimeupdate = null;
      audio.onended = null;
      try {
        audio.pause();
      } catch {}

      this.activeAudioUrl = url;
      audio.onerror = (e) => {
        console.warn('Native audio load error for URL:', url);
        if (this.activeAudioUrl === url) {
          this.activeAudioUrl = null;
        }
      };
      audio.src = url;
      audio.load();
      this.attachLoopHandler(audio);

      let hasSeeked = false;
      const setStartTime = () => {
        if (!hasSeeked && cleanStart > 0) {
          hasSeeked = true;
          try {
            audio.currentTime = cleanStart;
          } catch (err) {
            console.warn('Set startTime error:', err);
          }
        }
      };

      if (audio.readyState >= 1) {
        setStartTime();
      } else {
        audio.addEventListener('loadedmetadata', setStartTime, { once: true });
        audio.addEventListener('canplay', setStartTime, { once: true });
      }

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        this.playPromise = playPromise;
        playPromise.then(() => {
          this.pendingAutoplayAudio = null;
          // Đồng bộ lại thời gian bắt đầu sau khi stream đã sẵn sàng
          if (cleanStart > 0 && Math.abs(audio.currentTime - cleanStart) > 1.0) {
            try {
              audio.currentTime = cleanStart;
            } catch {}
          }
        }).catch((err) => {
          if (err.name === 'NotAllowedError') {
            // Trình duyệt di động chặn autoplay khi chưa chạm: lưu lại để chạm lần đầu là phát ngay
            this.pendingAutoplayAudio = audio;
          } else if (err.name !== 'AbortError') {
            console.warn('Native audio playback error:', err);
          }
        });
      }
    } catch (err) {
      console.warn('Could not initialize native audio:', err);
    }
  }

  // Vòng lặp chính xác trong khoảng [activeRangeStart, activeRangeEnd]
  // Khi activeRangeEnd là null (phát toàn bộ bài), dùng onended để vòng lại từ mốc bắt đầu
  private attachLoopHandler(audio: HTMLAudioElement) {
    const start = this.activeRangeStart;
    const end = this.activeRangeEnd;

    if (end && end > start) {
      // Có mốc kết thúc tùy chỉnh: loop trong đoạn [start, end] qua ontimeupdate
      audio.ontimeupdate = () => {
        if (audio.currentTime >= end) {
          audio.currentTime = this.activeRangeStart;
        }
      };
      // onended fallback: nếu bài kết thúc tự nhiên (duration không chính xác) thì loop về start
      audio.onended = () => {
        if (this.isMusicPlaying) {
          try {
            audio.currentTime = this.activeRangeStart;
            audio.play().catch(() => {});
          } catch {}
        }
      };
    } else {
      // Phát toàn bộ bài: dùng onended để loop về mốc bắt đầu thay vì dùng audio.loop
      // (audio.loop luôn loop về giây 0, không về mốc custom start)
      audio.ontimeupdate = null;
      audio.onended = () => {
        if (this.isMusicPlaying) {
          try {
            audio.currentTime = this.activeRangeStart;
            audio.play().catch(() => {});
          } catch {}
        }
      };
    }
  }

  // Seek tức thì đoạn phát mà không reload hay dừng audio
  public seekPlayback(startSeconds: number, endSeconds?: number, jumpToStart: boolean = true) {
    const cleanStart = Math.max(0, startSeconds);
    const cleanEnd = endSeconds && endSeconds > cleanStart ? endSeconds : null;
    this.activeRangeStart = cleanStart;
    this.activeRangeEnd = cleanEnd;

    if (this.ytIframe && this.isMusicPlaying) {
      if (jumpToStart) {
        try {
          this.ytIframe.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func: 'seekTo', args: [cleanStart, true] }),
            '*'
          );
        } catch (e) {
          console.warn('YouTube seek error:', e);
        }
      }
      return;
    }

    if (this.activeCustomAudio) {
      const audio = this.activeCustomAudio;
      // Cập nhật loop handler với range mới trước
      this.attachLoopHandler(audio);

      if (jumpToStart) {
        const doSeek = () => {
          try {
            audio.currentTime = cleanStart;
          } catch (err) {
            console.warn('seekPlayback audio.currentTime error:', err);
          }
        };

        if (audio.readyState >= 1) {
          doSeek();
        } else {
          audio.addEventListener('loadedmetadata', doSeek, { once: true });
          audio.addEventListener('canplay', doSeek, { once: true });
        }
      } else {
        // Nếu không jumpToStart (chỉ đổi mốc kết thúc), nhưng vị trí hiện tại đã vượt quá mốc kết thúc mới
        if (cleanEnd && audio.currentTime >= cleanEnd) {
          try {
            audio.currentTime = cleanStart;
          } catch {}
        }
      }

      // Phát lại nếu đang bị tạm dừng và isMusicPlaying = true
      if (audio.paused && this.isMusicPlaying) {
        const p = audio.play();
        if (p !== undefined) {
          p.catch((err) => {
            if (err.name !== 'AbortError') console.warn(err);
          });
        }
      }
    }
  }

  public playYouTube(youtubeId: string, startSeconds: number = 0) {
    this.stopBackgroundMusic();
    this.isMusicPlaying = true;

    let iframe = document.getElementById('lovecard-global-audio-yt') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'lovecard-global-audio-yt';
      iframe.style.position = 'fixed';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.left = '-9999px';
      iframe.style.bottom = '0';
      iframe.style.opacity = '0.001';
      iframe.style.pointerEvents = 'none';
      iframe.setAttribute('allow', 'autoplay; encrypted-media');
      document.body.appendChild(iframe);
    }
    this.ytIframe = iframe;
    const startParam = startSeconds > 0 ? `&start=${Math.floor(startSeconds)}` : '';
    iframe.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&loop=1&playlist=${youtubeId}&controls=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}${startParam}`;
  }

  public stopYouTube() {
    const iframe = document.getElementById('lovecard-global-audio-yt') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = 'about:blank';
    }
    this.ytIframe = null;
  }

  public async startBackgroundMusic(
    presetId?: string,
    customUrl?: string,
    startSeconds?: number,
    endSeconds?: number
  ) {
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const selected = presetId || (customUrl ? 'custom-mp3' : 'anh-nang-cua-anh');
    const song = getSongById(selected);
    // Mặc định luôn là giây 0 — song.startSeconds chỉ dùng khi user chủ động chọn nút "Điệp khúc"
    const effectiveStartSeconds =
      startSeconds !== undefined && startSeconds !== null
        ? startSeconds
        : 0;

    const localPresetUrl = PRESET_AUDIO_MAP[selected];
    const targetUrl = customUrl || song?.audioUrl || localPresetUrl;

    // Nếu đang phát đúng bài này và URL khớp, không stop và reload lại! Chỉ seek và cập nhật khoảng phát
    if (
      this.isMusicPlaying &&
      this.currentMusicPreset === selected &&
      targetUrl &&
      this.activeAudioUrl === targetUrl &&
      this.activeCustomAudio
    ) {
      this.seekPlayback(effectiveStartSeconds, endSeconds, true);
      return;
    }

    this.stopBackgroundMusic();
    const sessionId = ++this.playbackSessionId;
    this.currentMusicPreset = selected;
    this.isMusicPlaying = true;

    // 1. Nếu người dùng tự tải file MP3 từ máy hoặc có link custom/online
    if (customUrl) {
      const ytMatch = customUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (ytMatch && ytMatch[1]) {
        if (this.playbackSessionId !== sessionId || !this.isMusicPlaying) return;
        this.playYouTube(ytMatch[1], effectiveStartSeconds);
        return;
      }

      // Phát trực tiếp toàn bộ bài hát/audio stream qua HTML5 audio chuẩn (Hỗ trợ 100% mobile iOS & Android)
      if (customUrl.trim().length > 0) {
        if (this.playbackSessionId !== sessionId || !this.isMusicPlaying) return;
        this.playNativeAudio(customUrl, effectiveStartSeconds, endSeconds);
        return;
      }
    }

    // 2. Bài hát từ Kho nhạc hoặc Preset MP3 cục bộ: ƯU TIÊN PHÁT STREAM NATIVE AUDIO
    if (song?.audioUrl) {
      if (this.playbackSessionId !== sessionId || !this.isMusicPlaying) return;
      this.playNativeAudio(song.audioUrl, effectiveStartSeconds, endSeconds);
      return;
    }

    if (localPresetUrl) {
      if (this.playbackSessionId !== sessionId || !this.isMusicPlaying) return;
      this.playNativeAudio(localPresetUrl, effectiveStartSeconds, endSeconds);
      return;
    }

    if (song) {
      // Lấy bản thu âm ca sĩ gốc tức thì qua Apple Audio CDN
      try {
        const instantUrl = await this.fetchInstantAudioStream(song.title, song.artist);
        if (this.playbackSessionId !== sessionId || !this.isMusicPlaying) return;
        if (instantUrl && this.currentMusicPreset === selected) {
          this.playNativeAudio(instantUrl, effectiveStartSeconds, endSeconds);
          return;
        }
      } catch (err) {
        console.warn('Fetch instant audio error:', err);
      }

      if (this.playbackSessionId !== sessionId || !this.isMusicPlaying) return;
      if (song.youtubeId) {
        this.playYouTube(song.youtubeId, effectiveStartSeconds);
        return;
      }
    }

    if (this.playbackSessionId !== sessionId || !this.isMusicPlaying) return;
    // 3. Dự phòng 2: Bộ hòa âm synthesizer
    this.startSongScore(selected);
  }

  private startSongScore(songId: string) {
    const scoreKey = SONG_SCORES[songId] ? songId : 'anh-nang-cua-anh';
    const score = SONG_SCORES[scoreKey];
    let step = 0;
    const stepDuration = 60 / score.bpm / 2; // eighth notes

    const playNextBeat = () => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicGain) return;
      const now = this.ctx.currentTime;

      // Bass chord note on every 4 beats (creates full polyphonic harmony)
      if (step % 4 === 0 && score.bassChords.length > 0) {
        const bassIndex = Math.floor(step / 4) % score.bassChords.length;
        const bassFreq = score.bassChords[bassIndex];

        const bassOsc = this.ctx.createOscillator();
        const bassFilter = this.ctx.createBiquadFilter();
        const bassGain = this.ctx.createGain();

        bassOsc.type = score.instrument === 'synth' ? 'sawtooth' : 'triangle';
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(450, now);

        bassGain.gain.setValueAtTime(0.22, now);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, now + stepDuration * 3.8);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.musicGain);

        bassOsc.start(now);
        bassOsc.stop(now + stepDuration * 3.9);
      }

      // Lead Melody Note: Plays the recognizable hook of each song!
      const melodyFreq = score.melodyNotes[step % score.melodyNotes.length];
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const noteGain = this.ctx.createGain();

      if (score.instrument === 'music-box') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(melodyFreq, now);
        noteGain.gain.setValueAtTime(0.24, now);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
        osc.connect(noteGain);
        noteGain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 0.9);
      } else if (score.instrument === 'synth') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(melodyFreq, now);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2600, now);
        filter.frequency.exponentialRampToValueAtTime(800, now + 0.5);
        noteGain.gain.setValueAtTime(0.18, now);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (score.instrument === 'lofi') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(melodyFreq, now);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1100, now);
        filter.frequency.exponentialRampToValueAtTime(400, now + 1.1);
        noteGain.gain.setValueAtTime(0.25, now);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);
        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 1.2);
      } else if (score.instrument === 'acoustic') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(melodyFreq, now);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2400, now);
        filter.frequency.exponentialRampToValueAtTime(700, now + 0.8);
        noteGain.gain.setValueAtTime(0.24, now);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 0.9);
      } else {
        // Grand Piano
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(melodyFreq, now);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1700, now);
        filter.frequency.exponentialRampToValueAtTime(500, now + 1.1);
        noteGain.gain.setValueAtTime(0.28, now);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 1.25);
      }

      step++;
      this.musicTimer = window.setTimeout(playNextBeat, stepDuration * 1000);
    };

    playNextBeat();
  }

  public stopBackgroundMusic() {
    this.playbackSessionId++;
    this.isMusicPlaying = false;
    this.stopYouTube();
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.activeCustomAudio) {
      const audio = this.activeCustomAudio;
      this.activeCustomAudio = null;
      this.activeAudioUrl = null;
      try {
        audio.ontimeupdate = null;
        audio.onended = null;
        audio.pause();
        audio.currentTime = 0;
      } catch {}
    }
  }

  public getIsPlaying(): boolean {
    return this.isMusicPlaying;
  }

  public getCurrentPreset(): string | null {
    return this.currentMusicPreset;
  }

  public getCurrentSong(): SongItem | undefined {
    if (!this.currentMusicPreset) return undefined;
    return getSongById(this.currentMusicPreset);
  }

  // Real-time frequency data for equalizers
  public getAnalyserData(): Uint8Array {
    if (this.analyser && this.analyserDataArray) {
      this.analyser.getByteFrequencyData(this.analyserDataArray as unknown as Uint8Array<ArrayBuffer>);
      return this.analyserDataArray;
    }
    return new Uint8Array(16);
  }

  public getActiveAudio(): HTMLAudioElement | null {
    return this.activeCustomAudio;
  }
}

export const soundFx = new SoundEngine();
if (typeof window !== 'undefined') {
  (window as unknown as { soundFx: SoundEngine }).soundFx = soundFx;
}
