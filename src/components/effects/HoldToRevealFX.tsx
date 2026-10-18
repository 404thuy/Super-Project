import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CardConfig } from '../../types';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  config: CardConfig;
  mode: 'studio' | 'recipient';
}

const LOADING_TEXTS = [
  'Đang khởi động phong ấn hoàng gia...',
  'Quét vân tay trái tim thiên thần...',
  'Hòa nhịp tần số yêu thương...',
  'Nén 999 đóa hồng nhung...',
  'Truyền năng lượng ánh sáng vĩnh cửu...',
  'Sắp mở khóa bức mật thư...',
  'Năng lượng đạt cực đại! ⚜️',
];

const HOLD_DURATION = 2800; // ms to fully charge

export default function HoldToRevealFX({ config, mode }: Props) {
  const [progress, setProgress] = useState(0); // 0-100
  const [isHolding, setIsHolding] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);

  const holdStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const vibrateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const userImages = config.images || [];

  const triggerReveal = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
    if (vibrateIntervalRef.current) clearInterval(vibrateIntervalRef.current);

    setProgress(100);
    setIsHolding(false);
    soundFx.playSuccessChime();

    const colors = ['#FBBF24', '#F59E0B', '#EC4899', '#A855F7', '#FFFFFF'];
    confetti({ particleCount: 120, spread: 100, origin: { y: 0.55 }, colors });
    setTimeout(() => confetti({ particleCount: 70, angle: 60, spread: 70, origin: { x: 0.1, y: 0.6 }, colors }), 200);
    setTimeout(() => confetti({ particleCount: 70, angle: 120, spread: 70, origin: { x: 0.9, y: 0.6 }, colors }), 350);

    setTimeout(() => setIsRevealed(true), 700);
  }, []);

  const tick = useCallback(() => {
    if (!holdStartRef.current) return;
    const elapsed = Date.now() - holdStartRef.current;
    const pct = Math.min((elapsed / HOLD_DURATION) * 100, 100);
    setProgress(pct);

    if (pct < 100) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      triggerReveal();
    }
  }, [triggerReveal]);

  const startHold = useCallback(() => {
    if (isRevealed) return;
    setIsHolding(true);
    holdStartRef.current = Date.now();
    soundFx.playPaperSwoosh();

    if (navigator.vibrate) {
      vibrateIntervalRef.current = setInterval(() => navigator.vibrate(15), 180);
    }

    statusIntervalRef.current = setInterval(() => {
      setStatusIdx((i) => (i + 1) % LOADING_TEXTS.length);
    }, 400);

    rafRef.current = requestAnimationFrame(tick);
  }, [isRevealed, tick]);

  const stopHold = useCallback(() => {
    if (isRevealed || progress >= 100) return;
    setIsHolding(false);
    holdStartRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
    if (vibrateIntervalRef.current) clearInterval(vibrateIntervalRef.current);

    // Smoothly drain
    const id = setInterval(() => {
      setProgress((cur) => {
        if (cur <= 0) {
          clearInterval(id);
          return 0;
        }
        return Math.max(0, cur - 5);
      });
    }, 25);
  }, [isRevealed, progress]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
      if (vibrateIntervalRef.current) clearInterval(vibrateIntervalRef.current);
    };
  }, []);

  // Arc math
  const R = 78;
  const circumference = 2 * Math.PI * R;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-full h-full min-h-[100%] flex flex-col items-center justify-center overflow-y-auto sm:overflow-hidden select-none p-3 sm:p-5"
      style={{ background: 'radial-gradient(ellipse at 50% 25%, #2e1065 0%, #17072b 55%, #090212 100%)' }}>

      {/* Floating Astral Stardust */}
      {Array.from({ length: 16 }).map((_, i) => (
        <motion.div key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: `${3 + (i % 3) * 2}px`,
            height: `${3 + (i % 3) * 2}px`,
            background: i % 2 === 0 ? '#FBBF24' : '#E879F9',
            boxShadow: '0 0 10px rgba(251, 191, 36, 0.7)',
            left: `${5 + (i * 19) % 90}%`,
            top: `${10 + (i * 13) % 80}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.15, 0.7, 0.15],
            scale: [0.9, 1.25, 0.9],
          }}
          transition={{ duration: 3.5 + (i % 4), repeat: Infinity, delay: i * 0.2 }}
        />
      ))}

      <AnimatePresence mode="wait">
        {!isRevealed ? (
          <motion.div key="sensor" className="relative flex flex-col items-center gap-5 z-10 w-full max-w-sm px-4 my-auto"
            exit={{ opacity: 0, scale: 0.94 }}>

            {/* Header Badge */}
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-amber-400/30 text-[11px] font-extrabold uppercase tracking-widest text-amber-300 shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                PHONG ẤN HOÀNG GIA
              </span>
              <h2 className="text-white text-2xl font-bold mt-2"
                style={{ fontFamily: config.fontFamily || 'Cinzel, Playfair Display, serif' }}>
                Gửi <span className="text-amber-300 drop-shadow">{config.recipientName}</span> ⚜️
              </h2>
            </div>

            {/* Concentric Arcane Rings & Biometric Heart Sensor */}
            <div className="relative w-64 h-64 flex items-center justify-center">

              {/* Outer Counter-Rotating Arcane Dial */}
              <motion.div
                className="absolute inset-0 rounded-full border border-amber-400/20 pointer-events-none"
                style={{
                  boxShadow: isHolding ? '0 0 40px rgba(245, 158, 11, 0.3)' : 'none',
                }}
                animate={{ rotate: isHolding ? 360 : 0 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                {/* Arcane tick marks */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                  <div
                    key={deg}
                    className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-amber-400/40"
                    style={{ transformOrigin: 'center 126px', transform: `rotate(${deg}deg)` }}
                  />
                ))}
              </motion.div>

              {/* Inner Rotating Ring */}
              <motion.div
                className="absolute w-52 h-52 rounded-full border border-purple-400/30 pointer-events-none"
                animate={{ rotate: isHolding ? -360 : 0 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              >
                {[0, 60, 120, 180, 240, 300].map((deg) => (
                  <div
                    key={deg}
                    className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-2 bg-purple-300/50"
                    style={{ transformOrigin: 'center 102px', transform: `rotate(${deg}deg)` }}
                  />
                ))}
              </motion.div>

              {/* SVG Golden Progress Ring */}
              <svg width="200" height="200" className="rotate-[-90deg] pointer-events-none">
                <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <motion.circle
                  cx="100" cy="100" r={R} fill="none"
                  stroke="url(#arcaneGoldGrad)" strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ filter: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.8))' }}
                />
                <defs>
                  <linearGradient id="arcaneGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FEF08A" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center Royal Wax Seal Sensor Button */}
              <motion.button
                className="absolute w-32 h-32 rounded-full flex flex-col items-center justify-center cursor-pointer touch-none select-none border-2 shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
                style={{
                  background: isHolding
                    ? 'radial-gradient(circle at 40% 35%, #9333EA 0%, #581C87 60%, #3B0764 100%)'
                    : 'radial-gradient(circle at 40% 35%, #6B21A8 0%, #3B0764 70%, #1E1B4B 100%)',
                  borderColor: isHolding ? '#FBBF24' : 'rgba(251, 191, 36, 0.4)',
                  boxShadow: isHolding ? '0 0 35px rgba(245, 158, 11, 0.7)' : '0 10px 30px rgba(0,0,0,0.7)',
                }}
                animate={isHolding ? { scale: [1, 0.96, 1] } : { scale: [1, 1.03, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                onPointerDown={(e) => { e.preventDefault(); startHold(); }}
                onPointerUp={stopHold}
                onPointerLeave={stopHold}
                onTouchStart={(e) => { e.preventDefault(); startHold(); }}
                onTouchEnd={stopHold}
              >
                {/* Royal Monogram / Heart */}
                <motion.div
                  animate={isHolding ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : {}}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className="flex items-center justify-center"
                >
                  <Heart className="w-9 h-9 text-amber-300 fill-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
                </motion.div>

                <span className="text-[11px] font-black text-amber-200 mt-1 drop-shadow">
                  {Math.round(progress)}%
                </span>
              </motion.button>
            </div>

            {/* Dynamic Status Text */}
            <div className="h-7 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p key={statusIdx}
                  className="text-xs text-amber-200 font-semibold text-center px-4 tracking-wide"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}>
                  {isHolding ? LOADING_TEXTS[statusIdx] : '✦ Nhấn & giữ ngón tay vào con dấu trái tim ✦'}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Glowing Energy Bar */}
            <div className="w-56 h-2 rounded-full bg-white/10 overflow-hidden border border-amber-400/20">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.05 }}
              />
            </div>

            <p className="text-purple-300/40 text-[11px] text-center">
              {mode === 'studio' ? '✦ Xem trước Studio: Nhấn và giữ ngón tay để test' : '✦ Đừng buông tay cho đến khi năng lượng đạt 100%'}
            </p>
          </motion.div>
        ) : (
          /* ─── REVEALED ROYAL DECREE ─── */
          <motion.div key="revealed"
            className="w-full max-w-md flex flex-col items-center justify-center p-3 my-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}>

            {/* Revealed Badge */}
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
              className="mb-3 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 text-slate-950 font-black text-xs tracking-wider uppercase shadow-[0_0_25px_rgba(245,158,11,0.5)]">
              <ShieldCheck className="w-4 h-4 text-slate-950" />
              <span>PHONG ẤN ĐÃ ĐƯỢC GIẢI MÃ</span>
            </motion.div>

            {/* Royal Gold Framed Parchment */}
            <div className="relative w-full rounded-[2.5rem] p-3.5 sm:p-4 bg-gradient-to-b from-amber-200 via-amber-500 to-amber-700 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(245,158,11,0.3)] border border-amber-300">

              {/* Corner rosettes */}
              <div className="absolute top-2 left-2 text-amber-950 font-bold select-none">❖</div>
              <div className="absolute top-2 right-2 text-amber-950 font-bold select-none">❖</div>
              <div className="absolute bottom-2 left-2 text-amber-950 font-bold select-none">❖</div>
              <div className="absolute bottom-2 right-2 text-amber-950 font-bold select-none">❖</div>

              <div className="relative w-full rounded-[2rem] overflow-hidden bg-gradient-to-b from-[#1e1035] via-[#120724] to-[#0a0314] p-5 sm:p-6 border-2 border-amber-900/60 shadow-inner">
                {/* Header */}
                <div className="text-center mb-3">
                  <span className="text-[10px] font-extrabold tracking-[0.25em] text-amber-400 uppercase">
                    Mật Thư Hoàng Gia • Gửi {config.recipientName}
                  </span>
                  <div className="h-px w-24 mx-auto my-2 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                </div>

                {/* Photos */}
                {userImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {userImages.slice(0, 4).map((img, i) => (
                      <div key={i} className={`rounded-xl overflow-hidden border border-amber-400/40 shadow-md ${i === 0 ? 'col-span-2 h-36' : 'h-24'}`}>
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Letter text */}
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

            {/* Studio Reset */}
            {mode === 'studio' && (
              <button
                onClick={() => {
                  setIsRevealed(false);
                  setProgress(0);
                }}
                className="mt-4 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-amber-400/30 text-amber-200 text-xs font-semibold transition-all"
              >
                ↺ Xem lại từ đầu
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
