import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Flame, Send, RotateCw, Heart, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CardConfig } from '../../types';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  config: CardConfig;
  mode?: 'studio' | 'recipient';
}

export default function LanternFestivalFX({ config }: Props) {
  const [rotY, setRotY] = useState(0);
  const [rotX, setRotX] = useState(-5); // Slight tilt down to see 3D monolithic top & body
  const [currentFace, setCurrentFace] = useState(0); // 0: Front, 1: Right, 2: Back, 3: Left
  const [isReleased, setIsReleased] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isAutoFloating, setIsAutoFloating] = useState(true);

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragStartRot = useRef({ y: 0, x: -5 });

  const userImages = config.images || [];

  const faces = [
    {
      id: 'face-0',
      title: 'Mặt 1 • Ảnh Kỷ Niệm',
      type: 'image',
      image: userImages[0] || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80',
      label: 'Khoảnh khắc thắp sáng',
      subtext: `Dành tặng ${config.recipientName || 'Người Thương'}`,
    },
    {
      id: 'face-1',
      title: 'Mặt 2 • Tâm Thư',
      type: 'text',
      content: config.mainText || 'Nguyện cầu vạn điều bình an, hạnh phúc và vạn sự như ý nở hoa rạng rỡ!',
      tag: 'TÂM THƯ 20/10 AN LÀNH',
    },
    {
      id: 'face-2',
      title: 'Mặt 3 • Kỷ Niệm',
      type: 'image',
      image: userImages[1] || userImages[0] || 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&auto=format&fit=crop&q=80',
      label: 'Kỷ niệm gửi người thương',
      subtext: 'Gửi trọn yêu thương trong từng ánh sao',
    },
    {
      id: 'face-3',
      title: 'Mặt 4 • Lời Chúc',
      type: 'signature',
      recipient: config.recipientName || 'Người thương mến',
      sender: config.senderName || 'Người gửi ẩn danh',
      blessing: 'Chúc ngày 20/10 vạn sự an lành, rạng ngời như ngàn hoa đăng!',
    },
  ];

  // Drag interaction handlers for full 3D rotation
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isReleased) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragStartRot.current = { y: rotY, x: rotX };
    setIsAutoFloating(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || isReleased) return;
    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;

    const newRotY = dragStartRot.current.y + deltaX * 0.65;
    // Constrain X tilt between -22 and 15 degrees for natural perspective
    const newRotX = Math.max(-22, Math.min(15, dragStartRot.current.x - deltaY * 0.25));

    setRotY(newRotY);
    setRotX(newRotX);

    // Calculate facing face
    const normalizedY = ((-newRotY % 360) + 360) % 360;
    const faceIndex = Math.round(normalizedY / 90) % 4;
    setCurrentFace(faceIndex);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  // Turn to exact face via navigation pills
  const handleSelectFace = (idx: number) => {
    soundFx.playPinClick();
    setHasInteracted(true);
    setCurrentFace(idx);
    setRotY(-idx * 90);
    setRotX(-5);
  };

  const handleNextFace = () => {
    soundFx.playPinClick();
    setHasInteracted(true);
    const next = (currentFace + 1) % 4;
    setCurrentFace(next);
    setRotY((prev) => prev - 90);
  };

  const handlePrevFace = () => {
    soundFx.playPinClick();
    setHasInteracted(true);
    const prev = (currentFace - 1 + 4) % 4;
    setCurrentFace(prev);
    setRotY((prev) => prev + 90);
  };

  const handleReleaseLantern = () => {
    soundFx.playPaperSwoosh();
    soundFx.playSuccessChime();
    setIsReleased(true);

    confetti({
      particleCount: 150,
      spread: 110,
      origin: { y: 0.7 },
      colors: ['#F97316', '#FBBF24', '#FB7185', '#F59E0B', '#FFF'],
    });

    setTimeout(() => {
      confetti({
        particleCount: 90,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#FDBA74', '#FEF08A', '#F43F5E'],
      });
    }, 500);
  };

  const handleResetLantern = () => {
    soundFx.playPinClick();
    setIsReleased(false);
    setRotY(0);
    setRotX(-5);
    setCurrentFace(0);
    setIsAutoFloating(true);
  };

  // Dimensions of the 3D Monolithic Lantern Prism:
  // 4 faces, each width = 240px, height = 370px
  // distance from center to faces = 240 / 2 = 120px
  const FACE_WIDTH = 240;
  const FACE_HEIGHT = 370;
  const RADIUS = 120;

  return (
    <div
      className="relative w-full h-full min-h-full bg-slate-950 overflow-y-auto sm:overflow-hidden select-none flex flex-col items-center justify-start sm:justify-center p-3 sm:p-5"
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ perspective: '1100px' }}
    >
      {/* Deep Midnight Sky with Riverside Horizon */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#091124] to-[#1c0a06] pointer-events-none" />

      {/* Riverside Moonlight & Golden River Horizon Glow */}
      <div className="absolute bottom-0 inset-x-0 h-56 bg-gradient-to-t from-amber-600/25 via-orange-950/30 to-transparent pointer-events-none blur-3xl" />

      {/* Starry Night Sky Background with Sparkling Stars */}
      {Array.from({ length: 32 }).map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute rounded-full pointer-events-none bg-amber-200"
          style={{
            left: `${2 + ((i * 19) % 96)}%`,
            top: `${3 + ((i * 29) % 82)}%`,
            width: `${2 + (i % 3) * 2}px`,
            height: `${2 + (i % 3) * 2}px`,
            boxShadow: '0 0 8px rgba(254,240,138,0.8)',
          }}
          animate={{
            opacity: [0.2, 0.9, 0.2],
            scale: [0.8, 1.3, 0.8],
          }}
          transition={{
            duration: 3 + (i % 4) * 1.5,
            repeat: Infinity,
            delay: (i % 5) * 0.4,
          }}
        />
      ))}

      {/* Floating Distant Starry Lanterns in Horizon (Tối ưu 8 đèn lồng nền thanh thoát) */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={`distant-lantern-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${6 + ((i * 24) % 88)}%`,
            top: `${10 + ((i * 29) % 75)}%`,
            width: `${6 + (i % 3) * 3}px`,
            height: `${9 + (i % 3) * 4}px`,
            background: 'radial-gradient(circle at 50% 40%, #fef08a 25%, #ea580c 85%, #9a3412 100%)',
          }}
          animate={{
            y: [-10, -50, -10],
            x: [0, i % 2 === 0 ? 10 : -10, 0],
            opacity: [0.35, 0.9, 0.35],
          }}
          transition={{
            duration: 5 + (i % 4) * 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: (i % 3) * 0.5,
          }}
        />
      ))}

      {/* Companion Fleet of Floating Lanterns (Tối ưu 7 đèn lồng đồng hành) */}
      <AnimatePresence>
        {isReleased &&
          Array.from({ length: 7 }).map((_, i) => {
            const startX = 10 + i * 12;
            const sizeW = 20 + (i % 4) * 6;
            const sizeH = sizeW * 1.38;
            const delay = 0.2 + i * 0.25;
            return (
              <motion.div
                key={`companion-${i}`}
                initial={{ y: 280, opacity: 0, scale: 0.5 }}
                animate={{
                  y: -950,
                  opacity: [0, 0.95, 1, 0.85, 0],
                  scale: [0.5, 0.85, 0.6, 0.3],
                  x: [0, i % 2 === 0 ? 25 : -25, 0],
                }}
                transition={{
                  duration: 6.5 + (i % 3) * 1.2,
                  delay,
                  ease: 'easeInOut',
                }}
                className="absolute pointer-events-none z-10 flex flex-col items-center"
                style={{ left: `${startX}%`, bottom: '4%' }}
              >
                <div
                  className="rounded-t-[32px] rounded-b-[20px] border border-amber-300/80 shadow-[0_0_20px_rgba(251,146,60,0.6)] relative overflow-hidden"
                  style={{
                    width: `${sizeW}px`,
                    height: `${sizeH}px`,
                    background:
                      'radial-gradient(ellipse at 50% 65%, #fffbeb 0%, #fef08a 30%, #f97316 75%, #9a3412 100%)',
                  }}
                >
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-yellow-200 blur-[1px] animate-pulse" />
                </div>
              </motion.div>
            );
          })}
      </AnimatePresence>

      {/* ─── 3D MONOLITHIC SKY LANTERN SCENE CONTAINER ─── */}
      <motion.div
        animate={
          isReleased
            ? {
                y: [0, -60, -200, -480, -880],
                x: [0, 25, -30, 20, 0],
                scale: [1, 0.95, 0.76, 0.48, 0.18],
                rotateZ: [0, -4, 4, -3, 1, 0],
                rotateY: [rotY, rotY + 720],
                rotateX: [rotX, rotX - 15],
                opacity: [1, 1, 0.96, 0.85, 0],
              }
            : {
                y: isAutoFloating ? [0, -12, 0] : 0,
                rotateZ: isAutoFloating ? [-0.8, 0.8, -0.8] : 0,
              }
        }
        transition={
          isReleased
            ? {
                duration: 6.8,
                ease: [0.25, 0.1, 0.25, 1],
              }
            : {
                y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
                rotateZ: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' },
              }
        }
        className="relative z-20 flex flex-col items-center gap-3 w-full max-w-sm py-2"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* The 3D Monolithic Lantern Prism Stage */}
        <div
          className="relative cursor-grab active:cursor-grabbing flex items-center justify-center my-4"
          style={{
            width: `${FACE_WIDTH}px`,
            height: `${FACE_HEIGHT}px`,
            transformStyle: 'preserve-3d',
            perspective: '1100px',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
        >
          {/* Internal Volumetric Glowing Light Core at Center (0, 0, 0) */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              transform: 'translateZ(0px)',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Pulsing Light Sphere */}
            <div className="w-48 h-48 rounded-full bg-gradient-to-r from-amber-300/60 via-yellow-200/50 to-orange-500/60 blur-3xl animate-pulse" />
          </div>

          {/* The Rotating 3D Monolithic Prism Assembly */}
          <motion.div
            className="relative w-full h-full"
            style={{
              transformStyle: 'preserve-3d',
            }}
            animate={
              !isReleased
                ? {
                    rotateY: rotY,
                    rotateX: rotX,
                  }
                : {}
            }
            transition={
              isDragging.current
                ? { duration: 0 }
                : { type: 'spring', stiffness: 220, damping: 25 }
            }
          >
            {/* ── TOP 3D BAMBOO LID (NẮP TRÊN NGUYÊN KHỐI) ── */}
            <div
              className="absolute left-0 top-0 w-full rounded-2xl bg-gradient-to-br from-amber-900 via-yellow-700 to-amber-950 border-2 border-yellow-300 shadow-xl flex items-center justify-center pointer-events-none"
              style={{
                height: `${FACE_WIDTH}px`,
                transform: `rotateX(90deg) translateZ(${RADIUS}px)`,
                transformOrigin: 'top center',
              }}
            >
              {/* Top Golden Brass Ring Ornament */}
              <div className="w-32 h-32 rounded-full border-4 border-yellow-300/80 bg-amber-950/70 flex items-center justify-center shadow-inner">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-300 flex items-center justify-center text-amber-200 text-xs font-serif">
                  ❖ 20/10 ❖
                </div>
              </div>
            </div>

            {/* ── BOTTOM 3D RING & FIRE BURNER (ĐÁY LỒNG ĐÈN & LỬA NGUYÊN KHỐI) ── */}
            <div
              className="absolute left-0 bottom-0 w-full rounded-2xl bg-gradient-to-br from-amber-950 via-yellow-800 to-amber-950 border-2 border-yellow-400 shadow-[0_0_50px_rgba(249,115,22,0.9)] flex items-center justify-center pointer-events-none"
              style={{
                height: `${FACE_WIDTH}px`,
                transform: `rotateX(-90deg) translateZ(${FACE_HEIGHT - RADIUS}px)`,
                transformOrigin: 'bottom center',
              }}
            >
              {/* Hollow Fire Orifice with Wire Crossbar (+) */}
              <div className="relative w-36 h-36 rounded-full border-4 border-yellow-400/90 bg-black/60 shadow-inner flex items-center justify-center">
                {/* Brass Wire Crossbar (+) holding the flame */}
                <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-0.5 bg-yellow-200/90 shadow-sm" />
                <div className="absolute inset-y-2 left-1/2 -translate-x-1/2 w-0.5 bg-yellow-200/90 shadow-sm" />

                {/* Wax Fuel Burner Block & Dancing Fire */}
                <div className="w-8 h-8 rounded-md bg-amber-950 border border-yellow-300 flex items-center justify-center shadow-lg relative z-10">
                  <Flame className="w-6 h-6 fill-amber-300 text-yellow-100 animate-pulse drop-shadow-[0_0_12px_rgba(251,191,36,1)]" />
                </div>
              </div>
            </div>

            {/* ── 4 VERTICAL SIDES OF THE 3D MONOLITHIC LANTERN ── */}
            {faces.map((f, idx) => {
              const faceAngle = idx * 90; // 0, 90, 180, 270 deg
              return (
                <div
                  key={f.id}
                  className="absolute inset-0 rounded-3xl p-4 flex flex-col justify-between overflow-hidden border-2 border-amber-300/90 shadow-[0_0_50px_rgba(249,115,22,0.65),inset_0_0_35px_rgba(254,240,138,0.5)] transition-colors"
                  style={{
                    transform: `rotateY(${faceAngle}deg) translateZ(${RADIUS}px)`,
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'visible',
                    background:
                      'radial-gradient(ellipse at 50% 65%, rgba(255, 252, 235, 0.98) 0%, rgba(254, 240, 138, 0.94) 28%, rgba(251, 146, 60, 0.92) 68%, rgba(180, 55, 10, 0.97) 100%)',
                  }}
                >
                  {/* Authentic Do Paper Grain Texture */}
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#b45309_1.2px,transparent_1.2px)] [background-size:12px_12px] pointer-events-none" />

                  {/* Corner Gilded Studs */}
                  <span className="absolute top-2 left-2.5 text-amber-900 text-xs select-none">❖</span>
                  <span className="absolute top-2 right-2.5 text-amber-900 text-xs select-none">❖</span>
                  <span className="absolute bottom-2 left-2.5 text-amber-900 text-xs select-none">❖</span>
                  <span className="absolute bottom-2 right-2.5 text-amber-900 text-xs select-none">❖</span>

                  {/* Header Title Banner */}
                  <div className="text-center pt-1 z-10">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-amber-950/25 text-amber-950 px-3 py-0.5 rounded-full border border-amber-900/40 shadow-xs">
                      ❖ {f.title} ❖
                    </span>
                  </div>

                  {/* ── FACE CONTENT TYPES ── */}
                  {f.type === 'image' && (
                    <div className="flex-1 my-2 flex flex-col items-center justify-center z-10">
                      <div className="w-38 sm:w-42 h-38 sm:h-42 rounded-2xl overflow-hidden border-2 border-amber-900/85 shadow-xl bg-amber-950/40 p-1 relative group">
                        <img
                          src={f.image}
                          alt=""
                          className="w-full h-full object-cover rounded-xl"
                        />
                        <div className="absolute inset-0 rounded-xl border border-yellow-300/40 pointer-events-none" />
                      </div>
                      <div className="text-center mt-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-950/30 border border-amber-900/40 text-[9.5px] font-black text-amber-950 font-serif">
                          {f.label}
                        </span>
                        <p className="text-[10px] font-bold text-amber-950 mt-0.5 font-serif">
                          {f.subtext}
                        </p>
                      </div>
                    </div>
                  )}

                  {f.type === 'text' && (
                    <div className="flex-1 my-2 flex flex-col justify-center text-center p-3.5 bg-gradient-to-b from-amber-400/25 via-amber-200/20 to-amber-400/25 rounded-2xl border-2 border-amber-900/40 shadow-inner relative z-10">
                      <p
                        className="text-xs sm:text-sm leading-relaxed font-serif text-amber-950 font-black whitespace-pre-line"
                        style={{
                          fontFamily: config.fontFamily
                            ? `${config.fontFamily}, 'Be Vietnam Pro', sans-serif`
                            : "'Be Vietnam Pro', sans-serif",
                        }}
                      >
                        "{f.content}"
                      </p>
                      <div className="mt-2.5 flex items-center justify-center gap-1 text-[9px] font-bold text-amber-900/70 font-serif">
                        <span>★</span>
                        <span>{f.tag}</span>
                        <span>★</span>
                      </div>
                    </div>
                  )}

                  {f.type === 'signature' && (
                    <div className="flex-1 my-2 flex flex-col justify-center items-center text-center space-y-1.5 p-2 bg-amber-400/15 rounded-2xl border border-amber-900/30 z-10">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-800 to-amber-950 border-2 border-yellow-400/70 flex items-center justify-center text-amber-100 shadow-md">
                        <Heart className="w-6 h-6 fill-rose-500 text-rose-300 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-amber-950 font-serif">
                          Gửi: {f.recipient}
                        </h4>
                        <p className="text-[10px] font-bold text-amber-900 mt-0.5 font-serif italic">
                          {f.blessing}
                        </p>
                      </div>
                      <p className="text-xs font-black italic text-amber-950 font-serif pt-0.5">
                        — {f.sender} 🏮
                      </p>
                    </div>
                  )}

                  {/* Bottom Silk Rim Watermark */}
                  <div className="text-center pt-1 border-t border-amber-900/30 text-[8.5px] font-bold text-amber-950/80 font-mono tracking-wider z-10">
                    HOI AN SKY LANTERN • 20/10
                  </div>
                </div>
              );
            })}

            {/* ── 3D HANGING SILK TASSELS (TUA RUA ĐÍNH DƯỚI ĐÁY NGUYÊN KHỐI) ── */}
            <div
              className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center gap-12 pointer-events-none"
              style={{
                top: `${FACE_HEIGHT + 6}px`,
                transform: 'translateZ(0px)',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Left Tassel */}
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-6 bg-amber-300" />
                <div className="w-3 h-7 rounded-b-full bg-gradient-to-b from-red-600 to-yellow-500 shadow-md" />
              </div>
              {/* Center Long Tassel with Golden Bell */}
              <div className="flex flex-col items-center -mt-1">
                <div className="w-1 h-7 bg-amber-300" />
                <div className="w-4 h-9 rounded-b-full bg-gradient-to-b from-red-600 to-yellow-400 shadow-lg" />
              </div>
              {/* Right Tassel */}
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-6 bg-amber-300" />
                <div className="w-3 h-7 rounded-b-full bg-gradient-to-b from-red-600 to-yellow-500 shadow-md" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* 4-Face Switcher Pills for Instant 3D Rotation */}
        <div className="flex items-center justify-center gap-1.5 mt-8 z-30 flex-wrap">
          {faces.map((f, idx) => (
            <button
              key={f.id}
              onClick={() => handleSelectFace(idx)}
              className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all border ${
                currentFace === idx
                  ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-md scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-amber-200 border-white/15'
              }`}
            >
              {idx === 0 && '🏮 Mặt 1 • Ảnh'}
              {idx === 1 && '📜 Mặt 2 • Tâm thư'}
              {idx === 2 && '✨ Mặt 3 • Kỷ niệm'}
              {idx === 3 && '🌸 Mặt 4 • Ký tên'}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 mt-2 z-30">
          <button
            onClick={handlePrevFace}
            className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold transition-all shadow-md active:scale-95"
            title="Xoay sang trái"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleNextFace}
            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Xoay lồng đèn 3D</span>
          </button>

          <button
            onClick={handleNextFace}
            className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold transition-all shadow-md active:scale-95"
            title="Xoay sang phải"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isReleased && (
            <button
              onClick={handleReleaseLantern}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-rose-600 hover:brightness-110 text-white text-xs font-black flex items-center gap-1.5 shadow-xl shadow-orange-500/40 active:scale-95 transition-all animate-pulse"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Thả Đèn Trời</span>
            </button>
          )}
        </div>

        {!hasInteracted && !isReleased && (
          <p className="text-[11px] text-amber-200/80 animate-pulse text-center font-medium">
            💡 Dùng tay hoặc chuột xoay lồng đèn 3D 360° để ngắm trọn vẹn 4 mặt nguyên khối
          </p>
        )}
      </motion.div>

      {/* Floating Celebration & Re-release Overlay after Lantern Ascends */}
      <AnimatePresence>
        {isReleased && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: 1.8, duration: 0.7 }}
            className="absolute z-40 inset-x-4 max-w-md mx-auto top-1/3 p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#241009]/95 via-[#1a0804]/95 to-black/95 border-2 border-amber-400/90 shadow-[0_25px_80px_rgba(249,115,22,0.55)] backdrop-blur-xl text-center space-y-3.5"
          >
            <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-600/40 border border-amber-200">
              <Sparkles className="w-7 h-7 animate-spin" />
            </div>

            <div>
              <span className="text-[10px] font-black tracking-widest uppercase text-amber-300 bg-amber-950/70 px-3 py-0.5 rounded-full border border-amber-400/60">
                ✦ NGUYỆN ƯỚC THÀNH HIỆN THỰC ✦
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-amber-100 font-serif mt-2">
                Đèn Trời Đã Thắp Sáng Ngân Hà ✨
              </h3>
              <p className="text-xs sm:text-sm text-amber-200/90 font-serif italic mt-1 leading-relaxed">
                "Nguyện cầu {config.recipientName || 'người nhận'} vạn điều an lành, nụ cười rạng rỡ và hạnh phúc viên mãn trong ngày 20/10!"
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleResetLantern}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 text-xs font-bold border border-amber-400/40 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Thu lại đèn để ngắm tiếp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.playHeartPop();
                  confetti({
                    particleCount: 80,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#F97316', '#FBBF24', '#FB7185', '#FFF'],
                  });
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bắn pháo hoa</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
