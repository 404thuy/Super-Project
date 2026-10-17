import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Heart, Delete, KeyRound, HelpCircle, Pin } from 'lucide-react';
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

  const containerRef = useRef<HTMLDivElement>(null);
  const targetPin = config.passcode || '2010';
  const userImages = config.images || [];

  // Mouse Parallax Tilt
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || isUnlocked) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    const y = -((e.clientY - rect.top) / rect.height - 0.5) * 16;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const triggerCinematicSequence = useCallback(() => {
    // Stage 1: Wax seal crackles & breaks
    setUnlockStep(1);
    soundFx.playWaxSealBreak();

    setTimeout(() => {
      // Stage 2: Flap opens in 3D
      setUnlockStep(2);
      soundFx.playPaperSwoosh();
    }, 600);

    setTimeout(() => {
      // Stage 3: Letter slides out and zooms to viewer
      setUnlockStep(3);
      setIsUnlocked(true);
      soundFx.playSuccessChime();

      // Confetti & glass heart particle shower
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#FB7185', '#F472B6', '#C084FC', '#38BDF8', '#FFD700'],
      });
    }, 1400);
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

  // Physical keyboard keydown event listener
  useEffect(() => {
    if (isUnlocked || unlockStep > 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
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
      className={`relative w-full flex items-center justify-center p-4 overflow-hidden select-none ${
        mode === 'recipient' ? 'h-screen min-h-screen' : 'h-full min-h-[520px] sm:min-h-[620px]'
      }`}
      style={{ perspective: '1200px' }}
    >
      {/* Dynamic Ambient Background with Floating Hearts */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-100/80 via-purple-100/70 to-sky-100/70 pointer-events-none" />

      {/* Floating 3D Shimmer Hearts */}
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-rose-300 pointer-events-none text-xl"
          style={{
            left: `${10 + ((i * 14) % 80)}%`,
            top: `${15 + ((i * 18) % 70)}%`,
          }}
          animate={{
            y: [0, -25, 0],
            rotate: [0, i % 2 === 0 ? 15 : -15, 0],
            opacity: [0.2, 0.7, 0.2],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 4 + i * 0.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          ♥
        </motion.div>
      ))}

      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          /* ========================================================
             3D PERSPECTIVE ENVELOPE WITH CINEMATIC UNSEALING SEQUENCE
             ======================================================== */
          <motion.div
            key="envelope-locked"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            style={{
              transform: `perspective(1000px) rotateX(${mousePos.y * 0.4}deg) rotateY(${mousePos.x * 0.4}deg)`,
              transition: 'transform 0.15s ease-out',
            }}
            className="relative z-10 flex flex-col items-center gap-5 w-full max-w-sm"
          >
            {/* 3D Envelope Construct */}
            <div
              className="relative w-72 h-44 sm:w-80 sm:h-48"
              style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
            >
              {/* Envelope Body */}
              <div
                className="absolute inset-0 rounded-3xl bg-gradient-to-br from-rose-500 via-pink-600 to-purple-600 shadow-[0_25px_60px_-15px_rgba(244,63,94,0.4)] border border-rose-300/40 overflow-hidden"
                style={{ transform: 'translateZ(0px)', backfaceVisibility: 'hidden' }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-black/20" />
                <div
                  className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-tr from-rose-600/80 to-pink-500/80"
                  style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }}
                />
                <div
                  className="absolute bottom-0 right-0 w-1/2 h-full bg-gradient-to-tl from-purple-700/80 to-pink-600/80"
                  style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }}
                />
                <div
                  className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-rose-700 via-pink-600 to-rose-400"
                  style={{ clipPath: 'polygon(0 100%, 100% 100%, 50% 15%)' }}
                />
              </div>

              {/* Envelope Letter Sliding Out */}
              <motion.div
                initial={{ y: 0, opacity: 0 }}
                animate={
                  unlockStep >= 2
                    ? { y: -80, opacity: 1, scale: 1.05 }
                    : { y: 0, opacity: 0 }
                }
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute inset-x-4 top-2 h-40 bg-white rounded-2xl shadow-xl p-4 border border-rose-100 flex flex-col items-center justify-center text-center"
                style={{ transform: 'translateZ(5px)' }}
              >
                <div className="text-xl">💌</div>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  Đang mở bức thư dành riêng cho {config.recipientName}...
                </p>
              </motion.div>

              {/* 3D Envelope Flap */}
              <motion.div
                initial={{ rotateX: 0 }}
                animate={{
                  rotateX: unlockStep >= 2 ? -180 : 0,
                }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                style={{
                  transformOrigin: 'top center',
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  transform: 'translateZ(10px)',
                }}
                className="absolute top-0 inset-x-0 h-28 z-20"
              >
                <div
                  className="w-full h-full bg-gradient-to-b from-rose-400 via-rose-500 to-pink-600 rounded-t-3xl shadow-md"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
                />

                <motion.div
                  animate={
                    unlockStep >= 1
                      ? { scale: [1, 1.4, 0], opacity: [1, 1, 0] }
                      : { scale: [1, 1.05, 1] }
                  }
                  transition={
                    unlockStep >= 1
                      ? { duration: 0.5 }
                      : { duration: 2, repeat: Infinity }
                  }
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 shadow-[0_4px_15px_rgba(245,158,11,0.5)] border-2 border-amber-200 flex items-center justify-center text-white font-bold"
                >
                  <Lock className="w-5 h-5 text-amber-50 drop-shadow" />
                </motion.div>
              </motion.div>
            </div>

            {/* Instruction */}
            <div className="text-center space-y-1">
              <p className="text-sm font-extrabold text-slate-800 flex items-center justify-center gap-1.5">
                <KeyRound className="w-4 h-4 text-rose-500" />
                <span>Nhập Mật Mã Mở Thư</span>
              </p>
              <p className="text-xs text-slate-500">
                Gõ phím máy tính hoặc chạm phím số ({targetPin.length} số)
              </p>
            </div>

            {/* PIN Display Dots */}
            <motion.div
              animate={shake ? { x: [-12, 12, -12, 12, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex justify-center gap-3"
            >
              {Array.from({ length: targetPin.length }).map((_, i) => (
                <div
                  key={i}
                  className={`w-11 h-11 rounded-2xl border-2 flex items-center justify-center font-bold text-base transition-all duration-300 ${
                    i < enteredPin.length
                      ? 'border-rose-500 bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)] scale-105'
                      : 'border-slate-300/80 bg-white/90 text-slate-300'
                  }`}
                >
                  {i < enteredPin.length ? '♥' : '•'}
                </div>
              ))}
            </motion.div>

            {/* Tactile Keypad */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-[250px] bg-white/80 backdrop-blur-xl p-3 rounded-3xl border border-white/80 shadow-xl shadow-purple-500/10">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', null, '0', 'del'].map(
                (k, idx) => {
                  if (k === null) return <div key={idx} />;
                  if (k === 'del') {
                    return (
                      <button
                        key={idx}
                        onClick={handleDelete}
                        className="h-11 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 flex items-center justify-center active:scale-90 transition-all font-bold"
                        aria-label="Xóa"
                      >
                        <Delete className="w-5 h-5" />
                      </button>
                    );
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => handleKeyPress(k)}
                      className="h-11 rounded-2xl bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-800 text-base font-bold shadow-sm active:scale-90 transition-all"
                    >
                      {k}
                    </button>
                  );
                }
              )}
            </div>

            {/* Smart Hint Assistance */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              <button
                type="button"
                onClick={() => {
                  soundFx.playPinClick();
                  setShowHint(!showHint);
                }}
                className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showHint ? 'Ẩn gợi ý' : 'Quên mã PIN? Xem gợi ý'}</span>
              </button>

              {(showHint || failCount >= 2) && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-semibold max-w-xs shadow-sm"
                >
                  💡 {getSmartHint()}
                </motion.div>
              )}

              <button
                onClick={() => {
                  setEnteredPin(targetPin);
                  triggerCinematicSequence();
                }}
                className="text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors mt-1"
              >
                Mở nhanh (Mã: {targetPin})
              </button>
            </div>
          </motion.div>
        ) : (
          /* ========================================================
             CINEMATIC REVEAL: PARCHMENT LETTER WITH LAYERED PAPERCLIP POLAROIDS
             ======================================================== */
          <motion.div
            key="envelope-unlocked"
            initial={{ scale: 0.5, opacity: 0, y: 40, rotateX: 25 }}
            animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.8, type: 'spring', bounce: 0.25 }}
            className="relative z-10 w-full max-w-2xl mx-auto"
          >
            <div className="bg-white/95 backdrop-blur-2xl p-6 sm:p-10 rounded-3xl border border-rose-200/90 shadow-[0_25px_60px_-15px_rgba(244,63,94,0.25)] text-center space-y-6">
              {/* Floating Wax Heart Badge */}
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/30"
              >
                <Heart className="w-8 h-8 fill-white" />
              </motion.div>

              {/* Recipient Title */}
              <div>
                <span className="text-[11px] uppercase tracking-widest text-rose-500 font-extrabold bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                  Thư Tình 20/10 Niêm Phong Sáp
                </span>
                <h2
                  className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2"
                  style={{ fontFamily: config.fontFamily || 'Dancing Script' }}
                >
                  Gửi {config.recipientName} 💕
                </h2>
              </div>

              {/* Main Romantic Letter Body with Paper Texture Grain */}
              <div
                className="text-slate-800 leading-relaxed text-base sm:text-lg bg-amber-50/70 p-6 sm:p-8 rounded-2xl border border-amber-200/60 text-left font-serif shadow-inner whitespace-pre-line relative overflow-hidden"
                style={{ fontFamily: config.fontFamily || 'Dancing Script' }}
              >
                {/* Paper texture glint & wax stamp decoration */}
                <div className="absolute top-2 right-3 text-rose-400/40 text-2xl select-none pointer-events-none">
                  🌹
                </div>
                {config.mainText}
              </div>

              {/* Layered Paperclip Polaroid Photo Inserts */}
              {userImages.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1.5 text-rose-600">
                      <Pin className="w-3.5 h-3.5 text-amber-500 rotate-45" />
                      <span>Ảnh Kỷ Niệm Kèm Theo Thư ({userImages.length} tấm)</span>
                    </span>
                    <span className="text-[11px] text-slate-400">Chạm để lật tráo ảnh</span>
                  </div>

                  <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap pt-2">
                    {userImages.map((img, i) => {
                      const isSelected = activePolaroidIndex === i;
                      return (
                        <motion.div
                          key={i}
                          whileHover={{ scale: 1.08, rotate: 0 }}
                          onClick={() => {
                            soundFx.playPaperSwoosh();
                            setActivePolaroidIndex(i);
                          }}
                          className={`relative cursor-pointer transition-all duration-300 p-2 sm:p-2.5 bg-white rounded-2xl shadow-xl border-2 ${
                            isSelected
                              ? 'border-rose-400 ring-4 ring-rose-200/50 scale-105 z-20 -rotate-1'
                              : 'border-slate-200/80 opacity-80 hover:opacity-100 z-10'
                          }`}
                          style={{
                            width: '130px',
                            transform: !isSelected ? `rotate(${(i % 2 === 0 ? 3 : -3) * (i + 1)}deg)` : undefined,
                          }}
                        >
                          {/* Golden Paperclip Decor */}
                          <div className="absolute -top-3 left-4 w-3.5 h-7 rounded-full border-2 border-amber-400 bg-amber-100/60 shadow-sm z-30" />

                          {/* Image */}
                          <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </div>

                          {/* Polaroid Caption */}
                          <p className="text-[9px] font-bold text-center text-slate-600 mt-1 italic">
                            Kỷ niệm #{i + 1}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sender Signature */}
              <div className="pt-2 text-right">
                <p
                  className="text-lg font-bold text-rose-600 italic"
                  style={{ fontFamily: config.fontFamily || 'Dancing Script' }}
                >
                  — {config.senderName} 🌹
                </p>
              </div>

              {/* Lock Back Action for Studio Mode */}
              {mode === 'studio' && (
                <div className="pt-4 border-t border-slate-100 flex justify-center">
                  <button
                    onClick={() => {
                      setIsUnlocked(false);
                      setUnlockStep(0);
                      setEnteredPin('');
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 hover:opacity-80 transition-opacity"
                  >
                    Khóa lại để thử lại quy trình mở thư
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
