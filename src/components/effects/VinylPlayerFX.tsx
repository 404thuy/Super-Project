import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, Heart, Music, Disc3, Image as ImageIcon } from 'lucide-react';
import type { CardConfig } from '../../types';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  config: CardConfig;
  mode: 'studio' | 'recipient';
}

export default function VinylPlayerFX({ config }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [activeAlbumPhoto, setActiveAlbumPhoto] = useState(0);
  const [scratchRotation, setScratchRotation] = useState(0);
  const [isScratching, setIsScratching] = useState(false);
  const [equalizerBars, setEqualizerBars] = useState<number[]>(() => Array(18).fill(4));

  const typewriterRef = useRef<number>(0);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);

  const messageText = config.mainText || '';
  const userImages = config.images || [];
  const centerDiscImage = userImages[0];
  const albumSleeveImages = userImages.length > 1 ? userImages.slice(1) : userImages;

  // Mechanical Tonearm angle interpolation:
  // 0deg = resting off the record, 24deg = outer edge, 38deg = inner label spindle
  const progressRatio = messageText.length > 0 ? Math.min(currentCharIndex / messageText.length, 1) : 0;
  const tonearmAngle = isPlaying ? 24 + progressRatio * 14 : 0;

  // Real Web Audio API Analyser Equalizer Waveform
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const freqData = soundFx.getAnalyserData();
      if (freqData && freqData.length >= 18) {
        const nextBars = Array.from({ length: 18 }).map((_, i) => {
          const raw = freqData[i % freqData.length] || 0;
          return 4 + (raw / 255) * 28;
        });
        setEqualizerBars(nextBars);
      } else {
        const now = Date.now() / 150;
        const nextBars = Array.from({ length: 18 }).map((_, i) => {
          return 5 + Math.sin(now + i * 0.4) * 12 + Math.cos(now * 0.8 + i) * 8;
        });
        setEqualizerBars(nextBars);
      }
    }, 60);

    return () => {
      clearInterval(interval);
      setEqualizerBars(Array(18).fill(4));
    };
  }, [isPlaying]);

  // Synchronized Typewriter Text
  useEffect(() => {
    if (!showLyrics || !isPlaying) return;
    if (currentCharIndex >= messageText.length) return;

    typewriterRef.current = window.setTimeout(() => {
      setCurrentCharIndex((prev) => prev + 1);
    }, 50);

    return () => clearTimeout(typewriterRef.current);
  }, [showLyrics, isPlaying, currentCharIndex, messageText]);

  const handlePlay = () => {
    setIsPlaying(true);
    soundFx.playVinylNeedleDrop();
    soundFx.startBackgroundMusic(config.musicPreset || 'romantic-piano', config.audioUrl);

    setTimeout(() => {
      setShowLyrics(true);
      soundFx.playSuccessChime();
    }, 1100);
  };

  const handlePause = () => {
    setIsPlaying(false);
    soundFx.stopBackgroundMusic();
  };

  const handleRestart = () => {
    setCurrentCharIndex(0);
    setIsPlaying(true);
    setShowLyrics(true);
    soundFx.playVinylNeedleDrop();
    soundFx.startBackgroundMusic(config.musicPreset || 'romantic-piano', config.audioUrl);
  };

  // DJ Scratch interaction
  const handleScratchStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsScratching(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    lastMousePosRef.current = { x: clientX, y: clientY };
    soundFx.playScratchFriction();
  };

  const handleScratchMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isScratching || !lastMousePosRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaX = clientX - lastMousePosRef.current.x;
    setScratchRotation((prev) => prev + deltaX * 1.5);
    lastMousePosRef.current = { x: clientX, y: clientY };

    if (Math.abs(deltaX) > 8) {
      soundFx.playScratchFriction();
    }
  };

  const handleScratchEnd = () => {
    setIsScratching(false);
    lastMousePosRef.current = null;
  };

  return (
    <div className="relative w-full h-full min-h-[520px] sm:min-h-[620px] flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden select-none">
      {/* Warm Vintage Amber Atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-stone-900 to-black pointer-events-none" />
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 30%, rgba(245, 158, 11, 0.4), transparent 60%)',
        }}
      />

      {/* Floating Dust Motes */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-amber-200/40 pointer-events-none blur-[0.5px]"
          style={{
            left: `${15 + ((i * 13) % 75)}%`,
            top: `${20 + ((i * 17) % 65)}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, i % 2 === 0 ? 15 : -15, 0],
            opacity: [0.1, 0.6, 0.1],
          }}
          transition={{
            duration: 5 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-8 w-full max-w-4xl py-4 sm:py-6">
        {/* Main Turntable Stage + Angled Gatefold Album Sleeve */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-10 w-full">
          {/* Retro Turntable Chassis */}
          <div className="relative p-5 sm:p-7 bg-stone-900/95 backdrop-blur-2xl rounded-3xl border border-amber-900/40 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] flex items-center justify-center shrink-0">
            {/* Vinyl Record */}
            <div
              className="relative cursor-grab active:cursor-grabbing"
              onMouseDown={handleScratchStart}
              onMouseMove={handleScratchMove}
              onMouseUp={handleScratchEnd}
              onTouchStart={handleScratchStart}
              onTouchMove={handleScratchMove}
              onTouchEnd={handleScratchEnd}
            >
              <motion.div
                animate={
                  isScratching
                    ? { rotate: scratchRotation }
                    : isPlaying
                    ? { rotate: [scratchRotation, scratchRotation + 360] }
                    : { rotate: scratchRotation }
                }
                transition={
                  isPlaying && !isScratching
                    ? { duration: 2.8, repeat: Infinity, ease: 'linear' }
                    : { duration: 0 }
                }
                className="w-52 h-52 sm:w-64 sm:h-64 rounded-full relative shadow-2xl overflow-hidden"
              >
                {/* Outer Vinyl Base */}
                <div className="absolute inset-0 rounded-full bg-slate-950" />
                <div className="absolute inset-2 rounded-full vinyl-grooves opacity-90" />

                {/* Specular Light Sheen */}
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background:
                      'conic-gradient(from 45deg, transparent 0deg, rgba(255,255,255,0.12) 30deg, transparent 60deg, transparent 180deg, rgba(255,255,255,0.12) 210deg, transparent 240deg)',
                  }}
                />

                {/* Integrated Center Photo Disc Label */}
                <div className="absolute inset-[28%] rounded-full overflow-hidden shadow-inner border-2 border-amber-500/40 bg-gradient-to-br from-amber-600 via-rose-700 to-amber-900 flex items-center justify-center">
                  {centerDiscImage ? (
                    <img src={centerDiscImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Music className="w-5 h-5 text-amber-200 mx-auto mb-1 animate-pulse" />
                      <p className="text-[9px] text-amber-100 font-extrabold tracking-wider">LOVEDISC</p>
                      <p className="text-[8px] text-amber-300/80 font-medium">20/10 SPECIAL</p>
                    </div>
                  )}
                </div>

                {/* Spindle Hole */}
                <div className="absolute inset-[47%] rounded-full bg-black shadow-inner border border-amber-900" />
              </motion.div>

              {/* Realistic Mechanical Tonearm */}
              <motion.div
                animate={{ rotate: tonearmAngle }}
                transition={{ duration: 0.9, ease: 'easeInOut' }}
                style={{ transformOrigin: 'top right' }}
                className="absolute -top-3 right-2 w-3.5 h-32 sm:h-36 z-20 pointer-events-none"
              >
                <div className="w-full h-full bg-gradient-to-b from-stone-400 via-amber-200 to-stone-500 rounded-full shadow-lg" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-4 bg-amber-400 rounded-sm shadow-md" />
              </motion.div>
            </div>

            {/* Hint tag */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold text-amber-400/60 uppercase tracking-widest whitespace-nowrap pointer-events-none">
              {isPlaying ? 'Đang phát • Có thể chà đĩa (DJ Scratch)' : 'Bấm Play để thả kim'}
            </div>
          </div>

          {/* Vinyl Gatefold Album Cover (Beside the Turntable) */}
          <div className="w-full max-w-xs space-y-3">
            <div className="p-4 bg-stone-900/90 rounded-3xl border border-amber-900/40 shadow-2xl text-center space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                <span className="flex items-center gap-1.5">
                  <Disc3 className="w-4 h-4 text-rose-400" />
                  <span>Bìa Album Kỷ Niệm</span>
                </span>
                {albumSleeveImages.length > 1 && (
                  <span className="text-[10px] text-amber-300/70">
                    {activeAlbumPhoto + 1}/{albumSleeveImages.length}
                  </span>
                )}
              </div>

              {/* 3D Angled Album Photo Viewer */}
              <div
                onClick={() => {
                  soundFx.playPaperSwoosh();
                  setActiveAlbumPhoto((prev) => (prev + 1) % Math.max(albumSleeveImages.length, 1));
                }}
                className="relative aspect-square rounded-2xl overflow-hidden bg-black/60 border-2 border-amber-500/30 cursor-pointer shadow-xl group"
              >
                {albumSleeveImages.length > 0 ? (
                  <img
                    src={albumSleeveImages[activeAlbumPhoto]}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-amber-950 via-stone-900 to-black text-amber-300/70">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-xs font-bold">Album Tình Ca 20/10</p>
                    <p className="text-[10px] text-amber-400/50 mt-1">Dành tặng {config.recipientName}</p>
                  </div>
                )}

                {/* Next photo pill */}
                {albumSleeveImages.length > 1 && (
                  <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 shadow">
                    <span>Nhấp lật ảnh</span>
                    <span>→</span>
                  </div>
                )}
              </div>

              <p className="text-[11px] font-semibold text-amber-300/80">
                Album: {config.recipientName} & {config.senderName} 🌹
              </p>
            </div>
          </div>
        </div>

        {/* Playback Controls & Real-time Equalizer */}
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
          {/* Frequency Equalizer Waves */}
          <div className="flex items-end gap-1.5 h-10 px-4 py-2 bg-stone-900/60 rounded-full border border-amber-500/20 shadow-inner">
            {equalizerBars.map((height, i) => (
              <motion.div
                key={i}
                animate={{ height: isPlaying ? height : 4 }}
                transition={{ duration: 0.06 }}
                className="w-1.5 rounded-full bg-gradient-to-t from-amber-500 via-rose-500 to-amber-300"
                style={{ minHeight: 4 }}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleRestart}
              className="p-3.5 rounded-full bg-stone-800/80 border border-amber-500/20 text-amber-300 hover:bg-stone-700 active:scale-95 transition-all shadow-md"
              title="Phát Lại Từ Đầu"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className="p-5 rounded-full bg-gradient-to-br from-amber-500 to-rose-600 text-white shadow-[0_4px_25px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition-all"
              title={isPlaying ? 'Tạm Dừng' : 'Thả Kim Phát Nhạc'}
            >
              {isPlaying ? (
                <Pause className="w-7 h-7" />
              ) : (
                <Play className="w-7 h-7 ml-0.5" />
              )}
            </button>

            <button
              className="p-3.5 rounded-full bg-stone-800/80 border border-amber-500/20 text-rose-400 hover:bg-stone-700 active:scale-95 transition-all shadow-md"
              title="Yêu Thích"
            >
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            </button>
          </div>
        </div>

        {/* Typewriter Synced Letter Reveal */}
        <AnimatePresence>
          {showLyrics && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-xl bg-stone-900/90 backdrop-blur-2xl p-5 sm:p-8 rounded-3xl border border-amber-500/30 shadow-2xl text-center space-y-4"
            >
              <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
                <Disc3 className="w-4 h-4 animate-spin" />
                <span>Bản Tình Ca Dành Riêng Cho {config.recipientName}</span>
              </div>

              <div
                className="text-amber-100 text-base sm:text-lg leading-relaxed font-serif text-left min-h-[80px] whitespace-pre-line"
                style={{ fontFamily: config.fontFamily || 'Playfair Display' }}
              >
                {messageText.slice(0, currentCharIndex)}
                {currentCharIndex < messageText.length && (
                  <span className="inline-block w-1.5 h-4 ml-1 bg-amber-400 animate-pulse" />
                )}
              </div>

              {currentCharIndex >= messageText.length && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-right pt-2"
                >
                  <p
                    className="text-base font-bold text-amber-400 italic"
                    style={{ fontFamily: config.fontFamily || 'Playfair Display' }}
                  >
                    — {config.senderName} 🎵
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
