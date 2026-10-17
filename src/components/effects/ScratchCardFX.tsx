import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Coins, Stamp } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CardConfig } from '../../types';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  config: CardConfig;
  mode: 'studio' | 'recipient';
}

interface SparkleParticle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  vx: number;
  vy: number;
}

export default function ScratchCardFX({ config, mode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [percentRevealed, setPercentRevealed] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFadingFoil, setIsFadingFoil] = useState(false);
  const [isScratching, setIsScratching] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastCalcTimeRef = useRef<number>(0);
  const sparkleTrailRef = useRef<SparkleParticle[]>([]);

  const userImages = config.images || [];

  const drawFoilLayer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    // Shimmering Gold & Silver Foil Gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#D4AF37'); // Gold
    grad.addColorStop(0.25, '#FFF8DC'); // Light shimmer
    grad.addColorStop(0.5, '#C0C0C0'); // Silver
    grad.addColorStop(0.75, '#F5D77F'); // Gold glint
    grad.addColorStop(1, '#996515'); // Deep bronze
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sparkle Dust Flecks
    for (let i = 0; i < 280; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 2.5;
      const alpha = 0.2 + Math.random() * 0.6;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }

    // Typography & Coin Icon
    ctx.fillStyle = 'rgba(78, 52, 10, 0.75)';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ CÀO NHẸ TẠI ĐÂY ✨', canvas.width / 2, canvas.height / 2 - 12);

    ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(78, 52, 10, 0.6)';
    ctx.fillText('Dùng tay hoặc chuột để khám phá bức thư bí mật', canvas.width / 2, canvas.height / 2 + 16);
  }, []);

  // Initialize Shimmering Gold/Silver Metallic Layer
  useEffect(() => {
    if (!isRevealed) {
      drawFoilLayer();
    }
  }, [isRevealed, drawFoilLayer]);

  const handleResetFoil = () => {
    soundFx.playPinClick();
    setIsFadingFoil(false);
    setIsRevealed(false);
    setPercentRevealed(0);
    setTimeout(() => {
      drawFoilLayer();
    }, 50);
  };

  // Throttled and Strided Percentage Calculation
  const calculateRevealedPercentage = useCallback(() => {
    const now = Date.now();
    if (now - lastCalcTimeRef.current < 180) return;
    lastCalcTimeRef.current = now;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let transparent = 0;
      let totalSamples = 0;

      for (let i = 3; i < data.length; i += 16 * 4) {
        totalSamples++;
        if (data[i] === 0) {
          transparent++;
        }
      }

      if (totalSamples > 0) {
        const pct = Math.round((transparent / totalSamples) * 100);
        setPercentRevealed(pct);

        if (pct >= 65 && !isRevealed && !isFadingFoil) {
          setIsFadingFoil(true);
          soundFx.playSuccessChime();

          const colors = ['#FB7185', '#FBBF24', '#C084FC', '#38BDF8', '#34D399', '#FFD700'];
          confetti({
            particleCount: 160,
            spread: 110,
            origin: { y: 0.5 },
            colors,
          });

          setTimeout(() => {
            confetti({
              particleCount: 80,
              angle: 60,
              spread: 70,
              origin: { x: 0.1, y: 0.6 },
              colors,
            });
          }, 200);

          setTimeout(() => {
            confetti({
              particleCount: 80,
              angle: 120,
              spread: 70,
              origin: { x: 0.9, y: 0.6 },
              colors,
            });
          }, 350);

          setTimeout(() => {
            setIsRevealed(true);
          }, 600);
        }
      }
    } catch {}
  }, [isRevealed, isFadingFoil]);

  // Tactile Coin Scratch Simulation with Sparkle Trail
  const scratch = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current;
      if (!canvas || isRevealed) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = (x - rect.left) * (canvas.width / rect.width);
      const canvasY = (y - rect.top) * (canvas.height / rect.height);

      ctx.globalCompositeOperation = 'destination-out';

      // Coin Stroke Path
      if (lastPosRef.current) {
        ctx.beginPath();
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        ctx.lineTo(canvasX, canvasY);
        ctx.lineWidth = 48;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      // Circular Dab
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 24, 0, Math.PI * 2);
      ctx.fill();

      // Audio feedback
      soundFx.playScratchFriction();

      // Add sparkle trail
      sparkleTrailRef.current.push({
        x: canvasX,
        y: canvasY,
        size: 3 + Math.random() * 4,
        alpha: 1,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
      });

      lastPosRef.current = { x: canvasX, y: canvasY };
      calculateRevealedPercentage();
    },
    [isRevealed, calculateRevealedPercentage]
  );

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsScratching(true);
    lastPosRef.current = null;
    if ('touches' in e) {
      scratch(e.touches[0].clientX, e.touches[0].clientY);
    } else {
      scratch(e.clientX, e.clientY);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isScratching) return;
    if ('touches' in e) {
      e.preventDefault();
      scratch(e.touches[0].clientX, e.touches[0].clientY);
    } else {
      scratch(e.clientX, e.clientY);
    }
  };

  const handleEnd = () => {
    setIsScratching(false);
    lastPosRef.current = null;
    calculateRevealedPercentage();
  };

  return (
    <div className="relative w-full h-full min-h-[520px] sm:min-h-[620px] flex items-center justify-center p-4 overflow-hidden select-none">
      {/* Warm Gold & Rose Ambient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-100/80 via-yellow-50/70 to-rose-100/80 pointer-events-none" />

      {/* Floating Gold Sparkles */}
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-amber-400 pointer-events-none"
          style={{
            left: `${10 + ((i * 12) % 80)}%`,
            top: `${15 + ((i * 16) % 70)}%`,
          }}
          animate={{
            scale: [0.6, 1.3, 0.6],
            opacity: [0.2, 0.8, 0.2],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 3 + i * 0.4,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        >
          <Sparkles className="w-5 h-5 drop-shadow" />
        </motion.div>
      ))}

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center">
        {/* Progress Pill Indicator */}
        {!isRevealed && mode === 'recipient' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-xl border border-amber-300 shadow-md text-amber-800 text-xs font-bold"
          >
            <Coins className="w-4 h-4 text-amber-500 animate-bounce" />
            <span>Tiến độ cào: {percentRevealed}% (Đạt 65% để mở trọn vẹn)</span>
          </motion.div>
        )}

        {/* Scratch Card Frame */}
        <div
          className="relative w-full rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(245,158,11,0.35)] border-2 border-amber-300/60 bg-white"
          style={{ minHeight: '440px' }}
        >
          {/* Secret Hidden Postage Collage Beneath */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/90 via-rose-50/90 to-purple-50/90 flex flex-col justify-between p-6 sm:p-7 overflow-y-auto">
            {/* Top Postage Stamp & Recipient Header */}
            <div className="flex items-center justify-between border-b border-rose-200/60 pb-3">
              <div className="text-left">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                  Tem Thư Tình 20/10
                </span>
                <h3
                  className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1"
                  style={{ fontFamily: config.fontFamily ? `${config.fontFamily}, 'Be Vietnam Pro', sans-serif` : "'Be Vietnam Pro', sans-serif" }}
                >
                  Gửi {config.recipientName} 💕
                </h3>
              </div>

              {/* Vintage Postage Stamp with Photo or Rose */}
              <div className="w-14 h-16 rounded-lg bg-white border-2 border-dashed border-amber-400 p-1 shadow-md shrink-0 flex flex-col items-center justify-center relative rotate-3">
                {userImages.length > 0 ? (
                  <img src={userImages[0]} alt="" className="w-full h-full object-cover rounded" />
                ) : (
                  <Stamp className="w-6 h-6 text-amber-600" />
                )}
                <span className="text-[7px] font-black text-amber-800 tracking-tighter mt-0.5">20/10 POST</span>
              </div>
            </div>

            {/* Main Romantic Letter */}
            <div
              className="my-3 text-slate-800 leading-relaxed text-sm sm:text-base bg-white/80 p-4 rounded-2xl border border-rose-100 shadow-inner font-serif text-left whitespace-pre-line"
              style={{ fontFamily: config.fontFamily ? `${config.fontFamily}, 'Be Vietnam Pro', sans-serif` : "'Be Vietnam Pro', sans-serif" }}
            >
              {config.mainText}
            </div>

            {/* Collage Photos Row if Uploaded */}
            {userImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                {userImages.slice(1).map((img, i) => (
                  <div
                    key={i}
                    className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-md shrink-0 bg-slate-100"
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Sender Signature */}
            <div className="text-right pt-2 border-t border-rose-200/60">
              <p
                className="text-base font-bold text-rose-600 italic"
                style={{ fontFamily: config.fontFamily ? `${config.fontFamily}, 'Be Vietnam Pro', sans-serif` : "'Be Vietnam Pro', sans-serif" }}
              >
                — {config.senderName} 🎁
              </p>
            </div>
          </div>

          {/* Shimmering Metallic Foil Canvas Layer */}
          {!isRevealed && (
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full scratch-canvas z-20 touch-none transition-opacity duration-700 ${
                isFadingFoil ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
            />
          )}
        </div>

        {/* Celebration Ribbon */}
        <AnimatePresence>
          {isRevealed && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center mt-5"
            >
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white font-extrabold text-xs shadow-lg shadow-rose-500/30">
                <Sparkles className="w-4 h-4" />
                <span>🎉 Bất Ngờ Đã Được Mở Trọn Vẹn! 🎉</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Studio Scratch Reset Tool */}
        {mode === 'studio' && (
          <div className="text-center mt-3">
            <button
              onClick={handleResetFoil}
              className="text-xs font-bold text-rose-500 hover:text-rose-700 hover:opacity-80 transition-opacity"
            >
              {isRevealed ? 'Phủ lại lớp nhũ bạc để cào thử lại' : 'Làm mới lớp cào'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
