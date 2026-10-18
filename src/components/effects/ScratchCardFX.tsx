import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Coins, Stamp, Heart } from 'lucide-react';
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
  const [coinPos, setCoinPos] = useState<{ x: number; y: number } | null>(null);
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

    // Shimmering High-End Gold & Silver Foil Gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#B8860B'); // Dark goldenrod
    grad.addColorStop(0.2, '#FFD700'); // Pure gold
    grad.addColorStop(0.4, '#FFF8DC'); // Light gold sheen
    grad.addColorStop(0.6, '#E6C229'); // Warm gold
    grad.addColorStop(0.85, '#D4AF37'); // Metallic gold
    grad.addColorStop(1, '#8B6508'); // Antique bronze
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Guilloché & Vintage Border Frame on Foil
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 3;
    ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

    ctx.strokeStyle = 'rgba(78, 52, 10, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

    // Sparkle Gold Flecks
    for (let i = 0; i < 320; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 2.5;
      const alpha = 0.25 + Math.random() * 0.65;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }

    // Royal Monogram Crest on Foil Center
    ctx.font = '28px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(66, 38, 5, 0.8)';
    ctx.fillText('⚜️', canvas.width / 2, canvas.height / 2 - 38);

    // Typography on Foil
    ctx.fillStyle = 'rgba(66, 38, 5, 0.9)';
    ctx.font = 'bold 18px "Playfair Display", serif';
    ctx.fillText('✨ THẺ CÀO HOÀNG GIA 20/10 ✨', canvas.width / 2, canvas.height / 2 - 4);

    ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(78, 52, 10, 0.75)';
    ctx.fillText('Dùng tay hoặc chuột để cào mở bức thư bí mật', canvas.width / 2, canvas.height / 2 + 22);

    ctx.font = 'italic 11px serif';
    ctx.fillStyle = 'rgba(120, 53, 15, 0.7)';
    ctx.fillText('✦ Điều bất ngờ ngọt ngào đang chờ đón bạn ✦', canvas.width / 2, canvas.height / 2 + 42);
  }, []);

  // Initialize Shimmering Gold Layer
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

  // Throttled Percentage Calculation
  const calculateRevealedPercentage = useCallback(() => {
    const now = Date.now();
    if (now - lastCalcTimeRef.current < 160) return;
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

        if (pct >= 60 && !isRevealed && !isFadingFoil) {
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

  const scratchAt = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.globalCompositeOperation = 'destination-out';

      // Scratch with circular tip
      const radius = 28;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Bridge gap if dragging quickly
      if (lastPosRef.current) {
        ctx.lineWidth = radius * 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      lastPosRef.current = { x, y };
      calculateRevealedPercentage();
    },
    [calculateRevealedPercentage]
  );

  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isRevealed) return;
    setIsScratching(true);
    soundFx.playScratchFriction();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    lastPosRef.current = { x, y };
    setCoinPos({ x: clientX, y: clientY });
    scratchAt(x, y);
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isScratching || isRevealed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setCoinPos({ x: clientX, y: clientY });
    scratchAt(x, y);
  };

  const handleEnd = () => {
    setIsScratching(false);
    lastPosRef.current = null;
    setCoinPos(null);
  };

  return (
    <div className="relative w-full h-full min-h-full flex items-center justify-center p-3 sm:p-5 overflow-y-auto sm:overflow-hidden select-none">
      {/* Deep Royal Palace Gold & Velvet Ambient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1c0f05] via-[#2a1708] to-[#0d0703] pointer-events-none" />

      {/* Radial Amber & Gold Luster */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-amber-500/15 blur-[120px] pointer-events-none" />

      {/* Floating Gold Sparkles */}
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-amber-300 pointer-events-none"
          style={{
            left: `${8 + ((i * 13) % 84)}%`,
            top: `${12 + ((i * 17) % 76)}%`,
          }}
          animate={{
            scale: [0.6, 1.3, 0.6],
            opacity: [0.2, 0.85, 0.2],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 3.5 + i * 0.4,
            repeat: Infinity,
            delay: i * 0.25,
          }}
        >
          <Sparkles className="w-5 h-5 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
        </motion.div>
      ))}

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center py-2">
        {/* Progress Pill Indicator */}
        {!isRevealed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-900/90 backdrop-blur-xl border border-amber-400/50 shadow-xl text-amber-200 text-xs font-bold"
          >
            <Coins className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>Tiến độ cào: {percentRevealed}% (Đạt 60% để mở trọn vẹn)</span>
          </motion.div>
        )}

        {/* Scratch Card Frame */}
        <div className="relative w-full rounded-3xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.95)] border-2 border-amber-400/80 bg-gradient-to-b from-[#241407] to-[#120a03] min-h-[400px] sm:min-h-[460px]">
          {/* Baroque Corner Brackets */}
          <span className="absolute top-2 left-2.5 text-amber-400 text-sm pointer-events-none z-30">❖</span>
          <span className="absolute top-2 right-2.5 text-amber-400 text-sm pointer-events-none z-30">❖</span>
          <span className="absolute bottom-2 left-2.5 text-amber-400 text-sm pointer-events-none z-30">❖</span>
          <span className="absolute bottom-2 right-2.5 text-amber-400 text-sm pointer-events-none z-30">❖</span>

          {/* Secret Hidden Postage & Royal Love Certificate Collage Beneath */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFFDF5] via-[#FFF8E7] to-[#FFF1F2] flex flex-col justify-between p-4 sm:p-7 overflow-y-auto">
            {/* Top Postage Stamp & Recipient Header */}
            <div className="flex items-center justify-between border-b-2 border-amber-800/20 pb-3">
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 bg-amber-200/90 px-3 py-0.5 rounded-full border border-amber-400 shadow-2xs">
                  ✦ CHỨNG NHẬN YÊU THƯƠNG 20/10 ✦
                </span>
                <h3
                  className="text-xl sm:text-2xl font-black text-amber-950 mt-1 font-serif tracking-tight"
                  style={{ fontFamily: config.fontFamily ? `${config.fontFamily}, 'Playfair Display', serif` : "'Playfair Display', serif" }}
                >
                  Gửi: {config.recipientName || 'Em yêu'} 💕
                </h3>
              </div>

              {/* Vintage Postage Stamp with Gold Perforated Rim */}
              {(() => {
                const stampImg = userImages[0] || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80';
                return (
                  <div className="w-16 h-20 sm:w-18 sm:h-22 rounded-xl bg-white border-2 border-dashed border-amber-600/90 p-1 shadow-lg shrink-0 flex flex-col items-center justify-center relative rotate-2 group cursor-pointer hover:rotate-0 transition-transform">
                    <img src={stampImg} alt="Stamp" className="w-full h-full object-cover rounded-lg" />
                    <div className="absolute -bottom-2 -left-2 px-1.5 py-0.5 rounded-full bg-rose-600 text-white font-mono font-black text-[7px] shadow-sm">
                      20/10
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Main Romantic Letter with Calligraphy */}
            <div
              className="my-2.5 text-stone-900 leading-relaxed text-sm sm:text-base bg-white/90 p-4 sm:p-5 rounded-2xl border border-amber-300/80 shadow-[inset_0_2px_6px_rgba(217,119,6,0.08)] font-serif text-left whitespace-pre-line relative overflow-hidden"
              style={{ fontFamily: config.fontFamily ? `${config.fontFamily}, 'Playfair Display', serif` : "'Playfair Display', serif" }}
            >
              <div className="absolute top-1 right-2 text-rose-300/25 text-3xl select-none pointer-events-none">
                💌
              </div>
              {config.mainText || 'Bất ngờ chưa! Chúc em ngày 20/10 ngập tràn nụ cười và hạnh phúc viên mãn!'}
            </div>

            {/* Collage Photos Row (Hidden Treasures Revealed) */}
            {(() => {
              const extraPhotos = userImages.length > 1
                ? userImages.slice(1)
                : [
                    'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&auto=format&fit=crop&q=80',
                  ];
              return (
                <div className="py-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-900/80 mb-1 px-1">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>{userImages.length > 1 ? 'Kỷ niệm hé lộ dưới lớp cào' : 'Khoảnh khắc hé lộ ngọt ngào'}</span>
                    </span>
                    <span className="text-[10px] text-amber-700/60 italic">Bất ngờ 20/10</span>
                  </div>
                  <div className="flex items-center gap-2.5 overflow-x-auto py-1 scrollbar-none">
                    {extraPhotos.map((img, i) => (
                      <div
                        key={i}
                        className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-amber-400 shadow-md shrink-0 bg-stone-100 p-0.5 relative group"
                      >
                        <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                        <div className="absolute bottom-1 right-1 text-[8px] bg-black/60 text-amber-200 px-1 rounded font-mono">
                          #{i + 2}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Sender Signature & Congratulation Stamp */}
            <div className="text-right pt-2 border-t-2 border-amber-800/20 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-800 text-[10px] sm:text-xs font-bold font-serif">
                <Stamp className="w-4 h-4 text-amber-600" />
                <span>Niêm phong may mắn</span>
              </div>
              <p
                className="text-base sm:text-lg font-bold text-amber-900 italic font-serif"
                style={{ fontFamily: config.fontFamily ? `${config.fontFamily}, 'Playfair Display', serif` : "'Playfair Display', serif" }}
              >
                — {config.senderName || 'Người bí ẩn'} 🎁
              </p>
            </div>
          </div>

          {/* Shimmering Metallic Foil Canvas Layer */}
          {!isRevealed && (
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full scratch-canvas z-20 touch-none transition-opacity duration-700 cursor-crosshair ${
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
              <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-stone-950 font-black text-xs shadow-xl border border-yellow-100">
                <Sparkles className="w-4 h-4 text-stone-950" />
                <span>🎉 Bất Ngờ Đã Được Khám Phá Trọn Vẹn! 🎉</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Studio Scratch Reset Tool */}
        {mode === 'studio' && (
          <div className="text-center mt-3">
            <button
              onClick={handleResetFoil}
              className="text-xs font-bold text-amber-400 hover:text-amber-200 hover:underline transition-all"
            >
              {isRevealed ? 'Phủ lại lớp nhũ vàng để cào thử' : 'Làm mới lớp cào'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
