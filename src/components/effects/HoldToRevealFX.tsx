import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, ShieldCheck, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CardConfig } from '../../types';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  config: CardConfig;
  mode: 'studio' | 'recipient';
}

const LOADING_TEXTS = [
  'Đang kết nối tần số yêu thương...',
  'Quét cảm biến vân tay trái tim...',
  'Hòa nhịp năng lượng hoàng gia ⚜️',
  'Nén 999 đóa hồng nhung kiêu sa...',
  'Truyền năng lượng ánh sáng vĩnh cửu...',
  'Năng lượng ánh sáng sắp đạt đỉnh...',
  'Giải phóng phong ấn bí mật! ⚜️',
];

const HOLD_DURATION = 2600; // ms to fully charge

export default function HoldToRevealFX({ config, mode }: Props) {
  const [progress, setProgress] = useState(0); // 0-100
  const [isHolding, setIsHolding] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const [brokenImages, setBrokenImages] = useState<Record<number, boolean>>({});

  const holdStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const vibrateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Lọc ảnh hợp lệ (loại bỏ chuỗi rỗng / undefined)
  const rawImages = (config.images || []).filter(
    (img): img is string => typeof img === 'string' && img.trim().length > 0
  );
  const validImages = rawImages.filter((_, idx) => !brokenImages[idx]);

  // Kiểm tra chế độ: Chỉ hiển thị tâm thư (text_only) hoặc không có ảnh hợp lệ
  const isTextOnly = config.holdRevealMode === 'text_only' || validImages.length === 0;

  const triggerReveal = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
    if (vibrateIntervalRef.current) clearInterval(vibrateIntervalRef.current);

    setProgress(100);
    setIsHolding(false);
    soundFx.playSuccessChime();

    const colors = ['#FBBF24', '#F59E0B', '#EC4899', '#A855F7', '#FFFFFF', '#E11D48'];
    confetti({ particleCount: 140, spread: 110, origin: { y: 0.55 }, colors });
    setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 80, origin: { x: 0.1, y: 0.6 }, colors }), 200);
    setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 80, origin: { x: 0.9, y: 0.6 }, colors }), 350);

    setTimeout(() => setIsRevealed(true), 650);
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
    }, 380);

    rafRef.current = requestAnimationFrame(tick);
  }, [isRevealed, tick]);

  const stopHold = useCallback(() => {
    if (isRevealed || progress >= 100) return;
    setIsHolding(false);
    holdStartRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
    if (vibrateIntervalRef.current) clearInterval(vibrateIntervalRef.current);

    // Smooth drain back to 0
    const id = setInterval(() => {
      setProgress((cur) => {
        if (cur <= 0) {
          clearInterval(id);
          return 0;
        }
        return Math.max(0, cur - 6);
      });
    }, 20);
  }, [isRevealed, progress]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
      if (vibrateIntervalRef.current) clearInterval(vibrateIntervalRef.current);
    };
  }, []);

  // Golden SVG Arc
  const R = 78;
  const circumference = 2 * Math.PI * R;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="relative w-full h-full min-h-[100%] flex flex-col items-center justify-center overflow-y-auto select-none p-3 sm:p-6"
      style={{
        background: 'radial-gradient(circle at 50% 20%, #2e0e54 0%, #17072a 45%, #080210 100%)',
      }}
    >
      {/* Dynamic Ambient Background Lights */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none transition-all duration-700"
        style={{
          background: isHolding
            ? 'radial-gradient(circle, rgba(245,158,11,0.25) 0%, rgba(217,70,239,0.15) 50%, transparent 75%)'
            : 'radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Floating Astral Stardust */}
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: `${2 + (i % 3) * 2}px`,
            height: `${2 + (i % 3) * 2}px`,
            background: i % 2 === 0 ? '#FBBF24' : '#F472B6',
            boxShadow: i % 2 === 0 ? '0 0 10px rgba(251, 191, 36, 0.8)' : '0 0 10px rgba(244, 114, 182, 0.8)',
            left: `${6 + ((i * 19) % 88)}%`,
            top: `${8 + ((i * 14) % 84)}%`,
          }}
          animate={{
            y: [0, -24, 0],
            opacity: [0.2, 0.85, 0.2],
            scale: [0.8, 1.3, 0.8],
          }}
          transition={{ duration: 3.5 + (i % 4), repeat: Infinity, delay: i * 0.25 }}
        />
      ))}

      <AnimatePresence mode="wait">
        {!isRevealed ? (
          /* ─── PHASE 1: CHARGING SENSOR (HOLD TO REVEAL) ─── */
          <motion.div
            key="sensor"
            className="relative flex flex-col items-center gap-5 z-10 w-full max-w-sm px-4 my-auto py-6"
            exit={{ opacity: 0, scale: 0.92, filter: 'blur(8px)' }}
            transition={{ duration: 0.4 }}
          >
            {/* Header Royal Seal */}
            <div className="text-center space-y-2">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-purple-500/25 to-amber-500/20 border border-amber-400/40 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              >
                <Crown className="w-3.5 h-3.5 text-amber-300 drop-shadow" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-200">
                  PHONG ẤN HOÀNG GIA 20/10
                </span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300 drop-shadow" />
              </motion.div>

              <h2
                className="text-white text-2xl sm:text-3xl font-extrabold tracking-wide drop-shadow-md"
                style={{ fontFamily: config.fontFamily || 'Cinzel, Playfair Display, serif' }}
              >
                Gửi <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-rose-300 bg-clip-text text-transparent">{config.recipientName}</span> ⚜️
              </h2>

              <p className="text-[11px] font-medium text-purple-200/70 tracking-wider">
                {isTextOnly ? '✦ Bức Mật Thư Chiếu Chỉ Cổ Điển ✦' : '✦ Bức Mật Thư Kèm Ảnh Kỷ Niệm ✦'}
              </p>
            </div>

            {/* Concentric Arcane Rings & Biometric Heart Sensor */}
            <div className="relative w-64 h-64 flex items-center justify-center my-2">
              {/* Expanding Shockwave Waves While Holding */}
              {isHolding && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-amber-400/60 pointer-events-none"
                    animate={{ scale: [1, 1.45], opacity: [0.8, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                  />
                  <motion.div
                    className="absolute inset-2 rounded-full border border-purple-400/50 pointer-events-none"
                    animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
                  />
                </>
              )}

              {/* Outer Counter-Rotating Arcane Celestial Dial */}
              <motion.div
                className="absolute inset-0 rounded-full border border-amber-400/30 pointer-events-none"
                style={{
                  boxShadow: isHolding ? '0 0 45px rgba(245, 158, 11, 0.4)' : '0 0 20px rgba(168, 85, 247, 0.15)',
                }}
                animate={{ rotate: isHolding ? 360 : 0 }}
                transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
              >
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                  <div
                    key={deg}
                    className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-2.5 bg-amber-400/50 rounded-full"
                    style={{ transformOrigin: 'center 127px', transform: `rotate(${deg}deg)` }}
                  />
                ))}
              </motion.div>

              {/* Inner Counter-Rotating Ring */}
              <motion.div
                className="absolute w-52 h-52 rounded-full border border-purple-400/35 pointer-events-none"
                animate={{ rotate: isHolding ? -360 : 0 }}
                transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
              >
                {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                  <div
                    key={deg}
                    className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-rose-400/60 rounded-full"
                    style={{ transformOrigin: 'center 103px', transform: `rotate(${deg}deg)` }}
                  />
                ))}
              </motion.div>

              {/* SVG Golden Progress Ring */}
              <svg width="204" height="204" className="rotate-[-90deg] pointer-events-none">
                <circle cx="102" cy="102" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <motion.circle
                  cx="102"
                  cy="102"
                  r={R}
                  fill="none"
                  stroke="url(#royalGoldGrad)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ filter: 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.9))' }}
                />
                <defs>
                  <linearGradient id="royalGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FEF08A" />
                    <stop offset="45%" stopColor="#F59E0B" />
                    <stop offset="85%" stopColor="#EC4899" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Central Biometric Heart Wax Seal Button */}
              <motion.button
                className="absolute w-32 h-32 rounded-full flex flex-col items-center justify-center cursor-pointer touch-none select-none border-2 transition-colors"
                style={{
                  background: isHolding
                    ? 'radial-gradient(circle at 45% 35%, #9333EA 0%, #6B21A8 50%, #3B0764 100%)'
                    : 'radial-gradient(circle at 45% 35%, #7E22CE 0%, #4C1D95 60%, #1E1B4B 100%)',
                  borderColor: isHolding ? '#FDE047' : 'rgba(251, 191, 36, 0.5)',
                  boxShadow: isHolding
                    ? '0 0 40px rgba(245, 158, 11, 0.8), inset 0 0 25px rgba(236, 72, 153, 0.4)'
                    : '0 12px 35px rgba(0,0,0,0.8), inset 0 0 15px rgba(251, 191, 36, 0.2)',
                }}
                animate={isHolding ? { scale: [1, 0.96, 1] } : { scale: [1, 1.03, 1] }}
                transition={{ duration: isHolding ? 0.8 : 2, repeat: Infinity, ease: 'easeInOut' }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  startHold();
                }}
                onPointerUp={stopHold}
                onPointerLeave={stopHold}
                onTouchStart={(e) => {
                  e.preventDefault();
                  startHold();
                }}
                onTouchEnd={stopHold}
              >
                {/* Fingerprint / Biometric Heart ridges */}
                <div className="relative flex items-center justify-center">
                  <motion.div
                    animate={isHolding ? { scale: [1, 1.18, 1] } : { scale: [1, 1.05, 1] }}
                    transition={{ duration: isHolding ? 0.5 : 1.4, repeat: Infinity }}
                  >
                    <Heart className="w-10 h-10 text-amber-300 fill-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.9)]" />
                  </motion.div>

                  {/* Fingerprint scan line */}
                  {isHolding && (
                    <motion.div
                      className="absolute w-10 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none"
                      animate={{ y: [-15, 15, -15] }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                </div>

                <div className="flex flex-col items-center mt-1">
                  <span className="text-xs font-black text-amber-200 tracking-wider drop-shadow">
                    {Math.round(progress)}%
                  </span>
                  <span className="text-[9px] font-bold text-amber-300/80 uppercase tracking-widest -mt-0.5">
                    {isHolding ? 'ĐANG SẠC' : 'NHẤN GIỮ'}
                  </span>
                </div>
              </motion.button>
            </div>

            {/* Dynamic Status Text with Smooth Fade */}
            <div className="h-8 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={statusIdx}
                  className="text-xs sm:text-sm text-amber-200 font-semibold text-center px-4 tracking-wide drop-shadow"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  {isHolding ? LOADING_TEXTS[statusIdx] : '✦ Đặt và giữ ngón tay vào con dấu trái tim ✦'}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Glowing Neon Energy Bar */}
            <div className="w-64 h-2.5 rounded-full bg-slate-900/80 overflow-hidden border border-amber-400/30 p-[1px] shadow-inner">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 via-rose-500 to-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.7)]"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.05 }}
              />
            </div>

            <p className="text-purple-300/50 text-[11px] text-center tracking-wide">
              {mode === 'studio'
                ? '✦ Chế độ Studio: Nhấn và giữ chuột hoặc ngón tay để xem trước hiệu ứng'
                : '✦ Giữ ngón tay liên tục cho đến khi năng lượng đạt 100%'}
            </p>
          </motion.div>
        ) : (
          /* ─── PHASE 2: REVEALED ROYAL SECRET LETTER ─── */
          <motion.div
            key="revealed"
            className="w-full max-w-md flex flex-col items-center justify-center p-2 sm:p-4 my-auto z-10"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
          >
            {/* Unlocked Badge */}
            <motion.div
              initial={{ y: -15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mb-4 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 text-slate-950 font-black text-xs tracking-widest uppercase shadow-[0_0_30px_rgba(245,158,11,0.6)] border border-amber-300"
            >
              <ShieldCheck className="w-4 h-4 text-slate-950" />
              <span>PHONG ẤN ĐÃ ĐƯỢC GIẢI MÃ</span>
              <Sparkles className="w-4 h-4 text-slate-950" />
            </motion.div>

            {/* Regal Obsidian & 24K Gold Parchment Frame */}
            <div className="relative w-full rounded-[2.2rem] p-1 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(245,158,11,0.3)]">
              {/* Inner Double-Gold Border & Obsidian Background */}
              <div className="relative w-full rounded-[2rem] overflow-hidden bg-gradient-to-b from-[#1b0d33]/98 via-[#110722]/98 to-[#090212]/98 p-5 sm:p-7 border border-amber-400/40 backdrop-blur-2xl">
                {/* 4 Ornate Royal Corner Rosettes */}
                <span className="absolute top-2.5 left-3 text-amber-400/80 text-sm font-bold select-none">⚜</span>
                <span className="absolute top-2.5 right-3 text-amber-400/80 text-sm font-bold select-none">⚜</span>
                <span className="absolute bottom-2.5 left-3 text-amber-400/80 text-sm font-bold select-none">⚜</span>
                <span className="absolute bottom-2.5 right-3 text-amber-400/80 text-sm font-bold select-none">⚜</span>

                {/* Royal Decree Header */}
                <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-black tracking-[0.28em] uppercase">
                    <span>❖</span>
                    <span>MẬT THƯ HOÀNG GIA</span>
                    <span>❖</span>
                  </div>

                  <h3
                    className="text-white text-lg sm:text-xl font-bold mt-1"
                    style={{ fontFamily: config.fontFamily || 'Cinzel, Playfair Display, serif' }}
                  >
                    Trân trọng trao gửi đến{' '}
                    <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-rose-300 bg-clip-text text-transparent font-extrabold">
                      {config.recipientName}
                    </span>
                  </h3>

                  <div className="flex items-center justify-center gap-2 my-2">
                    <div className="h-px w-16 bg-gradient-to-r from-transparent via-amber-400/60 to-amber-400/20" />
                    <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-500" />
                    <div className="h-px w-16 bg-gradient-to-l from-transparent via-amber-400/60 to-amber-400/20" />
                  </div>
                </div>

                {/* ─── CASE A: CÓ ẢNH KỶ NIỆM (WITH PHOTOS) ─── */}
                {!isTextOnly && validImages.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {validImages.length === 1 ? (
                      /* 1 Single Grand Royal Portrait */
                      <div className="relative rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-[0_10px_30px_rgba(0,0,0,0.8)] group h-56 sm:h-64">
                        <img
                          src={validImages[0]}
                          alt="Ảnh kỷ niệm"
                          onError={() => setBrokenImages((prev) => ({ ...prev, 0: true }))}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
                        <span className="absolute bottom-2.5 right-3 text-[10px] font-bold text-amber-200 bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                          Khoảnh khắc đáng nhớ ⚜️
                        </span>
                      </div>
                    ) : (
                      /* Multi-image Royal Gallery */
                      <div className="grid grid-cols-2 gap-2">
                        {validImages.slice(0, 4).map((img, i) => (
                          <div
                            key={i}
                            className={`relative rounded-xl overflow-hidden border border-amber-400/50 shadow-md ${
                              i === 0 ? 'col-span-2 h-40 sm:h-44' : 'h-24 sm:h-28'
                            }`}
                          >
                            <img
                              src={img}
                              alt=""
                              onError={() => setBrokenImages((prev) => ({ ...prev, [i]: true }))}
                              className="w-full h-full object-cover"
                            />
                            {i === 0 && (
                              <span className="absolute bottom-2 right-2 text-[9px] font-bold text-amber-200 bg-slate-950/80 px-2 py-0.5 rounded-full border border-amber-400/30">
                                ⭐ Tiêu điểm
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ─── CASE B: KHÔNG CÓ ẢNH (CHỈ NỘI DUNG / TÂM THƯ NGHỆ THUẬT) ─── */}
                {isTextOnly && (
                  <div className="my-2 flex flex-col items-center">
                    {/* Royal Wax Seal Heart Medallion */}
                    <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-amber-300 via-rose-500 to-purple-800 p-[2px] shadow-[0_0_30px_rgba(245,158,11,0.5)] my-2">
                      <div className="w-full h-full rounded-full bg-slate-950/85 flex items-center justify-center">
                        <Heart className="w-8 h-8 text-rose-400 fill-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.9)]" />
                      </div>
                      <div className="absolute -top-1 -right-1 text-amber-300 text-xs font-bold">✨</div>
                    </div>

                    <span className="text-[10px] tracking-[0.25em] text-amber-300 uppercase font-extrabold mt-1">
                      Chiếu Chỉ Yêu Thương • 20/10
                    </span>
                  </div>
                )}

                {/* Main Message Typography */}
                <div className="relative my-4 px-2 sm:px-4 py-2">
                  <span className="absolute -top-3 left-0 text-3xl font-serif text-amber-400/40 select-none">❝</span>
                  <p
                    className={`text-amber-50 leading-relaxed text-center italic font-normal tracking-wide drop-shadow-sm whitespace-pre-line ${
                      isTextOnly ? 'text-base sm:text-lg sm:leading-loose my-2 font-medium' : 'text-sm sm:text-base my-2'
                    }`}
                    style={{ fontFamily: config.fontFamily || 'Playfair Display, Georgia, serif' }}
                  >
                    {config.mainText}
                  </p>
                  <span className="absolute -bottom-3 right-0 text-3xl font-serif text-amber-400/40 select-none">❞</span>
                </div>

                {/* Decorative Floral Divider */}
                <div className="text-center text-amber-400/60 text-xs my-2 select-none tracking-widest">
                  ❦ ════ •⊰ ⚜ ⊱• ════ ❦
                </div>

                {/* Signature Section */}
                <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-amber-400/20">
                  <Heart className="w-4 h-4 text-rose-400 fill-rose-500 animate-pulse" />
                  <span className="text-amber-300 font-extrabold text-sm sm:text-base tracking-wide drop-shadow">
                    — {config.senderName} —
                  </span>
                  <Heart className="w-4 h-4 text-rose-400 fill-rose-500 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Studio Reset Button */}
            {mode === 'studio' && (
              <button
                onClick={() => {
                  setIsRevealed(false);
                  setProgress(0);
                  setBrokenImages({});
                }}
                className="mt-4 px-5 py-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-amber-400/40 text-amber-200 text-xs font-bold transition-all shadow-md hover:shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <span>↺</span>
                <span>Thử lại từ đầu (Khóa lại phong ấn)</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
