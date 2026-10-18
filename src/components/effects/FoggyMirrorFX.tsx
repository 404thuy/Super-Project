import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CardConfig } from '../../types';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  config: CardConfig;
  mode: 'studio' | 'recipient';
}

const REVEAL_THRESHOLD = 45; // % of canvas wiped before auto-reveal

export default function FoggyMirrorFX({ config, mode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [percentWiped, setPercentWiped] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const isWipingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastCalcRef = useRef<number>(0);
  const userImages = config.images || [];

  // Draw foggy glass overlay with realistic condensation and droplet streaks
  const drawFog = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth || 400;
      canvas.height = parent.clientHeight || 520;
    }

    // Luxury steam mist gradient (soft frosted glass)
    const grad = ctx.createRadialGradient(
      canvas.width * 0.5, canvas.height * 0.45, 20,
      canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.85
    );
    grad.addColorStop(0, 'rgba(195, 215, 245, 0.90)');
    grad.addColorStop(0.4, 'rgba(175, 200, 238, 0.93)');
    grad.addColorStop(0.8, 'rgba(145, 175, 220, 0.96)');
    grad.addColorStop(1, 'rgba(120, 150, 198, 0.98)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Micro-condensation noise texture
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = 1 + Math.random() * 3.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.12 + Math.random() * 0.35})`;
      ctx.fill();
    }

    // Realistic water droplet trails running down glass
    for (let i = 0; i < 45; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * (canvas.height * 0.75);
      const len = 15 + Math.random() * 60;
      const alpha = 0.15 + Math.random() * 0.35;

      const streak = ctx.createLinearGradient(x, y, x + 0.5, y + len);
      streak.addColorStop(0, `rgba(255, 255, 255, 0)`);
      streak.addColorStop(0.3, `rgba(255, 255, 255, ${alpha})`);
      streak.addColorStop(0.9, `rgba(255, 255, 255, ${alpha * 0.6})`);
      streak.addColorStop(1, `rgba(255, 255, 255, 0)`);
      ctx.fillStyle = streak;
      ctx.beginPath();
      ctx.ellipse(x, y + len / 2, 1.8, len / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Droplet bulb at the bottom of streak
      ctx.beginPath();
      ctx.arc(x, y + len, 2.5 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 1.2})`;
      ctx.fill();
    }

    // Ornate calligraphy on foggy glass
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = 'rgba(24, 38, 75, 0.82)';
    ctx.font = 'bold 19px "Cinzel", "Playfair Display", serif';
    ctx.fillText('⚜️ GƯƠNG PHA LÊ KÝ ỨC ⚜️', canvas.width / 2, canvas.height / 2 - 24);

    ctx.shadowBlur = 0;
    ctx.font = '500 13px "Be Vietnam Pro", sans-serif';
    ctx.fillStyle = 'rgba(24, 38, 75, 0.65)';
    ctx.fillText('Chạm và lau sương mờ để mở bức thư...', canvas.width / 2, canvas.height / 2 + 10);

    // Subtle finger guide icon
    ctx.font = '22px sans-serif';
    ctx.fillText('✨ 👆 ✨', canvas.width / 2, canvas.height / 2 + 48);
  }, []);

  useEffect(() => {
    if (!isRevealed) drawFog();
  }, [isRevealed, drawFog]);

  // Calculate wiped percentage (throttled)
  const calcWiped = useCallback(() => {
    const now = Date.now();
    if (now - lastCalcRef.current < 200) return;
    lastCalcRef.current = now;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let transparent = 0, total = 0;
      for (let i = 3; i < data.length; i += 16 * 4) {
        total++;
        if (data[i] < 50) transparent++;
      }
      if (total > 0) {
        const pct = Math.round((transparent / total) * 100);
        setPercentWiped(pct);

        if (pct >= REVEAL_THRESHOLD && !isRevealed && !isFading) {
          setIsFading(true);
          soundFx.playSuccessChime();
          confetti({
            particleCount: 100, spread: 90, origin: { y: 0.5 },
            colors: ['#FBBF24', '#F59E0B', '#93C5FD', '#E0E7FF', '#FFFFFF'],
          });
          setTimeout(() => setIsRevealed(true), 600);
        }
      }
    } catch (_e) {}
  }, [isRevealed, isFading]);

  // Wipe function
  const wipe = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const cx = (x - rect.left) * (canvas.width / rect.width);
    const cy = (y - rect.top) * (canvas.height / rect.height);

    ctx.globalCompositeOperation = 'destination-out';

    if (lastPosRef.current) {
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(cx, cy);
      ctx.lineWidth = 60;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fill();

    lastPosRef.current = { x: cx, y: cy };
    calcWiped();
  }, [isRevealed, calcWiped]);

  const handleStart = (e: React.PointerEvent | React.TouchEvent) => {
    isWipingRef.current = true;
    lastPosRef.current = null;
    soundFx.playPaperSwoosh();
    const pos = 'touches' in e ? { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY } : { clientX: (e as React.PointerEvent).clientX, clientY: (e as React.PointerEvent).clientY };
    wipe(pos.clientX, pos.clientY);
  };

  const handleMove = (e: React.PointerEvent | React.TouchEvent) => {
    if (!isWipingRef.current) return;
    if ('touches' in e) {
      e.preventDefault();
      wipe(e.touches[0].clientX, e.touches[0].clientY);
    } else {
      wipe((e as React.PointerEvent).clientX, (e as React.PointerEvent).clientY);
    }
  };

  const handleEnd = () => {
    isWipingRef.current = false;
    lastPosRef.current = null;
    calcWiped();
  };

  const handleReset = () => {
    setIsRevealed(false);
    setIsFading(false);
    setPercentWiped(0);
    setTimeout(() => drawFog(), 50);
  };

  return (
    <div className="relative w-full h-full min-h-[100%] overflow-y-auto sm:overflow-hidden select-none flex items-center justify-center p-3 sm:p-5"
      style={{ background: 'radial-gradient(ellipse at 50% 25%, #1e1b4b 0%, #0c0f24 55%, #050714 100%)' }}>

      {/* Luxury ambient chandelier glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-400/10 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-blue-500/10 blur-[90px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {!isRevealed ? (
          <motion.div key="fog-stage" className="relative w-full max-w-md flex flex-col items-center justify-center my-auto"
            exit={{ opacity: 0, scale: 0.96 }}>

            {/* Progress Badge */}
            <div className="mb-3 flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-amber-400/40 text-amber-200 text-xs font-bold shadow-xl">
              <Droplets className="w-3.5 h-3.5 text-blue-300 animate-bounce" />
              <span>Độ trong suốt: <span className="text-amber-300 font-extrabold">{percentWiped}%</span> / {REVEAL_THRESHOLD}%</span>
            </div>

            {/* Baroque Gilded Mirror Frame */}
            <div className="relative w-full rounded-[2.5rem] p-3.5 sm:p-4 bg-gradient-to-b from-amber-200 via-amber-500 to-amber-700 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(245,158,11,0.25)] border border-amber-300/60">

              {/* Ornate Gold Crown Crest at Top */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-1 rounded-full bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700 border border-amber-200 text-amber-950 font-extrabold text-[11px] tracking-widest uppercase shadow-md flex items-center gap-1.5">
                <span>⚜️</span>
                <span>LE MIROIR D'OR</span>
                <span>⚜️</span>
              </div>

              {/* Baroque Corner Rosettes */}
              <div className="absolute top-2 left-2 text-amber-900/60 text-xs select-none">❖</div>
              <div className="absolute top-2 right-2 text-amber-900/60 text-xs select-none">❖</div>
              <div className="absolute bottom-2 left-2 text-amber-900/60 text-xs select-none">❖</div>
              <div className="absolute bottom-2 right-2 text-amber-900/60 text-xs select-none">❖</div>

              {/* Inner Bevelled Mirror Frame */}
              <div className="relative w-full rounded-[2rem] overflow-hidden border-2 border-amber-900/50 shadow-[inset_0_4px_16px_rgba(0,0,0,0.6)] min-h-[420px] sm:min-h-[460px] bg-[#090d1a]">

                {/* Content layer (revealed under fog) */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0e1628] via-[#090d1a] to-[#060812] flex flex-col justify-between p-6">

                  {/* Decorative royal header */}
                  <div className="text-center pt-2">
                    <span className="text-[10px] font-extrabold tracking-[0.25em] text-amber-400 uppercase">
                      ✦ KỶ NIỆM BẤT DIỆT ✦
                    </span>
                    <h3 className="text-2xl font-bold text-white mt-1.5 drop-shadow-md"
                      style={{ fontFamily: config.fontFamily || 'Cinzel, Playfair Display, serif' }}>
                      Gửi {config.recipientName} 💫
                    </h3>
                  </div>

                  {/* Photo Gallery Frame */}
                  {userImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2.5 my-3">
                      {userImages.slice(0, 4).map((img, i) => (
                        <div key={i} className={`rounded-xl overflow-hidden border-2 border-amber-400/40 shadow-lg relative group ${i === 0 ? 'col-span-2 h-36' : 'h-24'}`}>
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="my-3 text-center py-6">
                      <div className="inline-block p-4 rounded-full bg-amber-400/10 border border-amber-400/30 text-4xl shadow-inner">
                        👑
                      </div>
                    </div>
                  )}

                  {/* Message body */}
                  <div className="relative p-3.5 rounded-xl bg-white/[0.04] border border-amber-400/20 backdrop-blur-sm shadow-inner">
                    <p className="text-amber-100/90 text-sm leading-relaxed whitespace-pre-line text-center italic"
                      style={{ fontFamily: config.fontFamily || 'Playfair Display, serif' }}>
                      "{config.mainText}"
                    </p>
                  </div>

                  {/* Signature */}
                  <div className="flex items-center gap-2 justify-center mt-3 pt-2 border-t border-amber-400/20">
                    <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 animate-pulse" />
                    <span className="text-amber-300 font-semibold text-xs tracking-wider uppercase">— {config.senderName} —</span>
                  </div>
                </div>

                {/* Fog canvas overlay */}
                <canvas
                  ref={canvasRef}
                  className={`absolute inset-0 w-full h-full z-20 touch-none transition-opacity duration-700 ${isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                  onPointerDown={handleStart}
                  onPointerMove={handleMove}
                  onPointerUp={handleEnd}
                  onPointerLeave={handleEnd}
                  onTouchStart={handleStart}
                  onTouchMove={handleMove}
                  onTouchEnd={handleEnd}
                />
              </div>
            </div>

            <p className="text-amber-200/50 text-[11px] mt-3 tracking-wide">
              {mode === 'studio' ? '✦ Vuốt hoặc chạm để lau sạch mặt gương' : '✦ Dùng ngón tay lau nhẹ để mở khóa bí mật'}
            </p>
          </motion.div>
        ) : (
          /* ─── REVEALED STAGE ─── */
          <motion.div key="revealed"
            className="w-full max-w-md flex flex-col items-center justify-center p-3 my-auto"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}>

            {/* Revealed Badge */}
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
              className="mb-3 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 text-slate-950 font-black text-xs tracking-wider uppercase shadow-[0_0_25px_rgba(245,158,11,0.5)]">
              <span>⚜️ Gương Pha Lê Đã Sáng Tỏ ⚜️</span>
            </motion.div>

            {/* Luxury Gilded Frame with Revealed Content */}
            <div className="relative w-full rounded-[2.5rem] p-3.5 sm:p-4 bg-gradient-to-b from-amber-200 via-amber-500 to-amber-700 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(245,158,11,0.3)] border border-amber-300">

              {/* Corner rosettes */}
              <div className="absolute top-2 left-2 text-amber-950 font-bold select-none">❖</div>
              <div className="absolute top-2 right-2 text-amber-950 font-bold select-none">❖</div>
              <div className="absolute bottom-2 left-2 text-amber-950 font-bold select-none">❖</div>
              <div className="absolute bottom-2 right-2 text-amber-950 font-bold select-none">❖</div>

              <div className="relative w-full rounded-[2rem] overflow-hidden bg-gradient-to-b from-[#0f172a] via-[#090d1a] to-[#04060c] p-6 border-2 border-amber-900/60 shadow-inner">

                {/* Header */}
                <div className="text-center mb-4">
                  <span className="text-[10px] font-extrabold tracking-[0.25em] text-amber-400 uppercase">
                    Gửi tới {config.recipientName}
                  </span>
                  <div className="h-px w-24 mx-auto my-2 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                </div>

                {/* Photos with Gold Border */}
                {userImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {userImages.slice(0, 4).map((img, i) => (
                      <div key={i} className={`rounded-xl overflow-hidden border border-amber-400/50 shadow-md ${i === 0 ? 'col-span-2 h-36' : 'h-24'}`}>
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Letter Body */}
                <p className="text-amber-100 text-sm leading-relaxed whitespace-pre-line text-center italic my-3"
                  style={{ fontFamily: config.fontFamily || 'Playfair Display, serif' }}>
                  "{config.mainText}"
                </p>

                {/* Footer Signature */}
                <div className="flex items-center gap-1.5 mt-5 pt-3 border-t border-amber-400/30 justify-center">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span className="text-amber-300 font-bold text-sm tracking-wide">— {config.senderName} —</span>
                </div>
              </div>
            </div>

            {/* Studio Reset Button */}
            {mode === 'studio' && (
              <button onClick={handleReset}
                className="mt-4 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-amber-400/30 text-amber-200 text-xs font-semibold transition-all">
                ↺ Phủ lại sương pha lê
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
