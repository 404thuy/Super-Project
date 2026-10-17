import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Clapperboard, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import type { CardConfig } from '../../types';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  config: CardConfig;
  mode: 'studio' | 'recipient';
}

export default function CinemaFilmstripFX({ config }: Props) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const userImages = config.images || [];

  const defaultSubtitles = [
    'Phân cảnh 1: Ngày định mệnh ta gặp nhau giữa thế gian muôn màu.',
    'Phân cảnh 2: Nụ cười của em là ánh nắng rạng rỡ nhất trong đời.',
    'Phân cảnh 3: Dù cuộc đời có ra sao, anh vẫn luôn ở cạnh em.',
    'Phân cảnh 4: Chúc người phụ nữ tuyệt vời ngày 20/10 ngập tràn hạnh phúc!',
  ];

  // Construct movie frames
  const frames = Array.from({ length: 4 }).map((_, i) => {
    return {
      id: i,
      image: userImages[i] || userImages[0] || undefined,
      subtitle: defaultSubtitles[i],
    };
  });

  // Auto reel projection timer
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      soundFx.playPinClick();
      setCurrentFrame((prev) => (prev + 1) % frames.length);
    }, 3200);
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
    <div className="relative w-full h-full min-h-[520px] sm:min-h-[620px] bg-stone-950 overflow-hidden select-none flex items-center justify-center p-4">
      {/* Retro Film Sepia Ambient Lighting */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-amber-950/30 to-black pointer-events-none" />

      {/* Cinematic Projector Light Beam */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(ellipse at 50% 20%, rgba(251, 191, 36, 0.4), transparent 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-2xl">
        {/* Projector Header Bar */}
        <div className="w-full flex items-center justify-between px-4 text-xs font-mono text-amber-400/80 border-b border-amber-900/40 pb-2">
          <div className="flex items-center gap-2">
            <Clapperboard className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="font-bold tracking-widest uppercase">
              THƯỚC PHIM 20/10 • KODAK 35MM
            </span>
          </div>
          <span className="bg-amber-900/40 px-2 py-0.5 rounded text-[11px] font-bold">
            FRAME {currentFrame + 1} / {frames.length}
          </span>
        </div>

        {/* 35mm Filmstrip Reel Stage */}
        <div className="relative w-full overflow-hidden bg-black/90 p-4 rounded-3xl border-2 border-stone-800 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          {/* Top Film Sprocket Perforations */}
          <div className="flex items-center justify-between gap-2 px-2 py-1 mb-3 border-b border-stone-800">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="w-3.5 h-2.5 rounded-sm bg-stone-800 border border-stone-700/60" />
            ))}
          </div>

          {/* Main Active Projector Frame Screen */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-stone-900 flex items-center justify-center border border-amber-500/20 shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFrame}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4 }}
                className="relative w-full h-full flex items-center justify-center"
              >
                {frames[currentFrame].image ? (
                  <img
                    src={frames[currentFrame].image}
                    alt=""
                    className="w-full h-full object-cover filter contrast-105"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2 text-amber-200">
                    <Film className="w-12 h-12 mx-auto text-amber-500/60" />
                    <h3 className="text-lg font-bold">Thước Phim Tình Cảm</h3>
                    <p className="text-xs text-stone-400">Dành riêng cho {config.recipientName}</p>
                  </div>
                )}

                {/* Subtle Film Grain Glint */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

                {/* Movie Subtitles at Bottom */}
                <div className="absolute bottom-4 inset-x-6 text-center">
                  <p className="text-xs sm:text-sm font-serif font-bold text-yellow-100 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 inline-block shadow-lg">
                    {config.mainText && currentFrame === 0 ? config.mainText : frames[currentFrame].subtitle}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Film Sprocket Perforations */}
          <div className="flex items-center justify-between gap-2 px-2 py-1 mt-3 border-t border-stone-800">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="w-3.5 h-2.5 rounded-sm bg-stone-800 border border-stone-700/60" />
            ))}
          </div>
        </div>

        {/* Projector Navigation & Controls */}
        <div className="flex items-center justify-between w-full max-w-md px-2">
          <button
            onClick={handlePrev}
            className="p-3 rounded-2xl bg-stone-900 border border-stone-800 text-amber-300 hover:bg-stone-800 active:scale-95 transition-all text-xs font-bold flex items-center gap-1.5 shadow"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Phân Cảnh Trước</span>
          </button>

          <button
            onClick={toggleAutoPlay}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-rose-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-600/30 hover:scale-105 active:scale-95 transition-all"
          >
            {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            <span>{isAutoPlaying ? 'Tạm Dừng Chiếu' : 'Bật Chiếu Phim'}</span>
          </button>

          <button
            onClick={handleNext}
            className="p-3 rounded-2xl bg-stone-900 border border-stone-800 text-amber-300 hover:bg-stone-800 active:scale-95 transition-all text-xs font-bold flex items-center gap-1.5 shadow"
          >
            <span>Phân Cảnh Tiếp</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Director & Dedication Footnote */}
        <div className="text-center text-xs text-stone-400 italic">
          Đạo diễn: <strong className="text-amber-400">{config.senderName}</strong> • Tặng nhân vật chính:{' '}
          <strong className="text-rose-400">{config.recipientName}</strong>
        </div>
      </div>
    </div>
  );
}
