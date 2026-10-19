import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Flame, Send, RotateCw, Heart, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
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

export default function LanternFestivalFX({ config }: Props) {
  // Góc quay 3D ban đầu nghiêng nhẹ (-20 độ Y, -8 độ X) để người dùng lập tức thấy chiều sâu 3D chân thực
  const [rotY, setRotY] = useState(-20);
  const [rotX, setRotX] = useState(-8);
  const [currentFace, setCurrentFace] = useState(0); // 0: Mặt 1, 1: Mặt 2, 2: Mặt 3, 3: Mặt 4
  const [isReleased, setIsReleased] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isAutoFloating, setIsAutoFloating] = useState(true);

  // Kéo xoay vật lý với quán tính mượt mà
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragStartRot = useRef({ y: -20, x: -8 });
  const lastPointer = useRef({ x: 0, time: 0 });
  const velocityY = useRef(0);
  const animFrameId = useRef<number | null>(null);

  // Canvas hạt tàn lửa bay bốc lên
  const emberCanvasRef = useRef<HTMLCanvasElement | null>(null);

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

  // ─── HỆ THỐNG HẠT TÀN LỬA (RISING GOLDEN EMBERS) ───
  useEffect(() => {
    const canvas = emberCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: Particle[] = [];
    const colors = ['#FEF08A', '#FDE047', '#FBBF24', '#F97316', '#EF4444'];

    const createParticle = (): Particle => {
      // Sinh hạt xung quanh chân đèn trời ở trung tâm
      const centerX = width / 2;
      const centerY = height * 0.65;
      return {
        x: centerX + (Math.random() - 0.5) * 160,
        y: centerY + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 0.9,
        vy: -(1.2 + Math.random() * 2.2), // Bốc lên trên
        size: 1.2 + Math.random() * 2.5,
        alpha: 0.7 + Math.random() * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        maxLife: 80 + Math.random() * 60,
        life: 0,
      };
    };

    for (let i = 0; i < 28; i++) {
      const p = createParticle();
      p.life = Math.random() * p.maxLife; // Khởi tạo rải rác
      particles.push(p);
    }

    let isRunning = true;
    const render = () => {
      if (!isRunning) return;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, idx) => {
        p.life++;
        p.x += p.vx + Math.sin(p.life * 0.05) * 0.4;
        p.y += p.vy;
        const progress = p.life / p.maxLife;
        const currentAlpha = p.alpha * Math.sin(progress * Math.PI);

        if (currentAlpha > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = currentAlpha;
          ctx.shadowBlur = 8;
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

  // ─── TƯƠNG TÁC KÉO XOAY 3D MƯỢT MÀ VỚI QUÁN TÍNH ───
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isReleased) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragStartRot.current = { y: rotY, x: rotX };
    lastPointer.current = { x: e.clientX, time: performance.now() };
    velocityY.current = 0;
    setIsAutoFloating(false);
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
    velocityY.current = (dx / dt) * 16; // Tốc độ góc (pixels/frame)
    lastPointer.current = { x: e.clientX, time: now };

    const newRotY = dragStartRot.current.y + deltaX * 0.65;
    // Khống chế góc nghiêng X tự nhiên giữa -24 độ và 14 độ
    const newRotX = Math.max(-24, Math.min(14, dragStartRot.current.x - deltaY * 0.22));

    setRotY(newRotY);
    setRotX(newRotX);

    // Tính mặt đang hướng về phía camera
    const normalizedY = ((-newRotY % 360) + 360) % 360;
    const faceIndex = Math.round(normalizedY / 90) % 4;
    setCurrentFace(faceIndex);
  };

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    // Hiệu ứng lướt quán tính êm ái khi thả tay
    let v = velocityY.current * 0.6;
    const applyInertia = () => {
      if (Math.abs(v) > 0.15 && !isDragging.current) {
        setRotY((prev) => {
          const next = prev + v;
          const normalizedY = ((-next % 360) + 360) % 360;
          setCurrentFace(Math.round(normalizedY / 90) % 4);
          return next;
        });
        v *= 0.92; // Ma sát không khí
        animFrameId.current = requestAnimationFrame(applyInertia);
      } else {
        setIsAutoFloating(true);
      }
    };
    animFrameId.current = requestAnimationFrame(applyInertia);
  }, []);

  // Xoay tới mặt cụ thể qua thanh điều hướng
  const handleSelectFace = (idx: number) => {
    soundFx.playPinClick();
    setHasInteracted(true);
    setCurrentFace(idx);
    setRotY(-idx * 90 - 15); // Góc nghiêng nghệ thuật
    setRotX(-8);
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
    setRotY(-20);
    setRotX(-8);
    setCurrentFace(0);
    setIsAutoFloating(true);
  };

  // Kích thước lồng đèn 3D Monolith
  const FACE_WIDTH = 250;
  const FACE_HEIGHT = 385;
  const RADIUS = 125; // Khoảng cách từ tâm đến các mặt (250 / 2)

  return (
    <div
      className="relative w-full h-full min-h-full bg-slate-950 overflow-y-auto sm:overflow-hidden select-none flex flex-col items-center justify-start sm:justify-center p-3 sm:p-5"
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ perspective: '1200px' }}
    >
      {/* ─── BẦU TRỜI ĐÊM HUYỀN ẢO HỘI AN ─── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#091124] to-[#1c0a06] pointer-events-none" />

      {/* Ánh trăng rằm vằng vặc rọi nhẹ từ góc cao */}
      <div className="absolute -top-12 -right-12 w-80 h-80 rounded-full bg-radial from-amber-200/20 via-yellow-500/5 to-transparent pointer-events-none blur-3xl" />

      {/* ─── DÒNG SÔNG HOÀI LUNG LINH PHẢN CHIẾU ÁNH ĐÈN ─── */}
      <div className="absolute bottom-0 inset-x-0 h-44 sm:h-56 pointer-events-none overflow-hidden">
        {/* Vầng sáng hoàng kim trên mặt nước */}
        <div className="absolute inset-0 bg-gradient-to-t from-orange-600/35 via-amber-950/25 to-transparent blur-2xl" />

        {/* Bóng đổ lồng đèn phản chiếu bập bùng trên sông */}
        <motion.div
          animate={{
            scaleX: [1, 1.15, 0.95, 1],
            opacity: [0.65, 0.85, 0.6, 0.65],
          }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-72 h-16 rounded-full bg-radial from-amber-400/50 via-orange-600/30 to-transparent blur-xl"
        />

        {/* Các gợn sóng lăn tăn nhịp nhàng */}
        {[0, 1, 2].map((idx) => (
          <motion.div
            key={`wave-${idx}`}
            className="absolute inset-x-0 border-b border-amber-300/15"
            style={{ bottom: `${16 + idx * 20}px` }}
            animate={{
              x: idx % 2 === 0 ? [-20, 20, -20] : [20, -20, 20],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 4 + idx * 1.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* ─── NGÀN VÌ SAO LẤP LÁNH BẦU TRỜI ĐÊM ─── */}
      {Array.from({ length: 32 }).map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute rounded-full pointer-events-none bg-amber-200"
          style={{
            left: `${2 + ((i * 19) % 96)}%`,
            top: `${3 + ((i * 29) % 75)}%`,
            width: `${1.5 + (i % 3) * 1.8}px`,
            height: `${1.5 + (i % 3) * 1.8}px`,
            boxShadow: '0 0 8px rgba(254,240,138,0.85)',
          }}
          animate={{
            opacity: [0.2, 0.9, 0.2],
            scale: [0.8, 1.35, 0.8],
          }}
          transition={{
            duration: 3 + (i % 4) * 1.5,
            repeat: Infinity,
            delay: (i % 5) * 0.35,
          }}
        />
      ))}

      {/* ─── ĐÈN HOA ĐĂNG XA XA TRÔI BỒNG BỀNH GÓC CHÂN TRỜI ─── */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={`distant-lantern-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${5 + ((i * 23) % 90)}%`,
            top: `${8 + ((i * 27) % 68)}%`,
            width: `${7 + (i % 3) * 3}px`,
            height: `${10 + (i % 3) * 4}px`,
            background: 'radial-gradient(circle at 50% 35%, #fffbeb 15%, #fde047 40%, #ea580c 80%, #9a3412 100%)',
            boxShadow: '0 0 12px rgba(249,115,22,0.7)',
          }}
          animate={{
            y: [-8, -45, -8],
            x: [0, i % 2 === 0 ? 12 : -12, 0],
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

      {/* ─── HÀNG CHỤC ĐÈN LỒNG BAY ĐỒNG HÀNH KHI BẤM THẢ ĐÈN ─── */}
      <AnimatePresence>
        {isReleased &&
          Array.from({ length: 9 }).map((_, i) => {
            const startX = 8 + i * 10.5;
            const sizeW = 22 + (i % 4) * 7;
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
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-yellow-200 blur-[1.5px] animate-pulse" />
                </div>
              </motion.div>
            );
          })}
      </AnimatePresence>

      {/* ─── KHUNG CANVAS HẠT TÀN LỬA BAY LƠ LỬNG ─── */}
      <canvas
        ref={emberCanvasRef}
        className="absolute inset-0 pointer-events-none z-15 w-full h-full"
      />

      {/* ─── CONTAINER CHỨA LỒNG ĐÈN 3D NGUYÊN KHỐI ─── */}
      <motion.div
        animate={
          isReleased
            ? {
                y: [0, -70, -220, -520, -950],
                x: [0, 30, -35, 25, 0],
                scale: [1, 0.94, 0.72, 0.45, 0.15],
                rotateZ: [0, -5, 5, -3, 1, 0],
                rotateY: [rotY, rotY + 720],
                rotateX: [rotX, rotX - 16],
                opacity: [1, 1, 0.95, 0.8, 0],
              }
            : {
                y: isAutoFloating ? [0, -14, 0] : 0,
                rotateZ: isAutoFloating ? [-1.2, 1.2, -1.2] : 0,
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
              }
        }
        className="relative z-20 flex flex-col items-center gap-2 w-full max-w-sm py-2"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* ── SÂN KHẤU 3D LỒNG ĐÈN TRỜI ── */}
        <div
          className="relative cursor-grab active:cursor-grabbing flex items-center justify-center my-3"
          style={{
            width: `${FACE_WIDTH}px`,
            height: `${FACE_HEIGHT}px`,
            transformStyle: 'preserve-3d',
            perspective: '1200px',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
        >
          {/* LÕI ÁNH SÁNG NỘI TẠI TỎA HÀO QUANG ĐA TẦNG TẠI TÂM (0,0,0) */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              transform: 'translateZ(0px)',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Vầng hào quang nội tại bập bùng tự nhiên */}
            <motion.div
              animate={{
                scale: [0.95, 1.08, 0.98, 1.04, 0.95],
                opacity: [0.75, 0.95, 0.8, 0.9, 0.75],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-56 h-56 rounded-full bg-radial from-amber-200/80 via-yellow-400/50 to-orange-600/35 blur-3xl pointer-events-none"
            />
          </div>

          {/* KHỐI QUAY 3D NGUYÊN KHỐI (MONOLITHIC PRISM ASSEMBLY) */}
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
            {/* ── 1. VÒM NẮP TRÊN 3D (DOMED BAMBOO CANOPY) ── */}
            <div
              className="absolute left-0 top-0 w-full rounded-3xl bg-gradient-to-br from-[#78350f] via-[#b45309] to-[#451a03] border-2 border-yellow-300/80 shadow-[0_10px_25px_rgba(0,0,0,0.6)] flex items-center justify-center pointer-events-none"
              style={{
                height: `${FACE_WIDTH}px`,
                transform: `rotateX(90deg) translateZ(${RADIUS}px)`,
                transformOrigin: 'top center',
              }}
            >
              {/* Núm đồng chóp đèn trời Hội An khắc hoa văn chữ Thọ */}
              <div className="w-36 h-36 rounded-full border-4 border-yellow-300/80 bg-gradient-to-br from-amber-950 via-yellow-900 to-amber-950 flex items-center justify-center shadow-inner relative">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-amber-300 flex items-center justify-center text-amber-200 text-xs font-serif font-bold shadow-md">
                  ❖ 20/10 ❖
                </div>
                {/* Vòng khoen đồng treo đèn */}
                <div className="absolute -top-3 w-6 h-6 rounded-full border-2 border-yellow-300/90 shadow-sm" />
              </div>
            </div>

            {/* ── 2. VÒNG ĐÁY & NGỌN LỬA 3D BẬP BÙNG CHÂN THỰC (BOTTOM FIRE HOOP) ── */}
            <div
              className="absolute left-0 bottom-0 w-full rounded-3xl bg-gradient-to-br from-[#451a03] via-[#78350f] to-[#451a03] border-2 border-yellow-400 shadow-[0_0_60px_rgba(249,115,22,0.95)] flex items-center justify-center pointer-events-none"
              style={{
                height: `${FACE_WIDTH}px`,
                transform: `rotateX(-90deg) translateZ(${FACE_HEIGHT - RADIUS}px)`,
                transformOrigin: 'bottom center',
              }}
            >
              {/* Miệng đáy lồng đèn thông gió rực lửa */}
              <div className="relative w-40 h-40 rounded-full border-4 border-yellow-400 bg-black/75 shadow-inner flex items-center justify-center">
                {/* Thanh nan chéo kim loại chữ thập (+) giữ khối sáp */}
                <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-0.5 bg-yellow-200/90 shadow-sm" />
                <div className="absolute inset-y-2 left-1/2 -translate-x-1/2 w-0.5 bg-yellow-200/90 shadow-sm" />

                {/* Khối sáp đốt lửa và ngọn lửa nhảy múa */}
                <div className="w-10 h-10 rounded-md bg-amber-950 border border-yellow-300 flex items-center justify-center shadow-2xl relative z-10">
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
                    <Flame className="w-8 h-8 fill-amber-300 text-yellow-100 drop-shadow-[0_0_16px_rgba(251,191,36,1)]" />
                  </motion.div>
                </div>
              </div>
            </div>

            {/* ── 3. BỐN MẶT GIẤY LỤA CONG 3D NGUYÊN KHỐI (4 CURVED 3D FACES) ── */}
            {faces.map((f, idx) => {
              const faceAngle = idx * 90; // 0, 90, 180, 270 độ
              // Tính toán góc chiếu sáng so với góc xoay hiện tại để tạo bóng đổ 3D chân thực
              const relativeAngle = ((rotY + faceAngle) % 360 + 360) % 360;
              const isFrontFacing = relativeAngle < 90 || relativeAngle > 270;
              const shadowAlpha = isFrontFacing
                ? Math.abs(relativeAngle > 180 ? relativeAngle - 360 : relativeAngle) / 90 * 0.35
                : 0.55;

              return (
                <div
                  key={f.id}
                  className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between overflow-hidden transition-all duration-150"
                  style={{
                    transform: `rotateY(${faceAngle}deg) translateZ(${RADIUS}px)`,
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'visible',
                    // Dáng đèn trời phồng cong bầu dục mềm mại (Barrel Curvature)
                    clipPath:
                      'polygon(7% 0%, 93% 0%, 100% 22%, 97% 85%, 88% 100%, 12% 100%, 3% 85%, 0% 22%)',
                    background:
                      'radial-gradient(ellipse at 50% 60%, rgba(255, 252, 235, 0.98) 0%, rgba(254, 240, 138, 0.95) 26%, rgba(251, 146, 60, 0.92) 68%, rgba(180, 55, 10, 0.96) 100%)',
                    boxShadow:
                      '0 0 60px rgba(249,115,22,0.7), inset 0 0 45px rgba(254,240,138,0.6)',
                  }}
                >
                  {/* Lớp bóng đổ 3D phụ thuộc vào góc quay so với nguồn sáng */}
                  <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-200"
                    style={{
                      background:
                        'linear-gradient(to bottom, rgba(30,10,2,0.15) 0%, transparent 40%, rgba(20,5,0,0.4) 100%)',
                      opacity: 0.8 + shadowAlpha,
                    }}
                  />

                  {/* Vân giấy Dó truyền thống mỏng tang xuyên sáng */}
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#b45309_1.2px,transparent_1.2px)] [background-size:12px_12px] pointer-events-none" />

                  {/* Khung nan tre uốn cong mạ vàng nổi khối 3D */}
                  <div className="absolute inset-1.5 border-2 border-amber-900/60 rounded-2xl pointer-events-none shadow-sm" />

                  {/* Họa tiết hoa văn góc đồng cổ */}
                  <span className="absolute top-3 left-4 text-amber-950 font-serif text-xs select-none">❖</span>
                  <span className="absolute top-3 right-4 text-amber-950 font-serif text-xs select-none">❖</span>
                  <span className="absolute bottom-3 left-4 text-amber-950 font-serif text-xs select-none">❖</span>
                  <span className="absolute bottom-3 right-4 text-amber-950 font-serif text-xs select-none">❖</span>

                  {/* Header Tiêu Đề Mặt Đèn Trời */}
                  <div className="text-center pt-2 z-10">
                    <span className="text-[10.5px] font-black uppercase tracking-widest bg-amber-950/30 text-amber-950 px-3.5 py-0.5 rounded-full border border-amber-900/50 shadow-sm backdrop-blur-xs font-serif">
                      ❖ {f.title} ❖
                    </span>
                  </div>

                  {/* ── NỘI DUNG TỪNG MẶT ── */}
                  {f.type === 'image' && (
                    <div className="flex-1 my-2 flex flex-col items-center justify-center z-10">
                      <div className="w-40 sm:w-44 h-40 sm:h-44 rounded-2xl overflow-hidden border-2 border-amber-900/85 shadow-2xl bg-amber-950/50 p-1 relative group">
                        <img
                          src={f.image}
                          alt=""
                          className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                        />
                        {/* Viền ánh sáng ấm lồng ảnh */}
                        <div className="absolute inset-0 rounded-xl border border-yellow-300/40 pointer-events-none shadow-inner" />
                      </div>
                      <div className="text-center mt-2">
                        <span className="px-3 py-0.5 rounded-full bg-amber-950/35 border border-amber-900/45 text-[10px] font-black text-amber-950 font-serif">
                          {f.label}
                        </span>
                        <p className="text-[10.5px] font-bold text-amber-950 mt-0.5 font-serif">
                          {f.subtext}
                        </p>
                      </div>
                    </div>
                  )}

                  {f.type === 'text' && (
                    <div className="flex-1 my-2 flex flex-col justify-center text-center p-4 bg-gradient-to-b from-amber-400/30 via-amber-200/25 to-amber-400/30 rounded-2xl border-2 border-amber-900/45 shadow-inner relative z-10">
                      <p
                        className="text-xs sm:text-sm leading-relaxed font-serif text-amber-950 font-black whitespace-pre-line"
                        style={{
                          fontFamily: config.fontFamily
                            ? `${config.fontFamily}, 'Be Vietnam Pro', serif`
                            : "'Be Vietnam Pro', serif",
                        }}
                      >
                        "{f.content}"
                      </p>
                      <div className="mt-3 flex items-center justify-center gap-1.5 text-[9.5px] font-bold text-amber-900 font-serif">
                        <span>★</span>
                        <span>{f.tag}</span>
                        <span>★</span>
                      </div>
                    </div>
                  )}

                  {f.type === 'signature' && (
                    <div className="flex-1 my-2 flex flex-col justify-center items-center text-center space-y-2 p-3 bg-amber-400/20 rounded-2xl border border-amber-900/35 z-10">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-700 via-amber-850 to-amber-950 border-2 border-yellow-300/80 flex items-center justify-center text-amber-100 shadow-lg">
                        <Heart className="w-7 h-7 fill-rose-500 text-rose-300 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-black text-amber-950 font-serif">
                          Gửi: {f.recipient}
                        </h4>
                        <p className="text-[10.5px] font-bold text-amber-900 mt-0.5 font-serif italic">
                          {f.blessing}
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm font-black italic text-amber-950 font-serif pt-1">
                        — {f.sender} 🏮
                      </p>
                    </div>
                  )}

                  {/* Dòng chữ nẹp đáy lụa */}
                  <div className="text-center pt-1.5 border-t border-amber-900/35 text-[9px] font-bold text-amber-950/85 font-mono tracking-wider z-10">
                    HOI AN SKY LANTERN • 20/10
                  </div>
                </div>
              );
            })}

            {/* ── 4. TUA RUA LỤA NGŨ SẮC ĐUNG ĐƯA DƯỚI ĐÁY 3D (3D HANGING SILK TASSELS) ── */}
            <div
              className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center gap-14 pointer-events-none"
              style={{
                top: `${FACE_HEIGHT + 8}px`,
                transform: 'translateZ(0px)',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Tua rua trái */}
              <div className="flex flex-col items-center animate-[bounce_3s_infinite_ease-in-out]">
                <div className="w-0.5 h-7 bg-amber-300" />
                <div className="w-3.5 h-8 rounded-b-full bg-gradient-to-b from-red-600 via-rose-500 to-yellow-400 shadow-md" />
              </div>

              {/* Tua rua chính giữa dài hơn với chuông vàng */}
              <div className="flex flex-col items-center -mt-1 animate-[bounce_2.5s_infinite_ease-in-out]">
                <div className="w-1 h-8 bg-amber-300" />
                <div className="w-4 h-10 rounded-b-full bg-gradient-to-b from-red-600 via-amber-500 to-yellow-300 shadow-xl" />
              </div>

              {/* Tua rua phải */}
              <div className="flex flex-col items-center animate-[bounce_3.2s_infinite_ease-in-out]">
                <div className="w-0.5 h-7 bg-amber-300" />
                <div className="w-3.5 h-8 rounded-b-full bg-gradient-to-b from-red-600 via-rose-500 to-yellow-400 shadow-md" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── BỘ ĐIỀU HƯỚNG 4 MẶT 3D NHANH CHÓNG ── */}
        <div className="flex items-center justify-center gap-1.5 mt-8 z-30 flex-wrap px-2">
          {faces.map((f, idx) => (
            <button
              key={f.id}
              onClick={() => handleSelectFace(idx)}
              className={`px-3 py-1 rounded-full text-[10.5px] sm:text-xs font-bold transition-all border ${
                currentFace === idx
                  ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-lg scale-105'
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

        {/* ── THANH ĐIỀU KHIỂN HÀNH ĐỘNG ── */}
        <div className="flex items-center gap-2 mt-2 z-30 flex-wrap justify-center">
          <button
            onClick={handlePrevFace}
            className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold transition-all shadow-md active:scale-95"
            title="Xoay sang trái"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleNextFace}
            className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
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
          <p className="text-[11px] text-amber-200/80 animate-pulse text-center font-medium mt-1">
            💡 Dùng ngón tay hoặc chuột vuốt ngang để xoay lồng đèn 3D 360° ngắm trọn vẹn 4 mặt
          </p>
        )}
      </motion.div>

      {/* ── THÔNG BÁO CHÚC PHÚC SAU KHI THẢ ĐÈN LÊN TRỜI ── */}
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

            <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
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
