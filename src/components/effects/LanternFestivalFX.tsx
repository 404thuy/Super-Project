import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Flame,
  Send,
  RotateCw,
  Heart,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Eye,
  BookOpen,
  Compass,
  Play,
  Pause,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CardConfig } from '../../types';
import { soundFx } from '../../utils/soundEffects';

interface Props {
  config: CardConfig;
  mode?: 'studio' | 'recipient';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  maxLife: number;
  life: number;
}

// 4 Điểm nhìn 3D nghệ thuật
type CameraViewMode = 'cinematic' | 'reading' | 'skyward' | 'orbit';

export default function LanternFestivalFX({ config }: Props) {
  // Điểm nhìn Camera hiện tại
  const [viewMode, setViewMode] = useState<CameraViewMode>('cinematic');

  // Góc quay 3D
  const [rotY, setRotY] = useState(-20);
  const [rotX, setRotX] = useState(-8);
  const [scale, setScale] = useState(1);
  const [currentFace, setCurrentFace] = useState(0); // 0: Mặt 1, 1: Mặt 2, 2: Mặt 3, 3: Mặt 4
  const [isReleased, setIsReleased] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isAutoOrbiting, setIsAutoOrbiting] = useState(false);

  // Kéo xoay tương tác vật lý
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragStartRot = useRef({ y: -20, x: -8 });
  const lastPointer = useRef({ x: 0, time: 0 });
  const velocityY = useRef(0);
  const animFrameId = useRef<number | null>(null);

  // Canvas hạt tàn lửa
  const emberCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const userImages = config.images || [];

  const faces = [
    {
      id: 'face-0',
      title: 'Mặt 1 • Ảnh Kỷ Niệm',
      shortTitle: 'Ảnh kỷ niệm',
      icon: '🏮',
      type: 'image',
      image: userImages[0] || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80',
      label: 'Khoảnh khắc thắp sáng',
      subtext: `Dành tặng ${config.recipientName || 'Người Thương'}`,
    },
    {
      id: 'face-1',
      title: 'Mặt 2 • Tâm Thư 20/10',
      shortTitle: 'Bức tâm thư',
      icon: '📜',
      type: 'text',
      content: config.mainText || 'Nguyện cầu vạn điều bình an, hạnh phúc và vạn sự như ý nở hoa rạng rỡ!',
      tag: 'TÂM THƯ YÊU THƯƠNG',
    },
    {
      id: 'face-2',
      title: 'Mặt 3 • Kỷ Niệm Đẹp',
      shortTitle: 'Khoảnh khắc',
      icon: '✨',
      type: 'image',
      image: userImages[1] || userImages[0] || 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&auto=format&fit=crop&q=80',
      label: 'Kỷ niệm gửi người thương',
      subtext: 'Gửi trọn yêu thương trong từng ánh sao',
    },
    {
      id: 'face-3',
      title: 'Mặt 4 • Lời Chúc Phúc',
      shortTitle: 'Lời chúc phúc',
      icon: '🌸',
      type: 'signature',
      recipient: config.recipientName || 'Người thương mến',
      sender: config.senderName || 'Người gửi ẩn danh',
      blessing: 'Chúc ngày 20/10 vạn sự an lành, rạng ngời như ngàn hoa đăng!',
    },
  ];

  // ─── TỰ ĐỘNG XOAY 360° KHI BẬT CHẾ ĐỘ ORBIT ───
  useEffect(() => {
    if (!isAutoOrbiting || isReleased) return;
    let frameId: number;
    const step = () => {
      setRotY((prev) => {
        const next = prev - 0.35;
        const normalizedY = ((-next % 360) + 360) % 360;
        setCurrentFace(Math.round(normalizedY / 90) % 4);
        return next;
      });
      frameId = requestAnimationFrame(step);
    };
    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [isAutoOrbiting, isReleased]);

  // ─── HỆ THỐNG HẠT TÀN LỬA BAY LƠ LỬNG ───
  useEffect(() => {
    const canvas = emberCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 360);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 560);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: Particle[] = [];
    const colors = ['#FEF08A', '#FDE047', '#FBBF24', '#F97316', '#EF4444'];

    const createParticle = (): Particle => {
      const centerX = width / 2;
      const centerY = height * 0.62;
      return {
        x: centerX + (Math.random() - 0.5) * 140,
        y: centerY + (Math.random() - 0.5) * 50,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -(1.1 + Math.random() * 2.0),
        size: 1.2 + Math.random() * 2.2,
        alpha: 0.65 + Math.random() * 0.35,
        color: colors[Math.floor(Math.random() * colors.length)],
        maxLife: 75 + Math.random() * 55,
        life: 0,
      };
    };

    for (let i = 0; i < 24; i++) {
      const p = createParticle();
      p.life = Math.random() * p.maxLife;
      particles.push(p);
    }

    let isRunning = true;
    const render = () => {
      if (!isRunning) return;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, idx) => {
        p.life++;
        p.x += p.vx + Math.sin(p.life * 0.05) * 0.35;
        p.y += p.vy;
        const progress = p.life / p.maxLife;
        const currentAlpha = p.alpha * Math.sin(progress * Math.PI);

        if (currentAlpha > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = currentAlpha;
          ctx.shadowBlur = 6;
          ctx.shadowColor = p.color;
          ctx.fill();
        }

        if (p.life >= p.maxLife || p.y < -20) {
          particles[idx] = createParticle();
        }
      });

      requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // ─── CHUYỂN ĐỔI CÁC ĐIỂM NHÌN CAMERA NGHỆ THUẬT ───
  const applyViewMode = (mode: CameraViewMode, targetFace?: number) => {
    soundFx.playPinClick();
    setViewMode(mode);
    setHasInteracted(true);
    setIsAutoOrbiting(mode === 'orbit');

    const faceIdx = targetFace !== undefined ? targetFace : currentFace;
    setCurrentFace(faceIdx);

    switch (mode) {
      case 'cinematic': // Góc toàn cảnh 3D lãng mạn
        setRotY(-faceIdx * 90 - 18);
        setRotX(-8);
        setScale(1);
        break;
      case 'reading': // Góc cận cảnh thẳng thắn, phóng to để đọc chữ và ngắm ảnh rõ nét
        setRotY(-faceIdx * 90);
        setRotX(0);
        setScale(1.15);
        break;
      case 'skyward': // Góc ngước lên bầu trời ngắm đáy lồng đèn rực lửa
        setRotY(-faceIdx * 90 - 12);
        setRotX(18);
        setScale(0.96);
        break;
      case 'orbit': // Bắt đầu tự xoay 360 độ
        setRotX(-8);
        setScale(1);
        break;
    }
  };

  // Chọn nhanh mặt cụ thể
  const handleSelectFace = (idx: number) => {
    soundFx.playPinClick();
    setHasInteracted(true);
    setCurrentFace(idx);
    if (viewMode === 'reading') {
      setRotY(-idx * 90);
      setRotX(0);
    } else {
      setRotY(-idx * 90 - 16);
      setRotX(-8);
    }
  };

  const handleNextFace = () => {
    soundFx.playPinClick();
    setHasInteracted(true);
    const next = (currentFace + 1) % 4;
    handleSelectFace(next);
  };

  const handlePrevFace = () => {
    soundFx.playPinClick();
    setHasInteracted(true);
    const prev = (currentFace - 1 + 4) % 4;
    handleSelectFace(prev);
  };

  // ─── KÉO XOAY BẰNG TAY/CHUỘT ───
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isReleased) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragStartRot.current = { y: rotY, x: rotX };
    lastPointer.current = { x: e.clientX, time: performance.now() };
    velocityY.current = 0;
    setIsAutoOrbiting(false);
    setHasInteracted(true);

    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || isReleased) return;
    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;

    const now = performance.now();
    const dt = Math.max(1, now - lastPointer.current.time);
    const dx = e.clientX - lastPointer.current.x;
    velocityY.current = (dx / dt) * 16;
    lastPointer.current = { x: e.clientX, time: now };

    const newRotY = dragStartRot.current.y + deltaX * 0.65;
    const newRotX = Math.max(-25, Math.min(22, dragStartRot.current.x - deltaY * 0.22));

    setRotY(newRotY);
    setRotX(newRotX);

    const normalizedY = ((-newRotY % 360) + 360) % 360;
    const faceIndex = Math.round(normalizedY / 90) % 4;
    setCurrentFace(faceIndex);
  };

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    let v = velocityY.current * 0.55;
    const applyInertia = () => {
      if (Math.abs(v) > 0.15 && !isDragging.current) {
        setRotY((prev) => {
          const next = prev + v;
          const normalizedY = ((-next % 360) + 360) % 360;
          setCurrentFace(Math.round(normalizedY / 90) % 4);
          return next;
        });
        v *= 0.92;
        animFrameId.current = requestAnimationFrame(applyInertia);
      }
    };
    animFrameId.current = requestAnimationFrame(applyInertia);
  }, []);

  const handleReleaseLantern = () => {
    soundFx.playPaperSwoosh();
    soundFx.playSuccessChime();
    setIsReleased(true);
    setIsAutoOrbiting(false);

    confetti({
      particleCount: 160,
      spread: 120,
      origin: { y: 0.7 },
      colors: ['#F97316', '#FBBF24', '#FB7185', '#F59E0B', '#FFF'],
    });

    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 95,
        origin: { y: 0.45 },
        colors: ['#FDBA74', '#FEF08A', '#F43F5E', '#FED7AA'],
      });
    }, 600);
  };

  const handleResetLantern = () => {
    soundFx.playPinClick();
    setIsReleased(false);
    applyViewMode('cinematic', 0);
  };

  // Kích thước lồng đèn được tối ưu co giãn vừa vặn cho cả Mobile và Máy tính
  // Mobile: 210px x 320px | Desktop: 240px x 365px
  const FACE_WIDTH = 225;
  const FACE_HEIGHT = 345;
  const RADIUS = 112.5; // FACE_WIDTH / 2

  return (
    <div
      className="relative w-full h-full min-h-full bg-slate-950 overflow-hidden select-none flex flex-col items-center justify-between p-2 sm:p-4"
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ perspective: '1200px' }}
    >
      {/* ─── BẦU TRỜI ĐÊM HOÀNG KIM HỘI AN ─── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#091124] to-[#1a0804] pointer-events-none" />

      {/* Ánh trăng rằm huyền ảo rọi từ góc trên */}
      <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-radial from-amber-200/20 via-yellow-500/5 to-transparent pointer-events-none blur-3xl" />

      {/* ─── DÒNG SÔNG HOÀI PHẢN CHIẾU ÁNH ĐÈN HOA ĐĂNG ─── */}
      <div className="absolute bottom-0 inset-x-0 h-36 sm:h-48 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-orange-600/30 via-amber-950/20 to-transparent blur-2xl" />
        <motion.div
          animate={{
            scaleX: [1, 1.15, 0.95, 1],
            opacity: [0.65, 0.85, 0.6, 0.65],
          }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 w-64 h-14 rounded-full bg-radial from-amber-400/45 via-orange-600/25 to-transparent blur-xl"
        />
        {[0, 1].map((idx) => (
          <motion.div
            key={`wave-${idx}`}
            className="absolute inset-x-0 border-b border-amber-300/15"
            style={{ bottom: `${14 + idx * 18}px` }}
            animate={{
              x: idx % 2 === 0 ? [-20, 20, -20] : [20, -20, 20],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 4.2 + idx * 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* ─── CÁC VÌ SAO LẤP LÁNH ─── */}
      {Array.from({ length: 28 }).map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute rounded-full pointer-events-none bg-amber-200"
          style={{
            left: `${2 + ((i * 19) % 96)}%`,
            top: `${2 + ((i * 29) % 70)}%`,
            width: `${1.5 + (i % 3) * 1.6}px`,
            height: `${1.5 + (i % 3) * 1.6}px`,
            boxShadow: '0 0 8px rgba(254,240,138,0.85)',
          }}
          animate={{
            opacity: [0.2, 0.9, 0.2],
            scale: [0.8, 1.3, 0.8],
          }}
          transition={{
            duration: 3 + (i % 4) * 1.5,
            repeat: Infinity,
            delay: (i % 5) * 0.35,
          }}
        />
      ))}

      {/* ─── ĐÈN HOA ĐĂNG XA XA GÓC CHÂN TRỜI ─── */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={`distant-lantern-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${6 + ((i * 24) % 88)}%`,
            top: `${7 + ((i * 28) % 60)}%`,
            width: `${7 + (i % 3) * 3}px`,
            height: `${10 + (i % 3) * 4}px`,
            background: 'radial-gradient(circle at 50% 35%, #fffbeb 15%, #fde047 40%, #ea580c 80%, #9a3412 100%)',
            boxShadow: '0 0 12px rgba(249,115,22,0.7)',
          }}
          animate={{
            y: [-8, -40, -8],
            x: [0, i % 2 === 0 ? 10 : -10, 0],
            opacity: [0.4, 0.95, 0.4],
          }}
          transition={{
            duration: 5.5 + (i % 4) * 1.4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: (i % 3) * 0.6,
          }}
        />
      ))}

      {/* ─── HÀNG ĐÈN TRỜI BAY ĐỒNG HÀNH KHI BẤM THẢ ĐÈN ─── */}
      <AnimatePresence>
        {isReleased &&
          Array.from({ length: 8 }).map((_, i) => {
            const startX = 8 + i * 11.5;
            const sizeW = 20 + (i % 4) * 6;
            const sizeH = sizeW * 1.45;
            const delay = 0.15 + i * 0.22;
            return (
              <motion.div
                key={`companion-${i}`}
                initial={{ y: 280, opacity: 0, scale: 0.4 }}
                animate={{
                  y: -1050,
                  opacity: [0, 0.95, 1, 0.85, 0],
                  scale: [0.4, 0.85, 0.65, 0.25],
                  x: [0, i % 2 === 0 ? 30 : -30, 0],
                }}
                transition={{
                  duration: 6.8 + (i % 3) * 1.2,
                  delay,
                  ease: 'easeInOut',
                }}
                className="absolute pointer-events-none z-10 flex flex-col items-center"
                style={{ left: `${startX}%`, bottom: '5%' }}
              >
                <div
                  className="rounded-t-[36px] rounded-b-[22px] border border-amber-300/80 shadow-[0_0_24px_rgba(251,146,60,0.75)] relative overflow-hidden"
                  style={{
                    width: `${sizeW}px`,
                    height: `${sizeH}px`,
                    background:
                      'radial-gradient(ellipse at 50% 65%, #fffbeb 0%, #fef08a 25%, #f97316 70%, #9a3412 100%)',
                  }}
                >
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-yellow-200 blur-[1.5px] animate-pulse" />
                </div>
              </motion.div>
            );
          })}
      </AnimatePresence>

      {/* Canvas hạt tàn lửa bay bốc lên */}
      <canvas
        ref={emberCanvasRef}
        className="absolute inset-0 pointer-events-none z-15 w-full h-full"
      />

      {/* ─── THANH CHUYỂN ĐỔI 4 ĐIỂM NHÌN CAMERA TRỰC QUAN ─── */}
      <header className="relative z-30 w-full max-w-md flex items-center justify-between gap-1 pt-1 sm:pt-2 px-1">
        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-xl p-1 rounded-2xl border border-amber-400/30 shadow-lg">
          <button
            onClick={() => applyViewMode('cinematic')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10.5px] sm:text-xs font-bold transition-all ${
              viewMode === 'cinematic'
                ? 'bg-amber-400 text-stone-950 shadow-md font-black'
                : 'text-amber-200/80 hover:text-white hover:bg-white/10'
            }`}
            title="Góc nhìn 3D toàn cảnh lãng mạn"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Toàn cảnh</span>
          </button>

          <button
            onClick={() => applyViewMode('reading')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10.5px] sm:text-xs font-bold transition-all ${
              viewMode === 'reading'
                ? 'bg-amber-400 text-stone-950 shadow-md font-black'
                : 'text-amber-200/80 hover:text-white hover:bg-white/10'
            }`}
            title="Góc nhìn thẳng trực diện, phóng to để đọc rõ ràng"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Đọc rõ</span>
          </button>

          <button
            onClick={() => applyViewMode('skyward')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10.5px] sm:text-xs font-bold transition-all ${
              viewMode === 'skyward'
                ? 'bg-amber-400 text-stone-950 shadow-md font-black'
                : 'text-amber-200/80 hover:text-white hover:bg-white/10'
            }`}
            title="Góc ngước nhìn ngọn lửa và bầu trời đêm"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ngước nhìn</span>
          </button>

          <button
            onClick={() => applyViewMode(isAutoOrbiting ? 'cinematic' : 'orbit')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10.5px] sm:text-xs font-bold transition-all ${
              isAutoOrbiting
                ? 'bg-rose-500 text-white shadow-md animate-pulse font-black'
                : 'text-amber-200/80 hover:text-white hover:bg-white/10'
            }`}
            title="Tự động xoay 360 độ ngắm 4 mặt"
          >
            {isAutoOrbiting ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoOrbiting ? 'Dừng' : 'Xoay 360°'}</span>
          </button>
        </div>

        {/* Nút Thả Đèn Nổi Bật Ở Góc Phải */}
        {!isReleased && (
          <button
            onClick={handleReleaseLantern}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-rose-600 text-white text-[11px] sm:text-xs font-black shadow-lg shadow-orange-500/30 active:scale-95 transition-all animate-pulse"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Thả Đèn</span>
          </button>
        )}
      </header>

      {/* ─── CONTAINER CHỨA LỒNG ĐÈN 3D (TỰ ĐỘNG CÂN BẰNG KHÔNG BỊ TRÀN VIEWPORT) ─── */}
      <div className="relative z-20 flex-1 w-full flex items-center justify-center my-auto overflow-visible py-1">
        <motion.div
          animate={
            isReleased
              ? {
                  y: [0, -70, -220, -520, -950],
                  x: [0, 30, -35, 25, 0],
                  scale: [scale, scale * 0.94, scale * 0.72, scale * 0.45, scale * 0.15],
                  rotateZ: [0, -5, 5, -3, 1, 0],
                  rotateY: [rotY, rotY + 720],
                  rotateX: [rotX, rotX - 16],
                  opacity: [1, 1, 0.95, 0.8, 0],
                }
              : {
                  y: [0, -8, 0],
                  rotateZ: [-0.8, 0.8, -0.8],
                  scale,
                }
          }
          transition={
            isReleased
              ? {
                  duration: 7.2,
                  ease: [0.25, 0.1, 0.25, 1],
                }
              : {
                  y: { duration: 3.6, repeat: Infinity, ease: 'easeInOut' },
                  rotateZ: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
                  scale: { duration: 0.4, ease: 'easeOut' },
                }
          }
          className="relative flex items-center justify-center cursor-grab active:cursor-grabbing"
          style={{
            width: `${FACE_WIDTH}px`,
            height: `${FACE_HEIGHT}px`,
            transformStyle: 'preserve-3d',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
        >
          {/* LÕI ÁNH SÁNG NỘI TẠI TỎA HÀO QUANG VÀNG KIM TẠI TÂM */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              transform: 'translateZ(0px)',
              transformStyle: 'preserve-3d',
            }}
          >
            <motion.div
              animate={{
                scale: [0.95, 1.06, 0.98, 1.03, 0.95],
                opacity: [0.75, 0.92, 0.78, 0.88, 0.75],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-48 h-48 rounded-full bg-radial from-amber-200/80 via-yellow-400/45 to-orange-600/30 blur-3xl pointer-events-none"
            />
          </div>

          {/* KHỐI QUAY 3D NGUYÊN KHỐI ĐÈN TRỜI HỘI AN */}
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
                : { type: 'spring', stiffness: 220, damping: 24 }
            }
          >
            {/* ── 1. NẮP TRÊN 3D BÁT GIÁC CỔ ĐIỂN (OCTAGONAL DOMED CANOPY) ── */}
            <div
              className="absolute left-0 top-0 w-full rounded-[26px] bg-gradient-to-br from-[#78350f] via-[#b45309] to-[#451a03] border border-amber-300/80 shadow-[0_8px_20px_rgba(0,0,0,0.5)] flex items-center justify-center pointer-events-none"
              style={{
                height: `${FACE_WIDTH}px`,
                transform: `rotateX(90deg) translateZ(${RADIUS}px)`,
                transformOrigin: 'top center',
              }}
            >
              <div className="w-32 h-32 rounded-full border-2 border-yellow-300/70 bg-gradient-to-br from-amber-950 via-yellow-900 to-amber-950 flex items-center justify-center shadow-inner relative">
                <div className="w-18 h-18 rounded-full border border-dashed border-amber-300/80 flex items-center justify-center text-amber-200 text-[11px] font-serif font-bold shadow-md">
                  ❖ 20/10 ❖
                </div>
                <div className="absolute -top-2.5 w-5 h-5 rounded-full border-2 border-yellow-300/90 shadow-sm" />
              </div>
            </div>

            {/* ── 2. VÒNG ĐÁY & NGỌN NẾN LỬA 3D (BOTTOM FIRE HOOP) ── */}
            <div
              className="absolute left-0 bottom-0 w-full rounded-[26px] bg-gradient-to-br from-[#451a03] via-[#78350f] to-[#451a03] border border-amber-400 shadow-[0_0_50px_rgba(249,115,22,0.9)] flex items-center justify-center pointer-events-none"
              style={{
                height: `${FACE_WIDTH}px`,
                transform: `rotateX(-90deg) translateZ(${FACE_HEIGHT - RADIUS}px)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div className="relative w-36 h-36 rounded-full border-3 border-yellow-400 bg-black/75 shadow-inner flex items-center justify-center">
                <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-0.5 bg-yellow-200/90 shadow-sm" />
                <div className="absolute inset-y-2 left-1/2 -translate-x-1/2 w-0.5 bg-yellow-200/90 shadow-sm" />
                <div className="w-9 h-9 rounded-md bg-amber-950 border border-yellow-300 flex items-center justify-center shadow-2xl relative z-10">
                  <motion.div
                    animate={{
                      scale: [1, 1.25, 0.95, 1.15, 1],
                      rotate: [-3, 3, -2, 2, -3],
                    }}
                    transition={{
                      duration: 0.45,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <Flame className="w-7 h-7 fill-amber-300 text-yellow-100 drop-shadow-[0_0_14px_rgba(251,191,36,1)]" />
                  </motion.div>
                </div>
              </div>
            </div>

            {/* ── 3. BỐN MẶT LỤA TƠ TẰM HỘI AN HOÀNG KIM (4 SILK FACES) ── */}
            {faces.map((f, idx) => {
              const faceAngle = idx * 90;
              const relativeAngle = ((rotY + faceAngle) % 360 + 360) % 360;
              const isFrontFacing = relativeAngle < 90 || relativeAngle > 270;
              const shadowAlpha = isFrontFacing
                ? Math.abs(relativeAngle > 180 ? relativeAngle - 360 : relativeAngle) / 90 * 0.3
                : 0.52;

              return (
                <div
                  key={f.id}
                  className="absolute inset-0 p-3.5 sm:p-4 flex flex-col justify-between overflow-hidden rounded-[26px] sm:rounded-[32px] transition-all duration-150 border border-amber-300/60"
                  style={{
                    transform: `rotateY(${faceAngle}deg) translateZ(${RADIUS}px)`,
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'visible',
                    // Nền lụa tơ tằm vàng mật ong & hổ phách ngọc bích cực kỳ mềm mại, không bị chói gắt
                    background:
                      'radial-gradient(ellipse at 50% 55%, rgba(255, 253, 245, 0.99) 0%, rgba(254, 243, 199, 0.96) 32%, rgba(251, 191, 36, 0.92) 72%, rgba(217, 119, 6, 0.95) 100%)',
                    boxShadow:
                      '0 0 45px rgba(249,115,22,0.55), inset 0 0 35px rgba(254,240,138,0.5)',
                  }}
                >
                  {/* Lớp phủ bóng mờ 3D theo góc phối cảnh */}
                  <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-200"
                    style={{
                      background:
                        'linear-gradient(to bottom, rgba(30,10,2,0.1) 0%, transparent 45%, rgba(20,5,0,0.35) 100%)',
                      opacity: 0.7 + shadowAlpha,
                    }}
                  />

                  {/* Vân giấy Dó truyền thống mỏng tang */}
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#b45309_1.2px,transparent_1.2px)] [background-size:12px_12px] pointer-events-none" />

                  {/* Viền chỉ vàng dát mỏng tinh tế */}
                  <div className="absolute inset-1.5 border border-amber-900/40 rounded-[22px] pointer-events-none" />

                  {/* Góc họa tiết cổ truyền */}
                  <span className="absolute top-2.5 left-3.5 text-amber-950/70 font-serif text-[11px] select-none">❖</span>
                  <span className="absolute top-2.5 right-3.5 text-amber-950/70 font-serif text-[11px] select-none">❖</span>
                  <span className="absolute bottom-2.5 left-3.5 text-amber-950/70 font-serif text-[11px] select-none">❖</span>
                  <span className="absolute bottom-2.5 right-3.5 text-amber-950/70 font-serif text-[11px] select-none">❖</span>

                  {/* Header Tiêu Đề Mặt Lụa */}
                  <div className="text-center pt-1 z-10">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-950/20 text-amber-950 px-3 py-0.5 rounded-full border border-amber-900/35 shadow-xs font-serif">
                      ❖ {f.title} ❖
                    </span>
                  </div>

                  {/* ── NỘI DUNG TỪNG MẶT ── */}
                  {f.type === 'image' && (
                    <div className="flex-1 my-1.5 flex flex-col items-center justify-center z-10">
                      <div className="w-34 sm:w-38 h-34 sm:h-38 rounded-2xl overflow-hidden border-2 border-amber-900/70 shadow-xl bg-amber-950/40 p-1 relative group">
                        <img
                          src={f.image}
                          alt=""
                          className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 rounded-xl border border-yellow-300/40 pointer-events-none shadow-inner" />
                      </div>
                      <div className="text-center mt-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-950/25 border border-amber-900/35 text-[9.5px] font-black text-amber-950 font-serif">
                          {f.label}
                        </span>
                        <p className="text-[10px] font-bold text-amber-950 mt-0.5 font-serif truncate max-w-[190px]">
                          {f.subtext}
                        </p>
                      </div>
                    </div>
                  )}

                  {f.type === 'text' && (
                    <div className="flex-1 my-1.5 flex flex-col justify-center text-center p-3.5 bg-gradient-to-b from-amber-400/25 via-amber-200/20 to-amber-400/25 rounded-2xl border border-amber-900/35 shadow-inner relative z-10">
                      <p
                        className="text-xs sm:text-[13px] leading-relaxed font-serif text-amber-950 font-black whitespace-pre-line line-clamp-6"
                        style={{
                          fontFamily: config.fontFamily
                            ? `${config.fontFamily}, 'Be Vietnam Pro', serif`
                            : "'Be Vietnam Pro', serif",
                        }}
                      >
                        "{f.content}"
                      </p>
                      <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[9px] font-bold text-amber-900 font-serif">
                        <span>★</span>
                        <span>{f.tag}</span>
                        <span>★</span>
                      </div>
                    </div>
                  )}

                  {f.type === 'signature' && (
                    <div className="flex-1 my-1.5 flex flex-col justify-center items-center text-center space-y-1.5 p-2.5 bg-amber-400/15 rounded-2xl border border-amber-900/25 z-10">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-700 via-amber-850 to-amber-950 border border-yellow-300/80 flex items-center justify-center text-amber-100 shadow-md">
                        <Heart className="w-5 h-5 fill-rose-500 text-rose-300 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-amber-950 font-serif">
                          Gửi: {f.recipient}
                        </h4>
                        <p className="text-[10px] font-bold text-amber-900 mt-0.5 font-serif italic line-clamp-2">
                          {f.blessing}
                        </p>
                      </div>
                      <p className="text-xs font-black italic text-amber-950 font-serif pt-0.5">
                        — {f.sender} 🏮
                      </p>
                    </div>
                  )}

                  {/* Chân lụa */}
                  <div className="text-center pt-1 border-t border-amber-900/25 text-[8.5px] font-bold text-amber-950/80 font-mono tracking-wider z-10">
                    HOI AN SKY LANTERN • 20/10
                  </div>
                </div>
              );
            })}

            {/* ── 4. TUA RUA LỤA ĐUNG ĐƯA NHẸ NHÀNG DƯỚI ĐÁY ── */}
            <div
              className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center gap-12 pointer-events-none"
              style={{
                top: `${FACE_HEIGHT + 6}px`,
                transform: 'translateZ(0px)',
                transformStyle: 'preserve-3d',
              }}
            >
              <div className="flex flex-col items-center animate-[bounce_3s_infinite_ease-in-out]">
                <div className="w-0.5 h-6 bg-amber-300" />
                <div className="w-3 h-7 rounded-b-full bg-gradient-to-b from-red-600 to-yellow-400 shadow-sm" />
              </div>
              <div className="flex flex-col items-center -mt-1 animate-[bounce_2.5s_infinite_ease-in-out]">
                <div className="w-0.5 h-7 bg-amber-300" />
                <div className="w-3.5 h-9 rounded-b-full bg-gradient-to-b from-red-600 via-amber-500 to-yellow-300 shadow-md" />
              </div>
              <div className="flex flex-col items-center animate-[bounce_3.2s_infinite_ease-in-out]">
                <div className="w-0.5 h-6 bg-amber-300" />
                <div className="w-3 h-7 rounded-b-full bg-gradient-to-b from-red-600 to-yellow-400 shadow-sm" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ─── THANH ĐIỀU KHIỂN & CHỌN MẶT THANH THOÁT Ở ĐÁY (KHÔNG CHE KHUẤT) ─── */}
      <footer className="relative z-30 w-full max-w-md flex flex-col items-center gap-1.5 pb-1 px-1">
        {/* Nút Chọn Nhanh 4 Mặt */}
        <div className="flex items-center justify-center gap-1 w-full bg-black/45 backdrop-blur-xl p-1 rounded-2xl border border-white/10 shadow-lg">
          {faces.map((f, idx) => (
            <button
              key={f.id}
              onClick={() => handleSelectFace(idx)}
              className={`flex-1 py-1 px-1 rounded-xl text-[10.5px] sm:text-xs font-bold transition-all truncate text-center ${
                currentFace === idx
                  ? 'bg-amber-400 text-stone-950 font-black shadow-md scale-102'
                  : 'text-amber-200/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{f.icon} {f.shortTitle}</span>
            </button>
          ))}
        </div>

        {/* Cụm Nút Xoay Trái / Phải & Hướng Dẫn */}
        <div className="flex items-center justify-between w-full px-2 text-xs">
          <button
            onClick={handlePrevFace}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 border border-white/15 active:scale-95 transition-all shadow-sm"
            title="Xoay sang mặt trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-[10.5px] text-amber-200/70 font-medium">
            Mặt {currentFace + 1}/4 • Vuốt tay để xoay 360°
          </span>

          <button
            onClick={handleNextFace}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 border border-white/15 active:scale-95 transition-all shadow-sm"
            title="Xoay sang mặt tiếp theo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* ── MODAL NGUYỆN ƯỚC SAU KHI THẢ ĐÈN TRỜI ── */}
      <AnimatePresence>
        {isReleased && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: 1.8, duration: 0.7 }}
            className="absolute z-40 inset-x-3 sm:inset-x-6 max-w-sm mx-auto top-1/4 p-5 rounded-3xl bg-gradient-to-b from-[#241009]/95 via-[#1a0804]/95 to-black/95 border-2 border-amber-400/90 shadow-[0_25px_80px_rgba(249,115,22,0.55)] backdrop-blur-xl text-center space-y-3"
          >
            <div className="w-13 h-13 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-600/40 border border-amber-200">
              <Sparkles className="w-6 h-6 animate-spin" />
            </div>

            <div>
              <span className="text-[9.5px] font-black tracking-widest uppercase text-amber-300 bg-amber-950/70 px-3 py-0.5 rounded-full border border-amber-400/60 font-serif">
                ✦ NGUYỆN ƯỚC THÀNH HIỆN THỰC ✦
              </span>
              <h3 className="text-lg sm:text-xl font-black text-amber-100 font-serif mt-1.5">
                Đèn Trời Đã Thắp Sáng Ngân Hà ✨
              </h3>
              <p className="text-xs text-amber-200/90 font-serif italic mt-1 leading-relaxed">
                "Nguyện cầu {config.recipientName || 'người nhận'} vạn điều an lành, nụ cười rạng rỡ và hạnh phúc viên mãn trong ngày 20/10!"
              </p>
            </div>

            <div className="pt-1.5 flex items-center justify-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleResetLantern}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 text-xs font-bold border border-amber-400/40 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Thu lại đèn</span>
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
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all active:scale-95"
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
