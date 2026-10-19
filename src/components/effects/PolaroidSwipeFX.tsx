import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, Gift, Sparkles, RotateCcw, Camera, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CardConfig } from '../../types';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  config: CardConfig;
  mode: 'studio' | 'recipient';
}

const DEFAULT_POLAROID_PHOTOS = [
  '/templates/polaroid-swipe.jpg',
  '/templates/blossom-rain.jpg',
  '/templates/bouquet-3d.jpg',
  '/templates/foggy-mirror.jpg',
];

interface SlideData {
  id: number;
  stamp: string;
  dateStr: string;
  handwrittenTitle: string;
  caption: string;
  text: string;
  backNote: string;
  img: string;
  tapeColor: string;
  tiltDeg: number;
  clipSide: 'left' | 'right';
  isFinal?: boolean;
}

const TAPE_COLORS = [
  'from-amber-200/95 via-amber-300/90 to-amber-200/95',
  'from-rose-200/95 via-pink-300/90 to-rose-200/95',
  'from-emerald-200/95 via-teal-300/90 to-emerald-200/95',
  'from-purple-200/95 via-fuchsia-300/90 to-purple-200/95',
  'from-sky-200/95 via-blue-300/90 to-sky-200/95',
  'from-amber-300/95 via-yellow-400/90 to-amber-300/95',
];

const TILT_ANGLES = [-2.8, 3.4, -2.1, 2.5, -3.2, 1.8, -2.4, 3.1];

const DEFAULT_TITLES = [
  'Ánh mắt đầu tiên...',
  'Nắng ấm bên đời ✨',
  'Bầu trời dịu êm 🌸',
  'Nụ cười tỏa nắng ☀️',
  'Khoảnh khắc an yên ☕',
  'Đóa hoa kiều diễm 🌹',
  'Hạnh phúc giản đơn 💫',
  'Gửi trọn yêu thương ❤️',
];

const DEFAULT_TEXTS = [
  'Những ngày đầu tiên gặp gỡ, nụ cười của em đã thắp sáng cả một góc trời bình yên trong anh.',
  'Mỗi khoảnh khắc có em đồng hành đều biến những điều giản đơn nhất thành kỳ tích ngọt ngào.',
  'Dù ngoài kia có bao biến chuyển, em vẫn luôn là đóa hoa kiều diễm và dịu dàng nhất.',
  'Mỗi tách trà, mỗi bước chân cùng em đều là những ký ức anh muốn nâng niu mãi mãi.',
  'Chúc em ngày 20/10 ngập tràn niềm vui, nhận được thật nhiều hoa và yêu thương trọn vẹn!',
  'Cảm ơn em vì đã đến và vẽ thêm muôn ngàn sắc màu rực rỡ vào bức tranh cuộc đời anh.',
];

const DEFAULT_BACK_NOTES = [
  'Bức ảnh này lưu giữ khoảnh khắc nụ cười trong trẻo nhất của em. Mong em luôn giữ mãi nét tươi vui ấy!',
  'Có những ngày mệt mỏi ngoài kia, chỉ cần nhìn thấy em là mọi lo toan dường như tan biến hết.',
  'Cảm ơn em vì đã đến và vẽ thêm muôn ngàn sắc màu rực rỡ vào bức tranh cuộc đời anh.',
  'Gửi người phụ nữ tuyệt vời nhất của anh: Hãy luôn hạnh phúc, bình yên và tỏa sáng rực rỡ mỗi ngày nhé!',
  'Dù thời gian có trôi đi, những ký ức ngọt ngào này sẽ luôn vẹn nguyên như ngày đầu.',
  'Chúc em một ngày 20/10 thật hạnh phúc, ngập tràn hoa tươi và nụ cười luôn nở trên môi!',
];

function buildCards(config: CardConfig): SlideData[] {
  const userImages = config.images || [];
  const userCaptions = config.polaroidCaptions || [];
  const userNotes = config.polaroidNotes || [];

  const count = Math.max(userImages.length, userCaptions.length, userNotes.length, 4);

  return Array.from({ length: count }).map((_, i) => {
    const isFinal = i === count - 1;
    return {
      id: i + 1,
      stamp: isFinal ? '№ 04 • LETTRE DU CŒUR' : `№ 0${(i % 9) + 1} • SOUVENIR D'AMOUR`,
      dateStr: i === 0 ? '20 • 10 • 2026' : `KỶ NIỆM 0${i + 1} • 20/10`,
      handwrittenTitle: userCaptions[i] || DEFAULT_TITLES[i % DEFAULT_TITLES.length],
      caption: `Trang ${i + 1} • Kỷ Niệm`,
      text: isFinal ? (config.mainText || DEFAULT_TEXTS[i % DEFAULT_TEXTS.length]) : DEFAULT_TEXTS[i % DEFAULT_TEXTS.length],
      backNote: userNotes[i] || DEFAULT_BACK_NOTES[i % DEFAULT_BACK_NOTES.length],
      img: userImages[i] || DEFAULT_POLAROID_PHOTOS[i % DEFAULT_POLAROID_PHOTOS.length],
      tapeColor: TAPE_COLORS[i % TAPE_COLORS.length],
      tiltDeg: TILT_ANGLES[i % TILT_ANGLES.length],
      clipSide: i % 2 === 0 ? 'left' : 'right',
      isFinal,
    };
  });
}

// ─── FLOATING ROSE PETAL COMPONENT ───
function FloatingPetal({ index }: { index: number }) {
  const startX = (index * 23) % 96;
  const duration = 7 + (index % 5) * 1.5;
  const delay = (index * 0.7) % 4;
  const size = 14 + (index % 4) * 5;

  return (
    <motion.div
      className="absolute pointer-events-none select-none z-0"
      style={{
        left: `${startX}%`,
        top: '-5%',
      }}
      animate={{
        y: ['0vh', '115vh'],
        x: [0, (index % 2 === 0 ? 1 : -1) * 35, 0],
        rotate: [0, 180 + index * 45, 360],
        rotateY: [0, 180, 360],
        opacity: [0, 0.65, 0.75, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: 'easeInOut',
      }}
    >
      <div
        style={{
          width: `${size}px`,
          height: `${size * 1.3}px`,
          background: 'radial-gradient(ellipse at 35% 25%, #ff4d6d 0%, #c9184a 55%, #800f2f 100%)',
          borderRadius: '50% 50% 50% 0',
          transform: 'rotate(-45deg)',
          boxShadow: '0 4px 10px rgba(128, 15, 47, 0.35)',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
        }}
      />
    </motion.div>
  );
}

// ─── AUTHENTIC POLAROID CARD (FRONT & BACK 3D FLIP) ───
function PolaroidCardView({
  card,
  isTop,
  onSwipe,
  direction,
}: {
  card: SlideData;
  isTop: boolean;
  onSwipe: (dir: 'left' | 'right') => void;
  direction: 'left' | 'right' | null;
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 0, 260], [-20, card.tiltDeg, 20]);
  const y = useTransform(x, [-260, 0, 260], [18, 0, 18]);
  const opacity = useTransform(x, [-320, -180, 0, 180, 320], [0.25, 0.9, 1, 0.9, 0.25]);
  const heartOpacity = useTransform(x, [35, 130], [0, 1]);
  const nextOpacity = useTransform(x, [-35, -130], [0, 1]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (Math.abs(info.offset.x) > 75 || Math.abs(info.velocity.x) > 350) {
      soundFx.playPaperSwoosh();
      onSwipe(info.offset.x > 0 ? 'right' : 'left');
    }
  };

  const handleFlipCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playPaperSwoosh();
    setIsFlipped(!isFlipped);
  };

  const finalSrc = imgError ? DEFAULT_POLAROID_PHOTOS[0] : card.img;

  return (
    <motion.div
      className={`absolute select-none ${isTop ? 'cursor-grab active:cursor-grabbing z-30' : 'pointer-events-none'}`}
      style={{
        x,
        y,
        rotate: isTop ? rotate : card.tiltDeg,
        opacity,
        touchAction: 'none',
        perspective: 1200,
      }}
      drag={isTop && !isFlipped ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.75}
      onDragEnd={handleDragEnd}
      animate={
        direction
          ? {
              x: direction === 'left' ? -540 : 540,
              rotate: direction === 'left' ? -38 : 38,
              opacity: 0,
              y: 60,
            }
          : {}
      }
      transition={direction ? { duration: 0.38, ease: [0.32, 0.72, 0, 1] } : {}}
      whileTap={isTop && !isFlipped ? { scale: 0.99 } : {}}
    >
      <motion.div
        className="relative"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* ════════════════════════════════════════════════
            FRONT FACE (AUTHENTIC POLAROID PHOTO)
           ════════════════════════════════════════════════ */}
        <div
          className="w-[295px] sm:w-[335px] p-3 sm:p-3.5 pb-5 sm:pb-6 rounded-2xl bg-[#fefcf8] relative border border-[#e8dfcf]"
          style={{
            backfaceVisibility: 'hidden',
            boxShadow:
              '0 30px 70px -15px rgba(0,0,0,0.8), 0 10px 25px -5px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.95), inset 0 2px 4px rgba(0,0,0,0.04)',
          }}
        >
          {/* Authentic Baryta Paper Grain Finish */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none opacity-30 mix-blend-multiply"
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 50%, rgba(210,195,170,0.25) 1px, transparent 1px)',
              backgroundSize: '6px 6px',
            }}
          />

          {/* Rose Gold / Wooden Paper Clip on the edge */}
          <div
            className={`absolute -top-3.5 ${
              card.clipSide === 'left' ? 'left-6' : 'right-6'
            } z-30 pointer-events-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)]`}
          >
            <div className="w-4 h-9 rounded-full border-2 border-amber-300/90 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 shadow-inner flex flex-col items-center">
              <div className="w-2 h-5 rounded-full border border-amber-700/60 mt-1" />
            </div>
          </div>

          {/* Authentic Translucent Washi Masking Tape in the Center */}
          <div
            className={`absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-6 sm:h-7 bg-gradient-to-r ${card.tapeColor} backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.22)] rotate-[-1deg] z-20 flex items-center justify-center`}
            style={{
              clipPath:
                'polygon(0% 0%, 100% 0%, 98% 25%, 100% 50%, 98% 75%, 100% 100%, 0% 100%, 2% 75%, 0% 50%, 2% 25%)',
            }}
          >
            <span className="text-[9px] tracking-[0.25em] font-extrabold uppercase text-amber-950/85 drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]">
              ✦ SOUVENIR ✦
            </span>
          </div>

          {/* ─── CLASSIC 1:1 SQUARE PHOTO AREA ─── */}
          <div
            className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-950 border border-[#ded4c1]"
            style={{
              boxShadow:
                'inset 0 3px 10px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(0,0,0,0.25)',
            }}
          >
            {/* Loading Skeleton */}
            <div
              className={`absolute inset-0 bg-gradient-to-br from-amber-950/40 via-slate-900 to-amber-950/60 flex items-center justify-center transition-opacity duration-500 ${
                imgLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              <Sparkles className="w-7 h-7 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
            </div>

            <img
              src={finalSrc}
              alt={card.caption}
              loading="eager"
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              onError={() => {
                setImgError(true);
                setImgLoaded(true);
              }}
              className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                imgLoaded ? 'scale-100' : 'scale-105 blur-sm'
              }`}
            />

            {/* Glossy Diagonal Light Sheen bar */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                background:
                  'linear-gradient(125deg, transparent 20%, rgba(255,255,255,0.75) 45%, rgba(255,255,255,0.25) 50%, transparent 65%)',
              }}
            />

            {/* Authentic Vintage Vignette Edge */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

            {/* Interactive Swiping Badges */}
            {isTop && !isFlipped && (
              <>
                <motion.div
                  className="absolute top-3 right-3 px-3 py-1 rounded-full bg-rose-500/90 backdrop-blur-md text-white text-[11px] font-bold shadow-xl flex items-center gap-1.5 border border-white/40 pointer-events-none"
                  style={{ opacity: heartOpacity }}
                >
                  <Heart className="w-3.5 h-3.5 fill-white" />
                  <span>YÊU THÍCH</span>
                </motion.div>

                <motion.div
                  className="absolute top-3 left-3 px-3 py-1 rounded-full bg-amber-400/95 backdrop-blur-md text-slate-950 text-[11px] font-black shadow-xl flex items-center gap-1.5 border border-white/40 pointer-events-none"
                  style={{ opacity: nextOpacity }}
                >
                  <span>TIẾP THEO</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                </motion.div>
              </>
            )}

            {/* Flip Card Button in Top Right */}
            <button
              onClick={handleFlipCard}
              title="Lật xem lời chúc ẩn ở mặt sau"
              className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/85 text-amber-200 text-[10px] font-semibold backdrop-blur-md border border-white/20 transition-all flex items-center gap-1 shadow-lg active:scale-90"
            >
              <RefreshCw className="w-3 h-3 text-amber-300" />
              <span>Lật mặt sau</span>
            </button>
          </div>

          {/* ─── GENEROUS POLAROID BOTTOM MARGIN ─── */}
          <div className="pt-3.5 px-1 pb-1">
            {/* Header Stamp Line */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-black tracking-[0.2em] uppercase text-amber-900/80 font-mono">
                {card.stamp}
              </span>
              <div className="px-2 py-0.5 rounded border border-rose-800/40 bg-rose-50/90 text-[8px] font-bold text-rose-950 uppercase tracking-widest flex items-center gap-1">
                <Camera className="w-2.5 h-2.5 text-rose-600" />
                <span>{card.dateStr}</span>
              </div>
            </div>

            {/* Handwritten Title in Dancing Script font */}
            <h3
              className="text-2xl sm:text-[26px] font-bold text-stone-900 leading-tight mb-1"
              style={{
                fontFamily: '"Dancing Script", cursive',
                letterSpacing: '0.02em',
                textShadow: '0 1px 1px rgba(0,0,0,0.06)',
              }}
            >
              {card.handwrittenTitle}
            </h3>

            {/* Printed Typewriter/Serif Excerpt */}
            <p
              className="text-stone-600 text-[12px] sm:text-[13px] leading-relaxed italic line-clamp-2"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              "{card.text}"
            </p>
          </div>

          {/* Red Wax Seal Emblem at Bottom Right */}
          <div className="absolute bottom-3 right-3 opacity-30 pointer-events-none">
            <div className="w-6 h-6 rounded-full border border-rose-900/50 flex items-center justify-center text-[7px] font-black text-rose-900 font-mono">
              ★ 20/10
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════
            BACK FACE (RETRO POSTCARD / SECRET MEMOIR)
           ════════════════════════════════════════════════ */}
        <div
          className="absolute inset-0 w-[295px] sm:w-[335px] p-4 sm:p-5 rounded-2xl bg-[#f4ece1] border border-[#d6c7b0] flex flex-col justify-between"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            boxShadow:
              '0 30px 70px -15px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.7)',
          }}
        >
          {/* Postcard Header */}
          <div className="flex items-start justify-between border-b-2 border-stone-400/40 pb-3">
            <div>
              <span className="text-[10px] font-mono font-black tracking-widest text-amber-950/70 uppercase">
                CARTE POSTALE 💌
              </span>
              <p className="text-[11px] text-stone-500 font-serif italic">Trạm Ký Ức 20/10</p>
            </div>

            {/* Vintage Rose Stamp */}
            <div className="w-11 h-14 border-2 border-dashed border-rose-800/60 bg-rose-50/80 p-1 flex flex-col items-center justify-center rounded-sm shadow-sm rotate-3">
              <span className="text-[14px]">🌹</span>
              <span className="text-[7px] font-black text-rose-900 font-mono mt-0.5">20/10/26</span>
            </div>
          </div>

          {/* Handwritten Secret Message */}
          <div className="my-3 px-1">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block mb-1 font-mono">
              ✦ Lời Nhắn Kỷ Niệm:
            </span>
            <p
              className="text-stone-800 text-[16px] sm:text-[18px] leading-relaxed italic"
              style={{ fontFamily: '"Dancing Script", cursive' }}
            >
              "{card.backNote}"
            </p>
          </div>

          {/* Postcard Footer */}
          <div className="pt-2 border-t border-stone-300 flex items-center justify-between">
            <button
              onClick={handleFlipCard}
              className="px-3 py-1 rounded-full bg-stone-900 text-amber-200 text-xs font-semibold hover:bg-stone-800 transition-colors flex items-center gap-1 shadow"
            >
              <RefreshCw className="w-3 h-3 text-amber-400" />
              <span>Xem mặt ảnh</span>
            </button>

            <span className="text-[11px] font-bold text-rose-800 font-mono">
              #Thiep20Thang10
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── AUTHENTIC BACKING POLAROID STACK CARD (MULTI-LAYER DEPTH) ───
function BackingPolaroidCard({
  card,
  depthIndex,
}: {
  card: SlideData;
  depthIndex: number;
}) {
  const scale = Math.max(0.82, 1 - depthIndex * 0.045);
  const yOffset = depthIndex * 9;
  const rotation =
    depthIndex % 2 === 1
      ? (card.tiltDeg > 0 ? -3.6 - depthIndex * 0.6 : 3.6 + depthIndex * 0.6)
      : (card.tiltDeg > 0 ? 4.4 + depthIndex * 0.5 : -4.4 - depthIndex * 0.5);
  const zIndex = Math.max(1, 26 - depthIndex * 5);

  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={{ zIndex }}
      initial={false}
      animate={{ scale, y: yOffset, rotate: rotation }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
    >
      <div
        className="w-[295px] sm:w-[335px] p-3 sm:p-3.5 pb-5 sm:pb-6 rounded-2xl bg-[#faf6ee] relative border border-[#e4d9c7]"
        style={{
          boxShadow: `0 ${20 - depthIndex * 3}px ${45 - depthIndex * 6}px -10px rgba(0,0,0,${
            0.7 - depthIndex * 0.08
          }), 0 6px 16px rgba(0,0,0,0.3)`,
        }}
      >
        {/* Washi Tape */}
        <div
          className={`absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-gradient-to-r ${card.tapeColor} opacity-70 shadow-sm rotate-[1deg] z-10`}
          style={{
            clipPath:
              'polygon(0% 0%, 100% 0%, 98% 25%, 100% 50%, 98% 75%, 100% 100%, 0% 100%, 2% 75%, 0% 50%, 2% 25%)',
          }}
        />

        {/* 1:1 Square Photo Container */}
        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-900/90 border border-[#d8cdb8]">
          <img
            src={card.img}
            alt=""
            className="w-full h-full object-cover opacity-75 filter contrast-90 brightness-95"
          />
          <div className="absolute inset-0 bg-amber-950/20 mix-blend-multiply" />
        </div>

        {/* Caption placeholder */}
        <div className="pt-3.5 px-1">
          <div className="h-2 w-20 bg-amber-950/20 rounded mb-2" />
          <div className="h-4 w-40 bg-amber-950/30 rounded mb-1" />
          <div className="h-2.5 w-52 bg-amber-950/15 rounded" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── MAIN POLAROID SWIPE EFFECT ───
export default function PolaroidSwipeFX({ config, mode }: Props) {
  const cards = buildCards(config);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const isSwipingRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isComplete) return;
      if (e.key === 'ArrowLeft') handleSwipe('left');
      if (e.key === 'ArrowRight') handleSwipe('right');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx, isComplete]);

  const handleSwipe = (dir: 'left' | 'right') => {
    if (isSwipingRef.current || isComplete) return;
    isSwipingRef.current = true;
    setSwipeDir(dir);

    setTimeout(() => {
      const next = currentIdx + 1;
      if (next >= cards.length) {
        soundFx.playSuccessChime();
        confetti({
          particleCount: 160,
          spread: 120,
          origin: { y: 0.5 },
          colors: ['#FBBF24', '#F59E0B', '#EC4899', '#A855F7', '#FFFFFF', '#10B981', '#E11D48'],
        });
        setIsComplete(true);
      } else {
        setCurrentIdx(next);
      }
      setSwipeDir(null);
      isSwipingRef.current = false;
    }, 380);
  };

  const handleReset = () => {
    setCurrentIdx(0);
    setSwipeDir(null);
    setIsComplete(false);
  };

  const activeCard = cards[currentIdx];
  const backingCards = cards.slice(currentIdx + 1, currentIdx + 5);

  return (
    <div
      className="relative w-full h-full min-h-[100%] flex flex-col items-center justify-center overflow-y-auto sm:overflow-hidden select-none p-3 sm:p-5"
      style={{
        background:
          'radial-gradient(ellipse at 50% 25%, #2c160e 0%, #190e09 55%, #0a0503 100%)',
      }}
    >
      {/* ─── REALISTIC FLOATING ROSE PETALS ─── */}
      {Array.from({ length: 9 }).map((_, i) => (
        <FloatingPetal key={i} index={i} />
      ))}

      {/* Luxury Ambient Candle Vignette */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[520px] h-[380px] bg-amber-500/12 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[560px] h-[240px] bg-rose-500/10 blur-[110px] pointer-events-none rounded-full" />

      {/* Floating Golden Dust Motes */}
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-amber-300 pointer-events-none"
          style={{
            width: `${1.5 + (i % 3)}px`,
            height: `${1.5 + (i % 3)}px`,
            left: `${(i * 19) % 94}%`,
            top: `${(i * 17) % 90}%`,
            opacity: 0.2 + (i % 4) * 0.1,
            boxShadow: '0 0 8px rgba(251, 191, 36, 0.7)',
          }}
          animate={{
            y: [0, -32 - (i % 18), 0],
            x: [0, (i % 2 === 0 ? 1 : -1) * 14, 0],
            opacity: [0.15, 0.55, 0.15],
          }}
          transition={{
            duration: 4.5 + (i % 5),
            repeat: Infinity,
            delay: (i * 0.3) % 3,
            ease: 'easeInOut',
          }}
        />
      ))}

      <AnimatePresence mode="wait">
        {!isComplete ? (
          <motion.div
            key="stack-stage"
            className="relative flex flex-col items-center gap-3.5 sm:gap-4 z-10 w-full max-w-sm px-3 my-auto"
            exit={{ opacity: 0, scale: 0.93 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header Badge & Title */}
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-950/90 border border-amber-400/40 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-amber-300 shadow-xl backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                ALBUM KỶ NIỆM POLAROID
              </span>
              <h2
                className="text-white text-xl sm:text-2xl font-bold mt-1.5 tracking-tight drop-shadow-md"
                style={{ fontFamily: config.fontFamily || 'Cinzel, "Playfair Display", serif' }}
              >
                Gửi <span className="text-amber-300 drop-shadow">{config.recipientName || 'Em Yêu'}</span> 📸
              </h2>
              <p className="text-amber-200/60 text-xs mt-0.5 flex items-center justify-center gap-1.5">
                <span>Ảnh {currentIdx + 1} / {cards.length}</span>
                <span>•</span>
                <span className="text-amber-300/80 font-medium">Xấp {cards.length} ảnh • Vuốt hoặc lật mặt sau</span>
              </p>
            </div>

            {/* ─── 3D MULTI-LAYER POLAROID STACK CONTAINER ─── */}
            <div className="relative h-[430px] sm:h-[470px] w-[305px] sm:w-[345px] flex items-center justify-center my-0.5">
              {/* Backing Cards rendered from deepest to shallowest */}
              {backingCards
                .slice()
                .reverse()
                .map((bCard, revIdx, arr) => {
                  const depth = arr.length - revIdx;
                  return <BackingPolaroidCard key={bCard.id} card={bCard} depthIndex={depth} />;
                })}

              {/* Top Active Card */}
              {activeCard && (
                <PolaroidCardView
                  key={activeCard.id}
                  card={activeCard}
                  isTop={true}
                  onSwipe={handleSwipe}
                  direction={swipeDir}
                />
              )}
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-3 sm:gap-4 mt-0.5">
              <button
                onClick={() => handleSwipe('left')}
                title="Lật sang trái"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-b from-amber-900/90 to-amber-950/95 hover:from-amber-800 hover:to-amber-900 border border-amber-400/40 flex items-center justify-center text-amber-200 transition-all active:scale-90 shadow-[0_8px_20px_rgba(0,0,0,0.5)] group"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              </button>

              {/* Progress Dots */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 border border-amber-400/20 backdrop-blur-md shadow-inner">
                {cards.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (i !== currentIdx) {
                        soundFx.playPaperSwoosh();
                        setCurrentIdx(i);
                      }
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === currentIdx
                        ? 'w-6 bg-gradient-to-r from-amber-300 to-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                        : i < currentIdx
                        ? 'w-2 bg-amber-600/70 hover:bg-amber-500'
                        : 'w-2 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => handleSwipe('right')}
                title="Lật sang phải"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-b from-amber-900/90 to-amber-950/95 hover:from-amber-800 hover:to-amber-900 border border-amber-400/40 flex items-center justify-center text-amber-200 transition-all active:scale-90 shadow-[0_8px_20px_rgba(0,0,0,0.5)] group"
              >
                <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {mode === 'studio' && (
              <button
                onClick={handleReset}
                className="text-xs text-amber-300/60 hover:text-amber-200 transition-colors font-medium flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Xem lại từ trang đầu</span>
              </button>
            )}
          </motion.div>
        ) : (
          /* ─── FINAL REVEALED HEIRLOOM SCRAPBOOK ─── */
          <motion.div
            key="complete-stage"
            className="w-full max-w-md flex flex-col items-center justify-center p-3 my-auto z-10"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          >
            {/* Congratulatory Ribbon Badge */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mb-3.5 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs tracking-wider uppercase shadow-[0_10px_25px_rgba(245,158,11,0.4)] border border-amber-200"
            >
              <Gift className="w-4 h-4 text-slate-950" />
              <span>CUỐN ALBUM KỶ NIỆM HOÀN TẤT</span>
            </motion.div>

            {/* Gilded Heirloom Letter Card */}
            <div className="relative w-full rounded-[2.5rem] p-3.5 sm:p-4 bg-gradient-to-b from-amber-200 via-amber-500 to-amber-700 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(245,158,11,0.3)] border border-amber-300">
              {/* Baroque corner accents */}
              <div className="absolute top-2 left-2 text-amber-950 font-bold select-none text-xs">❖</div>
              <div className="absolute top-2 right-2 text-amber-950 font-bold select-none text-xs">❖</div>
              <div className="absolute bottom-2 left-2 text-amber-950 font-bold select-none text-xs">❖</div>
              <div className="absolute bottom-2 right-2 text-amber-950 font-bold select-none text-xs">❖</div>

              <div className="relative w-full rounded-[2rem] overflow-hidden bg-gradient-to-b from-[#24140e] via-[#170c08] to-[#0d0704] p-5 sm:p-6 border-2 border-amber-900/60 shadow-inner">
                {/* Header */}
                <div className="text-center mb-3">
                  <span className="text-[10px] font-extrabold tracking-[0.25em] text-amber-400 uppercase">
                    ✦ TÂM THƯ NIÊM PHONG ✦
                  </span>
                  <div className="h-px w-24 mx-auto my-2 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                  <h3
                    className="text-xl sm:text-2xl font-bold text-white mt-1"
                    style={{ fontFamily: config.fontFamily || 'Cinzel, Playfair Display, serif' }}
                  >
                    Gửi {config.recipientName || 'Em'} 💌
                  </h3>
                </div>

                {/* Letter Body */}
                <p
                  className="text-amber-100 text-sm sm:text-base leading-relaxed whitespace-pre-line text-center italic my-4"
                  style={{ fontFamily: config.fontFamily || '"Playfair Display", serif' }}
                >
                  "{config.mainText}"
                </p>

                {/* Signature */}
                <div className="flex items-center gap-2 mt-5 pt-3 border-t border-amber-400/20 justify-center">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span className="text-amber-300 font-bold text-sm tracking-wide">
                    — {config.senderName || 'Người gửi'} —
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleReset}
                className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-amber-400/30 text-amber-200 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-lg active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Mở lại từ trang đầu</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


