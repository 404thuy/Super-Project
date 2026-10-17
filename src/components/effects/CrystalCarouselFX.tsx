import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key } from 'lucide-react';
import type { CardConfig } from '../../types';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  config: CardConfig;
  mode: 'studio' | 'recipient';
}

export default function CrystalCarouselFX({ config }: Props) {
  const [carouselAngle, setCarouselAngle] = useState(0);
  const [isPlayingBox, setIsPlayingBox] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

  const userImages = config.images || [];

  // Generate carousel panels (6 panels in a cylinder)
  const defaultQuotes = [
    'Mỗi khoảnh khắc bên em đều lấp lánh như viên pha lê.',
    'Em là điều ngọt ngào nhất mà số phận đã sắp đặt.',
    'Chúc em ngày 20/10 ngập tràn niềm vui và bình yên.',
    'Nụ cười của em thắp sáng cả thế giới xung quanh.',
    'Mãi yêu thương và trân trọng từng phút giây bên nhau.',
    'Gửi tặng công chúa đóa hồng vĩnh cửu không tàn 🌹',
  ];

  const panels = Array.from({ length: 6 }).map((_, i) => {
    const hasImage = userImages.length > 0 && userImages[i % userImages.length];
    return {
      id: i,
      image: hasImage || undefined,
      quote: defaultQuotes[i % defaultQuotes.length],
    };
  });

  const handleRotateLeft = () => {
    soundFx.playPinClick();
    setCarouselAngle((prev) => prev - 60);
  };

  const handleRotateRight = () => {
    soundFx.playPinClick();
    setCarouselAngle((prev) => prev + 60);
  };

  const handleWindUpMusicBox = () => {
    soundFx.playSuccessChime();
    soundFx.startBackgroundMusic(config.musicPreset || 'music-box', config.audioUrl);
    setIsPlayingBox(true);
    setCarouselAngle((prev) => prev + 360);
  };

  return (
    <div className="relative w-full h-full min-h-[520px] sm:min-h-[620px] bg-slate-950 overflow-hidden select-none flex items-center justify-center p-4">
      {/* Deep Celestial Blue Ambient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-cyan-950/40 to-purple-950/60 pointer-events-none" />

      {/* Floating Snow & Crystal Sparkles */}
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-cyan-200/50 pointer-events-none blur-[0.5px]"
          style={{
            left: `${5 + ((i * 13) % 90)}%`,
            top: `${10 + ((i * 19) % 80)}%`,
          }}
          animate={{
            y: [-15, 20, -15],
            opacity: [0.2, 0.8, 0.2],
            scale: [0.6, 1.2, 0.6],
          }}
          transition={{
            duration: 4 + (i % 4) * 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Main Snow Globe Music Box Stage */}
      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-lg">
        {/* Crystal Globe Glass Dome */}
        <div className="relative w-72 sm:w-84 h-80 sm:h-96 rounded-t-full bg-gradient-to-b from-cyan-300/15 via-purple-300/10 to-transparent border-4 border-cyan-300/40 shadow-[0_0_80px_rgba(6,182,212,0.3)] backdrop-blur-sm overflow-hidden flex flex-col items-center justify-between p-4">
          {/* Glass Specular Glint */}
          <div className="absolute top-4 left-6 w-16 h-28 bg-white/20 rounded-full blur-md -rotate-45 pointer-events-none" />

          {/* Central Glowing Crystal Rose */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="text-4xl text-rose-400 drop-shadow-[0_0_20px_rgba(244,63,94,0.8)]"
            >
              🌹
            </motion.div>
            <div className="w-10 h-10 rounded-full bg-cyan-400/20 blur-lg mt-1" />
          </div>

          {/* 3D Cylindrical Photo Carousel Ring */}
          <div
            className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
            style={{ perspective: '1100px' }}
          >
            <motion.div
              animate={{ rotateY: carouselAngle }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="relative w-28 sm:w-32 h-36 sm:h-44 preserve-3d"
            >
              {panels.map((panel, idx) => {
                const angle = idx * 60; // 360 / 6 = 60 deg
                return (
                  <div
                    key={panel.id}
                    onClick={() => {
                      soundFx.playPinClick();
                      setSelectedItemIndex(panel.id);
                    }}
                    className="absolute inset-0 rounded-2xl p-2 bg-slate-900/90 border border-cyan-400/50 backdrop-blur-md shadow-xl flex flex-col items-center justify-between cursor-pointer hover:border-rose-400 transition-colors"
                    style={{
                      transform: `rotateY(${angle}deg) translateZ(120px)`,
                    }}
                  >
                    {panel.image ? (
                      <div className="w-full aspect-square rounded-xl overflow-hidden bg-black/40 border border-white/20">
                        <img src={panel.image} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full aspect-square rounded-xl bg-cyan-950/60 border border-cyan-400/30 flex items-center justify-center text-2xl">
                        💎
                      </div>
                    )}
                    <p className="text-[8px] font-bold text-cyan-200 text-center line-clamp-2 mt-1">
                      {panel.quote}
                    </p>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* Music Box Wooden Base with Brass Wind-up Key */}
        <div className="relative w-80 sm:w-96 h-18 bg-gradient-to-r from-amber-900 via-amber-700 to-amber-950 rounded-2xl border-2 border-amber-500/50 shadow-2xl flex items-center justify-between px-6 -mt-3 z-20">
          <div className="text-left">
            <p className="text-xs font-black text-amber-200 tracking-wider">HỘP NHẠC PHA LÊ</p>
            <p className="text-[10px] text-amber-400/70 truncate max-w-[150px]">
              Dành tặng {config.recipientName}
            </p>
          </div>

          {/* Wind-up Key Button */}
          <button
            onClick={handleWindUpMusicBox}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-amber-950 text-xs font-black flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all"
            title="Vặn dây cót phát nhạc"
          >
            <Key className={`w-3.5 h-3.5 ${isPlayingBox ? 'animate-spin' : 'rotate-45'}`} />
            <span>{isPlayingBox ? 'Hộp Nhạc Đang Xoay' : 'Vặn Cót Phát Nhạc'}</span>
          </button>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRotateLeft}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-cyan-300 hover:bg-slate-800 active:scale-95 transition-all text-xs font-bold flex items-center gap-1 shadow"
          >
            <span>← Quay Trái</span>
          </button>

          <button
            onClick={handleRotateRight}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-cyan-300 hover:bg-slate-800 active:scale-95 transition-all text-xs font-bold flex items-center gap-1 shadow"
          >
            <span>Quay Phải →</span>
          </button>
        </div>
      </div>

      {/* Selected Carousel Item Modal */}
      <AnimatePresence>
        {selectedItemIndex !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in"
            onClick={() => setSelectedItemIndex(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900/95 border border-cyan-400/50 p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl"
            >
              {panels[selectedItemIndex].image ? (
                <div className="w-full aspect-square rounded-2xl overflow-hidden border-2 border-cyan-300 shadow-xl">
                  <img
                    src={panels[selectedItemIndex].image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 mx-auto rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-4xl shadow-inner">
                  💎
                </div>
              )}

              <p className="text-sm font-serif italic text-cyan-100 leading-relaxed">
                "{config.mainText || panels[selectedItemIndex].quote}"
              </p>

              <div className="text-right text-xs font-bold text-rose-400">
                — {config.senderName} 🌹
              </div>

              <button
                onClick={() => setSelectedItemIndex(null)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-bold"
              >
                Tiếp tục quay hộp nhạc
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
