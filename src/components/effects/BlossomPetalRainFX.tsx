import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wind, Flower2 } from 'lucide-react';
import type { CardConfig } from '../../types';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  config: CardConfig;
  mode: 'studio' | 'recipient';
}

interface Petal {
  x: number;
  y: number;
  size: number;
  roll: number;
  rollSpeed: number;
  pitch: number;
  pitchSpeed: number;
  yaw: number;
  yawSpeed: number;
  speedY: number;
  speedX: number;
  colorFront: string;
  colorBack: string;
  opacity: number;
}

interface FloorPetal {
  x: number;
  y: number;
  size: number;
  yaw: number;
  roll: number;
  pitch: number;
  colorFront: string;
  colorBack: string;
  opacity: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
}

const PETAL_PALETTE = [
  { front: '#FFB6C1', back: '#FF69B4' },
  { front: '#FFC0CB', back: '#FF1493' },
  { front: '#FFD1DC', back: '#F472B6' },
  { front: '#FCE7F3', back: '#FB7185' },
];

export default function BlossomPetalRainFX({ config, mode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const petalsRef = useRef<Petal[]>([]);
  const floorPetalsRef = useRef<FloorPetal[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const animationRef = useRef<number>(0);
  const windVector = useRef({ x: 0, y: 0 });
  const vortexAngleRef = useRef<number>(0);

  const [showCard, setShowCard] = useState(mode === 'studio');
  const [ribbonUntied, setRibbonUntied] = useState(mode === 'studio');
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const userImages = config.images || [];

  // Initialize petals
  const initPetals = useCallback((width: number, height: number) => {
    const petals: Petal[] = [];
    const count = window.innerWidth < 768 ? 40 : 70;
    for (let i = 0; i < count; i++) {
      const palette = PETAL_PALETTE[Math.floor(Math.random() * PETAL_PALETTE.length)];
      petals.push({
        x: Math.random() * width,
        y: Math.random() * height - height,
        size: 10 + Math.random() * 16,
        roll: Math.random() * Math.PI * 2,
        rollSpeed: (Math.random() - 0.5) * 0.04,
        pitch: Math.random() * Math.PI * 2,
        pitchSpeed: (Math.random() - 0.5) * 0.05,
        yaw: Math.random() * Math.PI * 2,
        yawSpeed: (Math.random() - 0.5) * 0.03,
        speedY: 1.2 + Math.random() * 2.0,
        speedX: (Math.random() - 0.5) * 0.8,
        colorFront: palette.front,
        colorBack: palette.back,
        opacity: 0.7 + Math.random() * 0.3,
      });
    }
    petalsRef.current = petals;
  }, []);

  const draw3DPetal = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    yaw: number,
    roll: number,
    pitch: number,
    colorFront: string,
    colorBack: string,
    opacity: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(yaw);

    const scaleX = Math.cos(roll);
    const scaleY = Math.sin(pitch);
    ctx.scale(scaleX, scaleY);
    ctx.globalAlpha = opacity;

    const isFront = scaleX * scaleY >= 0;
    ctx.fillStyle = isFront ? colorFront : colorBack;

    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo(size * 0.8, -size * 0.6, size * 0.7, size * 0.6, 0, size);
    ctx.bezierCurveTo(-size * 0.7, size * 0.6, -size * 0.8, -size * 0.6, 0, -size);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.8);
    ctx.lineTo(0, size * 0.8);
    ctx.stroke();

    ctx.restore();
  };

  const drawRipple = (ctx: CanvasRenderingContext2D, ripple: Ripple) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(251, 113, 133, ${ripple.opacity})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (ripple.radius > 15) {
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius * 0.65, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(244, 114, 182, ${ripple.opacity * 0.5})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.restore();
  };

  // Main physics loop with Swirl Gust Vortex
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
      if (petalsRef.current.length === 0) {
        initPetals(canvas.width, canvas.height);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    let time = 0;
    const animate = () => {
      time++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      windVector.current.x *= 0.95;
      windVector.current.y *= 0.95;
      vortexAngleRef.current += 0.02;

      // Draw accumulated floor petals
      floorPetalsRef.current.forEach((fp) => {
        draw3DPetal(
          ctx,
          fp.x,
          fp.y,
          fp.size,
          fp.yaw,
          fp.roll,
          fp.pitch,
          fp.colorFront,
          fp.colorBack,
          fp.opacity
        );
      });

      // Update and draw falling petals with Swirl Gust
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      petalsRef.current.forEach((petal) => {
        const turbulence = Math.sin(time * 0.02 + petal.x * 0.01) * 0.8;

        // Swirling vortex component if wind is active
        const dx = petal.x - centerX;
        const dy = petal.y - centerY;
        const swirlStrength = Math.abs(windVector.current.x) * 0.015;
        const swirlX = -dy * swirlStrength;
        const swirlY = dx * swirlStrength;

        petal.y += petal.speedY + windVector.current.y + swirlY;
        petal.x += petal.speedX + turbulence + windVector.current.x + swirlX;

        petal.roll += petal.rollSpeed;
        petal.pitch += petal.pitchSpeed;
        petal.yaw += petal.yawSpeed;

        // Settle into floor petals when reaching bottom
        if (petal.y > canvas.height - 15) {
          if (floorPetalsRef.current.length < 55) {
            floorPetalsRef.current.push({
              x: petal.x,
              y: canvas.height - 8 - Math.random() * 24,
              size: petal.size * 0.9,
              yaw: petal.yaw,
              roll: 0.1 + Math.random() * 0.2,
              pitch: 0.8 + Math.random() * 0.3,
              colorFront: petal.colorFront,
              colorBack: petal.colorBack,
              opacity: 0.55 + Math.random() * 0.25,
            });
          } else {
            const oldest = floorPetalsRef.current[0];
            oldest.opacity -= 0.02;
            if (oldest.opacity <= 0) {
              floorPetalsRef.current.shift();
            }
          }

          petal.y = -25;
          petal.x = Math.random() * canvas.width;
        }

        if (petal.x > canvas.width + 30) petal.x = -20;
        if (petal.x < -30) petal.x = canvas.width + 20;

        draw3DPetal(
          ctx,
          petal.x,
          petal.y,
          petal.size,
          petal.yaw,
          petal.roll,
          petal.pitch,
          petal.colorFront,
          petal.colorBack,
          petal.opacity
        );
      });

      // Update ripples
      ripplesRef.current = ripplesRef.current.filter((r) => {
        r.radius += 2.5;
        r.opacity -= 0.018;
        if (r.opacity <= 0) return false;
        drawRipple(ctx, r);
        return true;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [initPetals]);

  // Touch / Mouse interaction creating wind swirl + lake ripples
  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    windVector.current.x = (Math.random() - 0.5) * 6;
    windVector.current.y = -1.5;

    ripplesRef.current.push({
      x,
      y,
      radius: 5,
      maxRadius: 120,
      opacity: 0.7,
    });
  };

  const handleOpenCard = () => {
    soundFx.playPaperSwoosh();
    setRibbonUntied(true);
    setTimeout(() => {
      setShowCard(true);
      soundFx.playSuccessChime();
    }, 700);
  };

  return (
    <div className="relative w-full h-full min-h-[520px] sm:min-h-[620px] overflow-hidden select-none">
      {/* Spring Water Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100" />

      {/* Physics Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10 cursor-pointer"
        onMouseMove={handleInteraction}
        onTouchMove={handleInteraction}
        onClick={handleInteraction}
      />

      {/* Center Interactive Botanical Frame */}
      <div className="relative z-20 flex items-center justify-center w-full h-full min-h-[520px] sm:min-h-[620px] p-4 pointer-events-none">
        <AnimatePresence mode="wait">
          {!ribbonUntied && mode === 'recipient' ? (
            <motion.div
              key="sealed-box"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.3, opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="pointer-events-auto flex flex-col items-center gap-4 cursor-pointer"
              onClick={handleOpenCard}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="bg-white/90 backdrop-blur-2xl p-6 sm:p-10 rounded-3xl border border-rose-200 shadow-2xl text-center space-y-4 max-w-sm hover:scale-105 transition-transform"
              >
                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 text-7xl flex items-center justify-center"
                  >
                    🌸
                  </motion.div>
                  <div className="relative z-10 w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Món Quà 20/10 Dành Cho {config.recipientName}
                  </h3>
                  <p className="text-xs text-rose-500 font-bold mt-1">
                    Chạm vào dải ruy-băng để mở thiệp hoa 🌹
                  </p>
                </div>

                <div className="w-full h-9 bg-gradient-to-r from-rose-500 via-pink-400 to-rose-600 rounded-full shadow-md flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider">
                  Mở Thiệp Hoa
                </div>
              </motion.div>
            </motion.div>
          ) : showCard ? (
            /* ========================================================
               BOTANICAL PRESSED-FLOWER GLASS FRAME
               ======================================================== */
            <motion.div
              key="popup-card"
              initial={{ y: 50, opacity: 0, scale: 0.85, rotateX: 20 }}
              animate={{ y: 0, opacity: 1, scale: 1, rotateX: 0 }}
              transition={{ duration: 0.8, type: 'spring', bounce: 0.3 }}
              className="pointer-events-auto w-full max-w-2xl mx-auto"
            >
              <div className="relative bg-white/95 backdrop-blur-2xl p-6 sm:p-10 rounded-3xl border-2 border-rose-300/80 shadow-[0_25px_60px_-15px_rgba(244,63,94,0.35)] text-center space-y-5">
                {/* Botanical Corner Flower Ornaments */}
                <div className="absolute top-3 left-4 text-rose-400 opacity-60">🌸</div>
                <div className="absolute top-3 right-4 text-rose-400 opacity-60">🌹</div>

                <div>
                  <span className="text-[11px] font-bold tracking-widest uppercase text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                    Khung Kính Hoa Ép Nghệ Thuật 20/10
                  </span>
                  <h2
                    className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2"
                    style={{ fontFamily: config.fontFamily ? `${config.fontFamily}, 'Be Vietnam Pro', sans-serif` : "'Be Vietnam Pro', sans-serif" }}
                  >
                    Gửi {config.recipientName} 🌸
                  </h2>
                </div>

                {/* Main Floral Letter with Water Ripple Glint */}
                <div
                  className="text-slate-800 leading-relaxed text-base sm:text-lg bg-pink-50/60 p-5 sm:p-7 rounded-2xl border border-pink-100 text-left font-serif shadow-inner whitespace-pre-line relative"
                  style={{ fontFamily: config.fontFamily ? `${config.fontFamily}, 'Be Vietnam Pro', sans-serif` : "'Be Vietnam Pro', sans-serif" }}
                >
                  {config.mainText}
                </div>

                {/* Pressed Flower Photo Gallery Floating Frame */}
                {userImages.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span className="flex items-center gap-1.5 text-rose-600">
                        <Flower2 className="w-4 h-4 text-rose-500" />
                        <span>Kỷ Niệm Lồng Khung Thủy Tinh ({userImages.length} ảnh)</span>
                      </span>
                      {userImages.length > 1 && (
                        <span className="text-[11px] text-slate-400">Chạm để đổi ảnh</span>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      {userImages.map((img, i) => (
                        <motion.div
                          key={i}
                          whileHover={{ scale: 1.06 }}
                          onClick={() => {
                            soundFx.playPaperSwoosh();
                            setActivePhotoIdx(i);
                          }}
                          className={`relative p-2 rounded-2xl bg-white/90 border-2 shadow-lg cursor-pointer transition-all ${
                            activePhotoIdx === i
                              ? 'border-rose-500 ring-4 ring-rose-200/60 scale-105'
                              : 'border-rose-200/70 opacity-80'
                          }`}
                          style={{ width: '130px' }}
                        >
                          <div className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </div>
                          {/* Pressed flower petal icon overlay */}
                          <div className="absolute -bottom-1 -right-1 text-xs">🌸</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sender Signature */}
                <div className="text-right pt-1">
                  <p
                    className="text-lg font-bold text-rose-600 italic"
                    style={{ fontFamily: config.fontFamily ? `${config.fontFamily}, 'Be Vietnam Pro', sans-serif` : "'Be Vietnam Pro', sans-serif" }}
                  >
                    — {config.senderName} 🌹
                  </p>
                </div>

                {/* Guide tooltip */}
                <div className="pt-1 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-rose-400" />
                  <span>Vuốt màn hình để tạo cơn gió xoáy cuốn cánh hoa bay lượn</span>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
