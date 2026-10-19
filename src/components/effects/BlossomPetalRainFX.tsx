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

  // Initialize petals (Tối ưu số lượng cánh hoa cho 60 FPS mượt mà)
  const initPetals = useCallback((width: number, height: number) => {
    const petals: Petal[] = [];
    const count = typeof window !== 'undefined' && window.innerWidth < 768 ? 22 : 38;
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
    let lastFrameTime = performance.now();
    const fpsInterval = 1000 / 60; // Cố định 60 FPS max, chống quá tải trên màn hình 120Hz/144Hz

    const animate = (currentTime: number) => {
      animationRef.current = requestAnimationFrame(animate);

      const elapsed = currentTime - lastFrameTime;
      if (elapsed < fpsInterval) return;
      lastFrameTime = currentTime - (elapsed % fpsInterval);

      time++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      windVector.current.x *= 0.95;
      windVector.current.y *= 0.95;
      vortexAngleRef.current += 0.02;

      // Draw accumulated floor petals (Tối ưu tối đa 24 cánh hoa sàn)
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
          if (floorPetalsRef.current.length < 24) {
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
            oldest.opacity -= 0.03;
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
    };

    animationRef.current = requestAnimationFrame(animate);

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
    <div className="relative w-full h-full min-h-[100%] overflow-hidden select-none">
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
      <div className="relative z-20 flex items-center justify-center w-full h-full min-h-[100%] p-2.5 sm:p-6 pointer-events-none overflow-y-auto">
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
               BOTANICAL PRESSED-FLOWER DOUBLE GLASS HERBARIUM FRAME
               ======================================================== */
            <motion.div
              key="popup-card"
              initial={{ y: 50, opacity: 0, scale: 0.85, rotateX: 20 }}
              animate={{ y: 0, opacity: 1, scale: 1, rotateX: 0 }}
              transition={{ duration: 0.8, type: 'spring', bounce: 0.3 }}
              className="pointer-events-auto w-full max-w-2xl mx-auto py-2"
            >
              <div className="relative bg-[#FFFDF9]/95 backdrop-blur-2xl p-5 sm:p-9 rounded-3xl border-2 sm:border-4 border-amber-300/90 shadow-[0_30px_90px_rgba(244,63,94,0.4)] ring-2 ring-amber-400/40 text-center space-y-4 sm:space-y-5 overflow-hidden">
                {/* Baroque Brass Filigree Corner Ornaments */}
                <span className="absolute top-2.5 left-3 text-amber-500 text-lg pointer-events-none select-none z-20">⚜</span>
                <span className="absolute top-2.5 right-3 text-amber-500 text-lg pointer-events-none select-none z-20">⚜</span>
                <span className="absolute bottom-2.5 left-3 text-amber-500 text-lg pointer-events-none select-none z-20">⚜</span>
                <span className="absolute bottom-2.5 right-3 text-amber-500 text-lg pointer-events-none select-none z-20">⚜</span>

                {/* Pressed Dried Sakura Petals Inside Glass */}
                <span className="absolute top-12 left-5 text-xl opacity-60 pointer-events-none select-none rotate-12">🌸</span>
                <span className="absolute top-28 right-6 text-sm opacity-50 pointer-events-none select-none -rotate-45">🌺</span>
                <span className="absolute bottom-16 left-6 text-base opacity-50 pointer-events-none select-none rotate-45">🌿</span>
                <span className="absolute bottom-24 right-5 text-lg opacity-60 pointer-events-none select-none -rotate-12">🌸</span>

                {/* Glass Light Reflection Sheen */}
                <div className="absolute inset-0 bg-gradient-to-tr from-rose-100/30 via-white/40 to-amber-100/30 pointer-events-none" />
                <div className="absolute -top-24 -left-24 w-60 h-60 bg-gradient-to-br from-white/70 to-transparent rotate-45 pointer-events-none blur-sm" />

                {/* Header Tag with Botanical Laurel */}
                <div className="relative z-10">
                  <span className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase text-amber-950 bg-gradient-to-r from-amber-100 via-rose-100 to-amber-100 px-4 py-1 rounded-full border border-amber-300/90 shadow-2xs">
                    ✦ KHUNG HOA ÉP THỦY TINH HOÀNG GIA ✦
                  </span>
                  <h2
                    className="text-2xl sm:text-4xl font-black text-rose-950 mt-2 font-serif tracking-tight"
                    style={{ fontFamily: config.fontFamily ? `${config.fontFamily}, 'Playfair Display', serif` : "'Playfair Display', serif" }}
                  >
                    Gửi: {config.recipientName || 'Người phụ nữ tuyệt vời'} 🌸
                  </h2>
                  <div className="w-20 h-0.5 mx-auto bg-gradient-to-r from-transparent via-rose-400 to-transparent mt-1.5 opacity-80" />
                </div>

                {/* Main Floral Letter with Soft Rose Watermark */}
                <div
                  className="relative z-10 text-slate-800 leading-relaxed text-base sm:text-lg bg-gradient-to-br from-rose-50/80 via-white/80 to-amber-50/70 p-5 sm:p-7 rounded-2xl border border-rose-200/90 text-left font-serif shadow-[inset_0_2px_8px_rgba(244,63,94,0.06)] whitespace-pre-line overflow-hidden"
                  style={{ fontFamily: config.fontFamily ? `${config.fontFamily}, 'Playfair Display', serif` : "'Playfair Display', serif" }}
                >
                  <div className="absolute -bottom-4 -right-2 text-rose-300/25 text-5xl select-none pointer-events-none font-serif">
                    🌸
                  </div>
                  {config.mainText || 'Chúc em ngày 20/10 thật rạng rỡ như mùa xuân, đẹp tựa cánh hoa và ấm áp như nắng mai!'}
                </div>

                {/* Pressed Flower Photo Gallery Floating Frame */}
                {(() => {
                  const photosToDisplay = userImages.length > 0 ? userImages : [
                    'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&auto=format&fit=crop&q=80',
                  ];
                  return (
                    <div className="relative z-10 pt-2 space-y-2 border-t border-rose-200/70">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
                        <span className="flex items-center gap-1.5 text-rose-700">
                          <Flower2 className="w-4 h-4 text-rose-500" />
                          <span>
                            {userImages.length > 0
                              ? `Kỷ Niệm Ép Khung Kính (${userImages.length} ảnh)`
                              : 'Khung Ảnh Kỷ Niệm Ép Hoa Khô (Gợi ý)'}
                          </span>
                        </span>
                        <span className="text-[11px] text-slate-400 italic">Chạm để đổi khung</span>
                      </div>

                      <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap pt-1">
                        {photosToDisplay.map((img, i) => (
                          <motion.div
                            key={i}
                            whileHover={{ scale: 1.08, rotate: i % 2 === 0 ? 2 : -2 }}
                            onClick={() => {
                              soundFx.playPaperSwoosh();
                              setActivePhotoIdx(i);
                            }}
                            className={`relative p-2 rounded-2xl bg-white/95 border-2 shadow-xl cursor-pointer transition-all ${
                              activePhotoIdx === i
                                ? 'border-rose-500 ring-4 ring-rose-200/80 scale-105 z-20'
                                : 'border-rose-200/80 hover:border-rose-400 z-10 opacity-90'
                            }`}
                            style={{ width: '135px' }}
                          >
                            <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-rose-100/80">
                              <img src={img} alt="" className="w-full h-full object-cover" />
                            </div>
                            {/* Pressed flower petal icon overlay */}
                            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-xs shadow-xs">
                              🌸
                            </div>
                            <p className="text-[10px] font-bold text-center text-slate-600 mt-1 italic">
                              {userImages.length > 0 ? `Kỷ niệm #${i + 1}` : `Khung ảnh #${i + 1}`}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Sender Signature & Interactive Blossom Action */}
                <div className="relative z-10 pt-2 flex items-center justify-between border-t border-rose-200/70">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playPaperSwoosh();
                      // Trigger a vortex burst
                      vortexAngleRef.current += Math.PI * 2;
                      windVector.current = { x: 4.5, y: -2.5 };
                      setTimeout(() => {
                        windVector.current = { x: 0, y: 0 };
                      }, 1200);
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-rose-50 to-pink-100 hover:from-rose-100 hover:to-pink-200 text-rose-700 text-xs font-bold border border-rose-300/80 flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                    <span>Lốc xoáy cánh hoa</span>
                  </button>

                  <p
                    className="text-lg sm:text-xl font-bold text-rose-600 italic font-serif"
                    style={{ fontFamily: config.fontFamily ? `${config.fontFamily}, 'Playfair Display', serif` : "'Playfair Display', serif" }}
                  >
                    — {config.senderName || 'Người ngưỡng mộ em'} 🌹
                  </p>
                </div>

                {/* Guide tooltip */}
                <div className="relative z-10 pt-1 text-center text-[10px] sm:text-[11px] text-slate-400 flex items-center justify-center gap-1">
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
