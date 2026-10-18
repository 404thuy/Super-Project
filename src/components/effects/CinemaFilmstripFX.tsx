import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Clapperboard, ChevronLeft, ChevronRight, Play, Pause, Sparkles } from 'lucide-react';
import type { CardConfig } from '../../types';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  config: CardConfig;
  mode: 'studio' | 'recipient';
}

/* ─── VINTAGE BRASS FILM REEL COMPONENT ─── */
function BrassFilmReel({ isSpinning = false, size = 64 }: { isSpinning?: boolean; size?: number }) {
  return (
    <motion.div
      animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
      transition={isSpinning ? { duration: 3, repeat: Infinity, ease: 'linear' } : { duration: 0.5 }}
      className="relative rounded-full border-2 border-amber-400/90 bg-gradient-to-br from-amber-700 via-yellow-600 to-amber-950 shadow-[0_4px_15px_rgba(0,0,0,0.8)] flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      {/* Outer Rim Holes */}
      {Array.from({ length: 6 }).map((_, i) => {
        const deg = i * 60;
        return (
          <div
            key={i}
            className="absolute w-3.5 h-3.5 rounded-full bg-stone-950 border border-amber-300/60 shadow-inner"
            style={{
              transform: `rotate(${deg}deg) translateY(-${size * 0.28}px)`,
            }}
          />
        );
      })}
      {/* Center Brass Hub */}
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-200 via-amber-400 to-amber-600 border border-yellow-100 shadow-md flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-stone-900" />
      </div>
    </motion.div>
  );
}

export default function CinemaFilmstripFX({ config }: Props) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const userImages = config.images || [];
  const userCaptions = config.cinemaCaptions || [];

  const defaultSubtitles = [
    'Phân cảnh 1: Ngày định mệnh ta gặp nhau giữa thế gian muôn màu.',
    'Phân cảnh 2: Nụ cười của em là ánh nắng rạng rỡ nhất trong đời.',
    'Phân cảnh 3: Dù cuộc đời có ra sao, anh vẫn luôn ở cạnh em.',
    'Phân cảnh 4: Chúc người phụ nữ tuyệt vời ngày 20/10 ngập tràn hạnh phúc!',
    'Phân cảnh 5: Từng khoảnh khắc bên em đều là một thước phim vô giá.',
    'Phân cảnh 6: Cảm ơn em đã bước vào cuộc đời và sưởi ấm trái tim anh.',
    'Phân cảnh 7: Nắm tay nhau đi qua giông bão, trọn vẹn yêu thương.',
    'Phân cảnh 8: Mãi là bến đỗ bình yên và ngọt ngào nhất của nhau.',
  ];

  // Determine dynamic number of scenes based on images or customized captions
  const totalScenes = Math.max(
    userImages.length,
    userCaptions.length,
    userImages.length > 0 ? userImages.length : 4
  );
  const safeTotal = Math.max(1, totalScenes);

  // Construct movie frames dynamically
  const frames = Array.from({ length: safeTotal }).map((_, i) => {
    const customCaption = userCaptions[i];
    const fallbackSubtitle = i === 0 && config.mainText
      ? config.mainText
      : (defaultSubtitles[i] || `Phân cảnh ${i + 1}: Kỷ niệm ngọt ngào và đáng nhớ của chúng mình.`);

    return {
      id: i,
      image: userImages[i] || (userImages.length > 0 ? userImages[0] : undefined),
      subtitle: customCaption && customCaption.trim() ? customCaption : fallbackSubtitle,
    };
  });

  const safeFrameIndex = Math.min(currentFrame, frames.length - 1);
  const activeFrame = frames[safeFrameIndex] || frames[0];

  // Auto reel projection timer
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      soundFx.playPinClick();
      setCurrentFrame((prev) => (prev + 1) % frames.length);
    }, 3600);
    return () => clearInterval(timer);
  }, [isAutoPlaying, frames.length]);

  const handleNext = () => {
    soundFx.playPinClick();
    setCurrentFrame((prev) => (prev + 1) % frames.length);
  };

  const handlePrev = () => {
    soundFx.playPinClick();
    setCurrentFrame((prev) => (prev - 1 + frames.length) % frames.length);
  };

  const toggleAutoPlay = () => {
    soundFx.playVinylNeedleDrop();
    setIsAutoPlaying(!isAutoPlaying);
    if (!isAutoPlaying) {
      soundFx.startBackgroundMusic(config.musicPreset || 'spring-acoustic', config.audioUrl);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[540px] sm:min-h-[640px] bg-stone-950 overflow-y-auto sm:overflow-hidden select-none flex flex-col items-center justify-start sm:justify-center p-3 sm:p-5">
      {/* Retro 1930s Film Sepia Ambient Lighting */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0805] via-[#1c140a] to-[#050403] pointer-events-none" />

      {/* Cinematic Projector Light Beam Cone */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          background: 'radial-gradient(ellipse at 50% 15%, rgba(251, 191, 36, 0.45) 0%, transparent 65%)',
        }}
      />

      {/* Floating Film Dust Particles */}
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-amber-200/50 pointer-events-none blur-[0.5px]"
          style={{
            left: `${10 + ((i * 19) % 80)}%`,
            top: `${15 + ((i * 23) % 70)}%`,
          }}
          animate={{
            y: [-10, 20, -10],
            x: [0, (i % 2 === 0 ? 8 : -8), 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 4 + (i % 3) * 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center gap-3.5 sm:gap-5 w-full max-w-xl py-2 sm:py-0">
        
        {/* ─── VINTAGE BRASS FILM PROJECTOR TOP HOUSING ─── */}
        <div className="flex items-center justify-center gap-4 sm:gap-8 -mb-2">
          {/* Supply Reel */}
          <div className="flex flex-col items-center">
            <BrassFilmReel isSpinning={isAutoPlaying} size={54} />
            <span className="text-[8px] font-mono font-bold text-amber-400/70 mt-1">REEL 01</span>
          </div>

          {/* Projector Lamp & Lens */}
          <div className="flex flex-col items-center px-3 py-1.5 rounded-2xl bg-gradient-to-b from-stone-900 via-amber-950 to-stone-950 border border-amber-500/50 shadow-xl">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-black text-amber-300">
              <Clapperboard className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>35MM CINEMATIC REEL</span>
            </div>
            <div className="w-8 h-1 bg-amber-400/40 rounded-full my-1" />
            <span className="text-[9px] text-amber-200/70 font-mono">
              SCENE {safeFrameIndex + 1} / {frames.length}
            </span>
          </div>

          {/* Take-up Reel */}
          <div className="flex flex-col items-center">
            <BrassFilmReel isSpinning={isAutoPlaying} size={54} />
            <span className="text-[8px] font-mono font-bold text-amber-400/70 mt-1">REEL 02</span>
          </div>
        </div>

        {/* ─── 35MM CELLULOID FILMSTRIP STAGE ─── */}
        <div className="relative w-full overflow-hidden bg-black/95 p-3 sm:p-4 rounded-3xl border-2 border-amber-500/40 shadow-[0_20px_70px_rgba(0,0,0,0.95)]">
          {/* Top Film Sprocket Perforations */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 px-1 sm:px-2 py-1 mb-2 sm:mb-3 border-b border-stone-800 overflow-hidden">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className="w-2.5 sm:w-3.5 h-2 sm:h-2.5 rounded-xs sm:rounded-sm bg-stone-900 border border-amber-500/30 shadow-inner shrink-0"
              />
            ))}
          </div>

          {/* Main Active Projector Frame Screen */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-stone-950 flex items-center justify-center border-2 border-amber-500/30 shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={safeFrameIndex}
                initial={{ opacity: 0, scale: 0.96, x: 30 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.96, x: -30 }}
                transition={{ duration: 0.45 }}
                className="relative w-full h-full flex items-center justify-center"
              >
                {activeFrame.image ? (
                  <img
                    src={activeFrame.image}
                    alt=""
                    className="w-full h-full object-cover filter contrast-105"
                  />
                ) : (
                  <div className="text-center p-4 sm:p-6 space-y-2 text-amber-200">
                    <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 text-2xl shadow-inner">
                      🎞️
                    </div>
                    <h3 className="text-base sm:text-lg font-serif font-black text-amber-200">
                      Thước Phim Tình Cảm
                    </h3>
                    <p className="text-xs text-amber-400/80 font-mono">Dành riêng cho {config.recipientName}</p>
                  </div>
                )}

                {/* Vintage Vignette & Light Leak Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* Kodak Edge Code Stamp */}
                <div className="absolute top-2 left-3 text-[8px] font-mono text-amber-400/60 tracking-widest pointer-events-none">
                  KODAK 500T • EXP 0{safeFrameIndex + 1} / 0{frames.length}
                </div>

                {/* Romantic Movie Subtitle at Bottom */}
                <div className="absolute bottom-3 sm:bottom-4 inset-x-3 sm:inset-x-6 text-center">
                  <p className="text-xs sm:text-sm font-serif italic text-amber-100 bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-amber-400/30 inline-block shadow-2xl max-w-full leading-relaxed">
                    "{activeFrame.subtitle}"
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Film Sprocket Perforations */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 px-1 sm:px-2 py-1 mt-2 sm:mt-3 border-t border-stone-800 overflow-hidden">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className="w-2.5 sm:w-3.5 h-2 sm:h-2.5 rounded-xs sm:rounded-sm bg-stone-900 border border-amber-500/30 shadow-inner shrink-0"
              />
            ))}
          </div>
        </div>

        {/* ─── SCENE QUICK SELECTOR PILLS ─── */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-full px-2">
          {frames.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                soundFx.playPinClick();
                setCurrentFrame(idx);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                safeFrameIndex === idx
                  ? 'bg-amber-400 text-stone-950 shadow-md scale-105 font-black ring-1 ring-amber-300'
                  : 'bg-stone-900/90 text-amber-300/70 border border-amber-500/20 hover:border-amber-400/50 hover:text-amber-200'
              }`}
            >
              Cảnh {idx + 1}
            </button>
          ))}
        </div>

        {/* ─── PROJECTOR CONTROLS ─── */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 w-full max-w-md px-1">
          <button
            type="button"
            onClick={handlePrev}
            className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl bg-stone-900 border border-amber-500/30 text-amber-300 hover:bg-stone-800 active:scale-95 transition-all text-xs font-bold flex items-center justify-center gap-1 shadow-md hover:border-amber-400 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Phân Cảnh Trước</span>
            <span className="sm:hidden">Trước</span>
          </button>

          <button
            type="button"
            onClick={toggleAutoPlay}
            className={`flex-1 py-2 sm:py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xl active:scale-95 transition-all cursor-pointer ${
              isAutoPlaying
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white ring-2 ring-yellow-400/40 animate-pulse'
                : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-stone-950 hover:brightness-110'
            }`}
          >
            {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            <span>{isAutoPlaying ? 'Tạm Dừng' : 'Chiếu Phim'}</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl bg-stone-900 border border-amber-500/30 text-amber-300 hover:bg-stone-800 active:scale-95 transition-all text-xs font-bold flex items-center justify-center gap-1 shadow-md hover:border-amber-400 cursor-pointer"
          >
            <span className="hidden sm:inline">Phân Cảnh Kế</span>
            <span className="sm:hidden">Kế Tiếp</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Director & Dedication Footnote */}
        <div className="text-center text-xs font-serif text-stone-400">
          Đạo diễn: <strong className="text-amber-300">{config.senderName || 'Người Thương'}</strong> • Nữ chính:{' '}
          <strong className="text-rose-400">{config.recipientName || 'Em Yêu'}</strong> 🎬
        </div>
      </div>
    </div>
  );
}
