import { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, Gift, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CardConfig } from '../../types';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  config: CardConfig;
  mode: 'studio' | 'recipient';
}

function buildCards(config: CardConfig) {
  const userImages = config.images || [];

  const slides = [
    {
      stamp: '№ 01 • PREMIER SOUVENIR',
      caption: 'Khoảnh Khắc Ban Đầu',
      text: 'Những ngày đầu tiên gặp gỡ, nụ cười của em đã thắp sáng cả một góc trời bình yên...',
      img: userImages[0] || null,
      tapeColor: 'from-amber-200/90 to-amber-300/80',
    },
    {
      stamp: '№ 02 • LUMIÈRE ÉTERNELLE',
      caption: 'Kỷ Niệm Tỏa Nắng',
      text: 'Mỗi khoảnh khắc có em đồng hành đều biến những điều giản đơn nhất thành kỳ tích ngọt ngào.',
      img: userImages[1] || null,
      tapeColor: 'from-rose-200/90 to-pink-300/80',
    },
    {
      stamp: '№ 03 • DOUCE MÉMOIRE',
      caption: 'Ánh Sao Trong Mắt',
      text: 'Dù ngoài kia có bao biến chuyển, em vẫn luôn là đóa hoa kiều diễm và dịu dàng nhất.',
      img: userImages[2] || null,
      tapeColor: 'from-teal-200/90 to-emerald-300/80',
    },
    {
      stamp: '№ 04 • LETTRE DU CŒUR',
      caption: 'Tâm Thư Yêu Thương',
      text: config.mainText,
      img: userImages[3] || null,
      tapeColor: 'from-amber-300/90 to-yellow-400/80',
      isFinal: true,
    },
  ];

  return slides;
}

function PolaroidCard({ card, isTop, onSwipe, direction }: {
  card: ReturnType<typeof buildCards>[0];
  isTop: boolean;
  onSwipe: (dir: 'left' | 'right') => void;
  direction: 'left' | 'right' | null;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-16, 16]);
  const opacity = useTransform(x, [-250, 0, 250], [0.4, 1, 0.4]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (Math.abs(info.offset.x) > 90) {
      soundFx.playPaperSwoosh();
      onSwipe(info.offset.x > 0 ? 'right' : 'left');
    }
  };

  return (
    <motion.div
      className="absolute cursor-grab active:cursor-grabbing"
      style={{ x, rotate, opacity, touchAction: 'none' }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: -300, right: 300 }}
      onDragEnd={handleDragEnd}
      animate={direction ? { x: direction === 'left' ? -380 : 380, rotate: direction === 'left' ? -22 : 22, opacity: 0 } : {}}
      transition={direction ? { duration: 0.35, ease: 'easeInOut' } : {}}
    >
      {/* Heavy textured cardstock frame */}
      <div
        className="w-68 sm:w-76 p-3.5 pb-5 rounded-xl bg-[#faf7f2] border border-[#e5dec9] shadow-[0_20px_50px_rgba(0,0,0,0.45),0_2px_4px_rgba(0,0,0,0.1)] relative"
      >
        {/* Washi Tape at Top */}
        <div
          className={`absolute -top-3.5 left-1/2 -translate-x-1/2 w-28 h-7 bg-gradient-to-r ${card.tapeColor} backdrop-blur-sm border-t border-b border-white/60 shadow-sm rotate-[-1.5deg] z-20 flex items-center justify-center`}
          style={{
            clipPath: 'polygon(4% 0%, 96% 0%, 100% 100%, 0% 100%)',
          }}
        >
          <span className="text-[8px] tracking-[0.2em] font-black uppercase text-amber-950/70">
            ✦ MEMOIRE ✦
          </span>
        </div>

        {/* Brass Photo Corner Mounts */}
        <div className="absolute top-4 left-4 text-amber-700/70 text-[10px] select-none z-10">❖</div>
        <div className="absolute top-4 right-4 text-amber-700/70 text-[10px] select-none z-10">❖</div>

        {/* Photo Area */}
        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-900 border border-[#d8cfbe] shadow-inner">
          {card.img ? (
            <img src={card.img} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#2a1b18] to-[#120a09] text-amber-200">
              <Sparkles className="w-8 h-8 text-amber-300 mb-1 animate-pulse" />
              <span className="text-[11px] font-serif tracking-widest uppercase text-amber-300/80">Kỷ Niệm Đẹp</span>
            </div>
          )}
          {/* Subtle glossy sheen line */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
        </div>

        {/* Elegant Polaroid Caption Section */}
        <div className="pt-3 px-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-black tracking-[0.2em] uppercase text-amber-800/80 font-mono">
              {card.stamp}
            </span>
            {card.isFinal && <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />}
          </div>

          <h4 className="text-sm font-bold text-slate-800 font-serif mb-1">
            {card.caption}
          </h4>

          <p className="text-slate-600 text-xs leading-relaxed italic line-clamp-3"
            style={{ fontFamily: 'Playfair Display, serif' }}>
            "{card.text}"
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function PolaroidSwipeFX({ config, mode }: Props) {
  const cards = buildCards(config);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const handleSwipe = (dir: 'left' | 'right') => {
    setSwipeDir(dir);
    setTimeout(() => {
      const next = currentIdx + 1;
      if (next >= cards.length) {
        soundFx.playSuccessChime();
        confetti({
          particleCount: 120, spread: 100, origin: { y: 0.5 },
          colors: ['#FBBF24', '#F59E0B', '#EC4899', '#A855F7', '#FFFFFF'],
        });
        setIsComplete(true);
      } else {
        setCurrentIdx(next);
      }
      setSwipeDir(null);
    }, 350);
  };

  const handleReset = () => {
    setCurrentIdx(0);
    setSwipeDir(null);
    setIsComplete(false);
  };

  const visibleCards = cards.slice(currentIdx).slice(0, 3);

  return (
    <div className="relative w-full h-full min-h-[100%] flex flex-col items-center justify-center overflow-y-auto sm:overflow-hidden select-none p-3 sm:p-5"
      style={{ background: 'radial-gradient(ellipse at 50% 25%, #2c1810 0%, #170d08 55%, #0a0503 100%)' }}>

      {/* Floating golden motes */}
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.div key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-amber-400/30 pointer-events-none"
          style={{ left: `${(i * 17) % 95}%`, top: `${(i * 13) % 90}%` }}
          animate={{ y: [0, -20, 0], opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 3 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}

      <AnimatePresence mode="wait">
        {!isComplete ? (
          <motion.div key="stack" className="relative flex flex-col items-center gap-5 z-10 w-full max-w-sm px-4 my-auto"
            exit={{ opacity: 0, scale: 0.94 }}>

            {/* Header Badge */}
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-400/30 text-[11px] font-extrabold uppercase tracking-widest text-amber-300 shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                ALBUM KỶ NIỆM POLAROID
              </span>
              <h2 className="text-white text-2xl font-bold mt-2"
                style={{ fontFamily: config.fontFamily || 'Cinzel, Playfair Display, serif' }}>
                Gửi <span className="text-amber-300 drop-shadow">{config.recipientName}</span> 📸
              </h2>
              <p className="text-amber-200/50 text-xs mt-1">
                Trang {currentIdx + 1} / {cards.length} • Vuốt sang bên để lật ảnh
              </p>
            </div>

            {/* Polaroid Stack Area */}
            <div className="relative h-88 sm:h-96 w-72 sm:w-80 flex items-center justify-center">
              {/* Backing cards for 3D depth */}
              {visibleCards.slice(1).map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-xl bg-[#2e1d17] border border-amber-500/20 shadow-xl"
                  style={{
                    width: `${100 - (i + 1) * 6}%`,
                    height: `${100 - (i + 1) * 5}%`,
                    transform: `translateY(${(i + 1) * 10}px) rotate(${(i % 2 === 0 ? 1 : -1) * (i + 1) * 2.5}deg)`,
                    zIndex: 10 - i,
                  }}
                />
              ))}

              {/* Top active card */}
              {visibleCards.length > 0 && (
                <PolaroidCard
                  key={currentIdx}
                  card={visibleCards[0]}
                  isTop={true}
                  onSwipe={handleSwipe}
                  direction={swipeDir}
                />
              )}
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleSwipe('left')}
                className="w-11 h-11 rounded-full bg-amber-950/80 hover:bg-amber-900 border border-amber-400/30 flex items-center justify-center text-amber-200 transition-all active:scale-90 shadow-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Dots */}
              <div className="flex gap-1.5 px-3 py-1.5 rounded-full bg-black/40 border border-white/10">
                {cards.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === currentIdx
                        ? 'w-6 bg-amber-400'
                        : i < currentIdx
                        ? 'w-2 bg-amber-600'
                        : 'w-2 bg-white/20'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => handleSwipe('right')}
                className="w-11 h-11 rounded-full bg-amber-950/80 hover:bg-amber-900 border border-amber-400/30 flex items-center justify-center text-amber-200 transition-all active:scale-90 shadow-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {mode === 'studio' && (
              <button
                onClick={handleReset}
                className="text-xs text-amber-300/60 hover:text-amber-200 transition-colors font-semibold"
              >
                ↺ Đặt lại album
              </button>
            )}
          </motion.div>
        ) : (
          /* ─── FINAL REVEALED HEIRLOOM SCRAPBOOK ─── */
          <motion.div key="complete"
            className="w-full max-w-md flex flex-col items-center justify-center p-3 my-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}>

            {/* Revealed Badge */}
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
              className="mb-3 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 text-slate-950 font-black text-xs tracking-wider uppercase shadow-xl">
              <Gift className="w-4 h-4 text-slate-950" />
              <span>CUỐN ALBUM KỶ NIỆM HOÀN TẤT</span>
            </motion.div>

            {/* Gilded Heirloom Letter */}
            <div className="relative w-full rounded-[2.5rem] p-4 bg-gradient-to-b from-amber-200 via-amber-500 to-amber-700 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(245,158,11,0.3)] border border-amber-300">
              
              <div className="absolute top-2 left-2 text-amber-950 font-bold select-none">❖</div>
              <div className="absolute top-2 right-2 text-amber-950 font-bold select-none">❖</div>
              <div className="absolute bottom-2 left-2 text-amber-950 font-bold select-none">❖</div>
              <div className="absolute bottom-2 right-2 text-amber-950 font-bold select-none">❖</div>

              <div className="relative w-full rounded-[2rem] overflow-hidden bg-gradient-to-b from-[#24140e] via-[#170c08] to-[#0d0704] p-5 sm:p-6 border-2 border-amber-900/60 shadow-inner">
                {/* Header */}
                <div className="text-center mb-3">
                  <span className="text-[10px] font-extrabold tracking-[0.25em] text-amber-400 uppercase">
                    Tâm Thư Cuối • Gửi {config.recipientName}
                  </span>
                  <div className="h-px w-24 mx-auto my-2 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                </div>

                {/* Letter Body */}
                <p className="text-amber-100 text-sm leading-relaxed whitespace-pre-line text-center italic my-3"
                  style={{ fontFamily: config.fontFamily || 'Playfair Display, serif' }}>
                  "{config.mainText}"
                </p>

                {/* Signature */}
                <div className="flex items-center gap-1.5 mt-5 pt-3 border-t border-amber-400/20 justify-center">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span className="text-amber-300 font-bold text-sm tracking-wide">— {config.senderName} —</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="mt-4 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-amber-400/30 text-amber-200 text-xs font-semibold transition-all"
            >
              ↺ Mở lại từ trang đầu
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
