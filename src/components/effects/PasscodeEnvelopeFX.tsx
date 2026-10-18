import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Heart, Delete, KeyRound, HelpCircle, Pin, Sparkles, X, Maximize2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CardConfig } from '../../types';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  config: CardConfig;
  mode: 'studio' | 'recipient';
}

export default function PasscodeEnvelopeFX({ config, mode }: Props) {
  const [enteredPin, setEnteredPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(mode === 'studio');
  const [unlockStep, setUnlockStep] = useState<number>(mode === 'studio' ? 3 : 0);
  const [shake, setShake] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activePolaroidIndex, setActivePolaroidIndex] = useState(0);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const targetPin = config.passcode || '2010';
  const userImages = config.images || [];

  // Smooth 3D Parallax Tilt based on cursor/touch
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || isUnlocked) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = -((e.clientY - rect.top) / rect.height - 0.5) * 20;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const triggerCinematicSequence = useCallback(() => {
    // Stage 1: Wax seal crackles & breaks with golden flash
    setUnlockStep(1);
    soundFx.playWaxSealBreak();

    setTimeout(() => {
      // Stage 2: 3D Envelope Flap swings open
      setUnlockStep(2);
      soundFx.playPaperSwoosh();
    }, 600);

    setTimeout(() => {
      // Stage 3: Letter slides out with grand fanfare and confetti shower
      setUnlockStep(3);
      setIsUnlocked(true);
      soundFx.playSuccessChime();

      // Dual-cannon golden & rose confetti burst
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { x: 0.3, y: 0.6 },
        colors: ['#E11D48', '#FB7185', '#F472B6', '#F59E0B', '#FDE047'],
      });
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { x: 0.7, y: 0.6 },
        colors: ['#E11D48', '#FB7185', '#C084FC', '#F59E0B', '#FFF'],
      });
    }, 1300);
  }, []);

  const handleKeyPress = useCallback(
    (num: string) => {
      if (unlockStep > 0) return;
      soundFx.playPinClick();
      const newPin = enteredPin + num;
      setEnteredPin(newPin);

      if (newPin.length === targetPin.length) {
        if (newPin === targetPin) {
          triggerCinematicSequence();
        } else {
          setShake(true);
          setFailCount((prev) => prev + 1);
          setTimeout(() => {
            setShake(false);
            setEnteredPin('');
          }, 500);
        }
      }
    },
    [enteredPin, targetPin, unlockStep, triggerCinematicSequence]
  );

  const handleDelete = useCallback(() => {
    soundFx.playPinClick();
    setEnteredPin((prev) => prev.slice(0, -1));
  }, []);

  // Physical keyboard keydown support
  useEffect(() => {
    if (isUnlocked || unlockStep > 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua nếu người dùng đang gõ trong input, textarea hoặc modal
      const target = e.target as HTMLElement | null;
      const activeEl = document.activeElement as HTMLElement | null;
      const isInputFocused =
        (target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable ||
            target.closest('input, textarea, select, [contenteditable]'))) ||
        (activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.isContentEditable ||
            activeEl.closest('input, textarea, select, [contenteditable]')));

      if (isInputFocused) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Enter' && enteredPin.length === targetPin.length) {
        e.preventDefault();
        if (enteredPin === targetPin) {
          triggerCinematicSequence();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUnlocked, unlockStep, enteredPin, targetPin, handleKeyPress, handleDelete, triggerCinematicSequence]);

  const getSmartHint = () => {
    if (config.passcodeHint) return config.passcodeHint;
    if (targetPin.length <= 4) {
      return `Mã bắt đầu bằng số "${targetPin[0]}" và kết thúc bằng "${targetPin[targetPin.length - 1]}"`;
    }
    return 'Gợi ý: Ngày kỷ niệm, ngày sinh nhật hoặc ngày 20/10';
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full h-full min-h-full flex flex-col items-center justify-start sm:justify-center p-2 sm:p-6 overflow-y-auto select-none`}
      style={{ perspective: '1400px' }}
    >
      {/* ── LUXURY ROMANTIC AMBIENT BACKGROUND ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-950 via-purple-950 to-slate-950 pointer-events-none" />

      {/* Radiant ambient glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-radial from-rose-500/25 via-pink-500/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] rounded-full bg-radial from-amber-500/15 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />

      {/* Floating Fairy Dust & Luminous Golden Sparkles */}
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${8 + ((i * 19) % 86)}%`,
            top: `${6 + ((i * 23) % 88)}%`,
            width: `${(i % 3) + 2}px`,
            height: `${(i % 3) + 2}px`,
            backgroundColor: i % 2 === 0 ? '#FDE047' : '#FDA4AF',
            boxShadow: `0 0 10px ${i % 2 === 0 ? '#F59E0B' : '#FB7185'}`,
          }}
          animate={{
            y: [0, -35, 0],
            x: [0, (i % 2 === 0 ? 15 : -15), 0],
            opacity: [0.15, 0.85, 0.15],
            scale: [0.8, 1.4, 0.8],
          }}
          transition={{
            duration: 3.5 + (i % 4) * 0.8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: (i % 5) * 0.4,
          }}
        />
      ))}

      {/* Gentle Floating Rose Petals in Depth */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={`petal-${i}`}
          className="absolute pointer-events-none select-none text-rose-300/40 text-xl sm:text-2xl"
          style={{
            left: `${5 + ((i * 27) % 90)}%`,
            top: `${10 + ((i * 31) % 80)}%`,
          }}
          animate={{
            y: [0, -40, 0],
            rotate: [0, i % 2 === 0 ? 25 : -25, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 5 + i * 0.7,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          🌸
        </motion.div>
      ))}

      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          /* ========================================================
             3D PERSPECTIVE ROYAL ENVELOPE & CINEMATIC UNSEALING
             ======================================================== */
          <motion.div
            key="envelope-locked"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              transform: `perspective(1200px) rotateX(${mousePos.y * 0.45}deg) rotateY(${mousePos.x * 0.45}deg)`,
              transition: 'transform 0.15s ease-out',
            }}
            className="relative z-10 flex flex-col items-center gap-2 sm:gap-3.5 w-full max-w-sm py-2 sm:py-4"
          >
            {/* 3D Realistic Velvet & Gold Foil Envelope Construct */}
            <div
              className="relative w-[190px] h-[118px] xs:w-[230px] xs:h-[142px] sm:w-[320px] sm:h-[198px] group cursor-pointer"
              style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
            >
              {/* Soft Drop Shadow under Envelope */}
              <div className="absolute -bottom-6 inset-x-6 h-8 bg-black/50 blur-xl rounded-full transform rotateX(60deg) pointer-events-none" />

              {/* Envelope Main Body (Velvet Burgundy Texture with Golden Seams) */}
              <div
                className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-rose-800 via-rose-900 to-red-950 shadow-[0_20px_50px_-15px_rgba(225,29,72,0.5)] border-2 border-amber-300/40 overflow-hidden"
                style={{ transform: 'translateZ(0px)', backfaceVisibility: 'hidden' }}
              >
                {/* Golden metallic foil rim */}
                <div className="absolute inset-0 border border-amber-300/20 rounded-2xl sm:rounded-3xl pointer-events-none" />

                {/* Left Velvet Flap */}
                <div
                  className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-tr from-rose-950 via-rose-900 to-rose-800 border-r border-amber-300/30 shadow-md"
                  style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }}
                />

                {/* Right Velvet Flap */}
                <div
                  className="absolute bottom-0 right-0 w-1/2 h-full bg-gradient-to-tl from-rose-950 via-rose-900 to-rose-800 border-l border-amber-300/30 shadow-md"
                  style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }}
                />

                {/* Bottom Center Flap */}
                <div
                  className="absolute bottom-0 inset-x-0 h-20 xs:h-24 sm:h-34 bg-gradient-to-t from-rose-950 via-rose-900 to-rose-700/90 border-t border-amber-300/30 shadow-lg"
                  style={{ clipPath: 'polygon(0 100%, 100% 100%, 50% 15%)' }}
                />

                {/* Subtle Gold Dust Sheen over envelope */}
                <div className="absolute inset-0 bg-radial from-amber-300/10 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Envelope Letter Sliding Out (Spring-loaded Animation) */}
              <motion.div
                initial={{ y: 0, opacity: 0 }}
                animate={
                  unlockStep >= 2
                    ? { y: -80, opacity: 1, scale: 1.05 }
                    : { y: 0, opacity: 0 }
                }
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-x-3 top-2 h-26 xs:h-32 sm:h-40 bg-gradient-to-b from-amber-50 to-orange-50/90 rounded-xl sm:rounded-2xl shadow-2xl p-2 sm:p-3 border-2 border-amber-300/60 flex flex-col items-center justify-center text-center z-10"
                style={{ transform: 'translateZ(6px)' }}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-1 shadow-inner">
                  <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-rose-500 text-rose-500 animate-pulse" />
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-slate-800 tracking-tight">
                  Đang mở bức thư mật mã...
                </p>
                <span className="text-[9px] sm:text-[10px] text-rose-600 font-semibold italic mt-0.5">
                  Dành riêng cho {config.recipientName}
                </span>
              </motion.div>

              {/* 3D Envelope Flap (Opens backward in real 3D perspective) */}
              <motion.div
                initial={{ rotateX: 0 }}
                animate={{
                  rotateX: unlockStep >= 2 ? -180 : 0,
                }}
                transition={{ duration: 0.85, ease: [0.25, 1, 0.5, 1] }}
                style={{
                  transformOrigin: 'top center',
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  transform: 'translateZ(12px)',
                }}
                className="absolute top-0 inset-x-0 h-20 xs:h-24 sm:h-30 z-20"
              >
                {/* Triangular Flap Body with Velvet Texture */}
                <div
                  className="w-full h-full bg-gradient-to-b from-rose-800 via-rose-700 to-rose-900 rounded-t-2xl sm:rounded-t-3xl shadow-xl border-t border-amber-300/40 relative"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
                >
                  {/* Flap gold piping seam */}
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-amber-400/50" />
                </div>

                {/* ── 3D LUXURY EMBOSSED WAX SEAL WITH ROYAL CREST ── */}
                <motion.div
                  animate={
                    unlockStep >= 1
                      ? { scale: [1, 1.3, 0], opacity: [1, 1, 0], rotate: [0, 15, 45] }
                      : { scale: [1, 1.04, 1] }
                  }
                  transition={
                    unlockStep >= 1
                      ? { duration: 0.55, ease: 'easeOut' }
                      : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
                  }
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shadow-[0_6px_25px_rgba(245,158,11,0.65)] border-2 border-yellow-100 flex items-center justify-center text-white cursor-pointer group/seal"
                >
                  {/* Outer Wax Drip Irregularity Layer */}
                  <div className="absolute inset-0 rounded-full border border-amber-600/40" />

                  {/* Embossed Inner Rim */}
                  <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full border border-amber-200/70 bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-inner">
                    <Lock className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-50 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover/seal:scale-110 transition-transform" />
                  </div>

                  {/* Golden Sparkle Glint on Seal */}
                  <div className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-white/80 blur-[0.5px]" />
                </motion.div>
              </motion.div>
            </div>

            {/* Instruction Banner */}
            <div className="text-center space-y-0.5">
              <p className="text-xs sm:text-sm font-black text-white flex items-center justify-center gap-1.5 drop-shadow-md">
                <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
                <span>Nhập Mật Mã Mở Thư</span>
              </p>
              <p className="text-[10px] sm:text-[11px] text-rose-200/80">
                Chạm bàn phím số hoặc gõ phím ({targetPin.length} chữ số)
              </p>
            </div>

            {/* Glowing PIN Dots */}
            <motion.div
              animate={shake ? { x: [-14, 14, -14, 14, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex justify-center gap-1.5 sm:gap-2"
            >
              {Array.from({ length: targetPin.length }).map((_, i) => (
                <div
                  key={i}
                  className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-2xl border-2 flex items-center justify-center font-black text-sm sm:text-lg transition-all duration-300 ${
                    i < enteredPin.length
                      ? 'border-rose-400 bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.7)] scale-105'
                      : 'border-white/20 bg-white/10 text-white/30 backdrop-blur-md'
                  }`}
                >
                  {i < enteredPin.length ? '♥' : '•'}
                </div>
              ))}
            </motion.div>

            {/* Glassmorphic Tactile Keypad */}
            <div className="grid grid-cols-3 gap-1 sm:gap-2 w-full max-w-[190px] sm:max-w-[245px] bg-white/10 backdrop-blur-2xl p-2 sm:p-3 rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl shadow-rose-950/50">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', null, '0', 'del'].map((k, idx) => {
                if (k === null) return <div key={idx} />;
                if (k === 'del') {
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={handleDelete}
                      className="h-8 sm:h-10 rounded-lg sm:rounded-2xl bg-white/10 hover:bg-rose-500/20 text-rose-200 hover:text-white flex items-center justify-center active:scale-90 transition-all font-bold border border-white/10"
                      aria-label="Xóa"
                    >
                      <Delete className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                    </button>
                  );
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleKeyPress(k)}
                    className="h-8 sm:h-10 rounded-lg sm:rounded-2xl bg-white/15 hover:bg-rose-500/30 text-white text-xs sm:text-base font-black shadow-sm active:scale-90 transition-all border border-white/15 hover:border-rose-300/40"
                  >
                    {k}
                  </button>
                );
              })}
            </div>

            {/* Smart Hint & Quick Unlock */}
            <div className="flex flex-col items-center gap-1 text-center">
              <button
                type="button"
                onClick={() => {
                  soundFx.playPinClick();
                  setShowHint(!showHint);
                }}
                className="text-[10px] sm:text-xs font-semibold text-rose-300 hover:text-rose-200 flex items-center gap-1 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>{showHint ? 'Ẩn gợi ý' : 'Quên mã PIN? Xem gợi ý'}</span>
              </button>

              {(showHint || failCount >= 2) && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-[10px] sm:text-[11px] font-semibold max-w-xs shadow-lg backdrop-blur-md"
                >
                  💡 {getSmartHint()}
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          /* ========================================================
             LUXURY VINTAGE PARCHMENT LETTER WITH GOLD FOIL & POLAROIDS
             ======================================================== */
          <motion.div
            key="envelope-unlocked"
            initial={{ scale: 0.6, opacity: 0, y: 50, rotateX: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.8, type: 'spring', bounce: 0.2 }}
            className="relative z-10 w-full max-w-2xl mx-auto my-auto py-2"
          >
            {/* Parchment Container with Gold Leaf Border */}
            <div className="relative bg-[#FFFDF7] text-slate-800 p-5 sm:p-10 rounded-3xl border-2 sm:border-4 border-amber-300 shadow-[0_30px_90px_rgba(0,0,0,0.65)] space-y-4 sm:space-y-6 overflow-hidden">
              {/* Ornate Gold Filigree Corner Brackets */}
              <span className="absolute top-2.5 left-3 text-amber-500 text-lg pointer-events-none z-20 select-none">⚜</span>
              <span className="absolute top-2.5 right-3 text-amber-500 text-lg pointer-events-none z-20 select-none">⚜</span>
              <span className="absolute bottom-2.5 left-3 text-amber-500 text-lg pointer-events-none z-20 select-none">⚜</span>
              <span className="absolute bottom-2.5 right-3 text-amber-500 text-lg pointer-events-none z-20 select-none">⚜</span>

              {/* Delicate Botanical Floral Watermark Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-amber-50/70 via-rose-50/30 to-amber-100/50 pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-rose-200/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-amber-200/25 blur-3xl pointer-events-none" />

              {/* Decorative Vintage Postal Stamps & Airmail Edge */}
              <div className="absolute top-4 right-4 flex items-center gap-2 select-none pointer-events-none">
                <div className="px-2.5 py-1 rounded-md border-2 border-dashed border-rose-500/70 bg-rose-50/80 text-[10px] font-mono font-black text-rose-600 rotate-6 shadow-sm">
                  ★ LOVE 20/10 ★
                </div>
                <div className="w-11 h-11 rounded-full border-2 border-dashed border-amber-700/60 flex flex-col items-center justify-center text-amber-800 text-[9px] font-serif -rotate-12 bg-amber-50/50">
                  <span>VIỆT NAM</span>
                  <span className="text-[7.5px] font-sans font-bold text-rose-600">20.10.2026</span>
                </div>
              </div>

              {/* Floating Wax Heart Seal Badge */}
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.25, type: 'spring', stiffness: 200 }}
                className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-gradient-to-br from-rose-500 via-rose-600 to-amber-600 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 border-2 border-amber-200 relative group cursor-pointer"
                onClick={() => {
                  soundFx.playHeartPop();
                  confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.4 },
                    colors: ['#FB7185', '#F43F5E', '#FBBF24', '#FDA4AF'],
                  });
                }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                title="Chạm vào con dấu hoàng gia để thả hoa"
              >
                <Heart className="w-7 h-7 sm:w-8 sm:h-8 fill-white drop-shadow" />
                <div className="absolute -bottom-1 -right-1 text-xs">✨</div>
              </motion.div>

              {/* Recipient Header with Royal Calligraphy */}
              <div className="text-center pt-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-100/80 border border-rose-200/90 text-rose-700 text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-2xs">
                  <span>✦</span>
                  <span>Thư Tình Niêm Phong Sáp Hoàng Gia</span>
                  <span>✦</span>
                </div>
                <h2
                  className="text-2xl sm:text-4xl font-black text-rose-950 mt-2 tracking-tight"
                  style={{ fontFamily: config.fontFamily || 'Dancing Script' }}
                >
                  Gửi {config.recipientName || 'Em yêu'} 💕
                </h2>
                <div className="w-24 h-0.5 mx-auto bg-gradient-to-r from-transparent via-amber-400 to-transparent mt-2 opacity-80" />
              </div>

              {/* Main Romantic Letter Body with Calligraphy Styling */}
              <div
                className="text-slate-800 leading-relaxed text-base sm:text-xl bg-gradient-to-br from-amber-50/80 via-white/70 to-rose-50/80 p-5 sm:p-7 rounded-2xl border border-amber-300/80 text-left font-serif shadow-[inset_0_2px_8px_rgba(217,119,6,0.08)] whitespace-pre-line relative overflow-hidden"
                style={{ fontFamily: config.fontFamily || 'Dancing Script' }}
              >
                {/* Vintage Watermark Rose */}
                <div className="absolute top-2 right-3 text-rose-400/25 text-4xl select-none pointer-events-none">
                  🌹
                </div>
                <div className="absolute -bottom-4 -left-2 text-amber-500/15 text-5xl select-none pointer-events-none font-serif">
                  ❦
                </div>
                {config.mainText || 'Ngày 20/10, chúc em luôn rạng rỡ, xinh đẹp và hạnh phúc!'}
              </div>

              {/* ── LAYERED PAPERCLIP POLAROID PHOTO INSERTS ── */}
              {(() => {
                const photosToDisplay = userImages.length > 0 ? userImages : [
                  'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&auto=format&fit=crop&q=80',
                ];
                return (
                  <div className="space-y-2 pt-2 border-t border-amber-200/70">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                      <span className="flex items-center gap-1.5 text-rose-700">
                        <Pin className="w-4 h-4 text-amber-500 rotate-45" />
                        <span>
                          {userImages.length > 0
                            ? `Ảnh Kỷ Niệm Kẹp Cùng Thư (${userImages.length} tấm)`
                            : 'Kỷ Niệm Kẹp Cùng Thư (Gợi ý ảnh ngọt ngào)'}
                        </span>
                      </span>
                      <span className="text-[11px] text-slate-400 italic">Chạm vào ảnh để phóng to</span>
                    </div>

                    <div className="flex items-center justify-center gap-3 sm:gap-5 flex-wrap pt-2">
                      {photosToDisplay.map((img, i) => {
                        const isSelected = activePolaroidIndex === i;
                        const rotation = (i % 2 === 0 ? 3 : -3) * (i + 1);
                        return (
                          <motion.div
                            key={i}
                            whileHover={{ scale: 1.08, rotate: 0 }}
                            onClick={() => {
                              soundFx.playPaperSwoosh();
                              setActivePolaroidIndex(i);
                              setZoomedImage(img);
                            }}
                            className={`relative cursor-pointer transition-all duration-300 p-2 sm:p-2.5 bg-white rounded-2xl shadow-xl border-2 ${
                              isSelected
                                ? 'border-rose-400 ring-4 ring-rose-300/50 scale-105 z-20'
                                : 'border-slate-200/90 hover:border-rose-300 z-10'
                            }`}
                            style={{
                              width: '135px',
                              transform: `rotate(${rotation}deg)`,
                            }}
                          >
                            {/* Golden Paperclip Decor */}
                            <div className="absolute -top-3.5 left-4 w-4 h-8 rounded-full border-2 border-amber-500 bg-amber-200/80 shadow-sm z-30" />

                            {/* Image Thumbnail */}
                            <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-100 relative group/pol">
                              <img src={img} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/pol:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Maximize2 className="w-4 h-4" />
                              </div>
                            </div>

                            {/* Caption */}
                            <p className="text-[10px] font-bold text-center text-slate-600 mt-1.5 italic">
                              {userImages.length > 0 ? `Kỷ niệm #${i + 1}` : `Khoảnh khắc #${i + 1}`}
                            </p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Sender Signature & Interactive Flower Rain Action */}
              <div className="pt-2 flex items-center justify-between border-t border-amber-200/60">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playHeartPop();
                    confetti({
                      particleCount: 70,
                      spread: 80,
                      origin: { y: 0.6 },
                      colors: ['#FB7185', '#F43F5E', '#FBBF24', '#FDA4AF'],
                    });
                  }}
                  className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tung hoa yêu thương</span>
                </button>

                <p
                  className="text-xl sm:text-2xl font-bold text-rose-600 italic"
                  style={{ fontFamily: config.fontFamily || 'Dancing Script' }}
                >
                  — {config.senderName || 'Người thương'} 🌹
                </p>
              </div>

              {/* Reset/Relock Button for Studio Mode */}
              {mode === 'studio' && (
                <div className="pt-2 border-t border-amber-200/60 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUnlocked(false);
                      setUnlockStep(0);
                      setEnteredPin('');
                    }}
                    className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-xl border border-rose-200 transition-colors shadow-2xs"
                  >
                    🔒 Khóa lại phong bì để thử lại quy trình mở thư
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HIGH-RES LIGHTBOX MODAL FOR POLAROIDS ── */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-lg w-full bg-white p-3 sm:p-4 rounded-3xl shadow-2xl border-4 border-amber-300"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg hover:bg-rose-700"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="aspect-square rounded-2xl overflow-hidden bg-slate-900">
                <img src={zoomedImage} alt="" className="w-full h-full object-contain" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

