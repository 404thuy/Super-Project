import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, Heart, Music, Disc3, Image as ImageIcon, Volume2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CardConfig } from '../../types';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  config: CardConfig;
  mode: 'studio' | 'recipient';
}

/* ─── VINTAGE AUDIOPHILE VACUUM TUBE COMPONENT ─── */
function VacuumTube({ isLit = false }: { isLit?: boolean }) {
  return (
    <div className="relative flex flex-col items-center">
      {/* Outer Glass Envelope */}
      <div className="relative w-5 sm:w-6 h-10 sm:h-12 rounded-t-full bg-gradient-to-b from-white/25 via-white/5 to-transparent border border-white/30 shadow-[inset_0_2px_6px_rgba(255,255,255,0.4)] backdrop-blur-[1px] flex items-center justify-center overflow-hidden">
        {/* Glowing Orange Filament */}
        <motion.div
          animate={
            isLit
              ? { scale: [1, 1.08, 0.98, 1.05], opacity: [0.85, 1, 0.8, 1] }
              : { opacity: 0.2, scale: 0.9 }
          }
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-1.5 sm:w-2 h-6 sm:h-7 rounded-full bg-gradient-to-t from-red-600 via-orange-400 to-yellow-200 shadow-[0_0_15px_rgba(251,146,60,0.9)]"
        />
        {/* Glass Glint */}
        <div className="absolute top-1 left-1 w-1 h-4 bg-white/40 rounded-full blur-[0.5px]" />
      </div>
      {/* Brass Tube Socket Base */}
      <div className="w-6 sm:w-7 h-2 bg-gradient-to-r from-yellow-600 via-amber-400 to-yellow-700 rounded-b-sm border-t border-amber-300" />
    </div>
  );
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

  // Tonearm angle interpolation
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
    }, 45);

    return () => clearTimeout(typewriterRef.current);
  }, [showLyrics, isPlaying, currentCharIndex, messageText]);

  const handlePlay = () => {
    setIsPlaying(true);
    setShowLyrics(true);
    if (currentCharIndex >= messageText.length) {
      setCurrentCharIndex(0);
    }
    soundFx.playVinylNeedleDrop();
    soundFx.startBackgroundMusic(config.musicPreset || 'romantic-piano', config.audioUrl);
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
    <div className="relative w-full h-full min-h-full flex flex-col items-center justify-start sm:justify-center p-3 sm:p-6 overflow-y-auto overflow-x-hidden select-none">
      {/* Warm Vintage Amber Atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1c0c05] via-[#120a06] to-[#050302] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 30%, rgba(245, 158, 11, 0.45) 0%, transparent 65%)',
        }}
      />

      {/* Floating Dust Motes */}
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-amber-200/40 pointer-events-none blur-[0.5px]"
          style={{
            left: `${12 + ((i * 13) % 78)}%`,
            top: `${18 + ((i * 17) % 68)}%`,
          }}
          animate={{
            y: [0, -32, 0],
            x: [0, i % 2 === 0 ? 14 : -14, 0],
            opacity: [0.1, 0.7, 0.1],
          }}
          transition={{
            duration: 5 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center gap-3.5 sm:gap-7 w-full max-w-4xl py-2 sm:py-5">
        
        {/* Main Turntable Stage + Angled Gatefold Album Sleeve */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 sm:gap-9 w-full">
          
          {/* ─── REALISTIC WALNUT & BRASS TURNTABLE CHASSIS ─── */}
          <div className="relative p-4 sm:p-8 bg-gradient-to-br from-[#2a1708] via-[#3a200d] to-[#1a0e04] rounded-3xl border-2 border-amber-600/70 shadow-[0_25px_70px_rgba(0,0,0,0.95)] flex flex-col items-center shrink-0">
            {/* 4 Golden Corner Brackets */}
            <span className="absolute top-1.5 left-2 text-amber-400 text-xs pointer-events-none">❖</span>
            <span className="absolute top-1.5 right-2 text-amber-400 text-xs pointer-events-none">❖</span>
            <span className="absolute bottom-1.5 left-2 text-amber-400 text-xs pointer-events-none">❖</span>
            <span className="absolute bottom-1.5 right-2 text-amber-400 text-xs pointer-events-none">❖</span>

            {/* Top Bar: Audiophile Vacuum Tubes & Brass Logo */}
            <div className="w-full flex items-center justify-between px-2 mb-3 z-10">
              {/* Twin Glowing Vacuum Tubes */}
              <div className="flex items-center gap-2">
                <VacuumTube isLit={isPlaying} />
                <VacuumTube isLit={isPlaying} />
              </div>

              {/* Embossed Brass Plate */}
              <div className="px-2.5 py-1 rounded-md bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-500 border border-yellow-100 shadow-sm text-center">
                <p className="text-[9px] font-black font-serif text-amber-950 uppercase tracking-widest">
                  LOVEDISC • HI-FI
                </p>
              </div>
            </div>

            {/* Vinyl Record on Platter */}
            <div
              className="relative cursor-grab active:cursor-grabbing"
              onMouseDown={handleScratchStart}
              onMouseMove={handleScratchMove}
              onMouseUp={handleScratchEnd}
              onTouchStart={handleScratchStart}
              onTouchMove={handleScratchMove}
              onTouchEnd={handleScratchEnd}
            >
              {/* Brass Platter Edge */}
              <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700 shadow-md pointer-events-none" />

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
                className="w-48 h-48 sm:w-68 sm:h-68 rounded-full relative shadow-[0_15px_40px_rgba(0,0,0,0.9)] overflow-hidden"
              >
                {/* Vinyl Grooves with Realistic Radial Sound Rings */}
                <div className="absolute inset-0 rounded-full bg-[#080808]" />
                
                {/* Realistic Grooves (Concentric Circles) */}
                <div
                  className="absolute inset-1.5 rounded-full pointer-events-none"
                  style={{
                    backgroundImage:
                      'repeating-radial-gradient(circle, transparent 0px, transparent 2px, rgba(255,255,255,0.06) 3px, transparent 4px)',
                  }}
                />

                {/* Anisotropic Specular Light Glint Reflections */}
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background:
                      'conic-gradient(from 45deg, transparent 0deg, rgba(255,255,255,0.18) 35deg, transparent 70deg, transparent 180deg, rgba(255,255,255,0.18) 215deg, transparent 250deg)',
                  }}
                />

                {/* Center Photo Disc Label */}
                <div className="absolute inset-[27%] rounded-full overflow-hidden shadow-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-600 via-rose-700 to-amber-900 flex items-center justify-center">
                  {centerDiscImage ? (
                    <img src={centerDiscImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Music className="w-5 h-5 text-amber-200 mx-auto mb-1 animate-pulse" />
                      <p className="text-[9px] text-amber-100 font-black tracking-wider">TÌNH CA</p>
                      <p className="text-[7.5px] text-amber-300 font-serif">20/10 SPECIAL</p>
                    </div>
                  )}
                </div>

                {/* Spindle Brass Hole */}
                <div className="absolute inset-[46%] rounded-full bg-black shadow-inner border border-amber-400/80" />
              </motion.div>

              {/* Realistic Brushed Brass Tonearm */}
              <motion.div
                animate={{ rotate: tonearmAngle }}
                transition={{ duration: 0.9, ease: 'easeInOut' }}
                style={{ transformOrigin: 'top right' }}
                className="absolute -top-4 right-1 w-3 sm:w-4 h-32 sm:h-40 z-20 pointer-events-none"
              >
                {/* Counterweight */}
                <div className="absolute top-0 right-0 w-5 h-5 rounded-full bg-gradient-to-br from-yellow-300 to-amber-600 border border-yellow-100 shadow-md" />
                {/* Curved Brass Arm Tube */}
                <div className="w-full h-full bg-gradient-to-b from-amber-200 via-yellow-400 to-amber-600 rounded-full shadow-lg" />
                {/* Cartridge & Stylus Needle */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 sm:w-5 h-4 bg-gradient-to-br from-amber-400 to-amber-600 border border-yellow-200 rounded-xs shadow" />
              </motion.div>
            </div>

            {/* Hint Tag */}
            <div className="mt-2 text-[8.5px] sm:text-[9.5px] font-bold text-amber-300/80 uppercase tracking-widest whitespace-nowrap pointer-events-none font-mono">
              {isPlaying ? 'Đang phát • Có thể chà đĩa (DJ Scratch)' : 'Bấm Play để thả kim phát nhạc'}
            </div>
          </div>

          {/* ─── GATEFOLD VINTAGE ALBUM SLEEVE ─── */}
          <div className="w-full max-w-xs space-y-3">
            <div className="p-4 sm:p-5 bg-gradient-to-b from-[#241308] via-[#1c0f05] to-[#120903] rounded-3xl border-2 border-amber-600/60 shadow-2xl text-center space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                <span className="flex items-center gap-1.5 font-serif">
                  <Disc3 className="w-4 h-4 text-rose-400" />
                  <span>Bìa Album Kỷ Niệm</span>
                </span>
                {albumSleeveImages.length > 1 && (
                  <span className="text-[10px] text-amber-300/80 font-mono">
                    {activeAlbumPhoto + 1}/{albumSleeveImages.length}
                  </span>
                )}
              </div>

              {/* 3D Angled Album Photo Frame with Multi-Photo Carousel */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-black/60 border-2 border-amber-400/80 shadow-xl group">
                <div
                  onClick={() => {
                    if (albumSleeveImages.length > 1) {
                      soundFx.playPaperSwoosh();
                      setActiveAlbumPhoto((prev) => (prev + 1) % albumSleeveImages.length);
                    }
                  }}
                  className="w-full h-full cursor-pointer"
                >
                  {albumSleeveImages.length > 0 ? (
                    <img
                      src={albumSleeveImages[activeAlbumPhoto]}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-amber-950 via-stone-900 to-black text-amber-300/70">
                      <ImageIcon className="w-10 h-10 mb-2 opacity-50 text-amber-400" />
                      <p className="text-xs font-bold font-serif">Album Tình Ca 20/10</p>
                      <p className="text-[10px] text-amber-400/60 mt-1">Dành tặng {config.recipientName}</p>
                    </div>
                  )}
                </div>

                {/* Left/Right Navigation Controls for Multi-Photos */}
                {albumSleeveImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundFx.playPaperSwoosh();
                        setActiveAlbumPhoto((prev) => (prev - 1 + albumSleeveImages.length) % albumSleeveImages.length);
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/70 hover:bg-black/90 text-amber-300 border border-amber-400/50 backdrop-blur-md shadow-md transition-all active:scale-90"
                      title="Ảnh trước"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundFx.playPaperSwoosh();
                        setActiveAlbumPhoto((prev) => (prev + 1) % albumSleeveImages.length);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/70 hover:bg-black/90 text-amber-300 border border-amber-400/50 backdrop-blur-md shadow-md transition-all active:scale-90"
                      title="Ảnh tiếp theo"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5 pointer-events-none">
                      {albumSleeveImages.map((_, idx) => (
                        <span
                          key={idx}
                          className={`h-1.5 rounded-full transition-all ${
                            idx === activeAlbumPhoto ? 'w-4 bg-amber-400' : 'w-1.5 bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <p className="text-[11px] font-serif font-bold text-amber-200">
                Album: {config.recipientName} & {config.senderName} 🌹
              </p>
            </div>
          </div>
        </div>

        {/* ─── PLAYBACK CONTROLS & REAL-TIME EQUALIZER ─── */}
        <div className="flex flex-col items-center gap-3.5 w-full max-w-md">
          {/* Frequency Equalizer Waves */}
          <div className="flex items-end gap-1.5 h-10 px-5 py-2 bg-stone-900/80 rounded-full border border-amber-500/30 shadow-inner">
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
              className="p-3.5 rounded-full bg-stone-900 border border-amber-500/40 text-amber-300 hover:bg-stone-800 active:scale-95 transition-all shadow-md"
              title="Phát Lại Từ Đầu"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className="p-5 rounded-full bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-600 text-stone-950 shadow-[0_4px_30px_rgba(245,158,11,0.6)] hover:scale-105 active:scale-95 transition-all border border-yellow-100"
              title={isPlaying ? 'Tạm Dừng' : 'Thả Kim Phát Nhạc'}
            >
              {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
            </button>

            <button
              onClick={() => soundFx.playHeartPop()}
              className="p-3.5 rounded-full bg-stone-900 border border-amber-500/40 text-rose-400 hover:bg-stone-800 active:scale-95 transition-all shadow-md"
              title="Yêu Thích"
            >
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            </button>
          </div>
        </div>

        {/* ─── SYNCHRONIZED TYPEWRITER LETTER REVEAL ─── */}
        <AnimatePresence>
          {showLyrics && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-xl bg-gradient-to-b from-[#241308]/95 via-[#1a0c04]/95 to-[#120803]/95 backdrop-blur-2xl p-5 sm:p-7 rounded-3xl border-2 border-amber-500/40 shadow-2xl text-center space-y-4"
            >
              <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-amber-300 font-serif">
                <Disc3 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Bản Tình Ca Dành Riêng Cho {config.recipientName}</span>
              </div>

              <div
                className="text-amber-100 text-base sm:text-lg leading-relaxed font-serif text-left min-h-[80px] whitespace-pre-line"
                style={{ fontFamily: config.fontFamily || 'Playfair Display' }}
              >
                {messageText.slice(0, currentCharIndex)}
                {currentCharIndex < messageText.length && (
                  <span className="inline-block w-2 h-4 ml-1 bg-amber-400 animate-pulse" />
                )}
              </div>

              {currentCharIndex >= messageText.length && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-right pt-2"
                >
                  <p
                    className="text-base font-bold text-amber-400 italic font-serif"
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
