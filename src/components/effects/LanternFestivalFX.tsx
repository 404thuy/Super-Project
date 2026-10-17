import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Flame, Send, RotateCw, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CardConfig } from '../../types';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  config: CardConfig;
  mode: 'studio' | 'recipient';
}

export default function LanternFestivalFX({ config }: Props) {
  const [currentFace, setCurrentFace] = useState<number>(0); // 0, 1, 2, 3 (4 sides)
  const [isReleased, setIsReleased] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const userImages = config.images || [];

  const faces = [
    {
      id: 'side-1',
      title: 'Khoảnh Khắc Kỷ Niệm',
      type: 'image',
      image: userImages[0],
      fallbackText: 'Ánh sáng yêu thương thắp sáng màn đêm',
    },
    {
      id: 'side-2',
      title: 'Lời Chúc Bình An',
      type: 'text',
      content: config.mainText,
    },
    {
      id: 'side-3',
      title: 'Gửi Gắm Yêu Thương',
      type: 'image',
      image: userImages[1] || userImages[0],
      fallbackText: 'Mỗi lời nguyện ước đều nở hoa rạng rỡ',
    },
    {
      id: 'side-4',
      title: 'Tâm Nguyện Gửi Người Thương',
      type: 'signature',
      recipient: config.recipientName,
      sender: config.senderName,
    },
  ];

  const handleRotate = () => {
    soundFx.playPinClick();
    setHasInteracted(true);
    setCurrentFace((prev) => (prev + 1) % 4);
  };

  const handleReleaseLantern = () => {
    soundFx.playPaperSwoosh();
    setIsReleased(true);
    soundFx.playSuccessChime();

    confetti({
      particleCount: 100,
      spread: 100,
      origin: { y: 0.7 },
      colors: ['#F97316', '#FBBF24', '#FB7185', '#F59E0B'],
    });
  };

  return (
    <div className="relative w-full h-full min-h-[520px] sm:min-h-[620px] bg-slate-950 overflow-hidden select-none flex items-center justify-center p-4">
      {/* Night Sky with Warm Floating Lantern Stars */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950 to-orange-950/40 pointer-events-none" />

      {/* Floating Distant Lanterns */}
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${5 + ((i * 17) % 90)}%`,
            top: `${10 + ((i * 23) % 75)}%`,
            width: `${6 + (i % 3) * 4}px`,
            height: `${9 + (i % 3) * 6}px`,
            background: 'radial-gradient(circle, #fde047 30%, #ea580c 90%)',
            boxShadow: '0 0 14px rgba(251, 146, 60, 0.8)',
          }}
          animate={{
            y: [-10, -50, -10],
            x: [0, (i % 2 === 0 ? 12 : -12), 0],
            opacity: [0.3, 0.9, 0.3],
          }}
          transition={{
            duration: 6 + (i % 5) * 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Main Sky Lantern Container */}
      <motion.div
        animate={
          isReleased
            ? { y: -600, scale: 0.5, opacity: 0.85 }
            : { y: [0, -12, 0] }
        }
        transition={
          isReleased
            ? { duration: 4.5, ease: 'easeInOut' }
            : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
        }
        className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm"
      >
        {/* Lantern 3D Body (Octagonal / Quadrilateral Glow Structure) */}
        <div
          className="relative w-72 sm:w-80 h-96 sm:h-[400px] rounded-[36px] p-6 flex flex-col justify-between shadow-[0_0_60px_rgba(249,115,22,0.45)] border-2 border-amber-500/50 overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 50% 65%, rgba(254, 240, 138, 0.95) 0%, rgba(249, 115, 22, 0.85) 60%, rgba(154, 52, 18, 0.95) 100%)',
            perspective: '1000px',
          }}
        >
          {/* Top Wooden Rim Ring */}
          <div className="absolute top-0 inset-x-0 h-4 bg-amber-900 border-b border-amber-600/50 shadow-inner" />

          {/* Inner Flickering Flame Core */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10">
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
              className="text-amber-500 drop-shadow-[0_0_15px_rgba(251,191,36,1)]"
            >
              <Flame className="w-8 h-8 fill-amber-400 text-yellow-200" />
            </motion.div>
          </div>

          {/* Translucent Silk Paper Face Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFace}
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -90 }}
              transition={{ duration: 0.5 }}
              className="relative z-20 flex-1 flex flex-col justify-between py-3 text-amber-950"
            >
              {/* Header Label */}
              <div className="text-center">
                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-950/20 text-amber-900 px-3 py-1 rounded-full border border-amber-900/30">
                  Mặt {currentFace + 1}/4 • {faces[currentFace].title}
                </span>
              </div>

              {/* Face Type 1: Image / Photo */}
              {faces[currentFace].type === 'image' && (
                <div className="flex-1 my-3 flex flex-col items-center justify-center">
                  {faces[currentFace].image ? (
                    <div className="w-44 h-44 rounded-2xl overflow-hidden border-2 border-amber-900/40 shadow-lg bg-black/20">
                      <img
                        src={faces[currentFace].image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="text-center p-4 space-y-2">
                      <div className="text-4xl">🏮</div>
                      <p className="text-xs font-bold text-amber-900">
                        {faces[currentFace].fallbackText}
                      </p>
                    </div>
                  )}
                  <p className="text-[11px] font-bold text-amber-900 mt-2">
                    Kỷ niệm bên {config.recipientName}
                  </p>
                </div>
              )}

              {/* Face Type 2: Calligraphic Main Text */}
              {faces[currentFace].type === 'text' && (
                <div className="flex-1 my-3 flex flex-col justify-center text-center p-2">
                  <p
                    className="text-base sm:text-lg leading-relaxed font-serif text-amber-950 font-bold whitespace-pre-line"
                    style={{ fontFamily: config.fontFamily ? `${config.fontFamily}, 'Be Vietnam Pro', sans-serif` : "'Be Vietnam Pro', sans-serif" }}
                  >
                    "{faces[currentFace].content}"
                  </p>
                </div>
              )}

              {/* Face Type 3: Signature & Dedication */}
              {faces[currentFace].type === 'signature' && (
                <div className="flex-1 my-3 flex flex-col justify-center items-center text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-amber-900/20 border-2 border-amber-900/40 flex items-center justify-center text-amber-900 text-2xl shadow-inner">
                    <Heart className="w-7 h-7 fill-amber-800 text-amber-800" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-amber-950">
                      Gửi {config.recipientName}
                    </h3>
                    <p className="text-xs font-bold text-amber-900 mt-1">
                      Chúc ngày 20/10 vạn sự an lành, luôn rạng ngời như ánh đèn đêm!
                    </p>
                  </div>
                  <p className="text-sm font-black italic text-amber-900">
                    — {config.senderName} 🏮
                  </p>
                </div>
              )}

              {/* Bottom Wooden Rim */}
              <div className="text-center pt-2 border-t border-amber-900/20 text-[9px] font-bold text-amber-900/70">
                Đèn Lồng Ước Nguyện 20/10
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bottom Rim */}
          <div className="absolute bottom-0 inset-x-0 h-4 bg-amber-900 border-t border-amber-600/50 shadow-inner" />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRotate}
            className="px-4 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
          >
            <RotateCw className="w-4 h-4" />
            <span>Xoay Mặt Đèn 3D</span>
          </button>

          {!isReleased && (
            <button
              onClick={handleReleaseLantern}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Thả Đèn Lên Bầu Trời</span>
            </button>
          )}
        </div>

        {!hasInteracted && !isReleased && (
          <p className="text-[11px] text-amber-300/80 animate-pulse text-center">
            💡 Chạm "Xoay Mặt Đèn 3D" để đọc đủ 4 mặt kỷ niệm & lời chúc trước khi thả
          </p>
        )}

        {isReleased && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-200 text-xs font-bold flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            <span>Đèn trời mang theo ước nguyện đã hòa vào ngàn vì sao! ✨</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
